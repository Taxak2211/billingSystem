import { type Timestamp } from 'firebase/firestore';

export interface Product {
  /** Numeric product code used in the UI and bills */
  id: number;
  name: string;
  price: number;
  /** Firestore document id for this product (optional for seeded constants) */
  docId?: string;
}

export interface BillItem {
  product: Product;
  quantity: number;
  /** Unique id for this line item (used when same product appears with different rates) */
  lineId?: string;
  /** GST rate for this item (0-100, e.g., 5 for 5%, 18 for 18%) */
  gstRate?: number;
}

export interface InvoiceData {
  id?: string; // Document ID from Firestore
  invoiceNumber: string;
  date: Date;
  customerName: string;
  customerPhone: string;
  items: BillItem[];
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  userId: string;
  createdAt?: Timestamp;
}

export interface FirmDetails {
  id?: string; // Document ID from Firestore
  userId: string;
  firmName: string;
  firmNameLocal?: string; // Optional: Local language name (e.g., Gujarati)
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  logoUrl?: string; // URL to logo stored in Firebase Storage
  tagline?: string;
  taglineLocal?: string; // Optional: Local language tagline
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  // Display preferences
  displaySettings?: {
    showLogoOnHeader?: boolean;
    showLogoOnInvoice?: boolean;
    showFirmNameOnHeader?: boolean;
    showFirmNameLocalOnHeader?: boolean;
    showFirmNameOnInvoice?: boolean;
    showFirmNameLocalOnInvoice?: boolean;
    showTaglineOnHeader?: boolean;
    showTaglineLocalOnHeader?: boolean;
    showTaglineOnInvoice?: boolean;
    showTaglineLocalOnInvoice?: boolean;
    showPhoneOnInvoice?: boolean;
    showEmailOnInvoice?: boolean;
    showGstOnInvoice?: boolean;
    showAddressOnInvoice?: boolean;
    customInvoicePrefix?: string;
    customHeaderText?: string;
    customInvoiceText?: string;
  };
}