import React, { useRef } from 'react';
import { type InvoiceData, type FirmDetails } from '../types';
import { GST_RATE } from '../constants';

interface InvoiceProps {
  invoiceData: InvoiceData;
  onBack: () => void;
  backButtonText: string;
  onSave?: (invoiceData: InvoiceData) => Promise<boolean | void>;
  firmDetails: FirmDetails;
  isPreview?: boolean;
}

const Invoice: React.FC<InvoiceProps> = ({ invoiceData, onBack, backButtonText, onSave, firmDetails, isPreview = false }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const handlePrint = async () => {
    // Prevent multiple clicks
    if (isSaving) return;

    // Save to Firestore before printing (only if not already saved OR if it's a preview of changes)
    if (onSave && (isPreview || !invoiceData.id)) {
      setIsSaving(true);
      try {
        const saved = await onSave(invoiceData);
        if (!saved) {
          setIsSaving(false);
          return; // Don't print if save failed
        }
      } catch (error) {
        console.error("Error saving invoice:", error);
        setIsSaving(false);
        return;
      }
      // Note: We don't strictly need to set isSaving(false) here if successful, 
      // because the parent will likely update the invoiceData with an ID, causing a re-render.
      // But for safety/completeness in case of logic changes:
      setIsSaving(false);
    }
    window.print();
  };
  
  const formattedDate = invoiceData.date instanceof Date 
    ? invoiceData.date.toLocaleDateString('en-IN')
    : new Date(invoiceData.date).toLocaleDateString('en-IN');

  const formattedTime = invoiceData.date instanceof Date 
    ? invoiceData.date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : new Date(invoiceData.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });


  return (
    <div className="bg-white p-3 sm:p-6 md:p-8 rounded-2xl shadow-lg">
      <div ref={invoiceRef} className="print-area">
        <header className="flex flex-col sm:flex-row justify-between items-start pb-4 sm:pb-6 border-b-2 border-amber-800 gap-4">
          <div className="flex gap-2 sm:gap-4 items-start w-full sm:w-auto">
            {/* Logo */}
            {firmDetails.displaySettings?.showLogoOnInvoice !== false && (
              <div className="shrink-0 mt-1">
                {firmDetails.logoUrl ? (
                  <img 
                    src={firmDetails.logoUrl} 
                    alt={firmDetails.firmName}
                    width="100"
                    height="100"
                    className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] md:w-[100px] md:h-[100px] object-contain bg-transparent"
                  />
                ) : (
                  <div className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] md:w-[100px] md:h-[100px] flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-600">
                      {firmDetails.firmName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {/* Show firm names based on settings */}
              {(firmDetails.displaySettings?.showFirmNameOnInvoice !== false || firmDetails.displaySettings?.showFirmNameLocalOnInvoice !== false) && (
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-amber-900">
                  {firmDetails.displaySettings?.showFirmNameLocalOnInvoice !== false && firmDetails.firmNameLocal ? firmDetails.firmNameLocal : ''}
                  {firmDetails.displaySettings?.showFirmNameOnInvoice !== false && firmDetails.displaySettings?.showFirmNameLocalOnInvoice !== false && firmDetails.firmNameLocal && firmDetails.firmName ? ' | ' : ''}
                  {firmDetails.displaySettings?.showFirmNameOnInvoice !== false ? firmDetails.firmName : ''}
                </h1>
              )}
              {/* Show taglines based on settings */}
              {(firmDetails.displaySettings?.showTaglineOnInvoice !== false || firmDetails.displaySettings?.showTaglineLocalOnInvoice !== false) && (firmDetails.tagline || firmDetails.taglineLocal) && (
                <p className="text-xs sm:text-sm text-amber-700 mt-1">
                  {firmDetails.displaySettings?.showTaglineLocalOnInvoice !== false && firmDetails.taglineLocal ? firmDetails.taglineLocal : ''}
                  {firmDetails.displaySettings?.showTaglineOnInvoice !== false && firmDetails.displaySettings?.showTaglineLocalOnInvoice !== false && firmDetails.taglineLocal && firmDetails.tagline ? ' | ' : ''}
                  {firmDetails.displaySettings?.showTaglineOnInvoice !== false && firmDetails.tagline ? firmDetails.tagline : ''}
                </p>
              )}
              {firmDetails.displaySettings?.showAddressOnInvoice !== false && (
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 leading-tight">
                  {firmDetails.address}
                  {firmDetails.city && firmDetails.state && firmDetails.pincode && (
                    <><br />{firmDetails.city}, {firmDetails.state} {firmDetails.pincode}</>
                  )}
                </p>
              )}
              {(firmDetails.displaySettings?.showPhoneOnInvoice !== false || firmDetails.displaySettings?.showEmailOnInvoice !== false) && (firmDetails.phone || firmDetails.email) && (
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  {firmDetails.displaySettings?.showPhoneOnInvoice !== false && firmDetails.phone && <span>Phone: {firmDetails.phone}</span>}
                  {firmDetails.displaySettings?.showPhoneOnInvoice !== false && firmDetails.phone && firmDetails.displaySettings?.showEmailOnInvoice !== false && firmDetails.email && <span> | </span>}
                  {firmDetails.displaySettings?.showEmailOnInvoice !== false && firmDetails.email && <span>Email: {firmDetails.email}</span>}
                </p>
              )}
              {firmDetails.displaySettings?.showGstOnInvoice !== false && firmDetails.gstNumber && (
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  GST: {firmDetails.gstNumber}
                </p>
              )}
            </div>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-700">INVOICE</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              <strong>Invoice #:</strong> {invoiceData.invoiceNumber}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              <strong>Date:</strong> {formattedDate}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              <strong>Time:</strong> {formattedTime}
            </p>
          </div>
        </header>

        <section className="my-4 sm:my-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">Bill To:</h3>
          <p className="text-sm sm:text-base font-medium text-gray-800">{invoiceData.customerName}</p>
          {invoiceData.customerPhone && <p className="text-sm sm:text-base text-gray-600">{invoiceData.customerPhone}</p>}
        </section>

        {/* Mobile: Card Layout */}
        <section className="block sm:hidden space-y-3">
          {invoiceData.items.map((item, index) => (
            <div key={item.lineId ?? `${item.product.id}-${index}`} className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="text-xs text-gray-500">#{index + 1}</div>
                  <div className="font-semibold text-sm text-gray-800">{item.product.name}</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <div className="text-gray-500">Qty</div>
                  <div className="font-medium">{item.quantity}</div>
                </div>
                <div>
                  <div className="text-gray-500">Rate</div>
                  <div className="font-medium">₹{item.product.price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-500">GST</div>
                  <div className="font-medium">
                    {item.gstRate ?? GST_RATE * 100}%
                    <span className="text-xs text-gray-600 block">(₹{((item.product.price * item.quantity * (item.gstRate ?? GST_RATE * 100)) / 100).toFixed(2)})</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-500">Amount</div>
                  <div className="font-semibold text-amber-900">₹{(item.product.price * item.quantity).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Desktop: Table Layout */}
        <section className="hidden sm:block">
          <table className="w-full text-left">
            <thead className="bg-amber-100 text-amber-900">
              <tr>
                <th className="p-3 font-semibold">Sr. No.</th>
                <th className="p-3 font-semibold">Item Description</th>
                <th className="p-3 font-semibold text-center">Qty</th>
                <th className="p-3 font-semibold text-right">Rate (₹)</th>
                <th className="p-3 font-semibold text-center">GST (%)</th>
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
                  <td className="p-3 text-center">
                    <div>{item.gstRate ?? GST_RATE * 100}%</div>
                    <div className="text-xs text-gray-600">(₹{((item.product.price * item.quantity * (item.gstRate ?? GST_RATE * 100)) / 100).toFixed(2)})</div>
                  </td>
                  <td className="p-3 text-right">{(item.product.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-4 sm:mt-8 flex justify-end">
          <div className="w-full max-w-xs space-y-2 sm:space-y-3 text-gray-700 text-sm sm:text-base">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium">₹ {invoiceData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (Variable)</span>
              <span className="font-medium">₹ {invoiceData.gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg sm:text-xl font-bold text-amber-900 pt-2 border-t-2 border-gray-300">
              <span>Total Amount</span>
              <span>₹ {invoiceData.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* Custom Invoice Text */}
        {firmDetails.displaySettings?.customInvoiceText && (
          <section className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{firmDetails.displaySettings.customInvoiceText}</p>
          </section>
        )}

        <footer className="mt-6 sm:mt-12 pt-4 sm:pt-6 border-t border-gray-200 text-center">
            <p className="text-xs sm:text-sm text-gray-600">Thank you for your business!</p>
        </footer>
      </div>

      <div className="mt-4 sm:mt-8 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 no-print">
        <button
          onClick={onBack}
          className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition text-sm sm:text-base"
        >
          {backButtonText}
        </button>
        <button
          onClick={handlePrint}
          disabled={isSaving}
          className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 font-semibold rounded-lg transition text-sm sm:text-base ${
            isSaving 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          {isSaving ? 'Saving...' : ((!isPreview && invoiceData.id) ? 'Print Invoice' : (invoiceData.id ? 'Update & Print Invoice' : 'Save & Print Invoice'))}
        </button>
      </div>
    </div>
  );
};

export default Invoice;