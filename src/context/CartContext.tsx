import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';

interface CartContextProps {
  cart: any[];
  wishlist: any[];
  addToCart: (productId: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productIdOrObj: any) => void;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productIdOrObj: any) => void;
  removeFromWishlist: (productIdOrObj: any) => void;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);

  // Load from local storage initially
  useEffect(() => {
    const savedCart = localStorage.getItem('omni_cart');
    const savedWishlist = localStorage.getItem('omni_wishlist');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { console.error(e); }
    }
    if (savedWishlist) {
      try { setWishlist(JSON.parse(savedWishlist)); } catch (e) { console.error(e); }
    }

    // Fetch products list on mount to resolve cart & wishlist item objects
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProductsList(data.products || []);
        }
      } catch (e) {
        console.error('Failed to preload catalog inside CartContext:', e);
      }
    };
    fetchProducts();
  }, []);

  // Sync to local storage
  const saveCartToStorage = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem('omni_cart', JSON.stringify(updatedCart));
  };

  const saveWishlistToStorage = (updatedWishlist: string[]) => {
    setWishlist(updatedWishlist);
    localStorage.setItem('omni_wishlist', JSON.stringify(updatedWishlist));
  };

  const addToCart = (productId: string, quantity = 1) => {
    const existing = cart.find(item => item.productId === productId);
    if (existing) {
      const updated = cart.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
      saveCartToStorage(updated);
    } else {
      saveCartToStorage([...cart, { productId, quantity }]);
    }
  };

  const removeFromCart = (productId: string) => {
    saveCartToStorage(cart.filter(item => item.productId !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      saveCartToStorage(
        cart.map(item => (item.productId === productId ? { ...item, quantity } : item))
      );
    }
  };

  const clearCart = () => {
    saveCartToStorage([]);
  };

  const addToWishlist = (productIdOrObj: any) => {
    const id = typeof productIdOrObj === 'string' ? productIdOrObj : productIdOrObj?.id;
    if (!id) return;
    if (!wishlist.includes(id)) {
      saveWishlistToStorage([...wishlist, id]);
    }
  };

  const removeFromWishlist = (productIdOrObj: any) => {
    const id = typeof productIdOrObj === 'string' ? productIdOrObj : productIdOrObj?.id;
    if (!id) return;
    saveWishlistToStorage(wishlist.filter(item => item !== id));
  };

  const toggleWishlist = (productIdOrObj: any) => {
    const id = typeof productIdOrObj === 'string' ? productIdOrObj : productIdOrObj?.id;
    if (!id) return;
    if (wishlist.includes(id)) {
      saveWishlistToStorage(wishlist.filter(item => item !== id));
    } else {
      saveWishlistToStorage([...wishlist, id]);
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Map the raw lists to complete objects for easy rendering
  const resolvedCart = cart.map(item => {
    const prod = productsList.find(p => p.id === item.productId);
    return {
      id: item.productId, // Align with key usages
      productId: item.productId,
      quantity: item.quantity,
      name: prod?.name || 'Loading Product...',
      price: prod?.price || 0,
      imageUrl: prod?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
      brand: prod?.brand || 'Premium Tenant'
    };
  });

  const resolvedWishlist = wishlist.map(id => {
    const prod = productsList.find(p => p.id === id);
    return {
      id: id,
      name: prod?.name || 'Loading Wishlist...',
      price: prod?.price || 0,
      category: prod?.category || 'featured',
      brand: prod?.brand || 'Omni Bazaar',
      description: prod?.description || '',
      images: prod?.images && prod.images.length ? prod.images : [prod?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'],
      video: prod?.video || '',
      imageUrl: prod?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'
    };
  });

  return (
    <CartContext.Provider
      value={{
        cart: resolvedCart,
        wishlist: resolvedWishlist,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
