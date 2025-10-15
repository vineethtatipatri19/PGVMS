import React from 'react';
import { Page } from '../types';
import HomeIcon from './icons/HomeIcon';
import BoxIcon from './icons/BoxIcon';
import UserIcon from './icons/UserIcon';
import ListIcon from './icons/ListIcon';
import TruckIcon from './icons/TruckIcon';
import ChartIcon from './icons/ChartIcon';


interface HeaderProps {
  activePage: Page;
  navigate: (page: Page) => void;
}

const navItems = [
  { page: Page.Dashboard, icon: HomeIcon, label: 'Dashboard' },
  { page: Page.Inventory, icon: BoxIcon, label: 'Inventory' },
  { page: Page.Customers, icon: UserIcon, label: 'Customers' },
  { page: Page.Transactions, icon: ListIcon, label: 'Ledger' },
  { page: Page.Crates, icon: TruckIcon, label: 'Crates' },
  { page: Page.Forecasting, icon: ChartIcon, label: 'Forecasting' },
];

const Header: React.FC<HeaderProps> = ({ activePage, navigate }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <svg className="w-8 h-8 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h1 className="text-xl font-bold text-gray-800">PGVMS</h1>
        </div>
        <nav className="hidden md:flex items-center space-x-2">
          {navItems.map((item) => {
            const isActive = activePage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => navigate(item.page)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <item.icon className="w-5 h-5 mr-2" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="md:hidden">
          <select 
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={activePage}
            onChange={(e) => navigate(e.target.value as Page)}
          >
            {navItems.map(item => <option key={item.page} value={item.page}>{item.label}</option>)}
          </select>
        </div>
      </div>
    </header>
  );
};

export default Header;