import React, { useState } from 'react';
import ProductManager from './ProductManager';
import CustomerManager from './CustomerManager';
import { Product, Customer } from '../types';

interface MasterDataProps {
  products: Product[];
  onAddProduct: (name: string, price: number) => void;
  onDeleteProduct: (id: number, docId?: string) => void;
  onUpdateProduct: (id: number, name: string, price: number, docId?: string) => void;
  
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'userId'>) => void;
  onDeleteCustomer: (id: string) => void;
  onUpdateCustomer: (id: string, data: Partial<Customer>) => void;
}

const MasterData: React.FC<MasterDataProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'products' | 'customers'>('products');

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="bg-white p-1 rounded-lg shadow-sm inline-flex border border-gray-200">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'products'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'customers'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Customers
          </button>
        </div>
      </div>

      {activeTab === 'products' ? (
        <ProductManager
          products={props.products}
          onAddProduct={props.onAddProduct}
          onDeleteProduct={props.onDeleteProduct}
          onUpdateProduct={props.onUpdateProduct}
        />
      ) : (
        <CustomerManager
          customers={props.customers}
          onAddCustomer={props.onAddCustomer}
          onDeleteCustomer={props.onDeleteCustomer}
          onUpdateCustomer={props.onUpdateCustomer}
        />
      )}
    </div>
  );
};

export default MasterData;
