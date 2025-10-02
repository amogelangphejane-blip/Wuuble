import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  MessageCircle, 
  Heart, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp,
  MoreHorizontal,
  Reply,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Star,
  Tag,
  Smile,
  ImageIcon,
  Paperclip,
  Bookmark,
  Share2,
  Flag,
  Pin,
  ThumbsUp,
  Laugh,
  Angry,
  Sad,
  Trash2,
  Link,
  Globe,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { validateAvatarUrl } from '@/lib/utils';
import { PostImageUpload } from '@/components/PostImageUpload';
import { LinkPreview } from '@/components/LinkPreview';

interface CommunityPostLike {
  id: string;
  user_id: string;
  created_at: string;
  profiles: {
    display_name: string | null;
  } | null;
}

interface CommunityPostReaction {
  id: string;
  user_id: string;
  reaction_type: 'like' | 'love' | 'laugh' | 'angry' | 'sad' | 'thumbsup';
  created_at: string;
  profiles: {
    display_name: string | null;
  } | null;
}

interface CommunityPostComment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  parent_comment_id: string | null;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  replies?: CommunityPostComment[];
}

interface CommunityPost {
  id: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  link_title: string | null;
  link_description: string | null;
  link_image_url: string | null;
  link_domain: string | null;
  created_at: string;
  user_id: string;
  category?: string | null;
  is_pinned?: boolean;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  likes: CommunityPostLike[];
  reactions: CommunityPostReaction[];
  comments: CommunityPostComment[];
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
  user_reactions: CommunityPostReaction[];
}

interface CommunityPostsProps {
  communityId: string;
  communityName?: string;
  communityCreatorId?: string;
}

const POST_CATEGORIES = [
  { value: 'general', label: '💬 General Discussion', color: 'bg-blue-100 text-blue-800' },
  { value: 'question', label: '❓ Questions', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'announcement', label: '📢 Announcements', color: 'bg-green-100 text-green-800' },
  { value: 'event', label: '📅 Events', color: 'bg-purple-100 text-purple-800' },
  { value: 'resource', label: '📚 Resources', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'showcase', label: '🎨 Showcase', color: 'bg-pink-100 text-pink-800' },
  { value: 'link', label: '🔗 Links', color: 'bg-cyan-100 text-cyan-800' },
];

const REACTION_TYPES = [
  { type: 'like', icon: '👍', label: 'Like' },
  { type: 'love', icon: '❤️', label: 'Love' },
  { type: 'laugh', icon: '😂', label: 'Laugh' },
  { type: 'thumbsup', icon: '👍', label: 'Thumbs Up' },
  { type: 'angry', icon: '😠', label: 'Angry' },
  { type: 'sad', icon: '😢', label: 'Sad' },
];

