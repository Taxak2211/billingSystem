import React, { useState, useMemo } from 'react';
import { type Product, type BillItem } from '../types';
import { GST_RATE } from '../constants';
import { PlusIcon, TrashIcon } from './Icons';

interface BillingFormProps {
  products: Product[];
  onGenerateBill: (customerName: string, customerPhone: string, billItems: BillItem[]) => void;
}

const BillingForm: React.FC<BillingFormProps> = ({ products, onGenerateBill }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(products.length > 0 ? String(products[0].id) : '');
  const [quantity, setQuantity] = useState<number>(1);
  const [rate, setRate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Keep selected product in sync when the products list changes
  React.useEffect(() => {
    if (!products || products.length === 0) {
      setSelectedProductId('');
      return;
    }
    const exists = products.some(p => String(p.id) === selectedProductId);
    if (!exists) {
      setSelectedProductId(String(products[0].id));
    }
  }, [products]);

  const subtotal = useMemo(() => {
    return billItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [billItems]);

  const gstAmount = useMemo(() => subtotal * GST_RATE, [subtotal]);
  const grandTotal = useMemo(() => subtotal + gstAmount, [subtotal, gstAmount]);

  const handleAddItem = () => {
    if (quantity <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }
    const product = products.find(p => p.id === parseInt(selectedProductId));
    if (product) {
      const parsedRate = parseFloat(rate as string);
      const productWithRate = { ...product, price: Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : product.price };

      const existingItemIndex = billItems.findIndex(item => item.product.id === product.id && item.product.price === productWithRate.price);
      if (existingItemIndex !== -1) {
        const updatedItems = [...billItems];
        updatedItems[existingItemIndex].quantity += quantity;
        setBillItems(updatedItems);
      } else {
        const lineId = `${product.id}-${productWithRate.price}-${Date.now()}-${Math.floor(Math.random()*10000)}`;
        setBillItems([...billItems, { product: productWithRate, quantity, lineId }]);
      }
      setQuantity(1);
      setRate('');
      setError(null);
    }
  };

  const handleRemoveItem = (lineId?: string) => {
    if (!lineId) return;
    setBillItems(billItems.filter(item => item.lineId !== lineId));
  };
    
  const handleQuantityChange = (lineId: string | undefined, newQuantity: number) => {
    if (!lineId) return;
    if (newQuantity > 0) {
      setBillItems(billItems.map(item =>
        item.lineId === lineId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (billItems.length === 0) {
        setError('Please add at least one item to the bill.');
        return;
    }
    if (!customerName.trim()) {
        setError('Please enter a customer name.');
        return;
    }
    onGenerateBill(customerName, customerPhone, billItems);
  };
  
  const isFormValid = customerName.trim() !== '' && billItems.length > 0;

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg space-y-8">
      {/* Customer Details */}
      <div className="border-b border-gray-200 pb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Customer Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-600 mb-1">Customer Name</label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              placeholder="e.g. Ramesh Patel"
              required
            />
          </div>
          <div>
            <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-600 mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              placeholder="e.g. 9876543210"
            />
          </div>
        </div>
      </div>

      {/* Add Items */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">Add Products</h2>
        <div className="flex flex-wrap items-end gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-grow min-w-[200px]">
            <label htmlFor="product" className="block text-sm font-medium text-gray-600 mb-1">Product</label>
            <select
              id="product"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition bg-white"
            >
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex-grow" style={{maxWidth: '120px'}}>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-600 mb-1">Quantity</label>
            <input
              type="number"
              id="quantity"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
            />
          </div>
          <div className="flex-grow" style={{maxWidth: '140px'}}>
            <label htmlFor="rate" className="block text-sm font-medium text-gray-600 mb-1">Rate (₹)</label>
            <input
              type="number"
              id="rate"
              min="0"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="Enter rate"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
            />
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-2 px-5 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition transform hover:scale-105"
          >
            <PlusIcon />
            Add Item
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
      
      {/* Bill Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-sm font-semibold text-gray-600">Product</th>
              <th className="p-3 text-sm font-semibold text-gray-600 text-center">Quantity</th>
              <th className="p-3 text-sm font-semibold text-gray-600 text-right">Rate (₹)</th>
              <th className="p-3 text-sm font-semibold text-gray-600 text-right">Amount (₹)</th>
              <th className="p-3 text-sm font-semibold text-gray-600 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {billItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8 text-gray-500">
                  No items added yet.
                </td>
              </tr>
            ) : (
              billItems.map(item => (
                <tr key={item.lineId ?? `${item.product.id}-${item.product.price}`} className="border-b">
                  <td className="p-3 font-medium">{item.product.name}</td>
                  <td className="p-3 text-center">
                    <input 
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.lineId, parseInt(e.target.value))}
                      className="w-16 text-center border rounded py-1"
                    />
                  </td>
                  <td className="p-3 text-right">{item.product.price.toFixed(2)}</td>
                  <td className="p-3 text-right font-semibold">{(item.product.price * item.quantity).toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <button type="button" onClick={() => handleRemoveItem(item.lineId)} className="text-red-500 hover:text-red-700 p-1">
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end">
        <div className="w-full max-w-sm space-y-2 text-gray-700">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-medium">₹ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST ({GST_RATE * 100}%)</span>
            <span className="font-medium">₹ {gstAmount.toFixed(2)}</span>
          </div>
          <hr className="my-2"/>
          <div className="flex justify-between text-xl font-bold text-amber-900">
            <span>Grand Total</span>
            <span>₹ {grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      {/* Action Button */}
      <div className="pt-6 border-t border-gray-200 text-right">
        <button
          type="submit"
          disabled={!isFormValid}
          className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Generate Bill
        </button>
      </div>
    </form>
  );
};

export default BillingForm;
