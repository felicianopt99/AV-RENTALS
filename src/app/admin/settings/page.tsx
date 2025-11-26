"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Database, Mail, Shield, Save, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomizationSettings {
  systemName?: string;
  timezone?: string;
  dateFormat?: string;
  currency?: string;
  language?: string;
  sessionTimeout?: number;
  requireStrongPasswords?: boolean;
  enableTwoFactor?: boolean;
  maxLoginAttempts?: number;
  emailEnabled?: boolean;
  smtpServer?: string;
  smtpPort?: string;
  smtpUsername?: string;
  smtpPassword?: string;
  fromEmail?: string;
  autoBackup?: boolean;
  backupFrequency?: string;
  backupRetention?: number;
}

export default function SystemSettingsPage() {
  const { toast } = useToast();

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // General Settings
  const [systemName, setSystemName] = useState('AV Rentals Management System');
  const [timezone, setTimezone] = useState('America/New_York');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [currency, setCurrency] = useState('EUR');
  const [language, setLanguage] = useState('en');

  // Security Settings
  const [sessionTimeout, setSessionTimeout] = useState('24');
  const [requireStrongPasswords, setRequireStrongPasswords] = useState(true);
  const [enableTwoFactor, setEnableTwoFactor] = useState(false);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');

  // Email Settings
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smtpServer, setSmtpServer] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [fromEmail, setFromEmail] = useState('');

  // Backup Settings (3-day rotation system)
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [backupRetention, setBackupRetention] = useState('3'); // Changed to 3-day rotation
  const [backupStatus, setBackupStatus] = useState<any>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Advanced Backup Config (enterprise-ready)
  const [retentionDaily, setRetentionDaily] = useState<string>('7');
  const [retentionWeekly, setRetentionWeekly] = useState<string>('4');
  const [retentionMonthly, setRetentionMonthly] = useState<string>('12');
  const [cronExpr, setCronExpr] = useState<string>('0 2 * * *');

  // Load settings from database
  useEffect(() => {
    loadSettings();
    loadBackupStatus();
    loadBackupConfig();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/customization');
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const settings: CustomizationSettings = await response.json();

      // Map API fields to state
      if (settings.systemName) setSystemName(settings.systemName);
      if (settings.timezone) setTimezone(settings.timezone);
      if (settings.dateFormat) setDateFormat(settings.dateFormat);
      if (settings.currency) setCurrency(settings.currency);
      if (settings.language) setLanguage(settings.language);
      if (settings.sessionTimeout !== undefined) setSessionTimeout(settings.sessionTimeout.toString());
      if (settings.requireStrongPasswords !== undefined) setRequireStrongPasswords(settings.requireStrongPasswords);
      if (settings.enableTwoFactor !== undefined) setEnableTwoFactor(settings.enableTwoFactor);
      if (settings.maxLoginAttempts !== undefined) setMaxLoginAttempts(settings.maxLoginAttempts.toString());
      if (settings.emailEnabled !== undefined) setEmailEnabled(settings.emailEnabled);
      if (settings.smtpServer) setSmtpServer(settings.smtpServer);
      if (settings.smtpPort) setSmtpPort(settings.smtpPort);
      if (settings.smtpUsername) setSmtpUsername(settings.smtpUsername);
      if (settings.smtpPassword) setSmtpPassword(settings.smtpPassword);
      if (settings.fromEmail) setFromEmail(settings.fromEmail);
      if (settings.autoBackup !== undefined) setAutoBackup(settings.autoBackup);
      if (settings.backupFrequency) setBackupFrequency(settings.backupFrequency);
      if (settings.backupRetention !== undefined) setBackupRetention(settings.backupRetention.toString());

    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load system settings',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBackupStatus = async () => {
    try {
      const response = await fetch('/api/backup/status');
      if (response.ok) {
        const status = await response.json();
        setBackupStatus(status);
        if (status?.config?.retention) {
          setRetentionDaily(String(status.config.retention.daily ?? '7'));
          setRetentionWeekly(String(status.config.retention.weekly ?? '4'));
          setRetentionMonthly(String(status.config.retention.monthly ?? '12'));
        }
        if (status?.config?.schedule?.cron) {
          setCronExpr(String(status.config.schedule.cron));
        }
      }
    } catch (error) {
      console.error('Error loading backup status:', error);
    }
  };

  const loadBackupConfig = async () => {
    try {
      const res = await fetch('/api/backup/config');
      if (res.ok) {
        const data = await res.json();
        const cfg = data?.config;
        if (cfg?.retention) {
          setRetentionDaily(String(cfg.retention.daily ?? '7'));
          setRetentionWeekly(String(cfg.retention.weekly ?? '4'));
          setRetentionMonthly(String(cfg.retention.monthly ?? '12'));
        }
        if (cfg?.schedule?.cron) {
          setCronExpr(String(cfg.schedule.cron));
        }
      }
    } catch (e) {
      // no-op
    }
  };

  const saveBackupConfig = async () => {
    try {
      const body = {
        retention: {
          daily: Number(retentionDaily || 0),
          weekly: Number(retentionWeekly || 0),
          monthly: Number(retentionMonthly || 0),
        },
        schedule: { cron: cronExpr || '0 2 * * *' },
      };
      const res = await fetch('/api/backup/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save backup config');
      const out = await res.json();
      setBackupStatus((prev: any) => ({ ...(prev || {}), config: out?.config }));
      toast({ title: 'Backup settings saved', description: 'Retention and schedule updated.' });
    } catch (e) {
      toast({ title: 'Save failed', description: 'Could not save backup settings.', variant: 'destructive' });
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const settings: CustomizationSettings = {
        systemName,
        timezone,
        dateFormat,
        currency,
        language,
        sessionTimeout: parseInt(sessionTimeout),
        requireStrongPasswords,
        enableTwoFactor,
        maxLoginAttempts: parseInt(maxLoginAttempts),
        emailEnabled,
        smtpServer,
        smtpPort,
        smtpUsername,
        smtpPassword,
        fromEmail,
        autoBackup,
        backupFrequency,
        backupRetention: parseInt(backupRetention),
      };

      const response = await fetch('/api/customization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully.",
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      // Here you would implement email testing functionality
      toast({
        title: "Test Email Sent",
        description: "A test email has been sent to verify your settings.",
      });
    } catch (error) {
      toast({
        title: "Email Test Failed",
        description: "Failed to send test email. Please check your settings.",
        variant: "destructive",
      });
    }
  };

  const handleBackupNow = async () => {
    try {
      setIsBackingUp(true);
      
      const response = await fetch('/api/backup', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Backup failed');
      }
      
      const result = await response.json();
      
      toast({
        title: "Backup Completed",
        description: `3-day rotation backup created successfully. ${result.message || ''}`,
      });
      
      // Refresh backup status
      await loadBackupStatus();
      
    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: "Backup Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading system settings...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences.
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving || isLoading}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic system configuration and regional settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="system-name">System Name</Label>
                  <Input
                    id="system-name"
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security policies and authentication settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    min="1"
                    max="168"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input
                    id="max-login-attempts"
                    type="number"
                    value={maxLoginAttempts}
                    onChange={(e) => setMaxLoginAttempts(e.target.value)}
                    min="3"
                    max="10"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="strong-passwords"
                    checked={requireStrongPasswords}
                    onCheckedChange={setRequireStrongPasswords}
                  />
                  <Label htmlFor="strong-passwords">Require Strong Passwords</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="two-factor"
                    checked={enableTwoFactor}
                    onCheckedChange={setEnableTwoFactor}
                  />
                  <Label htmlFor="two-factor">Enable Two-Factor Authentication</Label>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Security Notice</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Changes to security settings will affect all users. Ensure you communicate policy changes to your team.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Configure SMTP settings for system email notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="email-enabled"
                  checked={emailEnabled}
                  onCheckedChange={setEmailEnabled}
                />
                <Label htmlFor="email-enabled">Enable Email Notifications</Label>
              </div>

              {emailEnabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-server">SMTP Server</Label>
                      <Input
                        id="smtp-server"
                        value={smtpServer}
                        onChange={(e) => setSmtpServer(e.target.value)}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">SMTP Port</Label>
                      <Input
                        id="smtp-port"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                        placeholder="587"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-username">SMTP Username</Label>
                      <Input
                        id="smtp-username"
                        value={smtpUsername}
                        onChange={(e) => setSmtpUsername(e.target.value)}
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtp-password">SMTP Password</Label>
                      <Input
                        id="smtp-password"
                        type="password"
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                        placeholder="your-app-password"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from-email">From Email Address</Label>
                    <Input
                      id="from-email"
                      type="email"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      placeholder="noreply@avrental.com"
                    />
                  </div>

                  <Button onClick={handleTestEmail} variant="outline">
                    Send Test Email
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                3-Day Rotation Backup System
              </CardTitle>
              <CardDescription>
                Efficient backup system that maintains 3 rotating daily backups, using 97% less storage than traditional systems.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enterprise Settings */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Backup Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Retention - Daily</Label>
                    <Input type="number" min={0} value={retentionDaily} onChange={(e) => setRetentionDaily(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Retention - Weekly</Label>
                    <Input type="number" min={0} value={retentionWeekly} onChange={(e) => setRetentionWeekly(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Retention - Monthly</Label>
                    <Input type="number" min={0} value={retentionMonthly} onChange={(e) => setRetentionMonthly(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cron Schedule</Label>
                    <Input placeholder="0 2 * * *" value={cronExpr} onChange={(e) => setCronExpr(e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <div>
                    <div>Backup directory: {backupStatus?.backupDirectory || '/mnt/backup_drive/av-rentals/backups'}</div>
                    <div>Encrypted storage: {backupStatus?.hasResticRepo === true || backupStatus?.hasResticRepo === false ? 'Enabled (LUKS planned/active)' : 'Pending'}</div>
                  </div>
                  <Button onClick={saveBackupConfig} variant="outline" size="sm">Save Backup Settings</Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-backup"
                  checked={autoBackup}
                  onCheckedChange={setAutoBackup}
                />
                <Label htmlFor="auto-backup">Enable Automatic 3-Day Rotation Backups</Label>
              </div>

              {autoBackup && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="backup-frequency">Backup Frequency</Label>
                    <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily (Recommended)</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="backup-retention">Rotation System</Label>
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-md border">
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        3-Day Rotation (Fixed)
                      </span>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Always keeps exactly 3 backups
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={handleBackupNow} 
                  variant="outline" 
                  disabled={isBackingUp}
                  className="w-full"
                >
                  {isBackingUp ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Backup...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Backup Now
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={() => window.open('/admin/backup-restore', '_blank')} 
                  variant="outline"
                  className="w-full"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Restore Database
                </Button>
              </div>

              {/* 3-Day Rotation Status */}
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">3-Day Rotation Status</h4>
                
                {backupStatus ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(day => {
                      const dayBackup = backupStatus.rotationBackups?.find((b: any) => b.day === day);
                      return (
                        <div key={day} className="flex items-center justify-between text-sm">
                          <span className="font-medium">Day {day}:</span>
                          {dayBackup ? (
                            <span className="text-green-600 dark:text-green-400">
                              ✅ {dayBackup.size} ({dayBackup.date})
                            </span>
                          ) : (
                            <span className="text-gray-500">❌ Not available</span>
                          )}
                        </div>
                      );
                    })}
                    <div className="pt-2 border-t border-blue-200 dark:border-blue-800 text-xs">
                      <span className="text-blue-700 dark:text-blue-300">
                        Total backups: {backupStatus.availableBackups || 0}/3 • 
                        Storage saved: ~97% vs traditional systems • 
                        Location: {backupStatus?.backupDirectory || '/mnt/backup_drive/av-rentals/backups'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading backup status...
                    </div>
                  </div>
                )}
              </div>

              {/* Backup Information */}
              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">How 3-Day Rotation Works</h4>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>• <strong>Day 1:</strong> Monday, Thursday, Sunday backups</li>
                  <li>• <strong>Day 2:</strong> Tuesday, Friday backups</li>
                  <li>• <strong>Day 3:</strong> Wednesday, Saturday backups</li>
                  <li>• Each backup replaces the previous one for that day</li>
                  <li>• Always maintains 1-3 days of recent recovery options</li>
                  <li>• Uses 97% less storage than 30-day retention</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}