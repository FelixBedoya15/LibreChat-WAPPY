import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, MarketplaceProduct, ProductVariantOption } from './types';

interface AppliedCoupon {
  code: string;
  calculatedDiscount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  message?: string;
}

interface MarketplaceContextType {
  cart: CartItem[];
  addToCart: (product: MarketplaceProduct, variantOption?: ProductVariantOption, variantName?: string, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  selectedProductDetail: MarketplaceProduct | null;
  setSelectedProductDetail: (product: MarketplaceProduct | null) => void;
  appliedCoupon: AppliedCoupon | null;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  totalItems: number;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

const STORAGE_KEY = 'wappy_marketplace_cart';

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<MarketplaceProduct | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err);
    }
  }, [cart]);

  const addToCart = (
    product: MarketplaceProduct,
    variantOption?: ProductVariantOption,
    variantName?: string,
    quantity = 1
  ) => {
    const basePrice = product.hasDiscount && (product.salePrice ?? 0) > 0
      ? (product.salePrice ?? product.regularPrice)
      : product.regularPrice;

    const priceDelta = variantOption?.priceDelta || 0;
    const finalPrice = Math.max(0, basePrice + priceDelta);
    const finalRegularPrice = Math.max(0, product.regularPrice + priceDelta);

    const variantId = variantOption ? `-${variantOption.label}` : '';
    const cartItemId = `${product._id}${variantId}`;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product._id,
          title: product.title,
          slug: product.slug,
          sku: product.sku,
          price: finalPrice,
          regularPrice: finalRegularPrice,
          quantity,
          featuredImage: product.featuredImage,
          category: product.category,
          selectedVariant: variantOption
            ? {
                name: variantName || 'Opción',
                label: variantOption.label,
                priceDelta: variantOption.priceDelta,
              }
            : undefined,
        },
      ];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedCoupon ? appliedCoupon.calculatedDiscount : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <MarketplaceContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        selectedProductDetail,
        setSelectedProductDetail,
        appliedCoupon,
        setAppliedCoupon,
        subtotal,
        discountAmount,
        totalAmount,
        totalItems,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
};
