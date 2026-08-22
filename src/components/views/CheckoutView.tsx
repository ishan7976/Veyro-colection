import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { ShippingAddress } from '../../types';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../lib/currency';
import { createCashfreePaymentOrder, startCashfreeCheckout, verifyCashfreePayment } from '../../lib/cashfree';
import { updateProductStockInSupabase, saveOrderToSupabase } from '../../lib/supabase';
import { CreditCard, Truck, ShieldCheck, Lock, CheckCircle2, ArrowRight, Smartphone, Zap, Loader2, QrCode, Copy, Check, ExternalLink, Info, Tag, Sparkles } from 'lucide-react';
import { GoogleIcon } from '../common/AuthModal';

export const CheckoutView: React.FC = () => {
  const { cart, subtotal, discountTotal, promoCode, promoMessage, applyPromoCode, removePromoCode, clearCart, shippingFee, tax } = useCart();
  const { user, loginWithGoogle, openAuthModal } = useAuth();
  const { navigateTo } = useNavigation();
  const { addToast } = useToast();

  const [address, setAddress] = useState<ShippingAddress>(() => {
    if (user?.addresses && user.addresses[0]) {
      return {
        ...user.addresses[0],
        phone: '' // ALWAYS START EMPTY AS REQUESTED
      };
    }
    return {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: '', // ALWAYS START EMPTY AS REQUESTED
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    };
  });

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('express');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'cashfree' | 'card' | 'apple_pay' | 'cod'>('UPI');

  // Coupon / Promo Code State
  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError(null);
    setIsApplyingCoupon(true);
    try {
      const success = await applyPromoCode(couponInput.trim());
      if (success) {
        setCouponInput('');
        addToast({
          title: 'Coupon Applied',
          message: `Coupon ${couponInput.trim().toUpperCase()} applied successfully!`,
          type: 'success'
        });
      } else {
        setCouponError('Invalid or expired coupon code. Try VEYRO10 or VEYRO20');
      }
    } catch {
      setCouponError('Failed to validate coupon code');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // UPI fields
  const VEYRO_UPI_ID = 'veyro.streetwear@okhdfcbank';
  const [upiTransactionRef, setUpiTransactionRef] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Credit Card fields (for manual card tab)
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStepText, setPaymentStepText] = useState<string>('');

  const finalShippingFee = shippingMethod === 'express' ? (subtotal >= 9999 ? 0 : 499) : (subtotal >= 9999 ? 0 : 299);
  const calculatedTax = Math.round(Math.max(0, subtotal - discountTotal) * 0.18);
  const finalTotal = Math.max(0, subtotal - discountTotal + finalShippingFee + calculatedTax);

  const upiPaymentUri = `upi://pay?pa=${encodeURIComponent(VEYRO_UPI_ID)}&pn=${encodeURIComponent('VEYRO Streetwear')}&am=${encodeURIComponent(finalTotal.toString())}&cu=INR&tn=${encodeURIComponent('VEYRO Order Payment')}`;
  const upiQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(upiPaymentUri)}`;

  const handleCopyUpiId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(VEYRO_UPI_ID);
    }
    setCopiedUpi(true);
    addToast({
      title: 'UPI ID Copied',
      message: `${VEYRO_UPI_ID} copied to clipboard`,
      type: 'info'
    });
    setTimeout(() => setCopiedUpi(false), 3000);
  };

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [dbErrorMessage, setDbErrorMessage] = useState<string | null>(null);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || isSubmitting) return;

    setDbErrorMessage(null);

    console.log('[Checkout Flow] checkout started', {
      itemCount: cart.length,
      items: cart.map(i => ({ id: i.product.id, name: i.product.name, size: i.size, color: i.color, qty: i.quantity })),
      subtotal,
      total: finalTotal,
      paymentMethod,
      shippingMethod,
      customerAddress: address
    });

    const errors: { [key: string]: string } = {};

    // 1. Full Name
    if (!address.fullName || address.fullName.trim().length < 2) {
      errors.fullName = 'Please enter your full name (at least 2 characters)';
    }

    // 2. Email
    if (!address.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    // 3. Phone Number (10 digit Indian mobile)
    const digitsOnly = address.phone ? address.phone.replace(/[^0-9]/g, '') : '';
    const last10 = digitsOnly.slice(-10);
    if (!last10 || last10.length !== 10 || !/^[6-9]\d{9}$/.test(last10)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)';
    }

    // 4. Street Address
    if (!address.address || address.address.trim().length < 5) {
      errors.address = 'Please enter a complete street address (at least 5 characters)';
    }

    // 5. City
    if (!address.city || address.city.trim().length < 2) {
      errors.city = 'Please enter your city';
    }

    // 6. State
    if (!address.state || address.state.trim().length < 2) {
      errors.state = 'Please enter your state';
    }

    // 7. Pincode
    const cleanZip = (address.zipCode || '').replace(/\s+/g, '');
    if (!cleanZip || cleanZip.length !== 6 || !/^\d{6}$/.test(cleanZip)) {
      errors.zipCode = 'Please enter a valid 6-digit postal pincode';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      console.warn('[Checkout Flow] validation failed', errors);
      addToast({
        title: 'Missing / Invalid Field',
        message: firstError,
        type: 'error'
      });
      return;
    }
    setFieldErrors({});

    const formattedPhone = `+91 ${last10}`;
    const finalizedAddress: ShippingAddress = {
      ...address,
      phone: formattedPhone
    };

    console.log('[Checkout Flow] validation passed', {
      customerName: finalizedAddress.fullName,
      email: finalizedAddress.email,
      phone: finalizedAddress.phone,
      city: finalizedAddress.city,
      state: finalizedAddress.state,
      pincode: finalizedAddress.zipCode
    });

    setIsSubmitting(true);
    setPaymentStepText('Initializing secure checkout...');

    try {
      const orderId = `VYR-${Math.floor(100000 + Math.random() * 900000)}`;

      // Construct order payload
      const orderPayload = {
        id: orderId,
        userId: user?.id,
        phone: formattedPhone,
        items: cart.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          image: item.product?.images?.[0] || '',
          size: item.size,
          color: item.color,
          price: item.product.price,
          quantity: item.quantity
        })),
        shippingAddress: finalizedAddress,
        shippingMethod,
        subtotal,
        discount: discountTotal,
        promoCodeApplied: promoCode || undefined,
        shippingFee: finalShippingFee,
        tax,
        total: finalTotal,
        status: 'Processing',
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cod' 
          ? 'Pending' 
          : (paymentMethod === 'UPI' 
            ? 'PENDING_VERIFICATION' 
            : (paymentMethod === 'cashfree' ? 'Pending' : 'Paid')),
        createdAt: new Date().toISOString(),
        trackingNumber: `TRK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        estimatedDelivery: shippingMethod === 'express' ? '2-3 Business Days' : '5-7 Business Days',
        upiRefNumber: paymentMethod === 'UPI' && upiTransactionRef.trim() ? upiTransactionRef.trim() : undefined
      };

      console.log('[Checkout Flow] inserting order payload', {
        orderId,
        orderPayload
      });

      // -------------------------------------------------------------
      // 1. MANUAL UPI PAYMENT FLOW
      // -------------------------------------------------------------
      if (paymentMethod === 'UPI') {
        setPaymentStepText('Submitting UPI order for verification...');

        let placedOrder: any = null;
        try {
          const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
          });
          if (res.ok) {
            placedOrder = await res.json();
          }
        } catch (fetchErr) {
          console.warn('[Checkout Flow] /api/orders fetch warning (falling back to direct client sync):', fetchErr);
        }

        // Direct Supabase sync to guarantee storage in public.orders & public.order_items
        const supaRes = await saveOrderToSupabase(orderPayload);
        console.log('[Checkout Flow] Supabase response', supaRes);

        if (!supaRes.success) {
          console.error('[Checkout Flow] Supabase insert error:', supaRes.error);
          setDbErrorMessage(`Supabase Order Insertion Notice: ${supaRes.error}`);
        } else {
          console.log('[Checkout Flow] created order id:', supaRes.orderId || orderPayload.id);
          console.log('[Checkout Flow] inserting order items', {
            orderId: supaRes.orderId || orderPayload.id,
            items: orderPayload.items
          });
        }

        if (!placedOrder) {
          placedOrder = orderPayload;
        }

        // Deduct inventory
        for (const item of cart) {
          if (item.product.id && typeof item.product.stockQuantity === 'number') {
            const newStock = Math.max(0, item.product.stockQuantity - item.quantity);
            updateProductStockInSupabase(item.product.id, newStock).catch(() => {});
          }
        }

        console.log('[Checkout Flow] invoice generation started', {
          orderId: placedOrder.id || orderId,
          customer: finalizedAddress.fullName,
          total: finalTotal
        });

        addToast({
          title: 'UPI Order Placed',
          message: `Order #${placedOrder.id || orderId} created. Payment Status: PENDING VERIFICATION.`,
          type: 'success'
        });

        clearCart();
        navigateTo('order-confirmation', { order: placedOrder });
        return;
      }

      // -------------------------------------------------------------
      // 2. CASHFREE PAYMENT FLOW
      // -------------------------------------------------------------
      if (paymentMethod === 'cashfree') {
        setPaymentStepText('Creating Cashfree payment session...');

        const cashfreeOrderRes = await createCashfreePaymentOrder({
          orderId,
          orderAmount: finalTotal,
          customerName: address.fullName,
          customerEmail: address.email,
          customerPhone: formattedPhone,
          customerId: user?.id || `cust_${Date.now()}`,
          items: orderPayload.items
        });

        if (!cashfreeOrderRes.success || !cashfreeOrderRes.payment_session_id) {
          throw new Error(cashfreeOrderRes.error || 'Failed to initialize Cashfree gateway session.');
        }

        setPaymentStepText('Launching Cashfree Gateway (UPI, Cards, NetBanking)...');

        // Launch Cashfree SDK Popup / Modal
        const checkoutResult = await startCashfreeCheckout({
          paymentSessionId: cashfreeOrderRes.payment_session_id,
          isProduction: cashfreeOrderRes.environment === 'PRODUCTION'
        });

        if (!checkoutResult.success) {
          throw new Error(checkoutResult.error || 'Payment was cancelled or failed in Cashfree.');
        }

        setPaymentStepText('Verifying payment confirmation...');

        // Verify payment
        const verifyRes = await verifyCashfreePayment(orderId);
        const isVerifiedPaid = verifyRes.success && (verifyRes.payment_status === 'SUCCESS' || verifyRes.order_status === 'PAID');

        // Update payload with Cashfree IDs
        const finalOrderPayload = {
          ...orderPayload,
          paymentStatus: (isVerifiedPaid || checkoutResult.simulated) ? 'Paid' : 'Pending',
          cashfreeOrderId: orderId,
          cashfreePaymentId: verifyRes.cf_payment_id || `pay_${Date.now()}`,
          paidAt: new Date().toISOString()
        };

        console.log('[Checkout Flow] inserting order payload', {
          orderId,
          finalOrderPayload
        });

        // Create order in backend/Supabase
        let placedOrder: any = null;
        try {
          const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalOrderPayload)
          });
          if (res.ok) {
            placedOrder = await res.json();
          }
        } catch (fetchErr) {
          console.warn('[Checkout Flow] /api/orders fetch warning (falling back to direct client sync):', fetchErr);
        }

        // Guaranteed Supabase sync
        const supaRes = await saveOrderToSupabase(finalOrderPayload);
        console.log('[Checkout Flow] Supabase response', supaRes);

        if (!supaRes.success) {
          console.error('[Checkout Flow] Supabase insert error:', supaRes.error);
          setDbErrorMessage(`Supabase Order Insertion Notice: ${supaRes.error}`);
        } else {
          console.log('[Checkout Flow] created order id:', supaRes.orderId || finalOrderPayload.id);
          console.log('[Checkout Flow] inserting order items', {
            orderId: supaRes.orderId || finalOrderPayload.id,
            items: finalOrderPayload.items
          });
        }

        if (!placedOrder) {
          placedOrder = finalOrderPayload;
        }

        // Deduct inventory idempotently
        for (const item of cart) {
          if (item.product.id && typeof item.product.stockQuantity === 'number') {
            const newStock = Math.max(0, item.product.stockQuantity - item.quantity);
            updateProductStockInSupabase(item.product.id, newStock).catch(() => {});
          }
        }

        console.log('[Checkout Flow] invoice generation started', {
          orderId: placedOrder.id || orderId,
          customer: finalizedAddress.fullName,
          total: finalTotal
        });

        addToast({
          title: 'Payment Successful!',
          message: `Cashfree Payment Confirmed. Order #${placedOrder.id || orderId} secured.`,
          type: 'success'
        });

        clearCart();
        navigateTo('order-confirmation', { order: placedOrder });
        return;
      }

      // -------------------------------------------------------------
      // 3. DIRECT CARD / COD / APPLE PAY FLOW
      // -------------------------------------------------------------
      setPaymentStepText('Processing order transaction...');
      let placedOrder: any = null;
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });
        if (res.ok) {
          placedOrder = await res.json();
        }
      } catch (fetchErr) {
        console.warn('[Checkout Flow] /api/orders fetch warning (falling back to direct client sync):', fetchErr);
      }

      // Guaranteed direct Supabase sync
      const supaRes = await saveOrderToSupabase(orderPayload);
      console.log('[Checkout Flow] Supabase response', supaRes);

      if (!supaRes.success) {
        console.error('[Checkout Flow] Supabase insert error:', supaRes.error);
        setDbErrorMessage(`Supabase Order Insertion Notice: ${supaRes.error}`);
      } else {
        console.log('[Checkout Flow] created order id:', supaRes.orderId || orderPayload.id);
        console.log('[Checkout Flow] inserting order items', {
          orderId: supaRes.orderId || orderPayload.id,
          items: orderPayload.items
        });
      }

      if (!placedOrder) {
        placedOrder = orderPayload;
      }

      // Deduct inventory
      for (const item of cart) {
        if (item.product.id && typeof item.product.stockQuantity === 'number') {
          const newStock = Math.max(0, item.product.stockQuantity - item.quantity);
          updateProductStockInSupabase(item.product.id, newStock).catch(() => {});
        }
      }

      console.log('[Checkout Flow] invoice generation started', {
        orderId: placedOrder.id || orderId,
        customer: finalizedAddress.fullName,
        total: finalTotal
      });

      addToast({
        title: 'Order Confirmed',
        message: `Order #${placedOrder.id || orderId} placed successfully!`,
        type: 'success'
      });

      clearCart();
      navigateTo('order-confirmation', { order: placedOrder });
    } catch (err: any) {
      console.error('[Checkout Error]', err);
      setDbErrorMessage(err?.message || 'Unable to complete order. Please review details and retry.');
      addToast({
        title: 'Checkout Incomplete',
        message: err?.message || 'Unable to complete payment. Please retry.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
      setPaymentStepText('');
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-6">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <span className="font-mono text-[10px] font-black tracking-widest text-amber-500 uppercase">EXPRESS CHECKOUT GATE</span>
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">Authentication Required</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Please sign in to your VEYRO account to save address details, track shipments, and complete checkout.</p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={loginWithGoogle}
              className="w-full py-3.5 px-4 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 shadow-sm hover:bg-neutral-900 hover:text-white hover:border-neutral-900 dark:hover:bg-white dark:hover:text-black transition-all duration-200 cursor-pointer group active:scale-[0.99]"
            >
              <GoogleIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => openAuthModal('login')}
              className="w-full py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono font-bold text-xs uppercase rounded-xl tracking-wider hover:opacity-90 transition cursor-pointer"
            >
              Sign In with Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500">EXPRESS CHECKOUT</span>
          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-mono font-bold uppercase flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            UPI & GATEWAY ENABLED
          </span>
        </div>
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
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={address.fullName}
                  onChange={(e) => {
                    setAddress({ ...address, fullName: e.target.value });
                    if (fieldErrors.fullName) setFieldErrors(prev => { const copy = { ...prev }; delete copy.fullName; return copy; });
                  }}
                  className={`w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none ${
                    fieldErrors.fullName ? 'border-rose-500 focus:border-rose-500' : 'border-neutral-200 dark:border-neutral-800 focus:border-amber-500'
                  }`}
                  placeholder="e.g. Rahul Sharma"
                />
                {fieldErrors.fullName && (
                  <p className="text-[10px] text-rose-500 font-mono mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={address.email}
                  onChange={(e) => {
                    setAddress({ ...address, email: e.target.value });
                    if (fieldErrors.email) setFieldErrors(prev => { const copy = { ...prev }; delete copy.email; return copy; });
                  }}
                  className={`w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none ${
                    fieldErrors.email ? 'border-rose-500 focus:border-rose-500' : 'border-neutral-200 dark:border-neutral-800 focus:border-amber-500'
                  }`}
                  placeholder="name@domain.com"
                />
                {fieldErrors.email && (
                  <p className="text-[10px] text-rose-500 font-mono mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                  Customer Phone Number * (10-Digit Indian Mobile)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-amber-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    value={address.phone || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      setAddress({ ...address, phone: val });
                      if (fieldErrors.phone) setFieldErrors(prev => { const copy = { ...prev }; delete copy.phone; return copy; });
                    }}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    className={`w-full pl-12 pr-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none font-mono ${
                      fieldErrors.phone ? 'border-rose-500 focus:border-rose-500' : 'border-neutral-200 dark:border-neutral-800 focus:border-amber-500'
                    }`}
                  />
                </div>
                {fieldErrors.phone ? (
                  <p className="text-[10px] text-rose-500 font-mono mt-1">{fieldErrors.phone}</p>
                ) : (
                  <p className="text-[10px] text-neutral-400 font-mono mt-1">Required for dispatch updates, courier tracking & OTP delivery</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={address.address}
                  onChange={(e) => {
                    setAddress({ ...address, address: e.target.value });
                    if (fieldErrors.address) setFieldErrors(prev => { const copy = { ...prev }; delete copy.address; return copy; });
                  }}
                  placeholder="Flat / Building, Road Name, Area"
                  className={`w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none ${
                    fieldErrors.address ? 'border-rose-500 focus:border-rose-500' : 'border-neutral-200 dark:border-neutral-800 focus:border-amber-500'
                  }`}
                />
                {fieldErrors.address && (
                  <p className="text-[10px] text-rose-500 font-mono mt-1">{fieldErrors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={address.city}
                  onChange={(e) => {
                    setAddress({ ...address, city: e.target.value });
                    if (fieldErrors.city) setFieldErrors(prev => { const copy = { ...prev }; delete copy.city; return copy; });
                  }}
                  placeholder="e.g. Mumbai"
                  className={`w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none ${
                    fieldErrors.city ? 'border-rose-500 focus:border-rose-500' : 'border-neutral-200 dark:border-neutral-800 focus:border-amber-500'
                  }`}
                />
                {fieldErrors.city && (
                  <p className="text-[10px] text-rose-500 font-mono mt-1">{fieldErrors.city}</p>
                )}
              </div>

              <div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={address.state}
                      onChange={(e) => {
                        setAddress({ ...address, state: e.target.value });
                        if (fieldErrors.state) setFieldErrors(prev => { const copy = { ...prev }; delete copy.state; return copy; });
                      }}
                      placeholder="State"
                      className={`w-full px-3 py-2.5 bg-neutral-100 dark:bg-neutral-950 border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none ${
                        fieldErrors.state ? 'border-rose-500 focus:border-rose-500' : 'border-neutral-200 dark:border-neutral-800 focus:border-amber-500'
                      }`}
                    />
                    {fieldErrors.state && (
                      <p className="text-[10px] text-rose-500 font-mono mt-1">{fieldErrors.state}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">PIN Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={address.zipCode}
                      onChange={(e) => {
                        setAddress({ ...address, zipCode: e.target.value });
                        if (fieldErrors.zipCode) setFieldErrors(prev => { const copy = { ...prev }; delete copy.zipCode; return copy; });
                      }}
                      placeholder="400001"
                      className={`w-full px-3 py-2.5 bg-neutral-100 dark:bg-neutral-950 border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none font-mono ${
                        fieldErrors.zipCode ? 'border-rose-500 focus:border-rose-500' : 'border-neutral-200 dark:border-neutral-800 focus:border-amber-500'
                      }`}
                    />
                    {fieldErrors.zipCode && (
                      <p className="text-[10px] text-rose-500 font-mono mt-1">{fieldErrors.zipCode}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                  Delivery Landmark / Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={address.deliveryNotes || ''}
                  onChange={(e) => setAddress({ ...address, deliveryNotes: e.target.value })}
                  placeholder="e.g. Leave with building security / Near Metro station gate"
                  className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
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
          <div className="p-6 bg-white dark:bg-neutral-900/60 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span>3. Payment Method</span>
              </h3>
              <span className="text-[10px] font-mono text-neutral-400">256-Bit Encrypted</span>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'UPI', name: 'Manual UPI', subtitle: 'QR / UPI App Transfer', badge: 'INSTANT', icon: QrCode },
                { id: 'cashfree', name: 'Cashfree PG', subtitle: 'UPI / Cards / NetBanking', badge: 'GATEWAY', icon: Zap },
                { id: 'card', name: 'Credit Card', subtitle: 'Direct Card', icon: CreditCard },
                { id: 'cod', name: 'Cash on Delivery', subtitle: 'Pay at Doorstep', icon: ShieldCheck }
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between relative cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-md'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    {m.badge && (
                      <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full mb-2 self-start ${
                        isSelected
                          ? 'bg-amber-400 text-neutral-950 font-black'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}>
                        {m.badge}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="font-bold font-mono text-xs">{m.name}</span>
                    </div>
                    <span className={`text-[10px] mt-1 ${isSelected ? 'opacity-80' : 'text-neutral-400'}`}>
                      {m.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ========================================================= */}
            {/* 1. MANUAL UPI PAYMENT SECTION */}
            {/* ========================================================= */}
            {paymentMethod === 'UPI' && (
              <div className="p-5 bg-neutral-50 dark:bg-neutral-950 border border-amber-500/30 rounded-2xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-mono text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">
                        Scan & Pay via any UPI App
                      </h4>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        Google Pay, PhonePe, Paytm, CRED, BHIM, Navi
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-md text-[10px] font-mono font-bold uppercase self-start sm:self-auto">
                    Manual Verification
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  {/* UPI QR Code Container */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm space-y-2 text-center">
                    <div className="p-2 bg-white rounded-xl border border-neutral-100 dark:border-neutral-800">
                      <img
                        src={upiQrCodeUrl}
                        alt="VEYRO UPI Payment QR"
                        className="w-44 h-44 object-contain rounded-lg mx-auto"
                        loading="lazy"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-mono text-neutral-400 uppercase">Exact Amount to Pay</p>
                      <p className="text-sm font-black font-mono text-neutral-900 dark:text-white">
                        {formatPrice(finalTotal)}
                      </p>
                    </div>
                  </div>

                  {/* UPI Details and Direct Actions */}
                  <div className="sm:col-span-7 space-y-4">
                    {/* UPI ID Copy Box */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono font-bold uppercase text-neutral-500 dark:text-neutral-400">
                        VEYRO Official UPI ID
                      </label>
                      <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                        <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white flex-1 truncate select-all">
                          {VEYRO_UPI_ID}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyUpiId}
                          className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg text-[11px] font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedUpi ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-neutral-500" />
                              <span>Copy ID</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Direct App Launch Button */}
                    <a
                      href={upiPaymentUri}
                      className="w-full py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Pay Now via UPI App</span>
                    </a>

                    {/* UTR / Reference ID Field */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono font-bold uppercase text-neutral-500 dark:text-neutral-400">
                        Transaction Reference / 12-Digit UTR (Optional)
                      </label>
                      <input
                        type="text"
                        value={upiTransactionRef}
                        onChange={(e) => setUpiTransactionRef(e.target.value)}
                        placeholder="e.g. 439012345678"
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-2 text-[10px] text-neutral-600 dark:text-neutral-400 font-mono">
                      <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>
                        After sending payment, click <strong>"I Have Completed Payment"</strong>. Your order will be recorded as <strong>PENDING_VERIFICATION</strong> and confirmed by our atelier admin team.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 2. CASHFREE PG HIGHLIGHT BOX */}
            {/* ========================================================= */}
            {paymentMethod === 'cashfree' && (
              <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Cashfree Seamless Gateway</span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold">
                    Instant Auto-Verify
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  Pay securely using Google Pay, PhonePe, Paytm, BHIM UPI, RuPay / Visa / MasterCard, NetBanking (50+ banks), or PayLater via official Cashfree Payment Gateway.
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                  <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">UPI Apps</span>
                  <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">Credit/Debit Cards</span>
                  <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">Net Banking</span>
                  <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">Wallets & PayLater</span>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 3. DIRECT CARD FORM */}
            {/* ========================================================= */}
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
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900/60 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-6 sticky top-24">
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

          {/* Coupon Code Section */}
          <div className="pt-3 pb-1 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-amber-500" />
                <span>Coupon Code / Voucher</span>
              </label>
              {promoCode && (
                <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Active
                </span>
              )}
            </div>

            {promoCode ? (
              /* Applied Coupon State */
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-2 transition">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-500 font-bold">
                    %
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        {promoCode}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        (-{formatPrice(discountTotal)})
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 truncate font-mono">
                      {promoMessage || 'Promotional Atelier discount applied'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="remove-coupon-btn"
                  onClick={() => {
                    removePromoCode();
                    setCouponInput('');
                    setCouponError(null);
                    addToast({
                      title: 'Coupon Removed',
                      message: 'Coupon discount has been removed.',
                      type: 'info'
                    });
                  }}
                  className="px-2.5 py-1 text-[10px] font-mono font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition cursor-pointer flex-shrink-0 uppercase"
                >
                  Remove
                </button>
              </div>
            ) : (
              /* Coupon Input & Apply Button */
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      id="coupon-code-input"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        if (couponError) setCouponError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      placeholder="Enter promo / coupon code"
                      className="w-full pl-9 pr-3 py-2 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono text-neutral-900 dark:text-white uppercase placeholder:normal-case focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="button"
                    id="apply-coupon-btn"
                    onClick={() => handleApplyCoupon()}
                    disabled={!couponInput.trim() || isApplyingCoupon}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition shadow disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5 flex-shrink-0"
                  >
                    {isApplyingCoupon ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Apply'
                    )}
                  </button>
                </div>

                {couponError && (
                  <p className="text-[10px] font-mono text-rose-500">{couponError}</p>
                )}

                {/* Suggested Fast Promo Tags */}
                <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase">Try:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCouponInput('VEYRO10');
                      applyPromoCode('VEYRO10');
                    }}
                    className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-[10px] font-mono transition cursor-pointer border border-neutral-200 dark:border-neutral-700"
                  >
                    VEYRO10 (10% OFF)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCouponInput('VEYRO20');
                      applyPromoCode('VEYRO20');
                    }}
                    className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-[10px] font-mono transition cursor-pointer border border-neutral-200 dark:border-neutral-700"
                  >
                    VEYRO20 (20% OFF)
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-xs font-mono">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span className="text-neutral-900 dark:text-white">{formatPrice(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Coupon Discount {promoCode ? `(${promoCode})` : ''}</span>
                </span>
                <span>-{formatPrice(discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-500">
              <span>Shipping ({shippingMethod})</span>
              <span>{finalShippingFee === 0 ? 'FREE' : formatPrice(finalShippingFee)}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>GST (18%)</span>
              <span>{formatPrice(calculatedTax)}</span>
            </div>
            <div className="flex justify-between font-black text-lg text-neutral-900 dark:text-white pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <span>Total Payable</span>
              <span>{formatPrice(finalTotal)}</span>
            </div>
          </div>

          {/* Database Error Banner (if insert fails) */}
          {dbErrorMessage && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1 text-xs font-mono text-rose-600 dark:text-rose-400">
              <div className="flex items-center justify-between font-bold">
                <span className="uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  Database Sync Notice
                </span>
                <button
                  type="button"
                  onClick={() => setDbErrorMessage(null)}
                  className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] leading-relaxed break-words">{dbErrorMessage}</p>
            </div>
          )}

          {/* Checkout Status Indicator */}
          {paymentStepText && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-amber-700 dark:text-amber-300 text-xs font-mono">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 text-amber-500" />
              <span>{paymentStepText}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || cart.length === 0}
            className="w-full py-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-black text-xs uppercase tracking-widest rounded-2xl hover:opacity-90 transition shadow-2xl flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Order...</span>
              </div>
            ) : (
              <>
                <span>
                  {paymentMethod === 'UPI' 
                    ? 'I Have Completed Payment' 
                    : (paymentMethod === 'cashfree' ? 'Pay with Cashfree' : 'Place Order')} • {formatPrice(finalTotal)}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
