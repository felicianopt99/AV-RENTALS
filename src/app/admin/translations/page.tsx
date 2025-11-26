"use client";

import React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, Edit, Trash2, Plus, Save, X, RefreshCw, Database, Languages, FileText, 
  Download, Upload, Filter, Star, Clock, CheckCircle, AlertTriangle, 
  BarChart3, Settings, History, Tag, Users, Calendar, TrendingUp,
  Eye, ThumbsUp, ThumbsDown, MessageSquare, Copy, ExternalLink, Package
} from 'lucide-react';
import { TranslationAnalytics } from '@/components/admin/TranslationAnalytics';
import PdfTranslationManager from './pdf-translation';

interface Translation {
  id: string;
  sourceText: string;
  translatedText: string;
  targetLang: string;
  status: string;
  qualityScore: number;
  reviewedBy?: string;
  reviewedAt?: string;
  context?: string;
  tags: string[];
  category: string;
  usageCount: number;
  lastUsed?: string;
  isAutoTranslated: boolean;
  needsReview: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface TranslationStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  averageQuality: number;
  needsReview: number;
  autoTranslated: number;
  totalUsage: number;
}

const TRANSLATION_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'navigation', label: 'Navigation & Menu' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'inventory', label: 'Inventory & Equipment' },
  { value: 'categories', label: 'Categories & Subcategories' },
  { value: 'clients', label: 'Client Management' },
  { value: 'events', label: 'Events & Calendar' },
  { value: 'rentals', label: 'Rentals & Bookings' },
  { value: 'quotes', label: 'Quotes & Services' },
  { value: 'maintenance', label: 'Maintenance & Repairs' },
  { value: 'users', label: 'User Management' },
  { value: 'admin', label: 'Admin & Settings' },
  { value: 'forms', label: 'Forms & Input' },
  { value: 'buttons', label: 'Buttons & Actions' },
  { value: 'messages', label: 'Messages & Notifications' },
  { value: 'errors', label: 'Error Messages' },
  { value: 'email', label: 'Email Templates' },
  { value: 'reports', label: 'Reports & Analytics' },
];

const TRANSLATION_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'pending_review', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
];

// Helper functions
const getStatusBadge = (status: string) => {
  const statusConfig = TRANSLATION_STATUSES.find(s => s.value === status) || TRANSLATION_STATUSES[2];
  return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>;
};

