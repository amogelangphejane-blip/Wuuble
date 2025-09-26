import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Link, ExternalLink, Plus, Trash2, Edit2 } from 'lucide-react';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { ModernHeader } from '@/components/ModernHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CommunityLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  created_at: string;
}

const CommunityLinksPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [links, setLinks] = useState<CommunityLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    description: ''
  });

  useEffect(() => {
    if (id) {
      fetchLinks();
      checkOwnership();
    }
  }, [id, user]);

  const checkOwnership = async () => {
    if (!user || !id) return;
    
    try {
      const { data } = await supabase
        .from('communities')
        .select('owner_id')
        .eq('id', id)
        .single();
      
      setIsOwner(data?.owner_id === user.id);
    } catch (err) {
      console.error('Error checking ownership:', err);
    }
  };

  const fetchLinks = async () => {
    try {
      setLoading(true);
      // For now, we'll use mock data since the links table might not exist
      // In production, you'd fetch from a community_links table
      const mockLinks: CommunityLink[] = [
        {
          id: '1',
          title: 'Community Guidelines',
          url: 'https://example.com/guidelines',
          description: 'Read our community guidelines and rules',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Resource Library',
          url: 'https://example.com/resources',
          description: 'Access our curated collection of resources',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Discord Server',
          url: 'https://discord.gg/example',
          description: 'Join our Discord community for real-time chat',
          created_at: new Date().toISOString()
        }
      ];
      setLinks(mockLinks);
    } catch (err) {
      console.error('Error fetching links:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async () => {
    if (!newLink.title || !newLink.url) {
      toast({
        title: 'Error',
        description: 'Please provide both title and URL',
        variant: 'destructive'
      });
      return;
    }

    // In production, save to database
    const tempLink: CommunityLink = {
      id: Date.now().toString(),
      ...newLink,
      created_at: new Date().toISOString()
    };

    setLinks([...links, tempLink]);
    setNewLink({ title: '', url: '', description: '' });
    setShowAddForm(false);
    
    toast({
      title: 'Success',
      description: 'Link added successfully'
    });
  };

  const handleDeleteLink = (linkId: string) => {
    setLinks(links.filter(link => link.id !== linkId));
    toast({
      title: 'Success',
      description: 'Link removed successfully'
    });
  };

  if (!id) {
    return (
      <ResponsiveLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p>Invalid community ID</p>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <ModernHeader />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate(`/community/${id}`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Community Links</h1>
            <p className="text-gray-600">Useful links and resources for our community</p>
          </div>

          {isOwner && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Manage Links</span>
                  <Button
                    size="sm"
                    onClick={() => setShowAddForm(!showAddForm)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Link
                  </Button>
                </CardTitle>
              </CardHeader>
              {showAddForm && (
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      placeholder="Link Title"
                      value={newLink.title}
                      onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                    />
                    <Input
                      placeholder="URL"
                      type="url"
                      value={newLink.url}
                      onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newLink.description}
                      onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleAddLink}>Add Link</Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddForm(false);
                          setNewLink({ title: '', url: '', description: '' });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : links.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Link className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No links available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {links.map((link) => (
                <Card key={link.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Link className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-lg">{link.title}</h3>
                        </div>
                        {link.description && (
                          <p className="text-gray-600 mb-3">{link.description}</p>
                        )}
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          {link.url}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLink(link.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default CommunityLinksPage;