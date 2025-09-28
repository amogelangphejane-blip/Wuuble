import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  BellOff, 
  Volume2, 
  VolumeX, 
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Clock,
  Users,
  MessageCircle,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: NotificationSettings) => void;
}

interface NotificationSettings {
  pushNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showPreviews: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  groupNotifications: 'all' | 'mentions' | 'none';
  desktopNotifications: boolean;
  emailNotifications: boolean;
  notificationSound: string;
}

export const NotificationSettingsDialog: React.FC<NotificationSettingsDialogProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    showPreviews: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    groupNotifications: 'mentions',
    desktopNotifications: true,
    emailNotifications: false,
    notificationSound: 'default',
  });

  const notificationSounds = [
    { value: 'default', label: 'Default' },
    { value: 'gentle', label: 'Gentle' },
    { value: 'upbeat', label: 'Upbeat' },
    { value: 'alert', label: 'Alert' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'none', label: 'None' },
  ];

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Settings
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          <div className="p-6 space-y-6">
            {/* General Notifications */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Bell className="h-4 w-4" />
                General
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      settings.pushNotifications ? "bg-green-100 dark:bg-green-900/20" : "bg-gray-100 dark:bg-gray-800"
                    )}>
                      {settings.pushNotifications ? (
                        <Bell className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <BellOff className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Push Notifications</Label>
                      <p className="text-xs text-gray-500">Receive notifications for new messages</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      settings.showPreviews ? "bg-blue-100 dark:bg-blue-900/20" : "bg-gray-100 dark:bg-gray-800"
                    )}>
                      <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Message Previews</Label>
                      <p className="text-xs text-gray-500">Show message content in notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.showPreviews}
                    onCheckedChange={(checked) => updateSetting('showPreviews', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      settings.soundEnabled ? "bg-orange-100 dark:bg-orange-900/20" : "bg-gray-100 dark:bg-gray-800"
                    )}>
                      {settings.soundEnabled ? (
                        <Volume2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Notification Sounds</Label>
                      <p className="text-xs text-gray-500">Play sound for notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
                  />
                </div>

                {settings.soundEnabled && (
                  <div className="ml-11 space-y-2">
                    <Label className="text-xs text-gray-600 dark:text-gray-400">Sound</Label>
                    <Select
                      value={settings.notificationSound}
                      onValueChange={(value) => updateSetting('notificationSound', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {notificationSounds.map((sound) => (
                          <SelectItem key={sound.value} value={sound.value}>
                            {sound.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      settings.vibrationEnabled ? "bg-purple-100 dark:bg-purple-900/20" : "bg-gray-100 dark:bg-gray-800"
                    )}>
                      <Smartphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Vibration</Label>
                      <p className="text-xs text-gray-500">Vibrate on new messages</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.vibrationEnabled}
                    onCheckedChange={(checked) => updateSetting('vibrationEnabled', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Platform Specific */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Platform
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                      <Monitor className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Desktop Notifications</Label>
                      <p className="text-xs text-gray-500">Show browser notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.desktopNotifications}
                    onCheckedChange={(checked) => updateSetting('desktopNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email Notifications</Label>
                      <p className="text-xs text-gray-500">Send email for missed messages</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Group Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Group Chats
              </h3>
              
              <div className="space-y-2">
                <Label className="text-sm">Group Notifications</Label>
                <Select
                  value={settings.groupNotifications}
                  onValueChange={(value: 'all' | 'mentions' | 'none') => 
                    updateSetting('groupNotifications', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="mentions">Mentions Only</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Choose when to receive notifications in group chats
                </p>
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Moon className="h-4 w-4" />
                Quiet Hours
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    settings.quietHoursEnabled ? "bg-indigo-100 dark:bg-indigo-900/20" : "bg-gray-100 dark:bg-gray-800"
                  )}>
                    {settings.quietHoursEnabled ? (
                      <Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Sun className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Enable Quiet Hours</Label>
                    <p className="text-xs text-gray-500">Mute notifications during these hours</p>
                  </div>
                </div>
                <Switch
                  checked={settings.quietHoursEnabled}
                  onCheckedChange={(checked) => updateSetting('quietHoursEnabled', checked)}
                />
              </div>

              {settings.quietHoursEnabled && (
                <div className="ml-11 grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">From</Label>
                    <Select
                      value={settings.quietHoursStart}
                      onValueChange={(value) => updateSetting('quietHoursStart', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <SelectItem key={i} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">To</Label>
                    <Select
                      value={settings.quietHoursEnd}
                      onValueChange={(value) => updateSetting('quietHoursEnd', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <SelectItem key={i} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Current Status */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.pushNotifications && (
                  <Badge variant="secondary" className="text-xs">
                    <Bell className="h-3 w-3 mr-1" />
                    Push Enabled
                  </Badge>
                )}
                {settings.quietHoursEnabled && (
                  <Badge variant="secondary" className="text-xs">
                    <Moon className="h-3 w-3 mr-1" />
                    Quiet Hours
                  </Badge>
                )}
                {!settings.soundEnabled && (
                  <Badge variant="secondary" className="text-xs">
                    <VolumeX className="h-3 w-3 mr-1" />
                    Silent
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#25d366] hover:bg-[#20c55e] text-white">
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};