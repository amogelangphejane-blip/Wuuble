import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ExternalLink,
  Star,
  Eye,
  Bookmark,
  BookmarkCheck,
  Flag,
  MapPin,
  DollarSign,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Video,
  Link as LinkIcon,
  Wrench,
  Calendar,
  GraduationCap,
  Heart,
  Home,
  Briefcase,
  Newspaper
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { validateAvatarUrl } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: 'article' | 'video' | 'document' | 'link' | 'tool' | 'service' | 'event' | 'course';
  content_url?: string;
  file_url?: string;
  location?: string;
  is_free: boolean;
  price_amount?: number;
  price_currency?: string;
  is_featured: boolean;
  view_count: number;
  click_count: number;
  created_at: string;
  user_id: string;
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  tags?: Array<{
    id: string;
    name: string;
  }>;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  average_rating?: number;
  rating_count?: number;
  user_rating?: number;
  is_bookmarked?: boolean;
}

interface ResourceCardProps {
  resource: Resource;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resourceId: string) => void;
  onReport?: (resourceId: string) => void;
  currentUserId?: string;
  isCreator?: boolean;
}

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'article': return FileText;
    case 'video': return Video;
    case 'document': return FileText;
    case 'link': return LinkIcon;
    case 'tool': return Wrench;
    case 'service': return Wrench;
    case 'event': return Calendar;
    case 'course': return GraduationCap;
    default: return FileText;
  }
};

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'briefcase': return Briefcase;
    case 'home': return Home;
    case 'calendar': return Calendar;
    case 'heart': return Heart;
    case 'graduation-cap': return GraduationCap;
    case 'map-pin': return MapPin;
    case 'file-text': return FileText;
    case 'play-circle': return Video;
    case 'wrench': return Wrench;
    case 'newspaper': return Newspaper;
    default: return FileText;
  }
};

export const ResourceCard = ({ 
  resource, 
  onEdit, 
  onDelete, 
  onReport, 
  currentUserId,
  isCreator 
}: ResourceCardProps) => {
  const [isBookmarked, setIsBookmarked] = useState(resource.is_bookmarked || false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  const ResourceIcon = getResourceIcon(resource.resource_type);
  const CategoryIcon = resource.category ? getCategoryIcon(resource.category.icon) : FileText;

  const isOwner = currentUserId === resource.user_id;

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;

    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await supabase
          .from('resource_bookmarks')
          .delete()
          .eq('resource_id', resource.id)
          .eq('user_id', user.id);
        setIsBookmarked(false);
        toast({
          title: "Bookmark removed",
          description: "Resource removed from your bookmarks"
        });
      } else {
        await supabase
          .from('resource_bookmarks')
          .insert({
            resource_id: resource.id,
            user_id: user.id
          });
        setIsBookmarked(true);
        toast({
          title: "Bookmarked",
          description: "Resource added to your bookmarks"
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive"
      });
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleExternalClick = async () => {
    if (resource.content_url) {
      // Increment click count
      try {
        await supabase
          .from('community_resources')
          .update({ click_count: resource.click_count + 1 })
          .eq('id', resource.id);
      } catch (error) {
        console.error('Error updating click count:', error);
      }
      
      window.open(resource.content_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleReport = async () => {
    if (!user || !reportReason) return;

    setReportLoading(true);
    try {
      await supabase
        .from('resource_reports')
        .insert({
          resource_id: resource.id,
          reporter_id: user.id,
          reason: reportReason,
          description: reportDescription.trim() || null
        });

      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe"
      });
      
      setReportDialogOpen(false);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive"
      });
    } finally {
      setReportLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className={`relative transition-all hover:shadow-md ${resource.is_featured ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}>
      {resource.is_featured && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge variant="default" className="bg-primary text-primary-foreground">
            Featured
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                <ResourceIcon className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-2 mb-1">
                {resource.title}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage 
                    src={validateAvatarUrl(resource.profiles?.avatar_url)} 
                    alt={resource.profiles?.display_name || 'User'}
                  />
                  <AvatarFallback className="text-xs">
                    {(resource.profiles?.display_name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{resource.profiles?.display_name || 'Anonymous'}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              disabled={bookmarkLoading}
              className="p-2"
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-primary" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(resource)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {(isOwner || isCreator) && onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(resource.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
                {!isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
                      <Flag className="w-4 h-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Category and Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          {resource.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CategoryIcon className="w-3 h-3" />
              {resource.category.name}
            </Badge>
          )}
          {resource.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-xs">
              #{tag.name}
            </Badge>
          ))}
          {resource.tags && resource.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{resource.tags.length - 3} more
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <CardDescription className="line-clamp-3 mb-4">
          {resource.description}
        </CardDescription>

        {/* Resource Details */}
        <div className="space-y-3">
          {/* Location */}
          {resource.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{resource.location}</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            {resource.is_free ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Free
              </Badge>
            ) : (
              <span className="font-medium">
                {resource.price_amount} {resource.price_currency}
              </span>
            )}
          </div>

          {/* Rating */}
          {resource.average_rating && resource.rating_count && (
            <div className="flex items-center gap-2">
              {renderStars(resource.average_rating)}
              <span className="text-sm text-muted-foreground">
                {resource.average_rating.toFixed(1)} ({resource.rating_count} reviews)
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{resource.view_count}</span>
            </div>
            {resource.content_url && (
              <div className="flex items-center gap-1">
                <ExternalLink className="w-4 h-4" />
                <span>{resource.click_count}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {resource.content_url && (
            <Button 
              onClick={handleExternalClick}
              className="w-full mt-4"
              variant="default"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Resource
            </Button>
          )}
        </div>
      </CardContent>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Resource</DialogTitle>
            <DialogDescription>
              Help us maintain a safe community by reporting inappropriate content.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for reporting</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a reason...</option>
                <option value="spam">Spam</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="outdated">Outdated information</option>
                <option value="broken_link">Broken link</option>
                <option value="copyright">Copyright violation</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Additional details (optional)</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide more context about the issue..."
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {reportDescription.length}/500
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleReport}
              disabled={!reportReason || reportLoading}
              className="flex-1"
              variant="destructive"
            >
              {reportLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
            <Button
              onClick={() => setReportDialogOpen(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};