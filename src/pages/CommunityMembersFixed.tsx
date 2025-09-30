import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Crown, Shield, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CommunityMembersFixed: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id, user]);

  const loadData = async () => {
    if (!id || !user) return;
    
    setLoading(true);
    try {
      // Get community
      const { data: comm } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();
      
      setCommunity(comm);
      
      // Get members from member_profiles
      const { data: profiles } = await supabase
        .from('member_profiles')
        .select('*')
        .eq('community_id', id)
        .eq('status', 'active');
      
      if (profiles && profiles.length > 0) {
        setMembers(profiles);
      } else {
        // Fallback: get from community_members
        const { data: cmMembers } = await supabase
          .from('community_members')
          .select('*')
          .eq('community_id', id);
        
        if (cmMembers) {
          setMembers(cmMembers);
        }
      }
    } catch (error) {
      console.error('Error loading members:', error);
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(`/community/${id}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Members
          </h1>
          <p className="text-gray-600 mt-2">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>

        {members.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">No members yet</h3>
            <p className="text-gray-500">This community has no members.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <Card key={member.id} className="overflow-hidden">
                <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-500" />
                <CardContent className="pt-0 pb-6 -mt-8">
                  <Avatar className="w-16 h-16 border-4 border-white mx-auto mb-3">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-blue-500 text-white">
                      {(member.display_name || 'M')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <p className="font-semibold">
                        {member.display_name || 'Member'}
                      </p>
                      {(member.role === 'creator' || member.role === 'owner') && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      {member.role === 'moderator' && (
                        <Shield className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    
                    <Badge variant="secondary" className="mb-2">
                      {member.role === 'creator' || member.role === 'owner' ? 'Creator' :
                       member.role === 'moderator' ? 'Moderator' : 'Member'}
                    </Badge>
                    
                    <p className="text-xs text-gray-500">
                      Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityMembersFixed;