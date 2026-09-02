import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, CartItem, AdminSettings } from '../types';
import { useToast } from './ToastContext';
import { getAdminSettings } from '../services/api';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  freeShippingThreshold: number;
  isFreeShipping: boolean;
  amountNeededForFreeShipping: number;
  total: number;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'aaas_cart_items';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<AdminSettings>({
    id: 'default',
    store_name: 'AaaS - Handmade Crochet',
    store_email: 'hello@aaascrochet.com',
    store_phone: '+91 98765 43210',
    fixed_shipping_fee: 99,
    free_shipping_threshold: 1499,
    enable_free_shipping: true,
    low_stock_threshold: 3,
    currency: 'INR',
    currency_symbol: '₹',
    instagram_url: 'https://instagram.com/aaas_crochet',
    is_store_open: true,
  });

  const { success, error } = useToast();

  // Load latest settings for shipping calculations
  useEffect(() => {
    getAdminSettings()
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch(() => {
        // Fallback default
      });
  }, []);

  // Save cart to local storage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to save cart:', err);
    }
  }, [items]);

  const addToCart = useCallback(
    (product: Product, quantity: number = 1) => {
      // Stock check
      if (product.stock_quantity <= 0) {
        error(`Sorry, "${product.name}" is currently out of stock.`);
        return;
      }

      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex((item) => item.product_id === product.id);

        if (existingIndex > -1) {
          const currentQty = prevItems[existingIndex].quantity;
          const newQty = currentQty + quantity;

          if (newQty > product.stock_quantity) {
            error(`Only ${product.stock_quantity} items are available in stock.`);
            return prevItems;
          }

          const updated = [...prevItems];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
          };
          success(`Updated quantity for "${product.name}" in your cart.`, {
            label: 'View Cart',
            url: '/cart',
          });
          return updated;
        } else {
          if (quantity > product.stock_quantity) {
            error(`Only ${product.stock_quantity} items are available in stock.`);
            return prevItems;
          }

          success(`"${product.name}" added to your cart ♡`, {
            label: 'View Cart',
            url: '/cart',
          });
          return [
            ...prevItems,
            {
              id: `cart-${product.id}-${Date.now()}`,
              product_id: product.id,
              product,
              quantity,
            },
          ];
        }
      });
    },
    [success, error]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.product_id === productId) {
            if (quantity > item.product.stock_quantity) {
              error(`Only ${item.product.stock_quantity} items available.`);
              return item;
            }
            return { ...item, quantity };
          }
          return item;
        })
      );
    },
    [error]
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const itemToRemove = prev.find((i) => i.product_id === productId);
        if (itemToRemove) {
          success(`Removed "${itemToRemove.product.name}" from your cart.`);
        }
        return prev.filter((item) => item.product_id !== productId);
      });
    },
    [success]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = items.reduce((acc, item) => {
    const unitPrice = item.product.sale_price ?? item.product.price;
    return acc + unitPrice * item.quantity;
  }, 0);

  const isFreeShipping =
    settings.enable_free_shipping && subtotal >= settings.free_shipping_threshold;

  const shippingFee = items.length === 0 || isFreeShipping ? 0 : settings.fixed_shipping_fee;

  const amountNeededForFreeShipping = Math.max(0, settings.free_shipping_threshold - subtotal);

  const total = subtotal + shippingFee;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        shippingFee,
        freeShippingThreshold: settings.free_shipping_threshold,
        isFreeShipping,
        amountNeededForFreeShipping,
        total,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
