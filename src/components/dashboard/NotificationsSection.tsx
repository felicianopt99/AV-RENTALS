"use client";

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Calendar, Wrench, Package, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppContext } from '@/contexts/AppContext';
import { useTranslate } from '@/contexts/TranslationContext';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  createdAt: string;
}

export function NotificationsSection({ noCard = false }: { noCard?: boolean }) {
  const { currentUser } = useAppContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRead, setShowRead] = useState(false);

  // Translation hooks
  const { translated: notificationsText } = useTranslate('Notifications');
  const { translated: loadingText } = useTranslate('Loading...');
  const { translated: noNotificationsText } = useTranslate('No notifications');
  const { translated: noUnreadNotificationsText } = useTranslate('No unread notifications');
  const { translated: hideReadText } = useTranslate('Hide Read');
  const { translated: showAllText } = useTranslate('Show All');
  const { translated: markAllReadText } = useTranslate('Mark all read');
  const { translated: markReadText } = useTranslate('Mark read');

  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications();
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${currentUser?.id}&limit=20&unreadOnly=false`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark-read',
          notificationIds,
          userId: currentUser?.id,
        }),
      });
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          notificationIds.includes(n.id) ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!confirm('Delete this notification? It will only delete today\'s notifications.')) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          notificationIds: [notificationId],
          userId: currentUser?.id,
        }),
      });

      if (response.ok) {
        // Update local state - remove the deleted notification
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'event_reminder':
        return <Calendar className="h-4 w-4" />;
      case 'conflict_alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'maintenance_due':
        return <Wrench className="h-4 w-4" />;
      case 'low_stock':
        return <Package className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    const loadingContent = (
      <>
        <div className="flex items-center p-6 pb-2">
          <h3 className="text-sm font-medium flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            {notificationsText}
          </h3>
        </div>
        <div className="p-6 pt-0">
          <p className="text-sm text-muted-foreground">{loadingText}</p>
        </div>
      </>
    );
    return noCard ? loadingContent : (
      <Card className="shadow-lg">
        {loadingContent}
      </Card>
    );
  }

  const displayedNotifications = showRead ? notifications : notifications.filter(n => !n.isRead);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const content = (
    <>
      <div className="flex items-center justify-between p-6 pb-2">
        <h3 className="text-sm font-medium flex items-center">
          <Bell className="mr-2 h-4 w-4" />
          {notificationsText}
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">
              {unreadCount}
            </Badge>
          )}
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRead(!showRead)}
            className="text-xs"
          >
            {showRead ? hideReadText : showAllText}
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAsRead(notifications.filter(n => !n.isRead).map(n => n.id))}
              className="text-xs"
            >
              {markAllReadText}
            </Button>
          )}
        </div>
      </div>
      <div className="p-6 pt-0">
        {displayedNotifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {showRead ? noNotificationsText : noUnreadNotificationsText}
          </p>
        ) : (
          <ScrollArea className="h-48">
            <div className="space-y-3">
              {displayedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    notification.isRead
                      ? 'bg-muted/50 border-muted'
                      : 'bg-background border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-1 rounded-full ${
                      notification.priority === 'high'
                        ? 'bg-destructive/10 text-destructive'
                        : notification.priority === 'medium'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium truncate">
                          {notification.title}
                        </p>
                        <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                          {notification.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead([notification.id])}
                            className="text-xs h-6 px-2"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {markReadText}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </>
  );

  return noCard ? content : (
    <Card className="shadow-lg">
      {content}
    </Card>
  );
}
