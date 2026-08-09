import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { Product } from '../../types';
import { Search, X, ArrowRight, Sparkles, Tag } from 'lucide-react';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { openProductDetail, navigateTo } = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.products || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const popularSearches = ['Heavyweight', 'Boxy Tee', '480GSM Hoodie', 'Limited Drop', 'Cargo', 'Acid Wash'];

  const handleSelectProduct = (id: string) => {
    openProductDetail(id);
    onClose();
  };

  const handleViewAllInShop = () => {
    navigateTo('shop', { searchQuery: query });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="relative p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-neutral-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search VEYRO drops, 320GSM tees, hoodies, cargo..."
            className="w-full bg-transparent text-sm md:text-base text-neutral-900 dark:text-white font-medium focus:outline-none placeholder-neutral-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-neutral-400 hover:text-neutral-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300"
          >
            ESC
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          {!query && (
            <div>
              <p className="text-xs font-mono uppercase font-bold tracking-widest text-neutral-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Popular Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3.5 py-1.5 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 transition flex items-center gap-1.5"
                  >
                    <Tag className="w-3 h-3 text-neutral-400" />
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-mono uppercase font-bold text-neutral-400">
                  {isLoading ? 'Searching catalog...' : `${results.length} Matches Found`}
                </p>
                {results.length > 0 && (
                  <button
                    onClick={handleViewAllInShop}
                    className="text-xs font-bold text-neutral-900 dark:text-white hover:underline flex items-center gap-1"
                  >
                    View in Shop <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {results.length === 0 && !isLoading ? (
                <div className="py-12 text-center text-xs text-neutral-500 font-mono">
                  No drops matched "{query}". Try searching "Heavyweight" or "Hoodie".
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product.id)}
                      className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-400 dark:hover:border-neutral-600 transition cursor-pointer flex items-center gap-4"
                    >
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'}
                        alt={product.name}
                        className="w-14 h-16 object-cover rounded-xl bg-neutral-200 dark:bg-neutral-900"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono uppercase text-neutral-400">{product.category}</span>
                          <span className="text-[10px] font-mono text-amber-500 font-bold">{product.gsm} GSM</span>
                        </div>
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">
                          {product.name}
                        </h4>
                        <p className="text-[11px] font-mono text-neutral-500 font-black mt-0.5">${product.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
