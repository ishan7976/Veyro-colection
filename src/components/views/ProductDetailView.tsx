import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useCart } from '../../context/CartContext';
import { Product, ProductSize, ProductReview } from '../../types';
import { SizeGuideModal } from '../common/SizeGuideModal';
import { ProductCard } from '../common/ProductCard';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../lib/currency';
import {
  Star,
  ShoppingBag,
  Heart,
  Ruler,
  Truck,
  ShieldCheck,
  RefreshCw,
  Plus,
  Minus,
  Check,
  ChevronRight,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export const ProductDetailView: React.FC = () => {
  const { selectedProductId, navigateTo } = useNavigation();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { addToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<ProductSize>('M');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'details' | 'fabric' | 'reviews'>('details');

  // New review form
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [revName, setRevName] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState('');
  const [revComment, setRevComment] = useState('');
  const [revFit, setRevFit] = useState<'Runs Small' | 'True to Size' | 'Runs Large'>('True to Size');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!selectedProductId) return;

    const fetchProductData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/${selectedProductId}`);
        if (!res.ok) throw new Error('Product not found');
        const data: Product = await res.json();
        setProduct(data);
        setSelectedImage(data.images?.[0] || '');
        setSelectedSize(data.sizes?.[2] || data.sizes?.[0] || 'M');
        setSelectedColor(data.colors?.[0]?.name || 'Standard');

        // Fetch reviews
        const revRes = await fetch(`/api/products/${selectedProductId}/reviews`);
        const revData = await revRes.json();
        setReviews(revData || []);

        // Fetch related products
        const relRes = await fetch(`/api/products?category=${encodeURIComponent(data.category)}`);
        const relData = await relRes.json();
        setRelatedProducts((relData.products || []).filter((p: Product) => p.id !== data.id).slice(0, 4));
      } catch (err) {
        console.error('Failed to load product detail:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [selectedProductId]);

  if (isLoading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto dark:border-white dark:border-t-transparent" />
        <p className="text-xs font-mono font-bold text-neutral-400">Loading VEYRO drop specifications...</p>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity, true);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor, quantity, false);
    navigateTo('checkout');
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName || !revTitle || !revComment) return;

    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: revName,
          rating: revRating,
          title: revTitle,
          comment: revComment,
          fitFeedback: revFit
        })
      });
      const newRev = await res.json();
      if (res.ok) {
        setReviews((prev) => [newRev, ...prev]);
        addToast({ title: 'Review Submitted', message: 'Thank you for your feedback', type: 'success' });
        setIsReviewFormOpen(false);
        setRevComment('');
        setRevTitle('');
      }
    } catch {
      addToast({ title: 'Failed to submit review', type: 'error' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
        <button onClick={() => navigateTo('home')} className="hover:text-neutral-900 dark:hover:text-white">
          Home
        </button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => navigateTo('shop')} className="hover:text-neutral-900 dark:hover:text-white">
          Shop
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-neutral-900 dark:text-white font-bold truncate max-w-[200px]">{product.name}</span>
      </div>

      {/* Main Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Image Gallery (7 cols) */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          {/* Thumbnails */}
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[500px] scrollbar-none">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`w-16 h-20 md:w-20 md:h-24 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 bg-neutral-100 dark:bg-neutral-900 ${
                  selectedImage === img
                    ? 'border-neutral-900 dark:border-white scale-105 shadow-md'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>

          {/* Main Image Stage */}
          <div className="relative flex-1 aspect-[3/4] bg-neutral-100 dark:bg-neutral-950 rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800/80 shadow-2xl">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-transform duration-500"
              referrerPolicy="no-referrer"
            />

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.gsm && (
                <span className="px-3 py-1 bg-neutral-950/80 backdrop-blur-md text-neutral-200 text-xs font-mono font-bold tracking-widest rounded-full border border-neutral-800 shadow-md">
                  {product.gsm} GSM HEAVYWEIGHT
                </span>
              )}
              <span className="px-3 py-1 bg-amber-500 text-black text-xs font-mono font-black tracking-widest rounded-full shadow-md uppercase">
                {product.fit}
              </span>
            </div>

            {/* Wishlist Button */}
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all shadow-lg ${
                inWishlist
                  ? 'bg-red-500 text-white scale-110'
                  : 'bg-white/80 dark:bg-neutral-900/80 text-neutral-800 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-800'
              }`}
            >
              <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Right Column: Specifications & Purchasing (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-amber-500">
                {product.category}
              </span>
              <div className="flex items-center gap-1.5 text-amber-500 font-bold text-xs">
                <Star className="w-4 h-4 fill-current" />
                <span>{product.rating}</span>
                <span className="text-neutral-400">({reviews.length} reviews)</span>
              </div>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight uppercase leading-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-3xl font-mono font-black text-neutral-900 dark:text-white">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-base font-mono text-neutral-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {product.description}
          </p>

          {/* Color Swatch Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
              Color Option: <span className="text-neutral-900 dark:text-white font-sans">{selectedColor}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(c.name)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition ${
                    selectedColor === c.name
                      ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full border border-neutral-400" style={{ backgroundColor: c.hex }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector + Size Guide Modal Trigger */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                Select Size: <span className="text-neutral-900 dark:text-white font-sans">{selectedSize}</span>
              </label>
              <button
                onClick={() => setIsSizeGuideOpen(true)}
                className="text-xs font-bold text-neutral-900 dark:text-white underline flex items-center gap-1 hover:text-amber-500 transition"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Size Guide & Fit Advisor</span>
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`py-3 rounded-2xl text-xs font-mono font-black transition border ${
                    selectedSize === s
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-md'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity selector */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs font-mono font-bold uppercase text-neutral-500">Quantity:</span>
            <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-xl overflow-hidden bg-neutral-50 dark:bg-neutral-900">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 text-xs font-mono font-black">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={handleAddToCart}
              className="font-button w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium text-xs uppercase tracking-[0.15em] rounded-2xl hover:bg-black dark:hover:bg-neutral-100 active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Bag • ${product.price * quantity}</span>
            </button>

            <button
              onClick={handleBuyNow}
              className="font-button w-full py-3.5 bg-amber-500 text-black font-medium text-xs uppercase tracking-[0.15em] rounded-2xl hover:bg-amber-400 active:scale-[0.98] transition-all shadow-md cursor-pointer"
            >
              Express Checkout Now
            </button>
          </div>

          {/* Guarantees List */}
          <div className="grid grid-cols-3 gap-3 pt-4 text-center border-t border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-500">
            <div className="p-2.5 bg-neutral-100 dark:bg-neutral-900/60 rounded-xl">
              <Truck className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <span>Express Delivery</span>
            </div>
            <div className="p-2.5 bg-neutral-100 dark:bg-neutral-900/60 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <span>{product.gsm} GSM Density</span>
            </div>
            <div className="p-2.5 bg-neutral-100 dark:bg-neutral-900/60 rounded-xl">
              <RefreshCw className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <span>30-Day Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Product Specs & Reviews */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-10 space-y-6">
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 text-xs font-mono font-bold uppercase tracking-wider transition ${
              activeTab === 'details'
                ? 'border-b-2 border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            Fabric & Craft Specifications
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'border-b-2 border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <span>Customer Reviews ({reviews.length})</span>
            <span className="px-1.5 py-0.5 bg-amber-500 text-black font-extrabold text-[10px] rounded">
              ★ {product.rating}
            </span>
          </button>
        </div>

        {activeTab === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-white dark:bg-neutral-900/60 rounded-3xl border border-neutral-200 dark:border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase mb-2">
                Fabric Construction
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {product.fabricDetails}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase mb-2">
                Care Instructions
              </h3>
              <ul className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1 font-mono">
                <li>• Machine wash cold inside out with like colors</li>
                <li>• Do not bleach or dry clean</li>
                <li>• Tumble dry low or line dry to prevent shrinkage</li>
                <li>• Iron inside out on low heat if needed</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase">
                  VERIFIED CUSTOMER FEEDBACK
                </h3>
                <p className="text-xs text-neutral-500">Real streetwear enthusiasts sharing size & quality feedback.</p>
              </div>
              <button
                onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
                className="px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-mono font-bold uppercase rounded-xl"
              >
                Write a Review
              </button>
            </div>

            {/* Review Form Drawer */}
            {isReviewFormOpen && (
              <form onSubmit={handleAddReview} className="p-6 bg-neutral-100 dark:bg-neutral-900 rounded-3xl space-y-4 border border-neutral-200 dark:border-neutral-800 animate-fade-in">
                <h4 className="text-xs font-mono font-bold uppercase text-neutral-900 dark:text-white">Write Your Review</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={revName}
                      onChange={(e) => setRevName(e.target.value)}
                      placeholder="e.g. Kaelen Vance"
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-1">Rating</label>
                    <select
                      value={revRating}
                      onChange={(e) => setRevRating(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono"
                    >
                      <option value="5">★★★★★ (5/5 Exceptional)</option>
                      <option value="4">★★★★☆ (4/5 Great)</option>
                      <option value="3">★★★☆☆ (3/5 Average)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1">Headline / Title</label>
                  <input
                    type="text"
                    required
                    value={revTitle}
                    onChange={(e) => setRevTitle(e.target.value)}
                    placeholder="e.g. Perfect boxy weight and drape!"
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1">Detailed Comment</label>
                  <textarea
                    rows={3}
                    required
                    value={revComment}
                    onChange={(e) => setRevComment(e.target.value)}
                    placeholder="Describe fabric texture, fit, and wash endurance..."
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs uppercase rounded-xl"
                >
                  Submit Review
                </button>
              </form>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-5 bg-white dark:bg-neutral-900/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-500">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">{rev.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">{rev.createdAt}</span>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">{rev.comment}</p>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 pt-1">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{rev.userName}</span>
                    {rev.verifiedPurchase && <span className="text-emerald-500 font-bold">✓ Verified Purchase</span>}
                    {rev.fitFeedback && <span>• Fit: {rev.fitFeedback}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-12 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500">PAIR IT WITH</span>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight uppercase">
                COMPLETE YOUR OUTFIT
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} fitType={product.fit} />
    </div>
  );
};
