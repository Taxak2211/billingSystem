import React, { useRef } from 'react';
import { type InvoiceData } from '../types';
import { GST_RATE } from '../constants';

interface InvoiceProps {
  invoiceData: InvoiceData;
  onBack: () => void;
  backButtonText: string;
  onSave?: (invoiceData: InvoiceData) => Promise<boolean | void>;
}

const Invoice: React.FC<InvoiceProps> = ({ invoiceData, onBack, backButtonText, onSave }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    // Save to Firestore before printing (only if not already saved)
    if (onSave && !invoiceData.id) {
      const saved = await onSave(invoiceData);
      if (!saved) {
        return; // Don't print if save failed
      }
    }
    window.print();
  };
  
  const formattedDate = invoiceData.date instanceof Date 
    ? invoiceData.date.toLocaleDateString('en-IN')
    : new Date(invoiceData.date).toLocaleDateString('en-IN');


  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
      <div ref={invoiceRef} className="print-area">
        <header className="flex justify-between items-start pb-6 border-b-2 border-amber-800">
          <div className="flex gap-4 items-start">
            {/* Logo */}
            <div className="shrink-0">
              <svg width="100" height="100" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                {/* Background circle */}
                <circle cx="200" cy="200" r="190" fill="#2D5016" opacity="0.1"/>
                
                {/* Outer decorative circle */}
                <circle cx="200" cy="200" r="170" fill="none" stroke="#D4A522" strokeWidth="3"/>
                
                {/* Oil drop icon */}
                <g transform="translate(200, 140)">
                  {/* Main oil drop */}
                  <path d="M 0,-50 C -20,-50 -35,-35 -35,-15 C -35,10 0,50 0,50 C 0,50 35,10 35,-15 C 35,-35 20,-50 0,-50 Z" 
                        fill="#D4A522" stroke="#2D5016" strokeWidth="2"/>
                  
                  {/* Shine effect on drop */}
                  <ellipse cx="-8" cy="-20" rx="8" ry="12" fill="#FFF" opacity="0.4"/>
                  
                  {/* Small drops */}
                  <circle cx="-45" cy="0" r="6" fill="#D4A522" opacity="0.7"/>
                  <circle cx="45" cy="0" r="6" fill="#D4A522" opacity="0.7"/>
                  <circle cx="-55" cy="20" r="4" fill="#D4A522" opacity="0.5"/>
                  <circle cx="55" cy="20" r="4" fill="#D4A522" opacity="0.5"/>
                </g>
                
                {/* Leaf elements for natural/pure theme */}
                <g transform="translate(120, 120) rotate(-30)">
                  <path d="M 0,0 Q 10,-15 0,-30" fill="none" stroke="#4A7C2E" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M 0,-30 Q 15,-22 12,-10 Q 8,-5 0,0" fill="#5A9B3A" opacity="0.7"/>
                  <path d="M 0,-30 Q -15,-22 -12,-10 Q -8,-5 0,0" fill="#6BAF4A" opacity="0.7"/>
                </g>
                
                <g transform="translate(280, 120) rotate(30) scale(-1, 1)">
                  <path d="M 0,0 Q 10,-15 0,-30" fill="none" stroke="#4A7C2E" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M 0,-30 Q 15,-22 12,-10 Q 8,-5 0,0" fill="#5A9B3A" opacity="0.7"/>
                  <path d="M 0,-30 Q -15,-22 -12,-10 Q -8,-5 0,0" fill="#6BAF4A" opacity="0.7"/>
                </g>
                
                {/* Gujarati Text */}
                <text x="200" y="255" fontFamily="'Noto Sans Gujarati', Arial" fontSize="28" fontWeight="700" 
                      textAnchor="middle" fill="#2D5016">બાપા સીતારામ</text>
                
                <text x="200" y="285" fontFamily="'Noto Sans Gujarati', Arial" fontSize="22" fontWeight="600" 
                      textAnchor="middle" fill="#4A7C2E">મીની ઓઈલ મીલ</text>
                
                {/* Decorative bottom element */}
                <line x1="120" y1="310" x2="280" y2="310" stroke="#D4A522" strokeWidth="2" opacity="0.6"/>
                <circle cx="200" cy="310" r="4" fill="#D4A522"/>
                
                {/* Tagline in Gujarati */}
                <text x="200" y="330" fontFamily="'Noto Sans Gujarati', Arial" fontSize="12" 
                      textAnchor="middle" fill="#666" fontStyle="italic">શુદ્ધતા અને ગુણવત્તા</text>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-amber-900">શુદ્ધ મગફળીનું તેલ</h1>
              
              <p className="text-xs text-gray-500 mt-2">શ્રીયમ હેરિટેજ ફ્લેટ્સ ની પાછળ, <br></br>
                સરદાર પટેલ રિંગ રોડ, બાકરોલ(બાદ્રાબાદ) સર્કલ પાસે<br></br>
                અમદાવાદ, ગુજરાત ૩૮૨૨૧૦</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-700">INVOICE</h2>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Invoice #:</strong> {invoiceData.invoiceNumber}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Date:</strong> {formattedDate}
            </p>
          </div>
        </header>

        <section className="my-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Bill To:</h3>
          <p className="font-medium text-gray-800">{invoiceData.customerName}</p>
          {invoiceData.customerPhone && <p className="text-gray-600">{invoiceData.customerPhone}</p>}
        </section>

        <section className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-amber-100 text-amber-900">
              <tr>
                <th className="p-3 font-semibold">Sr. No.</th>
                <th className="p-3 font-semibold">Item Description</th>
                <th className="p-3 font-semibold text-center">Qty</th>
                <th className="p-3 font-semibold text-right">Rate (₹)</th>
                <th className="p-3 font-semibold text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => (
                <tr key={item.lineId ?? `${item.product.id}-${index}`} className="border-b border-gray-200">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3 font-medium">{item.product.name}</td>
                  <td className="p-3 text-center">{item.quantity}</td>
                  <td className="p-3 text-right">{item.product.price.toFixed(2)}</td>
                  <td className="p-3 text-right">{(item.product.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-8 flex justify-end">
          <div className="w-full max-w-xs space-y-3 text-gray-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium">₹ {invoiceData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST ({GST_RATE * 100}%)</span>
              <span className="font-medium">₹ {invoiceData.gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-amber-900 pt-2 border-t-2 border-gray-300">
              <span>Total Amount</span>
              <span>₹ {invoiceData.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </section>

        <footer className="mt-12 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">Thank you for your business!</p>
        </footer>
      </div>

      <div className="mt-8 flex justify-end gap-4 no-print">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition"
        >
          {backButtonText}
        </button>
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition"
        >
          {invoiceData.id ? 'Print Invoice' : 'Save & Print Invoice'}
        </button>
      </div>
    </div>
  );
};

export default Invoice;