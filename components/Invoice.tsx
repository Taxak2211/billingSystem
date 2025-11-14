import React, { useRef } from 'react';
import { type InvoiceData } from '../types';
import { GST_RATE } from '../constants';

interface InvoiceProps {
  invoiceData: InvoiceData;
  onBack: () => void;
  backButtonText: string;
}

const Invoice: React.FC<InvoiceProps> = ({ invoiceData, onBack, backButtonText }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };
  
  const formattedDate = invoiceData.date instanceof Date 
    ? invoiceData.date.toLocaleDateString('en-IN')
    : new Date(invoiceData.date).toLocaleDateString('en-IN');


  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
      <div ref={invoiceRef} className="print-area">
        <header className="flex justify-between items-start pb-6 border-b-2 border-amber-800">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">શુદ્ધ મગફળીનું તેલ</h1>
            <p className="text-gray-600">Pure Groundnut Oil</p>
            <p className="text-xs text-gray-500 mt-2">શ્રીયમ હેરિટેજ ફ્લેટ્સ અને દુકાનો, <br></br>
બાકરોલ સર્કલ પાસે, સરદાર પટેલ રિંગ રોડ, <br></br>
બાકરોલ બાદ્રાબાદ, અમદાવાદ, ગુજરાત ૩૮૨૨૧૦</p>
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
          Print Invoice
        </button>
      </div>
    </div>
  );
};

export default Invoice;