export enum Page {
  Dashboard = 'Dashboard',
  Inventory = 'Inventory',
  Customers = 'Customers',
  Transactions = 'Transactions',
  Crates = 'Crates',
  Forecasting = 'Forecasting',
}

/**
 * High-Level Data Model Schema
 */

// Module A: Inventory Management
export interface InventoryItem {
  id: string;
  name: string;
  variant: string; // e.g., 'Grade A', 'Organic'
  lotNumber: string;
  quantity: number;
  unit: 'kg' | 'lot';
  purchaseDate: string;
  expiryDate: string;
}

export enum ItemStatus {
  Fresh,
  ExpiringSoon,
  Expired,
}

// Module B: Customer Management
export interface Customer {
  id: string;
  name: string;
  address: string;
  contactNumber: string;
  photoUrl: string;
  aadhaarVerified: boolean; // KYC Status
}

export interface CustomerWithBalance extends Customer {
  outstandingBalance: number;
}


// Module C: Transaction and Financial Ledger
export interface Transaction {
  id: string;
  customerId: string;
  date: string;
  type: 'sale' | 'payment';
  items: SaleItem[];
  paymentAmount?: number;
  totalAmount: number;
  customer?: Customer; // Enriched data for reports
}

export interface SaleItem {
  inventoryLotId: string;
  itemName: string;
  quantity: number;
  unit: 'kg' | 'lot';
  pricePerUnit: number;
  total: number;
}

// Module D: Returnable Asset Management
export interface CrateLedgerEntry {
  id: string;
  customerId: string;
  date: string;
  cratesIssued: number;
  cratesReturned: number;
  balance: number;
}

// Context for passing data between pages
export interface PageContext {
  customerId?: string;
  openModal?: boolean;
}

// Data structure for the print view
export interface PrintViewData {
  type: 'customer' | 'business';
  title: string;
  transactions: Transaction[];
  customer?: Customer;
  startDate: string;
  endDate: string;
}