// Psychology and Conversation Training System Types

export interface PsychologyProfile {
  id: string;
  user_id: string;
  community_id: string;
  personality_traits: PersonalityTraits;
  communication_style: CommunicationStyle;
  emotional_intelligence: EmotionalIntelligence;
  social_skills: SocialSkills;
  learning_preferences: LearningPreferences;
  created_at: string;
  updated_at: string;
}

export interface PersonalityTraits {
  // Big Five personality model
  openness: number; // 0-1, openness to experience
  conscientiousness: number; // 0-1, organization and discipline
  extraversion: number; // 0-1, social energy and assertiveness
  agreeableness: number; // 0-1, cooperation and trust
  neuroticism: number; // 0-1, emotional instability (lower is better)
  
  // Additional traits for conversation
  empathy_level: number; // 0-1, ability to understand others' emotions
  adaptability: number; // 0-1, flexibility in communication style
  patience_level: number; // 0-1, tolerance and understanding
  curiosity_level: number; // 0-1, interest in learning and asking questions
}

export interface CommunicationStyle {
  primary_style: 'assertive' | 'passive' | 'aggressive' | 'passive-aggressive' | 'collaborative';
  directness_level: number; // 0-1, how direct vs indirect they are
  formality_preference: number; // 0-1, casual vs formal communication
  response_speed: 'immediate' | 'thoughtful' | 'delayed';
  preferred_channels: ('text' | 'voice' | 'video' | 'face_to_face')[];
  conflict_resolution_style: 'avoidant' | 'competitive' | 'accommodating' | 'compromising' | 'collaborative';
}

export interface EmotionalIntelligence {
  self_awareness: number; // 0-1, understanding own emotions
  self_regulation: number; // 0-1, managing own emotions
  motivation: number; // 0-1, drive and persistence
  empathy: number; // 0-1, understanding others' emotions
  social_skills: number; // 0-1, managing relationships
  emotional_recognition: number; // 0-1, identifying emotions in text/speech
  emotional_expression: number; // 0-1, appropriately expressing emotions
}

export interface SocialSkills {
  active_listening: number; // 0-1, ability to truly hear and understand
  rapport_building: number; // 0-1, creating connection with others
  persuasion: number; // 0-1, ability to influence positively
  negotiation: number; // 0-1, finding win-win solutions
  leadership: number; // 0-1, guiding and inspiring others
  teamwork: number; // 0-1, collaborating effectively
  cultural_sensitivity: number; // 0-1, awareness of cultural differences
  humor_appropriateness: number; // 0-1, using humor effectively
}

export interface LearningPreferences {
  learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing' | 'multimodal';
  feedback_preference: 'immediate' | 'periodic' | 'on_demand';
  challenge_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  motivation_type: 'intrinsic' | 'extrinsic' | 'mixed';
  practice_frequency: 'daily' | 'weekly' | 'monthly' | 'as_needed';
}

// Training Module System
export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: TrainingCategory;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  estimated_duration_minutes: number;
  learning_objectives: string[];
  prerequisites: string[];
  training_exercises: TrainingExercise[];
  assessment_criteria: AssessmentCriteria;
  created_at: string;
  updated_at: string;
}

export type TrainingCategory = 
  | 'emotional_intelligence'
  | 'active_listening'
  | 'empathy_building'
  | 'conflict_resolution'
  | 'persuasion_skills'
  | 'leadership_communication'
  | 'cultural_awareness'
  | 'nonverbal_communication'
  | 'storytelling'
  | 'question_asking'
  | 'feedback_giving'
  | 'difficult_conversations';

export interface TrainingExercise {
  id: string;
  type: ExerciseType;
  title: string;
  instructions: string;
  scenario?: ConversationScenario;
  expected_outcomes: string[];
  evaluation_rubric: EvaluationRubric;
  time_limit_minutes?: number;
}

export type ExerciseType = 
  | 'role_play'
  | 'conversation_analysis'
  | 'empathy_mapping'
  | 'response_crafting'
  | 'emotion_recognition'
  | 'active_listening_practice'
  | 'conflict_simulation'
  | 'persuasion_practice'
  | 'cultural_scenario'
  | 'feedback_practice';

export interface ConversationScenario {
  id: string;
  title: string;
  context: string;
  participants: ScenarioParticipant[];
  emotional_state: string;
  difficulty_factors: string[];
  success_criteria: string[];
  common_mistakes: string[];
}

export interface ScenarioParticipant {
  name: string;
  role: string;
  personality_description: string;
  emotional_state: string;
  goals: string[];
  concerns: string[];
}

export interface EvaluationRubric {
  criteria: RubricCriterion[];
  scoring_method: 'holistic' | 'analytical' | 'checklist';
  passing_score: number;
  feedback_prompts: string[];
}