const getQualityBadge = (score: number) => {
  const getColor = (s: number) => {
    if (s >= 90) return 'bg-green-100 text-green-800';
    if (s >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  return <Badge className={getColor(score)}>{score}%</Badge>;
};

export default function AdminTranslationsPage() {
  // Core data state

  // Core data state
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [stats, setStats] = useState<TranslationStats>({
    total: 0,
    byStatus: {},
    byCategory: {},
    averageQuality: 0,
    needsReview: 0,
    autoTranslated: 0,
    totalUsage: 0,
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTab, setSelectedTab] = useState('list');
  const [listTargetLang, setListTargetLang] = useState('pt');
  // Column filters
  const [sourceFilter, setSourceFilter] = useState('');
  const [translationFilter, setTranslationFilter] = useState('');
  const [statusColFilter, setStatusColFilter] = useState<string>('');
  const [categoryColFilter, setCategoryColFilter] = useState<string>('');
  // Column sizing
  const [sourceColWidth, setSourceColWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 260;
    const v = Number(localStorage.getItem('adminTranslations.sourceColWidth') || '260');
    return Number.isFinite(v) && v > 120 ? v : 260;
  });
  const [transColWidth, setTransColWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 260;
    const v = Number(localStorage.getItem('adminTranslations.transColWidth') || '260');
    return Number.isFinite(v) && v > 120 ? v : 260;
  });
  const resizingRef = useRef<null | { col: 'source' | 'trans'; startX: number; startW: number }>(null);
  const scrollParentRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const r = resizingRef.current; if (!r) return;
      const delta = e.clientX - r.startX;
      const w = Math.max(160, Math.min(800, r.startW + delta));
      if (r.col === 'source') setSourceColWidth(w); else setTransColWidth(w);
    };
    const onUp = () => { resizingRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // Dialog states (declared early to satisfy hooks order for effects below)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedTranslationId, setSelectedTranslationId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);


  // Translation Rules state
  const [rules, setRules] = useState<string>('');
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [rulesEdit, setRulesEdit] = useState('');
  const [rulesEditOpen, setRulesEditOpen] = useState(false);
  const [rulesMode, setRulesMode] = useState<'simple' | 'advanced'>('simple');
  const [ruleRows, setRuleRows] = useState<Array<{ source: string; translation: string }>>([]);
  const [rulesValidationError, setRulesValidationError] = useState<string | null>(null);

  const { toast } = useToast();


  // ...existing code...

  // Notify all tabs/clients that translations were updated (clears client caches)
  const signalTranslationsUpdated = () => {
    try {
      localStorage.setItem('translations-updated', String(Date.now()));
      // Fire a synthetic storage event so same-tab listeners clear immediately
      try {
        // Some environments may not allow direct StorageEvent construction
        const evt = new StorageEvent('storage', { key: 'translations-updated' } as any);
        window.dispatchEvent(evt);
      } catch {}
    } catch {}
  };

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Coverage state
  const [coverage, setCoverage] = useState<{ missingCount: number; extractedCount: number; sampleMissing: string[]; total?: number; pages?: number; groups?: Record<string, number> }>({
    missingCount: 0,
    extractedCount: 0,
    sampleMissing: [],
  });
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [selectedMissing, setSelectedMissing] = useState<Set<string>>(new Set());
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [coveragePage, setCoveragePage] = useState<number>(1);
  const [coveragePages, setCoveragePages] = useState<number>(1);
  const [coverageSearch, setCoverageSearch] = useState<string>('');
  const [coverageTargetLang, setCoverageTargetLang] = useState('pt');

  const fetchCoverage = async () => {
    try {
      setCoverageLoading(true);
      const params = new URLSearchParams({
        page: String(coveragePage),
        limit: '100',
        group: groupFilter,
        search: coverageSearch,
        targetLang: coverageTargetLang,
      });
      const res = await fetch(`/api/admin/translation-coverage?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch coverage');
      const data = await res.json();
      setCoverage({
        missingCount: data.missingCount || 0,
        extractedCount: data.extractedCount || 0,
        sampleMissing: data.items || data.sampleMissing || [],
        total: data.total || 0,
        pages: data.pages || 1,
        groups: data.groups || {},
      });
      setCoveragePages(data.pages || 1);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load coverage', variant: 'destructive' });
    } finally {
      setCoverageLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTab === 'coverage') {
      fetchCoverage();
    }
  }, [selectedTab, groupFilter, coveragePage, coverageSearch, coverageTargetLang]);

  const handleSelectMissing = (text: string, checked: boolean) => {
    const next = new Set(selectedMissing);
    if (checked) next.add(text); else next.delete(text);
    setSelectedMissing(next);
  };

  const handleSelectAllMissing = (checked: boolean) => {
    if (checked) setSelectedMissing(new Set(coverage.sampleMissing)); else setSelectedMissing(new Set());
  };

  const handleSeedSelected = async () => {
    const texts = Array.from(selectedMissing);
    if (texts.length === 0) {
      toast({ title: 'Nothing selected', description: 'Select at least one string to seed.' });
      return;
    }
    try {
      const res = await fetch('/api/admin/translations/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts, targetLang: listTargetLang }),
      });
      if (!res.ok) throw new Error('Failed to seed translations');
      const data = await res.json();
      toast({ title: 'Seeded', description: `Created ${data.created} translation(s).` });
      setSelectedMissing(new Set());
      signalTranslationsUpdated();
      // Refresh lists
      fetchTranslations(currentPage);
      fetchCoverage();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to seed translations', variant: 'destructive' });
    }
  };

  const handleSeedTopCritical = async () => {
    try {
      setCoverageLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        group: groupFilter,
        search: coverageSearch,
        onlyCritical: 'true',
      });
      const res = await fetch(`/api/admin/translation-coverage?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load critical texts');
      const data = await res.json();
      const texts: string[] = data.topCritical || data.items || [];
      if (!texts.length) {
        toast({ title: 'No critical items', description: 'No critical strings available to seed.' });
        return;
      }
      const seedRes = await fetch('/api/admin/translations/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts, targetLang: listTargetLang }),
      });
      if (!seedRes.ok) throw new Error('Failed to seed translations');
      const out = await seedRes.json();
      toast({ title: 'Seeded', description: `Created ${out.created} translation(s).` });
      signalTranslationsUpdated();
      fetchTranslations(currentPage);
      fetchCoverage();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to seed critical translations', variant: 'destructive' });
    } finally {
      setCoverageLoading(false);
    }
  };

  // Fetch translations from API
  const fetchTranslations = async (page: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
        search: searchTerm || '',
        targetLang: listTargetLang,
        status: selectedStatus,
        category: selectedCategory,
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/admin/translations?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch translations');
      const data = await res.json();

      setTranslations(data.translations || []);
      setStats(data.stats || stats);
      setTotalPages(data.pagination?.pages || 1);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load translations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranslations(currentPage);
  }, [currentPage, listTargetLang]);

  useEffect(() => {
    const run = async () => {
      if (!isHistoryDialogOpen || !selectedTranslationId) return;
      try {
        setHistoryLoading(true);
        const res = await fetch(`/api/admin/translations/${selectedTranslationId}/history`);
        if (!res.ok) throw new Error('Failed to load history');
        const data = await res.json();
        setHistory(data.history || []);
      } catch (e) {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    run();
  }, [isHistoryDialogOpen, selectedTranslationId]);

  // Auto-refresh search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchTranslations(1);
      } else {
        setCurrentPage(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedStatus, selectedCategory, sortBy, sortOrder]);

  // Fetch translation rules from API
  const fetchRules = async () => {
    setRulesLoading(true);
    setRulesError(null);
    try {
      const res = await fetch('/api/admin/translation-rules');
      if (!res.ok) throw new Error('Failed to fetch rules');
      const data = await res.text();
      setRules(data);
      setRulesEdit(data);
    } catch (e: any) {
      setRulesError(e.message);
    } finally {
      setRulesLoading(false);
    }
  };

  // Save translation rules to API
  const saveRules = async () => {
    setRulesLoading(true);
    setRulesError(null);
    try {
      // Ensure rulesEdit reflects the current mode
      let bodyToSend = rulesEdit;
      if (rulesMode === 'simple') {
        const obj: Record<string, string> = {};
        for (const r of ruleRows) {
          if (!r.source) continue;
          obj[r.source] = r.translation ?? '';
        }
        bodyToSend = JSON.stringify(obj, null, 2);
        setRulesEdit(bodyToSend);
      }

      const res = await fetch('/api/admin/translation-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: bodyToSend,
      });
      if (!res.ok) throw new Error('Failed to save rules');
      setRules(bodyToSend);
      setRulesEditOpen(false);
      toast({ title: 'Success', description: 'Translation rules updated.' });
      signalTranslationsUpdated();
    } catch (e: any) {
      setRulesError(e.message);
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setRulesLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Keep ruleRows in sync with rulesEdit when switching modes or when rules are fetched
  useEffect(() => {
    try {
      const obj = JSON.parse(rulesEdit || rules || '{}') as Record<string, string>;
      const rows = Object.entries(obj).map(([source, translation]) => ({ source, translation }));
      setRuleRows(rows);
      setRulesValidationError(null);
    } catch (err: any) {
      // If JSON invalid, surface error in advanced mode; simple mode will show empty rows
      setRulesValidationError('Invalid JSON detected. Fix in Advanced mode or switch to Simple and Save to normalize.');
    }
  }, [rulesEdit, rules]);
  
  
  
  // Bulk operations
  const [selectedTranslations, setSelectedTranslations] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Translation>>({});
  const [editingField, setEditingField] = useState<'translatedText' | null>(null);
  const undoTimerRef = useRef<any>(null);
  const [undoState, setUndoState] = useState<null | { id: string; field: 'translatedText'; prev: any }>(null);
  
  // Dialog states moved above
  
  // Create form state
  const [newTranslation, setNewTranslation] = useState({
    sourceText: '',
    translatedText: '',
    category: 'general',
    context: '',
    tags: [] as string[],
  });

  // Computed values
  const filteredTranslations = useMemo(() => {
    let filtered = [...translations];
    // Apply filters
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((t) =>
        t.sourceText.toLowerCase().includes(search) ||
        t.translatedText.toLowerCase().includes(search) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(search)))
      );
    }
    if (sourceFilter) {
      const s = sourceFilter.toLowerCase();
      filtered = filtered.filter((t) => t.sourceText.toLowerCase().includes(s));
    }
    if (translationFilter) {
      const s = translationFilter.toLowerCase();
      filtered = filtered.filter((t) => t.translatedText.toLowerCase().includes(s));
    }
    if (statusColFilter) {
      filtered = filtered.filter((t) => (t.status || 'approved') === statusColFilter);
    }
    if (categoryColFilter) {
      filtered = filtered.filter((t) => (t.category || 'general') === categoryColFilter);
    }
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((t) => (t.status || 'approved') === selectedStatus);
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => (t.category || 'general') === selectedCategory);
    }
    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof Translation];
      const bVal = b[sortBy as keyof Translation];
      const direction = sortOrder === 'asc' ? 1 : -1;

    <Tabs value={selectedTab} onValueChange={setSelectedTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="coverage">Coverage</TabsTrigger>
      </TabsList>

      <TabsContent value="analytics">
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Overview of translation coverage and quality</CardDescription>
          </CardHeader>
          <CardContent>
            <TranslationAnalytics stats={stats} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="coverage">
        <Card>
          <CardHeader>
            <CardTitle>Translation Coverage</CardTitle>
            <CardDescription>Extracted vs missing UI strings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                aria-label="Scan UI Texts"
                onClick={async () => {
                  try {
                    setCoverageLoading(true);
                    const res = await fetch('/api/admin/translation-coverage', { method: 'POST' });
                    if (!res.ok) throw new Error('Failed to scan UI texts');
                    await fetchCoverage();
                    toast({ title: 'Scanned', description: 'UI texts extracted and coverage updated.' });
                  } catch (e: any) {
                    toast({ title: 'Error', description: e.message || 'Scan failed', variant: 'destructive' });
                  } finally {
                    setCoverageLoading(false);
                  }
                }}
                disabled={coverageLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Scan UI Texts
              </Button>
              <Button
                aria-label="Refresh coverage"
                variant="outline"
                onClick={fetchCoverage}
                disabled={coverageLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
              <Button
                aria-label="Seed selected missing translations"
                onClick={handleSeedSelected}
                disabled={selectedMissing.size === 0 || coverageLoading}
              >
                <Plus className="h-4 w-4 mr-2" /> Seed Selected
              </Button>
            </div>
                Missing strings detected from reports. Select and seed to make them appear in the list.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col">
                  <Label className="text-xs">Target language</Label>
                  <Select value={coverageTargetLang} onValueChange={setCoverageTargetLang}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[220px]">
                  <Label htmlFor="search" className="text-sm">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
                    <Input
                      aria-label="Search coverage"
                      id="search"
                      value={coverageSearch}
                      onChange={(e) => setCoverageSearch(e.target.value)}
                      placeholder="Filter text..."
                      className="pl-10 h-10 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="ml-auto flex gap-2">
                  <Button
                    aria-label="Scan UI Texts"
                    variant="default"
                    size="sm"
                    onClick={handleScanCoverage}
                    disabled={coverageLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Scan UI Texts
                  </Button>
                  <Button
                    aria-label="Seed Top Critical"
                    variant="outline"
                    size="sm"
                    onClick={handleSeedTopCritical}
                  >
                    <Star className="h-4 w-4 mr-2" /> Seed Top Critical
                  </Button>
                  <Button
                    aria-label="Refresh coverage"
                    variant="outline"
                    size="sm"
                    onClick={fetchCoverage}
                    disabled={coverageLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <div className="flex flex-col">
                  <Label className="text-xs">Group</Label>
                  <Select value={groupFilter} onValueChange={setGroupFilter}>
                    <SelectTrigger id="coverage-group" className="w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="clients">Clients</SelectItem>
                      <SelectItem value="events">Events</SelectItem>
                      <SelectItem value="quotes">Quotes</SelectItem>
                      <SelectItem value="rentals">Rentals</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="users">Users</SelectItem>
                      <SelectItem value="categories">Categories</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="coverage-search" className="text-sm">Search</Label>
                  <Input
                    aria-label="Filter by source text"
                    id="coverage-search"
                    value={coverageSearch}
                    onChange={(e) => setCoverageSearch(e.target.value)}
                    placeholder="Filter text..."
                    className="w-[260px]"
                  />
                </div>

                <div className="ml-auto flex gap-2">
                  <Button
                    aria-label="Scan UI Texts"
                    variant="default"
                    size="sm"
                    onClick={handleScanCoverage}
                    disabled={coverageLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Scan UI Texts
                  </Button>
                  <Button
                    aria-label="Seed Top Critical"
                    variant="outline"
                    size="sm"
                    onClick={handleSeedTopCritical}
                  >
                    <Star className="h-4 w-4 mr-2" /> Seed Top Critical
                  </Button>
                  <Button
                    aria-label="Refresh coverage"
                    variant="outline"
                    size="sm"
                    onClick={fetchCoverage}
                    disabled={coverageLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <div className="flex flex-col">
                  <Label className="text-xs">Target language</Label>
                  <Select value={coverageTargetLang} onValueChange={setCoverageTargetLang}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <Badge variant="secondary">Missing: {coverage.missingCount}</Badge>
                <Badge variant="secondary">Extracted: {coverage.extractedCount}</Badge>
                {coverage.groups && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(coverage.groups).map(([g, c]) => (
                      <Badge key={g} variant={g === groupFilter ? 'default' : 'secondary'} className="capitalize">
                        {g}: {c}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  aria-label="Select all missing translations"
                  id="select-all-missing"
                  onCheckedChange={(v) => handleSelectAllMissing(!!v)}
                />
                <Label htmlFor="select-all-missing">Select all shown ({coverage.sampleMissing.length})</Label>
                <Button
                  aria-label="Clear selected missing translations"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMissing(new Set())}
                >Clear</Button>
                <div className="ml-auto flex gap-2">
                  <Button
                    aria-label="Seed selected missing translations"
                    size="sm"
                    onClick={handleSeedSelected}
                    disabled={selectedMissing.size === 0 || coverageLoading}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Seed Selected
                  </Button>
                  <Button
                    aria-label="Refresh coverage"
                    variant="outline"
                    size="sm"
                    onClick={fetchCoverage}
                    disabled={coverageLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                  </Button>
                </div>
              </div>

              {coverageLoading ? (
                <div>Loading coverage…</div>
              ) : coverage.sampleMissing.length === 0 ? (
                <div className="text-sm text-muted-foreground">No missing strings to display.</div>
              ) : (
                <div className="max-h-[420px] overflow-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Source Text</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coverage.sampleMissing.map((text) => (
                        <TableRow key={text}>
                          <TableCell className="w-10">
                            <Checkbox
                              aria-label={`Select ${text}`}
                              checked={selectedMissing.has(text)}
                              onCheckedChange={(v) => handleSelectMissing(text, !!v)}
                            />
                          </TableCell>
                          <TableCell className="text-sm whitespace-pre-wrap">{text}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Page {coveragePage} of {coveragePages} — Showing {coverage.sampleMissing.length} items
                </div>
                <div className="flex gap-2">
                  <Button
                    aria-label="Previous page"
                    variant="outline"
                    size="sm"
                    disabled={coveragePage <= 1 || coverageLoading}
                    onClick={() => setCoveragePage((p) => Math.max(1, p - 1))}
                  >Prev</Button>
                  <Button
                    aria-label="Next page"
                    variant="outline"
                    size="sm"
                    disabled={coveragePage >= coveragePages || coverageLoading}
                    onClick={() => setCoveragePage((p) => Math.min(coveragePages, p + 1))}
                  >Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <TranslationAnalytics stats={stats} />
        </TabsContent>

        <TabsContent value="observability">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Translation Stats</CardTitle>
                <CardDescription>Real-time stats from admin API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>Total: {stats.total}</div>
                <div>Needs Review: {stats.needsReview}</div>
                <div>Auto-translated: {stats.autoTranslated}</div>
                <div>Average Quality: {stats.averageQuality}%</div>
                <div>Total Usage: {stats.totalUsage}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Coverage</CardTitle>
                <CardDescription>Extracted vs Missing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>Extracted: {coverage.extractedCount}</div>
                <div>Missing: {coverage.missingCount}</div>
                <div className="flex gap-2">
                  <Button
                    aria-label="Refresh coverage in observability"
                    size="sm"
                    variant="outline"
                    onClick={fetchCoverage}
                    disabled={coverageLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>DeepL & Cache Metrics</CardTitle>
                <CardDescription>Coming soon</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div>DeepL requests/retries/latency: not instrumented</div>
                <div>LRU cache hit rate/size: not instrumented</div>
                <div>
                  I can add lightweight counters and an admin metrics API to surface these.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Translation Settings</CardTitle>
              <CardDescription>
                Configure translation workflows and quality controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quality Controls</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-approve">Auto-approve high quality translations</Label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">≥95%</span>
                        <input type="checkbox" id="auto-approve" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="review-threshold">Flag for review below</Label>
                      <div className="flex items-center space-x-2">
                        <input 
                          aria-label="Review threshold"
                          type="number" 
                          id="review-threshold" 
                          className="w-16 px-2 py-1 border rounded text-center"
                          defaultValue="70"
                          min="0"
                          max="100"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Automation</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-translate">Enable auto-translation</Label>
                      <input type="checkbox" id="auto-translate" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="batch-processing">Enable batch processing</Label>
                      <input type="checkbox" id="batch-processing" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Export Options</h3>
                <div className="flex gap-2">
                  <Button
                    aria-label="Export JSON"
                    variant="outline"
                    onClick={() => handleExport()}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button
                    aria-label="Export CSV"
                    variant="outline"
                    onClick={() => window.open('/api/admin/translations/export?format=csv', '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    aria-label="Export Key-Value"
                    variant="outline"
                    onClick={() => window.open('/api/admin/translations/export?format=keyvalue', '_blank')}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Export Key-Value
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="pdf">PDF</TabsTrigger>
          <TabsTrigger value="observability">Observability</TabsTrigger>
        </TabsList>
      </TableHeader>
                  <TableBody>
                    {history.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>{h.version}</TableCell>
                        <TableCell>{h.changedBy || '—'}</TableCell>
                        <TableCell>{h.createdAt ? new Date(h.createdAt).toLocaleString() : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Separator className="my-4" />
                <div className="space-y-4">
                  {history.map((h) => (
                    <div key={`diff-${h.id}`} className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Old</Label>
                        <Textarea readOnly value={h.oldTranslatedText} rows={4} />
                      </div>
                      <div>
                        <Label className="text-xs">New</Label>
                        <Textarea readOnly value={h.newTranslatedText} rows={4} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    
  );
*/
}