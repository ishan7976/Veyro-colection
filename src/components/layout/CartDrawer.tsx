import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '../../context/NavigationContext';
import { formatPrice } from '../../lib/currency';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, Tag, Truck, Check } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    closeCart,
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
    promoMessage,
    applyPromoCode,
    removePromoCode
  } = useCart();

  const { navigateTo } = useNavigation();

  const [inputCode, setInputCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode) return;
    setIsApplyingPromo(true);
    await applyPromoCode(inputCode);
    setIsApplyingPromo(false);
    setInputCode('');
  };

  const handleProceedToCheckout = () => {
    closeCart();
    navigateTo('checkout');
  };

  const remainingForFreeShipping = Math.max(0, freeShippingGoal - subtotal);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white h-full flex flex-col shadow-2xl border-l border-neutral-200 dark:border-neutral-800 animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-neutral-900 dark:text-white" />
            <h2 className="text-lg font-black tracking-tight uppercase">YOUR BAG ({cart.length})</h2>
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Meter */}
        <div className="p-4 bg-neutral-100 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-amber-500" />
              {remainingForFreeShipping === 0
                ? 'FREE EXPRESS SHIPPING UNLOCKED!'
                : `Add ${formatPrice(remainingForFreeShipping)} for FREE Express Shipping`}
            </span>
            <span>{freeShippingProgress}%</span>
          </div>
          <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 rounded-full"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mx-auto text-neutral-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-neutral-900 dark:text-white">Your bag is empty</p>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Discover the latest VEYRO heavyweight drops and wear your identity.
              </p>
              <button
                onClick={() => {
                  closeCart();
                  navigateTo('shop');
                }}
                className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-black dark:hover:bg-neutral-100 transition shadow-lg"
              >
                Explore Drops
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-3 bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200 dark:border-neutral-800/80"
              >
                <img
                  src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'}
                  alt={item.product.name}
                  className="w-20 h-24 object-cover rounded-xl bg-neutral-200 dark:bg-neutral-900 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">
                        {item.product.name}
                      </h3>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-neutral-400 hover:text-red-500 transition p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500 font-mono">
                      <span className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded text-neutral-800 dark:text-neutral-200">
                        {item.size}
                      </span>
                      <span>• {item.color}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 text-xs font-mono font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-xs font-mono font-black text-neutral-900 dark:text-white">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Promo Code & Order Summary */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-4">
            {/* Promo code form */}
            {promoCode ? (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Code '{promoCode}' (-{formatPrice(promoDiscount)})</span>
                </div>
                <button
                  onClick={removePromoCode}
                  className="text-xs font-bold text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code (e.g. IDENTITY15)"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono focus:outline-none focus:border-neutral-900 dark:focus:border-white"
                />
                <button
                  type="submit"
                  disabled={isApplyingPromo}
                  className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold uppercase rounded-xl hover:bg-black dark:hover:bg-neutral-100 transition"
                >
                  Apply
                </button>
              </form>
            )}

            {/* Calculations Breakdown */}
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
                <span>Estimated Shipping</span>
                <span>{shippingFee === 0 ? 'FREE' : formatPrice(shippingFee)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>GST (18%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-neutral-900 dark:text-white pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <span>Total</span>
                <span className="text-base">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={handleProceedToCheckout}
              className="w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-black dark:hover:bg-neutral-100 transition shadow-2xl flex items-center justify-center gap-2"
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
