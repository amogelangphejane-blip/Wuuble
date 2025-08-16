export interface FilterConfig {
  skinSmoothing: {
    enabled: boolean;
    intensity: number; // 0-100
    blurRadius: number; // 0-10
    threshold: number; // 0-255
  };
  brightness: {
    enabled: boolean;
    value: number; // -100 to 100
  };
  contrast: {
    enabled: boolean;
    value: number; // -100 to 100
  };
}

export interface FilterPreset {
  name: string;
  description: string;
  config: FilterConfig;
}

export interface FilterCategory {
  name: string;
  description: string;
  filters: string[];
}

export interface VideoFilterEvents {
  onFilteredFrame?: (canvas: HTMLCanvasElement) => void;
  onError?: (error: Error) => void;
}

export class VideoFilterService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tempCanvas: HTMLCanvasElement;
  private tempCtx: CanvasRenderingContext2D;
  private animationFrame: number | null = null;
  private isProcessing = false;
  private config: FilterConfig;
  private events: VideoFilterEvents;
  private lastFrameTime = 0;
  private targetFPS = 30;
  private frameInterval: number;

  constructor(config: FilterConfig = this.getDefaultConfig(), events: VideoFilterEvents = {}) {
    this.config = config;
    this.events = events;
    this.frameInterval = 1000 / this.targetFPS;
    
    // Create main canvas
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    
    // Create temporary canvas for processing
    this.tempCanvas = document.createElement('canvas');
    this.tempCtx = this.tempCanvas.getContext('2d')!;
    
    // Set canvas properties for better performance
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.tempCtx.imageSmoothingEnabled = true;
    this.tempCtx.imageSmoothingQuality = 'high';
  }

  private getDefaultConfig(): FilterConfig {
    return {
      skinSmoothing: {
        enabled: false,
        intensity: 50,
        blurRadius: 2,
        threshold: 150
      },
      brightness: {
        enabled: false,
        value: 0
      },
      contrast: {
        enabled: false,
        value: 0
      }
    };
  }

  public updateConfig(newConfig: Partial<FilterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public setTargetFPS(fps: number): void {
    this.targetFPS = Math.max(15, Math.min(60, fps)); // Clamp between 15-60 FPS
    this.frameInterval = 1000 / this.targetFPS;
  }

  public adjustPerformance(): void {
    // Simple performance detection based on user agent and hardware
    const isLowEndDevice = /Android.*(?:SM-G800|SM-J1|SM-G530|SM-G531|SM-G532|SM-G900|SM-G901)/i.test(navigator.userAgent) ||
                          /iPhone [3-6]/i.test(navigator.userAgent);
    
    if (isLowEndDevice) {
      this.setTargetFPS(20); // Lower FPS for low-end devices
      // Reduce filter quality for better performance
      this.updateConfig({
        skinSmoothing: {
          ...this.config.skinSmoothing,
          blurRadius: Math.min(this.config.skinSmoothing.blurRadius, 2)
        }
      });
    } else {
      this.setTargetFPS(30); // Standard FPS for better devices
    }
  }

  public getConfig(): FilterConfig {
    return { ...this.config };
  }

  public startProcessing(videoElement: HTMLVideoElement): MediaStream {
    if (this.isProcessing) {
      this.stopProcessing();
    }

    this.isProcessing = true;
    
    // Set canvas dimensions to match video
    this.canvas.width = videoElement.videoWidth || 640;
    this.canvas.height = videoElement.videoHeight || 480;
    this.tempCanvas.width = this.canvas.width;
    this.tempCanvas.height = this.canvas.height;

    const processFrame = (currentTime: number) => {
      if (!this.isProcessing) return;

      // Throttle frame processing to target FPS
      if (currentTime - this.lastFrameTime < this.frameInterval) {
        this.animationFrame = requestAnimationFrame(processFrame);
        return;
      }

      this.lastFrameTime = currentTime;

      try {
        // Only process if filters are actually enabled
        const hasActiveFilters = this.config.skinSmoothing.enabled || 
                                this.config.brightness.enabled || 
                                this.config.contrast.enabled;

        if (!hasActiveFilters) {
          // Just copy the video frame without processing
          this.ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);
        } else {
          // Draw video frame to temp canvas
          this.tempCtx.drawImage(videoElement, 0, 0, this.tempCanvas.width, this.tempCanvas.height);
          
          // Get image data for processing
          const imageData = this.tempCtx.getImageData(0, 0, this.tempCanvas.width, this.tempCanvas.height);
          
          // Apply filters
          this.applyFilters(imageData);
          
          // Put processed image data back to main canvas
          this.ctx.putImageData(imageData, 0, 0);
        }
        
        // Notify listeners
        this.events.onFilteredFrame?.(this.canvas);
        
      } catch (error) {
        console.error('Error processing video frame:', error);
        this.events.onError?.(error as Error);
      }

      this.animationFrame = requestAnimationFrame(processFrame);
    };

    processFrame(0);

    // Create and return stream from canvas
    return this.canvas.captureStream(30);
  }

  public stopProcessing(): void {
    this.isProcessing = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private applyFilters(imageData: ImageData): void {
    const { data, width, height } = imageData;

    // Apply skin smoothing filter
    if (this.config.skinSmoothing.enabled) {
      this.applySkinSmoothingFilter(data, width, height);
    }

    // Apply brightness filter
    if (this.config.brightness.enabled) {
      this.applyBrightnessFilter(data);
    }

    // Apply contrast filter
    if (this.config.contrast.enabled) {
      this.applyContrastFilter(data);
    }
  }

  private applySkinSmoothingFilter(data: Uint8ClampedArray, width: number, height: number): void {
    const { intensity, blurRadius, threshold } = this.config.skinSmoothing;
    const intensityFactor = intensity / 100;
    
    // Create a copy of the original data
    const originalData = new Uint8ClampedArray(data);
    
    // Apply selective blur based on skin tone detection
    for (let y = blurRadius; y < height - blurRadius; y++) {
      for (let x = blurRadius; x < width - blurRadius; x++) {
        const index = (y * width + x) * 4;
        const r = originalData[index];
        const g = originalData[index + 1];
        const b = originalData[index + 2];
        
        // Simple skin tone detection
        if (this.isSkinTone(r, g, b, threshold)) {
          // Apply blur to this pixel
          const blurredPixel = this.getBlurredPixel(originalData, x, y, width, height, blurRadius);
          
          // Blend original and blurred pixel based on intensity
          data[index] = Math.round(r * (1 - intensityFactor) + blurredPixel.r * intensityFactor);
          data[index + 1] = Math.round(g * (1 - intensityFactor) + blurredPixel.g * intensityFactor);
          data[index + 2] = Math.round(b * (1 - intensityFactor) + blurredPixel.b * intensityFactor);
        }
      }
    }
  }

  private isSkinTone(r: number, g: number, b: number, threshold: number): boolean {
    // Simple skin tone detection algorithm
    // Based on RGB values that typically represent skin tones
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    // Check if it's in the skin tone range
    return (
      r > 95 && g > 40 && b > 20 && // Minimum values
      max - min > 15 && // Sufficient color variation
      Math.abs(r - g) > 15 && // Red should be different from green
      r > g && r > b && // Red should be dominant
      r < threshold // Not too bright (avoid white/light areas)
    );
  }

  private getBlurredPixel(
    data: Uint8ClampedArray, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    radius: number
  ): { r: number; g: number; b: number } {
    let totalR = 0, totalG = 0, totalB = 0;
    let count = 0;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const index = (ny * width + nx) * 4;
          totalR += data[index];
          totalG += data[index + 1];
          totalB += data[index + 2];
          count++;
        }
      }
    }

    return {
      r: Math.round(totalR / count),
      g: Math.round(totalG / count),
      b: Math.round(totalB / count)
    };
  }

  private applyBrightnessFilter(data: Uint8ClampedArray): void {
    const brightness = this.config.brightness.value;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + brightness));     // Red
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness)); // Green
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness)); // Blue
    }
  }

  private applyContrastFilter(data: Uint8ClampedArray): void {
    const contrast = this.config.contrast.value;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));     // Red
      data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128)); // Green
      data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128)); // Blue
    }
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public cleanup(): void {
    this.stopProcessing();
    // Canvas cleanup is handled by garbage collection
  }

  // Filter categories
  public static getFilterCategories(): FilterCategory[] {
    return [
      {
        name: "Beauty Filters",
        description: "Enhance your appearance with skin smoothing and beauty effects",
        filters: ["skinSmoothing"]
      },
      {
        name: "Lighting & Color",
        description: "Adjust brightness, contrast, and color settings",
        filters: ["brightness", "contrast"]
      }
    ];
  }

  // Individual filter controls
  public enableFilter(filterType: keyof FilterConfig, enabled: boolean): void {
    if (this.config[filterType]) {
      this.config[filterType].enabled = enabled;
    }
  }

  public isFilterEnabled(filterType: keyof FilterConfig): boolean {
    return this.config[filterType]?.enabled || false;
  }

  public getFilterIntensity(filterType: keyof FilterConfig): number {
    if (filterType === 'skinSmoothing') {
      return this.config.skinSmoothing.intensity;
    } else if (filterType === 'brightness') {
      return this.config.brightness.value;
    } else if (filterType === 'contrast') {
      return this.config.contrast.value;
    }
    return 0;
  }

  public setFilterIntensity(filterType: keyof FilterConfig, value: number): void {
    if (filterType === 'skinSmoothing') {
      this.config.skinSmoothing.intensity = Math.max(0, Math.min(100, value));
    } else if (filterType === 'brightness') {
      this.config.brightness.value = Math.max(-100, Math.min(100, value));
    } else if (filterType === 'contrast') {
      this.config.contrast.value = Math.max(-100, Math.min(100, value));
    }
  }

  // Preset configurations
  public static getPresets(): Record<string, FilterPreset> {
    return {
      none: {
        name: "None",
        description: "No filters applied",
        config: {
          skinSmoothing: { enabled: false, intensity: 0, blurRadius: 0, threshold: 150 },
          brightness: { enabled: false, value: 0 },
          contrast: { enabled: false, value: 0 }
        }
      },
      light: {
        name: "Light",
        description: "Subtle enhancement with gentle skin smoothing",
        config: {
          skinSmoothing: { enabled: true, intensity: 30, blurRadius: 1, threshold: 180 },
          brightness: { enabled: true, value: 5 },
          contrast: { enabled: false, value: 0 }
        }
      },
      medium: {
        name: "Medium",
        description: "Balanced filtering for most users",
        config: {
          skinSmoothing: { enabled: true, intensity: 50, blurRadius: 2, threshold: 160 },
          brightness: { enabled: true, value: 10 },
          contrast: { enabled: true, value: 5 }
        }
      },
      strong: {
        name: "Strong",
        description: "Maximum enhancement for dramatic effect",
        config: {
          skinSmoothing: { enabled: true, intensity: 75, blurRadius: 3, threshold: 140 },
          brightness: { enabled: true, value: 15 },
          contrast: { enabled: true, value: 10 }
        }
      }
    };
  }

  // Get preset config for backward compatibility
  public static getPresetConfigs(): Record<string, FilterConfig> {
    const presets = this.getPresets();
    const configs: Record<string, FilterConfig> = {};
    
    Object.keys(presets).forEach(key => {
      configs[key] = presets[key].config;
    });
    
    return configs;
  }
}