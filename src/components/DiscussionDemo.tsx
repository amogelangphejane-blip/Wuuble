import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Search, 
  Filter, 
  Clock, 
  Star, 
  TrendingUp,
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark,
  Pin,
  Tag,
  Send
} from 'lucide-react';

const DEMO_POSTS = [
  {
    id: '1',
    content: 'Welcome to our enhanced discussion platform! 🎉 This new design makes it much easier to find, create, and engage with posts. What do you think about the new category system?',
    category: 'announcement',
    is_pinned: true,
    created_at: '2024-01-15T10:00:00Z',
    author: { name: 'Community Admin', avatar: null },
    likes: 12,
    comments: 5,
    user_has_liked: false
  },
  {
    id: '2',
    content: 'How do I implement authentication in my React app? I\'ve been struggling with setting up proper user sessions and would love some guidance from the community.',
    category: 'question',
    is_pinned: false,
    created_at: '2024-01-15T09:30:00Z',
    author: { name: 'Sarah Chen', avatar: null },
    likes: 8,
    comments: 12,
    user_has_liked: true
  },
  {
    id: '3',
    content: 'Just finished building my first full-stack application! 🚀 It\'s a task management app with real-time collaboration. Thanks to everyone who helped me along the way.',
    category: 'showcase',
    is_pinned: false,
    created_at: '2024-01-15T08:45:00Z',
    author: { name: 'Alex Rodriguez', avatar: null },
    likes: 24,
    comments: 8,
    user_has_liked: false
  },
  {
    id: '4',
    content: '📚 New Resource Alert: I\'ve compiled a comprehensive guide on modern CSS techniques including Grid, Flexbox, and Container Queries. Perfect for both beginners and advanced developers!',
    category: 'resource',
    is_pinned: false,
    created_at: '2024-01-15T07:20:00Z',
    author: { name: 'Maria Garcia', avatar: null },
    likes: 15,
    comments: 3,
    user_has_liked: true
  }
];

const POST_CATEGORIES = [
  { value: 'general', label: '💬 General Discussion', color: 'bg-blue-100 text-blue-800' },
  { value: 'question', label: '❓ Questions', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'announcement', label: '📢 Announcements', color: 'bg-green-100 text-green-800' },
  { value: 'event', label: '📅 Events', color: 'bg-purple-100 text-purple-800' },
  { value: 'resource', label: '📚 Resources', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'showcase', label: '🎨 Showcase', color: 'bg-pink-100 text-pink-800' },
];

export const DiscussionDemo = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('recent');
  const [activeTab, setActiveTab] = React.useState('all');

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {/* Demo Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-primary to-primary/80 text-white">
        <CardContent className="p-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">✨ Enhanced Discussion Page Demo</h1>
            <p className="text-white/90 text-lg">
              Experience the new modern, feature-rich discussion interface
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Header with Search and Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Community Discussions</h2>
                <p className="text-sm text-muted-foreground">
                  {DEMO_POSTS.length} posts • Live demo with enhanced features
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
              
              <Select value={sortBy} onValueChange={setSortBy}>
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
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary">
                YU
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div className="min-h-[100px] p-4 bg-muted/30 rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                  ✨ Enhanced post creation area<br/>
                  <span className="text-sm">Rich text input • Category selection • Media upload</span>
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Select value="general">
                    <SelectTrigger className="w-48">
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
                  
                  <Button variant="outline" size="sm">
                    📷 Add Image
                  </Button>
                </div>
                
                <Button size="lg" className="px-8">
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Posts */}
      <div className="space-y-4">
        {DEMO_POSTS.map((post) => (
          <Card key={post.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              {/* Post Header */}
              <div className="flex gap-4 mb-4">
                <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                    {getInitials(post.author.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-base">
                        {post.author.name}
                      </span>
                      {post.is_pinned && (
                        <Badge variant="secondary" className="text-xs">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${POST_CATEGORIES.find(cat => cat.value === post.category)?.color || 'bg-gray-100 text-gray-800'}`}
                      >
                        {POST_CATEGORIES.find(cat => cat.value === post.category)?.label || post.category}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {formatTimeAgo(post.created_at)}
                      </span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-base whitespace-pre-wrap break-words mb-4 leading-relaxed">
                    {post.content}
                  </div>

                  {/* Enhanced Post Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-9 px-3 rounded-full ${post.user_has_liked ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-muted-foreground hover:text-red-500 hover:bg-red-50'}`}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${post.user_has_liked ? 'fill-current' : ''}`} />
                        {post.likes} Likes
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {post.comments} Comments
                      </Button>
                    </div>
                    
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Highlights */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">✨ Key Improvements Implemented</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium">Smart Search</h4>
              <p className="text-sm text-muted-foreground">Real-time search across posts and authors</p>
            </div>
            <div className="text-center p-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Tag className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium">Categories</h4>
              <p className="text-sm text-muted-foreground">Organize posts with color-coded categories</p>
            </div>
            <div className="text-center p-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium">Smart Sorting</h4>
              <p className="text-sm text-muted-foreground">Recent, popular, and trending algorithms</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};