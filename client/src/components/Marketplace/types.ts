export type ServiceType = 
  | 'service_virtual' 
  | 'service_onsite' 
  | 'service_hybrid' 
  | 'digital_download' 
  | 'consulting_hours';

export type ProductStatus = 'published' | 'draft' | 'archived';

export interface ProductVariantOption {
  label: string;
  priceDelta: number;
  isDefault?: boolean;
}

export interface ProductVariantGroup {
  name: string;
  options: ProductVariantOption[];
}

export interface ProductFAQ {
  question: string;
  answer: string;
}

export interface MarketplaceProduct {
  _id: string;
  title: string;
  slug: string;
  sku?: string;
  shortDescription?: string;
  description?: string;
  category: string;
  tags?: string[];
  serviceType: ServiceType;
  regularPrice: number;
  salePrice?: number;
  hasDiscount?: boolean;
  hasVariants?: boolean;
  variants?: ProductVariantGroup[];
  estimatedDeliveryDays?: string;
  deliverables?: string[];
  requirements?: string[];
  faqs?: ProductFAQ[];
  featuredImage?: string;
  gallery?: string[];
  brochureUrl?: string;
  status: ProductStatus;
  isFeatured?: boolean;
  salesCount?: number;
  rating?: number;
  reviewsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarketplaceCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  active: boolean;
}

export interface CartItem {
  id: string; // unique cart item id (e.g. productId + variant label)
  productId: string;
  title: string;
  slug: string;
  sku?: string;
  price: number;
  regularPrice: number;
  quantity: number;
  featuredImage?: string;
  category: string;
  selectedVariant?: {
    name: string;
    label: string;
    priceDelta: number;
  };
}

export interface CustomerData {
  fullName: string;
  companyName?: string;
  documentId: string;
  email: string;
  phone: string;
  city?: string;
  address?: string;
  notes?: string;
}

export type PaymentMethod = 'WOMPI' | 'MANUAL_TRANSFER';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'MANUAL_REVIEW' | 'VOIDED';
export type FulfillmentStatus = 'NUEVO' | 'CONTACTADO' | 'EN_EJECUCION' | 'ENTREGADO' | 'CANCELADO';

export interface OrderItem {
  productId: string;
  title: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  selectedVariant?: {
    name: string;
    label: string;
    priceDelta: number;
  };
  subtotal: number;
}

export interface MarketplaceOrder {
  _id: string;
  orderNumber: string;
  userId?: string;
  customer: CustomerData;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  promoCode?: string;
  totalAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  wompiReference?: string;
  wompiTransactionId?: string;
  manualReceiptUrl?: string;
  fulfillmentStatus: FulfillmentStatus;
  assignedSpecialist?: string;
  serviceTimeline?: Array<{
    status: string;
    comment: string;
    updatedAt: string;
    updatedBy: string;
  }>;
  internalNotes?: Array<{
    note: string;
    author: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceCoupon {
  _id?: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  expiresAt?: string;
  maxUses?: number;
  usedCount?: number;
  active: boolean;
}
