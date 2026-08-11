import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, Product, ProductSize } from '../types';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { formatPrice } from '../lib/currency';
import {
  fetchWishlistFromSupabase,
  addWishlistItemToSupabase,
  removeWishlistItemFromSupabase,
  fetchProductsFromSupabase
} from '../lib/supabase';

interface CartContextType {
  cart: CartItem[];
  wishlist: string[];
  wishlistProducts: Product[];
  isLoadingWishlist: boolean;
  wishlistError: string | null;
  isCartOpen: boolean;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (product: Product, size: ProductSize, color?: string, quantity?: number, openDrawer?: boolean) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  refetchWishlist: () => Promise<void>;
  promoCode: string | null;
  promoDiscount: number;
  promoMessage: string | null;
  applyPromoCode: (code: string) => Promise<boolean>;
  removePromoCode: () => void;
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  freeShippingGoal: number;
  freeShippingProgress: number;
  itemCount: number;
}

const FREE_SHIPPING_THRESHOLD = 9999;

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('veyro_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('veyro_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState<boolean>(false);
  const [wishlistError, setWishlistError] = useState<string | null>(null);

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('veyro_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('veyro_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Hydrate full Product objects for given wishlist product IDs
  const hydrateWishlist = useCallback(async (ids: string[]) => {
    if (!ids || ids.length === 0) {
      setWishlistProducts([]);
      setIsLoadingWishlist(false);
      setWishlistError(null);
      return;
    }

    setIsLoadingWishlist(true);
    setWishlistError(null);

    try {
      const { success, data: allProducts } = await fetchProductsFromSupabase();

      if (!success || !Array.isArray(allProducts)) {
        console.error("Products data could not be retrieved from Supabase", allProducts);
        setWishlistProducts([]);
        setIsLoadingWishlist(false);
        return;
      }

      const productMap = new Map<string, Product>();
      allProducts.forEach(p => productMap.set(p.id, p));

      const matchedProducts: Product[] = [];
      for (const id of ids) {
        let found = productMap.get(id);
        if (!found) {
          try {
            const singleRes = await fetch(`/api/products/${id}`);
            if (singleRes.ok) {
              found = await singleRes.json();
            }
          } catch {
            // ignore
          }
        }
        if (found && found.id && found.name) {
          matchedProducts.push(found);
        }
      }

      setWishlistProducts(matchedProducts);
    } catch (err: any) {
      console.error('Error hydrating wishlist products from Supabase:', err);
      setWishlistError('Unable to load saved vault items');
    } finally {
      setIsLoadingWishlist(false);
    }
  }, []);

  // Fetch / Sync wishlist with logged-in user or local storage
  const syncAndFetchWishlist = useCallback(async () => {
    setIsLoadingWishlist(true);
    setWishlistError(null);

    const userKey = user?.id || user?.email;

    if (userKey) {
      try {
        const { success, data, productIds, error } = await fetchWishlistFromSupabase(userKey);

        if (success && data && data.length > 0) {
          setWishlistProducts(data);
          const ids = data.map(p => p.id);
          setWishlist(ids);
          setIsLoadingWishlist(false);
          return;
        }

        if (success && productIds && productIds.length > 0) {
          setWishlist(productIds);
          await hydrateWishlist(productIds);
          return;
        }

        if (error) {
          console.warn('[Wishlist Sync] Supabase notice:', error);
        }
      } catch (err) {
        console.warn('[Wishlist Sync] Exception:', err);
      }
    }

    await hydrateWishlist(wishlist);
  }, [user?.id, user?.email, wishlist, hydrateWishlist]);

  useEffect(() => {
    syncAndFetchWishlist();
  }, [user?.id, user?.email]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(prev => !prev);

  const addToCart = (
    product: Product,
    size: ProductSize,
    color?: string,
    quantity: number = 1,
    openDrawer: boolean = true
  ) => {
    const selectedColor = color || (product.colors?.[0] ? product.colors[0].name : 'Standard');
    const itemId = `${product.id}-${size}-${selectedColor}`;

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.id === itemId);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      } else {
        return [...prev, { id: itemId, product, size, color: selectedColor, quantity }];
      }
    });

    addToast({
      title: 'Added to Bag',
      message: `${product.name} (${size} • ${selectedColor})`,
      type: 'success',
      image: product.images?.[0] || ''
    });

    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
    addToast({ title: 'Item Removed', message: 'Bag updated', type: 'info' });
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev =>
      prev.map(item => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    setPromoCode(null);
    setPromoDiscount(0);
    setPromoMessage(null);
  };

  const toggleWishlist = async (productId: string) => {
    if (!productId) return;
    const exists = wishlist.includes(productId);
    const userKey = user?.id || user?.email;

    if (exists) {
      const nextIds = wishlist.filter(id => id !== productId);
      setWishlist(nextIds);
      setWishlistProducts(prev => prev.filter(p => p.id !== productId));
      addToast({ title: 'Removed from Wishlist', type: 'info' });

      if (userKey) {
        removeWishlistItemFromSupabase(userKey, productId);
      }
    } else {
      const nextIds = [...wishlist, productId];
      setWishlist(nextIds);
      addToast({ title: 'Saved to Wishlist', message: 'Added to your identity vault', type: 'success' });

      if (userKey) {
        addWishlistItemToSupabase(userKey, productId);
      }

      let productToAdd = wishlistProducts.find(p => p.id === productId);
      if (!productToAdd) {
        try {
          const res = await fetch(`/api/products/${productId}`);
          if (res.ok) {
            productToAdd = await res.json();
          }
        } catch {
          // ignore
        }
      }

      if (productToAdd) {
        setWishlistProducts(prev => {
          if (prev.some(p => p.id === productId)) return prev;
          return [...prev, productToAdd!];
        });
      } else {
        hydrateWishlist(nextIds);
      }
    }
  };

  const removeFromWishlist = (productId: string) => {
    if (wishlist.includes(productId)) {
      toggleWishlist(productId);
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const applyPromoCode = async (code: string): Promise<boolean> => {
    if (!code.trim()) return false;
    const cleanCode = code.trim().toUpperCase();

    if (cleanCode === 'IDENTITY10' || cleanCode === 'VEYRO10' || cleanCode === 'VIP10') {
      const disc = Math.round(subtotal * 0.1);
      setPromoCode(cleanCode);
      setPromoDiscount(disc);
      setPromoMessage('10% VIP Discount Applied');
      addToast({ title: 'Promo Applied', message: `10% VIP Discount Applied (-${formatPrice(disc)})`, type: 'success' });
      return true;
    } else if (cleanCode === 'VEYRO20' || cleanCode === 'DROP20') {
      const disc = Math.round(subtotal * 0.2);
      setPromoCode(cleanCode);
      setPromoDiscount(disc);
      setPromoMessage('20% Drop Discount Applied');
      addToast({ title: 'Promo Applied', message: `20% Drop Discount Applied (-${formatPrice(disc)})`, type: 'success' });
      return true;
    }

    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setPromoCode(data.code);
        setPromoDiscount(data.discount || 0);
        setPromoMessage(data.message);
        addToast({ title: 'Promo Applied', message: data.message, type: 'success' });
        return true;
      } else {
        addToast({ title: 'Invalid Promo', message: data.error || 'Try code "IDENTITY10" or "VEYRO20"', type: 'error' });
        return false;
      }
    } catch {
      addToast({ title: 'Invalid Promo', message: 'Try promo code "IDENTITY10" or "VEYRO20"', type: 'error' });
      return false;
    }
  };

  const removePromoCode = () => {
    setPromoCode(null);
    setPromoDiscount(0);
    setPromoMessage(null);
    addToast({ title: 'Promo Removed', type: 'info' });
  };

  const discountTotal = promoDiscount;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 499;
  const tax = Math.round((subtotal - discountTotal) * 0.18);
  const total = Math.max(0, subtotal - discountTotal + shippingFee + tax);

  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        wishlistProducts,
        isLoadingWishlist,
        wishlistError,
        isCartOpen,
        setIsCartOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        refetchWishlist: syncAndFetchWishlist,
        promoCode,
        promoDiscount,
        promoMessage,
        applyPromoCode,
        removePromoCode,
        subtotal,
        discountTotal,
        shippingFee,
        tax,
        total,
        freeShippingGoal: FREE_SHIPPING_THRESHOLD,
        freeShippingProgress,
        itemCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