export interface RubricCriterion {
  name: string;
  description: string;
  weight: number; // 0-1, importance of this criterion
  scale: RubricScale[];
}

export interface RubricScale {
  score: number;
  label: string;
  description: string;
  indicators: string[];
}

export interface AssessmentCriteria {
  knowledge_assessment: boolean;
  skill_demonstration: boolean;
  behavioral_observation: boolean;
  self_reflection: boolean;
  peer_evaluation: boolean;
  ai_analysis: boolean;
}

// Training Progress and Results
export interface UserTrainingProgress {
  id: string;
  user_id: string;
  community_id: string;
  module_id: string;
  status: TrainingStatus;
  progress_percentage: number;
  completed_exercises: string[];
  current_exercise_id?: string;
  skill_improvements: SkillImprovement[];
  assessment_results: AssessmentResult[];
  time_spent_minutes: number;
  started_at: string;
  completed_at?: string;
  last_activity_at: string;
}

export type TrainingStatus = 
  | 'not_started'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'expired';

export interface SkillImprovement {
  skill_name: string;
  before_score: number;
  after_score: number;
  improvement_percentage: number;
  evidence: string[];
  measured_at: string;
}

export interface AssessmentResult {
  id: string;
  exercise_id: string;
  user_response: any;
  ai_evaluation: AIEvaluation;
  peer_feedback?: PeerFeedback[];
  self_assessment?: SelfAssessment;
  final_score: number;
  passed: boolean;
  feedback: string;
  improvement_suggestions: string[];
  created_at: string;
}

export interface AIEvaluation {
  overall_score: number;
  criterion_scores: Record<string, number>;
  strengths_identified: string[];
  areas_for_improvement: string[];
  confidence_level: number; // 0-1, AI's confidence in evaluation
  analysis_details: {
    sentiment_analysis: SentimentAnalysis;
    communication_effectiveness: CommunicationEffectiveness;
    psychological_insights: PsychologicalInsights;
  };
}

export interface SentimentAnalysis {
  overall_sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number; // -1 to 1
  emotional_tone: string[];
  empathy_indicators: string[];
  conflict_indicators: string[];
}

export interface CommunicationEffectiveness {
  clarity_score: number; // 0-1
  persuasiveness_score: number; // 0-1
  engagement_level: number; // 0-1
  appropriateness_score: number; // 0-1
  active_listening_indicators: string[];
  rapport_building_indicators: string[];
}

export interface PsychologicalInsights {
  personality_indicators: Record<string, number>;
  emotional_intelligence_display: Record<string, number>;
  social_skills_demonstration: Record<string, number>;
  behavioral_patterns: string[];
  growth_opportunities: string[];
}

export interface PeerFeedback {
  evaluator_id: string;
  scores: Record<string, number>;
  comments: string;
  helpful_aspects: string[];
  improvement_suggestions: string[];
  would_recommend: boolean;
  created_at: string;
}

export interface SelfAssessment {
  perceived_difficulty: number; // 1-5
  confidence_level: number; // 1-5
  learning_satisfaction: number; // 1-5
  skill_improvement_perception: Record<string, number>;
  reflection_notes: string;
  goals_for_next_session: string[];
  created_at: string;
}

// Training Analytics and Insights
export interface TrainingAnalytics {
  user_id: string;
  community_id: string;
  overall_progress: OverallProgress;
  skill_development_trends: SkillTrend[];
  learning_patterns: LearningPattern[];
  engagement_metrics: EngagementMetrics;
  recommendation_engine: PersonalizedRecommendations;
  generated_at: string;
}

