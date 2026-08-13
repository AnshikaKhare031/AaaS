import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, WishlistItem } from '../types';
import { useToast } from './ToastContext';

interface WishlistContextType {
  items: WishlistItem[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'aaas_wishlist_items';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<WishlistItem[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { success } = useToast();

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to save wishlist:', err);
    }
  }, [items]);

  const isInWishlist = useCallback(
    (productId: string) => {
      return items.some((item) => item.product_id === productId);
    },
    [items]
  );

  const toggleWishlist = useCallback(
    (product: Product) => {
      setItems((prev) => {
        const exists = prev.some((item) => item.product_id === product.id);
        if (exists) {
          success(`Removed "${product.name}" from your wishlist`);
          return prev.filter((item) => item.product_id !== product.id);
        } else {
          success(`Added "${product.name}" to your wishlist ♡`);
          return [
            ...prev,
            {
              id: `wish-${product.id}-${Date.now()}`,
              product_id: product.id,
              product,
              created_at: new Date().toISOString(),
            },
          ];
        }
      });
    },
    [success]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.product_id === productId);
        if (item) {
          success(`Removed "${item.product.name}" from your wishlist`);
        }
        return prev.filter((i) => i.product_id !== productId);
      });
    },
    [success]
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        items,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
