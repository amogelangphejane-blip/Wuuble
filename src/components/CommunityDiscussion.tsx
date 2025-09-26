import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Filter,
  Search,
  Tag,
  Globe,
  ExternalLink,
  Bookmark,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactionPicker, ReactionCounts, ReactionType } from '@/components/ReactionPicker';
import { RichTextEditor } from '@/components/RichTextEditor';
import { PostImageUpload } from '@/components/PostImageUpload';
import { LinkPreview } from '@/components/LinkPreview';
import { EnhancedFileUpload } from '@/components/EnhancedFileUpload';

interface Post {
  id: string;
  community_id: string;
  user_id: string;
  title?: string;
  content: string;
  image_url?: string;
  link_url?: string;
  link_title?: string;
  link_description?: string;
  link_image_url?: string;
  link_domain?: string;
  category?: string;
  tags?: string[];
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
  reaction_counts?: ReactionCounts;
  user_reaction?: ReactionType | null;
  file_urls?: string[];
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

const POST_CATEGORIES = [
  { value: 'general', label: '💬 General Discussion', color: 'bg-blue-100 text-blue-800' },
  { value: 'question', label: '❓ Questions', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'announcement', label: '📢 Announcements', color: 'bg-green-100 text-green-800' },
  { value: 'event', label: '📅 Events', color: 'bg-purple-100 text-purple-800' },
  { value: 'resource', label: '📚 Resources', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'showcase', label: '🎨 Showcase', color: 'bg-pink-100 text-pink-800' },
  { value: 'link', label: '🔗 Links', color: 'bg-cyan-100 text-cyan-800' },
];

export const CommunityDiscussion: React.FC<CommunityDiscussionProps> = ({
  communityId,
  isOwner,
  isModerator = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('general');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [newPostLink, setNewPostLink] = useState<{
    url: string;
    title: string;
    description: string;
    image: string;
    domain: string;
  } | null>(null);
  const [newPostFiles, setNewPostFiles] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [postMode, setPostMode] = useState<'simple' | 'rich' | 'files'>('simple');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'my-posts' | 'bookmarked'>('all');
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

  // Filter and search posts
  const filterPosts = () => {
    let filtered = [...posts];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.content.toLowerCase().includes(query) ||
        post.title?.toLowerCase().includes(query) ||
        post.user.display_name?.toLowerCase().includes(query)
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
        filtered.sort((a, b) => b.likes_count - a.likes_count);
        break;
      case 'trending':
        filtered.sort((a, b) => {
          const ageA = (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60);
          const ageB = (Date.now() - new Date(b.created_at).getTime()) / (1000 * 60 * 60);
          const aScore = (a.likes_count * 2 + a.comments_count) / Math.max(1, ageA);
          const bScore = (b.likes_count * 2 + b.comments_count) / Math.max(1, ageB);
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

  useEffect(() => {
    fetchPosts();
  }, [communityId, sortBy]);

  useEffect(() => {
    filterPosts();
  }, [posts, searchQuery, selectedCategory, sortBy, activeTab, bookmarkedPosts, user]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Fetch posts from database
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select(`
          id,
          community_id,
          user_id,
          content,
          image_url,
          link_url,
          link_title,
          link_description,
          link_image_url,
          link_domain,
          category,
          is_pinned,
          created_at,
          updated_at,
          profiles!community_posts_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', communityId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (postsError) {
        throw postsError;
      }

      // Fetch reactions and comments for each post
      const enhancedPosts: Post[] = await Promise.all(
        (postsData || []).map(async (post) => {
          // Fetch reaction counts
          const { data: reactionCounts } = await supabase
            .rpc('get_post_reaction_counts', { post_uuid: post.id });

          // Fetch user's reaction if logged in
          let userReaction: ReactionType | null = null;
          if (user) {
            const { data: userReactionData } = await supabase
              .rpc('get_user_post_reaction', { 
                post_uuid: post.id, 
                user_uuid: user.id 
              });
            userReaction = userReactionData;
          }

          // Fetch comments
          const { data: comments } = await supabase
            .from('community_post_comments')
            .select(`
              id,
              content,
              created_at,
              user_id,
              profiles!community_post_comments_user_id_fkey (
                display_name,
                avatar_url
              )
            `)
            .eq('post_id', post.id)
            .is('parent_comment_id', null)
            .order('created_at', { ascending: true });

          return {
            ...post,
            title: post.content.split('\n')[0].slice(0, 100) || undefined,
            user: {
              id: post.user_id,
              email: '',
              display_name: post.profiles?.display_name || 'Anonymous',
              avatar_url: post.profiles?.avatar_url || undefined
            },
            comments: comments?.map(comment => ({
              id: comment.id,
              post_id: post.id,
              user_id: comment.user_id,
              content: comment.content,
              created_at: comment.created_at,
              user: {
                id: comment.user_id,
                email: '',
                display_name: comment.profiles?.display_name || 'Anonymous',
                avatar_url: comment.profiles?.avatar_url || undefined
              }
            })) || [],
            likes_count: Object.values(reactionCounts || {}).reduce((sum: number, count: number) => sum + count, 0),
            comments_count: comments?.length || 0,
            liked_by_user: userReaction === 'like',
            reaction_counts: reactionCounts || {},
            user_reaction: userReaction,
            file_urls: []
          };
        })
      );

      // Sort posts based on selected option
      const sortedPosts = [...enhancedPosts].sort((a, b) => {
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
      setFilteredPosts(sortedPosts);
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
    if (!user || (!newPostContent.trim() && !newPostImage && !newPostLink && newPostFiles.length === 0)) return;

    setIsPosting(true);
    try {
      // Create the post in database
      const { data, error } = await supabase
        .from('community_posts')
        .insert([
          {
            community_id: communityId,
            user_id: user.id,
            content: newPostContent || '[Media Post]',
            image_url: newPostImage,
            link_url: newPostLink?.url || null,
            link_title: newPostLink?.title || null,
            link_description: newPostLink?.description || null,
            link_image_url: newPostLink?.image || null,
            link_domain: newPostLink?.domain || null,
            category: newPostCategory,
            is_pinned: false
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Clear form
      setNewPostContent('');
      setNewPostTitle('');
      setNewPostCategory('general');
      setNewPostImage(null);
      setNewPostLink(null);
      setNewPostFiles([]);
      setShowNewPost(false);
      
      // Refresh posts
      await fetchPosts();
      
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

  const handleReactionChange = (postId: string, reaction: ReactionType | null, counts: ReactionCounts) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              reaction_counts: counts,
              user_reaction: reaction,
              likes_count: Object.values(counts).reduce((sum, count) => sum + count, 0)
            }
          : post
      )
    );
    
    // Update filtered posts as well
    setFilteredPosts(prevFiltered => 
      prevFiltered.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              reaction_counts: counts,
              user_reaction: reaction,
              likes_count: Object.values(counts).reduce((sum, count) => sum + count, 0)
            }
          : post
      )
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard"
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
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
          display_name: user.user_metadata?.display_name || 'Anonymous',
          avatar_url: user.user_metadata?.avatar_url
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

  const PostCard = ({ post }: { post: Post }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-6">
          {/* Post Header */}
          <div className="flex gap-4 mb-4">
            <Avatar className="h-12 w-12 ring-2 ring-primary/10">
              <AvatarImage src={post.user.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                {post.user.display_name?.substring(0, 2).toUpperCase() || 'AN'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-base">
                    {post.user.display_name || 'Anonymous'}
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
                      className={`text-xs ${POST_CATEGORIES.find(cat => cat.value === post.category)?.color || 'bg-muted text-muted-foreground'}`}
                    >
                      {POST_CATEGORIES.find(cat => cat.value === post.category)?.label || post.category}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
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
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => copyToClipboard(window.location.href + '#post-' + post.id)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleBookmark(post.id)}>
                        <Bookmark className="h-4 w-4 mr-2" />
                        {bookmarkedPosts.has(post.id) ? 'Remove Bookmark' : 'Bookmark'}
                      </DropdownMenuItem>
                      {(isOwner || isModerator || post.user_id === user?.id) && (
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Post
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Post Content */}
              {post.content && post.content !== '[Media Post]' && (
                <div className="text-base whitespace-pre-wrap break-words mb-4 leading-relaxed">
                  {post.content}
                </div>
              )}
              
              {/* Post Image */}
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

              {/* Link Preview */}
              {post.link_url && (
                <div className="mb-4">
                  <div 
                    className="bg-background rounded-lg border border-border overflow-hidden hover:border-primary/20 transition-all duration-200 cursor-pointer"
                    onClick={() => window.open(post.link_url!, '_blank')}
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
                          <h3 className="font-semibold text-foreground text-sm mb-1 leading-tight line-clamp-2">
                            {post.link_title || 'Untitled'}
                          </h3>
                          {post.link_description && (
                            <p className="text-muted-foreground text-xs mt-1 leading-relaxed line-clamp-2">
                              {post.link_description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            {post.link_domain || 'External Link'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <ExternalLink className="h-3 w-3" />
                          <span className="text-xs">Visit</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Post Actions with Reactions */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <ReactionPicker
                    postId={post.id}
                    currentUserReaction={post.user_reaction}
                    reactionCounts={post.reaction_counts || {}}
                    onReactionChange={handleReactionChange}
                  />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => {
                      const newExpanded = new Set(expandedComments);
                      if (newExpanded.has(post.id)) {
                        newExpanded.delete(post.id);
                      } else {
                        newExpanded.add(post.id);
                      }
                      setExpandedComments(newExpanded);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {post.comments_count > 0 ? `${post.comments_count} Comments` : 'Comment'}
                  </Button>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => copyToClipboard(window.location.href + '#post-' + post.id)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
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
                      <AvatarImage src={comment.user.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {comment.user.display_name?.substring(0, 2).toUpperCase() || 'AN'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="font-medium text-sm">{comment.user.display_name || 'Anonymous'}</p>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {user && (
                  <div className="flex gap-2 mt-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {user.user_metadata?.display_name?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
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
                      className="flex-1 rounded-full"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleComment(post.id)}
                      disabled={!commentInputs[post.id]?.trim()}
                      className="rounded-full"
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
      {/* Enhanced Header with Search and Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Community Discussions</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
                </p>
              </div>
            </div>
            
            {/* Search and Sort Controls */}
            <div className="flex items-center gap-2 flex-wrap">
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
                      <ThumbsUp className="h-4 w-4" />
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
          
          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab as any} className="mt-4">
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

      {/* Enhanced Post Creation Form */}
      <AnimatePresence>
        {showNewPost && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Start a Discussion
                  </CardTitle>
                  <Tabs value={postMode} onValueChange={setPostMode as any}>
                    <TabsList>
                      <TabsTrigger value="simple">Simple</TabsTrigger>
                      <TabsTrigger value="rich">Rich Text</TabsTrigger>
                      <TabsTrigger value="files">Files</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Post Mode Content */}
                <TabsContent value={postMode} className="mt-0">
                  {postMode === 'simple' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user?.user_metadata?.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user?.user_metadata?.display_name?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            placeholder="What would you like to discuss? Share your thoughts..."
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            className="min-h-[120px] resize-none border-0 shadow-none text-base focus-visible:ring-0 bg-muted/30 rounded-xl"
                            disabled={isPosting}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PostImageUpload
                          onImageUploaded={setNewPostImage}
                          currentImageUrl={newPostImage}
                          disabled={isPosting}
                        />
                        <LinkPreview
                          onLinkAdded={setNewPostLink}
                          currentLink={newPostLink}
                          disabled={isPosting}
                        />
                      </div>
                    </div>
                  )}

                  {postMode === 'rich' && (
                    <div className="space-y-4">
                      <RichTextEditor
                        value={newPostContent}
                        onChange={setNewPostContent}
                        placeholder="Create a rich text post with formatting, emojis, and more..."
                        disabled={isPosting}
                        enableMentions={true}
                        enableHashtags={true}
                        enableEmojis={true}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PostImageUpload
                          onImageUploaded={setNewPostImage}
                          currentImageUrl={newPostImage}
                          disabled={isPosting}
                        />
                        <LinkPreview
                          onLinkAdded={setNewPostLink}
                          currentLink={newPostLink}
                          disabled={isPosting}
                        />
                      </div>
                    </div>
                  )}

                  {postMode === 'files' && (
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Add a description for your files..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        rows={3}
                        disabled={isPosting}
                      />
                      
                      <EnhancedFileUpload
                        onFilesUploaded={setNewPostFiles}
                        maxFiles={10}
                        maxFileSize={25}
                        allowMultiple={true}
                        disabled={isPosting}
                        acceptedFileTypes={['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*']}
                      />
                    </div>
                  )}
                </TabsContent>

                {/* Post Settings */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                        <SelectTrigger className="w-48">
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
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewPost(false);
                        setNewPostContent('');
                        setNewPostTitle('');
                        setNewPostCategory('general');
                        setNewPostImage(null);
                        setNewPostLink(null);
                        setNewPostFiles([]);
                      }}
                      disabled={isPosting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreatePost}
                      disabled={(!newPostContent.trim() && !newPostImage && !newPostLink && newPostFiles.length === 0) || isPosting}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 min-w-[100px]"
                    >
                      {isPosting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Post
                        </>
                      )}
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
      ) : filteredPosts.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-16">
            <div className="p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No posts found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Be the first to start a discussion!'
              }
            </p>
            {(!searchQuery && selectedCategory === 'all') && user && (
              <Button
                onClick={() => setShowNewPost(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Discussion
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};