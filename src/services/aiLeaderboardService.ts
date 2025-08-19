import { 
  QualityMetrics, 
  AnalyzeChatMessageRequest, 
  AnalyzeChatMessageResponse,
  GenerateFeedbackRequest,
  GenerateFeedbackResponse,
  ProcessLeaderboardQueryRequest,
  ProcessLeaderboardQueryResponse,
  QueryIntent,
  FeedbackType,
  UserActivity,
  UserScore
} from '@/types/leaderboard';

// AI Service for Leaderboard System
// This service provides AI-powered analysis and generation capabilities

export class AILeaderboardService {
  private static instance: AILeaderboardService;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // In a real implementation, these would come from environment variables
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.baseUrl = 'https://api.openai.com/v1';
    
    // Log initialization status
    console.log('[AI Leaderboard Service] Initialized:', {
      hasApiKey: !!this.apiKey,
      usingMockMode: !this.apiKey
    });
  }

  public static getInstance(): AILeaderboardService {
    if (!AILeaderboardService.instance) {
      AILeaderboardService.instance = new AILeaderboardService();
    }
    return AILeaderboardService.instance;
  }

  /**
   * Analyze chat message for quality metrics using AI
   */
  async analyzeChatMessage(request: AnalyzeChatMessageRequest): Promise<AnalyzeChatMessageResponse> {
    try {
      // For now, we'll use a mock implementation with realistic scoring
      // In production, this would call OpenAI's API or a custom NLP model
      const analysis = await this.mockAnalyzeChatMessage(request);
      return analysis;
    } catch (error) {
      console.error('Error analyzing chat message:', error);
      return this.getFallbackMessageAnalysis();
    }
  }

  /**
   * Generate personalized feedback using AI
   */
  async generateFeedback(request: GenerateFeedbackRequest): Promise<GenerateFeedbackResponse> {
    try {
      const feedback = await this.mockGenerateFeedback(request);
      return feedback;
    } catch (error) {
      console.error('Error generating feedback:', error);
      return this.getFallbackFeedback(request);
    }
  }

  /**
   * Process user query about leaderboard/progress using conversational AI
   */
  async processLeaderboardQuery(request: ProcessLeaderboardQueryRequest): Promise<ProcessLeaderboardQueryResponse> {
    try {
      console.log('[AI Leaderboard] Processing query:', {
        query: request.query,
        userId: request.user_id,
        communityId: request.community_id,
        hasContext: !!request.context
      });
      
      const response = await this.mockProcessQuery(request);
      
      console.log('[AI Leaderboard] Query processed successfully:', {
        intent: response.intent,
        confidence: response.confidence,
        hasResponse: !!response.response
      });
      
      return response;
    } catch (error) {
      console.error('[AI Leaderboard] Error processing query:', {
        error: error instanceof Error ? error.message : String(error),
        query: request.query,
        userId: request.user_id,
        communityId: request.community_id
      });
      return this.getFallbackQueryResponse(request);
    }
  }

  /**
   * Analyze video call participation and generate quality metrics
   */
  async analyzeVideoCallParticipation(data: {
    speaking_time_minutes: number;
    camera_enabled: boolean;
    reactions_received: number;
    audio_transcript?: string;
  }): Promise<QualityMetrics> {
    try {
      const sentiment_score = data.audio_transcript ? 
        await this.analyzeSentiment(data.audio_transcript) : 0.7;
      
      return {
        sentiment_score,
        engagement_score: this.calculateEngagementScore(data),
        speaking_time_minutes: data.speaking_time_minutes,
        camera_enabled: data.camera_enabled,
        reactions_received: data.reactions_received
      };
    } catch (error) {
      console.error('Error analyzing video call participation:', error);
      return {
        sentiment_score: 0.7,
        engagement_score: 0.6,
        speaking_time_minutes: data.speaking_time_minutes,
        camera_enabled: data.camera_enabled,
        reactions_received: data.reactions_received
      };
    }
  }

  /**
   * Calculate overall impact score for an activity
   */
  calculateImpactScore(activity: Partial<UserActivity>, metrics: QualityMetrics): number {
    let baseScore = 1;
    
    // Base scores by activity type
    const activityScores = {
      'chat_message': 2,
      'post_created': 5,
      'comment_posted': 3,
      'like_given': 1,
      'video_call_joined': 8,
      'help_provided': 10,
      'member_welcomed': 4,
      'event_attended': 6,
      'resource_shared': 7
    };

    baseScore = activityScores[activity.activity_type as keyof typeof activityScores] || 1;

    // Apply quality multipliers
    let qualityMultiplier = 1;
    if (metrics.sentiment_score) qualityMultiplier *= (0.5 + metrics.sentiment_score);
    if (metrics.helpfulness_score) qualityMultiplier *= (0.5 + metrics.helpfulness_score);
    if (metrics.engagement_score) qualityMultiplier *= (0.5 + metrics.engagement_score);

    // Cap the multiplier to prevent extreme scores
    qualityMultiplier = Math.min(qualityMultiplier, 2.5);

    return Math.round(baseScore * qualityMultiplier * 100) / 100;
  }

  // Private helper methods

  private async mockAnalyzeChatMessage(request: AnalyzeChatMessageRequest): Promise<AnalyzeChatMessageResponse> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const message = request.message.toLowerCase();
    
    // Simple sentiment analysis based on keywords
    const positiveWords = ['great', 'awesome', 'excellent', 'love', 'amazing', 'helpful', 'thanks', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'stupid', 'waste', 'boring'];
    const helpfulWords = ['help', 'assist', 'guide', 'explain', 'tutorial', 'answer', 'solution'];
    
    const positiveCount = positiveWords.filter(word => message.includes(word)).length;
    const negativeCount = negativeWords.filter(word => message.includes(word)).length;
    const helpfulCount = helpfulWords.filter(word => message.includes(word)).length;

    const sentiment_score = Math.max(0, Math.min(1, 0.5 + (positiveCount - negativeCount) * 0.15));
    const helpfulness_score = Math.min(1, helpfulCount * 0.3 + 0.1);
    const length_score = Math.min(1, Math.max(0.1, request.message.length / 200));
    const relevance_score = request.context?.topic ? 0.8 : 0.6; // Higher if we have topic context

    const quality_metrics: QualityMetrics = {
      sentiment_score,
      helpfulness_score,
      relevance_score,
      length_score,
      toxicity_score: Math.max(0, negativeCount * 0.2),
      engagement_score: 0.5 // Would be calculated based on actual engagement
    };

    const impact_score = this.calculateImpactScore(
      { activity_type: 'chat_message' }, 
      quality_metrics
    );

    return {
      quality_metrics,
      impact_score,
      suggested_improvements: this.generateImprovementSuggestions(quality_metrics)
    };
  }

  private async mockGenerateFeedback(request: GenerateFeedbackRequest): Promise<GenerateFeedbackResponse> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const { performance_data, recent_activities } = request;
    const rank = performance_data.rank;
    const score = performance_data.performance_score;

    let feedback_type: FeedbackType = 'motivation';
    let message: string;
    let suggested_actions: string[] = [];

    // Determine feedback type and content based on performance
    if (rank <= 10) {
      feedback_type = 'achievement_recognition';
      message = `🏆 Outstanding performance! You're ranked #${rank} in your community with a score of ${score.toFixed(0)}. Your dedication to quality engagement is inspiring others!`;
      suggested_actions = [
        'Share your expertise by mentoring newer members',
        'Lead a discussion on a topic you\'re passionate about',
        'Consider hosting a video call to share knowledge'
      ];
    } else if (rank <= 25) {
      feedback_type = 'motivation';
      message = `🌟 Excellent work! You're in the top 25 with rank #${rank}. Your contributions are making a real difference in the community.`;
      suggested_actions = [
        'Continue your thoughtful participation in discussions',
        'Try joining more video calls to boost your score',
        'Help answer questions from other community members'
      ];
    } else if (rank <= 50) {
      feedback_type = 'improvement_suggestion';
      message = `📈 Good progress! You're ranked #${rank}. Focus on quality engagement to climb higher in the leaderboard.`;
      suggested_actions = [
        'Post more detailed, helpful responses',
        'Join video calls and actively participate',
        'Welcome new members to build community spirit'
      ];
    } else {
      feedback_type = 'goal_setting';
      message = `🚀 Ready to level up? You're currently ranked #${rank}. Let's create a plan to boost your community engagement!`;
      suggested_actions = [
        'Start by posting one thoughtful message daily',
        'Join the next community video call',
        'Give helpful feedback on others\' posts',
        'Welcome new members when they join'
      ];
    }

    // Add specific suggestions based on recent activities
    const recentActivityTypes = recent_activities.map(a => a.activity_type);
    if (!recentActivityTypes.includes('video_call_joined')) {
      suggested_actions.push('Try joining a video call - it\'s worth 10x more points than chat messages!');
    }

    return {
      feedback: {
        id: '', // Will be set by the database
        community_id: request.community_id,
        user_id: request.user_id,
        feedback_type,
        message,
        suggested_actions,
        priority_level: rank > 50 ? 3 : 2,
        is_read: false,
        is_dismissed: false,
        created_at: new Date().toISOString()
      },
      additional_suggestions: this.generateAdditionalSuggestions(performance_data)
    };
  }

  private async mockProcessQuery(request: ProcessLeaderboardQueryRequest): Promise<ProcessLeaderboardQueryResponse> {
    await new Promise(resolve => setTimeout(resolve, 150));

    const query = request.query.toLowerCase();
    const intent = this.classifyQueryIntent(query);
    const userScore = request.context?.user_score;
    const rank = request.context?.leaderboard_position || userScore?.rank || 0;

    let response: string;
    let suggested_actions: string[] = [];
    let follow_up_questions: string[] = [];

    switch (intent) {
      case 'rank_inquiry':
        response = `You're currently ranked #${rank} in your community with a performance score of ${userScore?.performance_score.toFixed(0) || 0}. `;
        if (rank <= 10) {
          response += `Fantastic! You're in the top 10! 🏆`;
        } else if (rank <= 25) {
          response += `Great job! You're in the top 25! 🌟`;
        } else {
          response += `There's room to grow, and I can help you climb higher! 📈`;
        }
        follow_up_questions = [
          'How can I improve my rank?',
          'What are my strongest areas?',
          'Show me my progress over time'
        ];
        break;

      case 'improvement_request':
        response = this.generateImprovementAdvice(userScore, rank);
        suggested_actions = this.getImprovementActions(userScore);
        break;

      case 'comparison_request':
        response = `Compared to other members, your strengths are in ${this.identifyStrengths(userScore)}. `;
        response += `To reach the next level, focus on ${this.identifyWeaknesses(userScore)}.`;
        break;

      case 'progress_tracking':
        response = `Your performance score has ${this.getScoreTrend()} over the past week. `;
        response += `Your most impactful activities have been ${this.getTopActivities()}.`;
        break;

      default:
        response = `I'm here to help you understand your community performance! You're currently ranked #${rank}. `;
        response += `Feel free to ask me about your rank, how to improve, or track your progress.`;
        follow_up_questions = [
          'Why is my rank what it is?',
          'How can I get to the top 10?',
          'What should I focus on this week?'
        ];
    }

    return {
      response,
      intent,
      confidence: 0.85,
      suggested_actions,
      follow_up_questions
    };
  }

  private classifyQueryIntent(query: string): QueryIntent {
    const rankKeywords = ['rank', 'position', 'place', 'standing', 'where am i'];
    const improvementKeywords = ['improve', 'better', 'increase', 'boost', 'higher', 'how to'];
    const comparisonKeywords = ['compare', 'others', 'versus', 'against', 'better than'];
    const progressKeywords = ['progress', 'trend', 'history', 'over time', 'change'];
    const goalKeywords = ['goal', 'target', 'achieve', 'reach'];

    if (rankKeywords.some(keyword => query.includes(keyword))) return 'rank_inquiry';
    if (improvementKeywords.some(keyword => query.includes(keyword))) return 'improvement_request';
    if (comparisonKeywords.some(keyword => query.includes(keyword))) return 'comparison_request';
    if (progressKeywords.some(keyword => query.includes(keyword))) return 'progress_tracking';
    if (goalKeywords.some(keyword => query.includes(keyword))) return 'goal_setting';
    
    return 'general_question';
  }

  private generateImprovementAdvice(userScore: UserScore | undefined, rank: number): string {
    if (!userScore) return 'To improve your rank, focus on active participation in chat, video calls, and helping other members.';

    const scores = {
      chat: userScore.chat_score,
      video: userScore.video_call_score,
      participation: userScore.participation_score
    };

    const lowest = Object.entries(scores).reduce((a, b) => scores[a[0] as keyof typeof scores] < scores[b[0] as keyof typeof scores] ? a : b)[0];

    const advice = {
      chat: 'Focus on posting more thoughtful, helpful messages in community discussions. Quality matters more than quantity!',
      video: 'Join more video calls and actively participate. Video calls have the highest impact on your score!',
      participation: 'Engage more with the community by liking posts, helping others, and welcoming new members.'
    };

    return advice[lowest as keyof typeof advice];
  }

  private getImprovementActions(userScore: UserScore | undefined): string[] {
    if (!userScore) return ['Post thoughtful messages', 'Join video calls', 'Help other members'];

    const actions = [];
    if (userScore.chat_score < 50) actions.push('Post more detailed, helpful responses');
    if (userScore.video_call_score < 50) actions.push('Join and actively participate in video calls');
    if (userScore.participation_score < 50) actions.push('Like posts, help others, welcome new members');
    
    return actions.length > 0 ? actions : ['Continue your excellent engagement!'];
  }

  private identifyStrengths(userScore: UserScore | undefined): string {
    if (!userScore) return 'community participation';
    
    const scores = {
      'chat discussions': userScore.chat_score,
      'video call participation': userScore.video_call_score,
      'community engagement': userScore.participation_score,
      'content quality': userScore.quality_multiplier * 50
    };

    const highest = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);
    return highest[0];
  }

  private identifyWeaknesses(userScore: UserScore | undefined): string {
    if (!userScore) return 'overall engagement';
    
    const scores = {
      'chat discussions': userScore.chat_score,
      'video call participation': userScore.video_call_score,
      'community engagement': userScore.participation_score
    };

    const lowest = Object.entries(scores).reduce((a, b) => a[1] < b[1] ? a : b);
    return lowest[0];
  }

  private getScoreTrend(): string {
    // Mock trend data - in real implementation, this would query historical data
    const trends = ['increased by 15%', 'remained stable', 'decreased slightly', 'grown significantly'];
    return trends[Math.floor(Math.random() * trends.length)];
  }

  private getTopActivities(): string {
    const activities = ['video call participation', 'helpful chat responses', 'welcoming new members', 'sharing resources'];
    return activities[Math.floor(Math.random() * activities.length)];
  }

  private async analyzeSentiment(text: string): Promise<number> {
    // Simple sentiment analysis - in production, use a proper NLP model
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'helpful', 'thanks'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'stupid', 'boring', 'waste', 'useless'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    const score = 0.5 + (positiveCount - negativeCount) * 0.1;
    return Math.max(0, Math.min(1, score));
  }

  private calculateEngagementScore(data: {
    speaking_time_minutes: number;
    camera_enabled: boolean;
    reactions_received: number;
  }): number {
    let score = 0;
    
    // Speaking time contribution (0-0.4)
    score += Math.min(0.4, data.speaking_time_minutes / 10);
    
    // Camera enabled contribution (0-0.3)
    if (data.camera_enabled) score += 0.3;
    
    // Reactions received contribution (0-0.3)
    score += Math.min(0.3, data.reactions_received / 10);
    
    return Math.min(1, score);
  }

  private generateImprovementSuggestions(metrics: QualityMetrics): string[] {
    const suggestions = [];
    
    if ((metrics.sentiment_score || 0) < 0.6) {
      suggestions.push('Try using more positive language in your messages');
    }
    
    if ((metrics.helpfulness_score || 0) < 0.5) {
      suggestions.push('Consider providing more detailed, helpful responses');
    }
    
    if ((metrics.length_score || 0) < 0.3) {
      suggestions.push('Add more detail to your messages for better engagement');
    }
    
    return suggestions;
  }

  private generateAdditionalSuggestions(performance: UserScore): string[] {
    const suggestions = [];
    
    if (performance.video_call_score < 20) {
      suggestions.push('Video calls are the highest-value activity - try to join at least one this week!');
    }
    
    if (performance.chat_score < 30) {
      suggestions.push('Regular participation in chat discussions helps build your community presence');
    }
    
    if (performance.quality_multiplier < 1.2) {
      suggestions.push('Focus on posting thoughtful, helpful content to improve your quality score');
    }
    
    return suggestions;
  }

  // Fallback methods for error cases

  private getFallbackMessageAnalysis(): AnalyzeChatMessageResponse {
    return {
      quality_metrics: {
        sentiment_score: 0.7,
        helpfulness_score: 0.5,
        relevance_score: 0.6,
        engagement_score: 0.5,
        length_score: 0.4
      },
      impact_score: 2.5
    };
  }

  private getFallbackFeedback(request: GenerateFeedbackRequest): GenerateFeedbackResponse {
    return {
      feedback: {
        id: '',
        community_id: request.community_id,
        user_id: request.user_id,
        feedback_type: 'motivation',
        message: 'Keep up the great work in the community! Every contribution matters.',
        suggested_actions: ['Continue engaging with others', 'Share your knowledge', 'Help newcomers'],
        priority_level: 2,
        is_read: false,
        is_dismissed: false,
        created_at: new Date().toISOString()
      },
      additional_suggestions: ['Stay active and engaged']
    };
  }

  private getFallbackQueryResponse(request: ProcessLeaderboardQueryRequest): ProcessLeaderboardQueryResponse {
    return {
      response: 'I\'m here to help you understand your community performance. You can ask me about your rank, how to improve, or track your progress.',
      intent: 'general_question',
      confidence: 0.5,
      follow_up_questions: [
        'What is my current rank?',
        'How can I improve my score?',
        'What are my best activities?'
      ]
    };
  }
}

// Export singleton instance
export const aiLeaderboardService = AILeaderboardService.getInstance();