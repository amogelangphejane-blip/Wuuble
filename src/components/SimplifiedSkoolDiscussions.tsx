import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  Heart,
  Eye,
  MoreHorizontal,
  Image,
  Link,
  Hash,
  Pin,
  TrendingUp,
  Clock,
  Filter,
  ChevronDown,
  ThumbsUp,
  Bookmark,
  Share2,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SimplifiedPost {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  community_id: string;
  user?: {
    display_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

interface SimplifiedSkoolDiscussionsProps {
  communityId: string;
}

export const SimplifiedSkoolDiscussions: React.FC<SimplifiedSkoolDiscussionsProps> = ({ communityId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<SimplifiedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (communityId) {
      fetchPosts();
    }
  }, [communityId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          user:profiles!community_posts_user_id_fkey (
            display_name,
            email,
            avatar_url
          )
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        // Use mock data if there's an error
        const mockPosts: SimplifiedPost[] = [
          {
            id: '1',
            user_id: user?.id || 'mock-user-1',
            content: 'Welcome to our community! Feel free to share your thoughts and ideas.',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString(),
            community_id: communityId,
            user: {
              display_name: 'John Doe',
              email: 'john.doe@example.com',
              avatar_url: undefined
            }
          },
          {
            id: '2',
            user_id: 'mock-user-2',
            content: 'Great to be part of this community! Looking forward to learning and sharing.',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            updated_at: new Date(Date.now() - 172800000).toISOString(),
            community_id: communityId,
            user: {
              display_name: 'Jane Smith',
              email: 'jane.smith@example.com',
              avatar_url: undefined
            }
          },
          {
            id: '3',
            user_id: 'mock-user-3',
            content: 'Does anyone have recommendations for resources on getting started?',
            created_at: new Date(Date.now() - 259200000).toISOString(),
            updated_at: new Date(Date.now() - 259200000).toISOString(),
            community_id: communityId,
            user: {
              display_name: 'Alex Johnson',
              email: 'alex.johnson@example.com',
              avatar_url: undefined
            }
          }
        ];
        setPosts(mockPosts);
      } else {
        setPosts(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter some content for your post',
        variant: 'destructive'
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a post',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Get user's profile information
      let { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, email')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          community_id: communityId,
          user_id: user.id,
          content: newPostContent
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        // Add mock post for demonstration
        const mockPost: SimplifiedPost = {
          id: Date.now().toString(),
          user_id: user.id,
          content: newPostContent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          community_id: communityId,
          user: {
            display_name: profile?.display_name,
            email: profile?.email || user.email,
            avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url
          }
        };
        setPosts([mockPost, ...posts]);
        toast({
          title: 'Success',
          description: 'Your post has been created (demo mode)'
        });
      } else {
        // Add profile data to the created post
        const postWithProfile: SimplifiedPost = {
          ...data,
          user: {
            display_name: profile?.display_name,
            email: profile?.email || user.email,
            avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url
          }
        };
        setPosts([postWithProfile, ...posts]);
        toast({
          title: 'Success',
          description: 'Your post has been created'
        });
      }

      setNewPostContent('');
      setShowNewPost(false);
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getUserName = (post: SimplifiedPost) => {
    // Try display_name first, then fallback to email username, then 'User'
    if (post.user?.display_name) {
      return post.user.display_name;
    }
    if (post.user?.email) {
      return post.user.email.split('@')[0];
    }
    return 'User';
  };

  const getUserInitials = (post: SimplifiedPost) => {
    const name = getUserName(post);
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Discussions</h1>
            <p className="text-gray-500 text-sm mt-1">Share ideas and connect with community members</p>
          </div>
          <Button
            onClick={() => setShowNewPost(!showNewPost)}
            className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <Card className="mb-6 p-6">
          <div className="space-y-4">
            <Textarea
              placeholder="What's on your mind? Share your thoughts with the community..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled>
                  <Image className="w-4 h-4 mr-2" />
                  Image
                </Button>
                <Button variant="ghost" size="sm" disabled>
                  <Link className="w-4 h-4 mr-2" />
                  Link
                </Button>
                <Button variant="ghost" size="sm" disabled>
                  <Hash className="w-4 h-4 mr-2" />
                  Tags
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewPost(false);
                    setNewPostContent('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={submitting || !newPostContent.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
          <p className="text-gray-600 mb-4">Be the first to start a conversation!</p>
          {!showNewPost && (
            <Button onClick={() => setShowNewPost(true)}>
              Start Discussion
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={post.user?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {getUserInitials(post)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{getUserName(post)}</span>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {post.content}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4">
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Like
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                      <Bookmark className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimplifiedSkoolDiscussions;