import React, { useState, useMemo } from 'react';
import { InventoryItem, ItemStatus } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Modal from './common/Modal';

interface InventoryManagementProps {
  inventory: InventoryItem[];
  setInventory: (inventory: InventoryItem[]) => void;
}

const InventoryManagement: React.FC<InventoryManagementProps> = ({ inventory, setInventory }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const sortedInventory = useMemo(() => {
    return [...inventory].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [inventory]);

  const getStatus = (expiryDate: string): { status: ItemStatus, label: string, color: string, daysLeft: number } => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: ItemStatus.Expired, label: 'Expired', color: 'bg-red-200 text-red-800', daysLeft: diffDays };
    }
    if (diffDays <= 3) {
      return { status: ItemStatus.ExpiringSoon, label: 'Expiring Soon', color: 'bg-yellow-200 text-yellow-800', daysLeft: diffDays };
    }
    return { status: ItemStatus.Fresh, label: 'Fresh', color: 'bg-green-200 text-green-800', daysLeft: diffDays };
  };

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newItem: InventoryItem = {
      id: `inv${Date.now()}`,
      name: formData.get('name') as string,
      variant: formData.get('variant') as string,
      lotNumber: `LOT-${Date.now().toString().slice(-4)}`,
      quantity: Number(formData.get('quantity')),
      unit: formData.get('unit') as 'kg' | 'lot',
      purchaseDate: new Date().toISOString(),
      expiryDate: new Date(formData.get('expiryDate') as string).toISOString(),
    };
    setInventory([...inventory, newItem]);
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Inventory Management (FEFO)</h2>
        <Button onClick={() => setIsModalOpen(true)}>Add New Item</Button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <Card className="shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot / Variant</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedInventory.map((item, index) => {
                  const { status, label, color, daysLeft } = getStatus(item.expiryDate);
                  const isFefo = index === 0 && status !== ItemStatus.Expired;
                  
                  return (
                    <tr key={item.id} className={`${status === ItemStatus.Expired ? 'bg-gray-100 opacity-60' : ''} ${isFefo ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.lotNumber}</div>
                        <div className="text-sm text-gray-500">{item.variant}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.quantity} {item.unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{new Date(item.expiryDate).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-500">{daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
                          {label}
                        </span>
                        {isFefo && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-200 text-blue-800">
                            Sell First
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Inventory Item">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Item Name</label>
            <input type="text" name="name" id="name" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="variant" className="block text-sm font-medium text-gray-700">Variant</label>
            <input type="text" name="variant" id="variant" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
              <input type="number" name="quantity" id="quantity" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div className="flex-1">
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
              <select name="unit" id="unit" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option>kg</option>
                <option>lot</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">Expiry Date</label>
            <input type="date" name="expiryDate" id="expiryDate" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="submit">Save Item</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryManagement;