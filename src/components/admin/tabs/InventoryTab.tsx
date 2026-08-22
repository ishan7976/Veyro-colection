import React from 'react';
import { Product } from '../../../types';
import { formatPrice } from '../../../lib/currency';
import { useTheme } from '../../../context/ThemeContext';
import { Boxes, AlertTriangle, CheckCircle, ArrowDownRight, Package } from 'lucide-react';

interface InventoryTabProps {
  products: Product[];
  onAdjustStock: (p: Product, delta: number) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({ products, onAdjustStock }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const totalStockUnits = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
  const totalStockValue = products.reduce((sum, p) => sum + (p.price * (p.stockQuantity || 0)), 0);
  const lowStockCount = products.filter(p => (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) <= 5).length;
  const outOfStockCount = products.filter(p => (p.stockQuantity || 0) === 0).length;

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* Header */}
      <div>
        <h2 className={`text-xl font-bold uppercase tracking-wider ${
          isDark ? 'text-white' : 'text-neutral-950'
        }`}>
          Warehouse Stock & Inventory Health
        </h2>
        <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
          Real-time SKU quantities, batch replenishment and low-stock triggers
        </p>
      </div>

      {/* Stock Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className={`p-4 rounded-2xl border transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            <span>Total Units In Stock</span>
            <Boxes className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-2xl font-bold mt-2 ${isDark ? 'text-white' : 'text-neutral-950'}`}>
            {totalStockUnits} Pcs
          </div>
          <span className="text-[10px] text-emerald-500 font-bold mt-1 block">Across {products.length} Garments</span>
        </div>

        <div className={`p-4 rounded-2xl border transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            <span>Total Asset Value</span>
            <Package className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            {formatPrice(totalStockValue)}
          </div>
          <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'} mt-1 block`}>Cost of inventory</span>
        </div>

        <div className={`p-4 rounded-2xl border transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            <span>Low Stock Alert (&le;5)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500 mt-2">
            {lowStockCount} SKUs
          </div>
          <span className="text-[10px] text-amber-500 font-bold mt-1 block">Reorder suggested</span>
        </div>

        <div className={`p-4 rounded-2xl border transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            <span>Out of Stock</span>
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-500 mt-2">
            {outOfStockCount} SKUs
          </div>
          <span className="text-[10px] text-rose-500 font-bold mt-1 block">0 units available</span>
        </div>

      </div>

      {/* Stock Management Table */}
      <div className={`p-6 rounded-2xl border overflow-x-auto transition ${
        isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <table className="w-full text-left">
          <thead>
            <tr className={`border-b text-[11px] ${
              isDark ? 'border-neutral-800 text-neutral-400' : 'border-neutral-200 text-neutral-600'
            }`}>
              <th className="py-3 px-3">Garment & SKU</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Unit Price</th>
              <th className="py-3 px-3">Stock Units</th>
              <th className="py-3 px-3">Stock Status</th>
              <th className="py-3 px-3 text-right">Instant Inventory Stepper</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-neutral-800/70' : 'divide-neutral-100'}`}>
            {products.map(prod => (
              <tr key={prod.id} className={`transition ${
                isDark ? 'hover:bg-neutral-900/40' : 'hover:bg-neutral-50'
              }`}>
                <td className="py-3 px-3 flex items-center gap-3">
                  <img
                    src={prod.images?.[0] || prod.image_url}
                    alt={prod.name}
                    className={`w-10 h-10 rounded-lg object-cover ${isDark ? 'bg-neutral-900' : 'bg-neutral-100'}`}
                  />
                  <div>
                    <div className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>{prod.name}</div>
                    <div className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>SKU: {prod.slug}</div>
                  </div>
                </td>
                <td className={`py-3 px-3 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>{prod.category}</td>
                <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(prod.price)}</td>
                <td className={`py-3 px-3 font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-950'}`}>
                  {prod.stockQuantity || 0} Pcs
                </td>
                <td className="py-3 px-3">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                    (prod.stockQuantity || 0) === 0
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      : (prod.stockQuantity || 0) <= 5
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {(prod.stockQuantity || 0) === 0
                      ? 'Out of Stock'
                      : (prod.stockQuantity || 0) <= 5
                        ? 'Low Stock (Reorder)'
                        : 'Optimal Stock'}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      onClick={() => onAdjustStock(prod, -5)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                        isDark ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                      }`}
                      title="Reduce 5 units"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => onAdjustStock(prod, -1)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                        isDark ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                      }`}
                      title="Reduce 1 unit"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => onAdjustStock(prod, 1)}
                      className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold transition cursor-pointer"
                      title="Add 1 unit"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => onAdjustStock(prod, 5)}
                      className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded text-[10px] font-bold transition cursor-pointer"
                      title="Add 5 units (Batch Restock)"
                    >
                      +5
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
