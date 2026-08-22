import React from 'react';
import { Product, Order } from '../../../types';
import { formatPrice } from '../../../lib/currency';
import { useTheme } from '../../../context/ThemeContext';
import { TrendingUp, PieChart, Award, DollarSign } from 'lucide-react';

interface AnalyticsTabProps {
  products: Product[];
  orders: Order[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ products, orders }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Category sales breakdown
  const categoryMap: Record<string, number> = {};
  orders.forEach(o => {
    o.items.forEach(it => {
      const prod = products.find(p => p.id === it.productId);
      const cat = prod?.category || 'Streetwear';
      categoryMap[cat] = (categoryMap[cat] || 0) + (it.price * it.quantity);
    });
  });

  const totalSales = Object.values(categoryMap).reduce((a, b) => a + b, 0) || 1;

  // Best selling products leaderboard
  const productSalesMap: Record<string, { name: string; units: number; revenue: number; image: string }> = {};
  orders.forEach(o => {
    o.items.forEach(it => {
      const prod = products.find(p => p.id === it.productId);
      if (!productSalesMap[it.productId]) {
        productSalesMap[it.productId] = {
          name: prod?.name || it.productId,
          units: 0,
          revenue: 0,
          image: prod?.images?.[0] || prod?.image_url || ''
        };
      }
      productSalesMap[it.productId].units += it.quantity;
      productSalesMap[it.productId].revenue += it.price * it.quantity;
    });
  });

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* Header */}
      <div>
        <h2 className={`text-xl font-bold uppercase tracking-wider ${
          isDark ? 'text-white' : 'text-neutral-950'
        }`}>
          Streetwear Analytics & Revenue Intelligence
        </h2>
        <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
          Category market share, top converting drops, and velocity metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Share */}
        <div className={`p-6 rounded-2xl border space-y-4 transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-bold uppercase tracking-wider text-sm flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-neutral-950'
            }`}>
              <PieChart className="w-4 h-4 text-amber-500" />
              <span>Revenue by Garment Category</span>
            </h3>
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>Share of GMV</span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(categoryMap).map(([cat, val]) => {
              const pct = Math.round((val / totalSales) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>{cat}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatPrice(val)} ({pct}%)</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${
                    isDark ? 'bg-neutral-900' : 'bg-neutral-100'
                  }`}>
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Garments Leaderboard */}
        <div className={`p-6 rounded-2xl border space-y-4 transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-bold uppercase tracking-wider text-sm flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-neutral-950'
            }`}>
              <Award className="w-4 h-4 text-amber-500" />
              <span>Best-Selling Atelier Drops</span>
            </h3>
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>Top Grossing</span>
          </div>

          <div className="space-y-3 pt-1">
            {topProducts.map((p, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between transition ${
                  isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 text-center font-bold text-amber-500 text-sm">
                    #{idx + 1}
                  </div>
                  {p.image && (
                    <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />
                  )}
                  <div>
                    <div className={`font-bold truncate max-w-[150px] sm:max-w-[200px] ${
                      isDark ? 'text-white' : 'text-neutral-950'
                    }`}>
                      {p.name}
                    </div>
                    <div className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      {p.units} Units Sold
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(p.revenue)}</div>
                  <div className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">Top Seller</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
