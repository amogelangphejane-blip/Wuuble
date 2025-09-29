import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Users, 
  Heart,
  Trophy,
  Settings,
  Save
} from 'lucide-react';

interface NotificationPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  new_posts: boolean;
  new_comments: boolean;
  event_reminders: boolean;
  member_joins: boolean;
  likes_reactions: boolean;
  achievements: boolean;
  weekly_digest: boolean;
  marketing_emails: boolean;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    new_posts: true,
    new_comments: true,
    event_reminders: true,
    member_joins: false,
    likes_reactions: true,
    achievements: true,
    weekly_digest: true,
    marketing_emails: false
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchNotificationSettings();
    }
  }, [isOpen, user]);

  const fetchNotificationSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          new_posts: data.new_posts ?? true,
          new_comments: data.new_comments ?? true,
          event_reminders: data.event_reminders ?? true,
          member_joins: data.member_joins ?? false,
          likes_reactions: data.likes_reactions ?? true,
          achievements: data.achievements ?? true,
          weekly_digest: data.weekly_digest ?? true,
          marketing_emails: data.marketing_emails ?? false
        });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification preferences saved successfully",
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notification Preferences</span>
          </DialogTitle>
          <DialogDescription>
            Customize how you receive notifications and updates
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <div className="animate-pulse space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>General</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email Notifications</span>
                    </Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={() => handleToggle('email_notifications')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center space-x-2">
                      <Bell className="w-4 h-4" />
                      <span>Push Notifications</span>
                    </Label>
                    <p className="text-sm text-gray-500">Receive push notifications in your browser</p>
                  </div>
                  <Switch
                    checked={settings.push_notifications}
                    onCheckedChange={() => handleToggle('push_notifications')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Community Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Community Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Posts</Label>
                    <p className="text-sm text-gray-500">Get notified when new posts are created</p>
                  </div>
                  <Switch
                    checked={settings.new_posts}
                    onCheckedChange={() => handleToggle('new_posts')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Comments</Label>
                    <p className="text-sm text-gray-500">Get notified when someone comments on your posts</p>
                  </div>
                  <Switch
                    checked={settings.new_comments}
                    onCheckedChange={() => handleToggle('new_comments')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>New Members</span>
                    </Label>
                    <p className="text-sm text-gray-500">Get notified when new members join</p>
                  </div>
                  <Switch
                    checked={settings.member_joins}
                    onCheckedChange={() => handleToggle('member_joins')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center space-x-2">
                      <Heart className="w-4 h-4" />
                      <span>Likes & Reactions</span>
                    </Label>
                    <p className="text-sm text-gray-500">Get notified when someone likes your content</p>
                  </div>
                  <Switch
                    checked={settings.likes_reactions}
                    onCheckedChange={() => handleToggle('likes_reactions')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Events & Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Events & Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Event Reminders</Label>
                    <p className="text-sm text-gray-500">Get reminded about upcoming events</p>
                  </div>
                  <Switch
                    checked={settings.event_reminders}
                    onCheckedChange={() => handleToggle('event_reminders')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4" />
                      <span>Achievements</span>
                    </Label>
                    <p className="text-sm text-gray-500">Get notified when you earn new achievements</p>
                  </div>
                  <Switch
                    checked={settings.achievements}
                    onCheckedChange={() => handleToggle('achievements')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Digest & Marketing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Digest & Updates</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Digest</Label>
                    <p className="text-sm text-gray-500">Receive a weekly summary of community activity</p>
                  </div>
                  <Switch
                    checked={settings.weekly_digest}
                    onCheckedChange={() => handleToggle('weekly_digest')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-gray-500">Receive updates about new features and promotions</p>
                  </div>
                  <Switch
                    checked={settings.marketing_emails}
                    onCheckedChange={() => handleToggle('marketing_emails')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={saveNotificationSettings} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};