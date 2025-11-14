import React, { useState } from 'react';
import { type Product } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface ProductManagerProps {
  products: Product[];
  onAddProduct: (name: string, price: number) => void;
  onDeleteProduct: (id: number, docId?: string) => void;
}

const ProductManager: React.FC<ProductManagerProps> = ({ products, onAddProduct, onDeleteProduct }) => {
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddProduct = () => {
    const name = newProdName.trim();
    const price = parseFloat(newProdPrice);
    if (!name) { 
      setError('Product name is required.'); 
      return; 
    }
    if (!Number.isFinite(price) || price <= 0) { 
      setError('Enter a valid price greater than 0.'); 
      return; 
    }
    onAddProduct(name, price);
    setNewProdName('');
    setNewProdPrice('');
    setError(null);
  };

  const handleDeleteProduct = (id: number, docId?: string) => {
    if (confirm('Delete this product? This will not remove it from existing bills.')) {
      onDeleteProduct(id, docId);
    }
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toString().includes(searchTerm) ||
    product.price.toString().includes(searchTerm)
  );

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg space-y-6 max-h-[80vh] flex flex-col">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-semibold text-gray-700">Product Management</h2>
        <p className="text-sm text-gray-500 mt-1">Add, edit, or remove products from your catalog</p>
      </div>

      {/* Add Product Form */}
      <div className="bg-amber-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Add New Product</h3>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[240px]">
            <label htmlFor="productName" className="block text-sm font-medium text-gray-600 mb-1">Product Name</label>
            <input
              id="productName"
              type="text"
              placeholder="e.g. Groundnut Oil - 1L Tin"
              value={newProdName}
              onChange={(e) => setNewProdName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
            />
          </div>
          <div style={{minWidth: '160px'}}>
            <label htmlFor="productPrice" className="block text-sm font-medium text-gray-600 mb-1">Price (₹)</label>
            <input
              id="productPrice"
              type="number"
              placeholder="250"
              min="0"
              step="0.01"
              value={newProdPrice}
              onChange={(e) => setNewProdPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAddProduct}
              className="flex items-center gap-2 px-5 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition"
            >
              <PlusIcon />
              Add Product
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {/* Products List */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Product List ({products.length})</h3>
        
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by product name, ID, or price..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        
        <div className="space-y-4 overflow-y-auto flex-1">
          {/* Desktop Table View - Hidden on mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-sm font-semibold text-gray-600">ID</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Product Name</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 text-right">Price (₹)</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center p-8 text-gray-500">
                      {searchTerm ? 'No matching products found.' : 'No products yet. Add your first product above.'}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-gray-600">{p.id}</td>
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-right">{p.price.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id, p.docId)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition"
                        >
                          <TrashIcon />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View - Visible only on mobile */}
          <div className="md:hidden space-y-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">
                {searchTerm ? 'No matching products found.' : 'No products yet. Add your first product above.'}
              </div>
            ) : (
              filteredProducts.map((p) => (
                <div key={p.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{p.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">ID: {p.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id, p.docId)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                    <span className="text-gray-600 text-sm">Price:</span>
                    <span className="font-bold text-lg text-amber-900">₹{p.price.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductManager;

