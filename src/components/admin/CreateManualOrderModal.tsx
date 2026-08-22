import React, { useState } from 'react';
import { Product, Order, OrderItem, ProductSize, CourierPartner } from '../../types';
import { Plus, Trash2, X, ShoppingBag, CheckCircle, User, MapPin, Package } from 'lucide-react';
import { formatPrice } from '../../lib/currency';
import { useTheme } from '../../context/ThemeContext';

interface CreateManualOrderModalProps {
  products: Product[];
  onClose: () => void;
  onSaveOrder: (order: Order) => Promise<void>;
}

export const CreateManualOrderModal: React.FC<CreateManualOrderModalProps> = ({
  products,
  onClose,
  onSaveOrder
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('9876543210');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Delhi');
  const [zipCode, setZipCode] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'UPI' | 'cod' | 'cashfree'>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING_VERIFICATION' | 'Paid' | 'Pending'>('PAID');
  const [upiRefNumber, setUpiRefNumber] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express' | 'overnight'>('express');
  const [courierPartner, setCourierPartner] = useState<CourierPartner>('Delhivery');

  const [selectedItems, setSelectedItems] = useState<Array<{
    productId: string;
    size: ProductSize;
    quantity: number;
  }>>([{
    productId: products[0]?.id || '',
    size: 'M',
    quantity: 1
  }]);

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddItemRow = () => {
    setSelectedItems(prev => [
      ...prev,
      { productId: products[0]?.id || '', size: 'M', quantity: 1 }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (selectedItems.length <= 1) return;
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setSelectedItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Calculate Subtotal
  const subtotal = selectedItems.reduce((sum, item) => {
    const prod = products.find(p => p.id === item.productId);
    const price = prod ? prod.price : 0;
    return sum + (price * item.quantity);
  }, 0);

  const shippingFee = shippingMethod === 'standard' ? 0 : 150;
  const tax = Math.round(subtotal * 0.12);
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digitsOnly = customerPhone.replace(/[^0-9]/g, '');
    const last10 = digitsOnly.slice(-10);
    if (!last10 || last10.length !== 10 || !/^[6-9]\d{9}$/.test(last10)) {
      setErrorMsg('Please enter a valid mandatory 10-digit Indian customer phone number (e.g. 9876543210).');
      return;
    }

    if (!customerName.trim() || !customerEmail.trim() || !address.trim() || !city.trim()) {
      setErrorMsg('Please complete all required customer and delivery destination fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formattedPhone = `+91 ${last10}`;
      const orderItems: OrderItem[] = selectedItems.map(item => {
        const prod = products.find(p => p.id === item.productId) || products[0];
        return {
          productId: prod?.id || item.productId,
          name: prod?.name || 'VEYRO Garment',
          image: prod?.images?.[0] || prod?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
          size: item.size,
          color: prod?.colors?.[0]?.name || 'Onyx Black',
          price: prod?.price || 1999,
          quantity: item.quantity
        };
      });

      const newOrder: Order = {
        id: `MANUAL-${Date.now().toString().slice(-6)}`,
        items: orderItems,
        phone: formattedPhone,
        shippingAddress: {
          fullName: customerName.trim(),
          email: customerEmail.trim(),
          phone: formattedPhone,
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.trim() || '110001',
          country: 'India',
          deliveryNotes: deliveryNotes.trim() || undefined
        },
        shippingMethod,
        subtotal,
        discount: discountAmount,
        shippingFee,
        tax,
        total,
        status: 'New Orders',
        paymentMethod,
        paymentStatus,
        upiRefNumber: paymentMethod === 'UPI' ? upiRefNumber : undefined,
        courierPartner,
        trackingNumber: `AWB-${Math.floor(10000000 + Math.random() * 90000000)}`,
        createdAt: new Date().toISOString(),
        estimatedDelivery: '2-4 Business Days'
      };

      await onSaveOrder(newOrder);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create manual order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="manual-order-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className={`relative w-full max-w-3xl border rounded-2xl shadow-2xl overflow-hidden my-8 transition-colors ${
        isDark 
          ? 'bg-neutral-900 border-neutral-800 text-neutral-100' 
          : 'bg-white border-neutral-200 text-neutral-900'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-neutral-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-500">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-mono font-bold text-sm uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-neutral-950'
              }`}>
                Create Direct / VIP Streetwear Order
              </h3>
              <p className={`font-mono text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Manual Order Booking & Supabase Synchronization</p>
            </div>
          </div>
          <button
            id="close-manual-order-btn"
            onClick={onClose}
            className={`p-2 rounded-lg transition cursor-pointer ${
              isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 font-mono text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Customer Details */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Customer Credentials</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div>
                <label className={`block mb-1 font-bold text-[10px] uppercase ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kabir Sethi"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:border-amber-500 focus:outline-none ${
                    isDark 
                      ? 'bg-neutral-950 border-neutral-800 text-white' 
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block mb-1 font-bold text-[10px] uppercase ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Email *</label>
                <input
                  type="email"
                  required
                  placeholder="customer@gmail.com"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:border-amber-500 focus:outline-none ${
                    isDark 
                      ? 'bg-neutral-950 border-neutral-800 text-white' 
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block mb-1 font-bold text-[10px] uppercase ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Phone *</label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:border-amber-500 focus:outline-none ${
                    isDark 
                      ? 'bg-neutral-950 border-neutral-800 text-white' 
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Shipping Destination</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="sm:col-span-2">
                <label className={`block mb-1 font-bold text-[10px] uppercase ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Flat, Wing, Street, Landmark"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:border-amber-500 focus:outline-none ${
                    isDark 
                      ? 'bg-neutral-950 border-neutral-800 text-white' 
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block mb-1 font-bold text-[10px] uppercase ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>City *</label>
                <input
                  type="text"
                  required
                  placeholder="New Delhi"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:border-amber-500 focus:outline-none ${
                    isDark 
                      ? 'bg-neutral-950 border-neutral-800 text-white' 
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block mb-1 font-bold text-[10px] uppercase ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Pincode *</label>
                <input
                  type="text"
                  required
                  placeholder="110001"
                  value={zipCode}
                  onChange={e => setZipCode(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:border-amber-500 focus:outline-none ${
                    isDark 
                      ? 'bg-neutral-950 border-neutral-800 text-white' 
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-4">
                <label className={`block mb-1 font-bold text-[10px] uppercase ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  Delivery Notes / Landmark Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Metro Gate 2, Call before delivery"
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:border-amber-500 focus:outline-none ${
                    isDark 
                      ? 'bg-neutral-950 border-neutral-800 text-white' 
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Products & Quantity Stepper */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                <span>Selected Streetwear Garments</span>
              </h4>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400 hover:underline transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {selectedItems.map((item, idx) => {
                const prod = products.find(p => p.id === item.productId);
                return (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border font-mono text-xs ${
                    isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                  }`}>
                    <div className="flex-1">
                      <select
                        value={item.productId}
                        onChange={e => handleItemChange(idx, 'productId', e.target.value)}
                        className={`w-full px-3 py-1.5 border rounded-lg focus:outline-none ${
                          isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                        }`}
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatPrice(p.price)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-20">
                      <select
                        value={item.size}
                        onChange={e => handleItemChange(idx, 'size', e.target.value as ProductSize)}
                        className={`w-full px-2 py-1.5 border rounded-lg text-center focus:outline-none ${
                          isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                        }`}
                      >
                        {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as ProductSize[]).map(sz => (
                          <option key={sz} value={sz}>{sz}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-16">
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className={`w-full px-2 py-1.5 border rounded-lg text-center focus:outline-none ${
                          isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                        }`}
                      />
                    </div>
                    <div className="w-24 text-right font-bold text-amber-600 dark:text-amber-400">
                      {formatPrice((prod?.price || 0) * item.quantity)}
                    </div>
                    {selectedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-1.5 text-neutral-400 hover:text-rose-500 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment & Logistics Grid */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border font-mono text-xs ${
            isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
          }`}>
            <div>
              <label className={`block mb-1 font-bold text-[10px] uppercase ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                  isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                }`}
              >
                <option value="UPI">UPI Direct / QR</option>
                <option value="cashfree">Cashfree PG</option>
                <option value="card">Credit / Debit Card</option>
                <option value="cod">Cash on Delivery (COD)</option>
              </select>
            </div>
            <div>
              <label className={`block mb-1 font-bold text-[10px] uppercase ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Payment Status</label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as any)}
                className={`w-full px-3 py-2 border rounded-lg text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none ${
                  isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
                }`}
              >
                <option value="PAID">PAID</option>
                <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div>
              <label className={`block mb-1 font-bold text-[10px] uppercase ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Special Discount (₹)</label>
              <input
                type="number"
                min="0"
                value={discountAmount}
                onChange={e => setDiscountAmount(Number(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg text-amber-600 dark:text-amber-400 font-bold focus:outline-none ${
                  isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
                }`}
              />
            </div>
          </div>

          {/* Total & Action Footer */}
          <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t font-mono ${
            isDark ? 'border-neutral-800' : 'border-neutral-200'
          }`}>
            <div className="text-sm">
              <span className={`mr-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Grand Total:</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(total)}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-xl border transition cursor-pointer ${
                  isDark 
                    ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' 
                    : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 transition shadow-lg cursor-pointer disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving Order...' : 'Confirm & Create Order'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

