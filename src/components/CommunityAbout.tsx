import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Info,
  Edit3,
  Calendar,
  Users,
  Crown,
  Globe,
  Lock,
  MapPin,
  Link as LinkIcon,
  Mail,
  Phone,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Github,
  Linkedin,
  Save,
  X,
  Star,
  Heart,
  Sparkles,
  Zap,
  Shield,
  Award,
  Target,
  Eye,
  TrendingUp,
  MessageSquare,
  Camera,
  Image as ImageIcon,
  FileText,
  Settings
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { validateAvatarUrl } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface CommunityAboutProps {
  communityId: string;
  communityName: string;
  isMember: boolean;
  isCreator: boolean;
}

interface CommunityAboutData {
  id: string;
  community_id: string;
  description: string | null;
  long_description: string | null;
  website_url: string | null;
  contact_email: string | null;
  phone_number: string | null;
  location: string | null;
  founded_date: string | null;
  mission_statement: string | null;
  vision_statement: string | null;
  values: string[] | null;
  social_links: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
    linkedin?: string;
  } | null;
  tags: string[] | null;
  achievements: {
    title: string;
    description: string;
    date: string;
    icon?: string;
  }[] | null;
  statistics: {
    total_posts: number;
    total_events: number;
    total_members: number;
    growth_rate: number;
  } | null;
  gallery_images: string[] | null;
  rules: string[] | null;
  faqs: {
    question: string;
    answer: string;
  }[] | null;
  created_at: string;
  updated_at: string;
}

