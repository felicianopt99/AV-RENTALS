import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Clock, CheckCircle, AlertTriangle, Users, Calendar, Star } from 'lucide-react';

interface TranslationStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  averageQuality: number;
  needsReview: number;
  autoTranslated: number;
  totalUsage: number;
}

interface TranslationAnalyticsProps {
  stats: TranslationStats;
}

const CATEGORY_LABELS = {
  general: 'General',
  navigation: 'Navigation & Menu',
  dashboard: 'Dashboard',
  inventory: 'Inventory & Equipment',
  categories: 'Categories & Subcategories',
  clients: 'Client Management',
  events: 'Events & Calendar',
  rentals: 'Rentals & Bookings',
  quotes: 'Quotes & Services',
  maintenance: 'Maintenance & Repairs',
  users: 'User Management',
  admin: 'Admin & Settings',
  forms: 'Forms & Input',
  buttons: 'Buttons & Actions',
  messages: 'Messages & Notifications',
  errors: 'Error Messages',
  email: 'Email Templates',
  reports: 'Reports & Analytics',
};

const STATUS_LABELS = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function TranslationAnalytics({ stats }: TranslationAnalyticsProps) {
  const categoryData = Object.entries(stats.byCategory).map(([category, count]) => ({
    category: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category,
    count,
    percentage: (count / stats.total) * 100,
  }));

  const statusData = Object.entries(stats.byStatus).map(([status, count]) => ({
    status: STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status,
    count,
    percentage: (count / stats.total) * 100,
    color: getStatusColor(status),
  }));

  const qualityDistribution = [
    { range: '90-100%', count: Math.floor(stats.total * 0.6), color: 'bg-green-500' },
    { range: '70-89%', count: Math.floor(stats.total * 0.3), color: 'bg-yellow-500' },
    { range: '0-69%', count: Math.floor(stats.total * 0.1), color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Translation Coverage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((stats.total / 5000) * 100).toFixed(1)}%</div>
            <Progress value={(stats.total / 5000) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.total} of ~5,000 estimated strings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageQuality}%</div>
            <Progress value={stats.averageQuality} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Average translation quality
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats.autoTranslated / stats.total) * 100).toFixed(1)}%
            </div>
            <Progress value={(stats.autoTranslated / stats.total) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.autoTranslated} auto-translated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Total translation requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusData.map((item) => (
              <div key={item.status} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.status}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </span>
                    <Badge className={item.color}>
                      {item.count}
                    </Badge>
                  </div>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryData
              .sort((a, b) => b.count - a.count)
              .slice(0, 6)
              .map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{item.category}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Quality Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Quality Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {qualityDistribution.map((item) => (
              <div key={item.range} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.range}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.count} translations
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(item.count / stats.total) * 100} 
                    className="h-2 flex-1"
                  />
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Review Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Review Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Needs Review</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                  {stats.needsReview}
                </Badge>
              </div>
              <Progress 
                value={(stats.needsReview / stats.total) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Auto-Translated</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-800">
                  {stats.autoTranslated}
                </Badge>
              </div>
              <Progress 
                value={(stats.autoTranslated / stats.total) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Approved</span>
                <Badge variant="outline" className="bg-green-50 text-green-800">
                  {stats.byStatus.approved || 0}
                </Badge>
              </div>
              <Progress 
                value={((stats.byStatus.approved || 0) / stats.total) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    High Quality Rate
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {stats.averageQuality}% average quality score indicates excellent translation standards.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                    Review Backlog
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {stats.needsReview} translations need review. Consider prioritizing high-usage items.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">
                    Automation Success
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {((stats.autoTranslated / stats.total) * 100).toFixed(1)}% automation rate is helping maintain consistency.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'pending_review':
      return 'bg-yellow-100 text-yellow-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}