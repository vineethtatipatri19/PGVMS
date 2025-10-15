import React, { useMemo } from 'react';
import { PrintViewData, Transaction } from '../types';
import Button from './common/Button';

interface PrintReportProps {
  data: PrintViewData;
  onClose: () => void;
}

const PrintReport: React.FC<PrintReportProps> = ({ data, onClose }) => {
  const { type, title, transactions, customer, startDate, endDate } = data;

  const summary = useMemo(() => {
    let totalSales = 0;
    let totalPayments = 0;
    transactions.forEach(tx => {
      if (tx.type === 'sale') {
        totalSales += tx.totalAmount;
      } else {
        totalPayments += tx.paymentAmount || 0;
      }
    });
    const finalBalance = totalSales - totalPayments;
    return { totalSales, totalPayments, finalBalance };
  }, [transactions]);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions]);
  
  const getCustomerName = (tx: Transaction) => {
    // For business reports, the customer object is attached to each transaction.
    return tx.customer?.name || "N/A";
  }


  return (
    <div className="bg-gray-100 min-h-screen">
      {/* FIX: Removed non-standard 'jsx' and 'global' props from the <style> tag. This syntax is for Next.js and caused a type error in this React project. */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
      
      <div className="no-print bg-white p-4 shadow-md flex justify-between items-center fixed top-0 left-0 right-0 z-50">
        <h2 className="text-xl font-bold text-gray-800">Print Preview</h2>
        <div className="space-x-2">
          <Button onClick={() => window.print()} variant="primary">Print</Button>
          <Button onClick={onClose} variant="secondary">Close</Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 mt-20">
        <header className="border-b pb-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">PGVMS</h1>
          <p className="text-gray-600">Perishable Goods Vendor Management System</p>
        </header>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
          {customer && (
            <div className="mt-2 text-gray-700">
              <p><strong>Customer:</strong> {customer.name}</p>
              <p><strong>Contact:</strong> {customer.contactNumber}</p>
              <p><strong>Address:</strong> {customer.address}</p>
            </div>
          )}
          <p className="mt-2 text-gray-600">
            <strong>Report Period:</strong> {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
          </p>
        </section>

        <section>
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Date</th>
                {type === 'business' && <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Customer</th>}
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Details</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Sale (₹)</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Payment (₹)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTransactions.map(tx => (
                <tr key={tx.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                  {type === 'business' && <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 font-medium">{getCustomerName(tx)}</td>}
                  <td className="px-4 py-2 text-sm text-gray-600 max-w-xs">
                    {tx.type === 'sale' ? tx.items.map(i => `${i.quantity} ${i.unit} ${i.itemName}`).join(', ') : 'Payment Received'}
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-gray-700">
                    {tx.type === 'sale' ? tx.totalAmount.toLocaleString('en-IN') : '-'}
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-gray-700">
                    {tx.type === 'payment' ? (tx.paymentAmount || 0).toLocaleString('en-IN') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-8 pt-4 border-t">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Summary</h3>
          <div className="grid grid-cols-2 gap-4 max-w-sm ml-auto text-right">
            <span className="font-medium text-gray-600">Total Sales:</span>
            <span className="font-semibold text-gray-800">₹{summary.totalSales.toLocaleString('en-IN')}</span>
            
            <span className="font-medium text-gray-600">Total Payments:</span>
            <span className="font-semibold text-gray-800">₹{summary.totalPayments.toLocaleString('en-IN')}</span>

            <span className="font-bold text-gray-600 border-t pt-2 mt-2">Final Balance:</span>
            <span className="font-bold text-gray-900 border-t pt-2 mt-2">₹{summary.finalBalance.toLocaleString('en-IN')}</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrintReport;