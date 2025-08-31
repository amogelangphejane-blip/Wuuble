import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WallpaperOption, PRESET_WALLPAPERS } from '@/components/WallpaperSettings';

interface WallpaperContextType {
  currentWallpaper: WallpaperOption;
  setWallpaper: (wallpaper: WallpaperOption) => void;
  customWallpapers: WallpaperOption[];
  addCustomWallpaper: (file: File) => Promise<void>;
  isLoading: boolean;
}

const WallpaperContext = createContext<WallpaperContextType | undefined>(undefined);

interface WallpaperProviderProps {
  children: ReactNode;
}

export const WallpaperProvider: React.FC<WallpaperProviderProps> = ({ children }) => {
  const [currentWallpaper, setCurrentWallpaper] = useState<WallpaperOption>(PRESET_WALLPAPERS[0]);
  const [customWallpapers, setCustomWallpapers] = useState<WallpaperOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved wallpaper from localStorage on mount
  useEffect(() => {
    const savedWallpaper = localStorage.getItem('chat-wallpaper');
    if (savedWallpaper) {
      try {
        const parsed = JSON.parse(savedWallpaper);
        const wallpaper = [...PRESET_WALLPAPERS, ...customWallpapers].find(w => w.id === parsed.id);
        if (wallpaper) {
          setCurrentWallpaper(wallpaper);
        }
      } catch (error) {
        console.error('Failed to load saved wallpaper:', error);
      }
    }
  }, [customWallpapers]);

  // Load custom wallpapers from localStorage
  useEffect(() => {
    const savedCustomWallpapers = localStorage.getItem('custom-wallpapers');
    if (savedCustomWallpapers) {
      try {
        const parsed = JSON.parse(savedCustomWallpapers);
        setCustomWallpapers(parsed);
      } catch (error) {
        console.error('Failed to load custom wallpapers:', error);
      }
    }
  }, []);

  const setWallpaper = (wallpaper: WallpaperOption) => {
    setCurrentWallpaper(wallpaper);
    localStorage.setItem('chat-wallpaper', JSON.stringify({ id: wallpaper.id }));
  };

  const addCustomWallpaper = async (file: File): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Create a data URL from the file
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const customWallpaper: WallpaperOption = {
        id: `custom-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        type: 'image',
        category: 'artistic',
        preview: dataUrl,
        style: {
          backgroundImage: `url(${dataUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }
      };

      const updatedCustomWallpapers = [...customWallpapers, customWallpaper];
      setCustomWallpapers(updatedCustomWallpapers);
      
      // Save to localStorage
      localStorage.setItem('custom-wallpapers', JSON.stringify(updatedCustomWallpapers));
      
      // Automatically select the new wallpaper
      setWallpaper(customWallpaper);
    } catch (error) {
      console.error('Failed to add custom wallpaper:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WallpaperContext.Provider
      value={{
        currentWallpaper,
        setWallpaper,
        customWallpapers,
        addCustomWallpaper,
        isLoading
      }}
    >
      {children}
    </WallpaperContext.Provider>
  );
};

export const useWallpaper = (): WallpaperContextType => {
  const context = useContext(WallpaperContext);
  if (!context) {
    throw new Error('useWallpaper must be used within a WallpaperProvider');
  }
  return context;
};