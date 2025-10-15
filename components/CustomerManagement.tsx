import React, { useState, useEffect } from 'react';
import { Customer, Page, PageContext, Transaction, PrintViewData, CustomerWithBalance } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Modal from './common/Modal';
import DateRangeModal from './common/DateRangeModal';

interface CustomerManagementProps {
  customers: CustomerWithBalance[];
  setCustomers: (customers: Customer[]) => void;
  navigate: (page: Page, context?: PageContext) => void;
  transactions: Transaction[];
  showPrintReport: (data: PrintViewData) => void;
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({ customers, setCustomers, navigate, transactions, showPrintReport }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerForReport, setCustomerForReport] = useState<Customer | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');


  useEffect(() => {
    if (editingCustomer) {
      setName(editingCustomer.name);
      setContact(editingCustomer.contactNumber);
      setAddress(editingCustomer.address);
      setPhotoUrl(editingCustomer.photoUrl);
    }
  }, [editingCustomer]);

  const openAddModal = () => {
    setEditingCustomer(null);
    resetFormFields();
    setIsModalOpen(true);
  };
  
  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };
  
  const openPrintModal = (customer: Customer) => {
    setCustomerForReport(customer);
    setIsPrintModalOpen(true);
  };
  
  const resetFormFields = () => {
      setName('');
      setContact('');
      setAddress('');
      setPhotoUrl('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    resetFormFields();
  };

  const handleGenerateReport = (startDate: string, endDate: string) => {
    if (!customerForReport) return;
    
    const start = new Date(startDate).setHours(0,0,0,0);
    const end = new Date(endDate).setHours(23,59,59,999);

    const customerTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.date).getTime();
        return tx.customerId === customerForReport.id && txDate >= start && txDate <= end;
    });

    showPrintReport({
      type: 'customer',
      title: 'Customer Transaction Statement',
      customer: customerForReport,
      transactions: customerTransactions,
      startDate,
      endDate
    });
  };

  const handleSaveCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const allCustomers = customers.map(({outstandingBalance, ...rest}) => rest);

    if (editingCustomer) {
      // Update existing customer
      const updatedCustomer: Customer = {
        ...editingCustomer,
        name,
        address,
        contactNumber: contact,
        photoUrl: photoUrl || `https://picsum.photos/seed/${Date.now()}/100`,
      };
      setCustomers(allCustomers.map(c => c.id === editingCustomer.id ? updatedCustomer : c));

    } else {
      // Add new customer
      const newCustomer: Customer = {
        id: `cust${Date.now()}`,
        name,
        address,
        contactNumber: contact,
        photoUrl: photoUrl || `https://picsum.photos/seed/${Date.now()}/100`,
        aadhaarVerified: false,
      };
      setCustomers([newCustomer, ...allCustomers]);
    }
    
    closeModal();
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Customer Management</h2>
        <Button onClick={openAddModal}>Add New Customer</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <Card key={customer.id} className="flex flex-col">
            <div className="flex-grow">
              <div className="flex items-center space-x-4">
                <img className="w-16 h-16 rounded-full" src={customer.photoUrl} alt={customer.name} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{customer.name}</h3>
                  <p className="text-sm text-gray-500">{customer.contactNumber}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600"><strong>Address:</strong> {customer.address}</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600"><strong>Outstanding:</strong></span>
                  <span className="font-medium text-red-600">₹{customer.outstandingBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-gray-600"><strong>KYC Status:</strong></span>
                  {customer.aadhaarVerified ? (
                    <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Verified</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">Pending</span>
                  )}
                </div>
              </div>
            </div>
             <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 justify-end">
                <Button onClick={() => navigate(Page.Transactions, { customerId: customer.id, openModal: true })} >Add Txn</Button>
                <Button onClick={() => openEditModal(customer)} variant="secondary">Edit</Button>
                <Button onClick={() => openPrintModal(customer)} variant="secondary">Print Report</Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCustomer ? "Edit Customer" : "Add New Customer"}>
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" name="name" id="name" required value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">Contact Number</label>
            <input type="tel" name="contactNumber" id="contactNumber" required value={contact} onChange={e => setContact(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
            <input type="text" name="address" id="address" required value={address} onChange={e => setAddress(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
           <div>
            <label htmlFor="photoUrl" className="block text-sm font-medium text-gray-700">Photo URL (Optional)</label>
            <input type="url" name="photoUrl" id="photoUrl" placeholder="https://example.com/photo.jpg" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="submit">Save Customer</Button>
          </div>
        </form>
      </Modal>

      {customerForReport && (
        <DateRangeModal 
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          onConfirm={handleGenerateReport}
          title={`Generate Report for ${customerForReport.name}`}
        />
      )}

    </div>
  );
};

export default CustomerManagement;