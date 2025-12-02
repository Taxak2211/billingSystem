import React, { useState } from 'react';
import { type Customer } from '../types';
import { PlusIcon, TrashIcon, EditIcon, CheckIcon, XIcon } from './Icons';

interface CustomerManagerProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'userId'>) => void;
  onDeleteCustomer: (id: string) => void;
  onUpdateCustomer: (id: string, data: Partial<Customer>) => void;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ customers, onAddCustomer, onDeleteCustomer, onUpdateCustomer }) => {
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const handleAddCustomer = () => {
    const name = newCustomerName.trim();
    if (!name) { 
      setError('Customer name is required.'); 
      return; 
    }
    
    onAddCustomer({
      name,
      phone: newCustomerPhone.trim(),
      address: newCustomerAddress.trim(),
    });
    
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerAddress('');
    setError(null);
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm('Delete this customer?')) {
      onDeleteCustomer(id);
    }
  };

  const handleEditClick = (customer: Customer) => {
    setEditingId(customer.id);
    setEditName(customer.name);
    setEditPhone(customer.phone || '');
    setEditAddress(customer.address || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditPhone('');
    setEditAddress('');
  };

  const handleSaveEdit = (id: string) => {
    const name = editName.trim();
    if (!name) {
      alert('Customer name cannot be empty.');
      return;
    }
    
    onUpdateCustomer(id, {
      name,
      phone: editPhone.trim(),
      address: editAddress.trim(),
    });
    setEditingId(null);
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-lg space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-semibold text-gray-700">Customer Management</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your frequent buyers</p>
      </div>

      {/* Add Customer Form */}
      <div className="bg-amber-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Add New Customer</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-600 mb-1">Name *</label>
            <input
              id="customerName"
              type="text"
              placeholder="e.g. Ramesh Patel"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
            />
          </div>
          <div>
            <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
            <input
              id="customerPhone"
              type="tel"
              placeholder="e.g. 9876543210"
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-600 mb-1">Address</label>
            <input
              id="customerAddress"
              type="text"
              placeholder="City, Area"
              value={newCustomerAddress}
              onChange={(e) => setNewCustomerAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddCustomer}
          className="flex items-center gap-2 px-5 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition"
        >
          <PlusIcon />
          Add Customer
        </button>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {/* Customers List */}
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Customer List ({customers.length})</h3>
        
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-sm font-semibold text-gray-600">Name</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Phone</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Address</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center p-8 text-gray-500">
                      {searchTerm ? 'No matching customers found.' : 'No customers yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      {editingId === c.id ? (
                        <>
                          <td className="p-3">
                            <input 
                              type="text" 
                              value={editName} 
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-amber-500"
                              autoFocus
                            />
                          </td>
                          <td className="p-3">
                            <input 
                              type="text" 
                              value={editPhone} 
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-amber-500"
                            />
                          </td>
                          <td className="p-3">
                            <input 
                              type="text" 
                              value={editAddress} 
                              onChange={(e) => setEditAddress(e.target.value)}
                              className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-amber-500"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleSaveEdit(c.id)} className="text-green-600 hover:text-green-700 p-1"><CheckIcon /></button>
                              <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700 p-1"><XIcon /></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 font-medium">{c.name}</td>
                          <td className="p-3 text-gray-600">{c.phone || '-'}</td>
                          <td className="p-3 text-gray-600">{c.address || '-'}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleEditClick(c)} className="text-blue-600 hover:text-blue-700 p-1"><EditIcon /></button>
                              <button onClick={() => handleDeleteCustomer(c.id)} className="text-red-600 hover:text-red-700 p-1"><TrashIcon /></button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredCustomers.length === 0 ? (
              <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">
                {searchTerm ? 'No matching customers found.' : 'No customers yet.'}
              </div>
            ) : (
              filteredCustomers.map((c) => (
                <div key={c.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {editingId === c.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Name</label>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 border rounded" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Phone</label>
                        <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full px-3 py-2 border rounded" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Address</label>
                        <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="w-full px-3 py-2 border rounded" />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button onClick={handleCancelEdit} className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded">Cancel</button>
                        <button onClick={() => handleSaveEdit(c.id)} className="px-3 py-1 text-sm text-white bg-green-600 rounded">Save</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800">{c.name}</h3>
                        <div className="flex gap-1">
                          <button onClick={() => handleEditClick(c)} className="text-blue-600 p-1"><EditIcon /></button>
                          <button onClick={() => handleDeleteCustomer(c.id)} className="text-red-600 p-1"><TrashIcon /></button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {c.phone && <p>📞 {c.phone}</p>}
                        {c.address && <p>📍 {c.address}</p>}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerManager;
