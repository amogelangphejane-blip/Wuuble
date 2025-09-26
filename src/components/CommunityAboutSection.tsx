import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Info, 
  Calendar, 
  Users, 
  Globe, 
  Link, 
  Shield, 
  Target,
  Mail,
  Twitter,
  Github,
  MessageSquare,
  Edit
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommunityAboutSectionProps {
  community: {
    id: string;
    name: string;
    description: string;
    created_at: string;
    member_count: number;
    category?: string;
    rules?: string;
    location?: string;
    website?: string;
    social_links?: {
      twitter?: string;
      discord?: string;
      github?: string;
    };
  };
  isOwner: boolean;
}

export const CommunityAboutSection: React.FC<CommunityAboutSectionProps> = ({
  community,
  isOwner
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">About {community.name}</h2>
        {isOwner && (
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              {community.description}
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Founded {formatDistanceToNow(new Date(community.created_at), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-500" />
                <span>{community.member_count} members</span>
              </div>
              {community.location && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span>{community.location}</span>
                </div>
              )}
              {community.category && (
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-gray-500" />
                  <Badge variant="outline">{community.category}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Community Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Community Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {community.rules ? (
              <div className="space-y-2">
                {community.rules.split('\n').map((rule, index) => (
                  <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    {rule}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No specific rules set. Please be respectful to all members.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Links & Social */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Links & Social
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {community.website && (
              <a
                href={community.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm">Website</span>
              </a>
            )}
            
            {community.social_links?.twitter && (
              <a
                href={community.social_links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <Twitter className="w-4 h-4" />
                <span className="text-sm">Twitter</span>
              </a>
            )}
            
            {community.social_links?.discord && (
              <a
                href={community.social_links.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">Discord</span>
              </a>
            )}
            
            {community.social_links?.github && (
              <a
                href={community.social_links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <Github className="w-4 h-4" />
                <span className="text-sm">GitHub</span>
              </a>
            )}

            {!community.website && !community.social_links && (
              <p className="text-sm text-gray-500">
                No external links available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              For inquiries about this community, please contact the moderators through the discussion board.
            </p>
            <Button className="mt-4 w-full" variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              Message Moderators
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Community Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Community Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Foster a supportive environment for learning and growth
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Share knowledge and expertise among members
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Build meaningful connections and collaborations
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Stay updated with the latest trends and developments
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};