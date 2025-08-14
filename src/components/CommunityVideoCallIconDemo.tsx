import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CommunityVideoCallIcon } from './CommunityVideoCallIcon';

export const CommunityVideoCallIconDemo: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Community Video Call Icon</h1>
        <p className="text-muted-foreground">Custom SVG icon for community video calling features</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Different Sizes */}
        <Card>
          <CardHeader>
            <CardTitle>Different Sizes</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center space-x-4">
            <div className="text-center">
              <CommunityVideoCallIcon size={16} />
              <p className="text-xs mt-2">16px</p>
            </div>
            <div className="text-center">
              <CommunityVideoCallIcon size={24} />
              <p className="text-xs mt-2">24px</p>
            </div>
            <div className="text-center">
              <CommunityVideoCallIcon size={32} />
              <p className="text-xs mt-2">32px</p>
            </div>
            <div className="text-center">
              <CommunityVideoCallIcon size={48} />
              <p className="text-xs mt-2">48px</p>
            </div>
          </CardContent>
        </Card>

        {/* Different Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Different Colors</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center space-x-4">
            <div className="text-center">
              <CommunityVideoCallIcon size={32} color="#6366f1" />
              <p className="text-xs mt-2">Indigo</p>
            </div>
            <div className="text-center">
              <CommunityVideoCallIcon size={32} color="#ec4899" />
              <p className="text-xs mt-2">Pink</p>
            </div>
            <div className="text-center">
              <CommunityVideoCallIcon size={32} color="#10b981" />
              <p className="text-xs mt-2">Green</p>
            </div>
            <div className="text-center">
              <CommunityVideoCallIcon size={32} color="#f59e0b" />
              <p className="text-xs mt-2">Amber</p>
            </div>
          </CardContent>
        </Card>

        {/* In Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>In UI Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
              <CommunityVideoCallIcon size={20} color="white" />
              Start Video Call
            </button>
            
            <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <CommunityVideoCallIcon size={20} color="white" />
              </div>
              <div>
                <p className="font-medium">Community Video Chat</p>
                <p className="text-sm text-gray-600">Connect with members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Example */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Example</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { CommunityVideoCallIcon } from '@/components/CommunityVideoCallIcon';

// Basic usage
<CommunityVideoCallIcon />

// With custom size and color
<CommunityVideoCallIcon size={32} color="#6366f1" />

// With CSS classes
<CommunityVideoCallIcon 
  size={24} 
  className="hover:scale-110 transition-transform" 
/>`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityVideoCallIconDemo;