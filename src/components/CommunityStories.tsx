import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  Eye,
  Heart,
  MessageCircle,
  Share,
  Clock,
  User,
  Camera,
  Video,
  Image as ImageIcon,
  Play,
  Pause,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { validateAvatarUrl } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Story {
  id: string;
  user_id: string;
  community_id: string;
  content_type: 'text' | 'image' | 'video';
  content_url?: string;
  text_content?: string;
  background_color?: string;
  created_at: string;
  expires_at: string;
  view_count: number;
  is_active: boolean;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface StoryView {
  id: string;
  story_id: string;
  viewer_id: string;
  viewed_at: string;
}

interface CommunityStoriesProps {
  communityId: string;
  communityName: string;
  isMember: boolean;
  isCreator: boolean;
}

export const CommunityStories = ({ communityId, communityName, isMember, isCreator }: CommunityStoriesProps) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [myStory, setMyStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [createStoryDialogOpen, setCreateStoryDialogOpen] = useState(false);
  const [viewStoryDialogOpen, setViewStoryDialogOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [newStoryText, setNewStoryText] = useState('');
  const [newStoryBgColor, setNewStoryBgColor] = useState('#3b82f6');
  const [creatingStory, setCreatingStory] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const backgroundColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  // Fetch community stories
  const fetchStories = async () => {
    if (!isMember) return;
    
    try {
      const { data: storiesData, error } = await supabase
        .from('community_stories')
        .select(`
          *,
          profiles!community_stories_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', communityId)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stories:', error);
        return;
      }

      const allStories = storiesData || [];
      
      // Separate my story from others
      const userStory = allStories.find(story => story.user_id === user?.id);
      const otherStories = allStories.filter(story => story.user_id !== user?.id);
      
      setMyStory(userStory || null);
      setStories(otherStories);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new story
  const createStory = async () => {
    if (!user || !newStoryText.trim()) return;

    setCreatingStory(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Stories expire after 24 hours

      const { data: story, error } = await supabase
        .from('community_stories')
        .insert([{
          community_id: communityId,
          user_id: user.id,
          content_type: 'text',
          text_content: newStoryText.trim(),
          background_color: newStoryBgColor,
          expires_at: expiresAt.toISOString(),
          is_active: true
        }])
        .select(`
          *,
          profiles!community_stories_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your story has been posted"
      });

      setCreateStoryDialogOpen(false);
      setNewStoryText('');
      setNewStoryBgColor('#3b82f6');
      setMyStory(story);
      
    } catch (error: any) {
      console.error('Error creating story:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create story",
        variant: "destructive"
      });
    } finally {
      setCreatingStory(false);
    }
  };

  // View a story
  const viewStory = async (story: Story, index: number) => {
    setSelectedStory(story);
    setStoryIndex(index);
    setViewStoryDialogOpen(true);
    setStoryProgress(0);
    setIsPlaying(true);

    // Record view if not own story
    if (story.user_id !== user?.id) {
      try {
        await supabase
          .from('community_story_views')
          .insert([{
            story_id: story.id,
            viewer_id: user?.id,
          }]);

        // Update view count
        await supabase
          .from('community_stories')
          .update({ view_count: story.view_count + 1 })
          .eq('id', story.id);
      } catch (error) {
        console.error('Error recording story view:', error);
      }
    }
  };

  // Navigate between stories
  const navigateStory = (direction: 'prev' | 'next') => {
    const allStories = myStory ? [myStory, ...stories] : stories;
    let newIndex = storyIndex;
    
    if (direction === 'prev' && storyIndex > 0) {
      newIndex = storyIndex - 1;
    } else if (direction === 'next' && storyIndex < allStories.length - 1) {
      newIndex = storyIndex + 1;
    }
    
    if (newIndex !== storyIndex) {
      setStoryIndex(newIndex);
      setSelectedStory(allStories[newIndex]);
      setStoryProgress(0);
    }
  };

  // Auto-progress story
  useEffect(() => {
    if (viewStoryDialogOpen && isPlaying && selectedStory) {
      const interval = setInterval(() => {
        setStoryProgress(prev => {
          if (prev >= 100) {
            // Auto-advance to next story or close
            const allStories = myStory ? [myStory, ...stories] : stories;
            if (storyIndex < allStories.length - 1) {
              navigateStory('next');
            } else {
              setViewStoryDialogOpen(false);
            }
            return 0;
          }
          return prev + 2; // Progress 2% every 100ms (5 seconds total)
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [viewStoryDialogOpen, isPlaying, selectedStory, storyIndex]);

  useEffect(() => {
    fetchStories();
  }, [communityId, isMember, user]);

  if (!isMember) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Join to view stories</h3>
          <p className="text-muted-foreground">
            Become a member to view and share community stories.
          </p>
        </CardContent>
      </Card>
    );
  }

  const allStories = myStory ? [myStory, ...stories] : stories;

  return (
    <div className="space-y-6">
      {/* Stories Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-500" />
            Community Stories
          </CardTitle>
          <CardDescription>
            Share moments and updates with your community
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Create Story Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={validateAvatarUrl(user?.user_metadata?.avatar_url)} 
                alt={user?.user_metadata?.display_name || 'You'}
              />
              <AvatarFallback>
                {(user?.user_metadata?.display_name || 'You').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Dialog open={createStoryDialogOpen} onOpenChange={setCreateStoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Share your story...
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Your Story</DialogTitle>
                    <DialogDescription>
                      Share a moment with your community (expires in 24 hours)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Story</label>
                      <textarea
                        placeholder="What's happening?"
                        value={newStoryText}
                        onChange={(e) => setNewStoryText(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-none"
                        maxLength={280}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {newStoryText.length}/280
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Background Color</label>
                      <div className="flex gap-2">
                        {backgroundColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewStoryBgColor(color)}
                            className={`w-8 h-8 rounded-full border-2 ${
                              newStoryBgColor === color ? 'border-foreground' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Preview */}
                    {newStoryText && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Preview</label>
                        <div 
                          className="aspect-[9/16] max-w-[200px] rounded-lg p-4 flex items-center justify-center text-white text-center"
                          style={{ backgroundColor: newStoryBgColor }}
                        >
                          <p className="text-sm font-medium">{newStoryText}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={createStory}
                      disabled={!newStoryText.trim() || creatingStory}
                      className="flex-1"
                    >
                      {creatingStory ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Posting...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Post Story
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={() => setCreateStoryDialogOpen(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stories Grid */}
      {allStories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {allStories.map((story, index) => (
            <Card 
              key={story.id} 
              className="relative overflow-hidden cursor-pointer hover:scale-105 transition-transform aspect-[9/16] group"
              onClick={() => viewStory(story, index)}
            >
              <div 
                className="absolute inset-0 flex items-end p-3"
                style={{ 
                  backgroundColor: story.content_type === 'text' ? story.background_color : undefined,
                  backgroundImage: story.content_url ? `url(${story.content_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="relative z-10 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-8 w-8 border-2 border-white">
                      <AvatarImage 
                        src={validateAvatarUrl(story.profiles?.avatar_url)} 
                        alt={story.profiles?.display_name || 'User'}
                      />
                      <AvatarFallback className="text-xs">
                        {(story.profiles?.display_name || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {story.user_id === user?.id ? 'Your Story' : story.profiles?.display_name}
                      </p>
                      <p className="text-white/80 text-xs">
                        {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {story.content_type === 'text' && (
                    <p className="text-white text-sm font-medium line-clamp-3">
                      {story.text_content}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 text-white/80">
                      <Eye className="w-3 h-3" />
                      <span className="text-xs">{story.view_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No stories yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share a story with your community!
            </p>
            <Button onClick={() => setCreateStoryDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Story
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Story Viewer Dialog */}
      <Dialog open={viewStoryDialogOpen} onOpenChange={setViewStoryDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 bg-black border-none">
          {selectedStory && (
            <div className="relative aspect-[9/16] w-full">
              {/* Progress Bar */}
              <div className="absolute top-2 left-2 right-2 z-20">
                <div className="flex gap-1">
                  {allStories.map((_, index) => (
                    <div 
                      key={index}
                      className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                    >
                      <div 
                        className="h-full bg-white transition-all duration-100"
                        style={{ 
                          width: index === storyIndex ? `${storyProgress}%` : index < storyIndex ? '100%' : '0%'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Story Content */}
              <div 
                className="absolute inset-0 flex items-center justify-center p-6"
                style={{ 
                  backgroundColor: selectedStory.content_type === 'text' ? selectedStory.background_color : '#000',
                  backgroundImage: selectedStory.content_url ? `url(${selectedStory.content_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {selectedStory.content_type === 'text' && (
                  <p className="text-white text-xl font-bold text-center leading-relaxed">
                    {selectedStory.text_content}
                  </p>
                )}
              </div>

              {/* Story Header */}
              <div className="absolute top-12 left-4 right-4 z-20">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white">
                    <AvatarImage 
                      src={validateAvatarUrl(selectedStory.profiles?.avatar_url)} 
                      alt={selectedStory.profiles?.display_name || 'User'}
                    />
                    <AvatarFallback>
                      {(selectedStory.profiles?.display_name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      {selectedStory.user_id === user?.id ? 'Your Story' : selectedStory.profiles?.display_name}
                    </p>
                    <p className="text-white/80 text-sm">
                      {formatDistanceToNow(new Date(selectedStory.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewStoryDialogOpen(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Navigation */}
              <div className="absolute inset-y-0 left-0 w-1/3 z-10 flex items-center justify-start pl-4">
                {storyIndex > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateStory('prev')}
                    className="text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                )}
              </div>
              
              <div className="absolute inset-y-0 right-0 w-1/3 z-10 flex items-center justify-end pr-4">
                {storyIndex < allStories.length - 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateStory('next')}
                    className="text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                )}
              </div>

              {/* Play/Pause Control */}
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
              </div>

              {/* Story Actions */}
              <div className="absolute bottom-6 left-4 right-4 z-20">
                <div className="flex items-center gap-4 justify-center">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <Heart className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <Share className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};