export const CommunityAbout: React.FC<CommunityAboutProps> = ({
  communityId,
  communityName,
  isMember,
  isCreator
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [aboutData, setAboutData] = useState<CommunityAboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<CommunityAboutData>>({});

  useEffect(() => {
    fetchAboutData();
  }, [communityId]);

  const fetchAboutData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_about')
        .select('*')
        .eq('community_id', communityId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setAboutData(data);
        setEditData(data);
      } else {
        // Create default about data if none exists
        const defaultData = {
          community_id: communityId,
          description: `Welcome to ${communityName}! This is our community space where members connect, share, and grow together.`,
          long_description: null,
          website_url: null,
          contact_email: null,
          phone_number: null,
          location: null,
          founded_date: new Date().toISOString(),
          mission_statement: null,
          vision_statement: null,
          values: null,
          social_links: null,
          tags: [],
          achievements: [],
          statistics: null,
          gallery_images: [],
          rules: [
            'Be respectful and kind to all members',
            'No spam or self-promotion without permission',
            'Keep discussions relevant to the community',
            'Report inappropriate content to moderators'
          ],
          faqs: [
            {
              question: 'How do I become a member?',
              answer: 'Click the "Join Community" button to become a member and start participating in discussions.'
            },
            {
              question: 'What can I do as a member?',
              answer: 'Members can participate in discussions, attend events, access exclusive content, and connect with other members.'
            }
          ]
        };
        setAboutData(defaultData as CommunityAboutData);
        setEditData(defaultData);
      }
    } catch (error) {
      console.error('Error fetching about data:', error);
      toast({
        title: "Error",
        description: "Failed to load community information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAboutData = async () => {
    if (!isCreator) return;

    try {
      const { data, error } = await supabase
        .from('community_about')
        .upsert({
          ...editData,
          community_id: communityId,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setAboutData(data);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Community information updated successfully",
      });
    } catch (error) {
      console.error('Error saving about data:', error);
      toast({
        title: "Error",
        description: "Failed to save community information",
        variant: "destructive"
      });
    }
  };

  const addTag = (tag: string) => {
    if (!tag.trim()) return;
    const currentTags = editData.tags || [];
    if (!currentTags.includes(tag.trim())) {
      setEditData({
        ...editData,
        tags: [...currentTags, tag.trim()]
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = editData.tags || [];
    setEditData({
      ...editData,
      tags: currentTags.filter(tag => tag !== tagToRemove)
    });
  };

  const addRule = (rule: string) => {
    if (!rule.trim()) return;
    const currentRules = editData.rules || [];
    setEditData({
      ...editData,
      rules: [...currentRules, rule.trim()]
    });
  };

  const removeRule = (index: number) => {
    const currentRules = editData.rules || [];
    setEditData({
      ...editData,
      rules: currentRules.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Info className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">About {communityName}</h1>
                <p className="text-white/80">Learn more about our community</p>
              </div>
            </div>
            {isCreator && (
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            )}
          </div>
          
          {aboutData?.description && (
            <p className="text-lg text-white/90 leading-relaxed">
              {aboutData.description}
            </p>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-20">
          <Sparkles className="w-16 h-16" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-10">
          <Heart className="w-12 h-12" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description Section */}
          {(aboutData?.long_description || isEditing) && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Community Description</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editData.long_description || ''}
                    onChange={(e) => setEditData({ ...editData, long_description: e.target.value })}
                    placeholder="Provide a detailed description of your community..."
                    className="min-h-[120px]"
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    {aboutData?.long_description || 'No detailed description available.'}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Mission & Vision */}
          {(aboutData?.mission_statement || aboutData?.vision_statement || isEditing) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-700">
                    <Target className="w-5 h-5" />
                    <span>Mission</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editData.mission_statement || ''}
                      onChange={(e) => setEditData({ ...editData, mission_statement: e.target.value })}
                      placeholder="What is your community's mission?"
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p className="text-gray-700">
                      {aboutData?.mission_statement || 'Mission statement not set.'}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-700">
                    <Eye className="w-5 h-5" />
                    <span>Vision</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editData.vision_statement || ''}
                      onChange={(e) => setEditData({ ...editData, vision_statement: e.target.value })}
                      placeholder="What is your community's vision?"
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p className="text-gray-700">
                      {aboutData?.vision_statement || 'Vision statement not set.'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Community Rules */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-700">
                <Shield className="w-5 h-5" />
                <span>Community Guidelines</span>
              </CardTitle>
              <CardDescription>
                Please follow these guidelines to maintain a positive community environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  {(editData.rules || []).map((rule, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={rule}
                        onChange={(e) => {
                          const newRules = [...(editData.rules || [])];
                          newRules[index] = e.target.value;
                          setEditData({ ...editData, rules: newRules });
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRule(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addRule('New rule')}
                    className="w-full"
                  >
                    Add Rule
                  </Button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {(aboutData?.rules || []).map((rule, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-xs font-semibold text-red-600">{index + 1}</span>
                      </div>
                      <span className="text-gray-700">{rule}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* FAQ Section */}
          {(aboutData?.faqs?.length || isEditing) && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-700">
                  <MessageSquare className="w-5 h-5" />
                  <span>Frequently Asked Questions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(aboutData?.faqs || []).map((faq, index) => (
                    <div key={index} className="border-l-4 border-orange-200 pl-4 py-2">
                      <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                      <p className="text-gray-700">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-700">
                <Info className="w-5 h-5" />
                <span>Quick Info</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aboutData?.founded_date && (
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Founded</p>
                    <p className="font-semibold">
                      {new Date(aboutData.founded_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              
              {aboutData?.location && (
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-semibold">{aboutData.location}</p>
                  </div>
                </div>
              )}

              {aboutData?.website_url && (
                <div className="flex items-center space-x-3">
                  <LinkIcon className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <a 
                      href={aboutData.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {(aboutData?.tags?.length || isEditing) && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span>Tags</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(aboutData?.tags || []).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                      {tag}
                      {isEditing && (
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <div className="mt-4">
                    <Input
                      placeholder="Add a tag..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addTag(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Social Links */}
          {(aboutData?.social_links || isEditing) && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LinkIcon className="w-5 h-5 text-blue-600" />
                  <span>Connect With Us</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {aboutData?.social_links?.twitter && (
                    <a 
                      href={aboutData.social_links.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <Twitter className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Twitter</span>
                    </a>
                  )}
                  {aboutData?.social_links?.facebook && (
                    <a 
                      href={aboutData.social_links.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <Facebook className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Facebook</span>
                    </a>
                  )}
                  {aboutData?.social_links?.instagram && (
                    <a 
                      href={aboutData.social_links.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 p-2 rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors"
                    >
                      <Instagram className="w-4 h-4 text-pink-600" />
                      <span className="text-sm">Instagram</span>
                    </a>
                  )}
                  {aboutData?.social_links?.youtube && (
                    <a 
                      href={aboutData.social_links.youtube} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <Youtube className="w-4 h-4 text-red-600" />
                      <span className="text-sm">YouTube</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          {aboutData?.statistics && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-teal-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-700">
                  <TrendingUp className="w-5 h-5" />
                  <span>Community Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{aboutData.statistics.total_members}</p>
                    <p className="text-sm text-gray-500">Members</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{aboutData.statistics.total_posts}</p>
                    <p className="text-sm text-gray-500">Posts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{aboutData.statistics.total_events}</p>
                    <p className="text-sm text-gray-500">Events</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{aboutData.statistics.growth_rate}%</p>
                    <p className="text-sm text-gray-500">Growth</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Save Button for Editing */}
      {isEditing && isCreator && (
        <div className="fixed bottom-8 right-8 z-50">
          <Button
            onClick={saveAboutData}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
            size="lg"
          >
            <Save className="w-5 h-5 mr-2" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
};