export interface OverallProgress {
  modules_completed: number;
  total_modules_available: number;
  average_score: number;
  time_invested_hours: number;
  streak_days: number;
  rank_in_community: number;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface SkillTrend {
  skill_name: string;
  historical_scores: { date: string; score: number }[];
  trend_direction: 'improving' | 'stable' | 'declining';
  improvement_rate: number; // per week
  predicted_future_score: number;
}

export interface LearningPattern {
  optimal_session_length: number; // minutes
  best_performance_time: string; // time of day
  preferred_exercise_types: ExerciseType[];
  challenge_sweet_spot: number; // difficulty level 1-5
  motivation_triggers: string[];
  learning_obstacles: string[];
}

export interface EngagementMetrics {
  session_frequency: number; // sessions per week
  average_session_duration: number; // minutes
  completion_rate: number; // 0-1
  drop_off_points: string[]; // where users typically stop
  peak_engagement_activities: string[];
  satisfaction_scores: { date: string; score: number }[];
}

export interface PersonalizedRecommendations {
  next_modules: string[];
  focus_skills: string[];
  practice_scenarios: string[];
  peer_connections: string[]; // users with complementary skills
  optimal_schedule: TrainingSchedule;
  motivation_strategies: string[];
}

export interface TrainingSchedule {
  frequency: 'daily' | 'every_other_day' | 'weekly' | 'bi_weekly';
  duration_minutes: number;
  preferred_times: string[];
  rest_days: string[];
  intensity_variation: 'consistent' | 'progressive' | 'varied';
}

// AI Training Request/Response Types
export interface AnalyzeConversationRequest {
  conversation_text: string;
  context: ConversationContext;
  analysis_focus: AnalysisFocus[];
  user_psychology_profile?: PsychologyProfile;
}

export interface ConversationContext {
  scenario_type: string;
  participants: number;
  relationship_dynamics: string;
  cultural_context?: string;
  emotional_stakes: 'low' | 'medium' | 'high';
  time_pressure: boolean;
}

export type AnalysisFocus = 
  | 'emotional_intelligence'
  | 'communication_effectiveness'
  | 'conflict_resolution'
  | 'persuasion_techniques'
  | 'active_listening'
  | 'empathy_demonstration'
  | 'cultural_sensitivity'
  | 'leadership_qualities';

export interface AnalyzeConversationResponse {
  overall_assessment: OverallAssessment;
  detailed_analysis: DetailedAnalysis;
  skill_scores: Record<string, number>;
  improvement_recommendations: ImprovementRecommendation[];
  practice_suggestions: PracticeSuggestion[];
  confidence_score: number;
}

export interface OverallAssessment {
  effectiveness_score: number; // 0-1
  psychological_insight_level: number; // 0-1
  conversation_quality: 'poor' | 'fair' | 'good' | 'excellent' | 'exceptional';
  key_strengths: string[];
  primary_growth_areas: string[];
}

export interface DetailedAnalysis {
  turn_by_turn_analysis: TurnAnalysis[];
  conversation_flow: ConversationFlow;
  emotional_journey: EmotionalJourney;
  power_dynamics: PowerDynamics;
  cultural_considerations: CulturalConsiderations;
}

export interface TurnAnalysis {
  turn_number: number;
  speaker: string;
  content: string;
  analysis: {
    intent: string;
    emotional_tone: string;
    effectiveness: number;
    psychological_techniques_used: string[];
    missed_opportunities: string[];
    impact_on_conversation: string;
  };
}

export interface ConversationFlow {
  opening_effectiveness: number;
  topic_transitions: number;
  closing_effectiveness: number;
  overall_coherence: number;
  engagement_maintenance: number;
}

export interface EmotionalJourney {
  initial_emotional_state: Record<string, string>;
  emotional_progression: { point: string; emotions: Record<string, string> }[];
  final_emotional_state: Record<string, string>;
  emotional_regulation_demonstrated: boolean;
  empathy_moments: string[];
}

export interface PowerDynamics {
  initial_power_balance: string;
  power_shifts: { point: string; description: string }[];
  final_power_balance: string;
  influence_techniques_used: string[];
  collaborative_moments: string[];
}

export interface CulturalConsiderations {
  cultural_awareness_displayed: boolean;
  potential_cultural_missteps: string[];
  inclusive_language_use: number; // 0-1
  cultural_bridge_building: string[];
}

export interface ImprovementRecommendation {
  skill_area: string;
  priority: 'high' | 'medium' | 'low';
  specific_suggestion: string;
  practice_method: string;
  expected_impact: string;
  timeline: string;
}

export interface PracticeSuggestion {
  exercise_type: ExerciseType;
  scenario_description: string;
  focus_skills: string[];
  difficulty_level: number;
  estimated_time_minutes: number;
}

// Training Data and Examples
export interface TrainingDataset {
  id: string;
  name: string;
  description: string;
  category: TrainingCategory;
  examples: TrainingExample[];
  quality_score: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface TrainingExample {
  id: string;
  scenario: ConversationScenario;
  example_conversations: ExampleConversation[];
  expert_analysis: ExpertAnalysis;
  learning_points: string[];
  common_mistakes: string[];
}

export interface ExampleConversation {
  quality_level: 'poor' | 'average' | 'good' | 'excellent';
  conversation_turns: ConversationTurn[];
  outcome_description: string;
  lessons_learned: string[];
}

export interface ConversationTurn {
  speaker: string;
  content: string;
  psychological_techniques: string[];
  effectiveness_rating: number;
  alternative_approaches: string[];
}

export interface ExpertAnalysis {
  overall_quality: number;
  key_success_factors: string[];
  critical_failure_points: string[];
  psychological_principles_demonstrated: string[];
  cultural_competency_notes: string[];
  recommended_follow_up_practice: string[];
}