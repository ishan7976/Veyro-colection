import React, { useState } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useToast } from '../../context/ToastContext';
import { Mail, ArrowRight, Instagram, Twitter, Youtube, ShieldCheck, Truck, RefreshCw, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [discountReward, setDiscountReward] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setDiscountReward(data.discountCode);
        addToast({ title: 'Welcome to VEYRO Club', message: `Your 15% code is ${data.discountCode}`, type: 'success' });
        setEmail('');
      } else {
        addToast({ title: 'Subscription Error', message: data.error, type: 'error' });
      }
    } catch {
      addToast({ title: 'Server Error', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-neutral-900 text-white dark:bg-[#050505] border-t border-neutral-800 dark:border-white/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-12 border-b border-neutral-800 dark:border-white/10">
          <div className="flex items-center gap-4 p-4 bg-neutral-800/60 dark:bg-[#0A0A0A] border border-neutral-700/60 dark:border-white/10">
            <div className="p-3 bg-white text-black">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Worldwide Express Shipping</h4>
              <p className="text-[11px] text-neutral-300 dark:text-white/50 font-mono mt-0.5">Free express delivery on orders over $150</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-neutral-800/60 dark:bg-[#0A0A0A] border border-neutral-700/60 dark:border-white/10">
            <div className="p-3 bg-white text-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">320-480 GSM Quality</h4>
              <p className="text-[11px] text-neutral-300 dark:text-white/50 font-mono mt-0.5">Ultra-dense heavyweight cotton engineering</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-neutral-800/60 dark:bg-[#0A0A0A] border border-neutral-700/60 dark:border-white/10">
            <div className="p-3 bg-white text-black">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Easy 30-Day Returns</h4>
              <p className="text-[11px] text-neutral-300 dark:text-white/50 font-mono mt-0.5">Hassle-free size exchange & return policy</p>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 py-12 border-b border-neutral-800 dark:border-white/10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div
              onClick={() => navigateTo('home')}
              className="cursor-pointer inline-block"
            >
              <span className="font-logo font-bold text-3xl tracking-[0.18em] text-white uppercase">
                VEYRO
              </span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed max-w-sm">
              VEYRO is a modern streetwear fashion label for young visionaries. Built on high-density cottons, bold cuts, and uncompromising raw identity.
            </p>

            {/* Newsletter Subscription Card */}
            <div className="pt-2">
              <p className="text-xs font-mono font-bold uppercase text-white mb-2 tracking-widest">JOIN THE VEYRO MOVEMENT</p>
              <p className="text-[11px] text-white/50 mb-3 font-mono">
                Subscribe for secret drop passwords, early release access & 15% off your first order.
              </p>

              {discountReward ? (
                <div className="p-3 bg-white/10 border border-white/30 text-xs font-mono text-white flex items-center justify-between">
                  <span>Code: <strong>{discountReward}</strong> (15% OFF)</span>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-white/10 text-xs text-white placeholder:text-white/30 font-mono outline-none focus:border-white transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-white text-black font-extrabold text-xs uppercase tracking-widest hover:bg-zinc-200 transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>JOIN</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="text-xs font-mono font-extrabold uppercase tracking-widest text-white mb-4">
              COLLECTION
            </h4>
            <ul className="space-y-2.5 text-xs text-white/60 font-mono">
              <li>
                <button onClick={() => navigateTo('shop', { category: 'Oversized T-Shirts' })} className="hover:text-white transition cursor-pointer">
                  Oversized T-Shirts
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('shop', { category: 'Graphic T-Shirts' })} className="hover:text-white transition cursor-pointer">
                  Graphic T-Shirts
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('shop', { category: 'Hoodies' })} className="hover:text-white transition cursor-pointer">
                  Heavyweight Hoodies
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('shop', { category: 'Limited Edition Drops' })} className="hover:text-white text-white/90 transition flex items-center gap-1 cursor-pointer">
                  Limited Edition Drops
                </button>
              </li>
            </ul>
          </div>

          {/* Identity Column */}
          <div>
            <h4 className="text-xs font-mono font-extrabold uppercase tracking-widest text-white mb-4">
              THE BRAND
            </h4>
            <ul className="space-y-2.5 text-xs text-white/60 font-mono">
              <li>
                <button onClick={() => navigateTo('about')} className="hover:text-white transition cursor-pointer">
                  Brand Manifesto
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('about')} className="hover:text-white transition cursor-pointer">
                  Fabric Standards (GSM)
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('contact')} className="hover:text-white transition cursor-pointer">
                  Support & Help
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('account')} className="hover:text-white transition cursor-pointer">
                  VEYRO Identity Club
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('admin')} className="text-amber-400 font-bold hover:text-white transition flex items-center gap-1 cursor-pointer">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Portal</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Social & Contact */}
          <div>
            <h4 className="text-xs font-mono font-extrabold uppercase tracking-widest text-white mb-4">
              CONNECT
            </h4>
            <p className="text-xs text-white/60 mb-4 leading-relaxed font-sans">
              Follow our official studio feed for drop announcements and behind-the-scenes previews.
            </p>
            <div className="flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-[#0A0A0A] border border-white/10 text-white/70 hover:text-white hover:border-white/40 transition"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-[#0A0A0A] border border-white/10 text-white/70 hover:text-white hover:border-white/40 transition"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-[#0A0A0A] border border-white/10 text-white/70 hover:text-white hover:border-white/40 transition"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-white/40 font-mono tracking-widest uppercase">
          <p>© {new Date().getFullYear()} VEYRO STREETWEAR LTD. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-4">
            <span>VISA</span>
            <span>MASTERCARD</span>
            <span>APPLE PAY</span>
            <span>GOOGLE PAY</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
