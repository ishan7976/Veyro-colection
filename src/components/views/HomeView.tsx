import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { ProductCard } from '../common/ProductCard';
import { QuickViewModal } from '../common/QuickViewModal';
import { Product } from '../../types';
import { formatPrice } from '../../lib/currency';
import { ArrowRight, Sparkles, Flame, Shield, Star, Instagram, Layers, ChevronRight, CheckCircle2 } from 'lucide-react';

export const HomeView: React.FC = () => {
  const { navigateTo } = useNavigation();

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        const all: Product[] = data.products || [];

        setFeaturedProducts(all.slice(0, 4));
        setNewArrivals(all.filter((p) => p.isNewArrival || p.isLimitedDrop).slice(0, 4));
      } catch (err) {
        console.error('Failed to load home products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const categoriesList = [
    {
      name: 'Oversized T-Shirts',
      cat: 'Oversized T-Shirts',
      subtitle: '320 GSM Boxy Cut',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop'
    },
    {
      name: 'Graphic T-Shirts',
      cat: 'Graphic T-Shirts',
      subtitle: 'Hand Acid Wash & Screenprints',
      image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=800&auto=format&fit=crop'
    },
    {
      name: 'Heavyweight Hoodies',
      cat: 'Hoodies',
      subtitle: '480 GSM French Terry Loopback',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop'
    },
    {
      name: 'Limited Edition Drops',
      cat: 'Limited Edition Drops',
      subtitle: 'Serialized Vault Releases',
      image: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=800&auto=format&fit=crop'
    }
  ];

  const instagramPosts = [
    { id: '1', img: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=600&auto=format&fit=crop', likes: '1.4k', tag: '@veyro.identity' },
    { id: '2', img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600&auto=format&fit=crop', likes: '2.1k', tag: 'DROP 004' },
    { id: '3', img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=600&auto=format&fit=crop', likes: '980', tag: '320 GSM Boxy' },
    { id: '4', img: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=600&auto=format&fit=crop', likes: '3.2k', tag: 'Monolith Hood' }
  ];

  return (
    <div className="space-y-16 pb-16 bg-neutral-50 dark:bg-[#050505] text-neutral-900 dark:text-white transition-colors duration-200">
      {/* 1. Sophisticated Dark Hero Section (Split Layout) */}
      <section className="border-b border-neutral-800 dark:border-white/10 bg-neutral-950 dark:bg-[#0A0A0A] text-white">
        <div className="flex flex-col lg:flex-row min-h-[80vh] lg:min-h-[85vh]">
          {/* Left Hero Main Block */}
          <div className="w-full lg:w-3/5 relative border-b lg:border-b-0 lg:border-r border-neutral-800 dark:border-white/10 flex flex-col justify-end p-8 sm:p-12 lg:p-16 overflow-hidden">
            {/* Background dot pattern & gradient */}
            <div className="absolute inset-0 bg-neutral-950 dark:bg-[#0A0A0A]">
              <div className="absolute inset-0 opacity-20 dark:opacity-25 bg-dot-pattern" />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 dark:from-[#050505] via-transparent to-transparent z-10" />
            </div>

            {/* Background Image subtle background glow */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <img
                src="https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1600&auto=format&fit=crop"
                alt="VEYRO Background"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Hero Main Content */}
            <div className="relative z-20 space-y-6 pt-16">
              <span className="text-xs uppercase tracking-[0.4em] text-white/50 block font-mono">
                SS/25 COLLECTION • DROP 004
              </span>

              <h1 className="font-hero text-5xl sm:text-7xl lg:text-[96px] leading-[0.88] font-black tracking-tight uppercase text-white">
                Wear Your<br />Identity
              </h1>

              <p className="max-w-md text-xs sm:text-sm text-white/60 font-sans leading-relaxed">
                Engineered streetwear for the unapologetic generation. Ultra-dense 320-480 GSM organic cotton, drop-shoulder silhouettes, and raw minimalist luxury.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => navigateTo('shop')}
                  className="font-button bg-white text-black px-8 py-4 text-xs font-medium uppercase tracking-[0.15em] hover:bg-zinc-200 transition-all cursor-pointer shadow-xl flex items-center gap-2"
                >
                  <span>Shop Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigateTo('shop', { category: 'Limited Edition Drops' })}
                  className="font-button border border-white/30 text-white px-8 py-4 text-xs font-medium uppercase tracking-[0.15em] hover:bg-white/10 transition-all cursor-pointer"
                >
                  Lookbook / Vault
                </button>
              </div>
            </div>

            {/* Vertical Stamp Text */}
            <div className="hidden lg:block absolute top-12 right-12 z-20 vertical-rl transform rotate-180 text-[10px] uppercase tracking-[0.5em] text-white/30 whitespace-nowrap font-mono select-none">
              Limited Release / 004-2025 / VEYRO Streetwear
            </div>
          </div>

          {/* Right Hero Featured Pieces Sidebar */}
          <aside className="w-full lg:w-2/5 flex flex-col justify-between bg-neutral-900 dark:bg-[#050505]">
            <div className="p-6 sm:p-8 border-b border-neutral-800 dark:border-white/10 flex justify-between items-center">
              <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-white">Featured Pieces</h2>
              <span className="text-[10px] text-white/40 font-mono">02 Items</span>
            </div>

            <div className="flex-1 flex flex-col">
              {/* Item 1 */}
              <div
                onClick={() => {
                  if (featuredProducts[0]) setQuickViewProduct(featuredProducts[0]);
                  else navigateTo('shop');
                }}
                className="flex-1 p-6 sm:p-8 border-b border-neutral-800 dark:border-white/10 relative group cursor-pointer overflow-hidden min-h-[220px] flex flex-col justify-between"
              >
                <div className="absolute inset-0 overflow-hidden bg-neutral-900">
                  <img
                    src={featuredProducts[0]?.images?.[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop'}
                    alt={featuredProducts[0]?.name || 'Featured Piece 1'}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 opacity-50 group-hover:opacity-70"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30" />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="bg-white text-black text-[9px] px-2 py-0.5 font-bold uppercase tracking-tighter shadow-md">
                      New Arrival
                    </span>
                    <span className="text-xs font-mono font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">
                      {formatPrice(featuredProducts[0]?.price || 9999)}
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-xl font-bold uppercase tracking-tight text-white group-hover:text-amber-400 transition-colors drop-shadow-sm">
                      {featuredProducts[0]?.name || 'Veyro Heavy Hoodie'}
                    </h3>
                    <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1 font-mono">
                      {featuredProducts[0]?.gsm || 480} GSM / Acid Wash / Oversized Fit
                    </p>
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div
                onClick={() => {
                  if (featuredProducts[1]) setQuickViewProduct(featuredProducts[1]);
                  else navigateTo('shop');
                }}
                className="flex-1 p-6 sm:p-8 border-b border-neutral-800 dark:border-white/10 relative group cursor-pointer overflow-hidden min-h-[220px] flex flex-col justify-between"
              >
                <div className="absolute inset-0 overflow-hidden bg-neutral-900">
                  <img
                    src={featuredProducts[1]?.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop'}
                    alt={featuredProducts[1]?.name || 'Featured Piece 2'}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 opacity-50 group-hover:opacity-70"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30" />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="border border-white/40 bg-black/40 backdrop-blur-md text-white text-[9px] px-2 py-0.5 font-bold uppercase tracking-tighter">
                      Limited Edition
                    </span>
                    <span className="text-xs font-mono font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">
                      {formatPrice(featuredProducts[1]?.price || 4999)}
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-xl font-bold uppercase tracking-tight text-white group-hover:text-amber-400 transition-colors drop-shadow-sm">
                      {featuredProducts[1]?.name || 'Identity Graphic Tee'}
                    </h3>
                    <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1 font-mono">
                      Raw Hem / 320 GSM Cotton
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Newsletter Bar */}
            <div className="p-6 sm:p-8 bg-neutral-900 text-white dark:bg-white dark:text-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest">Newsletter</span>
                <span className="text-[9px] opacity-70 font-mono">Get secret passwords & 15% off drops</span>
              </div>
              <div className="flex border-b border-white/30 dark:border-black/30 pb-1 w-full sm:w-48">
                <input
                  type="text"
                  placeholder="EMAIL@ADDRESS"
                  className="bg-transparent text-[10px] font-bold placeholder:text-white/40 dark:placeholder:text-black/40 outline-none w-full uppercase tracking-tighter font-mono"
                />
                <button
                  onClick={() => navigateTo('shop')}
                  className="p-1 hover:opacity-70 transition cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-white dark:text-black" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* 2. Shop By Category Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="flex items-end justify-between border-b border-neutral-200 dark:border-white/10 pb-4">
          <div>
            <span className="text-[11px] uppercase tracking-[0.3em] font-mono font-bold text-neutral-500 dark:text-white/50 block">CATEGORIES</span>
            <h2 className="font-heading text-2xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight uppercase mt-1">
              Select Your Silhouette
            </h2>
          </div>
          <button
            onClick={() => navigateTo('shop')}
            className="hidden sm:flex items-center gap-1 font-button text-xs font-medium uppercase tracking-[0.15em] text-neutral-600 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white transition"
          >
            <span>All Categories</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoriesList.map((cat) => (
            <div
              key={cat.name}
              onClick={() => navigateTo('shop', { category: cat.cat })}
              className="group relative h-96 overflow-hidden cursor-pointer bg-neutral-100 dark:bg-[#0A0A0A] border border-neutral-200 dark:border-white/10 hover:border-neutral-400 dark:hover:border-white/30 transition-all duration-300"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-80 dark:opacity-60 group-hover:opacity-100 dark:group-hover:opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 flex flex-col justify-end text-white">
                <span className="text-[10px] font-mono text-white/70 dark:text-white/50 uppercase tracking-widest">
                  {cat.subtitle}
                </span>
                <h3 className="text-xl font-black tracking-tight uppercase mt-0.5 text-white">{cat.name}</h3>
                <div className="flex items-center gap-2 mt-3 text-[10px] font-bold tracking-widest uppercase text-white/80 group-hover:text-white transition">
                  <span>Explore Line</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Featured Drops Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="flex items-end justify-between border-b border-neutral-200 dark:border-white/10 pb-4">
          <div>
            <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-neutral-500 dark:text-white/50 block">FEATURED DROPS</span>
            <h2 className="text-2xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase mt-1">
              Hot In Streetwear
            </h2>
          </div>
          <button
            onClick={() => navigateTo('shop')}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-neutral-600 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white transition"
          >
            <span>Shop Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="aspect-[3/4] bg-neutral-200 dark:bg-zinc-900 animate-pulse rounded-none border border-neutral-300 dark:border-white/10" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Brand Philosophy / Manifesto Banner */}
      <section className="bg-neutral-900 dark:bg-[#0A0A0A] border-y border-neutral-800 dark:border-white/10 py-20 px-6 sm:px-12 relative overflow-hidden text-white">
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <span className="text-[11px] font-mono uppercase tracking-[0.4em] text-white/50 block">
            VEYRO MANIFESTO
          </span>
          <h2 className="font-hero text-3xl sm:text-5xl font-black tracking-tight uppercase leading-tight text-white">
            "WE DON'T BUILD CLOTHES TO FIT IN. WE BUILD ARMOR TO STAND OUT."
          </h2>
          <p className="text-xs sm:text-sm text-white/70 max-w-2xl mx-auto font-sans leading-relaxed">
            Streetwear isn't a trend for us — it is our culture. Each thread is woven with intention, every wash is treated by hand, and every drop is engineered to elevate your raw personal identity.
          </p>
          <div className="pt-4">
            <button
              onClick={() => navigateTo('about')}
              className="font-button bg-white text-black px-10 py-4 text-xs font-medium uppercase tracking-[0.15em] hover:bg-zinc-200 transition-all cursor-pointer shadow-xl inline-flex items-center gap-2"
            >
              <span>Read Our Story</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. New Arrivals & Limited Drop Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="flex items-end justify-between border-b border-neutral-200 dark:border-white/10 pb-4">
          <div>
            <span className="text-[11px] uppercase tracking-[0.3em] font-mono font-bold text-neutral-500 dark:text-white/50 block">JUST RELEASED</span>
            <h2 className="font-heading text-2xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight uppercase mt-1">
              New Arrivals & Vault Drops
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newArrivals.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>
      </section>

      {/* 6. Customer Reviews / Streetwear Feedbacks */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-neutral-500 dark:text-white/50 block">COMMUNITY</span>
          <h2 className="text-2xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase">
            What The Club Is Saying
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Kaelen R.',
              location: 'New York, NY',
              comment: 'The 320 GSM weight is unreal. Holds its boxy drop shape through repeated wears. True streetwear luxury quality.',
              item: 'IDENTITY Heavyweight Boxy Tee',
              stars: 5
            },
            {
              name: 'Soren V.',
              location: 'Berlin, DE',
              comment: 'Best 480 GSM French Terry hoodie on the market. Hood sits super high, double lined. Worth every cent.',
              item: 'MONOLITH Hoodie',
              stars: 5
            },
            {
              name: 'Elena M.',
              location: 'Tokyo, JP',
              comment: 'Tactical details and magnetic hardware on Drop 004 are elite level. Gets instant compliments in Shibuya.',
              item: 'DROP 004 Tactical Puffer',
              stars: 5
            }
          ].map((rev, idx) => (
            <div
              key={idx}
              className="p-6 bg-white dark:bg-[#0A0A0A] border border-neutral-200 dark:border-white/10 space-y-4 flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex text-amber-500 gap-1">
                  {[...Array(rev.stars)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-neutral-700 dark:text-white/70 italic leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 uppercase">
                    {rev.name}
                  </h4>
                  <p className="text-[10px] text-neutral-500 dark:text-white/40 font-mono">{rev.location}</p>
                </div>
                <span className="text-[9px] font-mono bg-neutral-100 dark:bg-white/10 px-2 py-1 text-neutral-800 dark:text-white/80 uppercase">
                  {rev.item}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Instagram Showcase Feed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-900 text-white dark:bg-white dark:text-black">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-neutral-500 dark:text-white/50 block">INSTAGRAM</span>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase">
                Tag @veyro.identity To Be Featured
              </h2>
            </div>
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold uppercase tracking-widest text-neutral-600 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white transition hidden sm:block"
          >
            Follow Instagram
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {instagramPosts.map((post) => (
            <div
              key={post.id}
              className="group relative aspect-square bg-neutral-100 dark:bg-[#0A0A0A] border border-neutral-200 dark:border-white/10 overflow-hidden cursor-pointer"
            >
              <img
                src={post.img}
                alt="VEYRO Streetwear Instagram"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 dark:opacity-80 group-hover:opacity-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4 text-center">
                <Instagram className="w-6 h-6 mb-2 text-white" />
                <span className="text-xs font-bold font-mono uppercase">{post.tag}</span>
                <span className="text-[10px] text-white/50 mt-1 font-mono">❤️ {post.likes}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
};
