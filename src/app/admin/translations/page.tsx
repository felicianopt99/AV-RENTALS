"use client";

import React from 'react';
import { useState, useEffect, useMemo } from 'react';
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
  const getColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
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

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch translations from API
  const fetchTranslations = async (page: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
        search: searchTerm || '',
        targetLang: 'pt',
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
  }, [currentPage]);

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
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedTranslationId, setSelectedTranslationId] = useState<string | null>(null);
  
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
      filtered = filtered.filter(t => 
        t.sourceText.toLowerCase().includes(search) ||
        t.translatedText.toLowerCase().includes(search) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(search)))
      );
    }
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(t => (t.status || 'approved') === selectedStatus);
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => (t.category || 'general') === selectedCategory);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof Translation];
      const bVal = b[sortBy as keyof Translation];
      const direction = sortOrder === 'asc' ? 1 : -1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * direction;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * direction;
      }
      return 0;
    });
    
    return filtered;
  }, [translations, searchTerm, selectedStatus, selectedCategory, sortBy, sortOrder]);

  const handleSelectTranslation = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedTranslations);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedTranslations(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTranslations(new Set(filteredTranslations.map(t => t.id)));
    } else {
      setSelectedTranslations(new Set());
    }
    setShowBulkActions(checked && filteredTranslations.length > 0);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this translation?')) return;

    try {
      const response = await fetch(`/api/admin/translations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTranslations(prev => prev.filter(t => t.id !== id));
        setStats(prev => ({ ...prev, total: prev.total - 1 }));
        toast({
          title: 'Success',
          description: 'Translation deleted successfully',
        });
      } else {
        throw new Error('Failed to delete translation');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete translation',
        variant: 'destructive',
      });
    }
  };

  // Create new translation
  const handleCreate = async () => {
    try {
      const res = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: newTranslation.sourceText,
          translatedText: newTranslation.translatedText,
          targetLang: 'pt',
          category: newTranslation.category,
          context: newTranslation.context,
          tags: newTranslation.tags,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to create translation');
      }
      const { translation } = await res.json();
      setTranslations(prev => [translation, ...prev]);
      setStats(prev => ({ ...prev, total: prev.total + 1 }));
      setIsCreateDialogOpen(false);
      toast({ title: 'Success', description: 'Translation created.' });
      // refresh list to respect sorting/pagination
      fetchTranslations(currentPage);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to create translation', variant: 'destructive' });
    }
  };

  // Bulk approve selected
  const handleBulkApprove = async () => {
    if (selectedTranslations.size === 0) return;
    try {
      const ids = Array.from(selectedTranslations);
      const res = await fetch('/api/admin/translations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, updates: { status: 'approved' } }),
      });
      if (!res.ok) throw new Error('Failed to approve');
      setTranslations(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: 'approved' } : t));
      setSelectedTranslations(new Set());
      setShowBulkActions(false);
      toast({ title: 'Success', description: 'Selected translations approved.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Bulk approve failed', variant: 'destructive' });
    }
  };

  // Bulk delete selected
  const handleBulkDelete = async () => {
    if (selectedTranslations.size === 0) return;
    if (!confirm('Delete selected translations?')) return;
    try {
      const ids = Array.from(selectedTranslations);
      const res = await fetch(`/api/admin/translations?ids=${ids.join(',')}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setTranslations(prev => prev.filter(t => !ids.includes(t.id)));
      setStats(prev => ({ ...prev, total: Math.max(0, prev.total - ids.length) }));
      setSelectedTranslations(new Set());
      setShowBulkActions(false);
      toast({ title: 'Success', description: 'Selected translations deleted.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Bulk delete failed', variant: 'destructive' });
    }
  };

  // Export translations
  const handleExport = () => {
    const url = `/api/admin/translations/export?format=json&status=${encodeURIComponent(selectedStatus)}&category=${encodeURIComponent(selectedCategory)}`;
    window.open(url, '_blank');
  };

  return (
    <div>
    {/* Removed redundant closing div */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Translation</DialogTitle>
                <DialogDescription>
                  Add a new translation to the database
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sourceText">Source Text (English)</Label>
                    <Textarea
                      id="sourceText"
                      value={newTranslation.sourceText}
                      onChange={(e) => setNewTranslation(prev => ({ ...prev, sourceText: e.target.value }))}
                      placeholder="Enter the English text..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          e.preventDefault();
                          handleCreate();
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="translatedText">Translation (Portuguese)</Label>
                    <Textarea
                      id="translatedText"
                      value={newTranslation.translatedText}
                      onChange={(e) => setNewTranslation(prev => ({ ...prev, translatedText: e.target.value }))}
                      placeholder="Enter the Portuguese translation..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          e.preventDefault();
                          handleCreate();
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newTranslation.category} onValueChange={(value) => setNewTranslation(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSLATION_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={newTranslation.tags.join(', ')}
                      onChange={(e) => setNewTranslation(prev => ({ 
                        ...prev, 
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) 
                      }))}
                      placeholder="ui, button, action"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="context">Context (Optional)</Label>
                  <Textarea
                    id="context"
                    value={newTranslation.context}
                    onChange={(e) => setNewTranslation(prev => ({ ...prev, context: e.target.value }))}
                    placeholder="Provide context to help translators understand the usage..."
                    className="min-h-[60px]"
                  />
                </div>
              </div>
              <DialogFooter className="flex-col items-stretch gap-2">
                <div className="text-xs text-muted-foreground text-center">
                  Tip: Press Ctrl+Enter to create quickly
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Translation
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Import Dialog */}
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Import Translations</DialogTitle>
                <DialogDescription>
                  Upload a JSON file with translations to import
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium mb-1">Drop your JSON file here</p>
                  <p className="text-xs text-muted-foreground mb-4">or click to browse</p>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    id="import-file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Handle file import logic here
                        const reader = new FileReader();
                        reader.onload = async (e) => {
                          try {
                            const content = e.target?.result as string;
                            const data = JSON.parse(content);
                            
                            // TODO: Implement import API call
                            console.log('Import data:', data);
                            
                            toast({
                              title: 'Import Started',
                              description: 'Processing your translations...',
                            });
                            
                            setIsImportDialogOpen(false);
                          } catch (error) {
                            toast({
                              title: 'Import Error',
                              description: 'Invalid JSON file format',
                              variant: 'destructive',
                            });
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('import-file')?.click()}
                  >
                    Choose File
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Supported format:</p>
                  <code className="block bg-muted p-2 rounded text-xs">
                    {`{
  "translations": [
    {
      "sourceText": "Hello",
      "translatedText": "Olá",
      "category": "general"
    }
  ]
}`}
                  </code>
                </div>
              </div>
            </DialogContent>
          </Dialog>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Translations</CardTitle>
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Across all categories
            </p>
          </CardContent>
        </Card>
        
        <Card className={`border-0 shadow-md hover:shadow-lg transition-shadow duration-200 ${stats.needsReview > 0 ? 'ring-2 ring-yellow-200 dark:ring-yellow-800' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Needs Review</CardTitle>
            <div className={`p-2 rounded-full ${stats.needsReview > 0 ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-green-100 dark:bg-green-900/20'}`}>
              <AlertTriangle className={`h-4 w-4 ${stats.needsReview > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.needsReview > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
              {stats.needsReview}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? ((stats.needsReview / stats.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Quality</CardTitle>
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
              <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.averageQuality}%</div>
            <div className="mt-3">
              <Progress value={stats.averageQuality} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Auto-Translated</CardTitle>
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/20">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.autoTranslated}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              {stats.total > 0 ? ((stats.autoTranslated / stats.total) * 100).toFixed(1) : 0}% automation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Interface */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-5 h-11">
          <TabsTrigger value="list" className="text-sm font-medium">
            <FileText className="h-4 w-4 mr-2" />
            Translations
          </TabsTrigger>
          <TabsTrigger value="rules" className="text-sm font-medium">
            <FileText className="h-4 w-4 mr-2" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-sm font-medium">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-sm font-medium">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="pdf" className="text-sm font-medium">
            <FileText className="h-4 w-4 mr-2" />
            PDF Generator
          </TabsTrigger>
        </TabsList>
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Translation Rules</CardTitle>
              <CardDescription>
                Choose a mode below. Simple Builder is client-friendly; Advanced allows raw JSON editing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div>Loading...</div>
              ) : rulesError ? (
                <div className="text-red-600">{rulesError}</div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant={rulesMode === 'simple' ? 'default' : 'outline'} size="sm" onClick={() => setRulesMode('simple')}>Simple Builder</Button>
                    <Button variant={rulesMode === 'advanced' ? 'default' : 'outline'} size="sm" onClick={() => { setRulesMode('advanced'); setRulesEditOpen(false); }}>Advanced JSON</Button>
                    <div className="ml-auto text-xs text-muted-foreground">{
                      (() => {
                        try {
                          return Object.keys(JSON.parse(rulesEdit || rules || '{}')).length;
                        } catch {
                          return ruleRows.length;
                        }
                      })()
                    } rule(s)</div>
                  </div>

                  {rulesMode === 'simple' ? (
                    <div className="space-y-3">
                      {rulesValidationError && (
                        <div className="text-yellow-700 bg-yellow-50 border border-yellow-200 text-sm rounded p-2">{rulesValidationError}</div>
                      )}
                      <div className="grid grid-cols-12 gap-2 font-medium text-sm text-muted-foreground">
                        <div className="col-span-5">Source Text (exact match)</div>
                        <div className="col-span-6">Desired Translation</div>
                        <div className="col-span-1"></div>
                      </div>
                      <div className="space-y-2">
                        {ruleRows.length === 0 && (
                          <div className="text-sm text-muted-foreground">No rules yet. Click "Add Rule" to get started.</div>
                        )}
                        {ruleRows.map((row, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                            <Textarea
                              value={row.source}
                              onChange={(e) => {
                                const next = [...ruleRows];
                                next[idx] = { ...next[idx], source: e.target.value };
                                setRuleRows(next);
                              }}
                              rows={2}
                              className="col-span-5"
                              placeholder="e.g. Hello"
                            />
                            <Textarea
                              value={row.translation}
                              onChange={(e) => {
                                const next = [...ruleRows];
                                next[idx] = { ...next[idx], translation: e.target.value };
                                setRuleRows(next);
                              }}
                              rows={2}
                              className="col-span-6"
                              placeholder="e.g. Olá"
                            />
                            <div className="col-span-1 flex justify-end">
                              <Button variant="outline" size="sm" onClick={() => setRuleRows(prev => prev.filter((_, i) => i !== idx))}>Remove</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setRuleRows(prev => [...prev, { source: '', translation: '' }])}>Add Rule</Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            try {
                              const obj: Record<string, string> = {};
                              for (const r of ruleRows) {
                                if (!r.source) continue;
                                obj[r.source] = r.translation ?? '';
                              }
                              const normalized = JSON.stringify(obj, null, 2);
                              setRulesEdit(normalized);
                              setRulesValidationError(null);
                              toast({ title: 'Validated', description: 'Rules look good and were normalized.' });
                            } catch (err: any) {
                              setRulesValidationError('Validation failed.');
                            }
                          }}
                        >Validate</Button>
                        <div className="ml-auto flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            try {
                              const data = JSON.parse(prompt('Paste rules JSON here:') || '{}');
                              const rows = Object.entries(data).map(([source, translation]) => ({ source, translation: String(translation) }));
                              setRuleRows(rows);
                              setRulesEdit(JSON.stringify(data, null, 2));
                            } catch {}
                          }}>Import JSON</Button>
                          <Button variant="outline" size="sm" onClick={() => {
                            const obj: Record<string, string> = {};
                            for (const r of ruleRows) { if (r.source) obj[r.source] = r.translation ?? ''; }
                            const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.download = 'translation-rules.json'; a.click();
                            URL.revokeObjectURL(url);
                          }}>Export JSON</Button>
                          <Button size="sm" onClick={saveRules} disabled={rulesLoading}>Save</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Textarea
                        value={rulesEditOpen ? rulesEdit : rules}
                        onChange={e => setRulesEdit(e.target.value)}
                        disabled={!rulesEditOpen}
                        rows={14}
                        className="font-mono"
                      />
                      {rulesValidationError && (
                        <div className="text-yellow-700 bg-yellow-50 border border-yellow-200 text-sm rounded p-2">{rulesValidationError}</div>
                      )}
                      <div className="mt-2 flex gap-2">
                        {!rulesEditOpen ? (
                          <Button onClick={() => setRulesEditOpen(true)} variant="outline">Edit</Button>
                        ) : (
                          <>
                            <Button onClick={saveRules} variant="default">Save</Button>
                            <Button onClick={() => { setRulesEdit(rules); setRulesEditOpen(false); }} variant="outline">Cancel</Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pdf" className="space-y-6">
          <PdfTranslationManager />
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          {/* Enhanced Search and Filters */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="h-5 w-5 text-primary" />
                  Search & Filters
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedStatus('all');
                    setSelectedCategory('all');
                    setSortBy('updatedAt');
                    setSortOrder('desc');
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
                    <Input
                      placeholder="Search translations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  {searchTerm && (
                    <p className="text-xs text-muted-foreground">
                      {filteredTranslations.length} result(s) found
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-muted"></div>
                          All Statuses
                        </div>
                      </SelectItem>
                      {TRANSLATION_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              status.value === 'approved' ? 'bg-green-500' :
                              status.value === 'pending_review' ? 'bg-yellow-500' :
                              status.value === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                            }`}/>
                            {status.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">All Categories</SelectItem>
                      {TRANSLATION_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sort By</Label>
                  <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                    const [field, order] = value.split('-');
                    setSortBy(field);
                    setSortOrder(order as 'asc' | 'desc');
                  }}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updatedAt-desc">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Latest Updated
                        </div>
                      </SelectItem>
                      <SelectItem value="createdAt-desc">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          Newest First
                        </div>
                      </SelectItem>
                      <SelectItem value="qualityScore-desc">
                        <div className="flex items-center gap-2">
                          <Star className="h-3 w-3" />
                          Highest Quality
                        </div>
                      </SelectItem>
                      <SelectItem value="usageCount-desc">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3" />
                          Most Used
                        </div>
                      </SelectItem>
                      <SelectItem value="sourceText-asc">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-3 w-3" />
                          A-Z Source
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Quick Filter Chips */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedStatus === 'pending_review' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus(selectedStatus === 'pending_review' ? 'all' : 'pending_review')}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Needs Review ({stats.needsReview})
                </Button>
                <Button
                  variant={selectedCategory === 'navigation' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(selectedCategory === 'navigation' ? 'all' : 'navigation')}
                >
                  <Package className="h-3 w-3 mr-1" />
                  Navigation ({stats.byCategory.navigation || 0})
                </Button>
                <Button
                  variant={selectedCategory === 'dashboard' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(selectedCategory === 'dashboard' ? 'all' : 'dashboard')}
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Dashboard ({stats.byCategory.dashboard || 0})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Bulk Actions */}
          {showBulkActions && (
            <Card className="border-primary/20 bg-primary/5 shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">
                        {selectedTranslations.size} translation(s) selected
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Bulk actions available
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="default" onClick={handleBulkApprove}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve All
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleExport}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleBulkDelete} 
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedTranslations(new Set());
                        setShowBulkActions(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Translations Table */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Translations ({filteredTranslations.length.toLocaleString()})
                </CardTitle>
                <div className="flex items-center gap-2">
                  {loading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading...
                    </div>
                  )}
                  <Badge variant="outline" className="hidden sm:flex">
                    Page {currentPage} of {totalPages}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Loading translations...</p>
                  </div>
                </div>
              ) : filteredTranslations.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3 max-w-md">
                    <div className="p-3 rounded-full bg-muted/50 w-fit mx-auto">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">No translations found</p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search terms or filters to find what you're looking for.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedStatus('all');
                        setSelectedCategory('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b bg-muted/20">
                          <TableHead className="w-12 sticky left-0 bg-muted/20 z-10">
                            <Checkbox
                              checked={
                                selectedTranslations.size === filteredTranslations.length && filteredTranslations.length > 0
                                  ? true
                                  : selectedTranslations.size > 0
                                  ? 'indeterminate'
                                  : false
                              }
                              onCheckedChange={(checked) => handleSelectAll(checked === true)}
                            />
                          </TableHead>
                          <TableHead className="min-w-[200px]">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              Source Text
                            </div>
                          </TableHead>
                          <TableHead className="min-w-[200px]">
                            <div className="flex items-center gap-1">
                              <Languages className="h-4 w-4" />
                              Translation
                            </div>
                          </TableHead>
                          <TableHead className="w-24">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Status
                            </div>
                          </TableHead>
                          <TableHead className="w-20">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4" />
                              Quality
                            </div>
                          </TableHead>
                          <TableHead className="w-32">
                            <div className="flex items-center gap-1">
                              <Tag className="h-4 w-4" />
                              Category
                            </div>
                          </TableHead>
                          <TableHead className="w-20">
                            <div className="flex items-center gap-1">
                              <BarChart3 className="h-4 w-4" />
                              Usage
                            </div>
                          </TableHead>
                          <TableHead className="w-32 sticky right-0 bg-muted/20 z-10">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTranslations.map((translation) => (
                          <TableRow key={translation.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedTranslations.has(translation.id)}
                                onCheckedChange={(checked) => handleSelectTranslation(translation.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="space-y-1">
                                <div className="truncate font-medium" title={translation.sourceText}>
                                  {translation.sourceText}
                                </div>
                                {translation.context && (
                                  <div className="text-xs text-muted-foreground truncate" title={translation.context}>
                                    Context: {translation.context}
                                  </div>
                                )}
                                {translation.tags && translation.tags.length > 0 && (
                                  <div className="flex gap-1 flex-wrap">
                                    {translation.tags.slice(0, 2).map(tag => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {translation.tags.length > 2 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{translation.tags.length - 2}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={translation.translatedText}>
                                {translation.translatedText}
                              </div>
                              {translation.isAutoTranslated && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Auto-translated
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {translation.status ? getStatusBadge(translation.status) : (
                                <Badge className="bg-green-100 text-green-800">Approved</Badge>
                              )}
                              {translation.needsReview && (
                                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-1" />
                              )}
                            </TableCell>
                            <TableCell>
                              {translation.qualityScore ? getQualityBadge(translation.qualityScore) : (
                                <Badge className="bg-green-100 text-green-800">100%</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {translation.category ? 
                                  (TRANSLATION_CATEGORIES.find(c => c.value === translation.category)?.label || translation.category) 
                                  : 'General'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{translation.usageCount || 0} uses</div>
                                {translation.lastUsed && (
                                  <div className="text-xs text-muted-foreground">
                                    Last: {new Date(translation.lastUsed).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingId(translation.id);
                                        setEditData(translation);
                                      }}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Edit Translation</DialogTitle>
                                      <DialogDescription>
                                        Modify the translation and its metadata
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label htmlFor="edit-sourceText">Source Text (English)</Label>
                                          <Textarea
                                            id="edit-sourceText"
                                            value={editData.sourceText || ''}
                                            onChange={(e) => setEditData(prev => ({ ...prev, sourceText: e.target.value }))}
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="edit-translatedText">Translation (Portuguese)</Label>
                                          <Textarea
                                            id="edit-translatedText"
                                            value={editData.translatedText || ''}
                                            onChange={(e) => setEditData(prev => ({ ...prev, translatedText: e.target.value }))}
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            style={{ marginTop: '0.5rem' }}
                                            onClick={async () => {
                                              try {
                                                setEditData(prev => ({ ...prev, translatedText: 'Translating...' }));
                                                const res = await fetch('/api/translate', {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({ text: editData.sourceText, targetLang: 'pt' }),
                                                });
                                                if (!res.ok) throw new Error('Translation failed');
                                                const data = await res.json();
                                                setEditData(prev => ({ ...prev, translatedText: data.translated }));
                                                toast({
                                                  title: 'Translation Successful',
                                                  description: 'Suggestion filled from DeepL.',
                                                });
                                              } catch (err) {
                                                setEditData(prev => ({ ...prev, translatedText: '' }));
                                                toast({
                                                  title: 'Translation Error',
                                                  description: 'Failed to fetch suggestion. Please try again.',
                                                  variant: 'destructive',
                                                  action: (
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={async () => {
                                                        // Retry logic
                                                        try {
                                                          setEditData(prev => ({ ...prev, translatedText: 'Translating...' }));
                                                          const res = await fetch('/api/translate', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ text: editData.sourceText, targetLang: 'pt' }),
                                                          });
                                                          if (!res.ok) throw new Error('Translation failed');
                                                          const data = await res.json();
                                                          setEditData(prev => ({ ...prev, translatedText: data.translated }));
                                                          toast({
                                                            title: 'Translation Successful',
                                                            description: 'Suggestion filled from DeepL.',
                                                          });
                                                        } catch (err) {
                                                          setEditData(prev => ({ ...prev, translatedText: '' }));
                                                          toast({
                                                            title: 'Translation Error',
                                                            description: 'Retry failed. Please check your connection or try later.',
                                                            variant: 'destructive',
                                                          });
                                                        }
                                                      }}
                                                    >Retry</Button>
                                                  ),
                                                });
                                              }
                                            }}
                                            title="Suggest translation using DeepL"
                                          >
                                            Suggest Translation
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedTranslationId(translation.id);
                                    setIsHistoryDialogOpen(true);
                                  }}
                                >
                                  <History className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigator.clipboard.writeText(translation.translatedText)}
                                  title="Copy translation"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(translation.id)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Delete translation"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between p-6 border-t bg-muted/20">
                      <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * 50) + 1} to {Math.min(currentPage * 50, stats.total)} of {stats.total} translations
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline" 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <TranslationAnalytics stats={stats} />
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
                  <Button variant="outline" onClick={() => handleExport()}>
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button variant="outline" onClick={() => window.open('/api/admin/translations/export?format=csv', '_blank')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={() => window.open('/api/admin/translations/export?format=keyvalue', '_blank')}>
                    <Database className="h-4 w-4 mr-2" />
                    Export Key-Value
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    
  );
}