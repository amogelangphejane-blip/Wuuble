import { supabase } from '@/integrations/supabase/client';
import { leaderboardService } from '@/services/leaderboardService';
import { AILeaderboardService } from '@/services/aiLeaderboardService';

export interface DiagnosticResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export class LeaderboardDiagnostic {
  private results: DiagnosticResult[] = [];

  async runDiagnostic(communityId: string, userId: string): Promise<DiagnosticResult[]> {
    this.results = [];
    
    console.log('[Diagnostic] Starting AI Leaderboard diagnostic...');
    
    // Check 1: Environment Variables
    await this.checkEnvironmentVariables();
    
    // Check 2: Database Connection
    await this.checkDatabaseConnection();
    
    // Check 3: Required Tables
    await this.checkRequiredTables();
    
    // Check 4: User Authentication
    await this.checkUserAuthentication();
    
    // Check 5: User Score Data
    await this.checkUserScoreData(communityId, userId);
    
    // Check 6: AI Service
    await this.checkAIService();
    
    // Check 7: Query Processing
    await this.testQueryProcessing(communityId, userId);
    
    console.log('[Diagnostic] Diagnostic completed:', this.results);
    return this.results;
  }

  private async checkEnvironmentVariables(): Promise<void> {
    const hasOpenAIKey = !!import.meta.env.VITE_OPENAI_API_KEY;
    const hasSupabaseUrl = !!import.meta.env.VITE_SUPABASE_URL;
    const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!hasSupabaseUrl || !hasSupabaseKey) {
      this.results.push({
        check: 'Environment Variables - Supabase',
        status: 'fail',
        message: 'Missing required Supabase environment variables',
        details: { hasSupabaseUrl, hasSupabaseKey }
      });
    } else {
      this.results.push({
        check: 'Environment Variables - Supabase',
        status: 'pass',
        message: 'Supabase environment variables configured'
      });
    }
    
