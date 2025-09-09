import React, { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { 
  Link2, 
  Heart, 
  Bookmark, 
  MessageCircle, 
  Search, 
  Filter,
  ExternalLink,
  Calendar,
  User,
  Plus,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

interface CommunityLink {
  id: string;
  community_id: string;
  user_id: string;
  url: string;
  title: string;
  description?: string;
  category: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

interface CommunityLinksProps {
  communityId: string;
  isMember: boolean;
  className?: string;
}

const CommunityLinks: React.FC<CommunityLinksProps> = ({ 
  communityId, 
  isMember, 
  className = '' 
}) => {
  const [links, setLinks] = useState<CommunityLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({ url: '', title: '', description: '', category: 'article' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const supabase = useSupabaseClient();
  const user = useUser();

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'article', label: 'Article' },
    { value: 'video', label: 'Video' },
    { value: 'tool', label: 'Tool' },
    { value: 'resource', label: 'Resource' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadLinks();
  }, [communityId]);

  const loadLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_links')
        .select(`
          *,
          community_link_likes!left(user_id),
          community_link_bookmarks!left(user_id)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const linksWithStats = data?.map(link => ({
        ...link,
        is_liked: link.community_link_likes?.some((like: any) => like.user_id === user?.id) || false,
        is_bookmarked: link.community_link_bookmarks?.some((bookmark: any) => bookmark.user_id === user?.id) || false
      })) || [];

      setLinks(linksWithStats);
    } catch (error) {
      console.error('Error loading links:', error);
      toast.error('Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newLink.url || !newLink.title) return;

    try {
      const { error } = await supabase
        .from('community_links')
        .insert({
          community_id: communityId,
          user_id: user.id,
          url: newLink.url,
          title: newLink.title,
          description: newLink.description,
          category: newLink.category
        });

      if (error) throw error;

      setNewLink({ url: '', title: '', description: '', category: 'article' });
      setShowAddForm(false);
      loadLinks();
      toast.success('Link shared successfully!');
    } catch (error) {
      console.error('Error adding link:', error);
      toast.error('Failed to share link');
    }
  };

  const toggleLike = async (linkId: string) => {
    if (!user) return;

    try {
      const link = links.find(l => l.id === linkId);
      if (!link) return;

      if (link.is_liked) {
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

      loadLinks();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         false;
    const matchesCategory = selectedCategory === 'all' || link.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isMember) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <div className="text-center">
          <Link2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Community Links</h3>
          <p className="text-gray-600 mb-4">
            Join this community to share and discover useful links
          </p>
          <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            Join Community
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Community Links</h2>
          <p className="text-gray-600">Share and discover useful resources</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Share Link</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Add Link Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Share a Link</h3>
          <form onSubmit={handleAddLink} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL *
              </label>
              <input
                type="url"
                value={newLink.url}
                onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={newLink.title}
                onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Link title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newLink.description}
                onChange={(e) => setNewLink(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the link"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={newLink.category}
                onChange={(e) => setNewLink(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.slice(1).map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Share Link</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Links Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="text-center py-12">
          <Link2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No links yet</h3>
          <p className="text-gray-600">
            {searchQuery || selectedCategory !== 'all' 
              ? 'No links match your search criteria'
              : 'Be the first to share a useful link with the community!'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLinks.map((link) => (
            <div key={link.id} className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                  {link.category}
                </span>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                >
                  {link.title}
                </a>
              </h3>
              
              {link.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {link.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(link.created_at).toLocaleDateString()}</span>
                </span>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleLike(link.id)}
                    className={`flex items-center space-x-1 hover:text-red-500 transition-colors ${
                      link.is_liked ? 'text-red-500' : 'text-gray-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${link.is_liked ? 'fill-current' : ''}`} />
                    <span>{link.likes_count || 0}</span>
                  </button>
                  
                  <span className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{link.comments_count || 0}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityLinks;