
import React, { useState, useEffect } from 'react';
import { type User, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, addDoc as addFirestoreDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase';

import BillingForm from './components/BillingForm';
import Invoice from './components/Invoice';
import Auth from './components/Auth';
import BillHistory from './components/BillHistory';
import ProductManager from './components/ProductManager';
import { LogoutIcon, NewBillIcon, HistoryIcon } from './components/Icons';

import { type BillItem, type InvoiceData, type Product } from './types';
import { PRODUCTS, GST_RATE } from './constants';

type View = 'form' | 'history' | 'products';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('form');
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);

  // Load products from Firestore on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('id', 'asc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const loaded: Product[] = snap.docs.map(d => ({
            id: d.data().id,
            name: d.data().name,
            price: d.data().price,
            docId: d.id,
          }));
          setProducts(loaded);
        }
      } catch (err) {
        console.error('Failed to load products, using defaults.', err);
        setProducts(PRODUCTS);
      }
    };
    loadProducts();
  }, []);

  const handleAddProduct = async (name: string, price: number) => {
    try {
      const maxId = products.reduce((m, p) => Math.max(m, p.id), 0);
      const nextId = maxId + 1;
      const productsRef = collection(db, 'products');
      const docRef = await addFirestoreDoc(productsRef, { id: nextId, name, price });
      const newProd: Product = { id: nextId, name, price, docId: docRef.id };
      setProducts(prev => [...prev, newProd]);
    } catch (err) {
      console.error('Failed to add product', err);
      alert('Failed to add product. Please try again.');
    }
  };

  const handleDeleteProduct = async (id: number, docId?: string) => {
    try {
      if (docId) {
        await deleteDoc(doc(db, 'products', docId));
      } else {
        const toDelete = products.find(p => p.id === id && p.docId);
        if (toDelete?.docId) {
          await deleteDoc(doc(db, 'products', toDelete.docId));
        }
      }
    } catch (err) {
      console.error('Failed to delete product from Firestore', err);
      alert('Failed to delete product from database.');
      return;
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      // Reset state on auth change
      setView('form');
      setCurrentInvoice(null);
    });
    return () => unsubscribe();
  }, []);

  // Generate invoice preview without saving to database
  const handleGenerateBill = (customerName: string, customerPhone: string, billItems: BillItem[]) => {
    if (!user) {
      alert("You must be logged in to generate a bill.");
      return;
    }
    const subtotal = billItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const gstAmount = subtotal * GST_RATE;
    const grandTotal = subtotal + gstAmount;

    const invoiceBaseData = {
      invoiceNumber: `BSMOM-${Date.now()}`,
      date: new Date(),
      customerName,
      customerPhone,
      items: billItems,
      subtotal,
      gstAmount,
      grandTotal,
      userId: user.uid,
    };
    
    setCurrentInvoice(invoiceBaseData);
  };

  // Save invoice to Firestore when user prints
  const handleSaveInvoice = async (invoiceData: InvoiceData) => {
    if (!user) {
      alert("You must be logged in to save a bill.");
      return;
    }
    
    try {
      const docRef = await addDoc(collection(db, 'invoices'), {
        ...invoiceData,
        createdAt: serverTimestamp(),
      });
      setCurrentInvoice({ ...invoiceData, id: docRef.id });
      return true;
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to save the invoice. Please try again.");
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
      alert('Failed to log out.');
    }
  };

  const handleViewInvoice = (invoice: InvoiceData) => {
    setCurrentInvoice(invoice);
  };
  
  const handleBack = () => {
    setCurrentInvoice(null);
  };

  const switchView = (newView: View) => {
    setView(newView);
    setCurrentInvoice(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-amber-800 font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-amber-50/50 font-sans text-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-wrap justify-between items-center mb-8 gap-4 no-print">
            <div className="text-center sm:text-left">
              <h1 className="text-4xl sm:text-5xl font-bold text-amber-900 tracking-tight">બાપા સીતારામ મીની ઓઈલ મીલ</h1>
              <p className="text-lg text-amber-700 mt-2">બિલિંગ સિસ્ટમ</p>
            </div>
            <nav className="flex items-center gap-2 sm:gap-4 no-print">
              <button onClick={() => switchView('form')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition ${view === 'form' && !currentInvoice ? 'bg-amber-600 text-white' : 'bg-white hover:bg-amber-100'}`}><NewBillIcon /> New Bill</button>
              <button onClick={() => switchView('history')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition ${view === 'history' && !currentInvoice ? 'bg-amber-600 text-white' : 'bg-white hover:bg-amber-100'}`}><HistoryIcon /> History</button>
              <button onClick={() => switchView('products')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition ${view === 'products' && !currentInvoice ? 'bg-amber-600 text-white' : 'bg-white hover:bg-amber-100'}`}>Products</button>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-white hover:bg-red-100 text-red-600"><LogoutIcon /> Logout</button>
            </nav>
        </header>

        <main>
            {currentInvoice ? (
            <Invoice invoiceData={currentInvoice} onBack={handleBack} backButtonText={view === 'history' ? 'Back to History' : 'Create New Bill'} onSave={handleSaveInvoice} />
          ) : view === 'form' ? (
            <BillingForm products={products} onGenerateBill={handleGenerateBill} />
          ) : view === 'products' ? (
            <ProductManager products={products} onAddProduct={handleAddProduct} onDeleteProduct={handleDeleteProduct} />
          ) : (
            <BillHistory user={user} onViewInvoice={handleViewInvoice} />
          )}
        </main>
        <footer className="text-center mt-12 text-sm text-gray-500 no-print">
            <p>&copy; {new Date().getFullYear()} બાપા સીતારામ મીની ઓઈલ મીલ. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;