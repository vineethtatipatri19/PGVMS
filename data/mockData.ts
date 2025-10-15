import { InventoryItem, Customer, Transaction, CrateLedgerEntry } from '../types';

const today = new Date();
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const mockInventory: InventoryItem[] = [
  {
    id: 'inv001',
    name: 'Tomatoes',
    variant: 'Heirloom',
    lotNumber: 'LOTA-101',
    quantity: 50,
    unit: 'kg',
    purchaseDate: addDays(today, -5).toISOString(),
    expiryDate: addDays(today, 2).toISOString(),
  },
  {
    id: 'inv002',
    name: 'Apples',
    variant: 'Granny Smith',
    lotNumber: 'LOTB-202',
    quantity: 100,
    unit: 'lot',
    purchaseDate: addDays(today, -2).toISOString(),
    expiryDate: addDays(today, 12).toISOString(),
  },
  {
    id: 'inv003',
    name: 'Potatoes',
    variant: 'Russet',
    lotNumber: 'LOTC-303',
    quantity: 200,
    unit: 'kg',
    purchaseDate: addDays(today, -10).toISOString(),
    expiryDate: addDays(today, 20).toISOString(),
  },
  {
    id: 'inv004',
    name: 'Tomatoes',
    variant: 'Roma',
    lotNumber: 'LOTA-102',
    quantity: 75,
    unit: 'kg',
    purchaseDate: addDays(today, -1).toISOString(),
    expiryDate: addDays(today, 6).toISOString(),
  },
  {
    id: 'inv005',
    name: 'Bananas',
    variant: 'Cavendish',
    lotNumber: 'LOTD-401',
    quantity: 30,
    unit: 'lot',
    purchaseDate: addDays(today, -3).toISOString(),
    expiryDate: addDays(today, 4).toISOString(),
  },
  {
    id: 'inv006',
    name: 'Old Carrots',
    variant: 'Organic',
    lotNumber: 'LOTE-501',
    quantity: 10,
    unit: 'kg',
    purchaseDate: addDays(today, -10).toISOString(),
    expiryDate: addDays(today, -1).toISOString(),
  },
];

export const mockCustomers: Customer[] = [
  {
    id: 'cust001',
    name: 'Rajesh Kumar',
    address: '123 Main St, Delhi',
    contactNumber: '9876543210',
    photoUrl: 'https://picsum.photos/seed/rajesh/100',
    aadhaarVerified: true,
  },
  {
    id: 'cust002',
    name: 'Sunita Sharma',
    address: '456 Market Rd, Mumbai',
    contactNumber: '9876543211',
    photoUrl: 'https://picsum.photos/seed/sunita/100',
    aadhaarVerified: true,
  },
  {
    id: 'cust003',
    name: 'Amit Singh',
    address: '789 Central Ave, Bangalore',
    contactNumber: '9876543212',
    photoUrl: 'https://picsum.photos/seed/amit/100',
    aadhaarVerified: false,
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'txn001',
    customerId: 'cust001',
    date: addDays(today, -2).toISOString(),
    type: 'sale',
    items: [{ inventoryLotId: 'inv001', itemName: 'Tomatoes', quantity: 10, unit: 'kg', pricePerUnit: 40, total: 400 }],
    totalAmount: 400,
  },
   {
    id: 'txn001a',
    customerId: 'cust001',
    date: addDays(today, -3).toISOString(),
    type: 'sale',
    items: [{ inventoryLotId: 'inv003', itemName: 'Potatoes', quantity: 50, unit: 'kg', pricePerUnit: 30, total: 1500 }],
    totalAmount: 1500,
  },
  {
    id: 'txn002',
    customerId: 'cust002',
    date: addDays(today, -1).toISOString(),
    type: 'sale',
    items: [{ inventoryLotId: 'inv002', itemName: 'Apples', quantity: 2, unit: 'lot', pricePerUnit: 1200, total: 2400 }],
    totalAmount: 2400,
  },
  {
    id: 'txn003',
    customerId: 'cust001',
    date: addDays(today, -1).toISOString(),
    type: 'payment',
    items: [],
    paymentAmount: 500,
    totalAmount: 500,
  },
];

export const mockCrateLedger: CrateLedgerEntry[] = [
  {
    id: 'crate001',
    customerId: 'cust001',
    date: addDays(today, -5).toISOString(),
    cratesIssued: 10,
    cratesReturned: 0,
    balance: 10,
  },
  {
    id: 'crate002',
    customerId: 'cust002',
    date: addDays(today, -3).toISOString(),
    cratesIssued: 25,
    cratesReturned: 0,
    balance: 25,
  },
  {
    id: 'crate003',
    customerId: 'cust001',
    date: addDays(today, -1).toISOString(),
    cratesIssued: 0,
    cratesReturned: 5,
    balance: 5,
  },
];