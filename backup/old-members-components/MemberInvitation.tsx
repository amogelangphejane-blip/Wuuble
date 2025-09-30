import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Link, 
  UserPlus, 
  Copy, 
  Check, 
  Send, 
  Users,
  Crown,
  Shield,
  Calendar,
  Clock,
  X
} from 'lucide-react';
import { MemberInvitation as MemberInvitationType, MemberInviteRequest } from '@/types/members';
import { MemberService } from '@/services/memberService';
import { useToast } from '@/hooks/use-toast';

interface MemberInvitationProps {
  communityId: string;
  communityName: string;
  isCreator?: boolean;
  canInvite?: boolean;
  onInviteSent?: (invitation: MemberInvitationType) => void;
}

const MemberInvitation: React.FC<MemberInvitationProps> = ({
  communityId,
  communityName,
  isCreator = false,
  canInvite = false,
  onInviteSent
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('email');
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Email invitation form
  const [emailForm, setEmailForm] = useState({
    emails: [''],
    role: 'member' as 'member' | 'moderator',
    message: ''
  });

  // Generated invite link
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [linkExpiry, setLinkExpiry] = useState('7'); // days

  // Recent invitations
  const [recentInvitations, setRecentInvitations] = useState<MemberInvitationType[]>([]);

  const addEmailField = () => {
    setEmailForm(prev => ({
      ...prev,
      emails: [...prev.emails, '']
    }));
  };

  const removeEmailField = (index: number) => {
    setEmailForm(prev => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index)
    }));
  };

  const updateEmail = (index: number, value: string) => {
    setEmailForm(prev => ({
      ...prev,
      emails: prev.emails.map((email, i) => i === index ? value : email)
    }));
  };

  const validateEmails = () => {
    const validEmails = emailForm.emails.filter(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return email.trim() && emailRegex.test(email.trim());
    });
    return validEmails;
  };

  const sendEmailInvitations = async () => {
    const validEmails = validateEmails();
    if (validEmails.length === 0) {
      toast({
        title: "Invalid emails",
        description: "Please enter at least one valid email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const invitations = await Promise.all(
        validEmails.map(email => 
          MemberService.inviteMember(communityId, {
            email: email.trim(),
            role: emailForm.role,
            message: emailForm.message
          })
        )
      );

      setRecentInvitations(prev => [...invitations, ...prev]);
      onInviteSent?.(invitations[0]);
      
      toast({
        title: "Invitations sent!",
        description: `Successfully sent ${invitations.length} invitation${invitations.length > 1 ? 's' : ''}.`
      });

      // Reset form
      setEmailForm({
        emails: [''],
        role: 'member',
        message: ''
      });

    } catch (error) {
      console.error('Error sending invitations:', error);
      toast({
        title: "Error",
        description: "Failed to send invitations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInviteLink = async () => {
    setLoading(true);
    try {
      const invitation = await MemberService.inviteMember(communityId, {
        email: '', // Empty for link-based invitations
        role: emailForm.role
      });

      const link = `${window.location.origin}/invite/${invitation.invite_code}`;
      setInviteLink(link);
      setRecentInvitations(prev => [invitation, ...prev]);

      toast({
        title: "Invite link generated!",
        description: "Share this link with people you want to invite."
      });

    } catch (error) {
      console.error('Error generating invite link:', error);
      toast({
        title: "Error",
        description: "Failed to generate invite link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      toast({
        title: "Link copied!",
        description: "Invite link has been copied to your clipboard."
      });
      
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (!canInvite) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Members to {communityName}
          </DialogTitle>
          <DialogDescription>
            Invite new members via email or share an invite link.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Invite
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Share Link
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent
            </TabsTrigger>
          </TabsList>

          {/* Email Invitation Tab */}
          <TabsContent value="email" className="space-y-4">
            <div className="space-y-4">
              {/* Email Addresses */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Email Addresses</Label>
                <div className="space-y-2">
                  {emailForm.emails.map((email, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => updateEmail(index, e.target.value)}
                        className="flex-1"
                      />
                      {emailForm.emails.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmailField(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addEmailField}
                    className="w-full"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Another Email
                  </Button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Role</Label>
                <Select 
                  value={emailForm.role} 
                  onValueChange={(value: 'member' | 'moderator') => 
                    setEmailForm(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        Member
                      </div>
                    </SelectItem>
                    {isCreator && (
                      <SelectItem value="moderator">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          Moderator
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Personal Message */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Personal Message (Optional)
                </Label>
                <Textarea
                  placeholder="Add a personal message to your invitation..."
                  value={emailForm.message}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Send Button */}
              <Button
                onClick={sendEmailInvitations}
                disabled={loading || validateEmails().length === 0}
                className="w-full"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Sending...
                  </div>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send {validateEmails().length} Invitation{validateEmails().length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Share Link Tab */}
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-4">
              {/* Role Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Default Role for Link Users</Label>
                <Select 
                  value={emailForm.role} 
                  onValueChange={(value: 'member' | 'moderator') => 
                    setEmailForm(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        Member
                      </div>
                    </SelectItem>
                    {isCreator && (
                      <SelectItem value="moderator">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          Moderator
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Link Expiry */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Link Expires In</Label>
                <Select value={linkExpiry} onValueChange={setLinkExpiry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Day</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Link Button */}
              {!inviteLink && (
                <Button
                  onClick={generateInviteLink}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Generating...
                    </div>
                  ) : (
                    <>
                      <Link className="h-4 w-4 mr-2" />
                      Generate Invite Link
                    </>
                  )}
                </Button>
              )}

              {/* Generated Link */}
              {inviteLink && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Invite Link Generated</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Input
                        value={inviteLink}
                        readOnly
                        className="flex-1 bg-transparent border-none"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyInviteLink}
                        className="flex-shrink-0"
                      >
                        {copiedLink ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      This link will expire in {linkExpiry === 'never' ? 'never' : `${linkExpiry} day${linkExpiry !== '1' ? 's' : ''}`}.
                      Share it with people you want to invite to your community.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setInviteLink(null)}
                      className="w-full"
                    >
                      Generate New Link
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Recent Invitations Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Recent Invitations</h4>
                <Badge variant="secondary">{recentInvitations.length} total</Badge>
              </div>
              
              {recentInvitations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No invitations sent yet.</p>
                  <p className="text-sm">Start inviting members using the email or link tabs.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {recentInvitations.map((invitation) => (
                    <Card key={invitation.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {invitation.email ? (
                              <Mail className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Link className="h-4 w-4 text-green-500" />
                            )}
                            <span className="font-medium text-sm">
                              {invitation.email || 'Invite Link'}
                            </span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={invitation.role === 'moderator' ? 'text-blue-600' : 'text-gray-600'}
                          >
                            {invitation.role === 'moderator' ? (
                              <Shield className="h-3 w-3 mr-1" />
                            ) : (
                              <Users className="h-3 w-3 mr-1" />
                            )}
                            {invitation.role}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(invitation.created_at)}</span>
                          {invitation.used_at ? (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              Used
                            </Badge>
                          ) : isExpired(invitation.expires_at) ? (
                            <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                              Expired
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MemberInvitation;