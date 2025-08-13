import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Reply
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { validateAvatarUrl } from '@/lib/utils';
import { PostImageUpload } from '@/components/PostImageUpload';

interface CommunityPostLike {
  id: string;
  user_id: string;
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
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  likes: CommunityPostLike[];
  comments: CommunityPostComment[];
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
}

interface CommunityPostsProps {
  communityId: string;
  communityName: string;
}

export const CommunityPosts = ({ communityId, communityName }: CommunityPostsProps) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [showingReplies, setShowingReplies] = useState<Record<string, boolean>>({});
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
          created_at,
          user_id,
          profiles!community_posts_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', communityId)
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

      // Fetch likes and comments for each post
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
            comments: commentsWithReplies,
            like_count: likes?.length || 0,
            comment_count: comments?.length || 0,
            user_has_liked: user ? (likes || []).some(like => like.user_id === user.id) : false
          };
        })
      );

      setPosts(postsWithInteractions);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new post
  const createPost = async () => {
    if ((!newPost.trim() && !newPostImage) || !user) return;

    setPosting(true);
    try {
      // Ensure content is never empty string for database NOT NULL constraint
      const content = newPost.trim() || (newPostImage ? '[Image]' : '');
      
      const { error } = await supabase
        .from('community_posts')
        .insert([
          {
            community_id: communityId,
            user_id: user.id,
            content: content,
            image_url: newPostImage,
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
      setNewPostImage(null);
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

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  };

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
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : 'mt-3'}`}>
      <div className="flex gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage 
            src={validateAvatarUrl(comment.profiles?.avatar_url)} 
            alt={comment.profiles?.display_name || 'User'}
          />
          <AvatarFallback className="text-xs">
            {getInitials(getDisplayName(comment.profiles))}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="bg-muted rounded-lg p-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-xs">
                {getDisplayName(comment.profiles)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm">{comment.content}</p>
          </div>
          
          {!isReply && (
            <div className="flex items-center gap-2 mt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground"
                onClick={() => setShowingReplies(prev => ({ 
                  ...prev, 
                  [comment.id]: !prev[comment.id] 
                }))}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
              {comment.replies && comment.replies.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>
          )}
          
          {!isReply && showingReplies[comment.id] && (
            <div className="mt-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Write a reply..."
                  value={replyInputs[comment.id] || ''}
                  onChange={(e) => setReplyInputs(prev => ({ 
                    ...prev, 
                    [comment.id]: e.target.value 
                  }))}
                  onKeyPress={(e) => handleKeyPress(e, () => addComment(postId, comment.id))}
                  className="h-8 text-sm"
                />
                <Button
                  onClick={() => addComment(postId, comment.id)}
                  disabled={!replyInputs[comment.id]?.trim()}
                  size="sm"
                  className="h-8"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          
          {comment.replies && comment.replies.map(reply => 
            renderComment(reply, postId, true)
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
    <Card className="h-[700px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="font-semibold">{communityName} Discussion</h3>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* New Post Input */}
        <div className="p-4 border-b bg-muted/20">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={validateAvatarUrl(user?.user_metadata?.avatar_url)} 
                alt="You"
              />
              <AvatarFallback className="text-xs">
                {user?.user_metadata?.display_name ? 
                  getInitials(user.user_metadata.display_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="What's on your mind?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[60px] resize-none"
                disabled={posting}
              />
              <PostImageUpload
                onImageUploaded={setNewPostImage}
                currentImageUrl={newPostImage}
                disabled={posting}
              />
              <div className="flex justify-end">
                <Button
                  onClick={createPost}
                  disabled={(!newPost.trim() && !newPostImage) || posting}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {posts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No posts yet. Start the conversation!</p>
              </div>
            ) : (
              posts.map((post, index) => (
                <div key={post.id}>
                  <div className="space-y-3">
                    {/* Post Header */}
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={validateAvatarUrl(post.profiles?.avatar_url)} 
                          alt={post.profiles?.display_name || 'User'}
                        />
                        <AvatarFallback>
                          {getInitials(getDisplayName(post.profiles))}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm">
                            {getDisplayName(post.profiles)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        
                        {post.content && post.content !== '[Image]' && (
                          <div className="text-sm whitespace-pre-wrap break-words mb-3">
                            {post.content}
                          </div>
                        )}
                        
                        {post.image_url && (
                          <div className="mt-2">
                            <img
                              src={post.image_url}
                              alt="Post image"
                              className="max-w-full max-h-96 rounded-lg border border-border object-cover cursor-pointer"
                              onClick={() => window.open(post.image_url!, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center gap-4 ml-13">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 px-3 ${post.user_has_liked ? 'text-red-500' : 'text-muted-foreground'}`}
                        onClick={() => toggleLike(post.id, post.user_has_liked)}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${post.user_has_liked ? 'fill-current' : ''}`} />
                        {post.like_count > 0 && <span>{post.like_count}</span>}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-muted-foreground"
                        onClick={() => setExpandedComments(prev => ({ 
                          ...prev, 
                          [post.id]: !prev[post.id] 
                        }))}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {post.comment_count > 0 && <span>{post.comment_count}</span>}
                      </Button>
                    </div>

                    {/* Comments Section */}
                    <Collapsible 
                      open={expandedComments[post.id]} 
                      onOpenChange={(open) => setExpandedComments(prev => ({ 
                        ...prev, 
                        [post.id]: open 
                      }))}
                    >
                      <CollapsibleContent className="ml-13">
                        <div className="space-y-2">
                          {/* Add Comment Input */}
                          <div className="flex gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage 
                                src={validateAvatarUrl(user?.user_metadata?.avatar_url)} 
                                alt="You"
                              />
                              <AvatarFallback className="text-xs">
                                {user?.user_metadata?.display_name ? 
                                  getInitials(user.user_metadata.display_name) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex gap-2">
                              <Input
                                placeholder="Write a comment..."
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => setCommentInputs(prev => ({ 
                                  ...prev, 
                                  [post.id]: e.target.value 
                                }))}
                                onKeyPress={(e) => handleKeyPress(e, () => addComment(post.id))}
                                className="h-8 text-sm"
                              />
                              <Button
                                onClick={() => addComment(post.id)}
                                disabled={!commentInputs[post.id]?.trim()}
                                size="sm"
                                className="h-8"
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Comments List */}
                          {post.comments.map(comment => 
                            renderComment(comment, post.id)
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                  
                  {index < posts.length - 1 && <Separator className="mt-6" />}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};