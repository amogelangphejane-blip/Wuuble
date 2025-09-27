import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { fixUserDisplayName, fixProfileDisplayNames } from '@/utils/fixProfileDisplayNames';
import { clearProfileCache } from '@/utils/profileUtils';
import { RefreshCw, User, Users } from 'lucide-react';

export const ProfileDisplayNameFix: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fixing, setFixing] = useState(false);
  const [fixingAll, setFixingAll] = useState(false);

  const handleFixCurrentUser = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "No user found. Please sign in first.",
        variant: "destructive",
      });
      return;
    }

    setFixing(true);
    try {
      const result = await fixUserDisplayName(user.id, user.email || undefined);
      
      if (result.success) {
        if (result.unchanged) {
          toast({
            title: "No Changes Needed",
            description: "Your profile already has a valid display name.",
          });
        } else {
          // Clear cache to ensure fresh data
          clearProfileCache(user.id);
          
          toast({
            title: "Profile Fixed!",
            description: `Your display name has been updated to: ${result.displayName}`,
          });
        }
      } else {
        throw new Error(result.error?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fixing profile:', error);
      toast({
        title: "Fix Failed",
        description: error instanceof Error ? error.message : "Failed to fix profile display name",
        variant: "destructive",
      });
    } finally {
      setFixing(false);
    }
  };

  const handleFixAllProfiles = async () => {
    setFixingAll(true);
    try {
      const result = await fixProfileDisplayNames();
      
      if (result.success) {
        toast({
          title: "Bulk Fix Complete",
          description: `Successfully updated ${result.updated} profile(s) with missing display names.`,
        });
      } else {
        throw new Error(result.error?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fixing all profiles:', error);
      toast({
        title: "Bulk Fix Failed",
        description: error instanceof Error ? error.message : "Failed to fix profile display names",
        variant: "destructive",
      });
    } finally {
      setFixingAll(false);
    }
  };

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Please sign in to use profile fixes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Profile Display Name Fix
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 space-y-2">
          <p>If your posts show "User" instead of your name, use these tools to fix your profile:</p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleFixCurrentUser}
            disabled={fixing}
            className="w-full"
            variant="default"
          >
            <User className="w-4 h-4 mr-2" />
            {fixing ? 'Fixing Your Profile...' : 'Fix My Profile'}
          </Button>

          <Button
            onClick={handleFixAllProfiles}
            disabled={fixingAll}
            className="w-full"
            variant="outline"
          >
            <Users className="w-4 h-4 mr-2" />
            {fixingAll ? 'Fixing All Profiles...' : 'Fix All Profiles (Admin)'}
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Fix My Profile:</strong> Updates your profile to use your email username if display name is missing</p>
          <p><strong>Fix All Profiles:</strong> Updates all user profiles that have missing display names (use carefully)</p>
        </div>
      </CardContent>
    </Card>
  );
};