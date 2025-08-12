import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle,
  UserX,
  Flag,
  Phone,
  Eye,
  EyeOff,
  Lock,
  Users,
  MessageCircle,
  Heart,
  Settings,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Headphones,
  Camera,
  Mic
} from 'lucide-react';

interface SafetySettings {
  autoBlock: boolean;
  hideLocation: boolean;
  requireVerified: boolean;
  filterProfanity: boolean;
  screenshotProtection: boolean;
  emergencyMode: boolean;
  allowReconnections: boolean;
  showOnlineStatus: boolean;
}

interface BlockedUser {
  id: string;
  name: string;
  avatar?: string;
  blockedDate: Date;
  reason: string;
}

interface SafetyScreenProps {
  settings: SafetySettings;
  blockedUsers: BlockedUser[];
  onSettingsChange: (settings: SafetySettings) => void;
  onUnblockUser: (userId: string) => void;
  onEmergencyContact: () => void;
  onReportIssue: () => void;
}

const SAFETY_TIPS = [
  {
    icon: Shield,
    title: "Never share personal information",
    description: "Don't share your full name, address, phone number, or financial information with strangers.",
    level: "critical"
  },
  {
    icon: Camera,
    title: "Be cautious with video calls",
    description: "Remember that others can record or screenshot video calls. Be mindful of your surroundings.",
    level: "important"
  },
  {
    icon: Users,
    title: "Trust your instincts",
    description: "If something feels wrong or uncomfortable, end the conversation immediately.",
    level: "critical"
  },
  {
    icon: Flag,
    title: "Report inappropriate behavior",
    description: "Help keep the community safe by reporting users who violate our guidelines.",
    level: "important"
  },
  {
    icon: Lock,
    title: "Use privacy settings",
    description: "Customize your privacy settings to control what information others can see.",
    level: "normal"
  },
  {
    icon: MessageCircle,
    title: "Keep conversations on platform",
    description: "Avoid moving conversations to other platforms or apps too quickly.",
    level: "normal"
  }
];

const COMMUNITY_GUIDELINES = [
  "Be respectful and kind to all users",
  "No harassment, bullying, or hate speech",
  "No inappropriate or sexual content",
  "No spam, advertising, or self-promotion",
  "No impersonation or fake profiles",
  "Respect others' privacy and boundaries",
  "Report violations to help keep everyone safe",
  "Follow local laws and regulations"
];

