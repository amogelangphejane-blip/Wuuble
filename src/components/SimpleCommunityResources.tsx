import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  BookOpen,
  AlertTriangle,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface SimpleCommunityResourcesProps {
  communityId: string;
  communityName: string;
  isMember: boolean;
  isCreator: boolean;
}

export const SimpleCommunityResources = ({ 
  communityId, 
  communityName, 
  isMember, 
  isCreator 
}: SimpleCommunityResourcesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResources();
  }, [communityId]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the helper view that includes tags properly
      const { data, error } = await supabase
        .from('community_resources_with_tags')
        .select('*')
        .eq('community_id', communityId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setResources(data || []);
    } catch (err: any) {
      console.error('Error fetching resources:', err);
      setError(err.message);
      toast({
        title: "Error loading resources",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isMember) {
    return (
      <Card className="border-warning bg-warning/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <p className="text-sm text-muted-foreground">
              Join this community to view and share resources
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">Error loading resources</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please try refreshing the page or contact support if the problem persists.
              </p>
              <Button 
                onClick={fetchResources} 
                variant="outline" 
                size="sm" 
                className="mt-3"
              >
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Community Resources
          </h2>
          <p className="text-muted-foreground mt-1">
            Share and discover helpful resources with the community
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Resource
        </Button>
      </div>

      {resources.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No resources yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Be the first to share a resource with the community!
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add First Resource
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">
                    {resource.title}
                  </CardTitle>
                  {resource.is_featured && (
                    <Badge variant="secondary">Featured</Badge>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {resource.resource_type}
                  </Badge>
                  {resource.is_free ? (
                    <Badge variant="success" className="text-xs">Free</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      ${resource.price_amount}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-3 mb-4">
                  {resource.description}
                </CardDescription>
                {resource.content_url && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(resource.content_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Resource
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};