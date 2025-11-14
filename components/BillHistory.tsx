import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { type User } from 'firebase/auth';
import { db } from '../firebase';
import { type InvoiceData } from '../types';

interface BillHistoryProps {
  user: User;
  onViewInvoice: (invoice: InvoiceData) => void;
}

const BillHistory: React.FC<BillHistoryProps> = ({ user, onViewInvoice }) => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const q = query(
          collection(db, 'invoices'), 
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const invoicesData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id,
            ...data,
            // Convert Firestore Timestamp to JS Date
            date: data.createdAt.toDate(),
          } as InvoiceData;
        });
        setInvoices(invoicesData);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch invoice history.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user.uid]);

  if (loading) {
    return <div className="text-center p-8 bg-white rounded-2xl shadow-lg">Loading history...</div>;
  }
  
  if (error) {
    return <div className="text-center p-8 bg-red-100 text-red-700 rounded-2xl shadow-lg">{error}</div>;
  }

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter(invoice => 
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.date.toLocaleDateString('en-IN').includes(searchTerm)
  );

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg space-y-6 max-h-[80vh] flex flex-col">
      <h2 className="text-xl font-semibold text-gray-700">Invoice History</h2>
      
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search by invoice #, customer name, or date..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
      
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-sm font-semibold text-gray-600">Date</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Invoice #</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Customer</th>
              <th className="p-3 text-sm font-semibold text-gray-600 text-right">Amount (₹)</th>
              <th className="p-3 text-sm font-semibold text-gray-600 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8 text-gray-500">
                  {searchTerm ? 'No matching invoices found.' : 'No invoices found.'}
                </td>
              </tr>
            ) : (
              filteredInvoices.map(invoice => (
                <tr key={invoice.id} className="border-b hover:bg-amber-50/50">
                  <td className="p-3">{invoice.date.toLocaleDateString('en-IN')}</td>
                  <td className="p-3 font-mono text-xs">{invoice.invoiceNumber}</td>
                  <td className="p-3 font-medium">{invoice.customerName}</td>
                  <td className="p-3 text-right font-semibold">{invoice.grandTotal.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => onViewInvoice(invoice)}
                      className="px-4 py-1 bg-amber-600 text-white text-sm font-semibold rounded-md hover:bg-amber-700 transition"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillHistory;
