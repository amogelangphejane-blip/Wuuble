import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { DigitalProduct } from '@/types/store';

interface WishlistItem {
  id: string;
  product: DigitalProduct;
  addedAt: string;
}

export const useWishlist = () => {
  const { toast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const loadWishlist = () => {
      try {
        const savedWishlist = localStorage.getItem('etsy-wishlist');
        if (savedWishlist) {
          const parsedWishlist = JSON.parse(savedWishlist);
          setWishlistItems(parsedWishlist);
        }
      } catch (error) {
        console.error('Error loading wishlist:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('etsy-wishlist', JSON.stringify(wishlistItems));
    }
  }, [wishlistItems, loading]);

  const addToWishlist = (product: DigitalProduct) => {
    const existingItem = wishlistItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      toast({
        title: "Already in favorites",
        description: `${product.title} is already in your favorites.`,
        variant: "default",
      });
      return false;
    }

    const newItem: WishlistItem = {
      id: Date.now().toString(),
      product,
      addedAt: new Date().toISOString(),
    };

    setWishlistItems(prev => [newItem, ...prev]);
    
    toast({
      title: "Added to favorites",
      description: `${product.title} has been added to your favorites.`,
    });
    
    return true;
  };

  const removeFromWishlist = (productId: string) => {
    const item = wishlistItems.find(item => item.product.id === productId);
    
    setWishlistItems(prev => prev.filter(item => item.product.id !== productId));
    
    if (item) {
      toast({
        title: "Removed from favorites",
        description: `${item.product.title} has been removed from your favorites.`,
      });
    }
    
    return true;
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.product.id === productId);
  };

  const toggleWishlist = (product: DigitalProduct) => {
    if (isInWishlist(product.id)) {
      return removeFromWishlist(product.id);
    } else {
      return addToWishlist(product);
    }
  };

  const clearWishlist = () => {
    setWishlistItems([]);
    toast({
      title: "Favorites cleared",
      description: "All items have been removed from your favorites.",
    });
  };

  const getWishlistCount = () => {
    return wishlistItems.length;
  };

  const sortWishlistByDate = (ascending: boolean = false) => {
    setWishlistItems(prev => [...prev].sort((a, b) => {
      const dateA = new Date(a.addedAt).getTime();
      const dateB = new Date(b.addedAt).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    }));
  };

  const getWishlistByCategory = (categoryId: string) => {
    return wishlistItems.filter(item => 
      item.product.category_id === categoryId
    );
  };

  return {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    clearWishlist,
    getWishlistCount,
    sortWishlistByDate,
    getWishlistByCategory,
  };
};