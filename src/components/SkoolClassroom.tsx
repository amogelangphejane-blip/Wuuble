import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Video, FileText, Lock, CheckCircle, Clock, Plus, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'document':
        return <FileText className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Classroom</h1>
          <p className="text-gray-500 text-sm mt-1">Courses and learning resources</p>
        </div>
        <Button className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : resources.length === 0 ? (
        <Card className="p-8 text-center">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No learning resources yet</h3>
          <p className="text-gray-500 mb-4">
            This community hasn't added any courses or learning materials yet.
          </p>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create First Course
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {resources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition-all cursor-pointer">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    {getResourceIcon(resource.resource_type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{resource.title}</h3>
                    {resource.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {resource.resource_type}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Added {new Date(resource.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button size="sm">View</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};