import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Video, FileText, Lock, CheckCircle, Clock, Plus, GraduationCap, FolderOpen, Package, Link2, ExternalLink, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SimpleResourceForm } from '@/components/SimpleResourceForm';
import { useToast } from '@/hooks/use-toast';

interface Resource {
  id: string;
  title: string;
  description?: string;
  resource_type: string;
  content?: string;
  created_at: string;
}

interface SkoolClassroomProps {
  communityId: string;
}

export const SkoolClassroom: React.FC<SkoolClassroomProps> = ({ communityId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchResources();
  }, [communityId]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_resources')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching resources:', error);
        return;
      }

      setResources(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = async (resourceData: any) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to create resources",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Get the current session to ensure we have the auth user ID
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error("Authentication session expired. Please log in again.");
      }

      console.log('Creating resource with user ID:', session.user.id);
      console.log('Community ID:', communityId);

      // First, ensure the user has a profile (this might be missing)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Profile not found, creating...');
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            display_name: session.user.email?.split('@')[0] || 'User',
            created_at: new Date().toISOString()
          });

        if (createProfileError) {
          console.error('Failed to create profile:', createProfileError);
        }
      }

      // Verify community membership
      const { data: membership, error: membershipError } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', session.user.id)
        .single();

      if (membershipError || !membership) {
        throw new Error("You must be a member of this community to add resources. Please join the community first.");
      }

      // Insert the resource with the authenticated user's ID
      const { data: resource, error } = await supabase
        .from('community_resources')
        .insert({
          title: resourceData.title,
          description: resourceData.description,
          resource_type: resourceData.resource_type,
          content_url: resourceData.content_url || null,
          is_free: resourceData.is_free !== false, // Default to true
          community_id: communityId,
          user_id: session.user.id, // Use session user ID to ensure it's from auth.users
          is_approved: true // Auto-approve for now
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      toast({
        title: "Success!",
        description: "Resource created successfully"
      });

      setCreateFormOpen(false);
      fetchResources(); // Refresh the list

    } catch (error: any) {
      console.error('Error creating resource:', error);
      console.error('Error details:', error);
      
      let errorMessage = "Failed to create resource";
      let errorTitle = "Error";
      
      if (error.message?.includes('member of this community')) {
        errorTitle = "Access Denied";
        errorMessage = error.message;
      } else if (error.message?.includes('foreign key constraint') || error.code === '23503') {
        errorTitle = "Database Error";
        errorMessage = "There's an issue with your account setup. Please contact support with this info: User ID - " + user.id;
      } else if (error.message?.includes('violates')) {
        errorTitle = "Validation Error";
        errorMessage = "Please check all fields are filled correctly.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5 text-red-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'article':
        return <FileText className="w-5 h-5 text-green-500" />;
      case 'link':
        return <Link2 className="w-5 h-5 text-purple-500" />;
      case 'course':
        return <GraduationCap className="w-5 h-5 text-yellow-500" />;
      case 'tool':
        return <Package className="w-5 h-5 text-orange-500" />;
      case 'service':
        return <Package className="w-5 h-5 text-cyan-500" />;
      default:
        return <FolderOpen className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Classroom</h1>
            <p className="text-gray-500 text-sm mt-1">Courses and learning resources</p>
          </div>
        </div>
        <Button 
          onClick={() => setCreateFormOpen(true)}
          className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          <FolderOpen className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : resources.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No learning resources yet</h3>
          <p className="text-gray-500 mb-4">
            This community hasn't added any courses or learning materials yet.
          </p>
          <Button 
            variant="outline"
            onClick={() => setCreateFormOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            <FolderOpen className="w-4 h-4 mr-2" />
            Create First Resource
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {resources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition-all cursor-pointer group">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    {getResourceIcon(resource.resource_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold group-hover:text-blue-600 transition-colors">{resource.title}</h3>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {resource.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {getResourceIcon(resource.resource_type)}
                        <span className="capitalize">{resource.resource_type}</span>
                      </Badge>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Added {new Date(resource.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <BookOpen className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Resource Form Dialog */}
      <SimpleResourceForm
        isOpen={createFormOpen}
        onClose={() => setCreateFormOpen(false)}
        onSubmit={handleCreateResource}
        communityId={communityId}
        loading={submitting}
      />
    </div>
  );
};