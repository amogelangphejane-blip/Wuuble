import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { SimpleCalendar } from '@/components/SimpleCalendar';
import { SimpleEventForm, EventFormData } from '@/components/SimpleEventForm';
import { useToast } from '@/hooks/use-toast';

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string | null;
  is_private: boolean;
  member_count: number;
}

const SimpleCommunityCalendar: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventLoading, setEventLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchCommunity();
    }
  }, [user, id]);

  const fetchCommunity = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching community:', error);
        navigate('/communities');
        return;
      }

      setCommunity(data);
    } catch (error) {
      console.error('Error fetching community:', error);
      navigate('/communities');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (eventData: EventFormData) => {
    if (!user || !id) return;

    try {
      setEventLoading(true);
      
      const { error } = await supabase
        .from('community_events')
        .insert({
          community_id: id,
          created_by: user.id,
          title: eventData.title,
          description: eventData.description || null,
          event_date: eventData.eventDate,
          start_time: eventData.startTime || null,
          end_time: eventData.endTime || null,
          location: eventData.location || null,
          is_virtual: eventData.isVirtual,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Event created!",
        description: "Your event has been added to the calendar.",
      });
      
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEventLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Community not found</h3>
          <button 
            onClick={() => navigate('/communities')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Communities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/community/${id}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
                <p className="text-sm text-gray-500">{community.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <SimpleCalendar 
          communityId={id!} 
          onCreateEvent={() => setShowEventForm(true)}
        />
      </div>
      
      {/* Event Creation Form */}
      <SimpleEventForm
        isOpen={showEventForm}
        onClose={() => setShowEventForm(false)}
        onSubmit={handleCreateEvent}
        loading={eventLoading}
      />
    </div>
  );
};

export default SimpleCommunityCalendar;