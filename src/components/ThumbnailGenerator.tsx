import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { thumbnailService } from '@/services/thumbnailService';
import {
  Wand2,
  Download,
  Upload,
  Palette,
  Type,
  Image as ImageIcon,
  Camera,
  Sparkles,
  Loader2,
  Check,
  X,
  RefreshCw,
  Eye,
  Zap
} from 'lucide-react';

interface ThumbnailTemplate {
  id: string;
  name: string;
  description: string;
  gradient: string;
  textColor: string;
  accent: string;
  style: 'modern' | 'gaming' | 'minimal' | 'vibrant' | 'professional';
}

interface ThumbnailGeneratorProps {
  streamTitle?: string;
  streamDescription?: string;
  creatorName?: string;
  creatorAvatar?: string;
  onThumbnailGenerated?: (thumbnailBlob: Blob, thumbnailUrl: string) => void;
  className?: string;
}

const THUMBNAIL_TEMPLATES: ThumbnailTemplate[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#ffffff',
    accent: '#4f46e5',
    style: 'modern'
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Bold and energetic for gaming content',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
    textColor: '#ffffff',
    accent: '#ff6b6b',
    style: 'gaming'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant design',
    gradient: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
    textColor: '#ffffff',
    accent: '#3498db',
    style: 'minimal'
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Colorful and eye-catching',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    textColor: '#2d3748',
    accent: '#e53e3e',
    style: 'vibrant'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Business and corporate style',
    gradient: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
    textColor: '#ffffff',
    accent: '#805ad5',
    style: 'professional'
  }
];

