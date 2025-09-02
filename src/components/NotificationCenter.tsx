import React, { useState } from 'react';
import { Bell, Check, X, ExternalLink, Trash2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestNotificationPermission
  } = useNotifications();
  
  const [open, setOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      'info': '💡',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'social': '👥',
      'system': '🔧'
    };
    return iconMap[type as keyof typeof iconMap] || '📢';
  };

  const getNotificationColor = (type: string) => {
    const colorMap = {
      'info': 'border-blue-200 bg-blue-50 dark:bg-blue-950',
      'success': 'border-green-200 bg-green-50 dark:bg-green-950',
      'warning': 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950',
      'error': 'border-red-200 bg-red-50 dark:bg-red-950',
      'social': 'border-purple-200 bg-purple-50 dark:bg-purple-950',
      'system': 'border-gray-200 bg-gray-50 dark:bg-gray-950'
    };
    return colorMap[type as keyof typeof colorMap] || 'border-gray-200 bg-gray-50 dark:bg-gray-950';
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      // You can show a success message or update UI
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2"
          onClick={() => setOpen(!open)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            {Notification.permission === 'default' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRequestPermission}
                className="text-xs"
              >
                <Bell className="h-3 w-3 mr-1" />
                Enable
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">No notifications yet</p>
              <p className="text-xs text-gray-400">
                We'll notify you when something interesting happens!
              </p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                      getNotificationColor(notification.type),
                      !notification.read && "ring-2 ring-blue-200 dark:ring-blue-800"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={cn(
                            "text-sm font-medium truncate",
                            !notification.read && "font-semibold"
                          )}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {notification.action_url && (
                              <ExternalLink className="h-3 w-3 text-gray-400" />
                            )}
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-600" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Notification</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this notification? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteNotification(notification.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < notifications.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t bg-gray-50 dark:bg-gray-900">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setOpen(false);
                window.location.href = '/notifications';
              }}
            >
              View All Notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;