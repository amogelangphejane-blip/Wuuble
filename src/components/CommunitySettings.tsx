import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CommunityAvatarUpload } from '@/components/CommunityAvatarUpload';
import { 
  Settings,
  Users,
  Shield,
  Bell,
  Globe,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Crown,
  AlertTriangle,
  Save,
  Trash2,
  Info
} from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string | null;
  is_private: boolean;
  member_count: number;
  creator_id: string;
  created_at: string;
}

interface CommunityMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CommunitySettingsProps {
  community: Community;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onDelete?: () => void;
  isCreator: boolean;
  userId: string;
}

interface CommunitySettings {
  // Basic Info
  name: string;
  description: string;
  avatar_url: string | null;
  
  // Privacy & Visibility
  is_private: boolean;
  join_approval_required: boolean;
  allow_member_invites: boolean;
  discoverable_in_search: boolean;
  
  // Content & Moderation
  allow_posts: boolean;
  require_post_approval: boolean;
  allow_events: boolean;
  require_event_approval: boolean;

  
  // Communication
  allow_group_calls: boolean;
  allow_direct_messages: boolean;
  notification_frequency: string;
}

export const CommunitySettings = ({ 
  community, 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete,
  isCreator, 
  userId 
}: CommunitySettingsProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [settings, setSettings] = useState<CommunitySettings>({
    name: community.name,
    description: community.description || '',
    avatar_url: community.avatar_url,
    is_private: community.is_private,
    join_approval_required: false,
    allow_member_invites: true,
    discoverable_in_search: !community.is_private,
    allow_posts: true,
    require_post_approval: false,
    allow_events: true,
    require_event_approval: false,

    allow_group_calls: true,
    allow_direct_messages: true,
    notification_frequency: 'immediate'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
      loadCommunitySettings();
    }
  }, [isOpen, community.id]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', community.id)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const loadCommunitySettings = async () => {
    // In a real implementation, you might have a separate settings table
    // For now, we'll use the existing community data and set sensible defaults
    setSettings(prev => ({
      ...prev,
      name: community.name,
      description: community.description || '',
      avatar_url: community.avatar_url,
      is_private: community.is_private,
      discoverable_in_search: !community.is_private
    }));
  };

  const validateSettings = () => {
    const newErrors: Record<string, string> = {};

    if (!settings.name.trim()) {
      newErrors.name = 'Community name is required';
    } else if (settings.name.length < 3) {
      newErrors.name = 'Community name must be at least 3 characters';
    } else if (settings.name.length > 50) {
      newErrors.name = 'Community name must be less than 50 characters';
    }

    if (settings.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('communities')
        .update({
          name: settings.name,
          description: settings.description,
          avatar_url: settings.avatar_url,
          is_private: settings.is_private,
          updated_at: new Date().toISOString()
        })
        .eq('id', community.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Community settings updated successfully"
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating community:', error);
      toast({
        title: "Error",
        description: "Failed to update community settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Member role updated successfully"
      });

      fetchMembers();
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive"
      });
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Member removed successfully"
      });

      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'creator': return 'bg-yellow-100 text-yellow-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'moderator': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteCommunity = async () => {
    if (!community || deleteConfirmText !== community.name) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', community.id);

      if (error) throw error;

      toast({
        title: "Community Deleted",
        description: "The community has been permanently deleted.",
      });

      onDelete?.();
      onClose();
    } catch (error) {
      console.error('Error deleting community:', error);
      toast({
        title: "Error",
        description: "Failed to delete community",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Community Settings
          </DialogTitle>
          <DialogDescription>
            Manage your community's settings, members, and preferences.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              Danger
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Update your community's basic information and appearance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Community Name</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    placeholder="Enter community name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={settings.description}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    placeholder="Describe your community..."
                    className={`min-h-[100px] resize-none ${errors.description ? 'border-red-500' : ''}`}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    {errors.description && (
                      <span className="text-red-500">{errors.description}</span>
                    )}
                    <span className="ml-auto">{settings.description.length}/500</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <CommunityAvatarUpload
                    communityId={community.id}
                    currentAvatarUrl={settings.avatar_url}
                    onAvatarUpdate={(avatarUrl) => setSettings({ ...settings, avatar_url: avatarUrl })}
                    size="lg"
                    showLabel={true}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Visibility</CardTitle>
                <CardDescription>
                  Control who can find and join your community.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      {settings.is_private ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                      Private Community
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Private communities require approval to join and aren't visible in search results.
                    </p>
                  </div>
                  <Switch
                    checked={settings.is_private}
                    onCheckedChange={(checked) => setSettings({ 
                      ...settings, 
                      is_private: checked,
                      discoverable_in_search: !checked 
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Join Approval Required</Label>
                    <p className="text-sm text-muted-foreground">
                      Require manual approval for new members to join.
                    </p>
                  </div>
                  <Switch
                    checked={settings.join_approval_required}
                    onCheckedChange={(checked) => setSettings({ ...settings, join_approval_required: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Allow Member Invites</Label>
                    <p className="text-sm text-muted-foreground">
                      Let members invite others to join the community.
                    </p>
                  </div>
                  <Switch
                    checked={settings.allow_member_invites}
                    onCheckedChange={(checked) => setSettings({ ...settings, allow_member_invites: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Discoverable in Search</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow this community to appear in search results.
                    </p>
                  </div>
                  <Switch
                    checked={settings.discoverable_in_search}
                    onCheckedChange={(checked) => setSettings({ ...settings, discoverable_in_search: checked })}
                    disabled={settings.is_private}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content & Features</CardTitle>
                <CardDescription>
                  Control what features are available in your community.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Allow Posts</Label>
                    <p className="text-sm text-muted-foreground">
                      Let members create and share posts.
                    </p>
                  </div>
                  <Switch
                    checked={settings.allow_posts}
                    onCheckedChange={(checked) => setSettings({ ...settings, allow_posts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Require Post Approval</Label>
                    <p className="text-sm text-muted-foreground">
                      Posts must be approved before being visible to members.
                    </p>
                  </div>
                  <Switch
                    checked={settings.require_post_approval}
                    onCheckedChange={(checked) => setSettings({ ...settings, require_post_approval: checked })}
                    disabled={!settings.allow_posts}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Allow Events</Label>
                    <p className="text-sm text-muted-foreground">
                      Let members create and manage events.
                    </p>
                  </div>
                  <Switch
                    checked={settings.allow_events}
                    onCheckedChange={(checked) => setSettings({ ...settings, allow_events: checked })}
                  />
                </div>



                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Allow Group Calls</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable video and audio group calling features.
                    </p>
                  </div>
                  <Switch
                    checked={settings.allow_group_calls}
                    onCheckedChange={(checked) => setSettings({ ...settings, allow_group_calls: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Community Members ({members.length})</span>
                  <Badge variant="secondary">{community.member_count} total</Badge>
                </CardTitle>
                <CardDescription>
                  Manage member roles and permissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {member.profiles?.display_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.profiles?.display_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={getRoleColor(member.role)}>
                          {member.role === 'creator' && <Crown className="w-3 h-3 mr-1" />}
                          {member.role}
                        </Badge>
                        
                        {isCreator && member.user_id !== userId && member.role !== 'creator' && (
                          <div className="flex gap-2">
                            <Select
                              value={member.role}
                              onValueChange={(value) => updateMemberRole(member.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeMember(member.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how and when members receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Notification Frequency</Label>
                  <Select
                    value={settings.notification_frequency}
                    onValueChange={(value) => setSettings({ ...settings, notification_frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly Digest</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                      <SelectItem value="weekly">Weekly Digest</SelectItem>
                      <SelectItem value="none">No Notifications</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Allow Direct Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Let members send direct messages to each other.
                    </p>
                  </div>
                  <Switch
                    checked={settings.allow_direct_messages}
                    onCheckedChange={(checked) => setSettings({ ...settings, allow_direct_messages: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danger" className="space-y-6 mt-6">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions for this community.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Delete Community</h4>
                  <p className="text-sm text-red-700 mb-4">
                    Once you delete a community, there is no going back. This will permanently delete:
                  </p>
                  <ul className="text-sm text-red-700 space-y-1 mb-4">
                    <li>• The community and all its settings</li>
                    <li>• All community posts and discussions</li>
                    <li>• All community events</li>
                    <li>• All member data and relationships</li>
                    <li>• Any uploaded images and files</li>
                  </ul>
                  <Button 
                    onClick={() => setShowDeleteDialog(true)}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="mr-2 w-4 h-4" />
                    Delete Community
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Community</DialogTitle>
              <DialogDescription>
                Are you absolutely sure you want to delete "{community.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">This will permanently delete:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• The community and all its settings</li>
                  <li>• All community posts and discussions</li>
                  <li>• All community events</li>
                  <li>• All member data and relationships</li>
                  <li>• Any uploaded images and files</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Type the community name <strong>"{community.name}"</strong> to confirm deletion:
              </p>
              <Input
                type="text"
                placeholder={`Type "${community.name}" here`}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmText('');
                }}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteCommunity}
                variant="destructive"
                className="flex-1"
                disabled={deleteConfirmText !== community.name || loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 w-4 h-4" />
                    Delete Forever
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};