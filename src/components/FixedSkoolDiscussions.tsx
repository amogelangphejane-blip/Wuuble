import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: string;
  author: {
    name: string;
    avatar?: string;
    level: number;
    badge?: string;
  };
  title: string;
  content: string;
  category: string;
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  isPinned: boolean;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: Date;
}

interface FixedSkoolDiscussionsProps {
  communityId: string;
}

export const FixedSkoolDiscussions: React.FC<FixedSkoolDiscussionsProps> = ({ communityId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    if (communityId) {
      fetchPosts();
    }
  }, [communityId, sortBy]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // First, try to fetch posts with profiles
      let { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .eq('community_id', communityId)
        .order(sortBy === 'recent' ? 'created_at' : 'likes_count', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        
        // Use mock data if database fetch fails
        const mockPosts: Post[] = [
          {
            id: '1',
            author: {
              name: 'Community Admin',
              avatar: undefined,
              level: 10,
              badge: 'moderator'
            },
            title: 'Welcome to our Community!',
            content: 'This is a sample post. If you\'re seeing this, the database connection might need to be configured. Please run the SQL setup script in your Supabase dashboard.',
            category: 'Announcements',
            tags: ['welcome', 'introduction'],
            likes: 15,
            comments: 3,
            views: 45,
            isPinned: true,
            isLiked: false,
            isBookmarked: false,
            createdAt: new Date(Date.now() - 86400000)
          },
          {
            id: '2',
            author: {
              name: 'John Doe',
              avatar: undefined,
              level: 5,
              badge: null
            },
            title: 'Getting Started Guide',
            content: 'Here are some tips for new members to get the most out of our community...',
            category: 'General',
            tags: ['guide', 'tips'],
            likes: 8,
            comments: 2,
            views: 23,
            isPinned: false,
            isLiked: false,
            isBookmarked: false,
            createdAt: new Date(Date.now() - 172800000)
          }
        ];
        
        setPosts(mockPosts);
        toast({
          title: 'Using Demo Data',
          description: 'Unable to fetch posts from database. Showing demo content.',
          variant: 'default'
        });
        return;
      }

      // Fetch user profiles separately if needed
      const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
      let profiles: any = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url, email')
          .in('user_id', userIds);
        
        if (profilesData) {
          profiles = profilesData.reduce((acc, profile) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {});
        }
      }

      // Also try to get user emails from auth.users if profiles are missing
      const { data: userData } = await supabase
        .from('auth.users')
        .select('id, email')
        .in('id', userIds);
      
      const users = userData?.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {}) || {};

      // Transform the data
      const transformedPosts: Post[] = (postsData || []).map(post => {
        const profile = profiles[post.user_id];
        const authUser = users[post.user_id];
        const userName = profile?.username || profile?.display_name || profile?.email?.split('@')[0] || authUser?.email?.split('@')[0] || 'User';
        
        return {
          id: post.id,
          author: {
            name: userName,
            avatar: profile?.avatar_url,
            level: Math.floor(Math.random() * 10) + 1,
            badge: null
          },
          title: post.title || 'Untitled',
          content: post.content || '',
          category: post.category || 'General',
          tags: post.tags || [],
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          views: post.views_count || 0,
          isPinned: post.is_pinned || false,
          isLiked: false,
          isBookmarked: false,
          createdAt: new Date(post.created_at)
        };
      });

      setPosts(transformedPosts);
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: 'Error',
        description: 'Failed to load discussions. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide both title and content for your post.',
        variant: 'destructive'
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a post.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('community_posts')
        .insert({
          community_id: communityId,
          user_id: user.id,
          title: newPostTitle,
          content: newPostContent,
          category: selectedCategory,
          tags: [],
          is_pinned: false
        });

      if (error) {
        console.error('Error creating post:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to create post. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      // Success
      toast({
        title: 'Success',
        description: 'Your post has been created!',
      });

      // Reset form and refresh posts
      setNewPostTitle('');
      setNewPostContent('');
      setShowNewPost(false);
      fetchPosts();
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive'
      });
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to like posts.',
        variant: 'default'
      });
      return;
    }

    // Optimistic update
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (!post.isLiked) {
        // Like the post
        await supabase
          .from('community_post_likes')
          .insert({ post_id: postId, user_id: user.id });
      } else {
        // Unlike the post
        await supabase
          .from('community_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // Revert optimistic update on error
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      ));
    }
  };

  const handleBookmark = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isBookmarked: !post.isBookmarked }
        : post
    ));
  };

  const categories = [
    'General',
    'Announcements',
    'Discussion',
    'Question',
    'Resources',
    'Feedback'
  ];

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Discussions</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                {sortBy === 'recent' ? 'Recent' : 'Popular'}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('recent')}>
                <Clock className="w-4 h-4 mr-2" />
                Most Recent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('popular')}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Most Popular
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <Input
              placeholder="Post title..."
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              className="text-lg font-semibold"
            />
            
            <Textarea
              placeholder="What's on your mind?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            
            <div className="flex items-center justify-between">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewPost(false);
                    setNewPostTitle('');
                    setNewPostContent('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreatePost}>
                  Post
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
              {post.isPinned && (
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <Pin className="w-4 h-4" />
                  <span>Pinned</span>
                </div>
              )}
              
              <div className="flex gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={post.author.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {post.author.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{post.author.name}</span>
                      {post.author.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {post.author.badge}
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">{post.content}</p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{post.category}</Badge>
                    {post.tags.map((tag, i) => (
                      <Badge key={i} variant="outline">#{tag}</Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={cn(post.isLiked && "text-red-500")}
                    >
                      <Heart className={cn("w-4 h-4 mr-1", post.isLiked && "fill-current")} />
                      {post.likes}
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      {post.comments}
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      {post.views}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBookmark(post.id)}
                      className={cn(post.isBookmarked && "text-blue-500")}
                    >
                      <Bookmark className={cn("w-4 h-4", post.isBookmarked && "fill-current")} />
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4" />
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

export default FixedSkoolDiscussions;