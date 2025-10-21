"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Database, RefreshCw, Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BackupInfo {
  day: number;
  file: string;
  size: string;
  date: string;
  type: 'compressed' | 'uncompressed';
  age: number;
}

interface BackupStatus {
  availableBackups: number;
  rotationBackups: BackupInfo[];
  currentRotationDay: number;
  systemStatus: {
    rotationComplete: boolean;
    healthStatus: string;
    storageEfficiency: string;
  };
}

export default function BackupRestorePage() {
  const { toast } = useToast();
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadBackupStatus();
  }, []);

  const loadBackupStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/backup/status');
      if (response.ok) {
        const status = await response.json();
        setBackupStatus(status);
      }
    } catch (error) {
      console.error('Error loading backup status:', error);
      toast({
        title: "Error",
        description: "Failed to load backup status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (day: number) => {
    const confirmed = window.confirm(
      `⚠️ WARNING: This will replace your current database with the Day ${day} backup.\n\n` +
      `This action cannot be undone automatically. Make sure you understand the consequences.\n\n` +
      `Continue with restore?`
    );

    if (!confirmed) return;

    try {
      setIsRestoring(true);
      
      // In a real implementation, you would call your restore API
      toast({
        title: "Restore Initiated",
        description: `Starting restore from Day ${day} backup. This may take a few minutes.`,
      });

      // Simulate restore process
      setTimeout(() => {
        toast({
          title: "Manual Restore Required",
          description: "Please use the server terminal to complete the restore process: ./scripts/restore-database.sh",
        });
        setIsRestoring(false);
      }, 2000);

    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "Restore Failed",
        description: "Failed to initiate restore. Please try manually via terminal.",
        variant: "destructive",
      });
      setIsRestoring(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-center min-h-96">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading backup information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Backup & Restore</h1>
          <p className="text-muted-foreground">
            3-Day Rotation Backup System - Manage and restore your database backups
          </p>
        </div>
        
        <Button onClick={loadBackupStatus} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* System Status Alert */}
      {backupStatus && (
        <Alert className={`border-l-4 ${
          backupStatus.systemStatus.healthStatus === 'healthy' 
            ? 'border-l-green-500 bg-green-50 dark:bg-green-900/10' 
            : backupStatus.systemStatus.healthStatus === 'warning'
            ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
            : 'border-l-red-500 bg-red-50 dark:bg-red-900/10'
        }`}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>System Status:</strong> {getHealthStatusIcon(backupStatus.systemStatus.healthStatus)} {' '}
            <span className={getHealthStatusColor(backupStatus.systemStatus.healthStatus)}>
              {backupStatus.systemStatus.healthStatus.toUpperCase()}
            </span> - {' '}
            {backupStatus.availableBackups}/3 rotation backups available • {' '}
            Current rotation: Day {backupStatus.currentRotationDay} • {' '}
            {backupStatus.systemStatus.storageEfficiency}
          </AlertDescription>
        </Alert>
      )}

      {/* 3-Day Rotation Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            3-Day Rotation Backups
          </CardTitle>
          <CardDescription>
            Available database backups in the rotation system. Each backup replaces the previous one for that day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupStatus?.rotationBackups && backupStatus.rotationBackups.length > 0 ? (
            <div className="grid gap-4">
              {[1, 2, 3].map(day => {
                const backup = backupStatus.rotationBackups.find(b => b.day === day);
                const isCurrentDay = day === backupStatus.currentRotationDay;
                
                return (
                  <div 
                    key={day} 
                    className={`p-4 border rounded-lg ${
                      isCurrentDay ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          backup 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {day}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">Day {day} Backup</h3>
                            {isCurrentDay && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                                Today's Rotation
                              </span>
                            )}
                          </div>
                          
                          {backup ? (
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center gap-4">
                                <span>📁 {backup.file}</span>
                                <span>💾 {backup.size}</span>
                                <span>📅 {backup.date}</span>
                                <span>⏰ {backup.age} days old</span>
                              </div>
                              <div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                  backup.type === 'compressed' 
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                  {backup.type === 'compressed' ? '🗜️ Compressed' : '📄 Uncompressed'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No backup available for this day</p>
                          )}
                        </div>
                      </div>

                      {backup && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleRestore(day)}
                            variant="destructive"
                            size="sm"
                            disabled={isRestoring}
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Backups Found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No rotation backups are currently available. Create your first backup from the Settings page.
              </p>
              <Button onClick={() => window.location.href = '/admin/settings'}>
                Go to Backup Settings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Restore Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Restore Instructions</CardTitle>
          <CardDescription>
            For complete control over the restore process, use the command line tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm">
            <div className="space-y-2">
              <div># Interactive restore (recommended)</div>
              <div className="text-blue-600 dark:text-blue-400">./scripts/restore-database.sh</div>
              
              <div className="mt-4"># List available backups</div>
              <div className="text-blue-600 dark:text-blue-400">npm run backup:list</div>
              
              <div className="mt-4"># Check system health</div>
              <div className="text-blue-600 dark:text-blue-400">npm run backup:health</div>
            </div>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Always backup your current database before restoring. 
              The restore scripts automatically create a safety backup, but manual verification is recommended for critical data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}