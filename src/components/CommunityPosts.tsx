import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommunityPost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CommunityPostsProps {
  communityId: string;
  communityName: string;
}

export const CommunityPosts = ({ communityId, communityName }: CommunityPostsProps) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch posts for the community
  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles!community_posts_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: "Error",
          description: "Failed to load community posts",
          variant: "destructive",
        });
        return;
      }

      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new post
  const createPost = async () => {
    if (!newPost.trim() || !user) return;

    setPosting(true);
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert([
          {
            community_id: communityId,
            user_id: user.id,
            content: newPost.trim(),
          }
        ])
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles!community_posts_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error creating post:', error);
        toast({
          title: "Error",
          description: "Failed to create post",
          variant: "destructive",
        });
        return;
      }

      setPosts(prev => [...prev, data]);
      setNewPost('');
      
      // Scroll to bottom after posting
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
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

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      createPost();
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchPosts();

    // Subscribe to new posts
    const channel = supabase
      .channel(`community_posts_${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_posts',
          filter: `community_id=eq.${communityId}`,
        },
        async (payload) => {
          // Fetch the complete post with profile data
          const { data } = await supabase
            .from('community_posts')
            .select(`
              id,
              content,
              created_at,
              user_id,
              profiles!community_posts_user_id_fkey (
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setPosts(prev => {
              // Check if post already exists to avoid duplicates
              if (prev.some(post => post.id === data.id)) {
                return prev;
              }
              return [...prev, data];
            });
            
            // Auto-scroll to bottom for new messages
            setTimeout(() => {
              if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
              }
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    if (!loading && posts.length > 0) {
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [loading, posts.length]);

  const getDisplayName = (post: CommunityPost) => {
    return post.profiles?.display_name || 'Anonymous User';
  };

  const getInitials = (displayName: string) => {
    return displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="font-semibold">{communityName} Discussion</h3>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Posts Area */}
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {posts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              posts.map((post, index) => (
                <div key={post.id}>
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={post.profiles?.avatar_url || ''} />
                      <AvatarFallback className="text-xs">
                        {getInitials(getDisplayName(post))}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {getDisplayName(post)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className="text-sm break-words">
                        {post.content}
                      </div>
                    </div>
                  </div>
                  
                  {index < posts.length - 1 && <Separator className="mt-4" />}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={posting}
              className="flex-1"
            />
            <Button
              onClick={createPost}
              disabled={!newPost.trim() || posting}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};