export const ThumbnailGenerator: React.FC<ThumbnailGeneratorProps> = ({
  streamTitle = '',
  streamDescription = '',
  creatorName = '',
  creatorAvatar,
  onThumbnailGenerated,
  className = ''
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ThumbnailTemplate>(THUMBNAIL_TEMPLATES[0]);
  const [customTitle, setCustomTitle] = useState(streamTitle);
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [fontSize, setFontSize] = useState([48]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Auto-generate thumbnail when props change
  useEffect(() => {
    if (streamTitle && !customTitle) {
      setCustomTitle(streamTitle);
      generateThumbnail();
    }
  }, [streamTitle]);

  const generateThumbnail = async () => {
    if (!canvasRef.current) return;

    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size (16:9 aspect ratio)
      canvas.width = 1280;
      canvas.height = 720;

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      
      // Parse gradient from template
      const gradientMatch = selectedTemplate.gradient.match(/linear-gradient\(.*?,\s*(.*?)\s+0%,\s*(.*?)\s+100%\)/);
      if (gradientMatch) {
        gradient.addColorStop(0, gradientMatch[1]);
        gradient.addColorStop(1, gradientMatch[2]);
      } else {
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add overlay pattern/texture based on style
      if (selectedTemplate.style === 'gaming') {
        // Add hexagon pattern
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for (let x = 0; x < canvas.width; x += 60) {
          for (let y = 0; y < canvas.height; y += 60) {
            drawHexagon(ctx, x, y, 20);
          }
        }
      } else if (selectedTemplate.style === 'modern') {
        // Add subtle grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // Add main title
      if (customTitle) {
        ctx.fillStyle = selectedTemplate.textColor;
        ctx.font = `bold ${fontSize[0]}px Inter, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add text shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Wrap text if too long
        const maxWidth = canvas.width - 100;
        const words = customTitle.split(' ');
        let line = '';
        let y = canvas.height / 2 - (customSubtitle ? 40 : 0);

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, canvas.width / 2, y);
            line = words[n] + ' ';
            y += fontSize[0] + 10;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, canvas.width / 2, y);
      }

      // Add subtitle
      if (customSubtitle) {
        ctx.fillStyle = selectedTemplate.textColor;
        ctx.font = `400 24px Inter, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(customSubtitle, canvas.width / 2, canvas.height / 2 + 80);
      }

      // Add creator info
      if (creatorName) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '20px Inter, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`by ${creatorName}`, 40, canvas.height - 40);
      }

      // Add accent elements based on style
      if (selectedTemplate.style === 'vibrant') {
        // Add colorful circles
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = `hsla(${Math.random() * 360}, 70%, 60%, 0.3)`;
          ctx.beginPath();
          ctx.arc(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 100 + 50,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }
      }

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Convert to blob and URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setGeneratedThumbnail(url);
          onThumbnailGenerated?.(blob, url);
        }
        setIsGenerating(false);
      }, 'image/png', 0.9);

    } catch (error) {
      console.error('Error generating thumbnail:', error);
      setIsGenerating(false);
    }
  };

  const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const xPos = x + size * Math.cos(angle);
      const yPos = y + size * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(xPos, yPos);
      } else {
        ctx.lineTo(xPos, yPos);
      }
    }
    ctx.closePath();
    ctx.fill();
  };

  const autoGenerateFromContent = async () => {
    setIsAutoGenerating(true);
    
    // Simple AI-like logic to suggest title and style based on content
    const title = customTitle || streamTitle;
    const description = streamDescription;
    
    // Suggest template based on keywords
    let suggestedTemplate = THUMBNAIL_TEMPLATES[0];
    
    if (title.toLowerCase().includes('gaming') || title.toLowerCase().includes('game')) {
      suggestedTemplate = THUMBNAIL_TEMPLATES[1]; // Gaming
    } else if (title.toLowerCase().includes('tutorial') || title.toLowerCase().includes('learn')) {
      suggestedTemplate = THUMBNAIL_TEMPLATES[4]; // Professional
    } else if (title.toLowerCase().includes('fun') || title.toLowerCase().includes('party')) {
      suggestedTemplate = THUMBNAIL_TEMPLATES[3]; // Vibrant
    }
    
    // Generate subtitle from description
    if (description && !customSubtitle) {
      const words = description.split(' ').slice(0, 6).join(' ');
      setCustomSubtitle(words + (description.split(' ').length > 6 ? '...' : ''));
    }
    
    setSelectedTemplate(suggestedTemplate);
    
    setTimeout(() => {
      generateThumbnail();
      setIsAutoGenerating(false);
    }, 1000);
  };

  const downloadThumbnail = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `${customTitle || 'thumbnail'}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Thumbnail Generator
          </h3>
          <p className="text-sm text-gray-600">Create eye-catching thumbnails for your stream</p>
        </div>
        
        <Button
          onClick={autoGenerateFromContent}
          disabled={isAutoGenerating || isGenerating}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isAutoGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          Auto Generate
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Template Style
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {THUMBNAIL_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      selectedTemplate.id === template.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-full h-16 rounded mb-2"
                      style={{ background: template.gradient }}
                    />
                    <div className="text-xs font-medium">{template.name}</div>
                    <div className="text-xs text-gray-500">{template.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Text Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Type className="w-4 h-4" />
                Text Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Main Title</Label>
                <Input
                  id="title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Enter your stream title..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                <Input
                  id="subtitle"
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  placeholder="Add a subtitle..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Font Size: {fontSize[0]}px</Label>
                <Slider
                  value={fontSize}
                  onValueChange={setFontSize}
                  max={72}
                  min={24}
                  step={2}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={generateThumbnail}
              disabled={isGenerating || !customTitle}
              className="flex-1"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Generate
            </Button>
            
            {generatedThumbnail && (
              <Button
                onClick={downloadThumbnail}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Preview</span>
          </div>
          
          <Card>
            <CardContent className="p-4">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                {generatedThumbnail ? (
                  <img
                    src={generatedThumbnail}
                    alt="Generated thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Preview will appear here</p>
                    </div>
                  </div>
                )}
                
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-medium">Generating...</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden canvas for generation */}
      <canvas
        ref={canvasRef}
        className="hidden"
        width={1280}
        height={720}
      />
    </div>
  );
};