import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Star, 
  Heart,
  MessageCircle,
  Flag,
  UserX,
  SkipForward,
  RefreshCw,
  Home,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Zap,
  Gift,
  Share2,
  Users,
  Award,
  AlertTriangle
} from 'lucide-react';

interface CallPartner {
  id: string;
  name: string;
  age: number;
  location: string;
  avatar?: string;
  interests: string[];
  isVerified: boolean;
  isPremium: boolean;
}

interface CallStats {
  duration: number;
  quality: 'excellent' | 'good' | 'poor';
  wasLiked: boolean;
  receivedLike: boolean;
}

interface FeedbackProps {
  partner: CallPartner;
  callStats: CallStats;
  onRating: (rating: number) => void;
  onReport: (reason: string, details?: string) => void;
  onBlock: () => void;
  onAddFriend: () => void;
  onFindNext: () => void;
  onGoHome: () => void;
  onShare: () => void;
}

const REPORT_REASONS = [
  { id: 'inappropriate', label: 'Inappropriate behavior', icon: AlertTriangle },
  { id: 'harassment', label: 'Harassment', icon: UserX },
  { id: 'spam', label: 'Spam or advertising', icon: Flag },
  { id: 'fake', label: 'Fake profile', icon: Users },
  { id: 'underage', label: 'Appears underage', icon: AlertTriangle },
  { id: 'other', label: 'Other', icon: Flag }
];

export const PostCallFeedback: React.FC<FeedbackProps> = ({
  partner,
  callStats,
  onRating,
  onReport,
  onBlock,
  onAddFriend,
  onFindNext,
  onGoHome,
  onShare
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [hasRated, setHasRated] = useState(false);
  const { toast } = useToast();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRating = (newRating: number) => {
    setRating(newRating);
    setHasRated(true);
    onRating(newRating);
    
    toast({
      title: "Thanks for your feedback!",
      description: `You rated this call ${newRating} star${newRating !== 1 ? 's' : ''}`,
    });
  };

  const handleReport = () => {
    if (!selectedReportReason) {
      toast({
        title: "Please select a reason",
        description: "Choose why you're reporting this user",
        variant: "destructive"
      });
      return;
    }

    onReport(selectedReportReason, reportDetails);
    setShowReportDialog(false);
    
    toast({
      title: "Report submitted",
      description: "Thank you for helping keep our community safe",
    });
  };

  const getCallQualityColor = () => {
    switch (callStats.quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getCallQualityText = () => {
    switch (callStats.quality) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'poor': return 'Poor';
      default: return 'Unknown';
    }
  };

  if (showReportDialog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Flag className="w-5 h-5" />
              Report User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Why are you reporting this user?</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {REPORT_REASONS.map((reason) => {
                  const Icon = reason.icon;
                  return (
                    <Button
                      key={reason.id}
                      variant={selectedReportReason === reason.id ? "default" : "outline"}
                      className="justify-start h-12"
                      onClick={() => setSelectedReportReason(reason.id)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {reason.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="report-details">Additional details (optional)</Label>
              <Textarea
                id="report-details"
                placeholder="Please provide more information..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowReportDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReport}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Submit Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Call Ended</h1>
          <p className="text-muted-foreground">How was your conversation?</p>
        </div>

        {/* Partner Info Card */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <Avatar className="w-20 h-20 mx-auto mb-3">
                <AvatarImage src={partner.avatar} />
                <AvatarFallback className="text-xl">
                  {partner.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex items-center justify-center gap-2 mb-2">
                <h3 className="text-xl font-semibold">{partner.name}, {partner.age}</h3>
                {partner.isVerified && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Verified
                  </Badge>
                )}
                {partner.isPremium && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                    Premium
                  </Badge>
                )}
              </div>
              
              <p className="text-muted-foreground mb-3">{partner.location}</p>
              
              {/* Mutual Actions */}
              <div className="flex justify-center gap-4 mb-4">
                {callStats.wasLiked && (
                  <div className="flex items-center gap-1 text-red-500">
                    <Heart className="w-4 h-4 fill-current" />
                    <span className="text-sm">You liked</span>
                  </div>
                )}
                {callStats.receivedLike && (
                  <div className="flex items-center gap-1 text-red-500">
                    <Heart className="w-4 h-4 fill-current" />
                    <span className="text-sm">They liked you</span>
                  </div>
                )}
              </div>

              {/* Interests */}
              {partner.interests.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1">
                  {partner.interests.slice(0, 4).map((interest) => (
                    <Badge key={interest} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Call Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Duration</span>
                </div>
                <div className="text-lg font-semibold">{formatDuration(callStats.duration)}</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Quality</span>
                </div>
                <div className={`text-lg font-semibold ${getCallQualityColor()}`}>
                  {getCallQualityText()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rating */}
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold mb-4">Rate this conversation</h3>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => handleRating(star)}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {hasRated && (
              <p className="text-sm text-muted-foreground">
                Thanks for rating! This helps us improve matches.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={onAddFriend}
                className="h-12 flex flex-col gap-1"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs">Add Friend</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onShare}
                className="h-12 flex flex-col gap-1"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-xs">Share</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Actions */}
        <div className="space-y-3">
          <Button 
            onClick={onFindNext}
            className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Find Next Match
          </Button>

          <Button 
            variant="outline" 
            onClick={onGoHome}
            className="w-full h-12"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Home
          </Button>
        </div>

        {/* Report Actions */}
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex justify-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowReportDialog(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Flag className="w-4 h-4 mr-2" />
                Report
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onBlock}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <UserX className="w-4 h-4 mr-2" />
                Block
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground mt-2">
              Help us keep the community safe
            </p>
          </CardContent>
        </Card>

        {/* Achievements/Rewards (if applicable) */}
        {callStats.duration > 300 && ( // 5+ minute calls
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <h4 className="font-semibold text-yellow-700 mb-1">Great Connection!</h4>
              <p className="text-sm text-yellow-600">
                You earned +10 XP for a meaningful conversation
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <ThumbsUp className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-700 mb-1">Pro Tip</h4>
                <p className="text-sm text-blue-600">
                  {rating >= 4 
                    ? "Great conversations happen when you're genuinely interested in others!"
                    : "Try asking open-ended questions to make conversations more engaging!"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};