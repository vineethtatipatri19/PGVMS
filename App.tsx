import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import InventoryManagement from './components/InventoryManagement';
import CustomerManagement from './components/CustomerManagement';
import TransactionLedger from './components/TransactionLedger';
import CrateManagement from './components/CrateManagement';
import Forecasting from './components/Forecasting';
import { Page, PageContext, InventoryItem, Customer, Transaction, CrateLedgerEntry, PrintViewData, CustomerWithBalance } from './types';
import { mockInventory, mockCustomers, mockTransactions, mockCrateLedger } from './data/mockData';
import PrintReport from './components/PrintReport';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [printViewData, setPrintViewData] = useState<PrintViewData | null>(null);

  // Centralized state management
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [crateLedger, setCrateLedger] = useState<CrateLedgerEntry[]>(mockCrateLedger);

  const customersWithBalance: CustomerWithBalance[] = useMemo(() => {
    const customerBalances: { [key: string]: number } = {};

    customers.forEach(c => {
      customerBalances[c.id] = 0;
    });

    transactions.forEach(tx => {
      if (!customerBalances[tx.customerId]) {
          customerBalances[tx.customerId] = 0;
      }
      if (tx.type === 'sale') {
        customerBalances[tx.customerId] += tx.totalAmount;
      } else if (tx.type === 'payment') {
        customerBalances[tx.customerId] -= (tx.paymentAmount || 0);
      }
    });

    return customers.map(customer => ({
      ...customer,
      outstandingBalance: customerBalances[customer.id] || 0,
    }));
  }, [customers, transactions]);


  const navigate = (page: Page, context: PageContext | null = null) => {
    setCurrentPage(page);
    setPageContext(context);
    setPrintViewData(null); // Close print view on navigation
  };
  
  const clearPageContext = () => {
      setPageContext(null);
  };
  
  const addCrateEntryFromSale = (customerId: string, date: string, quantity: number) => {
    const newCrateEntry: CrateLedgerEntry = {
      id: `crate${Date.now()}`,
      customerId,
      date: new Date(date).toISOString(),
      cratesIssued: quantity,
      cratesReturned: 0,
      balance: 0, // Will be recalculated in the CrateManagement component
    };
    setCrateLedger(prevLedger => [...prevLedger, newCrateEntry]);
  };

  const showPrintReport = (data: PrintViewData) => {
    setPrintViewData(data);
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.Inventory:
        return <InventoryManagement inventory={inventory} setInventory={setInventory} />;
      case Page.Customers:
        return <CustomerManagement 
                  customers={customersWithBalance} 
                  setCustomers={setCustomers} 
                  navigate={navigate} 
                  transactions={transactions}
                  showPrintReport={showPrintReport}
                />;
      case Page.Transactions:
        return <TransactionLedger 
                  transactions={transactions} 
                  setTransactions={setTransactions} 
                  customers={customers} 
                  inventory={inventory}
                  context={pageContext} 
                  clearContext={clearPageContext} 
                  addCrateEntryFromSale={addCrateEntryFromSale}
                  showPrintReport={showPrintReport}
                />;
      case Page.Crates:
        return <CrateManagement 
                  crateLedger={crateLedger} 
                  setCrateLedger={setCrateLedger} 
                  customers={customers}
                />;
      case Page.Forecasting:
        return <Forecasting />;
      case Page.Dashboard:
      default:
        return <Dashboard 
                  navigate={navigate} 
                  customers={customersWithBalance}
                  inventory={inventory}
                  crateLedger={crateLedger}
                />;
    }
  };

  if (printViewData) {
    return <PrintReport data={printViewData} onClose={() => setPrintViewData(null)} />;
  }

  return (
    <div className="flex flex-col h-screen font-sans">
      <Header activePage={currentPage} navigate={navigate} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;