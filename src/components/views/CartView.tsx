import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '../../context/NavigationContext';
import { formatPrice } from '../../lib/currency';
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight, Tag, Truck, ShieldCheck, ArrowLeft } from 'lucide-react';

export const CartView: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    subtotal,
    discountTotal,
    shippingFee,
    tax,
    total,
    freeShippingGoal,
    freeShippingProgress,
    promoCode,
    promoDiscount,
    applyPromoCode,
    removePromoCode
  } = useCart();

  const { navigateTo } = useNavigation();
  const [promoInput, setPromoInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput) return;
    setIsApplying(true);
    await applyPromoCode(promoInput);
    setIsApplying(false);
    setPromoInput('');
  };

  const remaining = Math.max(0, freeShippingGoal - subtotal);

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mx-auto text-neutral-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-neutral-900 dark:text-white uppercase">Your Bag is Empty</h2>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
          Explore our heavy cotton oversized tees, hoodies, and limited drops to build your look.
        </p>
        <button
          onClick={() => navigateTo('shop')}
          className="px-8 py-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-black text-xs uppercase tracking-widest rounded-2xl hover:opacity-90 transition shadow-xl inline-flex items-center gap-2"
        >
          <span>Explore VEYRO Drops</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500">CHECKOUT PREPARATION</span>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight uppercase mt-1">
            SHOPPING BAG ({cart.length})
          </h1>
        </div>
        <button
          onClick={() => navigateTo('shop')}
          className="text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>
      </div>

      {/* Free shipping meter */}
      <div className="p-4 bg-neutral-100 dark:bg-neutral-900/60 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between text-xs font-mono font-bold mb-2">
          <span className="flex items-center gap-2 text-neutral-900 dark:text-white">
            <Truck className="w-4 h-4 text-amber-500" />
            {remaining === 0 ? 'FREE EXPRESS SHIPPING UNLOCKED!' : `Add ${formatPrice(remaining)} more for Free Express Shipping`}
          </span>
          <span>{freeShippingProgress}%</span>
        </div>
        <div className="w-full h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 rounded-full"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-white dark:bg-neutral-900/60 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
            >
              <div className="flex gap-4 items-center min-w-0">
                <img
                  src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'}
                  alt={item.product.name}
                  className="w-20 h-24 object-cover rounded-xl bg-neutral-200 dark:bg-neutral-900 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase text-amber-500 font-bold">{item.product.category}</span>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate">{item.product.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 font-mono">
                    <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded font-bold text-neutral-800 dark:text-neutral-200">
                      {item.size}
                    </span>
                    <span>• {item.color}</span>
                    <span>• {item.product.gsm} GSM</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
                {/* Quantity */}
                <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-xl overflow-hidden bg-neutral-50 dark:bg-neutral-950">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-mono font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="text-sm font-mono font-black text-neutral-900 dark:text-white">
                  {formatPrice(item.product.price * item.quantity)}
                </span>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-neutral-400 hover:text-red-500 transition"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 bg-white dark:bg-neutral-900/60 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-6">
          <h3 className="font-mono text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-4">
            ORDER SUMMARY
          </h3>

          {/* Promo code */}
          {promoCode ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-500 font-bold">Code '{promoCode}' (-{formatPrice(promoDiscount)})</span>
              <button onClick={removePromoCode} className="text-xs text-neutral-400 hover:text-white underline">
                Remove
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <input
                type="text"
                placeholder="Promo Code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono focus:outline-none"
              />
              <button
                type="submit"
                disabled={isApplying}
                className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold uppercase rounded-xl"
              >
                Apply
              </button>
            </form>
          )}

          {/* Totals Breakdown */}
          <div className="space-y-2 text-xs font-mono">
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
              <span>Shipping</span>
              <span>{shippingFee === 0 ? 'FREE' : formatPrice(shippingFee)}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>GST (18%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between font-black text-base text-neutral-900 dark:text-white pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <button
            onClick={() => navigateTo('checkout')}
            className="w-full py-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-black text-xs uppercase tracking-widest rounded-2xl hover:opacity-90 transition shadow-xl flex items-center justify-center gap-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