export const UserSafetyScreen: React.FC<SafetyScreenProps> = ({
  settings,
  blockedUsers,
  onSettingsChange,
  onUnblockUser,
  onEmergencyContact,
  onReportIssue
}) => {
  const [activeTab, setActiveTab] = useState<'guidelines' | 'settings' | 'blocked' | 'help'>('guidelines');
  const { toast } = useToast();

  const handleSettingChange = (key: keyof SafetySettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    onSettingsChange(newSettings);
    
    toast({
      title: "Settings updated",
      description: `${key.charAt(0).toUpperCase() + key.slice(1)} ${value ? 'enabled' : 'disabled'}`,
    });
  };

  const handleUnblock = (userId: string, userName: string) => {
    onUnblockUser(userId);
    toast({
      title: "User unblocked",
      description: `${userName} has been unblocked`,
    });
  };

  const getTipLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'important': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const getTipLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-500';
      case 'important': return 'text-yellow-500';
      default: return 'text-blue-500';
    }
  };

  const renderGuidelines = () => (
    <div className="space-y-6">
      {/* Safety Tips */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Safety Tips
        </h3>
        <div className="space-y-3">
          {SAFETY_TIPS.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <Card key={index} className={getTipLevelColor(tip.level)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${getTipLevelIcon(tip.level)}`} />
                    <div>
                      <h4 className="font-medium mb-1">{tip.title}</h4>
                      <p className="text-sm text-muted-foreground">{tip.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Community Guidelines */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Community Guidelines
        </h3>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {COMMUNITY_GUIDELINES.map((guideline, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{guideline}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Actions */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Emergency Actions
          </h4>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              onClick={onEmergencyContact}
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-100"
            >
              <Phone className="w-4 h-4 mr-2" />
              Emergency Contact
            </Button>
            <Button 
              variant="outline" 
              onClick={onReportIssue}
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-100"
            >
              <Flag className="w-4 h-4 mr-2" />
              Report Safety Issue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Privacy Settings
        </h3>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Hide Location</Label>
                <p className="text-sm text-muted-foreground">Don't show your location to others</p>
              </div>
              <Switch
                checked={settings.hideLocation}
                onCheckedChange={(checked) => handleSettingChange('hideLocation', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Online Status</Label>
                <p className="text-sm text-muted-foreground">Let others see when you're online</p>
              </div>
              <Switch
                checked={settings.showOnlineStatus}
                onCheckedChange={(checked) => handleSettingChange('showOnlineStatus', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Screenshot Protection</Label>
                <p className="text-sm text-muted-foreground">Attempt to prevent screenshots</p>
              </div>
              <Switch
                checked={settings.screenshotProtection}
                onCheckedChange={(checked) => handleSettingChange('screenshotProtection', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Safety Settings
        </h3>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Verified Users</Label>
                <p className="text-sm text-muted-foreground">Only match with verified profiles</p>
              </div>
              <Switch
                checked={settings.requireVerified}
                onCheckedChange={(checked) => handleSettingChange('requireVerified', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-block Reported Users</Label>
                <p className="text-sm text-muted-foreground">Automatically block users with multiple reports</p>
              </div>
              <Switch
                checked={settings.autoBlock}
                onCheckedChange={(checked) => handleSettingChange('autoBlock', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Filter Profanity</Label>
                <p className="text-sm text-muted-foreground">Automatically filter inappropriate language</p>
              </div>
              <Switch
                checked={settings.filterProfanity}
                onCheckedChange={(checked) => handleSettingChange('filterProfanity', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Reconnections</Label>
                <p className="text-sm text-muted-foreground">Allow matching with previous connections</p>
              </div>
              <Switch
                checked={settings.allowReconnections}
                onCheckedChange={(checked) => handleSettingChange('allowReconnections', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-red-600">Emergency Mode</Label>
                <p className="text-sm text-red-500">Enhanced safety with stricter filtering</p>
              </div>
              <Switch
                checked={settings.emergencyMode}
                onCheckedChange={(checked) => handleSettingChange('emergencyMode', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderBlockedUsers = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <UserX className="w-5 h-5 text-primary" />
          Blocked Users
        </h3>
        <Badge variant="secondary">{blockedUsers.length}</Badge>
      </div>

      {blockedUsers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-medium mb-2">No blocked users</h4>
            <p className="text-sm text-muted-foreground">
              Users you block will appear here. You can unblock them anytime.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {blockedUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserX className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">{user.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Blocked {user.blockedDate.toLocaleDateString()}</span>
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {user.reason}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUnblock(user.id, user.name)}
                  >
                    Unblock
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderHelp = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          Need Help?
        </h3>
        
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">How to report someone?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                During a call, tap the flag icon or use the "Report" button after the call ends. 
                Choose the appropriate reason and provide details.
              </p>
              <Badge variant="secondary" className="text-xs">Safety</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">What happens when I block someone?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Blocked users cannot match with you again. They won't be notified that you blocked them.
              </p>
              <Badge variant="secondary" className="text-xs">Privacy</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Emergency mode features</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Enables stricter content filtering, requires verified users only, and adds extra safety prompts.
              </p>
              <Badge variant="secondary" className="text-xs">Advanced</Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <h4 className="font-semibold text-blue-700 mb-2">Still need help?</h4>
          <p className="text-sm text-blue-600 mb-3">
            Contact our support team if you're experiencing issues or need additional assistance.
          </p>
          <Button variant="outline" className="w-full">
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Safety Center
          </h1>
          <p className="text-muted-foreground">Your safety and privacy are our top priority</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1">
          <Button
            variant={activeTab === 'guidelines' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('guidelines')}
            className="flex-1"
          >
            Guidelines
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('settings')}
            className="flex-1"
          >
            Settings
          </Button>
          <Button
            variant={activeTab === 'blocked' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('blocked')}
            className="flex-1"
          >
            Blocked
          </Button>
          <Button
            variant={activeTab === 'help' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('help')}
            className="flex-1"
          >
            Help
          </Button>
        </div>

        {/* Tab Content */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          {activeTab === 'guidelines' && renderGuidelines()}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'blocked' && renderBlockedUsers()}
          {activeTab === 'help' && renderHelp()}
        </ScrollArea>
      </div>
    </div>
  );
};