export const CommunityPosts = ({ communityId, communityName = 'Community', communityCreatorId }: CommunityPostsProps) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<CommunityPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('general');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [newPostLink, setNewPostLink] = useState<{
    url: string;
    title: string;
    description: string;
    image: string;
    domain: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [showingReplies, setShowingReplies] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [activeTab, setActiveTab] = useState('all');
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const [deletingPost, setDeletingPost] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch posts with likes and comments
  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          id,
          content,
          image_url,
          link_url,
          link_title,
          link_description,
          link_image_url,
          link_domain,
          created_at,
          user_id,
          category,
          is_pinned,
          profiles!community_posts_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', communityId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: "Error",
          description: "Failed to load community posts",
          variant: "destructive",
        });
        return;
      }

      // Fetch likes, reactions, and comments for each post
      const postsWithInteractions = await Promise.all(
        (data || []).map(async (post) => {
          // Fetch likes
          const { data: likes } = await supabase
            .from('community_post_likes')
            .select(`
              id,
              user_id,
              created_at,
              profiles!community_post_likes_user_id_fkey (
                display_name
              )
            `)
            .eq('post_id', post.id);

          // Fetch comments
          const { data: comments } = await supabase
            .from('community_post_comments')
            .select(`
              id,
              content,
              created_at,
              updated_at,
              user_id,
              parent_comment_id,
              profiles!community_post_comments_user_id_fkey (
                display_name,
                avatar_url
              )
            `)
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });

          // Organize comments with replies
          const topLevelComments = (comments || []).filter(c => !c.parent_comment_id);
          const commentReplies = (comments || []).filter(c => c.parent_comment_id);
          
          const commentsWithReplies = topLevelComments.map(comment => ({
            ...comment,
            replies: commentReplies.filter(reply => reply.parent_comment_id === comment.id)
          }));

          return {
            ...post,
            likes: likes || [],
            reactions: [], // TODO: Implement reactions table
            comments: commentsWithReplies,
            like_count: likes?.length || 0,
            comment_count: comments?.length || 0,
            user_has_liked: user ? (likes || []).some(like => like.user_id === user.id) : false,
            user_reactions: [], // TODO: Implement user reactions
          };
        })
      );

      setPosts(postsWithInteractions);
      setFilteredPosts(postsWithInteractions);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search posts
  const filterPosts = () => {
    let filtered = [...posts];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.content.toLowerCase().includes(query) ||
        (post.profiles?.display_name?.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Apply tab filter
    if (activeTab === 'bookmarked') {
      filtered = filtered.filter(post => bookmarkedPosts.has(post.id));
    } else if (activeTab === 'my-posts') {
      filtered = filtered.filter(post => post.user_id === user?.id);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.like_count + b.comment_count) - (a.like_count + a.comment_count));
        break;
      case 'trending':
        filtered.sort((a, b) => {
          const ageA = (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60);
          const ageB = (Date.now() - new Date(b.created_at).getTime()) / (1000 * 60 * 60);
          const aScore = (a.like_count * 2 + a.comment_count) / Math.max(1, ageA);
          const bScore = (b.like_count * 2 + b.comment_count) / Math.max(1, ageB);
          return bScore - aScore;
        });
        break;
      default: // recent
        filtered.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }

    setFilteredPosts(filtered);
  };

  // Toggle bookmark
  const toggleBookmark = (postId: string) => {
    setBookmarkedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
        toast({ title: "Removed from bookmarks" });
      } else {
        newSet.add(postId);
        toast({ title: "Added to bookmarks" });
      }
      return newSet;
    });
  };

  // Create a new post
  const createPost = async () => {
    if ((!newPost.trim() && !newPostImage && !newPostLink) || !user) return;

    setPosting(true);
    try {
      // Ensure content is never empty string for database NOT NULL constraint
      const content = newPost.trim() || 
        (newPostImage ? '[Image]' : '') ||
        (newPostLink ? '[Link]' : '');
      
      const { error } = await supabase
        .from('community_posts')
        .insert([
          {
            community_id: communityId,
            user_id: user.id,
            content: content,
            image_url: newPostImage,
            link_url: newPostLink?.url || null,
            link_title: newPostLink?.title || null,
            link_description: newPostLink?.description || null,
            link_image_url: newPostLink?.image || null,
            link_domain: newPostLink?.domain || null,
            category: newPostCategory,
          }
        ]);

      if (error) {
        console.error('Error creating post:', error);
        toast({
          title: "Error",
          description: "Failed to create post",
          variant: "destructive",
        });
        return;
      }

      setNewPost('');
      setNewPostCategory('general');
      setNewPostImage(null);
      setNewPostLink(null);
      await fetchPosts(); // Refresh posts
      
      // Scroll to top after posting
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = 0;
        }
      }, 100);

    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  // Toggle like on a post
  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!user) return;

    try {
      if (currentlyLiked) {
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
              user_id: user.id,
            }
          ]);

        if (error) throw error;
      }

      // Update local state
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                user_has_liked: !currentlyLiked,
                like_count: currentlyLiked ? post.like_count - 1 : post.like_count + 1
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  // Add a comment to a post
  const addComment = async (postId: string, parentCommentId?: string) => {
    const inputKey = parentCommentId || postId;
    const content = parentCommentId ? replyInputs[inputKey] : commentInputs[inputKey];
    
    if (!content?.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('community_post_comments')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
            content: content.trim(),
            parent_comment_id: parentCommentId || null,
          }
        ]);

      if (error) throw error;

      // Clear input
      if (parentCommentId) {
        setReplyInputs(prev => ({ ...prev, [inputKey]: '' }));
      } else {
        setCommentInputs(prev => ({ ...prev, [inputKey]: '' }));
      }

      // Refresh posts to get updated comments
      await fetchPosts();

      toast({
        title: "Success",
        description: parentCommentId ? "Reply added!" : "Comment added!",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  // Delete a post
  const deletePost = async (postId: string) => {
    if (!user) return;

    try {
      setDeletingPost(postId);
      
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      // Update local state by removing the deleted post
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });

      setDeleteDialogOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    } finally {
      setDeletingPost(null);
    }
  };

  // Check if user can delete a post (post author or community creator)
  const canDeletePost = (post: CommunityPost) => {
    if (!user) return false;
    return post.user_id === user.id || user.id === communityCreatorId;
  };

  // Handle delete confirmation
  const handleDeleteClick = (postId: string) => {
    setPostToDelete(postId);
    setDeleteDialogOpen(true);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  };

  // Filter posts when dependencies change
  useEffect(() => {
    filterPosts();
  }, [posts, searchQuery, selectedCategory, sortBy, activeTab, bookmarkedPosts, user]);

  useEffect(() => {
    fetchPosts();

    // Set up real-time subscriptions
    const postsChannel = supabase
      .channel(`community_posts_${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_posts',
          filter: `community_id=eq.${communityId}`,
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    const likesChannel = supabase
      .channel(`community_post_likes_${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_post_likes',
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel(`community_post_comments_${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_post_comments',
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [communityId]);

  const getDisplayName = (profiles: { display_name: string | null } | null) => {
    return profiles?.display_name || 'Anonymous User';
  };

  const getInitials = (displayName: string) => {
    return displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderComment = (comment: CommunityPostComment, postId: string, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-6 mt-3' : ''}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage 
            src={validateAvatarUrl(comment.profiles?.avatar_url)} 
            alt={comment.profiles?.display_name || 'User'}
          />
          <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
            {getInitials(getDisplayName(comment.profiles))}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="bg-muted/50 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">
                {getDisplayName(comment.profiles)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{comment.content}</p>
          </div>
          
          {!isReply && (
            <div className="flex items-center gap-3 mt-2 ml-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-3 text-xs text-muted-foreground hover:text-primary rounded-full"
                onClick={() => setShowingReplies(prev => ({ 
                  ...prev, 
                  [comment.id]: !prev[comment.id] 
                }))}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
              {comment.replies && comment.replies.length > 0 && (
                <span className="text-xs text-muted-foreground font-medium">
                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>
          )}
          
          {!isReply && showingReplies[comment.id] && (
            <div className="mt-3 ml-2">
              <div className="flex gap-2">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage 
                    src={validateAvatarUrl(user?.user_metadata?.avatar_url)} 
                    alt="You"
                  />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {user?.user_metadata?.display_name ? 
                      getInitials(user.user_metadata.display_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Write a reply..."
                    value={replyInputs[comment.id] || ''}
                    onChange={(e) => setReplyInputs(prev => ({ 
                      ...prev, 
                      [comment.id]: e.target.value 
                    }))}
                    onKeyPress={(e) => handleKeyPress(e, () => addComment(postId, comment.id))}
                    className="h-8 rounded-full bg-muted/30 border-0 text-sm focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  <Button
                    onClick={() => addComment(postId, comment.id)}
                    disabled={!replyInputs[comment.id]?.trim()}
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map(reply => 
                renderComment(reply, postId, true)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Search and Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{communityName} Discussions</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
                </p>
              </div>
            </div>
            
            {/* Search and Sort Controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {POST_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recent
                    </div>
                  </SelectItem>
                  <SelectItem value="popular">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Popular
                    </div>
                  </SelectItem>
                  <SelectItem value="trending">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Trending
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Posts</TabsTrigger>
              <TabsTrigger value="my-posts">My Posts</TabsTrigger>
              <TabsTrigger value="bookmarked">
                <Bookmark className="h-4 w-4 mr-2" />
                Bookmarked
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Enhanced Post Creation */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20 flex-shrink-0">
              <AvatarImage 
                src={validateAvatarUrl(user?.user_metadata?.avatar_url)} 
                alt="You"
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.user_metadata?.display_name ? 
                  getInitials(user.user_metadata.display_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <Textarea
                placeholder="What would you like to discuss?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[100px] resize-none border-0 shadow-none text-base placeholder:text-muted-foreground/60 focus-visible:ring-0 bg-muted/30 rounded-xl"
                disabled={posting}
              />
              
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                    <SelectTrigger className="w-48 h-10">
                      <Tag className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POST_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2">
                    <PostImageUpload
                      onImageUploaded={setNewPostImage}
                      currentImageUrl={newPostImage}
                      disabled={posting}
                    />
                    <LinkPreview
                      onLinkAdded={setNewPostLink}
                      currentLink={newPostLink}
                      disabled={posting}
                    />
                  </div>
                </div>
                
                <Button
                  onClick={createPost}
                  disabled={(!newPost.trim() && !newPostImage && !newPostLink) || posting}
                  size="lg"
                  className="px-6 py-2 h-10 flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-200 min-w-[100px]"
                >
                  {posting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Post</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="text-center py-16">
              <div className="p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No posts found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Be the first to start a discussion!'
                }
              </p>
              {(!searchQuery && selectedCategory === 'all') && (
                <Button onClick={() => document.querySelector('textarea')?.focus()}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start Discussion
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map((post, index) => (
                <Card key={post.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    {/* Post Header */}
                    <div className="flex gap-4 mb-4">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                        <AvatarImage 
                          src={validateAvatarUrl(post.profiles?.avatar_url)} 
                          alt={post.profiles?.display_name || 'User'}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {getInitials(getDisplayName(post.profiles))}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-base">
                              {getDisplayName(post.profiles)}
                            </span>
                            {post.is_pinned && (
                              <Badge variant="secondary" className="text-xs">
                                <Pin className="h-3 w-3 mr-1" />
                                Pinned
                              </Badge>
                            )}
                            {post.category && (
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${POST_CATEGORIES.find(cat => cat.value === post.category)?.color || 'bg-gray-100 text-gray-800'}`}
                              >
                                {POST_CATEGORIES.find(cat => cat.value === post.category)?.label || post.category}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleBookmark(post.id)}
                              className={`h-8 w-8 p-0 ${bookmarkedPosts.has(post.id) ? 'text-primary' : 'text-muted-foreground'}`}
                            >
                              <Bookmark className={`h-4 w-4 ${bookmarkedPosts.has(post.id) ? 'fill-current' : ''}`} />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(window.location.href)}>
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Copy Link
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleBookmark(post.id)}>
                                  <Bookmark className="h-4 w-4 mr-2" />
                                  {bookmarkedPosts.has(post.id) ? 'Remove Bookmark' : 'Bookmark'}
                                </DropdownMenuItem>
                                {canDeletePost(post) && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(post.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Post
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        {post.content && post.content !== '[Image]' && post.content !== '[Link]' && (
                          <div className="text-base whitespace-pre-wrap break-words mb-4 leading-relaxed">
                            {post.content}
                          </div>
                        )}
                        
                        {post.image_url && (
                          <div className="mb-4">
                            <img
                              src={post.image_url}
                              alt="Post image"
                              className="w-full max-h-96 rounded-xl border border-border object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => window.open(post.image_url!, '_blank')}
                            />
                          </div>
                        )}

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
                              className="block bg-background rounded-lg border border-border overflow-hidden hover:border-primary/20 transition-all duration-200 cursor-pointer no-underline"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              {post.link_image_url && (
                                <div className="aspect-video bg-muted relative overflow-hidden">
                                  <img
                                    src={post.link_image_url}
                                    alt={post.link_title || 'Link preview'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                              )}
                              
                              <div className="p-4">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-foreground text-sm mb-1 leading-tight overflow-hidden"
                                        style={{
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          maxHeight: '2.8em'
                                        }}>
                                      {post.link_title || 'Untitled'}
                                    </h3>
                                    {post.link_description && (
                                      <p className="text-muted-foreground text-xs mt-1 leading-relaxed overflow-hidden"
                                         style={{
                                           display: '-webkit-box',
                                           WebkitLineClamp: 2,
                                           WebkitBoxOrient: 'vertical',
                                           maxHeight: '2.4em'
                                         }}>
                                        {post.link_description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      <Globe className="h-3 w-3 mr-1" />
                                      {post.link_domain || new URL(post.link_url.startsWith('http') ? post.link_url : `https://${post.link_url}`).hostname}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <ExternalLink className="h-3 w-3" />
                                    <span className="text-xs">Visit</span>
                                  </div>
                                </div>
                              </div>
                            </a>
                          </div>
                        )}

                        {/* Enhanced Post Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-9 px-3 rounded-full ${post.user_has_liked ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-muted-foreground hover:text-red-500 hover:bg-red-50'}`}
                              onClick={() => toggleLike(post.id, post.user_has_liked)}
                            >
                              <Heart className={`h-4 w-4 mr-2 ${post.user_has_liked ? 'fill-current' : ''}`} />
                              {post.like_count > 0 ? post.like_count : 'Like'}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 px-3 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => setExpandedComments(prev => ({ 
                                ...prev, 
                                [post.id]: !prev[post.id] 
                              }))}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {post.comment_count > 0 ? `${post.comment_count} Comments` : 'Comment'}
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 px-3 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                            >
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Comments Section */}
                    <Collapsible 
                      open={expandedComments[post.id]} 
                      onOpenChange={(open) => setExpandedComments(prev => ({ 
                        ...prev, 
                        [post.id]: open 
                      }))}
                    >
                      <CollapsibleContent className="mt-4 pt-4 border-t border-border/30">
                        <div className="space-y-4">
                          {/* Add Comment Input */}
                          <div className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={validateAvatarUrl(user?.user_metadata?.avatar_url)} 
                                alt="You"
                              />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {user?.user_metadata?.display_name ? 
                                  getInitials(user.user_metadata.display_name) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex gap-2">
                              <Input
                                placeholder="Write a thoughtful comment..."
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => setCommentInputs(prev => ({ 
                                  ...prev, 
                                  [post.id]: e.target.value 
                                }))}
                                onKeyPress={(e) => handleKeyPress(e, () => addComment(post.id))}
                                className="h-9 rounded-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                              />
                              <Button
                                onClick={() => addComment(post.id)}
                                disabled={!commentInputs[post.id]?.trim()}
                                size="sm"
                                className="h-9 w-9 p-0 rounded-full"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Comments List */}
                          <div className="space-y-3">
                            {post.comments.map(comment => 
                              renderComment(comment, post.id)
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setPostToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => postToDelete && deletePost(postToDelete)}
              disabled={deletingPost === postToDelete}
            >
              {deletingPost === postToDelete ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};