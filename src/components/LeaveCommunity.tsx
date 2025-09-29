import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  LogOut, 
  AlertTriangle, 
  Heart, 
  MessageCircle,
  Users,
  Calendar,
  ArrowRight,
  X
} from 'lucide-react';

interface LeaveCommunityProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  communityName: string;
  onLeave?: () => void;
}

interface LeaveSurvey {
  reason: string;
  feedback: string;
  dataRetention: boolean;
}

const leaveReasons = [
  { id: 'not_active', label: 'Community not active enough', icon: MessageCircle },
  { id: 'too_busy', label: 'Too busy to participate', icon: Calendar },
  { id: 'content_quality', label: 'Content quality not meeting expectations', icon: Heart },
  { id: 'found_better', label: 'Found a better alternative', icon: ArrowRight },
  { id: 'privacy', label: 'Privacy concerns', icon: AlertTriangle },
  { id: 'other', label: 'Other reason', icon: Users }
];

export const LeaveCommunity: React.FC<LeaveCommunityProps> = ({
  isOpen,
  onClose,
  communityId,
  communityName,
  onLeave
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'confirm' | 'survey' | 'processing'>('confirm');
  const [survey, setSurvey] = useState<LeaveSurvey>({
    reason: '',
    feedback: '',
    dataRetention: false
  });
  const [leaving, setLeaving] = useState(false);

  const handleLeave = async () => {
    if (!user) return;

    setLeaving(true);
    setStep('processing');

    try {
      // Remove user from community members
      const { error: memberError } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      // Save exit survey if provided
      if (survey.reason || survey.feedback) {
        const { error: surveyError } = await supabase
          .from('community_exit_surveys')
          .insert({
            community_id: communityId,
            user_id: user.id,
            reason: survey.reason,
            feedback: survey.feedback,
            data_retention_requested: survey.dataRetention,
            left_at: new Date().toISOString()
          });

        if (surveyError) {
          console.error('Error saving exit survey:', surveyError);
          // Don't fail the leave operation for survey errors
        }
      }

      // Optionally remove user's posts/comments if they don't want data retained
      if (!survey.dataRetention) {
        // In a real app, you might want to anonymize rather than delete
        // This is just a placeholder for the data retention logic
      }

      toast({
        title: "Left Community",
        description: `You have successfully left ${communityName}`,
      });

      onLeave?.();
      onClose();
    } catch (error) {
      console.error('Error leaving community:', error);
      toast({
        title: "Error",
        description: "Failed to leave community. Please try again.",
        variant: "destructive"
      });
      setStep('confirm');
    } finally {
      setLeaving(false);
    }
  };

  const handleReasonSelect = (reasonId: string) => {
    setSurvey(prev => ({ ...prev, reason: reasonId }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-red-600">
                <LogOut className="w-5 h-5" />
                <span>Leave Community</span>
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to leave "{communityName}"?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-800">What happens when you leave:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• You'll lose access to community content</li>
                      <li>• Your posts and comments will remain visible</li>
                      <li>• You won't receive any more notifications</li>
                      <li>• You can rejoin anytime if the community is public</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => setStep('survey')}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Continue
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'survey' && (
          <>
            <DialogHeader>
              <DialogTitle>Help us improve</DialogTitle>
              <DialogDescription>
                Before you go, would you mind sharing why you're leaving? (Optional)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">What's your main reason for leaving?</Label>
                <div className="mt-2 space-y-2">
                  {leaveReasons.map((reason) => (
                    <div
                      key={reason.id}
                      onClick={() => handleReasonSelect(reason.id)}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        survey.reason === reason.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <reason.icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{reason.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="feedback">Additional feedback (optional)</Label>
                <Textarea
                  id="feedback"
                  value={survey.feedback}
                  onChange={(e) => setSurvey(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="Let us know how we can improve..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="dataRetention"
                  checked={survey.dataRetention}
                  onCheckedChange={(checked) => 
                    setSurvey(prev => ({ ...prev, dataRetention: !!checked }))
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="dataRetention"
                    className="text-sm font-normal leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Keep my posts and comments visible
                  </Label>
                  <p className="text-xs text-gray-500">
                    Uncheck this if you want your content removed
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep('confirm')} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleLeave} 
                  disabled={leaving}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave Community
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'processing' && (
          <>
            <DialogHeader>
              <DialogTitle>Leaving Community...</DialogTitle>
              <DialogDescription>
                Please wait while we process your request.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};