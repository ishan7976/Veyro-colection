import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { ShippingAddress } from '../../types';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../lib/currency';
import { CreditCard, Truck, ShieldCheck, Lock, CheckCircle2, ArrowRight, Smartphone } from 'lucide-react';

export const CheckoutView: React.FC = () => {
  const { cart, subtotal, discountTotal, promoCode, clearCart, total, shippingFee, tax } = useCart();
  const { user } = useAuth();
  const { navigateTo } = useNavigation();
  const { addToast } = useToast();

  const [address, setAddress] = useState<ShippingAddress>(() => {
    if (user?.addresses && user.addresses[0]) {
      return user.addresses[0];
    }
    return {
      fullName: user?.name || 'Kaelen Vance',
      email: user?.email || 'user@veyro.com',
      phone: '+1 (555) 019-2834',
      address: '742 Mercer Street, Suite 4B',
      city: 'New York',
      state: 'NY',
      zipCode: '10013',
      country: 'United States'
    };
  });

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('express');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'google_pay' | 'cod'>('card');

  // Credit Card fields
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const finalShippingFee = shippingMethod === 'express' ? (subtotal >= 9999 ? 0 : 499) : (subtotal >= 9999 ? 0 : 299);
  const finalTotal = Math.max(0, subtotal - discountTotal + finalShippingFee + tax);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const orderPayload = {
        userId: user?.id,
        items: cart.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          image: item.product?.images?.[0] || '',
          size: item.size,
          color: item.color,
          price: item.product.price,
          quantity: item.quantity
        })),
        shippingAddress: address,
        shippingMethod,
        subtotal,
        discount: discountTotal,
        promoCodeApplied: promoCode || undefined,
        shippingFee: finalShippingFee,
        tax,
        total: finalTotal,
        paymentMethod
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const placedOrder = await res.json();

      if (res.ok) {
        addToast({ title: 'Order Confirmed', message: `Order #${placedOrder.id} placed successfully!`, type: 'success' });
        clearCart();
        navigateTo('order-confirmation', { order: placedOrder });
      } else {
        addToast({ title: 'Order Error', message: placedOrder.error || 'Failed to process order', type: 'error' });
      }
    } catch {
      addToast({ title: 'Connection Error', message: 'Unable to connect to order server', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500">EXPRESS CHECKOUT</span>
        <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight uppercase mt-1">
          COMPLETE YOUR ORDER
        </h1>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Form Steps (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Step 1: Shipping Address */}
          <div className="p-6 bg-white dark:bg-neutral-900/60 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <h3 className="font-mono text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-500" />
              <span>1. Shipping Destination</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={address.fullName}
                  onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={address.email}
                  onChange={(e) => setAddress({ ...address, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={address.address}
                  onChange={(e) => setAddress({ ...address, address: e.target.value })}
                  placeholder="742 Mercer Street, Suite 4B"
                  className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">City</label>
                <input
                  type="text"
                  required
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">State / Zip</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-1/2 px-3 py-2.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    required
                    value={address.zipCode}
                    onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                    className="w-1/2 px-3 py-2.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Shipping Speed */}
          <div className="p-6 bg-white dark:bg-neutral-900/60 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <h3 className="font-mono text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">
              2. Delivery Method
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setShippingMethod('express')}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                  shippingMethod === 'express'
                    ? 'border-neutral-900 dark:border-white bg-neutral-900/5 dark:bg-neutral-800/40 shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">VEYRO Priority Express</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">2-3 Business Days Delivery</p>
                </div>
                <span className="text-xs font-mono font-bold">{subtotal >= 9999 ? 'FREE' : formatPrice(499)}</span>
              </div>

              <div
                onClick={() => setShippingMethod('standard')}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                  shippingMethod === 'standard'
                    ? 'border-neutral-900 dark:border-white bg-neutral-900/5 dark:bg-neutral-800/40 shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">Standard Streetwear Shipping</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">5-7 Business Days</p>
                </div>
                <span className="text-xs font-mono font-bold">{subtotal >= 9999 ? 'FREE' : formatPrice(299)}</span>
              </div>
            </div>
          </div>

          {/* Step 3: Payment Method */}
          <div className="p-6 bg-white dark:bg-neutral-900/60 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <h3 className="font-mono text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>3. Encrypted Payment</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'card', name: 'Credit Card', icon: CreditCard },
                { id: 'apple_pay', name: 'Apple Pay', icon: Smartphone },
                { id: 'google_pay', name: 'Google Pay', icon: Smartphone },
                { id: 'cod', name: 'Pay on Delivery', icon: ShieldCheck }
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3 rounded-2xl border text-xs font-bold font-mono transition flex flex-col items-center gap-1.5 ${
                      paymentMethod === m.id
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-md'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>

            {paymentMethod === 'card' && (
              <div className="p-4 bg-neutral-100 dark:bg-neutral-950 rounded-2xl space-y-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-neutral-400 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-neutral-400 mb-1">Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-neutral-400 mb-1">CVC</label>
                    <input
                      type="password"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Review Sidebar (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900/60 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-6">
          <h3 className="font-mono text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-4">
            BAG RECAP ({cart.length} ITEMS)
          </h3>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-3 items-center text-xs">
                <img
                  src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'}
                  alt={item.product.name}
                  className="w-12 h-14 object-cover rounded-lg bg-neutral-200 dark:bg-neutral-900"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-neutral-900 dark:text-white truncate">{item.product.name}</p>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    {item.size} • {item.color} • Qty: {item.quantity}
                  </p>
                </div>
                <span className="font-mono font-bold text-neutral-900 dark:text-white">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-xs font-mono">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span className="text-neutral-900 dark:text-white">{formatPrice(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-emerald-500 font-bold">
                <span>Discount</span>
                <span>-{formatPrice(discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-500">
              <span>Shipping ({shippingMethod})</span>
              <span>{finalShippingFee === 0 ? 'FREE' : formatPrice(finalShippingFee)}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>GST (18%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between font-black text-lg text-neutral-900 dark:text-white pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <span>Total Payable</span>
              <span>{formatPrice(finalTotal)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || cart.length === 0}
            className="w-full py-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-black text-xs uppercase tracking-widest rounded-2xl hover:opacity-90 transition shadow-2xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Securing Order...</span>
            ) : (
              <>
                <span>Place Order • {formatPrice(finalTotal)}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
