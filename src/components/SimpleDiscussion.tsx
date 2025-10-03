import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Heart, Send, Reply } from 'lucide-react';

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_comment_id: string | null;
}

interface SimpleDiscussionProps {
  communityId: string;
  isOwner: boolean;
  isModerator?: boolean;
}

const SimpleDiscussion: React.FC<SimpleDiscussionProps> = ({ communityId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  
  // Refs for inputs - NO STATE FOR INPUT VALUES
  const newPostRef = useRef<HTMLTextAreaElement>(null);
  const commentRefs = useRef<{ [postId: string]: HTMLInputElement }>({});

  useEffect(() => {
    loadPosts();
  }, [communityId]);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('community_post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(prev => ({ ...prev, [postId]: data || [] }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const createPost = async () => {
    if (!user || !newPostRef.current?.value.trim()) return;

    try {
      const { error } = await supabase
        .from('community_posts')
        .insert([{
          community_id: communityId,
          user_id: user.id,
          content: newPostRef.current.value.trim()
        }]);

      if (error) throw error;

      newPostRef.current.value = '';
      loadPosts();
      toast({ title: "Posted successfully!" });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: "Failed to post", variant: "destructive" });
    }
  };

  const addComment = async (postId: string) => {
    const input = commentRefs.current[postId];
    if (!user || !input?.value.trim()) return;

    try {
      const { error } = await supabase
        .from('community_post_comments')
        .insert([{
          post_id: postId,
          user_id: user.id,
          content: input.value.trim(),
          parent_comment_id: null
        }]);

      if (error) throw error;

      input.value = '';
      loadComments(postId);
      toast({ title: "Comment added!" });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({ title: "Failed to comment", variant: "destructive" });
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4">
      <h2 className="text-2xl font-bold">Discussions</h2>

      {/* New Post */}
      {user && (
        <Card className="p-4">
          <textarea
            ref={newPostRef}
            placeholder="What's on your mind?"
            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                createPost();
              }
            }}
          />
          <div className="mt-2 flex justify-end">
            <Button onClick={createPost} className="bg-blue-500 hover:bg-blue-600">
              <Send className="w-4 h-4 mr-2" />
              Post
            </Button>
          </div>
        </Card>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="p-4">
            <div className="flex gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
                <p className="mt-2">{post.content}</p>

                {/* Actions */}
                <div className="flex gap-4 mt-3">
                  <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600">
                    <Heart className="w-4 h-4" />
                    <span>{post.likes_count || 0}</span>
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments_count || 0}</span>
                  </button>
                </div>

                {/* Comments Section */}
                {expandedPosts.has(post.id) && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    {comments[post.id]?.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                          <p className="text-sm">{comment.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Comment Input */}
                    {user && (
                      <div className="flex gap-2 mt-3">
                        <input
                          ref={(el) => {
                            if (el) commentRefs.current[post.id] = el;
                          }}
                          type="text"
                          placeholder="Write a comment..."
                          className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addComment(post.id);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => addComment(post.id)}
                          className="rounded-full bg-blue-500 hover:bg-blue-600"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SimpleDiscussion;
