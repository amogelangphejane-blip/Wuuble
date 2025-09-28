import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  X, 
  Search, 
  Camera, 
  Check, 
  ArrowLeft,
  UserPlus,
  Crown,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (groupData: GroupData) => void;
}

interface GroupData {
  name: string;
  description?: string;
  participants: string[];
  avatar?: File;
}

interface User {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const GroupChatDialog: React.FC<GroupChatDialogProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
}) => {
  const [step, setStep] = useState<'participants' | 'details'>('participants');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupAvatar, setGroupAvatar] = useState<File | null>(null);

  // Mock users data - in real app this would come from API
  const mockUsers: User[] = [
    { id: '1', display_name: 'Alice Johnson', avatar_url: null },
    { id: '2', display_name: 'Bob Smith', avatar_url: null },
    { id: '3', display_name: 'Charlie Brown', avatar_url: null },
    { id: '4', display_name: 'Diana Wilson', avatar_url: null },
    { id: '5', display_name: 'Eve Davis', avatar_url: null },
  ];

  const filteredUsers = mockUsers.filter(user =>
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleParticipantToggle = (user: User) => {
    setSelectedParticipants(prev => {
      const exists = prev.find(p => p.id === user.id);
      if (exists) {
        return prev.filter(p => p.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleNext = () => {
    if (selectedParticipants.length > 0) {
      setStep('details');
    }
  };

  const handleBack = () => {
    setStep('participants');
  };

  const handleCreateGroup = () => {
    if (groupName.trim() && selectedParticipants.length > 0) {
      onCreateGroup({
        name: groupName,
        description: groupDescription,
        participants: selectedParticipants.map(p => p.id),
        avatar: groupAvatar || undefined,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setStep('participants');
    setSearchQuery('');
    setSelectedParticipants([]);
    setGroupName('');
    setGroupDescription('');
    setGroupAvatar(null);
    onClose();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setGroupAvatar(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'details' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Users className="h-5 w-5" />
            {step === 'participants' ? 'Add Participants' : 'Group Details'}
          </DialogTitle>
        </DialogHeader>

        {step === 'participants' ? (
          <>
            {/* Selected participants */}
            {selectedParticipants.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">
                  Selected ({selectedParticipants.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedParticipants.map((participant) => (
                    <Badge
                      key={participant.id}
                      variant="secondary"
                      className="flex items-center gap-1 pl-1 pr-2 py-1"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={participant.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-blue-500 text-white">
                          {getInitials(participant.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">
                        {participant.display_name?.split(' ')[0] || 'Unknown'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 hover:bg-destructive/20 hover:text-destructive"
                        onClick={() => handleParticipantToggle(participant)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* User list */}
            <ScrollArea className="max-h-60 mb-4">
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  const isSelected = selectedParticipants.some(p => p.id === user.id);
                  return (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                        "hover:bg-gray-100 dark:hover:bg-gray-800",
                        isSelected && "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800"
                      )}
                      onClick={() => handleParticipantToggle(user)}
                    >
                      <Checkbox checked={isSelected} readOnly />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {getInitials(user.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {user.display_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.random() > 0.5 ? 'online' : 'last seen recently'}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleNext}
                disabled={selectedParticipants.length === 0}
                className="bg-[#25d366] hover:bg-[#20c55e] text-white"
              >
                Next ({selectedParticipants.length})
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Group avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-2">
                  {groupAvatar ? (
                    <img
                      src={URL.createObjectURL(groupAvatar)}
                      alt="Group avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Users className="h-8 w-8" />
                  )}
                </div>
                <Button
                  size="icon"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-[#25d366] hover:bg-[#20c55e]"
                >
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleAvatarChange}
                  />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Add group photo</p>
            </div>

            {/* Group details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="groupName">Group Name *</Label>
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="groupDescription">Description (Optional)</Label>
                <Input
                  id="groupDescription"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="What's this group about?"
                  className="mt-1"
                />
              </div>

              {/* Participants preview */}
              <div>
                <Label>Participants ({selectedParticipants.length})</Label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {selectedParticipants.map((participant, index) => (
                    <div key={participant.id} className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={participant.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-gray-400 to-gray-600 text-white">
                          {getInitials(participant.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {participant.display_name || 'Unknown User'}
                      </span>
                      {index === 0 && (
                        <Crown className="h-3 w-3 text-yellow-500 ml-auto" title="Group Admin" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button 
                onClick={handleCreateGroup}
                disabled={!groupName.trim()}
                className="bg-[#25d366] hover:bg-[#20c55e] text-white"
              >
                Create Group
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};