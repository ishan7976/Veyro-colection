import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { ProductCard } from '../common/ProductCard';
import { QuickViewModal } from '../common/QuickViewModal';
import { Product, ProductSize } from '../../types';
import { formatPrice } from '../../lib/currency';
import { Filter, SlidersHorizontal, Search, X, Grid2X2, Grid3X3, LayoutGrid, RotateCcw } from 'lucide-react';

export const ShopView: React.FC = () => {
  const { filters, setFilters, resetFilters } = useNavigation();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(4);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const categories = ['All', 'Oversized T-Shirts', 'Graphic T-Shirts', 'Hoodies', 'Limited Edition Drops'];
  const allSizes: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const fetchFilteredProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters.category && filters.category !== 'All') queryParams.set('category', filters.category);
      if (filters.searchQuery) queryParams.set('search', filters.searchQuery);
      if (filters.minPrice > 0) queryParams.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice < 25000) queryParams.set('maxPrice', filters.maxPrice.toString());
      if (filters.sizes.length > 0) queryParams.set('sizes', filters.sizes.join(','));
      if (filters.sortBy) queryParams.set('sortBy', filters.sortBy);
      if (filters.limitedDropsOnly) queryParams.set('limitedOnly', 'true');

      const res = await fetch(`/api/products?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: Failed to fetch products from Supabase`);
      }
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err: any) {
      console.error('Failed to fetch shop products from Supabase:', err);
      setError(err?.message || 'Failed to load products from Supabase database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredProducts();
  }, [filters]);

  const toggleSizeFilter = (size: ProductSize) => {
    setFilters((prev) => {
      const exists = prev.sizes.includes(size);
      return {
        ...prev,
        sizes: exists ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size]
      };
    });
  };

  const hasActiveFilters =
    filters.category !== 'All' ||
    filters.searchQuery !== '' ||
    filters.minPrice > 0 ||
    filters.maxPrice < 25000 ||
    filters.sizes.length > 0 ||
    filters.limitedDropsOnly;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500">
            VEYRO CATALOG
          </span>
          <h1 className="font-heading text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight uppercase mt-1">
            {filters.category === 'All' ? 'ALL DROPS & SILHOUETTES' : filters.category}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Showing {products.length} heavyweight streetwear items
          </p>
        </div>

        {/* Layout & Sort Controls */}
        <div className="flex items-center gap-3">
          {/* Grid View Toggles */}
          <div className="hidden md:flex items-center p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl">
            <button
              onClick={() => setGridColumns(2)}
              className={`p-2 rounded-lg transition ${
                gridColumns === 2 ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-400'
              }`}
              title="2 Columns"
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridColumns(3)}
              className={`p-2 rounded-lg transition ${
                gridColumns === 3 ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-400'
              }`}
              title="3 Columns"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridColumns(4)}
              className={`p-2 rounded-lg transition ${
                gridColumns === 4 ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-400'
              }`}
              title="4 Columns"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Sort Selector */}
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
            className="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-bold font-mono rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none"
          >
            <option value="newest">Sort: Newest Drops</option>
            <option value="price-asc">Sort: Price (Low to High)</option>
            <option value="price-desc">Sort: Price (High to Low)</option>
            <option value="rating">Sort: Highest Rating</option>
            <option value="popular">Sort: Best Sellers</option>
          </select>

          {/* Mobile Filter Drawer Trigger */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden p-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-xs flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Category Pills Row */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((catName) => (
          <button
            key={catName}
            onClick={() => setFilters((prev) => ({ ...prev, category: catName }))}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex-shrink-0 ${
              filters.category === catName
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md'
                : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {catName}
          </button>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="flex gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-64 bg-white dark:bg-neutral-900/60 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800/80 space-y-6 sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <h3 className="font-mono text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-500" />
              <span>Filters</span>
            </h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-[11px] font-bold text-amber-500 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Price Range: {formatPrice(filters.minPrice)} - {formatPrice(filters.maxPrice)}
            </label>
            <input
              type="range"
              min="0"
              max="25000"
              step="500"
              value={filters.maxPrice}
              onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: Number(e.target.value) }))}
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>

          {/* Size Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Sizes
            </label>
            <div className="grid grid-cols-3 gap-2">
              {allSizes.map((s) => {
                const isSelected = filters.sizes.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSizeFilter(s)}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      isSelected
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Limited Drop Checkbox */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-neutral-800 dark:text-neutral-200">
              <input
                type="checkbox"
                checked={filters.limitedDropsOnly}
                onChange={(e) => setFilters((prev) => ({ ...prev, limitedDropsOnly: e.target.checked }))}
                className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
              />
              <span>Vault / Limited Drops Only 🔥</span>
            </label>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="flex-1 space-y-6">
          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-neutral-100 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
              <span className="font-mono text-[10px] font-bold text-neutral-400 uppercase">Active Filters:</span>
              {filters.category !== 'All' && (
                <span className="px-2.5 py-1 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold rounded-lg flex items-center gap-1">
                  {filters.category}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setFilters((prev) => ({ ...prev, category: 'All' }))}
                  />
                </span>
              )}
              {filters.searchQuery && (
                <span className="px-2.5 py-1 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold rounded-lg flex items-center gap-1">
                  "{filters.searchQuery}"
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                  />
                </span>
              )}
              {filters.sizes.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold rounded-lg flex items-center gap-1"
                >
                  Size {s}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => toggleSizeFilter(s)} />
                </span>
              ))}
              <button onClick={resetFilters} className="text-amber-500 font-bold hover:underline ml-auto">
                Clear All
              </button>
            </div>
          )}

          {/* Grid Cards */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="aspect-[3/4] bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-none" />
              ))}
            </div>
          ) : error ? (
            <div className="py-20 text-center space-y-4 bg-white dark:bg-neutral-900 rounded-2xl border border-rose-500/30 p-8">
              <RotateCcw className="w-12 h-12 text-rose-500 mx-auto" />
              <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase">Supabase Connection Error</h3>
              <p className="text-xs text-rose-500 max-w-sm mx-auto font-mono">
                {error}
              </p>
              <button
                onClick={fetchFilteredProducts}
                className="px-6 py-2.5 bg-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-rose-700 transition"
              >
                Retry Supabase Query
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8">
              <Filter className="w-12 h-12 text-neutral-400 mx-auto" />
              <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase">No items match your filter</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Try loosening your price limits or removing size selections to see available VEYRO drops.
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div
              className={`grid gap-2.5 sm:gap-6 ${
                gridColumns === 2
                  ? 'grid-cols-2 sm:grid-cols-2'
                  : gridColumns === 3
                  ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'
              }`}
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setQuickViewProduct(p)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm lg:hidden animate-fade-in">
          <div className="w-full max-w-xs bg-white dark:bg-neutral-900 h-full p-6 space-y-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-6">
                <h3 className="font-mono text-sm font-black uppercase text-neutral-900 dark:text-white">
                  FILTERS
                </h3>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-2">
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              {/* Sizes */}
              <div className="space-y-3 mb-6">
                <label className="block text-xs font-bold uppercase text-neutral-500">Sizes</label>
                <div className="grid grid-cols-3 gap-2">
                  {allSizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSizeFilter(s)}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        filters.sizes.includes(s)
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase text-neutral-500">
                  Max Price: {formatPrice(filters.maxPrice)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="25000"
                  step="500"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs uppercase tracking-widest rounded-xl"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
};
