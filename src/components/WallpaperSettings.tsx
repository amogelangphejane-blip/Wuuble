import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Upload, 
  Check, 
  Image as ImageIcon, 
  Sparkles,
  Sunset,
  Waves,
  Mountain,
  Flower2,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WallpaperOption {
  id: string;
  name: string;
  type: 'gradient' | 'pattern' | 'image';
  preview: string;
  style: React.CSSProperties;
  icon?: React.ReactNode;
  category: 'abstract' | 'nature' | 'minimal' | 'artistic';
}

const PRESET_WALLPAPERS: WallpaperOption[] = [
  {
    id: 'aurora-gradient',
    name: 'Aurora Dreams',
    type: 'gradient',
    category: 'abstract',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    style: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    icon: <Sparkles className="h-4 w-4" />
  },
  {
    id: 'sunset-gradient',
    name: 'Sunset Vibes',
    type: 'gradient',
    category: 'nature',
    preview: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    style: { background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)' },
    icon: <Sunset className="h-4 w-4" />
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    type: 'gradient',
    category: 'nature',
    preview: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
    style: { background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)' },
    icon: <Waves className="h-4 w-4" />
  },
  {
    id: 'forest-mist',
    name: 'Forest Mist',
    type: 'gradient',
    category: 'nature',
    preview: 'linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)',
    style: { background: 'linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)' },
    icon: <Mountain className="h-4 w-4" />
  },
  {
    id: 'minimal-dots',
    name: 'Minimal Dots',
    type: 'pattern',
    category: 'minimal',
    preview: '#f8fafc',
    style: {
      backgroundColor: '#f8fafc',
      backgroundImage: `radial-gradient(circle, #e2e8f0 1px, transparent 1px)`,
      backgroundSize: '20px 20px'
    },
    icon: <Star className="h-4 w-4" />
  },
  {
    id: 'geometric-pattern',
    name: 'Geometric',
    type: 'pattern',
    category: 'artistic',
    preview: '#fafafa',
    style: {
      backgroundColor: '#fafafa',
      backgroundImage: `
        linear-gradient(45deg, #f1f5f9 25%, transparent 25%),
        linear-gradient(-45deg, #f1f5f9 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #f1f5f9 75%),
        linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)
      `,
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
    },
    icon: <Sparkles className="h-4 w-4" />
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    type: 'gradient',
    category: 'nature',
    preview: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    style: { background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    icon: <Flower2 className="h-4 w-4" />
  },
  {
    id: 'midnight-city',
    name: 'Midnight City',
    type: 'gradient',
    category: 'abstract',
    preview: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
    style: { background: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
    icon: <Star className="h-4 w-4" />
  }
];

interface WallpaperSettingsProps {
  selectedWallpaper: string;
  onWallpaperChange: (wallpaper: WallpaperOption) => void;
  customWallpapers?: WallpaperOption[];
  onCustomUpload?: (file: File) => void;
  trigger?: 'button' | 'text';
}

export const WallpaperSettings: React.FC<WallpaperSettingsProps> = ({
  selectedWallpaper,
  onWallpaperChange,
  customWallpapers = [],
  onCustomUpload,
  trigger = 'button'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);

  const categories = [
    { id: 'all', name: 'All', count: PRESET_WALLPAPERS.length + customWallpapers.length },
    { id: 'abstract', name: 'Abstract', count: PRESET_WALLPAPERS.filter(w => w.category === 'abstract').length },
    { id: 'nature', name: 'Nature', count: PRESET_WALLPAPERS.filter(w => w.category === 'nature').length },
    { id: 'minimal', name: 'Minimal', count: PRESET_WALLPAPERS.filter(w => w.category === 'minimal').length },
    { id: 'artistic', name: 'Artistic', count: PRESET_WALLPAPERS.filter(w => w.category === 'artistic').length },
  ];

  const filteredWallpapers = selectedCategory === 'all' 
    ? [...PRESET_WALLPAPERS, ...customWallpapers]
    : PRESET_WALLPAPERS.filter(w => w.category === selectedCategory);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onCustomUpload) return;

    setIsUploading(true);
    try {
      await onCustomUpload(file);
    } catch (error) {
      console.error('Failed to upload wallpaper:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger === 'text' ? (
          <div className="flex items-center gap-3 w-full px-3 py-3 cursor-pointer">
            <Palette className="h-4 w-4" />
            <span>Wallpaper</span>
          </div>
        ) : (
          <Button
            variant="outline"
            size="lg"
            className="gap-3 bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all duration-200 shadow-xl"
          >
            <Palette className="h-5 w-5" />
            Choose Wallpaper
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-black/90 backdrop-blur-md border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Palette className="h-5 w-5" />
            Choose Wallpaper
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-6 h-[60vh]">
          {/* Categories Sidebar */}
          <div className="w-48 flex-shrink-0">
            <div className="space-y-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-between text-white",
                    selectedCategory === category.id 
                      ? "bg-gradient-to-r from-indigo-500/20 to-purple-600/20 text-white border-indigo-400/30" 
                      : "hover:bg-white/10"
                  )}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="capitalize">{category.name}</span>
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Upload Custom Wallpaper */}
            {onCustomUpload && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <label className="block">
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-white border-white/20 hover:bg-white/10"
                    disabled={isUploading}
                    asChild
                  >
                    <span>
                      {isUploading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Upload Custom
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Wallpaper Grid */}
          <div className="flex-1">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 p-2">
                {filteredWallpapers.map((wallpaper) => (
                  <WallpaperPreview
                    key={wallpaper.id}
                    wallpaper={wallpaper}
                    isSelected={selectedWallpaper === wallpaper.id}
                    onSelect={() => onWallpaperChange(wallpaper)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface WallpaperPreviewProps {
  wallpaper: WallpaperOption;
  isSelected: boolean;
  onSelect: () => void;
}

const WallpaperPreview: React.FC<WallpaperPreviewProps> = ({
  wallpaper,
  isSelected,
  onSelect
}) => {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        {/* Preview */}
        <div 
          className="aspect-[4/3] rounded-lg mb-3 relative overflow-hidden border"
          style={wallpaper.style}
        >
          {/* Mock message bubbles for preview */}
          <div className="absolute inset-0 p-3 flex flex-col justify-end space-y-2">
            <div className="flex justify-end">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl rounded-br-md px-3 py-1.5 max-w-[70%] shadow-sm">
                <div className="text-xs text-gray-700">Hey there! 👋</div>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-black/10 backdrop-blur-sm rounded-2xl rounded-bl-md px-3 py-1.5 max-w-[70%]">
                <div className="text-xs text-white">Hello!</div>
              </div>
            </div>
          </div>
          
          {/* Selection indicator */}
          {isSelected && (
            <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
              <Check className="h-3 w-3" />
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {wallpaper.icon}
            <h4 className="font-medium text-sm">{wallpaper.name}</h4>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {wallpaper.type}
            </Badge>
            <Badge variant="secondary" className="text-xs capitalize">
              {wallpaper.category}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { PRESET_WALLPAPERS };