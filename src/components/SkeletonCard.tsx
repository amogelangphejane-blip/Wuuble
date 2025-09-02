import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  variant?: 'community' | 'post' | 'user' | 'event' | 'message' | 'notification';
  className?: string;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  variant = 'community', 
  className 
}) => {
  switch (variant) {
    case 'community':
      return (
        <Card className={cn("w-full", className)}>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-[80%]" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case 'post':
      return (
        <Card className={cn("w-full", className)}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-[90%]" />
              <Skeleton className="h-40 w-full rounded-md" />
              <div className="flex justify-between items-center pt-2">
                <div className="flex space-x-4">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case 'user':
      return (
        <Card className={cn("w-full", className)}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[140px]" />
                <Skeleton className="h-3 w-[100px]" />
                <div className="flex space-x-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      );

    case 'event':
      return (
        <Card className={cn("w-full", className)}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-[180px]" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-[70%]" />
              <div className="flex items-center space-x-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case 'message':
      return (
        <div className={cn("flex items-start space-x-3 p-3", className)}>
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-[60%]" />
          </div>
        </div>
      );

    case 'notification':
      return (
        <div className={cn("flex items-start space-x-3 p-3 border-b", className)}>
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[160px]" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-[40%]" />
          </div>
        </div>
      );

    default:
      return (
        <Card className={cn("w-full", className)}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-[60%]" />
            </div>
          </CardContent>
        </Card>
      );
  }
};

// Skeleton grid for multiple items
export const SkeletonGrid: React.FC<{
  count?: number;
  variant?: SkeletonCardProps['variant'];
  className?: string;
}> = ({ count = 6, variant = 'community', className }) => {
  return (
    <div className={cn(
      "grid gap-4",
      variant === 'community' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      variant === 'post' && "grid-cols-1",
      variant === 'user' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      variant === 'event' && "grid-cols-1 md:grid-cols-2",
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
};

export default SkeletonCard;