import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useSimpleMembers } from '@/hooks/useSimpleMembers';
import { useToast } from '@/hooks/use-toast';
import MemberCard from '@/components/MemberCard';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  ArrowLeft,
  Users,
  Search,
  Filter,
  UserPlus,
  Crown,
  Shield,
  User,
  Loader2,
  RefreshCw,
  MessageCircle,
  Settings,
  TrendingUp
} from 'lucide-react';

const SimpleMembers: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    members,
    community,
    stats,
    loading,
    error,
    filters,
    currentUserRole,
    setFilters,
    refreshMembers,
    promoteMember,
    demoteMember,
    removeMember,
  } = useSimpleMembers(id || '', user?.id);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Handle member actions with loading states
  const handleMemberAction = async (
    action: 'promote' | 'demote' | 'remove' | 'message',
    member: any
  ) => {
    if (!member.id) return;

    setActionLoading(member.id);
    
    try {
      switch (action) {
        case 'promote':
          await promoteMember(member.id);
          break;
        case 'demote':
          await demoteMember(member.id);
          break;
        case 'remove':
          if (confirm(`Are you sure you want to remove ${member.display_name} from the community?`)) {
            await removeMember(member.id);
          }
          break;
        case 'message':
          toast({
            title: "Coming Soon",
            description: "Direct messaging will be available soon!",
          });
          break;
      }
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex items-center justify-center h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading members...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-pink-50">
        <div className="flex items-center justify-center h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold mb-2 text-red-800">Error Loading Members</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={refreshMembers} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => navigate('/communities')}>
                Back to Communities
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
        <div className="flex items-center justify-center h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Community not found</h3>
            <Button onClick={() => navigate('/communities')}>
              Back to Communities
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const canManage = currentUserRole === 'creator' || currentUserRole === 'moderator';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-40 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/community/${id}`)}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {community.name}
              </motion.button>
            </div>
            
            <div className="flex items-center gap-3">
              {canManage && (
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Members
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={refreshMembers}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              {currentUserRole === 'creator' && (
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl text-white shadow-lg">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Members</h1>
              <p className="text-gray-600 text-lg">
                Manage and connect with the amazing community of{' '}
                <span className="font-semibold text-blue-600">{community.name}</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Members</p>
                  <p className="text-3xl font-bold">{stats.total_members}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Online Now</p>
                  <p className="text-3xl font-bold">{stats.online_now}</p>
                </div>
                <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Moderators</p>
                  <p className="text-3xl font-bold">{stats.moderators}</p>
                </div>
                <Crown className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">New This Week</p>
                  <p className="text-3xl font-bold">{stats.new_this_week}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20 shadow-lg"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search members by name or email..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="pl-10 border-0 bg-white/80 shadow-sm"
              />
            </div>
            
            <Select value={filters.role} onValueChange={(value: any) => setFilters({ role: value })}>
              <SelectTrigger className="w-40 border-0 bg-white/80 shadow-sm">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="moderator">Moderators</SelectItem>
                <SelectItem value="member">Members</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value: any) => setFilters({ status: value })}>
              <SelectTrigger className="w-40 border-0 bg-white/80 shadow-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>

            {(filters.search || filters.role !== 'all' || filters.status !== 'all') && (
              <Button
                variant="outline"
                onClick={() => setFilters({ search: '', role: 'all', status: 'all' })}
                className="bg-white/80"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </motion.div>

        {/* Members Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {members.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 border border-white/20 shadow-xl">
                <Users className="h-24 w-24 mx-auto mb-6 text-gray-300" />
                <h3 className="text-2xl font-semibold mb-3 text-gray-700">No members found</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {filters.search || filters.role !== 'all' || filters.status !== 'all'
                    ? 'Try adjusting your filters to see more members.'
                    : 'This community is just getting started. Be among the first to join!'}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setFilters({ search: '', role: 'all', status: 'all' })}
                  >
                    Clear Filters
                  </Button>
                  {canManage && (
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Members
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {members.map((member, index) => (
                  <motion.div
                    key={member.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        delay: Math.min(index * 0.05, 0.5),
                        type: "spring",
                        stiffness: 100
                      }
                    }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  >
                    <MemberCard
                      member={member}
                      currentUserRole={currentUserRole}
                      currentUserId={user?.id}
                      onMessage={(m) => handleMemberAction('message', m)}
                      onPromote={(m) => handleMemberAction('promote', m)}
                      onDemote={(m) => handleMemberAction('demote', m)}
                      onRemove={(m) => handleMemberAction('remove', m)}
                    />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SimpleMembers;