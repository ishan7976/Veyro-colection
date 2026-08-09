import React, { useState } from 'react';
import { Product, ProductSize } from '../../types';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '../../context/NavigationContext';
import { formatPrice } from '../../lib/currency';
import { Heart, Eye, ShoppingBag, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { openProductDetail } = useNavigation();

  const [isHovered, setIsHovered] = useState(false);
  const [showSizeQuickPicker, setShowSizeQuickPicker] = useState(false);

  const inWishlist = isInWishlist(product.id);
  const DEFAULT_IMG = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80';
  const secondaryImage = product.images?.[1] || product.images?.[0] || DEFAULT_IMG;

  const handleQuickAdd = (e: React.MouseEvent, size: ProductSize) => {
    e.stopPropagation();
    addToCart(product, size, product.colors?.[0]?.name, 1, true);
    setShowSizeQuickPicker(false);
  };

  return (
    <div
      className="group relative flex flex-col bg-white dark:bg-[#0A0A0A] border border-neutral-200 dark:border-white/10 hover:border-neutral-900 dark:hover:border-white/40 transition-all duration-300 cursor-pointer overflow-hidden shadow-xs hover:shadow-xl w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowSizeQuickPicker(false);
      }}
      onClick={() => openProductDetail(product.id)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] sm:aspect-[3/4] w-full overflow-hidden bg-neutral-100 dark:bg-zinc-950">
        <img
          src={isHovered ? secondaryImage : (product.images?.[0] || DEFAULT_IMG)}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-95 dark:opacity-90 group-hover:opacity-100"
          referrerPolicy="no-referrer"
        />

        {/* Badges Top Left */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-col gap-1 items-start z-10">
          {product.isLimitedDrop && (
            <span className="bg-neutral-900 text-white dark:bg-white dark:text-black text-[9px] px-2 py-0.5 font-black uppercase tracking-tighter shadow-md">
              {product.dropNumber || 'LIMITED'}
            </span>
          )}
          {product.isNewArrival && !product.isLimitedDrop && (
            <span className="border border-neutral-300 dark:border-white/30 text-neutral-900 dark:text-white bg-white/80 dark:bg-black/60 backdrop-blur-md text-[9px] px-2 py-0.5 font-bold uppercase tracking-tighter shadow-xs">
              NEW
            </span>
          )}
          {product.gsm && (
            <span className="bg-neutral-900/80 dark:bg-black/80 text-white/90 dark:text-white/70 text-[8px] sm:text-[9px] font-mono border border-neutral-700 dark:border-white/10 px-1.5 py-0.5">
              {product.gsm} GSM
            </span>
          )}
        </div>

        {/* Wishlist Button Top Right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-2 border backdrop-blur-md transition-all duration-200 z-10 rounded-none ${
            inWishlist
              ? 'bg-red-500 text-white border-red-500 shadow-lg'
              : 'bg-white/80 dark:bg-black/60 border-neutral-200 dark:border-white/20 text-neutral-800 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-400 dark:hover:border-white/50'
          }`}
          aria-label="Save to Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-current' : ''}`} />
        </button>

        {/* Desktop Hover Action Overlay */}
        <div className="hidden sm:flex absolute inset-x-3 bottom-3 flex-col gap-2 z-10 transition-all duration-300 transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
          {showSizeQuickPicker ? (
            <div
              className="bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-md p-2 border border-neutral-300 dark:border-white/20 text-neutral-900 dark:text-white shadow-2xl animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-white/50">Select Size</span>
                <span className="text-[9px] text-neutral-400 dark:text-white/40 font-mono">{product.fit}</span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={(e) => handleQuickAdd(e, s)}
                    className="py-1 text-[10px] font-mono font-bold border border-neutral-300 dark:border-white/20 hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSizeQuickPicker(true);
                }}
                className="flex-1 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-black font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-neutral-800 dark:hover:bg-zinc-200 transition shadow-xl"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Quick Add
              </button>
              {onQuickView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickView(product);
                  }}
                  className="p-2.5 bg-white/90 dark:bg-black/80 border border-neutral-300 dark:border-white/20 text-neutral-900 dark:text-white backdrop-blur-md hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition"
                  title="Quick View"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between bg-white dark:bg-[#0A0A0A]">
        <div>
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-neutral-500 dark:text-white/40 mb-1 font-mono uppercase tracking-widest">
            <span className="truncate max-w-[120px]">{product.category}</span>
            <div className="flex items-center gap-1 text-amber-500 font-bold shrink-0">
              <Star className="w-3 h-3 fill-current" />
              <span>{product.rating}</span>
            </div>
          </div>

          <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white tracking-tight uppercase group-hover:text-neutral-600 dark:group-hover:text-white/80 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-neutral-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5 sm:gap-2 font-mono">
            <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] sm:text-xs text-neutral-400 dark:text-white/30 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Color Swatches */}
          <div className="flex items-center gap-1">
            {product.colors.map((c) => (
              <span
                key={c.name}
                className="w-2 sm:w-2.5 h-2 sm:h-2.5 border border-neutral-300 dark:border-white/20 shadow-xs rounded-full"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Mobile Quick Actions Bar (Always accessible on touch screens) */}
        <div className="mt-3 sm:hidden pt-2 border-t border-neutral-100 dark:border-white/10 flex gap-2">
          {showSizeQuickPicker ? (
            <div
              className="w-full bg-neutral-50 dark:bg-neutral-900 p-2 border border-neutral-200 dark:border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 dark:text-white/50">Select Size</span>
                <span className="text-[8px] text-neutral-400 font-mono">{product.fit}</span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={(e) => handleQuickAdd(e, s)}
                    className="py-1 text-[9px] font-mono font-bold border border-neutral-300 dark:border-white/20 active:bg-neutral-900 active:text-white dark:active:bg-white dark:active:text-black"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSizeQuickPicker(true);
                }}
                className="flex-1 py-2 bg-neutral-900 text-white dark:bg-white dark:text-black font-bold text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 active:bg-neutral-800"
              >
                <ShoppingBag className="w-3 h-3" />
                Quick Add
              </button>
              {onQuickView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickView(product);
                  }}
                  className="p-2 border border-neutral-300 dark:border-white/20 text-neutral-800 dark:text-white/80"
                  title="Quick View"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
