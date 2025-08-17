import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  MessageCircle,
  TrendingUp,
  Target,
  BookOpen,
  Award,
  Users,
  BarChart3,
  Lightbulb,
  Heart,
  Eye,
  Handshake,
  Zap,
  ChevronRight,
  Play,
  CheckCircle,
  Clock,
  Star,
  ArrowRight,
  RefreshCw,
  Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePsychologyTraining } from '@/hooks/usePsychologyTraining';
import { TrainingCategory, AnalysisFocus, TrainingModule } from '@/types/psychology-training';
import { toast } from 'sonner';

interface PsychologyTrainingDashboardProps {
  userId: string;
  communityId: string;
}

export const PsychologyTrainingDashboard: React.FC<PsychologyTrainingDashboardProps> = ({
  userId,
  communityId
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [conversationText, setConversationText] = useState('');
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);

  const {
    profile,
    analyzeConversation,
    analysisHistory,
    modules,
    analytics,
    progress,
    startModule,
    isLoading,
    hasError,
    errors
  } = usePsychologyTraining(userId, communityId);

  const handleAnalyzeConversation = async () => {
    if (!conversationText.trim()) {
      toast.error('Please enter a conversation to analyze');
      return;
    }

    try {
      const analysisRequest = {
        conversation_text: conversationText,
        context: {
          scenario_type: 'general_conversation',
          participants: 2,
          relationship_dynamics: 'neutral',
          emotional_stakes: 'medium' as const,
          time_pressure: false
        },
        analysis_focus: [
          'emotional_intelligence',
          'communication_effectiveness',
          'active_listening',
          'empathy_demonstration'
        ] as AnalysisFocus[],
        user_psychology_profile: profile || undefined
      };

      const result = await analyzeConversation(analysisRequest);
      
      toast.success(`Analysis complete! Overall quality: ${result.overall_assessment.conversation_quality}`);
      setConversationText('');
      setAnalysisDialogOpen(false);
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      toast.error('Failed to analyze conversation. Please try again.');
    }
  };

  const handleStartModule = async (module: TrainingModule) => {
    try {
      await startModule(module.id);
      toast.success(`Started training module: ${module.title}`);
      setSelectedModule(module);
    } catch (error) {
      console.error('Error starting module:', error);
      toast.error('Failed to start training module');
    }
  };

  const getCategoryIcon = (category: TrainingCategory) => {
    const icons = {
      emotional_intelligence: Brain,
      active_listening: MessageCircle,
      empathy_building: Heart,
      conflict_resolution: Handshake,
      persuasion_skills: Target,
      leadership_communication: Users,
      cultural_awareness: Eye,
      nonverbal_communication: Eye,
      storytelling: BookOpen,
      question_asking: Lightbulb,
      feedback_giving: TrendingUp,
      difficult_conversations: Zap
    };
    return icons[category] || Brain;
  };

  const getCategoryColor = (category: TrainingCategory) => {
    const colors = {
      emotional_intelligence: 'bg-blue-500',
      active_listening: 'bg-green-500',
      empathy_building: 'bg-pink-500',
      conflict_resolution: 'bg-orange-500',
      persuasion_skills: 'bg-purple-500',
      leadership_communication: 'bg-indigo-500',
      cultural_awareness: 'bg-teal-500',
      nonverbal_communication: 'bg-cyan-500',
      storytelling: 'bg-amber-500',
      question_asking: 'bg-yellow-500',
      feedback_giving: 'bg-lime-500',
      difficult_conversations: 'bg-red-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const getSkillLevel = (score: number) => {
    if (score >= 0.8) return { level: 'Expert', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 0.6) return { level: 'Advanced', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 0.4) return { level: 'Intermediate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Beginner', color: 'text-red-600', bg: 'bg-red-100' };
  };

  if (hasError) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <Brain className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Training System Error</h3>
            <p className="text-muted-foreground mb-4">
              Unable to load psychology training system. Please try again.
            </p>
            <div className="text-sm text-red-600 space-y-1">
              {errors.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500 rounded-full">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Psychology Training Center</h1>
                <p className="text-muted-foreground">
                  Master human psychology and conversation skills with AI-powered training
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Skill Level</div>
              <div className="text-lg font-semibold">
                {analytics?.overall_progress.skill_level || 'Beginner'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {analytics?.overall_progress.modules_completed || 0}
                </div>
                <div className="text-sm text-muted-foreground">Modules Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {analytics?.overall_progress.average_score.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm text-muted-foreground">Average Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(analytics?.overall_progress.time_invested_hours || 0)}h
                </div>
                <div className="text-sm text-muted-foreground">Time Invested</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Award className="w-8 h-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">
                  #{analytics?.overall_progress.rank_in_community || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Community Rank</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analyze">Analyze</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Psychology Profile Summary */}
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>Your Psychology Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(profile.personality_traits.empathy_level * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Empathy Level</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(profile.emotional_intelligence.self_awareness * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Self Awareness</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(profile.social_skills.active_listening * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Active Listening</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(profile.social_skills.leadership * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Leadership</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Analysis */}
          {analysisHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Recent Conversation Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisHistory.slice(0, 3).map((analysis, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">
                          Quality: {analysis.overall_assessment.conversation_quality}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Effectiveness: {Math.round(analysis.overall_assessment.effectiveness_score * 100)}%
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {analysis.overall_assessment.key_strengths.slice(0, 2).map((strength, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Training */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Recommended Training</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.slice(0, 4).map((module) => {
                  const Icon = getCategoryIcon(module.category);
                  const colorClass = getCategoryColor(module.category);
                  
                  return (
                    <div key={module.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`p-2 ${colorClass} rounded-lg`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{module.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {module.estimated_duration_minutes} min • Level {module.difficulty_level}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStartModule(module)}
                        disabled={isLoading}
                      >
                        Start
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analyze Tab */}
        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Conversation Analysis</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Paste a conversation to get detailed psychological insights and feedback
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your conversation here... (e.g., a chat transcript, email exchange, or dialogue)"
                value={conversationText}
                onChange={(e) => setConversationText(e.target.value)}
                rows={8}
                className="resize-none"
              />
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {conversationText.length} characters
                </div>
                <Button 
                  onClick={handleAnalyzeConversation}
                  disabled={!conversationText.trim() || isLoading}
                  className="flex items-center space-x-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Analyze Conversation</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysisHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-6">
                    {analysisHistory.map((analysis, index) => (
                      <div key={index} className="border-b pb-6 last:border-b-0">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="font-semibold">
                              Quality: {analysis.overall_assessment.conversation_quality}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Effectiveness: {Math.round(analysis.overall_assessment.effectiveness_score * 100)}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Confidence</div>
                            <div className="font-semibold">{Math.round(analysis.confidence_score * 100)}%</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
                            <ul className="space-y-1">
                              {analysis.overall_assessment.key_strengths.map((strength, i) => (
                                <li key={i} className="text-sm flex items-center space-x-2">
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-orange-600 mb-2">Growth Areas</h4>
                            <ul className="space-y-1">
                              {analysis.overall_assessment.primary_growth_areas.map((area, i) => (
                                <li key={i} className="text-sm flex items-center space-x-2">
                                  <Target className="w-3 h-3 text-orange-500" />
                                  <span>{area}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {Object.entries(analysis.skill_scores).map(([skill, score]) => {
                            const skillLevel = getSkillLevel(score);
                            return (
                              <div key={skill} className="text-center p-2 bg-gray-50 rounded">
                                <div className={`text-sm font-medium ${skillLevel.color}`}>
                                  {Math.round(score * 100)}%
                                </div>
                                <div className="text-xs text-muted-foreground capitalize">
                                  {skill.replace('_', ' ')}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {analysis.improvement_recommendations.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Recommendations</h4>
                            <div className="space-y-2">
                              {analysis.improvement_recommendations.slice(0, 3).map((rec, i) => (
                                <div key={i} className="text-sm p-2 bg-blue-50 rounded">
                                  <div className="font-medium">{rec.skill_area}</div>
                                  <div className="text-muted-foreground">{rec.specific_suggestion}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Training Modules</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Personalized training modules based on your psychology profile
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modules.map((module) => {
                  const Icon = getCategoryIcon(module.category);
                  const colorClass = getCategoryColor(module.category);
                  const moduleProgress = progress.find(p => p.module_id === module.id);
                  
                  return (
                    <Card key={module.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 ${colorClass} rounded-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2">{module.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              {module.description}
                            </p>
                            
                            <div className="flex items-center space-x-4 mb-4">
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{module.estimated_duration_minutes} min</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Star className="w-3 h-3" />
                                <span>Level {module.difficulty_level}</span>
                              </div>
                            </div>

                            {moduleProgress && (
                              <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Progress</span>
                                  <span>{Math.round(moduleProgress.progress_percentage)}%</span>
                                </div>
                                <Progress value={moduleProgress.progress_percentage} className="h-2" />
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="capitalize">
                                {module.category.replace('_', ' ')}
                              </Badge>
                              <Button
                                size="sm"
                                onClick={() => handleStartModule(module)}
                                disabled={isLoading}
                                className="flex items-center space-x-1"
                              >
                                {moduleProgress?.status === 'completed' ? (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Review</span>
                                  </>
                                ) : moduleProgress?.status === 'in_progress' ? (
                                  <>
                                    <Play className="w-3 h-3" />
                                    <span>Continue</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3" />
                                    <span>Start</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          {analytics && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Learning Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {analytics.overall_progress.modules_completed}
                      </div>
                      <div className="text-sm text-muted-foreground">Modules Completed</div>
                      <Progress 
                        value={(analytics.overall_progress.modules_completed / analytics.overall_progress.total_modules_available) * 100} 
                        className="mt-2"
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {Math.round(analytics.overall_progress.average_score * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Average Score</div>
                      <Progress value={analytics.overall_progress.average_score * 100} className="mt-2" />
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {analytics.overall_progress.streak_days}
                      </div>
                      <div className="text-sm text-muted-foreground">Day Streak</div>
                      <Progress value={Math.min(analytics.overall_progress.streak_days * 10, 100)} className="mt-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skill Development Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.skill_development_trends.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium capitalize">
                            {trend.skill_name.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {trend.trend_direction === 'improving' ? '📈' : trend.trend_direction === 'declining' ? '📉' : '➡️'} 
                            {' '}{trend.trend_direction}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {Math.round(trend.predicted_future_score * 100)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Predicted</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {profile && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-5 h-5" />
                    <span>Personality Traits</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(profile.personality_traits).map(([trait, score]) => (
                      <div key={trait} className="flex items-center justify-between">
                        <div className="capitalize font-medium">
                          {trait.replace('_', ' ')}
                        </div>
                        <div className="flex items-center space-x-3">
                          <Progress value={score * 100} className="w-32" />
                          <div className="text-sm font-medium w-12">
                            {Math.round(score * 100)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="w-5 h-5" />
                    <span>Emotional Intelligence</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(profile.emotional_intelligence).map(([skill, score]) => (
                      <div key={skill} className="flex items-center justify-between">
                        <div className="capitalize font-medium">
                          {skill.replace('_', ' ')}
                        </div>
                        <div className="flex items-center space-x-3">
                          <Progress value={score * 100} className="w-32" />
                          <div className="text-sm font-medium w-12">
                            {Math.round(score * 100)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Social Skills</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(profile.social_skills).map(([skill, score]) => (
                      <div key={skill} className="flex items-center justify-between">
                        <div className="capitalize font-medium">
                          {skill.replace('_', ' ')}
                        </div>
                        <div className="flex items-center space-x-3">
                          <Progress value={score * 100} className="w-32" />
                          <div className="text-sm font-medium w-12">
                            {Math.round(score * 100)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};