import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { Product } from '../../types';
import { formatPrice } from '../../lib/currency';
import { Search, X, Flame, ArrowRight, Loader2 } from 'lucide-react';

export const QuickSearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, navigateTo, openProductDetail } = useNavigation();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setResults((data.products || []).slice(0, 6));
        }
      } catch (err) {
        console.error('Failed to search Supabase products:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={() => setIsSearchOpen(false)}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#0A0A0A] rounded-3xl border border-neutral-200 dark:border-white/15 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10 flex items-center gap-3">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-neutral-400 dark:text-white/50 shrink-0" />
          )}
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search VEYRO drops (e.g., Heavyweight Hoodie, 320 GSM, Boxy Tee)..."
            className="flex-1 bg-transparent text-sm sm:text-base font-sans text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/40 focus:outline-none"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className="text-xs font-mono font-bold text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-2 py-1"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition rounded-full hover:bg-neutral-100 dark:hover:bg-white/10"
            aria-label="Close Search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {searchQuery ? (
            results.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm font-bold text-neutral-700 dark:text-white/80">No streetwear drops found for "{searchQuery}"</p>
                <p className="text-xs text-neutral-400 font-mono">Try searching "Oversized", "Graphic", "Hoodie", or "320 GSM"</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                    Found {results.length} Products
                  </span>
                  <button 
                    onClick={() => {
                      setIsSearchOpen(false);
                      navigateTo('shop', { searchQuery });
                    }}
                    className="text-[11px] font-mono font-bold text-neutral-900 dark:text-white hover:underline flex items-center gap-1"
                  >
                    View All in Shop <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                {results.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      setIsSearchOpen(false);
                      openProductDetail(product.id);
                    }}
                    className="p-3 bg-neutral-50 dark:bg-zinc-900/60 rounded-2xl border border-neutral-200 dark:border-white/10 hover:border-neutral-900 dark:hover:border-white/40 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'}
                        alt={product.name}
                        className="w-12 h-16 object-cover rounded-xl bg-neutral-200 dark:bg-zinc-800"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white group-hover:underline">{product.name}</p>
                        <p className="text-[10px] font-mono text-neutral-500 dark:text-white/50 uppercase mt-0.5">
                          {product.category} • {product.gsm} GSM • {product.fit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-black text-neutral-900 dark:text-white block">
                        {formatPrice(product.price)}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-400 uppercase">
                        {product.inStock ? 'In Stock' : 'Sold Out'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block mb-2">
                  TRENDING SEARCHES
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Oversized T-Shirts', 'Heavyweight Hoodies', '320 GSM', 'Acid Wash Graphic', 'Limited Drops'].map((term) => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="px-3.5 py-2 bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-white/90 rounded-xl text-xs font-mono font-bold hover:bg-neutral-200 dark:hover:bg-white/20 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
