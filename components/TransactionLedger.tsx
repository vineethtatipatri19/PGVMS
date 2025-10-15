import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, SaleItem, PageContext, Customer, InventoryItem, PrintViewData } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Modal from './common/Modal';
import DateRangeModal from './common/DateRangeModal';

// A single item row in the sale form
interface SaleFormItem extends Partial<SaleItem> {
  // Use a temporary unique id for mapping in React
  tempId: number;
  inventoryLotId?: string;
  quantity?: number;
  pricePerUnit?: number;
  unit?: 'kg' | 'lot';
}

interface TransactionLedgerProps {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  customers: Customer[];
  inventory: InventoryItem[];
  context: PageContext | null;
  clearContext: () => void;
  addCrateEntryFromSale: (customerId: string, date: string, quantity: number) => void;
  showPrintReport: (data: PrintViewData) => void;
}

const TransactionLedger: React.FC<TransactionLedgerProps> = ({ transactions, setTransactions, customers, inventory, context, clearContext, addCrateEntryFromSale, showPrintReport }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // View & Filter states
  const [activeView, setActiveView] = useState<'all' | 'sales' | 'payments'>('all');
  const [filterCustomer, setFilterCustomer] = useState<string>('');
  const [filterItem, setFilterItem] = useState<string>('');


  // Form state
  const [txType, setTxType] = useState<'sale' | 'payment'>('sale');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [saleItems, setSaleItems] = useState<SaleFormItem[]>([{ tempId: Date.now(), unit: 'kg' }]);
  const [cratesIssued, setCratesIssued] = useState<number | ''>('');

  // Handle incoming context from other pages
  useEffect(() => {
    if (context?.customerId && context?.openModal) {
      openAddModal(); // Reset form fields
      setSelectedCustomerId(context.customerId);
      setIsModalOpen(true);
      clearContext(); // Consume the context
    }
  }, [context, clearContext]);


  useEffect(() => {
    if (editingTransaction) {
        setTxType(editingTransaction.type);
        setSelectedCustomerId(editingTransaction.customerId);
        setTransactionDate(new Date(editingTransaction.date).toISOString().split('T')[0]);
        if (editingTransaction.type === 'payment') {
            setPaymentAmount(editingTransaction.paymentAmount || '');
            setSaleItems([{ tempId: Date.now(), unit: 'kg' }]);
            setCratesIssued('');
        } else {
             setSaleItems(editingTransaction.items.map((item, index) => ({
                tempId: Date.now() + index,
                ...item
             })));
             setPaymentAmount('');
             // Note: Crates issued cannot be edited after the fact for simplicity
             setCratesIssued('');
        }
    }
  }, [editingTransaction]);

  const availableInventory = useMemo(() => {
    return inventory.filter(item => new Date(item.expiryDate) > new Date());
  }, [inventory]);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    // 1. Filter by Active View
    if (activeView === 'sales') {
        filtered = filtered.filter(tx => tx.type === 'sale');
    } else if (activeView === 'payments') {
        filtered = filtered.filter(tx => tx.type === 'payment');
    }

    // 2. Filter by Customer
    if (filterCustomer) {
      filtered = filtered.filter(tx => tx.customerId === filterCustomer);
    }

    // 3. Filter by Item
    if (filterItem) {
      const lowercasedFilterItem = filterItem.toLowerCase();
      filtered = filtered.filter(tx => {
        if (tx.type === 'payment') return false;
        return tx.items.some(item =>
          item.itemName.toLowerCase().includes(lowercasedFilterItem)
        );
      });
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterCustomer, filterItem, activeView]);

  const getCustomerName = (customerId: string): string => {
    return customers.find(c => c.id === customerId)?.name || 'Unknown Customer';
  };
  
  const openAddModal = () => {
      setEditingTransaction(null);
      resetFormFields();
      setIsModalOpen(true);
  }

  const openEditModal = (tx: Transaction) => {
      setEditingTransaction(tx);
      setIsModalOpen(true);
  }
  
  const resetFormFields = () => {
    setTxType('sale');
    setSelectedCustomerId('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setPaymentAmount('');
    setSaleItems([{ tempId: Date.now(), unit: 'kg' }]);
    setCratesIssued('');
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    resetFormFields();
  };

  const handleAddSaleItem = () => {
    setSaleItems([...saleItems, { tempId: Date.now(), unit: 'kg' }]);
  };

  const handleRemoveSaleItem = (tempId: number) => {
    if (saleItems.length > 1) {
      setSaleItems(saleItems.filter(item => item.tempId !== tempId));
    }
  };

  const handleSaleItemChange = (tempId: number, field: keyof SaleFormItem, value: any) => {
    setSaleItems(saleItems.map(item => item.tempId === tempId ? { ...item, [field]: value } : item));
  };
  
  const handleDelete = (transactionId: string) => {
      if (window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
          setTransactions(transactions.filter(tx => tx.id !== transactionId));
      }
  };
  
  const handleGenerateReport = (startDate: string, endDate: string) => {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);

    const periodTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date).getTime();
      return txDate >= start && txDate <= end;
    });

    // We need to resolve customer names for the business report
    const transactionsWithCustomerNames = periodTransactions.map(tx => ({
      ...tx,
      customerName: getCustomerName(tx.customerId)
    }));
    
    // Find the customer for each transaction for the report.
    const resolvedCustomers = customers.reduce((acc, customer) => {
        acc[customer.id] = customer;
        return acc;
    }, {} as {[key:string]: Customer});

    showPrintReport({
      type: 'business',
      title: 'Business Transaction Report',
      transactions: transactionsWithCustomerNames.map(tx => ({...tx, customer: resolvedCustomers[tx.customerId]})),
      startDate,
      endDate,
    });
  };

  const processAndValidateSaleItems = (): SaleItem[] | null => {
    const finalSaleItems: SaleItem[] = saleItems
        .map(item => {
            const inventoryItem = inventory.find(inv => inv.id === item.inventoryLotId);
            if (!inventoryItem || !item.quantity || !item.pricePerUnit || !item.unit) return null;
            return {
            inventoryLotId: item.inventoryLotId!,
            itemName: `${inventoryItem.name} (${inventoryItem.variant})`,
            quantity: Number(item.quantity),
            unit: item.unit,
            pricePerUnit: Number(item.pricePerUnit),
            total: Number(item.quantity) * Number(item.pricePerUnit),
            };
        })
        .filter((item): item is SaleItem => item !== null);

    if (finalSaleItems.length === 0) {
        alert('Please add at least one valid item for the sale.');
        return null;
    }
    return finalSaleItems;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
        alert('Please select a customer.');
        return;
    }

    if(editingTransaction) {
        // --- UPDATE LOGIC ---
        let updatedTx = { ...editingTransaction, customerId: selectedCustomerId, date: new Date(transactionDate).toISOString() };

        if (updatedTx.type === 'sale') {
            const finalSaleItems = processAndValidateSaleItems();
            if (!finalSaleItems) return;
            updatedTx.items = finalSaleItems;
            updatedTx.totalAmount = finalSaleItems.reduce((sum, item) => sum + item.total, 0);

        } else { // payment
            if (!paymentAmount || Number(paymentAmount) <= 0) {
                alert('Please enter a valid payment amount.');
                return;
            }
            updatedTx.paymentAmount = Number(paymentAmount);
            updatedTx.totalAmount = Number(paymentAmount);
        }
        setTransactions(transactions.map(tx => tx.id === updatedTx.id ? updatedTx : tx));

    } else {
        // --- ADD NEW LOGIC ---
        let newTransaction: Transaction;
        if (txType === 'sale') {
          const finalSaleItems = processAndValidateSaleItems();
          if (!finalSaleItems) return;
          
          const totalAmount = finalSaleItems.reduce((sum, item) => sum + item.total, 0);
          newTransaction = {
              id: `txn${Date.now()}`,
              customerId: selectedCustomerId,
              date: new Date(transactionDate).toISOString(),
              type: 'sale',
              items: finalSaleItems,
              totalAmount: totalAmount
          };

          // Also add a crate transaction if crates were issued
          if (cratesIssued && Number(cratesIssued) > 0) {
              addCrateEntryFromSale(selectedCustomerId, transactionDate, Number(cratesIssued));
          }

        } else { // payment
            if (!paymentAmount || Number(paymentAmount) <= 0) {
                alert('Please enter a valid payment amount.');
                return;
            }
            newTransaction = {
                id: `txn${Date.now()}`,
                customerId: selectedCustomerId,
                date: new Date(transactionDate).toISOString(),
                type: 'payment',
                items: [],
                paymentAmount: Number(paymentAmount),
                totalAmount: Number(paymentAmount),
            }
        }
        setTransactions([newTransaction, ...transactions]);
    }

    closeModal();
  };

  const grandTotal = useMemo(() => {
      if (txType !== 'sale') return 0;
      return saleItems.reduce((sum, item) => {
          const quantity = Number(item.quantity) || 0;
          const price = Number(item.pricePerUnit) || 0;
          return sum + (quantity * price);
      }, 0);
  }, [saleItems, txType]);

  const renderViewTabs = () => (
    <div className="flex border-b mb-6">
        {(['all', 'sales', 'payments'] as const).map(view => {
            const isActive = activeView === view;
            return (
                <button 
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={`px-4 py-2 text-sm font-medium capitalize transition-colors duration-200 ${
                        isActive 
                        ? 'border-b-2 border-blue-600 text-blue-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {view}
                </button>
            )
        })}
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Transaction Ledger</h2>
        <div className="flex gap-2">
            <Button onClick={() => setIsPrintModalOpen(true)} variant="secondary">Print Business Report</Button>
            <Button onClick={openAddModal}>Add Transaction</Button>
        </div>
      </div>
      
      {renderViewTabs()}
      
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
            <label htmlFor="filterCustomer" className="block text-sm font-medium text-gray-700">Filter by Customer</label>
            <select
                id="filterCustomer"
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
                <option value="">All Customers</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            </div>
            <div className="flex-1 w-full">
            <label htmlFor="filterItem" className="block text-sm font-medium text-gray-700">Filter by Item</label>
            <input
                type="text"
                id="filterItem"
                value={filterItem}
                onChange={(e) => setFilterItem(e.target.value)}
                placeholder="e.g., Tomatoes"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                disabled={activeView === 'payments'}
            />
            </div>
            <div className="self-end mt-2 md:mt-0">
            <Button
                variant="secondary"
                onClick={() => {
                setFilterCustomer('');
                setFilterItem('');
                }}
                className="w-full md:w-auto"
            >
                Clear Filters
            </Button>
            </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount (₹)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map(tx => (
                <tr key={tx.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getCustomerName(tx.customerId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.type === 'sale' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {tx.type === 'sale' ? tx.items.map(item => `${item.quantity} ${item.unit} ${item.itemName}`).join(', ') : 'Payment Received'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${tx.type === 'sale' ? 'text-red-600' : 'text-green-600'}`}>
                    {tx.type === 'sale' ? '+' : '-'} {tx.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditModal(tx)} className="text-blue-600 hover:text-blue-900">Edit</button>
                      <button onClick={() => handleDelete(tx.id)} className="text-red-600 hover:text-red-900 ml-4">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] flex flex-col">
          <div className="flex-grow overflow-y-auto pr-2 -mr-2">
            <div className="flex border-b mb-4">
              <button type="button" onClick={() => setTxType('sale')} disabled={!!editingTransaction} className={`px-4 py-2 text-sm font-medium ${txType === 'sale' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'} disabled:opacity-50`}>Sale</button>
              <button type="button" onClick={() => setTxType('payment')} disabled={!!editingTransaction} className={`px-4 py-2 text-sm font-medium ${txType === 'payment' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'} disabled:opacity-50`}>Payment</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="customer" className="block text-sm font-medium text-gray-700">Customer</label>
                    <select id="customer" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        <option value="" disabled>Select a customer</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" id="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
            </div>

            {txType === 'sale' ? (
              <div className="space-y-3">
                <h3 className="text-md font-medium text-gray-800 border-b pb-2">Items</h3>
                {saleItems.map((item, index) => (
                  <div key={item.tempId} className="grid grid-cols-12 gap-2 items-end p-2 bg-gray-50 rounded-md">
                    <div className="col-span-12 sm:col-span-4">
                      {index === 0 && <label className="block text-xs font-medium text-gray-600">Item</label>}
                      <select required value={item.inventoryLotId || ''} onChange={e => handleSaleItemChange(item.tempId, 'inventoryLotId', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                        <option value="" disabled>Select an item</option>
                        {availableInventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name} ({inv.variant}) - {inv.quantity} {inv.unit} left</option>)}
                      </select>
                    </div>
                     <div className="col-span-4 sm:col-span-2">
                      {index === 0 && <label className="block text-xs font-medium text-gray-600">Unit</label>}
                        <select required value={item.unit || 'kg'} onChange={e => handleSaleItemChange(item.tempId, 'unit', e.target.value as 'kg' | 'lot')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                            <option>kg</option>
                            <option>lot</option>
                        </select>
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      {index === 0 && <label className="block text-xs font-medium text-gray-600">Quantity</label>}
                      <input type="number" placeholder="Qty" required value={item.quantity || ''} onChange={e => handleSaleItemChange(item.tempId, 'quantity', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      {index === 0 && <label className="block text-xs font-medium text-gray-600">Price/Unit</label>}
                      <input type="number" placeholder="Price" required value={item.pricePerUnit || ''} onChange={e => handleSaleItemChange(item.tempId, 'pricePerUnit', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                    </div>
                    <div className="col-span-12 sm:col-span-2 flex justify-end">
                      <Button type="button" variant="danger" onClick={() => handleRemoveSaleItem(item.tempId)} className="w-full" disabled={saleItems.length <= 1}>&times;</Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="secondary" onClick={handleAddSaleItem} className="mt-2">+ Add Item</Button>
                <div className="pt-4 border-t mt-4">
                    <label htmlFor="cratesIssued" className="block text-sm font-medium text-gray-700">Number of Crates Issued</label>
                    <input type="number" id="cratesIssued" value={cratesIssued} onChange={(e) => setCratesIssued(e.target.value ? Number(e.target.value) : '')} min="0" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" disabled={!!editingTransaction} placeholder="Optional"/>
                </div>
                <div className="text-right mt-4 font-bold text-xl text-gray-800">
                    Total: ₹{grandTotal.toLocaleString()}
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700">Payment Amount (₹)</label>
                <input type="number" id="paymentAmount" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))} required min="0.01" step="0.01" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            )}
          </div>
          
          <div className="pt-4 flex justify-end border-t mt-auto">
            <Button type="submit">Save Transaction</Button>
          </div>
        </form>
      </Modal>

      <DateRangeModal 
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onConfirm={handleGenerateReport}
        title="Generate Business Report"
      />
    </div>
  );
};

export default TransactionLedger;