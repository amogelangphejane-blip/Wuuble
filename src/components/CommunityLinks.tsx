import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Link as LinkIcon, 
  Plus, 
  ExternalLink, 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark,
  Globe,
  Calendar,
  User,
  Trash2,
  Edit3
} from 'lucide-react';

interface CommunityLink {
  id: string;
  url: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  domain: string;
  user_id: string;
  community_id: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

interface CommunityLinksProps {
  communityId: string;
  className?: string;
}

const CommunityLinks: React.FC<CommunityLinksProps> = ({ communityId, className = '' }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [links, setLinks] = useState<CommunityLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  
  // Form state
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);

  // Validate URL and extract metadata
  const validateUrl = (inputUrl: string) => {
    try {
      const urlObj = new URL(inputUrl);
      const isValid = urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
      setIsValidUrl(isValid);
      
      if (isValid && !title) {
        // Auto-generate title from domain if not provided
        const domain = urlObj.hostname.replace('www.', '');
        setTitle(`Check out this link from ${domain}`);
      }
      
      return isValid;
    } catch {
      setIsValidUrl(false);
      return false;
    }
  };

  // Extract domain from URL for display
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  };

  // Load community links
  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('community_links')
        .select(`
          *,
          user:profiles(id, display_name, avatar_url),
          likes_count:community_link_likes(count),
          comments_count:community_link_comments(count)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check if user has liked/bookmarked each link
      if (user && data) {
        const linkIds = data.map(link => link.id);
        
        const [likesData, bookmarksData] = await Promise.all([
          supabase
            .from('community_link_likes')
            .select('link_id')
            .eq('user_id', user.id)
            .in('link_id', linkIds),
          supabase
            .from('community_link_bookmarks')
            .select('link_id')
            .eq('user_id', user.id)
            .in('link_id', linkIds)
        ]);

        const likedIds = new Set(likesData.data?.map(l => l.link_id) || []);
        const bookmarkedIds = new Set(bookmarksData.data?.map(b => b.link_id) || []);

        const enrichedLinks = data.map(link => ({
          ...link,
          is_liked: likedIds.has(link.id),
          is_bookmarked: bookmarkedIds.has(link.id)
        }));

        setLinks(enrichedLinks);
      } else {
        setLinks(data || []);
      }
    } catch (error: any) {
      console.error('Error loading links:', error);
      toast({
        title: 'Error',
        description: 'Failed to load community links',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Post new link
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isValidUrl) return;

    setSubmitting(true);

    try {
      const domain = getDomain(url);
      
      const { error } = await supabase
        .from('community_links')
        .insert({
          url: url.trim(),
          title: title.trim(),
          description: description.trim(),
          domain,
          user_id: user.id,
          community_id: communityId
        });

      if (error) throw error;

      toast({
        title: 'Link Posted!',
        description: 'Your link has been shared with the community'
      });

      // Reset form
      setUrl('');
      setTitle('');
      setDescription('');
      setShowPostDialog(false);
      
      // Reload links
      loadLinks();

    } catch (error: any) {
      console.error('Error posting link:', error);
      toast({
        title: 'Error',
        description: 'Failed to post link',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle like
  const toggleLike = async (linkId: string, isCurrentlyLiked: boolean) => {
    if (!user) return;

    try {
      if (isCurrentlyLiked) {
        await supabase
          .from('community_link_likes')
          .delete()
          .eq('link_id', linkId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('community_link_likes')
          .insert({ link_id: linkId, user_id: user.id });
      }

      // Update local state
      setLinks(prevLinks =>
        prevLinks.map(link =>
          link.id === linkId
            ? {
                ...link,
                is_liked: !isCurrentlyLiked,
                likes_count: isCurrentlyLiked 
                  ? Math.max(0, link.likes_count - 1)
                  : link.likes_count + 1
              }
            : link
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Toggle bookmark
  const toggleBookmark = async (linkId: string, isCurrentlyBookmarked: boolean) => {
    if (!user) return;

    try {
      if (isCurrentlyBookmarked) {
        await supabase
          .from('community_link_bookmarks')
          .delete()
          .eq('link_id', linkId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('community_link_bookmarks')
          .insert({ link_id: linkId, user_id: user.id });
      }

      // Update local state
      setLinks(prevLinks =>
        prevLinks.map(link =>
          link.id === linkId
            ? { ...link, is_bookmarked: !isCurrentlyBookmarked }
            : link
        )
      );

      toast({
        title: isCurrentlyBookmarked ? 'Bookmark Removed' : 'Bookmarked!',
        description: isCurrentlyBookmarked 
          ? 'Link removed from bookmarks' 
          : 'Link saved to your bookmarks'
      });

    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Copy link to clipboard
  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link Copied!',
        description: 'The link has been copied to your clipboard'
      });
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [communityId, user]);

  useEffect(() => {
    if (url) {
      validateUrl(url);
    }
  }, [url]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Post Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Community Links</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Share interesting links with the community</p>
          </div>
        </div>

        {user && (
          <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Share Link
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Share a Link
                </DialogTitle>
                <DialogDescription>
                  Share an interesting link with the community
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className={`${isValidUrl ? 'border-green-500' : url ? 'border-red-500' : ''}`}
                    required
                  />
                  {url && !isValidUrl && (
                    <p className="text-sm text-red-500 mt-1">Please enter a valid URL</p>
                  )}
                </div>

                <div>
                  <Input
                    placeholder="Link title (optional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div>
                  <Textarea
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={300}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPostDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isValidUrl || submitting}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {submitting ? 'Posting...' : 'Post Link'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Links List */}
      <div className="space-y-4">
        {links.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <LinkIcon className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No links shared yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Be the first to share an interesting link!</p>
              {user && (
                <Button
                  onClick={() => setShowPostDialog(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Share First Link
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          links.map((link) => (
            <Card key={link.id} className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={link.user.avatar_url} />
                    <AvatarFallback>
                      {link.user.display_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {link.user.display_name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        <Globe className="w-3 h-3 mr-1" />
                        {link.domain}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(link.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 leading-tight">
                      {link.title}
                    </h3>

                    {link.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-relaxed">
                        {link.description}
                      </p>
                    )}

                    <div className="flex items-center gap-1 mb-4">
                      <ExternalLink className="w-4 h-4 text-blue-500" />
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium hover:underline truncate"
                      >
                        {link.url}
                      </a>
                    </div>

                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLike(link.id, link.is_liked || false)}
                        className={`${link.is_liked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
                        disabled={!user}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${link.is_liked ? 'fill-current' : ''}`} />
                        {link.likes_count}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-blue-500"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {link.comments_count}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(link.url)}
                        className="text-gray-500 hover:text-green-500"
                      >
                        <Share className="w-4 h-4 mr-1" />
                        Share
                      </Button>

                      {user && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleBookmark(link.id, link.is_bookmarked || false)}
                          className={`${link.is_bookmarked ? 'text-yellow-500' : 'text-gray-500'} hover:text-yellow-500`}
                        >
                          <Bookmark className={`w-4 h-4 ${link.is_bookmarked ? 'fill-current' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunityLinks;
