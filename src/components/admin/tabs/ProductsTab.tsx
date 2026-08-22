import React from 'react';
import { Product } from '../../../types';
import { formatPrice } from '../../../lib/currency';
import { useTheme } from '../../../context/ThemeContext';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

interface ProductsTabProps {
  products: Product[];
  filteredProducts: Product[];
  productSearch: string;
  setProductSearch: (s: string) => void;
  productCategoryFilter: string;
  setProductCategoryFilter: (c: string) => void;
  productViewMode: 'grid' | 'table';
  setProductViewMode: (mode: 'grid' | 'table') => void;
  onAddNewProduct: () => void;
  onEditProduct: (p: Product) => void;
  onDeleteProductPrompt: (id: string) => void;
  onAdjustStock: (p: Product, delta: number) => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  filteredProducts,
  productSearch,
  setProductSearch,
  productCategoryFilter,
  setProductCategoryFilter,
  productViewMode,
  setProductViewMode,
  onAddNewProduct,
  onEditProduct,
  onDeleteProductPrompt,
  onAdjustStock
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6 font-mono">
      
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-xl font-bold uppercase tracking-wider ${
            isDark ? 'text-white' : 'text-neutral-950'
          }`}>
            Garment Catalog & Drops Management
          </h2>
          <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            {filteredProducts.length} Streetwear pieces synchronized with Supabase
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => setProductViewMode(productViewMode === 'grid' ? 'table' : 'grid')}
            className={`px-3 py-2 border rounded-xl transition cursor-pointer font-bold ${
              isDark 
                ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white' 
                : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:text-neutral-950 shadow-xs'
            }`}
          >
            {productViewMode === 'grid' ? 'Table View' : 'Grid View'}
          </button>
          <button
            onClick={onAddNewProduct}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold uppercase rounded-xl transition shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Garment</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row gap-3 text-xs transition ${
        isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search title, category, slug..."
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 border rounded-xl focus:outline-none transition ${
              isDark 
                ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-amber-500' 
                : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-amber-500'
            }`}
          />
        </div>

        <select
          value={productCategoryFilter}
          onChange={e => setProductCategoryFilter(e.target.value)}
          className={`px-3 py-2 border rounded-xl focus:outline-none transition ${
            isDark 
              ? 'bg-neutral-900 border-neutral-800 text-white' 
              : 'bg-neutral-50 border-neutral-300 text-neutral-900'
          }`}
        >
          <option value="All">All Categories</option>
          <option value="Oversized T-Shirts">Oversized T-Shirts</option>
          <option value="Graphic T-Shirts">Graphic T-Shirts</option>
          <option value="Hoodies">Hoodies & Outerwear</option>
          <option value="Limited Edition Drops">Limited Edition Drops</option>
        </select>
      </div>

      {/* Products Grid View */}
      {productViewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(prod => (
            <div
              key={prod.id}
              className={`rounded-2xl border overflow-hidden transition group flex flex-col justify-between ${
                isDark 
                  ? 'bg-neutral-950 border-neutral-800 hover:border-amber-500/40' 
                  : 'bg-white border-neutral-200 hover:border-amber-500/40 shadow-sm'
              }`}
            >
              {/* Image */}
              <div className={`h-56 relative overflow-hidden ${isDark ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
                <img
                  src={prod.images?.[0] || prod.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                {prod.isLimitedDrop && (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[9px] font-bold uppercase bg-amber-500 text-neutral-950 rounded shadow-sm">
                    LIMITED DROP
                  </span>
                )}
                <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                  (prod.stockQuantity || 0) < 5
                    ? 'bg-rose-500 text-white'
                    : isDark 
                      ? 'bg-neutral-900/90 text-neutral-200 border border-neutral-700' 
                      : 'bg-white/90 text-neutral-900 border border-neutral-300 shadow-sm'
                }`}>
                  {prod.stockQuantity} Units
                </span>
              </div>

              {/* Details */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-amber-500 font-bold uppercase">{prod.category}</div>
                  <h3 className={`font-bold text-sm mt-0.5 truncate ${isDark ? 'text-white' : 'text-neutral-950'}`}>
                    {prod.name}
                  </h3>
                  <div className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {prod.gsm} GSM • {prod.fit}
                  </div>
                </div>

                <div className={`pt-2 border-t flex items-center justify-between ${
                  isDark ? 'border-neutral-800' : 'border-neutral-200'
                }`}>
                  <div>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPrice(prod.price)}
                    </span>
                    {prod.originalPrice && (
                      <span className={`text-xs line-through ml-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        {formatPrice(prod.originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Stock Stepper */}
                  <div className={`flex items-center gap-1 border rounded-lg p-1 text-xs ${
                    isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
                  }`}>
                    <button
                      onClick={() => onAdjustStock(prod, -1)}
                      className={`w-5 h-5 flex items-center justify-center rounded cursor-pointer ${
                        isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-600 hover:text-neutral-950 hover:bg-white'
                      }`}
                    >
                      -
                    </button>
                    <span className={`w-6 text-center font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>
                      {prod.stockQuantity || 0}
                    </span>
                    <button
                      onClick={() => onAdjustStock(prod, 1)}
                      className={`w-5 h-5 flex items-center justify-center rounded cursor-pointer ${
                        isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-600 hover:text-neutral-950 hover:bg-white'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Card Actions */}
                <div className={`grid grid-cols-2 gap-2 pt-2 border-t text-xs ${
                  isDark ? 'border-neutral-800' : 'border-neutral-200'
                }`}>
                  <button
                    onClick={() => onEditProduct(prod)}
                    className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer font-bold ${
                      isDark 
                        ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200' 
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    <Edit className="w-3.5 h-3.5 text-amber-500" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => onDeleteProductPrompt(prod.id)}
                    className="py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className={`p-6 rounded-2xl border overflow-x-auto text-xs transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <table className="w-full text-left">
            <thead>
              <tr className={`border-b text-[11px] ${
                isDark ? 'border-neutral-800 text-neutral-400' : 'border-neutral-200 text-neutral-600'
              }`}>
                <th className="py-3 px-3">Garment</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3">Stock Units</th>
                <th className="py-3 px-3">GSM & Fit</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-neutral-800' : 'divide-neutral-100'}`}>
              {filteredProducts.map(prod => (
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
                      <div className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>{prod.slug}</div>
                    </div>
                  </td>
                  <td className={`py-3 px-3 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>{prod.category}</td>
                  <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(prod.price)}</td>
                  <td className="py-3 px-3 font-bold">
                    <span className={(prod.stockQuantity || 0) < 5 ? 'text-rose-500' : isDark ? 'text-neutral-200' : 'text-neutral-800'}>
                      {prod.stockQuantity} Pcs
                    </span>
                  </td>
                  <td className={`py-3 px-3 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{prod.gsm} GSM • {prod.fit}</td>
                  <td className="py-3 px-3 text-right space-x-2">
                    <button
                      onClick={() => onEditProduct(prod)}
                      className={`p-1.5 rounded transition cursor-pointer ${
                        isDark ? 'bg-neutral-900 hover:bg-neutral-800 text-amber-400' : 'bg-neutral-100 hover:bg-neutral-200 text-amber-600'
                      }`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteProductPrompt(prod.id)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded text-rose-600 dark:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
