/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'customer' | 'vendor' | 'admin' | 'delivery';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

export type VendorApprovalStatus = 'pending' | 'approved' | 'rejected' | 'resubmitted' | 'draft';

export interface StatusHistoryEntry {
  status: VendorApprovalStatus;
  date: string;
  remark: string;
}

export interface VendorRequest {
  id: string;
  vendorId: string;
  storeName: string;
  legalName: string;
  description: string;
  regNumber: string;
  gstNumber: string;
  businessPhone: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  businessCategory: string;
  status: VendorApprovalStatus;
  documentUrl: string; // Base64 simulated URI
  remarks: string;
  history: StatusHistoryEntry[];
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  vendorId: string;
  vendorStoreName: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  category: string;
  brand: string;
  stock: number;
  ratings: number; // Avg rating out of 5
  reviewsCount: number;
  isApproved: boolean; // Moderation approved by admin
  disabledByAdmin?: boolean; // Toggled by admin to hide/show product on marketplace
  video?: string; // Optional video path or base64 URI
  createdAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered';

export type PaymentMethod = 'upi' | 'card' | 'cod';
export type PaymentStatus = 'pending' | 'success' | 'failed';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vendorId: string;
  vendorStoreName: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  deliveryAddress: {
    fullName: string;
    phone: string;
    addressLine: string;
    district: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
  };
  shippingQrCode: string; // Base64 data url for delivery scanning
  invoiceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userInitial: string;
  rating: number;
  reviewText: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string; // Empty string or 'all' for admin notifications
  title: string;
  message: string;
  type: 'info' | 'order' | 'approval' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

export interface WishlistItem {
  productId: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface DeliveryStaff {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  vendor_id: string;
  delivery_staff_id: string | null;
  tracking_number: string;
  qr_code: string;
  shipment_status: OrderStatus;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface ShipmentLog {
  id: string;
  shipment_id: string;
  scanned_by: string;
  scanned_role: 'vendor' | 'delivery' | 'admin';
  old_status: string;
  new_status: string;
  scan_location: string;
  created_at: string;
}
