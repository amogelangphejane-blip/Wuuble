import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Copy, Users, Search, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  display_name?: string;
}

export function UserIdHelper() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUsers, setFoundUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    try {
      // Get users from profiles table (this is safer than auth.users)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .limit(10);

      if (error) throw error;

      // For demo purposes, we'll show available profiles
      const users = profiles?.map(profile => ({
        id: profile.user_id,
        email: profile.display_name || `User ${profile.user_id.slice(0, 8)}`,
        display_name: profile.display_name
      })) || [];

      setAllUsers(users.filter(u => u.id !== user?.id)); // Exclude current user
    } catch (error) {
      console.warn('Could not load users:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "User ID copied to clipboard",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          Find User IDs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Find User IDs for Messaging
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current user info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Your ID:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {user?.id.slice(0, 8)}...
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => copyToClipboard(user?.id || '')}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm">{user?.email}</span>
              </div>
            </CardContent>
          </Card>

          {/* Available users */}
          {allUsers.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Available Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allUsers.map((foundUser) => (
                    <div 
                      key={foundUser.id}
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {foundUser.display_name || foundUser.email}
                        </p>
                        <p className="text-xs text-gray-500 font-mono truncate">
                          {foundUser.id}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(foundUser.id)}
                        className="ml-2"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <div className="text-sm text-gray-600 space-y-2">
            <h4 className="font-medium">How to start a conversation:</h4>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Copy a User ID from above</li>
              <li>Go back to Messages</li>
              <li>Paste the ID in "Enter user ID" field</li>
              <li>Click "Start New Chat"</li>
            </ol>
          </div>

          {/* Create test user suggestion */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <h4 className="font-medium text-blue-800 text-sm mb-1">💡 Testing Tip</h4>
            <p className="text-xs text-blue-700">
              Create another user account to test messaging between different users. 
              Open an incognito window, sign up with a different email, then use each other's IDs to chat.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}