import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link, X, ExternalLink, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LinkMetadata {
  url: string;
  title: string;
  description: string;
  image: string;
  domain: string;
}

interface LinkPreviewProps {
  onLinkAdded: (metadata: LinkMetadata | null) => void;
  currentLink: LinkMetadata | null;
  disabled?: boolean;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({
  onLinkAdded,
  currentLink,
  disabled = false
}) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const { toast } = useToast();

  // Reset input when currentLink changes
  useEffect(() => {
    if (!currentLink) {
      setLinkUrl('');
      setShowInput(false);
    }
  }, [currentLink]);

  const isValidUrl = (url: string): boolean => {
    try {
      const urlObject = new URL(url);
      return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const getDomain = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };

  const fetchLinkMetadata = async (url: string): Promise<LinkMetadata | null> => {
    try {
      // In a real implementation, you'd use a service like:
      // - Your own backend endpoint that fetches metadata
      // - A service like Microlink API, LinkPreview API, etc.
      // For now, we'll simulate this with basic URL parsing and placeholder data
      
      const domain = getDomain(url);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, return mock metadata based on domain
      const mockMetadata: LinkMetadata = {
        url: url,
        title: getPlaceholderTitle(domain),
        description: getPlaceholderDescription(domain),
        image: getPlaceholderImage(domain),
        domain: domain
      };

      return mockMetadata;
    } catch (error) {
      console.error('Error fetching link metadata:', error);
      return null;
    }
  };

  const getPlaceholderTitle = (domain: string): string => {
    const titles: Record<string, string> = {
      'github.com': 'GitHub Repository',
      'youtube.com': 'YouTube Video',
      'medium.com': 'Medium Article',
      'dev.to': 'Dev.to Post',
      'stackoverflow.com': 'Stack Overflow Question',
      'twitter.com': 'Twitter Post',
      'linkedin.com': 'LinkedIn Article',
      'google.com': 'Google Search',
      'wikipedia.org': 'Wikipedia Article'
    };
    return titles[domain] || `Content from ${domain}`;
  };

  const getPlaceholderDescription = (domain: string): string => {
    const descriptions: Record<string, string> = {
      'github.com': 'A repository on GitHub with code, documentation, and collaboration features.',
      'youtube.com': 'Watch videos, music, tutorials, and more on the world\'s largest video platform.',
      'medium.com': 'Read and discover stories from writers on any topic that matters to you.',
      'dev.to': 'A community of software developers getting together to help one another out.',
      'stackoverflow.com': 'Get answers to programming questions and help other developers.',
      'twitter.com': 'See what\'s happening in the world right now on Twitter.',
      'linkedin.com': 'Professional networking and career content on LinkedIn.',
      'google.com': 'Search the world\'s information and find relevant results.',
      'wikipedia.org': 'Free encyclopedia with articles on virtually every topic.'
    };
    return descriptions[domain] || `Discover content and information from ${domain}.`;
  };

  const getPlaceholderImage = (domain: string): string => {
    // Return placeholder images for different domains
    const images: Record<string, string> = {
      'github.com': 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
      'youtube.com': 'https://www.youtube.com/img/desktop/yt_1200.png',
      'medium.com': 'https://miro.medium.com/v2/resize:fit:1200/1*jfdwtvU6V6g99q3G7gq7dQ.png',
      'dev.to': 'https://dev-to-uploads.s3.amazonaws.com/uploads/logos/original_logo_0DliJcfsTcciZen38gX9.png'
    };
    return images[domain] || `https://via.placeholder.com/400x200?text=${encodeURIComponent(domain)}`;
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive"
      });
      return;
    }

    // Add protocol if missing
    let normalizedUrl = linkUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    if (!isValidUrl(normalizedUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., https://example.com)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const metadata = await fetchLinkMetadata(normalizedUrl);
      
      if (metadata) {
        onLinkAdded(metadata);
        setShowInput(false);
        toast({
          title: "Link added",
          description: "Link preview has been generated"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch link preview",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process the link",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLink = () => {
    onLinkAdded(null);
    setLinkUrl('');
    setShowInput(false);
    toast({
      title: "Link removed",
      description: "Link preview has been removed"
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleAddLink();
    }
  };

  // Show link preview if we have one
  if (currentLink) {
    return (
      <Card className="border border-border bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {/* Link preview card */}
              <div className="bg-background rounded-lg border border-border overflow-hidden hover:border-primary/20 transition-all duration-200">
                {currentLink.image && (
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img
                      src={currentLink.image}
                      alt={currentLink.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm mb-1 leading-tight overflow-hidden"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          maxHeight: '2.8em'
                        }}>
                      {currentLink.title}
                    </h3>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed overflow-hidden"
                       style={{
                         display: '-webkit-box',
                         WebkitLineClamp: 2,
                         WebkitBoxOrient: 'vertical',
                         maxHeight: '2.4em'
                       }}>
                      {currentLink.description}
                    </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        {currentLink.domain}
                      </Badge>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-muted-foreground hover:text-primary"
                    >
                      <a 
                        href={currentLink.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="text-xs">Visit</span>
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {!disabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveLink}
                className="text-muted-foreground hover:text-destructive p-1 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show link input or add button
  return (
    <div className="flex items-center">
      {showInput ? (
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Enter URL (e.g., https://example.com)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled || isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleAddLink}
            disabled={disabled || isLoading || !linkUrl.trim()}
            size="sm"
            className="px-3"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              'Add'
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowInput(false);
              setLinkUrl('');
            }}
            disabled={disabled || isLoading}
            className="px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInput(true)}
          disabled={disabled}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <Link className="h-4 w-4" />
          <span className="text-sm">Add Link</span>
        </Button>
      )}
    </div>
  );
};