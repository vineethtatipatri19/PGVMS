import React, { useMemo } from 'react';
import Card from './common/Card';
import { Page, CustomerWithBalance, InventoryItem, CrateLedgerEntry, ItemStatus } from '../types';
import BoxIcon from './icons/BoxIcon';
import UserIcon from './icons/UserIcon';
import ListIcon from './icons/ListIcon';
import TruckIcon from './icons/TruckIcon';
import ChartIcon from './icons/ChartIcon';

interface DashboardProps {
  navigate: (page: Page) => void;
  customers: CustomerWithBalance[];
  inventory: InventoryItem[];
  crateLedger: CrateLedgerEntry[];
}

const quickLinks = [
  { page: Page.Inventory, icon: BoxIcon, label: 'Manage Inventory', description: 'Track stock, expiry, and enforce FEFO.' },
  { page: Page.Customers, icon: UserIcon, label: 'Customer Profiles', description: 'View customer details and KYC status.' },
  { page: Page.Transactions, icon: ListIcon, label: 'Transaction Ledger', description: 'Digital Patti Book for sales and payments.' },
  { page: Page.Crates, icon: TruckIcon, label: 'Crate Management', description: 'Track returnable asset debt.' },
  { page: Page.Forecasting, icon: ChartIcon, label: 'AI Demand Forecast', description: 'Minimize waste with smart predictions.' },
];

const getStatus = (expiryDate: string): ItemStatus => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return ItemStatus.Expired;
    if (diffDays <= 3) return ItemStatus.ExpiringSoon;
    return ItemStatus.Fresh;
};


const Dashboard: React.FC<DashboardProps> = ({ navigate, customers, inventory, crateLedger }) => {

  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const itemsExpiringSoon = inventory.filter(item => getStatus(item.expiryDate) === ItemStatus.ExpiringSoon).length;
    const totalOutstanding = customers.reduce((sum, cust) => sum + cust.outstandingBalance, 0);
    const cratesDebt = crateLedger.reduce((sum, entry) => sum + entry.cratesIssued - entry.cratesReturned, 0);
    return { totalCustomers, itemsExpiringSoon, totalOutstanding, cratesDebt };
  }, [customers, inventory, crateLedger]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Welcome to your Dashboard</h2>
        <p className="mt-2 text-lg text-gray-600">Your central hub for managing perishable goods, customers, and finances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickLinks.map((link) => (
          <button 
            key={link.page} 
            onClick={() => navigate(link.page)}
            className="text-left w-full h-full"
          >
            <Card className="hover:shadow-lg hover:border-blue-500 border-2 border-transparent transition-all duration-300 h-full">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <link.icon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{link.label}</h3>
                  <p className="mt-1 text-sm text-gray-600">{link.description}</p>
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>
      
       <Card title="Quick Stats">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Total Customers</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Items Expiring Soon</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.itemsExpiringSoon}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Outstanding</p>
            <p className="text-2xl font-bold text-red-500">₹{stats.totalOutstanding.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Crates Debt</p>
            <p className="text-2xl font-bold text-gray-900">{stats.cratesDebt}</p>
          </div>
        </div>
      </Card>

    </div>
  );
};

export default Dashboard;