import React, { useState } from 'react';
import { Product, ProductSize } from '../../types';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '../../context/NavigationContext';
import { formatPrice } from '../../lib/currency';
import { X, Star, ShoppingBag, ArrowRight, Check, ShieldCheck, Truck } from 'lucide-react';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  const { addToCart } = useCart();
  const { openProductDetail } = useNavigation();

  const [selectedImage, setSelectedImage] = useState<string>(product.images?.[0] || '');
  const [selectedSize, setSelectedSize] = useState<ProductSize>(product.sizes?.[2] || product.sizes?.[0] || 'M');
  const [selectedColor, setSelectedColor] = useState<string>(product.colors?.[0]?.name || 'Default');
  const [quantity, setQuantity] = useState<number>(1);

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity, true);
    onClose();
  };

  const handleFullDetail = () => {
    openProductDetail(product.id);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col md:flex-row cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gallery Column */}
        <div className="w-full md:w-1/2 bg-neutral-100 dark:bg-neutral-950 p-6 flex flex-col justify-between">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-900 mb-4">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition flex-shrink-0 ${
                  selectedImage === img
                    ? 'border-neutral-900 dark:border-white scale-105'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>

        {/* Info Column */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-500">
                {product.category}
              </span>
              <span className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-2.5 py-1 rounded-md">
                {product.gsm} GSM
              </span>
            </div>

            <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight mb-2">
              {product.name}
            </h2>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl font-mono font-black text-neutral-900 dark:text-white">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-sm font-mono text-neutral-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              <div className="flex items-center gap-1 text-amber-500 font-bold text-xs ml-auto">
                <Star className="w-4 h-4 fill-current" />
                <span>{product.rating}</span>
                <span className="text-neutral-400">({product.reviewCount} reviews)</span>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6 line-clamp-3">
              {product.description}
            </p>

            {/* Colors */}
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                Color: <span className="text-neutral-900 dark:text-white">{selectedColor}</span>
              </label>
              <div className="flex gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                      selectedColor === c.name
                        ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full border border-neutral-400" style={{ backgroundColor: c.hex }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Size: <span className="text-neutral-900 dark:text-white">{selectedSize}</span>
                </label>
                <span className="text-[11px] text-neutral-400 font-mono">{product.fit}</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      selectedSize === s
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={handleAddToCart}
              className="w-full py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-black dark:hover:bg-neutral-100 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              Add to Bag • ${product.price * quantity}
            </button>

            <button
              onClick={handleFullDetail}
              className="w-full py-2.5 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center gap-1 transition"
            >
              View Full Product Details
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
