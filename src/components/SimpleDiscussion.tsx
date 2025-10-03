import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageSquare, 
  Heart, 
  Send, 
  Reply, 
  Image as ImageIcon, 
  X, 
  Bookmark,
  Share2,
  MoreVertical,
  Pin,
  ThumbsUp,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ResponsiveImage from './ResponsiveImage';

interface Profile {
  display_name?: string;
  avatar_url?: string;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  is_pinned?: boolean;
  profiles?: Profile;
  user_liked?: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_comment_id: string | null;
  profiles?: Profile;
  replies?: Comment[];
}

interface SimpleDiscussionProps {
  communityId: string;
  isOwner: boolean;
  isModerator?: boolean;
}

const SimpleDiscussion: React.FC<SimpleDiscussionProps> = ({ communityId, isOwner, isModerator }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ postId: string; commentId: string; userName: string } | null>(null);
  
  // Refs for inputs - NO STATE FOR INPUT VALUES
  const newPostRef = useRef<HTMLTextAreaElement>(null);
  const commentRefs = useRef<{ [key: string]: HTMLInputElement }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPosts();
  }, [communityId]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          id,
          content,
          created_at,
          updated_at,
          user_id,
          community_id,
          image_url,
          is_pinned
        `)
        .eq('community_id', communityId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading posts:', error);
        throw error;
      }

      // Get user profiles and interaction counts separately
      const postsWithUserInfo = await Promise.all(
        (data || []).map(async (post) => {
          // Get user profile
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

          // Get likes count and user's like status
          let likesCount = 0;
          let userLiked = false;
          try {
            const { data: likes } = await supabase
              .from('community_post_likes')
              .select('user_id')
              .eq('post_id', post.id);
            
            likesCount = likes?.length || 0;
            userLiked = user ? (likes || []).some(l => l.user_id === user.id) : false;
          } catch (likesError) {
            console.log('Likes table not available:', likesError);
          }

          // Get comments count
          let commentsCount = 0;
          try {
            const { count } = await supabase
              .from('community_post_comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);
            commentsCount = count || 0;
          } catch (commentsError) {
            console.log('Comments table not available:', commentsError);
          }

          return {
            ...post,
            profiles: userProfile,
            likes_count: likesCount,
            comments_count: commentsCount,
            user_liked: userLiked
          };
        })
      );

      setPosts(postsWithUserInfo);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({ 
        title: "Error loading posts", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('community_post_comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          parent_comment_id
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get user profiles for comments
      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          let userProfile = null;
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('user_id', comment.user_id)
              .single();
            userProfile = profile;
          } catch (profileError) {
            console.log('Could not fetch profile for comment user:', comment.user_id);
          }

          return {
            ...comment,
            profiles: userProfile
          };
        })
      );

      // Organize into parent/child structure
      const topLevel = commentsWithProfiles.filter(c => !c.parent_comment_id);
      const replies = commentsWithProfiles.filter(c => c.parent_comment_id);
      
      const commentsWithReplies = topLevel.map(comment => ({
        ...comment,
        replies: replies.filter(r => r.parent_comment_id === comment.id)
      }));

      setComments(prev => ({ ...prev, [postId]: commentsWithReplies }));
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: "Error loading comments",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    setUploadingImage(true);
    try {
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('community-post-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('community-post-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "Upload failed", variant: "destructive" });
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const createPost = async () => {
    if (!user || !newPostRef.current?.value.trim()) return;

    try {
      let imageUrl = '';
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const { error } = await supabase
        .from('community_posts')
        .insert([{
          community_id: communityId,
          user_id: user.id,
          content: newPostRef.current.value.trim(),
          image_url: imageUrl || null
        }]);

      if (error) throw error;

      newPostRef.current.value = '';
      setSelectedImage(null);
      setImagePreview(null);
      setShowNewPost(false);
      loadPosts();
      toast({ title: "Posted successfully!" });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: "Failed to post", variant: "destructive" });
    }
  };

  const addComment = async (postId: string, parentCommentId?: string) => {
    const inputKey = parentCommentId ? `${postId}-${parentCommentId}` : postId;
    const input = commentRefs.current[inputKey];
    if (!user || !input?.value.trim()) return;

    try {
      const { error } = await supabase
        .from('community_post_comments')
        .insert([{
          post_id: postId,
          user_id: user.id,
          content: input.value.trim(),
          parent_comment_id: parentCommentId || null
        }]);

      if (error) throw error;

      input.value = '';
      setReplyingTo(null);
      
      // Reload comments to show the new one
      loadComments(postId);
      
      // Update the comments count in the post
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        )
      );
      
      toast({ title: parentCommentId ? "Reply added!" : "Comment added!" });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({ title: "Failed to comment", variant: "destructive" });
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.user_liked) {
        await supabase.from('community_post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('community_post_likes').insert([{ post_id: postId, user_id: user.id }]);
      }
      loadPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
      if (!comments[postId]) {
        loadComments(postId);
      }
    }
    setExpandedPosts(newExpanded);
  };

  const getDisplayName = (profile?: Profile) => {
    return profile?.display_name || 'Anonymous User';
  };

  const getAvatarUrl = (profile?: Profile, userId?: string) => {
    if (profile?.avatar_url) return profile.avatar_url;
    if (user?.id === userId && user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    return '';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

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
        {user && (
          <Button
            onClick={() => setShowNewPost(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            New Post
          </Button>
        )}
      </div>

      {/* New Post Composer */}
      {showNewPost && user && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={getAvatarUrl(undefined, user.id)} className="object-cover" />
                  <AvatarFallback>{getInitials(user.user_metadata?.display_name || 'User')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.user_metadata?.display_name || 'You'}</p>
                  <p className="text-sm text-gray-500">Share with the community</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowNewPost(false);
                setImagePreview(null);
                setSelectedImage(null);
                if (newPostRef.current) newPostRef.current.value = '';
              }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              ref={newPostRef}
              placeholder="What's on your mind? Share your thoughts, ask questions, or start a discussion..."
              className="w-full p-3 border-0 resize-none focus:outline-none text-base min-h-[100px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  createPost();
                }
              }}
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

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4 mr-2" />
                  )}
                  Photo
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setShowNewPost(false);
                  setImagePreview(null);
                  setSelectedImage(null);
                  if (newPostRef.current) newPostRef.current.value = '';
                }}>
                  Cancel
                </Button>
                <Button onClick={createPost} className="bg-blue-500 hover:bg-blue-600">
                  <Send className="w-4 h-4 mr-2" />
                  Post
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-sm">
              <CardHeader>
                <div className="animate-pulse flex gap-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="text-center py-12 border-0 shadow-sm">
          <CardContent>
            <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No discussions yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Be the first to start a conversation!
            </p>
            {user && (
              <Button onClick={() => setShowNewPost(true)} className="bg-blue-500 hover:bg-blue-600">
                Start Discussion
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              {post.is_pinned && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 px-4 py-2 flex items-center gap-2 border-b">
                  <Pin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Pinned Post</span>
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex gap-3">
                  <Avatar className="w-12 h-12 ring-2 ring-gray-100 dark:ring-gray-800">
                    <AvatarImage src={getAvatarUrl(post.profiles, post.user_id)} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {getInitials(getDisplayName(post.profiles))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {getDisplayName(post.profiles)}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>

                {/* Image Attachment */}
                {post.image_url && (
                  <ResponsiveImage 
                    src={post.image_url} 
                    alt="Post attachment" 
                    className="rounded-xl w-full max-h-96 border border-gray-200 dark:border-gray-800"
                    objectFit="cover"
                  />
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-2",
                      post.user_liked && "text-red-500 dark:text-red-400"
                    )}
                    onClick={() => toggleLike(post.id)}
                  >
                    <Heart className={cn("w-4 h-4", post.user_liked && "fill-current")} />
                    <span className="text-sm font-medium">{post.likes_count}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => toggleComments(post.id)}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium">{post.comments_count}</span>
                  </Button>

                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>

                  <Button variant="ghost" size="sm" className="ml-auto">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </div>

                {/* Comments Section */}
                {expandedPosts.has(post.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                    {comments[post.id]?.map((comment) => (
                      <div key={comment.id}>
                        <div className="flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={getAvatarUrl(comment.profiles, comment.user_id)} className="object-cover" />
                            <AvatarFallback className="text-xs">
                              {getInitials(getDisplayName(comment.profiles))}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl px-4 py-3">
                              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                {getDisplayName(comment.profiles)}
                              </p>
                              <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">
                                {comment.content}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 mt-2 px-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                              </p>
                              {user && (
                                <button
                                  onClick={() => setReplyingTo({ 
                                    postId: post.id, 
                                    commentId: comment.id, 
                                    userName: getDisplayName(comment.profiles) 
                                  })}
                                  className="text-xs text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 flex items-center gap-1"
                                >
                                  <Reply className="w-3 h-3" />
                                  Reply
                                </button>
                              )}
                              {comment.replies && comment.replies.length > 0 && (
                                <span className="text-xs text-gray-500">
                                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                </span>
                              )}
                            </div>

                            {/* Nested Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="mt-3 ml-6 space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-800">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="flex gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={getAvatarUrl(reply.profiles, reply.user_id)} className="object-cover" />
                                      <AvatarFallback className="text-xs">
                                        {getInitials(getDisplayName(reply.profiles))}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl px-3 py-2">
                                        <p className="font-medium text-xs text-gray-900 dark:text-gray-100">
                                          {getDisplayName(reply.profiles)}
                                        </p>
                                        <p className="text-xs text-gray-800 dark:text-gray-200 mt-1">
                                          {reply.content}
                                        </p>
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Comment Input */}
                    {user && (
                      <div>
                        {replyingTo && replyingTo.postId === post.id && (
                          <div className="mb-2 flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 px-3 py-2 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Reply className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm text-blue-700 dark:text-blue-300">
                                Replying to <span className="font-semibold">{replyingTo.userName}</span>
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReplyingTo(null);
                                const inputKey = `${post.id}-${replyingTo.commentId}`;
                                if (commentRefs.current[inputKey]) {
                                  commentRefs.current[inputKey].value = '';
                                }
                              }}
                              className="h-6 px-2"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        <div className="flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={getAvatarUrl(undefined, user.id)} className="object-cover" />
                            <AvatarFallback>
                              {getInitials(user.user_metadata?.display_name || 'User')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex gap-2">
                            <input
                              ref={(el) => {
                                if (el) {
                                  const key = replyingTo?.postId === post.id && replyingTo.commentId
                                    ? `${post.id}-${replyingTo.commentId}`
                                    : post.id;
                                  commentRefs.current[key] = el;
                                }
                              }}
                              type="text"
                              placeholder={replyingTo?.postId === post.id ? "Write a reply..." : "Write a comment..."}
                              className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-950"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (replyingTo?.postId === post.id && replyingTo.commentId) {
                                    addComment(post.id, replyingTo.commentId);
                                  } else {
                                    addComment(post.id);
                                  }
                                }
                                if (e.key === 'Escape' && replyingTo?.postId === post.id) {
                                  setReplyingTo(null);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                if (replyingTo?.postId === post.id && replyingTo.commentId) {
                                  addComment(post.id, replyingTo.commentId);
                                } else {
                                  addComment(post.id);
                                }
                              }}
                              className="rounded-full bg-blue-500 hover:bg-blue-600"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleDiscussion;
