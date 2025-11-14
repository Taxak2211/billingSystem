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