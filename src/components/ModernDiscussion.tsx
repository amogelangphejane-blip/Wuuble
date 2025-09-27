import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
  link_image?: string;
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

const getUserAvatarUrl = (user: User | any): string => {
  // Debug log to see what data we have
  if (typeof window !== 'undefined') {
    console.log('User avatar data:', {
      id: user?.id,
      email: user?.email,
      user_metadata: user?.user_metadata,
      avatar_url: user?.avatar_url,
      picture: user?.user_metadata?.picture,
      avatar_url_metadata: user?.user_metadata?.avatar_url
    });
  }
  
  // Priority order for avatar URL
  const avatarUrl = 
    user?.user_metadata?.avatar_url ||      // Supabase user_metadata.avatar_url
    user?.user_metadata?.picture ||         // Auth provider picture (Google, etc.)
    user?.avatar_url ||                     // Direct avatar_url property
    user?.user_metadata?.image_url ||       // Some providers use image_url
    user?.picture;                          // Some auth systems use direct picture
  
  // Only use default if no avatar found
  if (!avatarUrl) {
    console.log('No avatar found for user, using default');
    return getDefaultAvatarUrl(user?.id);
  }
  
  console.log('Using avatar URL:', avatarUrl);
  return avatarUrl;
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
  }, [communityId, sortBy]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // For demo purposes, create mock posts with enhanced data
      const mockPosts: Post[] = [
        {
          id: '1',
          community_id: communityId,
          user_id: 'user1',
          content: 'Welcome to our community! 🎉 I\'m excited to be here and looking forward to connecting with everyone. This is a space where we can share ideas, collaborate, and learn from each other. Feel free to introduce yourselves and share what brings you to our community!',
          image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=300&fit=crop',
          likes_count: 24,
          comments_count: 8,
          is_pinned: true,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          user: {
            id: 'user1',
            email: 'admin@example.com',
            user_metadata: {
              display_name: 'Alexandra Chen',
              avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
              full_name: 'Alexandra Chen'
            },
            username: 'alexandra_chen'
          },
          liked_by_user: false,
          bookmarked_by_user: false,
          comments: [
            {
              id: 'c1',
              post_id: '1',
              user_id: 'user2',
              content: 'Welcome Alexandra! So excited to be part of this community 🚀',
              created_at: new Date(Date.now() - 1800000).toISOString(),
              user: {
                id: 'user2',
                email: 'member@example.com',
                user_metadata: {
                  display_name: 'Sarah Johnson',
                  avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
                  full_name: 'Sarah Johnson'
                },
                username: 'sarah_j'
              }
            },
            {
              id: 'c2',
              post_id: '1',
              user_id: 'user3',
              content: 'Thanks for creating this space! Looking forward to the discussions ahead.',
              created_at: new Date(Date.now() - 900000).toISOString(),
              user: {
                id: 'user3',
                email: 'member3@example.com',
                user_metadata: {
                  display_name: 'Mike Rodriguez',
                  avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                  full_name: 'Mike Rodriguez'
                },
                username: 'mike_r'
              }
            }
          ]
        },
        {
          id: '2',
          community_id: communityId,
          user_id: 'user2',
          content: 'Just discovered this amazing resource for learning React! The interactive tutorials and real-world examples make it super easy to understand complex concepts. Highly recommend checking it out if you\'re looking to level up your React skills.',
          link_url: 'https://react.dev',
          link_title: 'React - The library for web and native user interfaces',
          link_description: 'React lets you build user interfaces out of individual pieces called components. Create your own React components like Thumbnail, LikeButton, and Video.',
          link_image: 'https://react.dev/images/home/conf2021/cover.svg',
          likes_count: 18,
          comments_count: 5,
          is_pinned: false,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 7200000).toISOString(),
          user: {
            id: 'user2',
            email: 'member@example.com',
            user_metadata: {
              display_name: 'Sarah Johnson',
              avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
              full_name: 'Sarah Johnson'
            },
            username: 'sarah_j'
          },
          liked_by_user: true,
          bookmarked_by_user: true
        },
        {
          id: '3',
          community_id: communityId,
          user_id: 'user4',
          content: 'What are your favorite productivity tools? I\'m always looking for ways to optimize my workflow and would love to hear what works for you! Here are some of mine:\n\n• Notion for note-taking and project management\n• Figma for design collaboration\n• VS Code for development\n• Slack for team communication\n\nWhat would you add to this list?',
          likes_count: 12,
          comments_count: 15,
          is_pinned: false,
          created_at: new Date(Date.now() - 10800000).toISOString(),
          updated_at: new Date(Date.now() - 10800000).toISOString(),
          user: {
            id: 'user4',
            email: 'member4@example.com',
            user_metadata: {
              display_name: 'Jordan Kim',
              // No avatar_url to demonstrate default avatar functionality
              full_name: 'Jordan Kim'
            },
            username: 'jordan_k'
          },
          liked_by_user: false,
          bookmarked_by_user: false
        },
        {
          id: '4',
          community_id: communityId,
          user_id: 'user5',
          content: 'Just finished reading a great article on React performance optimization. The key takeaways were using React.memo for expensive components and optimizing re-renders with useMemo and useCallback. Anyone else have tips for React performance?',
          likes_count: 8,
          comments_count: 3,
          is_pinned: false,
          created_at: new Date(Date.now() - 14400000).toISOString(),
          updated_at: new Date(Date.now() - 14400000).toISOString(),
          user: {
            id: 'user5',
            email: 'developer@example.com',
            user_metadata: {
              display_name: 'Emily Rodriguez',
              avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
              full_name: 'Emily Rodriguez'
            },
            username: 'emily_dev'
          },
          liked_by_user: false,
          bookmarked_by_user: false
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
      // Simulate image upload (in real app, this would upload to Supabase storage)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return a mock URL (in real app, this would be the actual uploaded file URL)
      return URL.createObjectURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
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

      const newPost: Post = {
        id: Date.now().toString(),
        community_id: communityId,
        user_id: user.id,
        content: newPostContent,
        image_url: imageUrl,
        link_url: linkUrl || undefined,
        link_title: linkPreview?.title,
        link_description: linkPreview?.description,
        link_image: linkPreview?.image,
        likes_count: 0,
        comments_count: 0,
        is_pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email || '',
          user_metadata: user.user_metadata,
          username: user.user_metadata?.username || user.email?.split('@')[0]
        },
        comments: [],
        liked_by_user: false,
        bookmarked_by_user: false
      };

      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setSelectedImage(null);
      setImagePreview(null);
      setLinkUrl('');
      setLinkPreview(null);
      setShowNewPost(false);
      
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

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId];
    if (!user || !content?.trim()) return;

    try {
      const newComment: Comment = {
        id: Date.now().toString(),
        post_id: postId,
        user_id: user.id,
        content: content,
        created_at: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email || '',
          user_metadata: user.user_metadata,
          username: user.user_metadata?.username || user.email?.split('@')[0]
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
                <AvatarImage src={getUserAvatarUrl(post.user)} className="object-cover" />
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
                href={post.link_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
              >
                {post.link_image && (
                  <ResponsiveImage 
                    src={post.link_image} 
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
                        {new URL(post.link_url).hostname}
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
                      <AvatarImage src={getUserAvatarUrl(comment.user)} className="object-cover" />
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
                  <div className="flex gap-3 mt-4">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={getUserAvatarUrl(user)} className="object-cover" />
                    </Avatar>
                    <div className="flex-1 flex gap-2">
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
                        className="rounded-full border-gray-200 dark:border-gray-800"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                        className="rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
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
                      <AvatarImage src={getUserAvatarUrl(user)} className="object-cover" />
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