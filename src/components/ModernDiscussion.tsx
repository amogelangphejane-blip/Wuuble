import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  Image as ImageIcon,
  Link as LinkIcon,
  Paperclip,
  ThumbsUp,
  Pin,
  Edit,
  Trash2,
  Reply,
  TrendingUp,
  Clock,
  Filter,
  Plus,
  X,
  ExternalLink,
  Copy,
  Flag,
  Bookmark
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ResponsiveImage from './ResponsiveImage';

// Memoized comment input component to prevent keyboard issues
const CommentInput = React.memo(({ 
  postId, 
  value, 
  onChange, 
  onSubmit, 
  disabled,
  userAvatarUrl 
}: {
  postId: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  userAvatarUrl: string;
}) => {
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }, [onSubmit]);

  return (
    <div className="flex gap-3 mt-4">
      <Avatar className="w-8 h-8">
        <AvatarImage src={userAvatarUrl} className="object-cover" />
      </Avatar>
      <div className="flex-1 flex gap-2">
        <Input
          placeholder="Write a comment..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="rounded-full border-gray-200 dark:border-gray-800"
        />
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={disabled}
          className="rounded-full bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

interface User {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  username?: string;
  user_metadata?: {
    display_name?: string;
    avatar_url?: string;
    full_name?: string;
    picture?: string;
  };
}

interface Post {
  id: string;
  community_id: string;
  user_id: string;
  content: string;
  image_url?: string;
  link_url?: string;
  link_title?: string;
  link_description?: string;
  link_image_url?: string;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  user: User;
  comments?: Comment[];
  liked_by_user?: boolean;
  bookmarked_by_user?: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: User;
}

interface ModernDiscussionProps {
  communityId: string;
  isOwner: boolean;
  isModerator?: boolean;
}

// Helper functions to extract user display information
const getUserDisplayName = (user: User): string => {
  // Priority: user_metadata.display_name > user_metadata.full_name > display_name > email prefix > 'Anonymous'
  return user.user_metadata?.display_name ||
         user.user_metadata?.full_name ||
         user.display_name ||
         user.email?.split('@')[0] ||
         'Anonymous';
};

const getUserAvatarUrl = (userObj: User | any, currentAuthUser?: any): string => {
  // Check if this is the current authenticated user
  const isCurrentUser = currentAuthUser && userObj?.id === currentAuthUser?.id;
  
  if (isCurrentUser) {
    console.log('👤 Processing current authenticated user avatar');
    console.log('🔍 Auth user data:', currentAuthUser);
    
    // Try all possible avatar sources for authenticated user
    const possibleAvatars = [
      currentAuthUser?.user_metadata?.avatar_url,
      currentAuthUser?.user_metadata?.picture, 
      currentAuthUser?.identities?.[0]?.identity_data?.avatar_url,
      currentAuthUser?.identities?.[0]?.identity_data?.picture,
      currentAuthUser?.user_metadata?.image_url,
      currentAuthUser?.picture,
      currentAuthUser?.avatar_url
    ].filter(Boolean);
    
    console.log('🖼️ Found possible avatars:', possibleAvatars);
    
    if (possibleAvatars.length > 0) {
      const selectedAvatar = possibleAvatars[0];
      console.log('✅ Using avatar for current user:', selectedAvatar);
      return selectedAvatar;
    }
    
    // If no real avatar found, create a personalized placeholder
    const displayName = getUserDisplayName(currentAuthUser);
    const placeholderUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=ffffff&size=150&bold=true&rounded=true`;
    console.log('🎭 Using placeholder for current user:', placeholderUrl);
    return placeholderUrl;
  }
  
  // For other users (like mock data users)
  const otherUserAvatar = 
    userObj?.user_metadata?.avatar_url ||
    userObj?.user_metadata?.picture ||
    userObj?.avatar_url ||
    userObj?.picture;
  
  if (otherUserAvatar) {
    return otherUserAvatar;
  }
  
  // Use default photos for mock users
  return getDefaultAvatarUrl(userObj?.id);
};

const getDefaultAvatarUrl = (userId?: string): string => {
  // Array of default profile pictures for variety
  const defaultAvatars = [
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face&auto=format&q=80'
  ];
  
  // Use userId to consistently assign the same default avatar to the same user
  if (userId) {
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % defaultAvatars.length;
    return defaultAvatars[index];
  }
  
  // Random default avatar if no userId
  return defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
};

const ModernDiscussion: React.FC<ModernDiscussionProps> = ({
  communityId,
  isOwner,
  isModerator = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackPostCreated, trackCommentPosted, trackLikeGiven } = useActivityTracker(communityId);
  
  // Debug current user data
  useEffect(() => {
    if (user) {
      console.log('🔍 Current authenticated user:', {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        identities: user.identities,
        app_metadata: user.app_metadata
      });
    }
  }, [user]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  
  // Link preview states
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPreview, setLinkPreview] = useState<{
    title?: string;
    description?: string;
    image?: string;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Image upload states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchPosts();

    // Set up real-time subscriptions for posts (only for new posts, not updates)
    const postsChannel = supabase
      .channel(`community_posts_${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_posts',
          filter: `community_id=eq.${communityId}`,
        },
        (payload) => {
          // Only refetch if it's a new post from another user
          if (payload.new && payload.new.user_id !== user?.id) {
            fetchPosts();
          }
        }
      )
      .subscribe();

    // More selective subscriptions to reduce unnecessary updates
    const likesChannel = supabase
      .channel(`community_post_likes_${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_post_likes',
        },
        (payload) => {
          // Only update if it's not the current user's action
          if (payload.new?.user_id !== user?.id || payload.old?.user_id !== user?.id) {
            // Debounce the update to prevent rapid re-renders
            setTimeout(() => fetchPosts(), 500);
          }
        }
      )
      .subscribe();

    // Comments channel with debouncing
    const commentsChannel = supabase
      .channel(`community_post_comments_${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_post_comments',
        },
        (payload) => {
          // Only refetch if it's a comment from another user
          if (payload.new && payload.new.user_id !== user?.id) {
            setTimeout(() => fetchPosts(), 500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [communityId, sortBy]);

  // Refresh user data to ensure we have the latest profile info
  useEffect(() => {
    const refreshUserData = async () => {
      if (user) {
        try {
          const { data: { user: refreshedUser } } = await supabase.auth.getUser();
          if (refreshedUser) {
            console.log('🔄 Refreshed user data:', refreshedUser);
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      }
    };
    
    refreshUserData();
  }, [user?.id]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Fetch real posts from the database - start with basic columns that should exist
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          id,
          content,
          created_at,
          updated_at,
          user_id,
          community_id,
          image_url
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: "Error",
          description: "Failed to load discussions",
          variant: "destructive"
        });
        return;
      }

      // For now, let's get the user profile info separately to avoid foreign key issues
      const postsWithUserInfo = await Promise.all(
        (data || []).map(async (post) => {
          // Try to get user profile info
          let userProfile = null;
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('user_id', post.user_id)
              .single();
            userProfile = profile;
          } catch (profileError) {
            console.log('Could not fetch profile for user:', post.user_id);
          }

          // Try to get likes count (table might not exist yet)
          let likesCount = 0;
          let userLiked = false;
          try {
            const { data: likes } = await supabase
              .from('community_post_likes')
              .select('user_id')
              .eq('post_id', post.id);
            
            likesCount = likes?.length || 0;
            userLiked = user ? (likes || []).some(like => like.user_id === user.id) : false;
          } catch (likesError) {
            console.log('Likes table not available yet:', likesError.message);
          }

          // Try to get comments count (table might not exist yet)
          let commentsCount = 0;
          let comments = [];
          try {
            const { data: commentData } = await supabase
              .from('community_post_comments')
              .select(`
                id,
                content,
                created_at,
                user_id,
                parent_comment_id
              `)
              .eq('post_id', post.id)
              .order('created_at', { ascending: true });

            commentsCount = commentData?.length || 0;
            
            // Get user info for comments
            if (commentData && commentData.length > 0) {
              const commentsWithUsers = await Promise.all(
                commentData.map(async (comment) => {
                  let commentUserProfile = null;
                  try {
                    const { data: commentProfile } = await supabase
                      .from('profiles')
                      .select('display_name, avatar_url')
                      .eq('user_id', comment.user_id)
                      .single();
                    commentUserProfile = commentProfile;
                  } catch (e) {
                    console.log('Could not fetch comment user profile');
                  }

                  return {
                    ...comment,
                    user: {
                      id: comment.user_id,
                      email: '',
                      user_metadata: {
                        display_name: commentUserProfile?.display_name || 'Anonymous',
                        avatar_url: commentUserProfile?.avatar_url || ''
                      }
                    }
                  };
                })
              );
              
              // Organize comments with replies
              const topLevelComments = commentsWithUsers.filter(c => !c.parent_comment_id);
              const commentReplies = commentsWithUsers.filter(c => c.parent_comment_id);
              
              comments = topLevelComments.map(comment => ({
                ...comment,
                replies: commentReplies.filter(reply => reply.parent_comment_id === comment.id)
              }));
            }
          } catch (commentsError) {
            console.log('Comments table not available yet:', commentsError.message);
          }

          return {
            id: post.id,
            community_id: post.community_id,
            user_id: post.user_id,
            content: post.content,
            image_url: post.image_url || null,
            link_url: null,
            link_title: null,
            link_description: null,
            link_image_url: null,
            likes_count: likesCount,
            comments_count: commentsCount,
            is_pinned: false, // Will be false until schema is updated
            created_at: post.created_at,
            updated_at: post.updated_at,
            user: {
              id: post.user_id,
              email: '',
              user_metadata: {
                display_name: userProfile?.display_name || 'Anonymous User',
                avatar_url: userProfile?.avatar_url || ''
              }
            },
            comments: comments,
            liked_by_user: userLiked,
            bookmarked_by_user: false
          };
        })
      );

      // Sort posts based on selected option
      const sortedPosts = [...postsWithUserInfo].sort((a, b) => {
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

  // Extract URL from text and fetch preview
  const handleContentChange = async (content: string) => {
    setNewPostContent(content);
    
    // Simple URL regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex);
    
    if (urls && urls[0] !== linkUrl) {
      setLinkUrl(urls[0]);
      fetchLinkPreview(urls[0]);
    } else if (!urls && linkPreview) {
      setLinkPreview(null);
      setLinkUrl('');
    }
  };

  const fetchLinkPreview = async (url: string) => {
    setLoadingPreview(true);
    try {
      // Simulate link preview fetch (in real app, this would be a backend call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock preview data based on common URLs
      let mockPreview = {
        title: 'Shared Link',
        description: 'Click to view this shared link',
        image: undefined
      };

      if (url.includes('github.com')) {
        mockPreview = {
          title: 'GitHub Repository',
          description: 'Check out this awesome project on GitHub',
          image: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        };
      } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        mockPreview = {
          title: 'YouTube Video',
          description: 'Watch this interesting video on YouTube',
          image: 'https://www.youtube.com/img/desktop/yt_1200.png'
        };
      } else if (url.includes('react.dev')) {
        mockPreview = {
          title: 'React - The library for web and native user interfaces',
          description: 'React lets you build user interfaces out of individual pieces called components.',
          image: 'https://react.dev/images/home/conf2021/cover.svg'
        };
      }

      setLinkPreview(mockPreview);
    } catch (error) {
      console.error('Error fetching link preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 10MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    setUploadingImage(true);
    try {
      if (!user) throw new Error('User not authenticated');

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('community-post-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading to storage:', error);
        throw error;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('community-post-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload image. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user || (!newPostContent.trim() && !selectedImage && !linkUrl)) return;

    setIsPosting(true);
    try {
      let imageUrl = '';
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      // Ensure content is never empty for database NOT NULL constraint
      // If there's an image but no text, use empty string instead of placeholder text
      const content = newPostContent.trim() || 
        (linkUrl ? '[Link Post]' : '');

      // Create the post in the database with image_url if available
      const postData: any = {
        community_id: communityId,
        user_id: user.id,
        content: content
      };

      // Only add image_url if we have one
      if (imageUrl) {
        postData.image_url = imageUrl;
      }

      const { data, error } = await supabase
        .from('community_posts')
        .insert([postData])
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        toast({
          title: "Error",
          description: "Failed to create post",
          variant: "destructive"
        });
        return;
      }

      // Track post creation for leaderboard
      try {
        trackPostCreated({
          content: content,
          has_image: !!imageUrl,
          category: 'discussion'
        });
      } catch (trackError) {
        console.error('Error tracking post creation:', trackError);
        // Don't fail the post creation if tracking fails
      }

      // Clear the form
      setNewPostContent('');
      setSelectedImage(null);
      setImagePreview(null);
      setLinkUrl('');
      setLinkPreview(null);
      setShowNewPost(false);
      
      // Refresh posts to show the new post
      await fetchPosts();
      
      toast({
        title: "Posted!",
        description: "Your post has been shared with the community",
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

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      // Check if likes table exists by trying to query it first
      const { data: testLikes, error: testError } = await supabase
        .from('community_post_likes')
        .select('count')
        .limit(1);
        
      if (testError) {
        toast({
          title: "Feature not available",
          description: "Likes feature requires database setup. Please apply the schema first.",
          variant: "destructive"
        });
        return;
      }

      if (post.liked_by_user) {
        // Remove like
        const { error } = await supabase
          .from('community_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase
          .from('community_post_likes')
          .insert([
            {
              post_id: postId,
              user_id: user.id
            }
          ]);

        if (error) throw error;

        // Track like action for leaderboard (only when adding a like)
        try {
          trackLikeGiven('post', postId);
        } catch (trackError) {
          console.error('Error tracking like:', trackError);
        }
      }

      // Update local state optimistically
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            liked_by_user: !p.liked_by_user,
            likes_count: p.liked_by_user ? p.likes_count - 1 : p.likes_count + 1
          };
        }
        return p;
      }));

    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Database schema may need to be applied.",
        variant: "destructive"
      });
    }
  };

  const handleBookmarkPost = async (postId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to bookmark posts",
        variant: "destructive"
      });
      return;
    }

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          bookmarked_by_user: !post.bookmarked_by_user
        };
      }
      return post;
    }));

    const post = posts.find(p => p.id === postId);
    if (post) {
      toast({
        title: post.bookmarked_by_user ? "Bookmark removed" : "Bookmarked",
        description: post.bookmarked_by_user ? "Post removed from bookmarks" : "Post saved to bookmarks",
      });
    }
  };

  const handleCommentInputChange = useCallback((postId: string, value: string) => {
    setCommentInputs(prev => ({
      ...prev,
      [postId]: value
    }));
  }, []);

  const handleComment = useCallback(async (postId: string) => {
    const content = commentInputs[postId];
    if (!user || !content?.trim()) return;

    try {
      // Create comment in database
      const { data, error } = await supabase
        .from('community_post_comments')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
            content: content.trim(),
            parent_comment_id: null
          }
        ])
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .single();

      if (error) throw error;

      // Create new comment object for optimistic update
      const newComment = {
        id: data.id,
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        created_at: data.created_at,
        parent_comment_id: null,
        user: {
          id: user.id,
          email: '',
          user_metadata: {
            display_name: user.user_metadata?.display_name || 'Anonymous',
            avatar_url: user.user_metadata?.avatar_url || ''
          }
        },
        replies: []
      };

      // Track comment creation for leaderboard
      try {
        trackCommentPosted(content.trim(), postId);
      } catch (trackError) {
        console.error('Error tracking comment creation:', trackError);
      }

      // Update posts state optimistically without refetching everything
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [...post.comments, newComment],
              comments_count: post.comments_count + 1
            };
          }
          return post;
        })
      );

      // Clear input AFTER state update to prevent keyboard issues
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      });
    }
  }, [commentInputs, user]);

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  const handleShare = async (post: Post) => {
    const shareData = {
      title: `Post by ${post.user.display_name}`,
      text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
      url: window.location.href + '#post-' + post.id
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link copied",
          description: "Post link has been copied to clipboard",
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const PostCard = ({ post }: { post: Post }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      id={`post-${post.id}`}
    >
      <Card className={cn(
        "overflow-hidden hover:shadow-md transition-all duration-300 border-0 shadow-sm bg-white dark:bg-gray-950",
        post.is_pinned && "ring-2 ring-blue-100 dark:ring-blue-900"
      )}>
        {post.is_pinned && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 px-4 py-2 flex items-center gap-2 border-b">
            <Pin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Pinned Post</span>
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Avatar className="w-12 h-12 ring-2 ring-gray-100 dark:ring-gray-800">
                <AvatarImage src={getUserAvatarUrl(post.user, user)} className="object-cover" />
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {getUserDisplayName(post.user)}
                  </h4>
                  {post.user.username && (
                    <span className="text-sm text-gray-500">@{post.user.username}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {(isOwner || isModerator) && !post.is_pinned && (
                  <DropdownMenuItem>
                    <Pin className="w-4 h-4 mr-2" />
                    Pin Post
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleBookmarkPost(post.id)}>
                  <Bookmark className="w-4 h-4 mr-2" />
                  {post.bookmarked_by_user ? 'Remove Bookmark' : 'Bookmark'}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Flag className="w-4 h-4 mr-2" />
                  Report
                </DropdownMenuItem>
                {post.user_id === user?.id && (
                  <>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 dark:text-red-400">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Post Content */}
          <div className="mb-4">
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
          </div>
          
          {/* Image Attachment */}
          {post.image_url && (
            <div className="mb-4">
              <ResponsiveImage 
                src={post.image_url} 
                alt="Post attachment" 
                className="rounded-xl w-full max-h-96 border border-gray-200 dark:border-gray-800"
                objectFit="cover"
              />
            </div>
          )}
          
          {/* Link Preview */}
          {post.link_url && (
            <div className="mb-4">
              <a 
                href={(() => {
                  const url = post.link_url!;
                  return url.startsWith('http://') || url.startsWith('https://') 
                    ? url 
                    : `https://${url}`;
                })()}
                target="_blank" 
                rel="noopener noreferrer"
                className="block border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-colors no-underline"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {post.link_image_url && (
                  <ResponsiveImage 
                    src={post.link_image_url} 
                    alt="" 
                    className="w-full h-48"
                    objectFit="cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                        {post.link_title || post.link_url}
                      </h5>
                      {post.link_description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {post.link_description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {post.link_url.startsWith('http') ? new URL(post.link_url).hostname : post.link_url}
                      </p>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-2 text-gray-600 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400",
                  post.liked_by_user && "text-red-500 dark:text-red-400"
                )}
                onClick={() => handleLikePost(post.id)}
              >
                <Heart className={cn(
                  "w-4 h-4",
                  post.liked_by_user && "fill-current"
                )} />
                <span className="text-sm font-medium">{post.likes_count}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                onClick={() => toggleComments(post.id)}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">{post.comments_count}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="gap-2 text-gray-600 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400"
                onClick={() => handleShare(post)}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400",
                post.bookmarked_by_user && "text-blue-500 dark:text-blue-400"
              )}
              onClick={() => handleBookmarkPost(post.id)}
            >
              <Bookmark className={cn(
                "w-4 h-4",
                post.bookmarked_by_user && "fill-current"
              )} />
            </Button>
          </div>
          
          {/* Comments Section */}
          <AnimatePresence>
            {expandedComments.has(post.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4"
              >
                {post.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={getUserAvatarUrl(comment.user, user)} className="object-cover" />
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl px-4 py-3">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {getUserDisplayName(comment.user)}
                        </p>
                        <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">
                          {comment.content}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-2">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {user && (
                  <CommentInput
                    postId={post.id}
                    value={commentInputs[post.id] || ''}
                    onChange={(value) => handleCommentInputChange(post.id, value)}
                    onSubmit={() => handleComment(post.id)}
                    disabled={!commentInputs[post.id]?.trim()}
                    userAvatarUrl={getUserAvatarUrl(user, user)}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Discussions</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Share ideas and connect with community members
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                {sortBy === 'recent' ? 'Recent' : sortBy === 'popular' ? 'Popular' : 'Trending'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
              className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              New Post
            </Button>
          )}
        </div>
      </div>

      {/* New Post Composer */}
      <AnimatePresence>
        {showNewPost && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={getUserAvatarUrl(user, user)} className="object-cover" />
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {getUserDisplayName(user)}
                      </p>
                      <p className="text-sm text-gray-500">Share with the community</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewPost(false);
                      setNewPostContent('');
                      setSelectedImage(null);
                      setImagePreview(null);
                      setLinkUrl('');
                      setLinkPreview(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                <Textarea
                  placeholder="What's on your mind? Share your thoughts, ask questions, or start a discussion..."
                  value={newPostContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={4}
                  className="resize-none border-0 text-base focus:ring-0 px-0"
                />

                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative">
                    <ResponsiveImage 
                      src={imagePreview} 
                      alt="Upload preview" 
                      className="rounded-lg max-h-64 w-full"
                      objectFit="cover"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Link Preview */}
                {linkPreview && (
                  <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                    {loadingPreview ? (
                      <div className="p-4 flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        <span className="text-sm text-gray-600">Loading preview...</span>
                      </div>
                    ) : (
                      <>
                        {linkPreview.image && (
                          <img src={linkPreview.image} alt="" className="w-full h-32 object-cover" />
                        )}
                        <div className="p-3">
                          <h5 className="font-medium text-sm line-clamp-1">{linkPreview.title}</h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                            {linkPreview.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{linkUrl}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2 text-gray-600 hover:text-blue-500"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Photo
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-gray-600 hover:text-green-500"
                      onClick={() => {
                        const url = prompt('Enter a URL to share:');
                        if (url) {
                          setLinkUrl(url);
                          fetchLinkPreview(url);
                        }
                      }}
                    >
                      <LinkIcon className="w-4 h-4" />
                      Link
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewPost(false);
                        setNewPostContent('');
                        setSelectedImage(null);
                        setImagePreview(null);
                        setLinkUrl('');
                        setLinkPreview(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreatePost}
                      disabled={(!newPostContent.trim() && !selectedImage && !linkUrl) || isPosting}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {isPosting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Posting...
                        </>
                      ) : (
                        'Post'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Posts List */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardHeader>
                <div className="animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="text-center py-12 border-0 shadow-sm">
          <CardContent>
            <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">No discussions yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Be the first to start a conversation and connect with community members!
            </p>
            {user && (
              <Button
                onClick={() => setShowNewPost(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                Start Discussion
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default ModernDiscussion;