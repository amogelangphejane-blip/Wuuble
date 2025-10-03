import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Info, 
  Calendar, 
  Users, 
  Globe, 
  Link, 
  Shield, 
  Target,
  Mail,
  Twitter,
  Github,
  MessageSquare,
  Edit,
  CreditCard,
  Heart,
  Wallet
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PatreonStyleMembership } from './PatreonStyleMembership';
import { CreatorEarningsDashboard } from './CreatorEarningsDashboard';
import { MembershipTierManager } from './MembershipTierManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CommunityAboutSectionProps {
  community: {
    id: string;
    name: string;
    description: string;
    created_at: string;
    member_count: number;
    category?: string;
    rules?: string;
    location?: string;
    website?: string;
    social_links?: {
      twitter?: string;
      discord?: string;
      github?: string;
    };
    creator_id?: string;
  };
  isOwner: boolean;
  creatorName?: string;
}

export const CommunityAboutSection: React.FC<CommunityAboutSectionProps> = ({
  community,
  isOwner,
  creatorName
}) => {
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [billingTab, setBillingTab] = useState<'membership' | 'earnings' | 'manage'>('membership');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOpenBilling = (tab: 'membership' | 'earnings' | 'manage') => {
    setBillingTab(tab);
    setShowBillingDialog(true);
  };

  const handleTiersUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">About {community.name}</h2>
        <div className="flex gap-2">
          {isOwner && (
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              {community.description}
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Founded {formatDistanceToNow(new Date(community.created_at), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-500" />
                <span>{community.member_count} members</span>
              </div>
              {community.location && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span>{community.location}</span>
                </div>
              )}
              {community.category && (
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-gray-500" />
                  <Badge variant="outline">{community.category}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Community Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Community Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {community.rules ? (
              <div className="space-y-2">
                {community.rules.split('\n').map((rule, index) => (
                  <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    {rule}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No specific rules set. Please be respectful to all members.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Links & Social */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Links & Social
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {community.website && (
              <a
                href={community.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm">Website</span>
              </a>
            )}
            
            {community.social_links?.twitter && (
              <a
                href={community.social_links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <Twitter className="w-4 h-4" />
                <span className="text-sm">Twitter</span>
              </a>
            )}
            
            {community.social_links?.discord && (
              <a
                href={community.social_links.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">Discord</span>
              </a>
            )}
            
            {community.social_links?.github && (
              <a
                href={community.social_links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <Github className="w-4 h-4" />
                <span className="text-sm">GitHub</span>
              </a>
            )}

            {!community.website && !community.social_links && (
              <p className="text-sm text-gray-500">
                No external links available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Subscription & Billing */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-purple-600" />
              Subscription & Billing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Support this community and get exclusive benefits
            </p>
            
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => handleOpenBilling('membership')}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Become a Patron
            </Button>

            {isOwner && (
              <>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleOpenBilling('manage')}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Manage Tiers
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleOpenBilling('earnings')}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  View Earnings
                </Button>
              </>
            )}

            <div className="pt-3 border-t text-xs text-gray-500 text-center">
              70% to creator • 30% platform fee
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              For inquiries about this community, please contact the moderators through the discussion board.
            </p>
            <Button className="mt-4 w-full" variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              Message Moderators
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Community Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Community Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Foster a supportive environment for learning and growth
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Share knowledge and expertise among members
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Build meaningful connections and collaborations
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Stay updated with the latest trends and developments
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Subscription & Billing Dialog */}
      <Dialog open={showBillingDialog} onOpenChange={setShowBillingDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {billingTab === 'membership' ? 'Support This Community' : 'Creator Earnings'}
            </DialogTitle>
          </DialogHeader>
          
          {isOwner ? (
            <Tabs value={billingTab} onValueChange={(v: any) => setBillingTab(v)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="membership">
                  <Heart className="w-4 h-4 mr-2" />
                  Membership
                </TabsTrigger>
                <TabsTrigger value="manage">
                  <Edit className="w-4 h-4 mr-2" />
                  Manage Tiers
                </TabsTrigger>
                <TabsTrigger value="earnings">
                  <Wallet className="w-4 h-4 mr-2" />
                  Earnings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="membership" className="mt-6">
                <PatreonStyleMembership
                  key={refreshKey}
                  communityId={community.id}
                  communityName={community.name}
                  creatorName={creatorName}
                />
              </TabsContent>

              <TabsContent value="manage" className="mt-6">
                <MembershipTierManager
                  communityId={community.id}
                  onTiersUpdated={handleTiersUpdated}
                />
              </TabsContent>

              <TabsContent value="earnings" className="mt-6">
                <CreatorEarningsDashboard />
              </TabsContent>
            </Tabs>
          ) : (
            <PatreonStyleMembership
              key={refreshKey}
              communityId={community.id}
              communityName={community.name}
              creatorName={creatorName}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};