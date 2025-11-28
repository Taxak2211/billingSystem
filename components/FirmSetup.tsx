import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { type FirmDetails } from '../types';

interface FirmSetupProps {
  userId: string;
  onComplete: (firmDetails: FirmDetails) => void;
  existingDetails?: FirmDetails | null;
}

const FirmSetup: React.FC<FirmSetupProps> = ({ userId, onComplete, existingDetails }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(existingDetails?.logoUrl || null);

  const [formData, setFormData] = useState({
    firmName: existingDetails?.firmName || '',
    firmNameLocal: existingDetails?.firmNameLocal || '',
    address: existingDetails?.address || '',
    city: existingDetails?.city || '',
    state: existingDetails?.state || '',
    pincode: existingDetails?.pincode || '',
    phone: existingDetails?.phone || '',
    email: existingDetails?.email || '',
    gstNumber: existingDetails?.gstNumber || '',
    tagline: existingDetails?.tagline || '',
    taglineLocal: existingDetails?.taglineLocal || '',
  });

  const [displaySettings, setDisplaySettings] = useState({
    showLogoOnHeader: existingDetails?.displaySettings?.showLogoOnHeader ?? true,
    showLogoOnInvoice: existingDetails?.displaySettings?.showLogoOnInvoice ?? true,
    showFirmNameOnHeader: existingDetails?.displaySettings?.showFirmNameOnHeader ?? true,
    showFirmNameLocalOnHeader: existingDetails?.displaySettings?.showFirmNameLocalOnHeader ?? true,
    showFirmNameOnInvoice: existingDetails?.displaySettings?.showFirmNameOnInvoice ?? true,
    showFirmNameLocalOnInvoice: existingDetails?.displaySettings?.showFirmNameLocalOnInvoice ?? true,
    showTaglineOnHeader: existingDetails?.displaySettings?.showTaglineOnHeader ?? true,
    showTaglineLocalOnHeader: existingDetails?.displaySettings?.showTaglineLocalOnHeader ?? true,
    showTaglineOnInvoice: existingDetails?.displaySettings?.showTaglineOnInvoice ?? true,
    showTaglineLocalOnInvoice: existingDetails?.displaySettings?.showTaglineLocalOnInvoice ?? true,
    showPhoneOnInvoice: existingDetails?.displaySettings?.showPhoneOnInvoice ?? true,
    showEmailOnInvoice: existingDetails?.displaySettings?.showEmailOnInvoice ?? true,
    showGstOnInvoice: existingDetails?.displaySettings?.showGstOnInvoice ?? true,
    showAddressOnInvoice: existingDetails?.displaySettings?.showAddressOnInvoice ?? true,
    customInvoicePrefix: existingDetails?.displaySettings?.customInvoicePrefix || '',
    customHeaderText: existingDetails?.displaySettings?.customHeaderText || '',
    customInvoiceText: existingDetails?.displaySettings?.customInvoiceText || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setDisplaySettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleDisplaySettingTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Only allow alphanumeric characters for invoice prefix
    if (name === 'customInvoicePrefix') {
      const sanitized = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 10);
      setDisplaySettings(prev => ({ ...prev, [name]: sanitized }));
    } else {
      setDisplaySettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      // Validate file size (max 500KB for base64 storage)
      if (file.size > 500 * 1024) {
        setError('Logo file size should be less than 500KB');
        return;
      }
      setLogoFile(file);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let logoBase64 = '';

      // Convert logo to base64 if provided
      if (logoFile) {
        // If the file is already PNG, just convert to base64
        if (logoFile.type === 'image/png') {
          logoBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(logoFile);
          });
        } else {
          // For non-PNG images, convert to PNG to ensure transparency support
          logoBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  resolve(canvas.toDataURL('image/png'));
                } else {
                  reject(new Error('Could not get canvas context'));
                }
              };
              img.onerror = reject;
              img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(logoFile);
          });
        }
      } else if (existingDetails?.logoUrl) {
        // Keep existing logo if no new file is uploaded
        logoBase64 = existingDetails.logoUrl;
      }

      // Create firm details object (remove undefined values for Firestore)
      const firmDetails: any = {
        userId,
        firmName: formData.firmName,
        address: formData.address,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only add optional fields if they have values
      if (formData.firmNameLocal) firmDetails.firmNameLocal = formData.firmNameLocal;
      if (formData.city) firmDetails.city = formData.city;
      if (formData.state) firmDetails.state = formData.state;
      if (formData.pincode) firmDetails.pincode = formData.pincode;
      if (formData.phone) firmDetails.phone = formData.phone;
      if (formData.email) firmDetails.email = formData.email;
      if (formData.gstNumber) firmDetails.gstNumber = formData.gstNumber;
      if (logoBase64) firmDetails.logoUrl = logoBase64; // Store base64 as logoUrl
      if (formData.tagline) firmDetails.tagline = formData.tagline;
      if (formData.taglineLocal) firmDetails.taglineLocal = formData.taglineLocal;
      
      // Add display settings
      firmDetails.displaySettings = displaySettings;

      // Save to Firestore
      const firmDocRef = doc(db, 'firmDetails', userId);
      await setDoc(firmDocRef, firmDetails);

      onComplete({ ...firmDetails, id: userId } as FirmDetails);
    } catch (err) {
      console.error('Error saving firm details:', err);
      setError('Failed to save firm details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 p-4">
      <div className="w-full max-w-3xl bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-amber-900 mb-2">
            {existingDetails ? 'Update Your Business Details' : 'Welcome! Set Up Your Business'}
          </h1>
          <p className="text-gray-600">
            {existingDetails 
              ? 'Update your business information below' 
              : 'Please provide your business details to get started with the billing system'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload */}
          <div className="border-2 border-dashed border-amber-300 rounded-lg p-6 text-center">
            <label htmlFor="logo" className="block cursor-pointer">
              {logoPreview ? (
                <div className="flex flex-col items-center">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-32 h-32 object-contain mb-2"
                  />
                  <p className="text-sm text-gray-600">Click to change logo</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <svg
                    className="w-16 h-16 text-amber-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-gray-600">
                    Click to upload your business logo (Optional)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG recommended for transparency. Max 500KB</p>
                </div>
              )}
              <input
                type="file"
                id="logo"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Business Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firmName" className="block text-sm font-medium text-gray-700 mb-1">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firmName"
                name="firmName"
                value={formData.firmName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Enter business name"
                required
              />
            </div>
            <div>
              <label htmlFor="firmNameLocal" className="block text-sm font-medium text-gray-700 mb-1">
                Business Name (Local Language)
              </label>
              <input
                type="text"
                id="firmNameLocal"
                name="firmNameLocal"
                value={formData.firmNameLocal}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="બિઝનેસનું નામ"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Enter complete business address"
              required
            />
          </div>

          {/* City, State, Pincode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="City"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="State"
              />
            </div>
            <div>
              <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">
                Pincode
              </label>
              <input
                type="text"
                id="pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Pincode"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="business@example.com"
              />
            </div>
          </div>

          {/* GST Number */}
          <div>
            <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700 mb-1">
              GST Number
            </label>
            <input
              type="text"
              id="gstNumber"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="GST Number (if applicable)"
            />
          </div>

          {/* Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tagline" className="block text-sm font-medium text-gray-700 mb-1">
                Tagline
              </label>
              <input
                type="text"
                id="tagline"
                name="tagline"
                value={formData.tagline}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Your business tagline"
              />
            </div>
            <div>
              <label htmlFor="taglineLocal" className="block text-sm font-medium text-gray-700 mb-1">
                Tagline (Local Language)
              </label>
              <input
                type="text"
                id="taglineLocal"
                name="taglineLocal"
                value={formData.taglineLocal}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="તમારી બિઝનેસની ટેગલાઇન"
              />
            </div>
          </div>

          {/* Display Settings */}
          <div className="border-t-2 border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Display Preferences</h3>
            <p className="text-sm text-gray-600 mb-4">Choose what information to show on your app header and invoices</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Header Settings */}
              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">App Header</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="showLogoOnHeader"
                      checked={displaySettings.showLogoOnHeader}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">Show Logo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="showFirmNameOnHeader"
                      checked={displaySettings.showFirmNameOnHeader}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">Show Business Name (English)</span>
                  </label>
                  {formData.firmNameLocal && (
                    <label className="flex items-center gap-2 cursor-pointer ml-6">
                      <input
                        type="checkbox"
                        name="showFirmNameLocalOnHeader"
                        checked={displaySettings.showFirmNameLocalOnHeader}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700">Show Business Name (Local)</span>
                    </label>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="showTaglineOnHeader"
                      checked={displaySettings.showTaglineOnHeader}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">Show Tagline (English)</span>
                  </label>
                  {formData.taglineLocal && (
                    <label className="flex items-center gap-2 cursor-pointer ml-6">
                      <input
                        type="checkbox"
                        name="showTaglineLocalOnHeader"
                        checked={displaySettings.showTaglineLocalOnHeader}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700">Show Tagline (Local)</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Invoice Settings */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">Invoice/Bill</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="showLogoOnInvoice"
                      checked={displaySettings.showLogoOnInvoice}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">Show Logo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="showFirmNameOnInvoice"
                      checked={displaySettings.showFirmNameOnInvoice}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">Show Business Name (English)</span>
                  </label>
                  {formData.firmNameLocal && (
                    <label className="flex items-center gap-2 cursor-pointer ml-6">
                      <input
                        type="checkbox"
                        name="showFirmNameLocalOnInvoice"
                        checked={displaySettings.showFirmNameLocalOnInvoice}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700">Show Business Name (Local)</span>
                    </label>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="showTaglineOnInvoice"
                      checked={displaySettings.showTaglineOnInvoice}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">Show Tagline (English)</span>
                  </label>
                  {formData.taglineLocal && (
                    <label className="flex items-center gap-2 cursor-pointer ml-6">
                      <input
                        type="checkbox"
                        name="showTaglineLocalOnInvoice"
                        checked={displaySettings.showTaglineLocalOnInvoice}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700">Show Tagline (Local)</span>
                    </label>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="showAddressOnInvoice"
                      checked={displaySettings.showAddressOnInvoice}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">Show Address</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="showPhoneOnInvoice"
                      checked={displaySettings.showPhoneOnInvoice}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">Show Phone Number</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="showEmailOnInvoice"
                      checked={displaySettings.showEmailOnInvoice}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">Show Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="showGstOnInvoice"
                      checked={displaySettings.showGstOnInvoice}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">Show GST Number</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Custom Invoice Prefix */}
            <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-medium text-gray-800 mb-2">Custom Invoice Number Prefix</h4>
              <p className="text-xs text-gray-600 mb-3">
                By default, invoice numbers start with letters from your business name. Enter a custom prefix if you prefer (3-10 characters, letters/numbers only).
              </p>
              <div>
                <label htmlFor="customInvoicePrefix" className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Prefix (Optional)
                </label>
                <input
                  type="text"
                  id="customInvoicePrefix"
                  name="customInvoicePrefix"
                  value={displaySettings.customInvoicePrefix}
                  onChange={handleDisplaySettingTextChange}
                  placeholder="INV, SHOP, BILL"
                  maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 uppercase"
                />
                {displaySettings.customInvoicePrefix && (
                  <p className="text-xs text-purple-600 mt-1">
                    Invoice numbers will look like: <strong>{displaySettings.customInvoicePrefix}-1234567890</strong>
                  </p>
                )}
                {!displaySettings.customInvoicePrefix && formData.firmName && (
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank to auto-generate from business name
                  </p>
                )}
              </div>
            </div>

            {/* Custom Text Fields */}
            <div className="mt-6 bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-gray-800 mb-2">Custom Text</h4>
              <p className="text-xs text-gray-600 mb-4">
                Add custom text, notes, or messages to display on your app header or invoices.
              </p>
              
              <div className="space-y-4">
                {/* Custom Header Text */}
                <div>
                  <label htmlFor="customHeaderText" className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Text for App Header (Optional)
                  </label>
                  <textarea
                    id="customHeaderText"
                    name="customHeaderText"
                    value={displaySettings.customHeaderText}
                    onChange={handleDisplaySettingTextChange}
                    placeholder="e.g., Open 24/7, Best Quality Assured, Contact us anytime"
                    rows={2}
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {displaySettings.customHeaderText.length}/200 characters
                  </p>
                </div>

                {/* Custom Invoice Text */}
                <div>
                  <label htmlFor="customInvoiceText" className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Text for Invoice/Bill (Optional)
                  </label>
                  <textarea
                    id="customInvoiceText"
                    name="customInvoiceText"
                    value={displaySettings.customInvoiceText}
                    onChange={handleDisplaySettingTextChange}
                    placeholder="e.g., Thank you for your business!, Terms: Payment due within 30 days, For queries call: 123-456-7890"
                    rows={3}
                    maxLength={300}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {displaySettings.customInvoiceText.length}/300 characters
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : existingDetails ? 'Update Details' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FirmSetup;
