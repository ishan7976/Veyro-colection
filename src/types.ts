export type ProductCategory = 
  | 'Oversized T-Shirts' 
  | 'Graphic T-Shirts' 
  | 'Hoodies' 
  | 'Limited Edition Drops';

export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

export interface ProductColor {
  name: string;
  hex: string;
  imageIndex?: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
  rating: number;
  comment: string;
  title: string;
  createdAt: string;
  verifiedPurchase: boolean;
  fitFeedback?: 'Runs Small' | 'True to Size' | 'Runs Large';
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  category: ProductCategory;
  description: string;
  fabricDetails: string;
  gsm: number;
  fit: 'Oversized Boxy Fit' | 'Relaxed Fit' | 'Regular Fit' | 'Cropped Streetwear Fit';
  image_url?: string;
  images: string[];
  colors: ProductColor[];
  sizes: ProductSize[];
  inStock: boolean;
  stockQuantity?: number;
  isNewArrival?: boolean;
  isTrending?: boolean;
  isLimitedDrop?: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt: string;
  dropNumber?: string;
}

export interface CartItem {
  id: string; // unique key: productId-size-color
  product: Product;
  size: ProductSize;
  color: string;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  deliveryNotes?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role?: 'user' | 'admin';
  loyaltyPoints?: number;
  addresses?: ShippingAddress[];
  savedWishlistIds?: string[];
  createdAt?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  size: ProductSize;
  color: string;
  price: number;
  quantity: number;
}

export type OrderStatus = 
  | 'Pending'
  | 'Confirmed'
  | 'New Orders'
  | 'Processing' 
  | 'Packed'
  | 'Shipped' 
  | 'Out for Delivery' 
  | 'Delivered' 
  | 'Cancelled'
  | 'Returned';

export type CourierPartner = 'Delhivery' | 'BlueDart' | 'Shiprocket' | 'Quickink' | 'XpressBees' | 'Shadowfax' | 'DTDC';

export interface ShipmentTimelineEvent {
  title: string;
  location: string;
  timestamp: string;
  done: boolean;
}

export interface Shipment {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone?: string;
  courierPartner: CourierPartner;
  awbNumber: string;
  status: 'Manifested' | 'Picked Up' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'RTO Initiated' | 'RTO Delivered' | 'NDR Pending';
  originCity: string;
  destCity: string;
  destPincode: string;
  weightKg: number;
  shippingFee: number;
  rtoReason?: string;
  timeline: ShipmentTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  discountAmount?: number;
  minOrderValue: number;
  usageLimit: number;
  timesUsed: number;
  isActive: boolean;
  expiresAt: string;
}

export interface Order {
  id: string;
  userId?: string;
  phone?: string;
  deliveryNotes?: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingMethod: 'standard' | 'express' | 'overnight';
  subtotal: number;
  discount: number;
  promoCodeApplied?: string;
  shippingFee: number;
  tax: number;
  total: number;
  status: 'Pending' | 'New Orders' | 'Processing' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';
  paymentMethod: 'card' | 'apple_pay' | 'google_pay' | 'cod' | 'cashfree' | 'UPI' | 'upi';
  paymentStatus?: 'Paid' | 'Pending' | 'Failed' | 'Refunded' | 'PENDING_VERIFICATION' | 'PAID' | 'FAILED';
  cashfreeOrderId?: string;
  cashfreePaymentId?: string;
  upiRefNumber?: string;
  paidAt?: string;
  courierPartner?: CourierPartner;
  trackingNumber: string;
  shippingStatus?: 'Manifested' | 'Picked Up' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'RTO Initiated' | 'RTO Delivered';
  createdAt: string;
  estimatedDelivery: string;
}

export interface FilterState {
  category: string;
  minPrice: number;
  maxPrice: number;
  sizes: ProductSize[];
  searchQuery: string;
  sortBy: 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'popular';
  inStockOnly: boolean;
  limitedDropsOnly: boolean;
}

export interface Appointment {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  appointmentType: 'Personal Fitting' | 'VIP Atelier Styling' | 'Bespoke Customization' | 'Boutique Consultation';
  preferredDate: string;
  preferredTime: string;
  location: 'New York Flagship Atelier' | 'Los Angeles Showroom' | 'Virtual 1-on-1 Session' | 'Tokyo Pop-up Studio';
  notes?: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export type PageView = 
  | 'home' 
  | 'shop' 
  | 'product-detail' 
  | 'cart' 
  | 'checkout' 
  | 'about' 
  | 'contact' 
  | 'booking'
  | 'account' 
  | 'admin'
  | 'order-confirmation';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'info' | 'error';
  image?: string;
}