    if (!hasOpenAIKey) {
      this.results.push({
        check: 'Environment Variables - OpenAI',
        status: 'warning',
        message: 'OpenAI API key not configured (will use mock implementation)',
        details: { hasOpenAIKey }
      });
    } else {
      this.results.push({
        check: 'Environment Variables - OpenAI',
        status: 'pass',
        message: 'OpenAI API key configured'
      });
    }
  }

  private async checkDatabaseConnection(): Promise<void> {
    try {
      const { data, error } = await supabase.from('profiles').select('user_id').limit(1);
      
      if (error) {
        this.results.push({
          check: 'Database Connection',
          status: 'fail',
          message: `Database connection failed: ${error.message}`,
          details: error
        });
      } else {
        this.results.push({
          check: 'Database Connection',
          status: 'pass',
          message: 'Database connection successful'
        });
      }
    } catch (error) {
      this.results.push({
        check: 'Database Connection',
        status: 'fail',
        message: `Database connection error: ${error}`,
        details: error
      });
    }
  }

  private async checkRequiredTables(): Promise<void> {
    const requiredTables = [
      'community_user_scores',
      'community_user_activities',
      'community_leaderboard_queries',
      'community_user_feedback',
      'community_leaderboard_settings'
    ];

    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        
        if (error) {
          this.results.push({
            check: `Database Table - ${table}`,
            status: 'fail',
            message: `Table ${table} not accessible: ${error.message}`,
            details: error
          });
        } else {
          this.results.push({
            check: `Database Table - ${table}`,
            status: 'pass',
            message: `Table ${table} accessible`
          });
        }
      } catch (error) {
        this.results.push({
          check: `Database Table - ${table}`,
          status: 'fail',
          message: `Error checking table ${table}: ${error}`,
          details: error
        });
      }
    }
  }

  private async checkUserAuthentication(): Promise<void> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        this.results.push({
          check: 'User Authentication',
          status: 'fail',
          message: 'User not authenticated',
          details: { error, hasUser: !!user }
        });
      } else {
        this.results.push({
          check: 'User Authentication',
          status: 'pass',
          message: 'User authenticated successfully',
          details: { userId: user.id }
        });
      }
    } catch (error) {
      this.results.push({
        check: 'User Authentication',
        status: 'fail',
        message: `Authentication check failed: ${error}`,
        details: error
      });
    }
  }

  private async checkUserScoreData(communityId: string, userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('community_user_scores')
        .select('*')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        this.results.push({
          check: 'User Score Data',
          status: 'warning',
          message: 'User score data not found (will be initialized on first activity)',
          details: { error, hasData: !!data }
        });
      } else {
        this.results.push({
          check: 'User Score Data',
          status: 'pass',
          message: 'User score data exists',
          details: { score: data.performance_score, rank: data.rank }
        });
      }
    } catch (error) {
      this.results.push({
        check: 'User Score Data',
        status: 'fail',
        message: `Error checking user score data: ${error}`,
        details: error
      });
    }
  }

  private async checkAIService(): Promise<void> {
    try {
      const aiService = AILeaderboardService.getInstance();
      
      // Test basic AI functionality
      const testRequest = {
        community_id: 'test',
        user_id: 'test',
        query: 'test query',
        context: {
          user_score: {
            performance_score: 100,
            rank: 10,
            chat_score: 50,
            video_call_score: 30,
            participation_score: 20,
            quality_multiplier: 1.0
          },
          recent_activities: [],
          leaderboard_position: 10
        }
      };

      const response = await aiService.processLeaderboardQuery(testRequest);
      
      if (response && response.response) {
        this.results.push({
          check: 'AI Service',
          status: 'pass',
          message: 'AI service responding correctly',
          details: { intent: response.intent, confidence: response.confidence }
        });
      } else {
        this.results.push({
          check: 'AI Service',
          status: 'fail',
          message: 'AI service not responding properly',
          details: response
        });
      }
    } catch (error) {
      this.results.push({
        check: 'AI Service',
        status: 'fail',
        message: `AI service error: ${error}`,
        details: error
      });
    }
  }

  private async testQueryProcessing(communityId: string, userId: string): Promise<void> {
    try {
      const testQuery = 'What is my rank?';
      const result = await leaderboardService.processUserQuery(communityId, userId, testQuery);
      
      if (result && result.ai_response) {
        this.results.push({
          check: 'Query Processing',
          status: 'pass',
          message: 'Query processing working correctly',
          details: { 
            queryId: result.id, 
            intent: result.query_intent,
            hasResponse: !!result.ai_response 
          }
        });
      } else {
        this.results.push({
          check: 'Query Processing',
          status: 'fail',
          message: 'Query processing failed to return proper response',
          details: result
        });
      }
    } catch (error) {
      this.results.push({
        check: 'Query Processing',
        status: 'fail',
        message: `Query processing error: ${error}`,
        details: error
      });
    }
  }

  getSummary(): { passed: number; failed: number; warnings: number; total: number } {
    return {
      passed: this.results.filter(r => r.status === 'pass').length,
      failed: this.results.filter(r => r.status === 'fail').length,
      warnings: this.results.filter(r => r.status === 'warning').length,
      total: this.results.length
    };
  }

  getFailedChecks(): DiagnosticResult[] {
    return this.results.filter(r => r.status === 'fail');
  }

  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const failedChecks = this.getFailedChecks();

    failedChecks.forEach(check => {
      switch (check.check) {
        case 'Environment Variables - Supabase':
          recommendations.push('Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
          break;
        case 'Database Connection':
          recommendations.push('Check your Supabase configuration and ensure the database is accessible');
          break;
        case 'User Authentication':
          recommendations.push('Ensure user is logged in before using the leaderboard');
          break;
        case 'AI Service':
          recommendations.push('Check AI service configuration or use mock implementation');
          break;
        case 'Query Processing':
          recommendations.push('Verify database schema and user data initialization');
          break;
        default:
          if (check.check.startsWith('Database Table')) {
            recommendations.push('Run database migrations to create required tables');
          }
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }
}

export const leaderboardDiagnostic = new LeaderboardDiagnostic();