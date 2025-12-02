
import React, { useState, useEffect } from 'react';
import { type User, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, addDoc as addFirestoreDoc, deleteDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

import BillingForm from './components/BillingForm';
import Invoice from './components/Invoice';
import Auth from './components/Auth';
import BillHistory from './components/BillHistory';
import MasterData from './components/MasterData';
import FirmSetup from './components/FirmSetup';
import { LogoutIcon, NewBillIcon, HistoryIcon, DatabaseIcon } from './components/Icons';

import { type BillItem, type InvoiceData, type Product, type FirmDetails, type Customer } from './types';
import { PRODUCTS, GST_RATE } from './constants';

type View = 'form' | 'history' | 'manage' | 'settings';

// Generate invoice prefix from firm name
const generateInvoicePrefix = (firmName?: string): string => {
  if (!firmName || firmName.trim() === '') {
    return 'INV'; // Default prefix
  }
  
  // Remove special characters and spaces, convert to uppercase
  const cleanName = firmName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Take 3-5 characters based on word count
  const words = firmName.trim().split(/\s+/);
  
  if (words.length === 1) {
    // Single word: take first 3-4 characters
    return cleanName.substring(0, Math.min(4, cleanName.length)) || 'INV';
  } else if (words.length === 2) {
    // Two words: take 2-3 chars from each
    const word1 = words[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const word2 = words[1].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return (word1.substring(0, 2) + word2.substring(0, 2)) || 'INV';
  } else {
    // Multiple words: take first letter of first 3-5 words
    return words.slice(0, Math.min(5, words.length))
      .map(w => w.replace(/[^a-zA-Z0-9]/g, '')[0])
      .filter(c => c)
      .join('')
      .toUpperCase() || 'INV';
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('form');
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(null);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [firmDetails, setFirmDetails] = useState<FirmDetails | null>(null);
  const [firmLoading, setFirmLoading] = useState(true);

  // Load products and customers from Firestore when user is authenticated
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setProducts([]);
        setCustomers([]);
        return;
      }
      
      try {
        // Load Products
        const productsRef = collection(db, 'products');
        const productsQuery = query(productsRef, where('userId', '==', user.uid), orderBy('id', 'asc'));
        const productsSnap = await getDocs(productsQuery);
        if (!productsSnap.empty) {
          const loadedProducts: Product[] = productsSnap.docs.map(d => ({
            id: d.data().id,
            name: d.data().name,
            price: d.data().price,
            docId: d.id,
          }));
          setProducts(loadedProducts);
        } else {
          setProducts([]);
        }

        // Load Customers
        const customersRef = collection(db, 'customers');
        // Remove orderBy to avoid needing a composite index immediately
        const customersQuery = query(customersRef, where('userId', '==', user.uid));
        const customersSnap = await getDocs(customersQuery);
        if (!customersSnap.empty) {
          const loadedCustomers: Customer[] = customersSnap.docs.map(d => ({
            id: d.id,
            name: d.data().name,
            phone: d.data().phone,
            address: d.data().address,
            gstNumber: d.data().gstNumber,
            userId: d.data().userId,
          }));
          // Sort in memory
          loadedCustomers.sort((a, b) => a.name.localeCompare(b.name));
          setCustomers(loadedCustomers);
        } else {
          setCustomers([]);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        // Don't clear state on error to avoid flashing empty state if it's a transient error
      }
    };
    loadData();
  }, [user]);

  // Update page title and favicon when firm details change
  useEffect(() => {
    if (firmDetails) {
      // Update page title
      document.title = `${firmDetails.firmName} - Billing System`;
      
      // Update favicon if logo exists
      if (firmDetails.logoUrl) {
        const favicon = document.getElementById('favicon') as HTMLLinkElement;
        if (favicon) {
          favicon.href = firmDetails.logoUrl;
          favicon.type = 'image/png';
        }
      }
    }
  }, [firmDetails]);

  const handleAddProduct = async (name: string, price: number) => {
    if (!user) {
      alert('You must be logged in to add products.');
      return;
    }
    
    try {
      const maxId = products.reduce((m, p) => Math.max(m, p.id), 0);
      const nextId = maxId + 1;
      const productsRef = collection(db, 'products');
      const docRef = await addFirestoreDoc(productsRef, { 
        id: nextId, 
        name, 
        price,
        userId: user.uid 
      });
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

  const handleUpdateProduct = async (id: number, name: string, price: number, docId?: string) => {
    try {
      if (docId) {
        await updateDoc(doc(db, 'products', docId), { name, price });
      } else {
        // Fallback for products without docId (shouldn't happen for new products)
        const toUpdate = products.find(p => p.id === id && p.docId);
        if (toUpdate?.docId) {
          await updateDoc(doc(db, 'products', toUpdate.docId), { name, price });
        }
      }
      setProducts(prev => prev.map(p => p.id === id ? { ...p, name, price } : p));
    } catch (err) {
      console.error('Failed to update product in Firestore', err);
      alert('Failed to update product.');
    }
  };

  const handleAddCustomer = async (customer: Omit<Customer, 'id' | 'userId'>) => {
    if (!user) return;
    try {
      const customersRef = collection(db, 'customers');
      const docRef = await addDoc(customersRef, {
        ...customer,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      
      const newCustomer: Customer = {
        id: docRef.id,
        userId: user.uid,
        ...customer
      };
      
      setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Failed to add customer:', err);
      alert('Failed to add customer. Please try again.');
    }
  };

  const handleUpdateCustomer = async (id: string, data: Partial<Omit<Customer, 'id' | 'userId'>>) => {
    try {
      const customerRef = doc(db, 'customers', id);
      await updateDoc(customerRef, data);
      
      setCustomers(prev => prev.map(c => 
        c.id === id ? { ...c, ...data } : c
      ).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Failed to update customer:', err);
      alert('Failed to update customer. Please try again.');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await deleteDoc(doc(db, 'customers', id));
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete customer:', err);
      alert('Failed to delete customer. Please try again.');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
      // Load firm details if user is logged in
      if (user) {
        setFirmLoading(true);
        try {
          const firmDocRef = doc(db, 'firmDetails', user.uid);
          const firmDoc = await getDoc(firmDocRef);
          if (firmDoc.exists()) {
            setFirmDetails({ id: firmDoc.id, ...firmDoc.data() } as FirmDetails);
          } else {
            setFirmDetails(null);
          }
        } catch (err) {
          console.error('Failed to load firm details:', err);
          setFirmDetails(null);
        } finally {
          setFirmLoading(false);
        }
      } else {
        setFirmDetails(null);
        setFirmLoading(false);
      }
      
      // Reset state on auth change
      setView('form');
      setCurrentInvoice(null);
    });
    return () => unsubscribe();
  }, []);

  // Generate invoice preview without saving to database
  const handleGenerateBill = (customerName: string, customerPhone: string, billItems: BillItem[], billDate: Date) => {
    if (!user) {
      alert("You must be logged in to generate a bill.");
      return;
    }
    const subtotal = billItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    
    // Calculate GST based on per-item rates
    const gstAmount = billItems.reduce((acc, item) => {
      const itemTotal = item.product.price * item.quantity;
      const itemGstRate = (item.gstRate ?? GST_RATE * 100) / 100;
      return acc + (itemTotal * itemGstRate);
    }, 0);
    
    const grandTotal = subtotal + gstAmount;

    let invoiceNumber = '';
    
    if (editingInvoice) {
      // Keep existing invoice number if editing
      invoiceNumber = editingInvoice.invoiceNumber;
    } else if (firmDetails?.invoiceFormat?.type === 'sequential') {
      // Calculate next number: current + 1, or startNumber if no current
      const nextNum = (firmDetails.invoiceFormat.currentNumber ?? (firmDetails.invoiceFormat.startNumber || 1) - 1) + 1;
      const prefix = firmDetails.displaySettings?.customInvoicePrefix;
      invoiceNumber = prefix ? `${prefix}-${nextNum}` : `${nextNum}`;
    } else {
      // Use custom prefix if set, otherwise generate from firm name
      const invoicePrefix = firmDetails?.displaySettings?.customInvoicePrefix || 
                            generateInvoicePrefix(firmDetails?.firmName);
      invoiceNumber = `${invoicePrefix}-${Date.now()}`;
    }

    const invoiceBaseData: InvoiceData = {
      invoiceNumber,
      date: billDate,
      customerName,
      customerPhone,
      items: billItems,
      subtotal,
      gstAmount,
      grandTotal,
      userId: user.uid,
      // Preserve ID if editing
      ...(editingInvoice?.id ? { id: editingInvoice.id } : {})
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
      // Prepare data for Firestore - convert Date to Timestamp
      const { date, id, ...invoiceDataToSave } = invoiceData;
      
      // Helper to remove undefined values which Firestore rejects
      const sanitize = (obj: any): any => {
        return JSON.parse(JSON.stringify(obj, (key, value) => {
          return value === undefined ? null : value;
        }));
      };

      // We need to preserve the Date object because JSON.stringify converts it to string
      // But we want Firestore to handle it (or convert to Timestamp)
      // So we sanitize items specifically or use a better deep clone that handles Date
      
      const sanitizedItems = invoiceDataToSave.items.map(item => {
        const { product, lineId, gstRate, ...restItem } = item;
        const { docId, ...restProduct } = product;
        // Reconstruct without undefined
        const cleanProduct = { ...restProduct, ...(docId ? { docId } : {}) };
        const cleanItem = { 
          ...restItem, 
          product: cleanProduct,
          ...(lineId ? { lineId } : {}),
          ...(gstRate !== undefined ? { gstRate } : {})
        };
        return cleanItem;
      });

      const finalDataToSave = {
        ...invoiceDataToSave,
        items: sanitizedItems,
        date: invoiceData.date, // Keep as Date object
      };

      let savedId = id;

      if (id) {
        // Update existing invoice
        const invoiceRef = doc(db, 'invoices', id);
        await updateDoc(invoiceRef, {
          ...finalDataToSave,
          updatedAt: serverTimestamp()
        });
        console.log("Invoice updated with ID:", id);
      } else {
        // Create new invoice
        const docRef = await addDoc(collection(db, 'invoices'), {
          ...finalDataToSave,
          createdAt: serverTimestamp(),
        });
        savedId = docRef.id;
        console.log("Invoice saved with ID:", docRef.id);

        // Update next number if sequential ONLY for new invoices
        if (firmDetails?.invoiceFormat?.type === 'sequential') {
          const newCurrentNumber = (firmDetails.invoiceFormat.currentNumber ?? (firmDetails.invoiceFormat.startNumber || 1) - 1) + 1;
          
          // Update local state
          setFirmDetails(prev => prev ? ({
            ...prev,
            invoiceFormat: {
              ...prev.invoiceFormat!,
              currentNumber: newCurrentNumber
            }
          }) : null);

          // Update Firestore
          const firmRef = doc(db, 'firmDetails', user.uid);
          // We use dot notation to update nested field without overwriting the whole map
          await updateDoc(firmRef, {
            'invoiceFormat.currentNumber': newCurrentNumber
          });
        }
      }

      setCurrentInvoice({ ...invoiceData, id: savedId });
      // Clear editing state after save so next time we go to form it's fresh
      setEditingInvoice(null);
      // Switch view context to history so the "Update" button becomes "Print"
      setView('history');
      return true;
    } catch (error) {
      console.error("Error saving document: ", error);
      alert(`Failed to save the invoice: ${error.message || 'Please try again.'}`);
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
  
  const handleEditInvoice = (invoice: InvoiceData) => {
    setEditingInvoice(invoice);
    setView('form');
    setCurrentInvoice(null);
  };
  
  const handleBack = () => {
    setCurrentInvoice(null);
  };

  const handleFirmSetupComplete = (details: FirmDetails) => {
    setFirmDetails(details);
    setFirmLoading(false);
  };

  const handleFirmUpdate = (details: FirmDetails) => {
    setFirmDetails(details);
    setView('form');
  };

  const switchView = (newView: View) => {
    setView(newView);
    setCurrentInvoice(null);
    setEditingInvoice(null);
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

  // Show firm setup if user hasn't completed it yet
  if (firmLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-amber-800 font-semibold">Loading your business details...</div>
      </div>
    );
  }

  if (!firmDetails) {
    return <FirmSetup userId={user.uid} onComplete={handleFirmSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-amber-50/50 font-sans text-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 no-print">
            <div className="flex items-center gap-2 sm:gap-4 mb-4">
              {/* Logo */}
              {firmDetails.displaySettings?.showLogoOnHeader !== false && (
                <div className="shrink-0">
                  {firmDetails.logoUrl ? (
                    <img 
                      src={firmDetails.logoUrl} 
                      alt={firmDetails.firmName}
                      className="w-20 h-20 md:w-32 md:h-32 lg:w-[150px] lg:h-[150px] object-contain bg-transparent"
                    />
                  ) : (
                    <div className="w-20 h-20 md:w-32 md:h-32 lg:w-[150px] lg:h-[150px] flex items-center justify-center">
                      <span className="text-4xl md:text-6xl font-bold text-amber-600">
                        {firmDetails.firmName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1">
                {/* Show firm names based on settings */}
                {(firmDetails.displaySettings?.showFirmNameOnHeader !== false || firmDetails.displaySettings?.showFirmNameLocalOnHeader !== false) && (
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-amber-900 tracking-tight">
                    {firmDetails.displaySettings?.showFirmNameLocalOnHeader !== false && firmDetails.firmNameLocal ? firmDetails.firmNameLocal : ''}
                    {firmDetails.displaySettings?.showFirmNameOnHeader !== false && firmDetails.displaySettings?.showFirmNameLocalOnHeader !== false && firmDetails.firmNameLocal && firmDetails.firmName ? ' | ' : ''}
                    {firmDetails.displaySettings?.showFirmNameOnHeader !== false ? firmDetails.firmName : ''}
                  </h1>
                )}
                {/* Show taglines based on settings */}
                {(firmDetails.displaySettings?.showTaglineOnHeader !== false || firmDetails.displaySettings?.showTaglineLocalOnHeader !== false) && (firmDetails.tagline || firmDetails.taglineLocal) && (
                  <p className="text-base md:text-lg text-amber-700 mt-2">
                    {firmDetails.displaySettings?.showTaglineLocalOnHeader !== false && firmDetails.taglineLocal ? firmDetails.taglineLocal : ''}
                    {firmDetails.displaySettings?.showTaglineOnHeader !== false && firmDetails.displaySettings?.showTaglineLocalOnHeader !== false && firmDetails.taglineLocal && firmDetails.tagline ? ' | ' : ''}
                    {firmDetails.displaySettings?.showTaglineOnHeader !== false && firmDetails.tagline ? firmDetails.tagline : ''}
                  </p>
                )}
                {/* Custom Header Text */}
                {firmDetails.displaySettings?.customHeaderText && (
                  <p className="text-sm md:text-base text-amber-800 mt-2 whitespace-pre-wrap">
                    {firmDetails.displaySettings.customHeaderText}
                  </p>
                )}
              </div>
            </div>
            <nav className="flex flex-wrap items-center justify-start md:justify-center gap-2 md:gap-4">
              <button onClick={() => switchView('form')} className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition ${view === 'form' && !currentInvoice ? 'bg-amber-600 text-white' : 'bg-white hover:bg-amber-100'}`}><NewBillIcon /><span className="md:hidden">Bill</span><span className="hidden md:inline">New Bill</span></button>
              <button onClick={() => switchView('history')} className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition ${view === 'history' && !currentInvoice ? 'bg-amber-600 text-white' : 'bg-white hover:bg-amber-100'}`}><HistoryIcon /><span>History</span></button>
              <button onClick={() => switchView('manage')} className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition ${view === 'manage' && !currentInvoice ? 'bg-amber-600 text-white' : 'bg-white hover:bg-amber-100'}`}><DatabaseIcon /><span>Manage</span></button>
              <button onClick={() => switchView('settings')} className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition ${view === 'settings' && !currentInvoice ? 'bg-amber-600 text-white' : 'bg-white hover:bg-amber-100'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden md:inline">Settings</span>
              </button>
              <button onClick={handleLogout} className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg bg-white hover:bg-red-100 text-red-600"><LogoutIcon /><span className="md:hidden">Exit</span><span className="hidden md:inline">Logout</span></button>
            </nav>
        </header>

        <main>
            {currentInvoice ? (
            <Invoice 
              invoiceData={currentInvoice} 
              onBack={handleBack} 
              backButtonText={view === 'history' ? 'Back to History' : 'Create New Bill'} 
              onSave={handleSaveInvoice}
              firmDetails={firmDetails}
              isPreview={view === 'form'}
            />
          ) : view === 'form' ? (
            <BillingForm 
              products={products} 
              customers={customers} 
              onGenerateBill={handleGenerateBill} 
              initialData={editingInvoice}
            />
          ) : view === 'manage' ? (
            <MasterData
              products={products}
              onAddProduct={handleAddProduct}
              onDeleteProduct={handleDeleteProduct}
              onUpdateProduct={handleUpdateProduct}
              customers={customers}
              onAddCustomer={handleAddCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onUpdateCustomer={handleUpdateCustomer}
            />
          ) : view === 'settings' ? (
            <FirmSetup userId={user.uid} onComplete={handleFirmUpdate} existingDetails={firmDetails} />
          ) : (
            <BillHistory user={user} onViewInvoice={handleViewInvoice} onEditInvoice={handleEditInvoice} />
          )}
        </main>
        <footer className="text-center mt-12 text-sm text-gray-500 no-print">
            <p>&copy; {new Date().getFullYear()} {firmDetails.firmName}. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;