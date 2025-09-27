import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export const TestDisplayName: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Please sign in to test display names</p>
        </CardContent>
      </Card>
    );
  }

  // Test the display name function we created
  const getPostUserDisplayName = (postUser: { id: string; email: string; display_name?: string | null; avatar_url?: string }) => {
    // Priority: display_name > email username > 'User'
    if (postUser.display_name && postUser.display_name.trim() !== '') {
      return postUser.display_name.trim();
    }
    if (postUser.email && postUser.email.trim() !== '') {
      const emailUsername = postUser.email.split('@')[0];
      if (emailUsername && emailUsername.trim() !== '') {
        return emailUsername.trim();
      }
    }
    return 'User';
  };

  // Test cases
  const testUser = {
    id: user.id,
    email: user.email || '',
    display_name: null, // This simulates a null display_name from database
    avatar_url: null
  };

  const testUserWithDisplayName = {
    id: user.id,
    email: user.email || '',
    display_name: 'John Doe', // This simulates having a display_name
    avatar_url: null
  };

  const testUserWithEmptyDisplayName = {
    id: user.id,
    email: user.email || '',
    display_name: '', // This simulates empty display_name
    avatar_url: null
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display Name Logic Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p><strong>Your Email:</strong> {user.email}</p>
          <p><strong>Expected Email Username:</strong> {user.email?.split('@')[0]}</p>
        </div>

        <div className="grid gap-4">
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium">Test 1: display_name = null</p>
            <p className="text-lg">Result: "{getPostUserDisplayName(testUser)}"</p>
            <p className="text-xs text-gray-500">Should show: {user.email?.split('@')[0]}</p>
          </div>

          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium">Test 2: display_name = "John Doe"</p>
            <p className="text-lg">Result: "{getPostUserDisplayName(testUserWithDisplayName)}"</p>
            <p className="text-xs text-gray-500">Should show: John Doe</p>
          </div>

          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium">Test 3: display_name = ""</p>
            <p className="text-lg">Result: "{getPostUserDisplayName(testUserWithEmptyDisplayName)}"</p>
            <p className="text-xs text-gray-500">Should show: {user.email?.split('@')[0]}</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded">
          <p className="text-sm font-medium text-blue-800 mb-2">What the fix does:</p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. Checks if profile has a valid display_name</li>
            <li>2. If not, uses the username part of your email</li>
            <li>3. Only falls back to "User" if email is also missing</li>
            <li>4. This should fix the issue you were seeing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};