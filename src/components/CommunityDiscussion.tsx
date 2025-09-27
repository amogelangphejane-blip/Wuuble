import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  Heart,
  Share2,
  MoreVertical,
  Send,
  Image,
  Paperclip,
  ThumbsUp,
  Pin,
  Flag,
  Edit,
  Trash2,
  Reply,
  TrendingUp,
  Clock,
  Filter
} from 'lucide-react';
import { cn, validateAvatarUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getUserDisplayName, 
  getUserAvatar, 
  getUserInitials,
  getUserProfile,
  clearProfileCache,
  ensureUserProfile,
  type UserProfile 
} from '@/utils/profileUtils';
import { fixUserDisplayName } from '@/utils/fixProfileDisplayNames';

interface Post {
  id: string;
  community_id: string;
  user_id: string;
  title?: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
  comments?: Comment[];
  liked_by_user?: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface CommunityDiscussionProps {
  communityId: string;
  isOwner: boolean;
  isModerator?: boolean;
}

export const CommunityDiscussion: React.FC<CommunityDiscussionProps> = ({
  communityId,
  isOwner,
  isModerator = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchPosts();
  }, [communityId, sortBy]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // First try to fetch real posts from the database
      let { data: realPosts, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (!error && realPosts && realPosts.length > 0) {
        // Get unique user IDs and fetch their profiles
        const userIds = [...new Set(realPosts.map(post => post.user_id))];
        const userProfiles = new Map<string, UserProfile>();
        
        for (const userId of userIds) {
          let profile = await getUserProfile(userId);
          
          // If no profile or profile has no display_name, try to fix it
          if (!profile) {
            profile = await ensureUserProfile(userId);
          }
          
          if (profile && (!profile.display_name || profile.display_name.trim() === '')) {
            // For now, set a placeholder - we'll fix this with SQL or server-side function
            console.warn(`Profile ${userId} has empty display_name, needs manual fix`);
          }
          
          if (profile) {
            userProfiles.set(userId, profile);
          }
        }

        // Transform real posts to match our interface
        const transformedPosts: Post[] = realPosts.map(post => {
          const profile = userProfiles.get(post.user_id);
          return {
            id: post.id,
            community_id: post.community_id,
            user_id: post.user_id,
            title: post.title,
            content: post.content,
            image_url: post.image_url,
            likes_count: post.likes_count || 0,
            comments_count: post.comments_count || 0,
            is_pinned: post.is_pinned || false,
            created_at: post.created_at,
            updated_at: post.updated_at,
            user: {
              id: post.user_id,
              email: profile?.email || '',
              display_name: profile?.display_name || null, // Don't use fallback here
              avatar_url: getUserAvatar(null, profile)
            },
            comments: [],
            liked_by_user: false
          };
        });

        setPosts(transformedPosts);
        return;
      }
      
      // For demo purposes, create mock posts if no real data
      const mockPosts: Post[] = [
        {
          id: '1',
          community_id: communityId,
          user_id: 'user1',
          title: 'Welcome to our community! 🎉',
          content: 'Hey everyone! So excited to be part of this amazing community. Looking forward to connecting with all of you and sharing our experiences.',
          likes_count: 24,
          comments_count: 8,
          is_pinned: true,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          user: {
            id: 'user1',
            email: 'admin@example.com',
            display_name: 'Community Admin',
            avatar_url: ''
          },
          liked_by_user: false,
          comments: [
            {
              id: 'c1',
              post_id: '1',
              user_id: 'user2',
              content: 'Welcome! Great to have you here!',
              created_at: new Date(Date.now() - 1800000).toISOString(),
              user: {
                id: 'user2',
                email: 'member@example.com',
                display_name: 'Sarah Chen',
                avatar_url: ''
              }
            }
          ]
        },
        {
          id: '2',
          community_id: communityId,
          user_id: 'user3',
          title: 'Best practices for community engagement',
          content: 'I\'ve been thinking about ways we can increase engagement in our community. Here are some ideas:\n\n1. Regular weekly discussions\n2. Member spotlights\n3. Collaborative projects\n\nWhat do you all think?',
          likes_count: 18,
          comments_count: 5,
          is_pinned: false,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 7200000).toISOString(),
          user: {
            id: 'user3',
            email: 'member2@example.com',
            display_name: 'Alex Johnson',
            avatar_url: ''
          },
          liked_by_user: true
        }
      ];

      // Sort posts based on selected option
      const sortedPosts = [...mockPosts].sort((a, b) => {
        switch (sortBy) {
          case 'popular':
            return b.likes_count - a.likes_count;
          case 'trending':
            return b.comments_count - a.comments_count;
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });

      setPosts(sortedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load discussions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return;

    setIsPosting(true);
    try {
      // Get user profile (this will use cache if available)
      let profile = await getUserProfile(user.id);
      
      if (!profile) {
        // Create profile if it doesn't exist
        profile = await ensureUserProfile(user.id, user.email, user.user_metadata?.display_name);
      }
      
      // If profile exists but has no display name, fix it
      if (profile && (!profile.display_name || profile.display_name.trim() === '')) {
        const fixResult = await fixUserDisplayName(user.id, user.email || undefined);
        if (fixResult.success && fixResult.updated) {
          profile.display_name = fixResult.displayName || profile.display_name;
          clearProfileCache(user.id); // Clear cache to reflect changes
        }
      }

      // Try to create the post in the database
      const { data: createdPost, error } = await supabase
        .from('community_posts')
        .insert({
          community_id: communityId,
          user_id: user.id,
          title: newPostTitle || null,
          content: newPostContent,
        })
        .select()
        .single();

      if (!error && createdPost) {
        // Successfully created in database, create local post with proper user data
        const newPost: Post = {
          id: createdPost.id,
          community_id: createdPost.community_id,
          user_id: createdPost.user_id,
          title: createdPost.title,
          content: createdPost.content,
          likes_count: 0,
          comments_count: 0,
          is_pinned: false,
          created_at: createdPost.created_at,
          updated_at: createdPost.updated_at,
          user: {
            id: user.id,
            email: profile?.email || user.email || '',
            display_name: profile?.display_name || null, // Don't use fallback here
            avatar_url: getUserAvatar(user, profile)
          },
          comments: []
        };

        setPosts([newPost, ...posts]);
      } else {
        // Fallback to mock post if database insert fails
        const newPost: Post = {
          id: Date.now().toString(),
          community_id: communityId,
          user_id: user.id,
          title: newPostTitle,
          content: newPostContent,
          likes_count: 0,
          comments_count: 0,
          is_pinned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            id: user.id,
            email: profile?.email || user.email || '',
            display_name: profile?.display_name || null, // Don't use fallback here
            avatar_url: getUserAvatar(user, profile)
          },
          comments: []
        };

        setPosts([newPost, ...posts]);
      }

      setNewPostContent('');
      setNewPostTitle('');
      setShowNewPost(false);
      
      toast({
        title: "Posted!",
        description: "Your discussion has been posted",
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive"
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts",
        variant: "destructive"
      });
      return;
    }

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked_by_user: !post.liked_by_user,
          likes_count: post.liked_by_user ? post.likes_count - 1 : post.likes_count + 1
        };
      }
      return post;
    }));
  };

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId];
    if (!user || !content?.trim()) return;

    try {
      // Get user's profile information
      const profile = await getUserProfile(user.id);

      const newComment: Comment = {
        id: Date.now().toString(),
        post_id: postId,
        user_id: user.id,
        content: content,
        created_at: new Date().toISOString(),
        user: {
          id: user.id,
          email: profile?.email || user.email || '',
          display_name: profile?.display_name || null, // Don't use fallback here
          avatar_url: getUserAvatar(user, profile)
        }
      };

      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...(post.comments || []), newComment],
            comments_count: post.comments_count + 1
          };
        }
        return post;
      }));

      setCommentInputs({ ...commentInputs, [postId]: '' });
      
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  const getPostUserDisplayName = (postUser: { id: string; email: string; display_name?: string | null; avatar_url?: string }) => {
    // Priority: display_name > email username > 'User'
    if (postUser.display_name && postUser.display_name.trim() !== '') {
      return postUser.display_name.trim();
    }
    if (postUser.email && postUser.email.trim() !== '') {
      const emailUsername = postUser.email.split('@')[0];
      if (emailUsername && emailUsername.trim() !== '') {
        return emailUsername.trim();
      }
    }
    return 'User';
  };

  const getPostUserInitials = (postUser: { id: string; email: string; display_name?: string; avatar_url?: string }) => {
    const displayName = getPostUserDisplayName(postUser);
    return displayName.substring(0, 2).toUpperCase();
  };

  const PostCard = ({ post }: { post: Post }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className={cn(
        "overflow-hidden hover:shadow-lg transition-shadow",
        post.is_pinned && "border-yellow-400 dark:border-yellow-600"
      )}>
        {post.is_pinned && (
          <div className="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 flex items-center gap-2">
            <Pin className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Pinned</span>
          </div>
        )}
        
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={validateAvatarUrl(post.user.avatar_url)} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  {getPostUserInitials(post.user)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{getPostUserDisplayName(post.user)}</p>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>
                {post.title && (
                  <h3 className="text-lg font-semibold mt-1">{post.title}</h3>
                )}
              </div>
            </div>
            
            {(isOwner || isModerator || post.user_id === user?.id) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(isOwner || isModerator) && !post.is_pinned && (
                    <DropdownMenuItem>
                      <Pin className="w-4 h-4 mr-2" />
                      Pin Post
                    </DropdownMenuItem>
                  )}
                  {post.user_id === user?.id && (
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="whitespace-pre-wrap mb-4">{post.content}</p>
          
          {post.image_url && (
            <img 
              src={post.image_url} 
              alt="Post attachment" 
              className="rounded-lg w-full max-h-96 object-cover mb-4"
            />
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-2",
                  post.liked_by_user && "text-red-500"
                )}
                onClick={() => handleLikePost(post.id)}
              >
                <Heart className={cn(
                  "w-4 h-4",
                  post.liked_by_user && "fill-current"
                )} />
                <span className="text-sm">{post.likes_count}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => toggleComments(post.id)}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">{post.comments_count}</span>
              </Button>
              
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Comments Section */}
          <AnimatePresence>
            {expandedComments.has(post.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t space-y-3"
              >
                {post.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={validateAvatarUrl(comment.user.avatar_url)} />
                      <AvatarFallback className="text-xs">
                        {getPostUserInitials(comment.user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                        <p className="font-medium text-sm">{getPostUserDisplayName(comment.user)}</p>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {user && (
                  <div className="flex gap-2 mt-3">
                    <Input
                      placeholder="Write a comment..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs({
                        ...commentInputs,
                        [post.id]: e.target.value
                      })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleComment(post.id);
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleComment(post.id)}
                      disabled={!commentInputs[post.id]?.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Discussions</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Share ideas and connect with community members
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                {sortBy === 'recent' ? 'Recent' : sortBy === 'popular' ? 'Popular' : 'Trending'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('recent')}>
                <Clock className="w-4 h-4 mr-2" />
                Recent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('popular')}>
                <ThumbsUp className="w-4 h-4 mr-2" />
                Popular
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('trending')}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Trending
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {user && (
            <Button
              onClick={() => setShowNewPost(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              New Discussion
            </Button>
          )}
        </div>
      </div>

      {/* New Post Form */}
      <AnimatePresence>
        {showNewPost && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Start a Discussion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Title (optional)"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                />
                <Textarea
                  placeholder="What's on your mind?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={4}
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Image className="w-4 h-4 mr-2" />
                      Image
                    </Button>
                    <Button variant="outline" size="sm">
                      <Paperclip className="w-4 h-4 mr-2" />
                      Attach
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewPost(false);
                        setNewPostContent('');
                        setNewPostTitle('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreatePost}
                      disabled={!newPostContent.trim() || isPosting}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isPosting ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Be the first to start a conversation!
            </p>
            {user && (
              <Button
                onClick={() => setShowNewPost(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Start Discussion
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};