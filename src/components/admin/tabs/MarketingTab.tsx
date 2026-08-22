import React from 'react';
import { PromoCode } from '../../../types';
import { formatPrice } from '../../../lib/currency';
import { useTheme } from '../../../context/ThemeContext';
import { Tag, Plus, Trash2, CheckCircle2, Ticket } from 'lucide-react';

interface MarketingTabProps {
  promoCodes: PromoCode[];
  newPromoCode: string;
  setNewPromoCode: (s: string) => void;
  newPromoDiscount: string;
  setNewPromoDiscount: (s: string) => void;
  newPromoMinOrder: string;
  setNewPromoMinOrder: (s: string) => void;
  onCreatePromoCode: (e: React.FormEvent) => void;
  onDeletePromo: (code: string) => void;
}

export const MarketingTab: React.FC<MarketingTabProps> = ({
  promoCodes,
  newPromoCode,
  setNewPromoCode,
  newPromoDiscount,
  setNewPromoDiscount,
  newPromoMinOrder,
  setNewPromoMinOrder,
  onCreatePromoCode,
  onDeletePromo
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* Header */}
      <div>
        <h2 className={`text-xl font-bold uppercase tracking-wider ${
          isDark ? 'text-white' : 'text-neutral-950'
        }`}>
          Marketing & Coupon Campaign Engine
        </h2>
        <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
          Create checkout promotional coupons, drop codes, and cart discount rules
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create Coupon Form */}
        <div className={`p-6 rounded-2xl border space-y-4 transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-500" />
            <h3 className={`font-bold uppercase tracking-wider text-sm ${isDark ? 'text-white' : 'text-neutral-950'}`}>
              Create New Promo Code
            </h3>
          </div>

          <form onSubmit={onCreatePromoCode} className="space-y-3">
            <div>
              <label className={`block font-bold text-[10px] uppercase mb-1 ${
                isDark ? 'text-neutral-400' : 'text-neutral-700'
              }`}>
                Promo Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. VEYRO20, ACIDWASH"
                value={newPromoCode}
                onChange={e => setNewPromoCode(e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none uppercase font-bold transition ${
                  isDark 
                    ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-amber-500' 
                    : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-amber-500'
                }`}
              />
            </div>

            <div>
              <label className={`block font-bold text-[10px] uppercase mb-1 ${
                isDark ? 'text-neutral-400' : 'text-neutral-700'
              }`}>
                Discount Percentage (%)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                required
                value={newPromoDiscount}
                onChange={e => setNewPromoDiscount(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none font-bold transition ${
                  isDark 
                    ? 'bg-neutral-900 border-neutral-800 text-white focus:border-amber-500' 
                    : 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-amber-500'
                }`}
              />
            </div>

            <div>
              <label className={`block font-bold text-[10px] uppercase mb-1 ${
                isDark ? 'text-neutral-400' : 'text-neutral-700'
              }`}>
                Min Order Value (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={newPromoMinOrder}
                onChange={e => setNewPromoMinOrder(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none font-bold transition ${
                  isDark 
                    ? 'bg-neutral-900 border-neutral-800 text-white focus:border-amber-500' 
                    : 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-amber-500'
                }`}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold uppercase rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Deploy Promo Code</span>
            </button>
          </form>
        </div>

        {/* Live Active Codes */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border space-y-4 transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-bold uppercase tracking-wider text-sm flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-neutral-950'
            }`}>
              <Ticket className="w-4 h-4 text-amber-500" />
              <span>Active Checkout Discount Codes</span>
            </h3>
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>Auto-applied in cart</span>
          </div>

          <div className="space-y-3">
            {promoCodes.map((code) => (
              <div
                key={code.id || code.code}
                className={`p-4 rounded-xl border flex items-center justify-between transition ${
                  isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold text-sm">
                    {code.code}
                  </div>
                  <div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      {code.discountPercent}% OFF (Min Order: {formatPrice(code.minOrderValue)})
                    </div>
                    <div className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      Used {code.timesUsed} times • Valid through {code.expiresAt || '2026-12-31'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    LIVE
                  </span>
                  <button
                    onClick={() => onDeletePromo(code.code)}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition cursor-pointer"
                    title="Deactivate Code"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
