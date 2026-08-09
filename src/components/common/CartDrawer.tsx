import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '../../context/NavigationContext';
import { formatPrice } from '../../lib/currency';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, Tag, Truck } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
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

  if (!isCartOpen) return null;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput) return;
    setIsApplying(true);
    await applyPromoCode(promoInput);
    setIsApplying(false);
    setPromoInput('');
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigateTo('checkout');
  };

  const remainingForFreeShipping = Math.max(0, freeShippingGoal - subtotal);

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-fade-in cursor-pointer"
      onClick={() => setIsCartOpen(false)}
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-neutral-950 h-full flex flex-col justify-between shadow-2xl border-l border-neutral-200 dark:border-neutral-800 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <h2 className="font-mono text-sm sm:text-base font-black uppercase tracking-wider text-neutral-900 dark:text-white">
              YOUR BAG ({cart.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="p-2.5 sm:p-3 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 transition-all rounded-full cursor-pointer shadow-xs group"
            aria-label="Close Cart Drawer"
            title="Close Bag"
          >
            <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Free Shipping Meter */}
        <div className="p-4 bg-neutral-100 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 text-xs font-mono">
          <div className="flex justify-between font-bold mb-1.5 text-neutral-800 dark:text-neutral-200">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-500" />
              {remainingForFreeShipping === 0 ? 'FREE EXPRESS SHIPPING UNLOCKED!' : `Add ${formatPrice(remainingForFreeShipping)} for Free Shipping`}
            </span>
            <span>{freeShippingProgress}%</span>
          </div>
          <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-500 rounded-full"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <ShoppingBag className="w-14 h-14 text-neutral-300 dark:text-neutral-700 mx-auto" />
              <p className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-500">Your bag is empty</p>
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  navigateTo('shop');
                }}
                className="px-8 py-3.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs sm:text-sm font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-xl inline-flex items-center justify-center gap-2"
              >
                <span>Explore Drops</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-3.5 bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 items-center justify-between"
              >
                <img
                  src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'}
                  alt={item.product.name}
                  className="w-16 h-20 object-cover rounded-xl bg-neutral-200 dark:bg-neutral-900 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">{item.product.name}</h4>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                    Size: <span className="text-neutral-800 dark:text-neutral-200 font-bold">{item.size}</span> • {item.color}
                  </p>
                  <p className="text-xs font-mono font-black text-neutral-900 dark:text-white mt-1">
                    {formatPrice(item.product.price)}
                  </p>

                  <div className="flex items-center gap-2.5 mt-2">
                    <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-950">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer text-neutral-800 dark:text-neutral-200"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-[11px] font-mono font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer text-neutral-800 dark:text-neutral-200"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 transition cursor-pointer"
                      aria-label="Remove item"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer Summary */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-4">
            {/* Promo Code Form */}
            {promoCode ? (
              <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono">
                <span className="text-emerald-500 font-bold">Code '{promoCode}' (-{formatPrice(promoDiscount)})</span>
                <button 
                  type="button"
                  onClick={removePromoCode} 
                  className="text-[10px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code (e.g. IDENTITY10)"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono uppercase focus:outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
                />
                <button
                  type="submit"
                  disabled={isApplying}
                  className="px-4 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-95 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Apply
                </button>
              </form>
            )}

            <div className="space-y-1.5 text-xs font-mono">
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
              <div className="flex justify-between font-black text-sm text-neutral-900 dark:text-white pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full py-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-black text-xs sm:text-sm uppercase tracking-widest rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
