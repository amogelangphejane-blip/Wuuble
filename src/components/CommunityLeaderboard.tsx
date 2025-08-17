import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  TrendingUp, 
  MessageCircle, 
  Video, 
  Users, 
  Star,
  Crown,
  Medal,
  Award,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
  Bot,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLeaderboard, useUserProgress, useLeaderboardQuery, useFeedbackGenerator } from '@/hooks/useLeaderboard';
import { LeaderboardEntry } from '@/types/leaderboard';
import { toast } from 'sonner';

interface CommunityLeaderboardProps {
  communityId: string;
}

export const CommunityLeaderboard: React.FC<CommunityLeaderboardProps> = ({ communityId }) => {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [askDialogOpen, setAskDialogOpen] = useState(false);
  const [question, setQuestion] = useState('');
  
  const { leaderboard, userPosition, isLoading, refreshLeaderboard } = useLeaderboard(communityId);
  const { progress, feedback } = useUserProgress(communityId);
  const { askQuestion, queryHistory, isLoading: queryLoading } = useLeaderboardQuery(communityId);
  const { generateFeedback, isGenerating } = useFeedbackGenerator(communityId);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    
    try {
      console.log('[Community Leaderboard] Asking question:', {
        question,
        communityId,
        userAuthenticated: !!user?.id
      });
      
      const response = await askQuestion(question);
      
      console.log('[Community Leaderboard] Received response:', {
        hasResponse: !!response.response,
        intent: response.intent,
        confidence: response.confidence
      });
      
      toast.success('Got your answer!');
      setQuestion('');
    } catch (error) {
      console.error('[Community Leaderboard] Error asking question:', {
        error: error instanceof Error ? error.message : String(error),
        question: question.substring(0, 50),
        communityId,
        userId: user?.id
      });
      
      // Show more helpful error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to process question: ${errorMessage}. Please try again.`);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <Trophy className="w-4 h-4 text-blue-500" />;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank <= 3) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rank <= 10) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    if (rank <= 25) return 'bg-gradient-to-r from-green-400 to-green-600';
    return 'bg-gradient-to-r from-gray-400 to-gray-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span>Loading leaderboard...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with AI Assistant */}
      <Card className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6" />
                <span>AI-Powered Community Leaderboard</span>
              </CardTitle>
              <p className="text-blue-100 mt-2">
                Track your engagement, get personalized feedback, and ask AI about your progress
              </p>
            </div>
            <div className="flex space-x-2">
              <Dialog open={askDialogOpen} onOpenChange={setAskDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="bg-white/20 hover:bg-white/30">
                    <Bot className="w-4 h-4 mr-2" />
                    Ask AI
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <Bot className="w-5 h-5" />
                      <span>Ask About Your Progress</span>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Why is my rank low? How can I improve?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                      />
                      <Button 
                        onClick={handleAskQuestion}
                        disabled={queryLoading || !question.trim()}
                      >
                        {queryLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Ask'}
                      </Button>
                    </div>
                    
                    {/* Query History */}
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {queryHistory.map((query, index) => (
                          <div key={query.id} className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium text-sm text-gray-700">{query.query_text}</p>
                            <p className="text-sm text-gray-600 mt-1">{query.ai_response}</p>
                            <div className="flex justify-between items-center mt-2">
                              <Badge variant="outline" className="text-xs">
                                {query.query_intent}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {new Date(query.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="secondary" 
                onClick={generateFeedback}
                disabled={isGenerating}
                className="bg-white/20 hover:bg-white/30"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                <span className="ml-2">Get Feedback</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="progress">My Progress</TabsTrigger>
          <TabsTrigger value="feedback">AI Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          {/* User's Position Card */}
          {userPosition && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getRankBadgeColor(userPosition.rank)}`}>
                        #{userPosition.rank}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Your Position</h3>
                        <p className="text-gray-600">
                          Score: {userPosition.performance_score.toFixed(0)} points
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-2">
                        {getRankIcon(userPosition.rank)}
                        <span className="font-medium">
                          {userPosition.rank <= 10 ? 'Top Performer' : 
                           userPosition.rank <= 25 ? 'Great Contributor' : 
                           'Community Member'}
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={refreshLeaderboard}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Leaderboard List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Community Leaders</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <motion.div
                    key={entry.user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <LeaderboardEntryCard
                      entry={entry}
                      isExpanded={expandedUser === entry.user.id}
                      onToggle={() => setExpandedUser(
                        expandedUser === entry.user.id ? null : entry.user.id
                      )}
                      getRankIcon={getRankIcon}
                      getRankBadgeColor={getRankBadgeColor}
                    />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <ProgressTab progress={progress} />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <FeedbackTab feedback={feedback} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Sub-components
const LeaderboardEntryCard: React.FC<{
  entry: LeaderboardEntry;
  isExpanded: boolean;
  onToggle: () => void;
  getRankIcon: (rank: number) => React.ReactNode;
  getRankBadgeColor: (rank: number) => string;
}> = ({ entry, isExpanded, onToggle, getRankIcon, getRankBadgeColor }) => {
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getRankBadgeColor(entry.rank)}`}>
            #{entry.rank}
          </div>
          
          <Avatar>
            <AvatarImage src={entry.user.avatar_url} />
            <AvatarFallback>
              {entry.user.full_name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h4 className="font-medium">{entry.user.full_name}</h4>
            <p className="text-sm text-gray-500">@{entry.user.username}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="font-semibold">{entry.performance_score.toFixed(0)}</div>
            <div className="text-sm text-gray-500">points</div>
          </div>
          
          <div className="flex items-center space-x-1">
            {getRankIcon(entry.rank)}
            {entry.rank <= 3 && <Sparkles className="w-4 h-4 text-yellow-500" />}
          </div>
          
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <MessageCircle className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                <div className="font-medium">{entry.score_breakdown.chat_score.toFixed(0)}</div>
                <div className="text-xs text-gray-500">Chat Score</div>
              </div>
              
              <div className="text-center">
                <Video className="w-5 h-5 mx-auto mb-1 text-green-500" />
                <div className="font-medium">{entry.score_breakdown.video_call_score.toFixed(0)}</div>
                <div className="text-xs text-gray-500">Video Calls</div>
              </div>
              
              <div className="text-center">
                <Users className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                <div className="font-medium">{entry.score_breakdown.participation_score.toFixed(0)}</div>
                <div className="text-xs text-gray-500">Participation</div>
              </div>
              
              <div className="text-center">
                <Star className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                <div className="font-medium">{entry.score_breakdown.quality_multiplier.toFixed(1)}x</div>
                <div className="text-xs text-gray-500">Quality</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProgressTab: React.FC<{ progress: any }> = ({ progress }) => {
  if (!progress) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No progress data available yet. Start engaging with the community!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Current Score</h4>
              <div className="text-3xl font-bold text-blue-600">
                {progress.current_score.toFixed(0)}
              </div>
              <p className="text-sm text-gray-500">Performance Points</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Strengths</h4>
              <div className="space-y-1">
                {progress.strengths.map((strength: string, index: number) => (
                  <Badge key={index} variant="secondary" className="mr-2">
                    {strength}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium mb-2">Areas for Improvement</h4>
            <div className="space-y-1">
              {progress.improvement_areas.map((area: string, index: number) => (
                <Badge key={index} variant="outline" className="mr-2">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const FeedbackTab: React.FC<{ feedback: any[] }> = ({ feedback }) => {
  if (!feedback || feedback.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No AI feedback available yet. Generate some feedback to get personalized insights!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {feedback.map((item) => (
        <Card key={item.id} className={`${!item.is_read ? 'border-blue-200 bg-blue-50' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant={
                    item.feedback_type === 'achievement_recognition' ? 'default' :
                    item.feedback_type === 'improvement_suggestion' ? 'secondary' :
                    'outline'
                  }>
                    {item.feedback_type.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-3">{item.message}</p>
                
                {item.suggested_actions && item.suggested_actions.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">Suggested Actions:</h5>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {item.suggested_actions.map((action: string, index: number) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};