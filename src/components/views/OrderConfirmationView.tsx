import React, { useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import confetti from 'canvas-confetti';
import { formatPrice } from '../../lib/currency';
import { CheckCircle2, PackageCheck, Truck, Clock, ArrowRight, Printer, Share2 } from 'lucide-react';

export const OrderConfirmationView: React.FC = () => {
  const { lastPlacedOrder, navigateTo } = useNavigation();

  useEffect(() => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Fallback
    }
  }, []);

  if (!lastPlacedOrder) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 px-4">
        <PackageCheck className="w-12 h-12 text-neutral-400 mx-auto" />
        <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase">No recent order found</h2>
        <button
          onClick={() => navigateTo('shop')}
          className="px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs uppercase rounded-xl"
        >
          Explore Drops
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-fade-in">
      {/* Confirmation Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase">
          VEYRO IDENTITY CONFIRMED
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight uppercase">
          THANK YOU FOR YOUR ORDER
        </h1>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          We’ve received your order and sent a confirmation email to <span className="font-bold text-neutral-900 dark:text-white">{lastPlacedOrder.shippingAddress.email}</span>.
        </p>
      </div>

      {/* Order Status Timeline Tracker */}
      <div className="p-6 bg-white dark:bg-neutral-900/60 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4 gap-2">
          <div>
            <p className="text-[10px] font-mono text-neutral-400 uppercase">ORDER ID</p>
            <p className="text-lg font-mono font-black text-neutral-900 dark:text-white">{lastPlacedOrder.id}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-neutral-400 uppercase">ESTIMATED DELIVERY</p>
            <p className="text-xs font-mono font-bold text-emerald-500">{lastPlacedOrder.estimatedDelivery}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-neutral-400 uppercase">TRACKING CODE</p>
            <p className="text-xs font-mono font-bold text-neutral-900 dark:text-white">{lastPlacedOrder.trackingNumber}</p>
          </div>
        </div>

        {/* Visual Progress Line */}
        <div className="pt-4 grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
          <div className="space-y-1">
            <div className="w-full h-2 bg-emerald-500 rounded-full" />
            <p className="font-bold text-emerald-500">Confirmed</p>
          </div>
          <div className="space-y-1">
            <div className="w-full h-2 bg-emerald-500 rounded-full" />
            <p className="font-bold text-emerald-500">Processing</p>
          </div>
          <div className="space-y-1">
            <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
            <p className="text-neutral-400">In Transit</p>
          </div>
          <div className="space-y-1">
            <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
            <p className="text-neutral-400">Delivered</p>
          </div>
        </div>
      </div>

      {/* Itemized Order Breakdown */}
      <div className="p-6 bg-white dark:bg-neutral-900/60 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-6">
        <h3 className="font-mono text-xs font-black uppercase text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3">
          RECEIPT DETAILS
        </h3>

        <div className="space-y-3">
          {lastPlacedOrder.items.map((item, idx) => (
            <div key={idx} className="flex gap-4 items-center justify-between text-xs font-sans">
              <div className="flex items-center gap-3">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'}
                  alt={item.name}
                  className="w-12 h-14 object-cover rounded-lg bg-neutral-200 dark:bg-neutral-900"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">{item.name}</p>
                  <p className="text-[10px] font-mono text-neutral-400">
                    Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                  </p>
                </div>
              </div>
              <span className="font-mono font-bold text-neutral-900 dark:text-white">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1.5 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs font-mono">
          <div className="flex justify-between text-neutral-500">
            <span>Subtotal</span>
            <span>{formatPrice(lastPlacedOrder.subtotal)}</span>
          </div>
          {lastPlacedOrder.discount > 0 && (
            <div className="flex justify-between text-emerald-500 font-bold">
              <span>Discount</span>
              <span>-{formatPrice(lastPlacedOrder.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-neutral-500">
            <span>Shipping ({lastPlacedOrder.shippingMethod})</span>
            <span>{lastPlacedOrder.shippingFee === 0 ? 'FREE' : formatPrice(lastPlacedOrder.shippingFee)}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>GST (18%)</span>
            <span>{formatPrice(lastPlacedOrder.tax)}</span>
          </div>
          <div className="flex justify-between font-black text-base text-neutral-900 dark:text-white pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <span>Paid Total</span>
            <span>{formatPrice(lastPlacedOrder.total)}</span>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="p-4 bg-neutral-100 dark:bg-neutral-950 rounded-2xl text-xs space-y-1">
          <p className="font-mono font-bold text-neutral-900 dark:text-white uppercase mb-1">Shipping To:</p>
          <p className="font-bold">{lastPlacedOrder.shippingAddress.fullName}</p>
          <p className="text-neutral-500">{lastPlacedOrder.shippingAddress.address}</p>
          <p className="text-neutral-500">
            {lastPlacedOrder.shippingAddress.city}, {lastPlacedOrder.shippingAddress.state} {lastPlacedOrder.shippingAddress.zipCode}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto px-6 py-3.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>

        <button
          onClick={() => navigateTo('shop')}
          className="w-full sm:w-auto px-8 py-3.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition shadow-xl flex items-center justify-center gap-2"
        >
          <span>Continue Shopping Drops</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
