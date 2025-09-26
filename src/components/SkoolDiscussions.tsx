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

interface SkoolDiscussionsProps {
  communityId: string;
}

export const SkoolDiscussions: React.FC<SkoolDiscussionsProps> = ({ communityId }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchPosts();
  }, [communityId, sortBy]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          profiles!community_posts_user_id_fkey (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', communityId);

      // Apply sorting
      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'popular') {
        query = query.order('likes_count', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      // Transform the data to match our Post interface
      const transformedPosts: Post[] = (data || []).map(post => ({
        id: post.id,
        author: {
          name: post.profiles?.display_name || 'Anonymous',
          avatar: post.profiles?.avatar_url,
          level: Math.floor(Math.random() * 10) + 1, // Mock level for now
          badge: null
        },
        title: post.title || 'Untitled',
        content: post.content,
        category: post.category || 'General',
        title: post.title || 'Untitled',
        content: post.content,
        category: post.category || 'General',
        tags: post.tags || [],
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        views: post.views_count || 0,
        isPinned: post.is_pinned || false,
        isLiked: false, // Will implement user-specific likes later
        isBookmarked: false, // Will implement user-specific bookmarks later
        createdAt: new Date(post.created_at)
      }));

      setPosts(transformedPosts);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle || !newPostContent || !user) return;

    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          community_id: communityId,
          user_id: user.id,
          title: newPostTitle,
          content: newPostContent,
          category: selectedCategory,
          tags: [],
          likes_count: 0,
          comments_count: 0,
          views_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        return;
      }

      // Refresh posts
      fetchPosts();
      setShowNewPost(false);
      setNewPostTitle('');
      setNewPostContent('');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const categories = [
    { name: 'All Posts', count: posts.length },
    { name: 'General', count: posts.filter(p => p.category === 'General').length },
    { name: 'Introductions', count: 0 },
    { name: 'Case Studies', count: 0 },
    { name: 'Growth Hacks', count: 0 },
    { name: 'Feedback', count: 0 },
    { name: 'Resources', count: 0 }
  ];

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleBookmark = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isBookmarked: !post.isBookmarked }
        : post
    ));
  };

  const getBadgeColor = (badge: string | null) => {
    switch (badge) {
      case 'moderator':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'contributor':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Community</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                {sortBy === 'recent' ? 'Recent' : sortBy === 'popular' ? 'Popular' : 'Top'}
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
              <DropdownMenuItem onClick={() => setSortBy('top')}>
                <ThumbsUp className="w-4 h-4 mr-2" />
                Top Rated
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category.name}
            variant={selectedCategory === category.name ? "default" : "outline"}
            size="sm"
            className={cn(
              "whitespace-nowrap",
              selectedCategory === category.name 
                ? "bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white"
                : ""
            )}
            onClick={() => setSelectedCategory(category.name)}
          >
            {category.name}
            <Badge variant="secondary" className="ml-2 text-xs">
              {category.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <Card className="mb-6 p-6 border-2 border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <Input
              placeholder="Post title..."
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              className="text-lg font-semibold"
            />
            <Textarea
              placeholder="Share your thoughts with the community..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Image className="w-4 h-4 mr-2" />
                  Image
                </Button>
                <Button variant="outline" size="sm">
                  <Link className="w-4 h-4 mr-2" />
                  Link
                </Button>
                <Button variant="outline" size="sm">
                  <Hash className="w-4 h-4 mr-2" />
                  Tags
                </Button>
              </div>
              <div className="flex items-center gap-2">
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
                <Button 
                  className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white"
                  onClick={handleCreatePost}
                  disabled={!newPostTitle || !newPostContent}
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Create Post Button */}
      {!showNewPost && (
        <Card 
          className="mb-6 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={() => setShowNewPost(true)}
        >
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gray-200 dark:bg-gray-700">U</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-gray-500">Create a post...</p>
            </div>
            <Button size="sm" className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white">
              New Post
            </Button>
          </div>
        </Card>
      )}

      {/* Posts List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
          <p className="text-gray-500 mb-4">Be the first to start a discussion in this community!</p>
          <Button onClick={() => setShowNewPost(true)}>Start a Discussion</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card 
              key={post.id} 
              className={cn(
                "hover:shadow-lg transition-all cursor-pointer",
                post.isPinned && "border-2 border-yellow-400 dark:border-yellow-600"
              )}
            >
              {post.isPinned && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 border-b flex items-center gap-2">
                  <Pin className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Pinned</span>
                </div>
              )}
              
              <div className="p-6">
                {/* Author Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {post.author.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{post.author.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          Level {post.author.level}
                        </Badge>
                        {post.author.badge && (
                          <Badge className={cn("text-xs", getBadgeColor(post.author.badge))}>
                            {post.author.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Report</DropdownMenuItem>
                      <DropdownMenuItem>Hide</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Post Content */}
                <h2 className="text-lg font-semibold mb-2 hover:text-blue-600 dark:hover:text-blue-400">
                  {post.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {post.content}
                </p>

                {/* Tags */}
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="text-xs">
                    {post.category}
                  </Badge>
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-xs text-gray-500">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
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
                    
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Eye className="w-4 h-4" />
                      {post.views}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleBookmark(post.id)}
                      className={cn("h-8 w-8", post.isBookmarked && "text-blue-500")}
                    >
                      <Bookmark className={cn("w-4 h-4", post.isBookmarked && "fill-current")} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
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