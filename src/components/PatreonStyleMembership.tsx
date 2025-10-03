import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PatronService, MembershipTier } from '@/services/patronService';
import { CardPaymentDialog } from './CardPaymentDialog';
import { 
  Heart, 
  Crown, 
  Star, 
  Zap, 
  Check, 
  Loader2,
  Users,
  TrendingUp,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PatreonStyleMembershipProps {
  communityId: string;
  communityName: string;
  creatorName?: string;
}

export const PatreonStyleMembership: React.FC<PatreonStyleMembershipProps> = ({
  communityId,
  communityName,
  creatorName,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentMembership, setCurrentMembership] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [communityId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const tiersData = await PatronService.getMembershipTiers(communityId);
      setTiers(tiersData);

      // Check if user has active membership
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: subscription } = await supabase
          .from('community_member_subscriptions')
          .select('*, tier:membership_tiers(*)')
          .eq('community_id', communityId)
          .eq('user_id', user.id)
          .in('status', ['active', 'trial'])
          .single();

        setCurrentMembership(subscription);
      }
    } catch (error) {
      console.error('Error loading membership data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTier = (tier: MembershipTier) => {
    setSelectedTier(tier);
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentDialog(false);
    await loadData();
    toast({
      title: 'Welcome!',
      description: `You're now a ${selectedTier?.name} member!`,
    });
  };

  const getTierIcon = (tier: MembershipTier) => {
    const iconMap: Record<string, any> = {
      'crown': Crown,
      'star': Star,
      'zap': Zap,
      'heart': Heart,
      'shield': Shield,
    };
    return iconMap[tier.icon || 'heart'] || Heart;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          Support {communityName}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Become a patron and get exclusive benefits while supporting {creatorName || 'the creator'}.
          <span className="block mt-2 text-sm font-medium text-purple-600 dark:text-purple-400">
            70% goes directly to the creator • 30% platform fee
          </span>
        </p>
      </div>

      {/* Current Membership */}
      {currentMembership && (
        <Card className="border-2 border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-lg">You're a {currentMembership.tier?.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Thank you for your support! 💜
                  </p>
                </div>
              </div>
              <Badge className="bg-green-500 text-white">Active</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Membership Tiers */}
      {tiers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No membership tiers available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => {
            const Icon = getTierIcon(tier);
            const isCurrentTier = currentMembership?.tier_id === tier.id;
            const isFull = tier.max_members && tier.current_members >= tier.max_members;

            return (
              <Card
                key={tier.id}
                className={`relative transition-all hover:shadow-xl ${
                  tier.is_highlighted
                    ? 'border-2 border-purple-500 shadow-lg scale-105'
                    : 'border-2 hover:border-purple-300'
                } ${isCurrentTier ? 'ring-2 ring-green-500' : ''}`}
              >
                {tier.is_highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: tier.color || '#8B5CF6' }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  
                  {tier.description && (
                    <CardDescription className="mt-2">{tier.description}</CardDescription>
                  )}

                  <div className="mt-4">
                    <div className="text-4xl font-bold">${tier.price_monthly}</div>
                    <div className="text-sm text-gray-500">per month</div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Benefits */}
                  <div className="space-y-2">
                    {tier.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Member count */}
                  {tier.max_members && (
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{tier.current_members} / {tier.max_members} members</span>
                      </div>
                      {isFull && (
                        <Badge variant="secondary" className="text-xs">Full</Badge>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    className="w-full mt-4"
                    variant={tier.is_highlighted ? 'default' : 'outline'}
                    onClick={() => handleSelectTier(tier)}
                    disabled={isCurrentTier || isFull}
                    style={
                      tier.is_highlighted
                        ? {
                            background: `linear-gradient(to right, ${tier.color || '#8B5CF6'}, #EC4899)`,
                          }
                        : undefined
                    }
                  >
                    {isCurrentTier ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Current Tier
                      </>
                    ) : isFull ? (
                      'Tier Full'
                    ) : (
                      <>
                        <Heart className="w-4 h-4 mr-2" />
                        Become a Patron
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Revenue Split Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <TrendingUp className="w-6 h-6 text-purple-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">How Your Support Helps</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                When you become a patron, <strong>70% of your contribution goes directly to the creator</strong> to help
                them create more amazing content. The remaining 30% covers platform fees, payment processing, and infrastructure costs.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-600">70%</div>
                  <div className="text-xs text-gray-500">To Creator</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">30%</div>
                  <div className="text-xs text-gray-500">Platform Fee</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      {selectedTier && (
        <CardPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          tier={selectedTier}
          communityId={communityId}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
