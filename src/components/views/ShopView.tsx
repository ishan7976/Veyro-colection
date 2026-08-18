import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { ProductCard } from '../common/ProductCard';
import { QuickViewModal } from '../common/QuickViewModal';
import { Product, ProductSize } from '../../types';
import { formatPrice } from '../../lib/currency';
import { fetchProductsFromSupabase, seedProductsToSupabase, SUPABASE_PROJECT_ID, SUPABASE_URL } from '../../lib/supabase';
import { Filter, SlidersHorizontal, Search, X, Grid2X2, Grid3X3, LayoutGrid, RotateCcw, AlertTriangle, Sparkles, Plus, Copy, Check } from 'lucide-react';

export const ShopView: React.FC = () => {
  const { filters, setFilters, resetFilters, navigateTo } = useNavigation();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalFetchedCount, setTotalFetchedCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(4);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [copiedRls, setCopiedRls] = useState(false);

  const categories = ['All', 'Oversized T-Shirts', 'Graphic T-Shirts', 'Hoodies', 'Limited Edition Drops'];
  const allSizes: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const fetchFilteredProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log(`[ShopView] Fetching products from Supabase project: ${SUPABASE_PROJECT_ID} (${SUPABASE_URL})`);
      
      const supaRes = await fetchProductsFromSupabase();

      // Diagnostic console logs
      console.log('[ShopView] Successfully loaded products count:', supaRes.data ? supaRes.data.length : 0);
      if (supaRes.error) {
        console.warn('[ShopView] Supabase notice:', supaRes.error);
      }

      if (!supaRes.success && supaRes.error) {
        setError(supaRes.error);
        setProducts([]);
        setTotalFetchedCount(0);
        return;
      }

      const allFetched = supaRes.data || [];
      setTotalFetchedCount(allFetched.length);

      // 4. Clean filter application without accidental filtering of stock/quantity
      let list = [...allFetched];

      // Filter by Category
      if (filters.category && filters.category !== 'All') {
        const targetCat = filters.category.toLowerCase().trim();
        list = list.filter(p => (p.category || '').toLowerCase().trim() === targetCat);
      }

      // Filter by Search Query
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase().trim();
        list = list.filter(p =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (Array.isArray(p.tags) && p.tags.some((t: string) => (t || '').toLowerCase().includes(q)))
        );
      }

      // Filter by Price Range
      if (filters.minPrice > 0) {
        list = list.filter(p => p.price >= filters.minPrice);
      }
      if (filters.maxPrice < 25000) {
        list = list.filter(p => p.price <= filters.maxPrice);
      }

      // Filter by Sizes
      if (filters.sizes && filters.sizes.length > 0) {
        list = list.filter(p => 
          Array.isArray(p.sizes) && p.sizes.some((s: string) => filters.sizes.includes(s as ProductSize))
        );
      }

      // Filter by Limited Drops
      if (filters.limitedDropsOnly) {
        list = list.filter(p => Boolean(p.isLimitedDrop));
      }

      // Sorting
      if (filters.sortBy === 'price-asc') {
        list.sort((a, b) => a.price - b.price);
      } else if (filters.sortBy === 'price-desc') {
        list.sort((a, b) => b.price - a.price);
      } else if (filters.sortBy === 'rating') {
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (filters.sortBy === 'newest') {
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }

      setProducts(list);
    } catch (err: any) {
      console.error('[ShopView] Error in fetchFilteredProducts:', err);
      setError(err?.message || 'Failed to communicate with Supabase database.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedProducts = async () => {
    setIsSeeding(true);
    try {
      const res = await seedProductsToSupabase();
      if (res.success) {
        await fetchFilteredProducts();
      } else {
        setError(res.error || 'Failed to seed products');
      }
    } catch (e: any) {
      setError(e?.message || 'Seed exception');
    } finally {
      setIsSeeding(false);
    }
  };

  const copyRlsSql = () => {
    const sql = `ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;\nDROP POLICY IF EXISTS "Public read products" ON public.products;\nCREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);`;
    navigator.clipboard.writeText(sql);
    setCopiedRls(true);
    setTimeout(() => setCopiedRls(false), 2500);
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
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="aspect-[3/4] bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-none" />
              ))}
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-4 bg-white dark:bg-neutral-900 rounded-2xl border border-rose-500/30 p-6 sm:p-10 shadow-lg">
              <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/40 rounded-full flex items-center justify-center mx-auto text-rose-500 border border-rose-500/20">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-rose-500">
                  Supabase Query Notice ({SUPABASE_PROJECT_ID})
                </span>
                <h3 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white uppercase mt-1">
                  Product Fetch Issue
                </h3>
              </div>
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 text-left max-w-xl mx-auto">
                <p className="text-xs font-mono text-rose-700 dark:text-rose-300 break-words whitespace-pre-wrap">
                  {error}
                </p>
              </div>
              
              {/* RLS Helper Box */}
              <div className="max-w-xl mx-auto p-4 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-neutral-700 dark:text-neutral-300">
                    Fix RLS SELECT Policy on public.products:
                  </span>
                  <button
                    onClick={copyRlsSql}
                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50"
                  >
                    {copiedRls ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRls ? 'Copied SQL' : 'Copy SQL'}</span>
                  </button>
                </div>
                <pre className="text-[10px] font-mono bg-neutral-900 text-emerald-400 p-2.5 rounded overflow-x-auto">
{`CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);`}
                </pre>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={fetchFilteredProducts}
                  className="px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Fetch</span>
                </button>
                <button
                  onClick={() => navigateTo('admin', { adminSubRoute: 'products' })}
                  className="px-6 py-2.5 bg-amber-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Open Admin Portal</span>
                </button>
              </div>
            </div>
          ) : totalFetchedCount === 0 ? (
            <div className="py-14 text-center space-y-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 max-w-xl mx-auto shadow-sm">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-500/20">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-500">
                  Supabase Project Connected ({SUPABASE_PROJECT_ID})
                </span>
                <h3 className="text-xl font-black text-neutral-900 dark:text-white uppercase mt-1">
                  0 Products in Supabase Database
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 max-w-md mx-auto">
                  The <code className="text-amber-500 font-bold">public.products</code> table exists in your Supabase project but currently contains 0 records. Seed initial streetwear garments or upload products in the Admin Portal.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleSeedProducts}
                  disabled={isSeeding}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md flex items-center gap-2"
                >
                  {isSeeding ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isSeeding ? 'Seeding Products...' : 'Seed Streetwear Catalog'}</span>
                </button>
                <button
                  onClick={() => navigateTo('admin', { adminSubRoute: 'products' })}
                  className="px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Product</span>
                </button>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8">
              <Filter className="w-12 h-12 text-neutral-400 mx-auto" />
              <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase">No items match your filter</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {totalFetchedCount} total products are available in Supabase. Try loosening your price limits, clearing category filter, or removing size selections.
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
