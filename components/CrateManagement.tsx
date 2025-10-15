import React, { useState, useMemo, useEffect } from 'react';
import { CrateLedgerEntry, Customer } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Modal from './common/Modal';

interface CrateManagementProps {
    crateLedger: CrateLedgerEntry[];
    setCrateLedger: (ledger: CrateLedgerEntry[]) => void;
    customers: Customer[];
}

type CrateView = 'all' | 'issued' | 'returned';

const CrateManagement: React.FC<CrateManagementProps> = ({ crateLedger, setCrateLedger, customers }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'issue' | 'return'>('issue');
    const [editingEntry, setEditingEntry] = useState<CrateLedgerEntry | null>(null);
    const [activeView, setActiveView] = useState<CrateView>('all');

    // Form state
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [crateQuantity, setCrateQuantity] = useState<number | ''>('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (editingEntry) {
            setModalType(editingEntry.cratesIssued > 0 ? 'issue' : 'return');
            setSelectedCustomerId(editingEntry.customerId);
            setCrateQuantity(editingEntry.cratesIssued > 0 ? editingEntry.cratesIssued : editingEntry.cratesReturned);
            setTransactionDate(new Date(editingEntry.date).toISOString().split('T')[0]);
        }
    }, [editingEntry]);

    const getCustomerName = (customerId: string) => {
        return customers.find(c => c.id === customerId)?.name || 'Unknown Customer';
    };

    const customerCrateSummary = useMemo(() => {
        return customers.map(customer => {
            const entries = crateLedger.filter(entry => entry.customerId === customer.id);
            const totalIssued = entries.reduce((sum, entry) => sum + entry.cratesIssued, 0);
            const totalReturned = entries.reduce((sum, entry) => sum + entry.cratesReturned, 0);
            const balance = totalIssued - totalReturned;
            return { customer, balance };
        });
    }, [crateLedger, customers]);
    
    const processedLedger = useMemo(() => {
        const customerBalances: { [key: string]: number } = {};
        
        const baseLedger = [...crateLedger].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const ledgerWithBalance = baseLedger.map(entry => {
            const customerId = entry.customerId;
            const lastBalance = customerBalances[customerId] || 0;
            const currentBalance = lastBalance + entry.cratesIssued - entry.cratesReturned;
            customerBalances[customerId] = currentBalance;
            return { ...entry, balance: currentBalance };
        });

        const filtered = ledgerWithBalance.filter(entry => {
            if (activeView === 'issued') return entry.cratesIssued > 0;
            if (activeView === 'returned') return entry.cratesReturned > 0;
            return true;
        });

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [crateLedger, activeView]);

    const openModal = (type: 'issue' | 'return') => {
        setEditingEntry(null);
        resetFormFields();
        setModalType(type);
        setIsModalOpen(true);
    };

    const openEditModal = (entry: CrateLedgerEntry) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };

    const resetFormFields = () => {
        setSelectedCustomerId('');
        setCrateQuantity('');
        setTransactionDate(new Date().toISOString().split('T')[0]);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEntry(null);
        resetFormFields();
    };

    const handleDelete = (entryId: string) => {
        if(window.confirm('Are you sure you want to delete this crate entry?')) {
            setCrateLedger(crateLedger.filter(entry => entry.id !== entryId));
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomerId || !crateQuantity || Number(crateQuantity) <= 0) {
            alert('Please select a customer and enter a valid quantity.');
            return;
        }

        if (editingEntry) {
            const updatedEntry = {
                ...editingEntry,
                customerId: selectedCustomerId,
                date: new Date(transactionDate).toISOString(),
                cratesIssued: modalType === 'issue' ? Number(crateQuantity) : 0,
                cratesReturned: modalType === 'return' ? Number(crateQuantity) : 0,
            };
            setCrateLedger(crateLedger.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry));

        } else {
             const newEntry: CrateLedgerEntry = {
                id: `crate${Date.now()}`,
                customerId: selectedCustomerId,
                date: new Date(transactionDate).toISOString(),
                cratesIssued: modalType === 'issue' ? Number(crateQuantity) : 0,
                cratesReturned: modalType === 'return' ? Number(crateQuantity) : 0,
                balance: 0, 
            };
            setCrateLedger([...crateLedger, newEntry]);
        }
        
        closeModal();
    };

    const renderViewTabs = () => (
      <div className="flex border-b mb-4">
        {(['all', 'issued', 'returned'] as CrateView[]).map(view => {
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
          );
        })}
      </div>
    );

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Crate Management</h2>
            <div className="space-x-2">
                <Button onClick={() => openModal('issue')} variant="primary">Issue Crates</Button>
                <Button onClick={() => openModal('return')} variant="secondary">Return Crates</Button>
            </div>
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {customerCrateSummary.map(({ customer, balance }) => (
            <Card key={customer.id}>
                <h3 className="font-semibold text-gray-800">{customer.name}</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{balance}</p>
                <p className="text-sm text-gray-500">Crates Outstanding</p>
            </Card>
        ))}
      </div>

      <h3 className="text-2xl font-bold text-gray-800 mb-4">Crate Ledger</h3>
      <Card>
        {renderViewTabs()}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Issued</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Returned</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedLedger.map(entry => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getCustomerName(entry.customerId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-semibold">{entry.cratesIssued > 0 ? `+${entry.cratesIssued}` : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-semibold">{entry.cratesReturned > 0 ? `-${entry.cratesReturned}`: '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-800">{entry.balance}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditModal(entry)} className="text-blue-600 hover:text-blue-900">Edit</button>
                      <button onClick={() => handleDelete(entry.id)} className="text-red-600 hover:text-red-900 ml-4">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingEntry ? 'Edit Crate Entry' : (modalType === 'issue' ? 'Issue New Crates' : 'Record Crate Return')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="crate-customer" className="block text-sm font-medium text-gray-700">Customer</label>
                <select 
                    id="crate-customer" 
                    value={selectedCustomerId} 
                    onChange={(e) => setSelectedCustomerId(e.target.value)} 
                    required 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                    <option value="" disabled>Select a customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="crate-quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input 
                        type="number" 
                        id="crate-quantity" 
                        value={crateQuantity} 
                        onChange={(e) => setCrateQuantity(e.target.value ? Number(e.target.value) : '')} 
                        required 
                        min="1"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="crate-date" className="block text-sm font-medium text-gray-700">Date</label>
                    <input 
                        type="date" 
                        id="crate-date" 
                        value={transactionDate} 
                        onChange={(e) => setTransactionDate(e.target.value)} 
                        required 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                    />
                </div>
            </div>
             <div className="pt-4 flex justify-end">
                <Button type="submit">Save Transaction</Button>
            </div>
        </form>
      </Modal>

    </div>
  );
};

export default CrateManagement;