import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '../../context/NavigationContext';
import { Order } from '../../types';
import { formatPrice } from '../../lib/currency';
import { fetchOrdersFromSupabase } from '../../lib/supabase';
import { User, Package, Heart, MapPin, LogOut, Shield, ChevronRight, ShoppingBag, Calendar, Database, Sparkles, Trash2, RefreshCw } from 'lucide-react';
import { GoogleIcon } from '../common/AuthModal';

export const AccountView: React.FC = () => {
  const { user, token, logout, loginWithGoogle, openAuthModal } = useAuth();
  const { wishlist, wishlistProducts, isLoadingWishlist, wishlistError, removeFromWishlist, addToCart, refetchWishlist } = useCart();
  const { navigateTo } = useNavigation();

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'addresses'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchUserOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const res = await fetchOrdersFromSupabase();
        if (res.success && Array.isArray(res.data)) {
          const userOrders = res.data.filter((o: Order) => String(o.userId) === String(user.id));
          setOrders(userOrders);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error('Failed to load user orders:', err);
        setOrders([]);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchUserOrders();
  }, [user, token]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center mx-auto shadow-2xl">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <span className="font-mono text-[10px] font-black tracking-widest text-amber-500 uppercase">AUTHENTICATION REQUIRED</span>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">VEYRO Identity Account</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Sign in to access your personal profile, order history, and saved vault wishlist.</p>
        </div>

        <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-4">
          <button
            onClick={loginWithGoogle}
            className="w-full py-3.5 px-4 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 shadow-sm hover:bg-neutral-900 hover:text-white hover:border-neutral-900 dark:hover:bg-white dark:hover:text-black transition-all duration-200 cursor-pointer group active:scale-[0.99]"
          >
            <GoogleIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
            <span className="bg-white dark:bg-neutral-900 px-3 font-mono text-[9px] font-bold text-neutral-400 uppercase tracking-widest absolute">
              OR EMAIL LOGIN
            </span>
          </div>

          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono font-bold text-xs uppercase rounded-xl tracking-wider hover:opacity-90 transition cursor-pointer"
          >
            Sign In with Email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Profile Header Banner */}
      <div className="p-6 sm:p-8 bg-neutral-950 text-white rounded-3xl border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-neutral-700"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-black font-black text-2xl flex items-center justify-center uppercase shadow-lg">
              {user.name ? user.name.charAt(0) : 'V'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black uppercase tracking-tight">{user.name}</h1>
              {user.role === 'admin' ? (
                <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 font-mono font-bold text-[10px] rounded-full border border-red-500/40">
                  ADMINISTRATOR
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 font-mono font-bold text-[10px] rounded-full border border-amber-500/40">
                  VEYRO CLUB VIP
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 font-mono">{user.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-bold uppercase rounded-xl border border-neutral-800 transition flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-8">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-b-2 border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
              : 'text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`pb-3 text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-2 ${
            activeTab === 'wishlist'
              ? 'border-b-2 border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
              : 'text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Saved Vault Wishlist ({wishlist.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'orders' && (() => {
        const safeOrders = Array.isArray(orders) ? orders : [];
        return (
          <div className="space-y-4">
            {isLoadingOrders ? (
              <div className="py-12 text-center text-xs font-mono text-neutral-400">Loading order archive...</div>
            ) : safeOrders.length === 0 ? (
              <div className="p-8 bg-white dark:bg-neutral-900/60 rounded-3xl border border-neutral-200 dark:border-neutral-800 text-center space-y-3">
                <Package className="w-10 h-10 text-neutral-400 mx-auto" />
                <p className="text-sm font-bold text-neutral-900 dark:text-white uppercase">No Orders Placed Yet</p>
                <p className="text-xs text-neutral-500">Your future drop orders will be listed here with live tracking.</p>
                <button
                  onClick={() => navigateTo('shop')}
                  className="px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold uppercase rounded-xl"
                >
                  Explore Drops
                </button>
              </div>
            ) : (
              safeOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-6 bg-white dark:bg-neutral-900/60 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">ORDER ID</span>
                    <p className="text-sm font-mono font-black text-neutral-900 dark:text-white">{ord.id}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">DATE PLACED</span>
                    <p className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">{ord.createdAt}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">STATUS</span>
                    <p className="text-xs font-mono font-bold text-emerald-500 uppercase">{ord.status}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">TOTAL</span>
                    <p className="text-sm font-mono font-black text-neutral-900 dark:text-white">{formatPrice(ord.total)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {ord.items.map((it, i) => (
                    <div key={i} className="flex gap-3 items-center text-xs">
                      <img src={it.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'} alt={it.name} className="w-10 h-12 object-cover rounded-lg bg-neutral-200" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <p className="font-bold text-neutral-900 dark:text-white">{it.name}</p>
                        <p className="text-[10px] text-neutral-400 font-mono">Size: {it.size} • Color: {it.color} • Qty: {it.quantity}</p>
                      </div>
                      <span className="font-mono font-bold">{formatPrice(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
        );
      })()}

      {activeTab === 'wishlist' && (
        <div>
          {isLoadingWishlist ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3 animate-pulse">
                  <div className="aspect-[3/4] bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                  <div className="h-9 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
                </div>
              ))}
            </div>
          ) : wishlistError ? (
            <div className="p-8 bg-white dark:bg-neutral-900/60 rounded-3xl border border-red-500/30 text-center space-y-3">
              <p className="text-sm font-bold text-red-500 uppercase">{wishlistError}</p>
              <button
                onClick={refetchWishlist}
                className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold uppercase rounded-xl inline-flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Loading</span>
              </button>
            </div>
          ) : wishlistProducts.length === 0 ? (
            <div className="p-8 bg-white dark:bg-neutral-900/60 rounded-3xl border border-neutral-200 dark:border-neutral-800 text-center space-y-3">
              <Heart className="w-10 h-10 text-neutral-400 mx-auto" />
              <p className="text-sm font-bold text-neutral-900 dark:text-white uppercase">Your Wishlist is Empty</p>
              <p className="text-xs text-neutral-500">Click the heart icon on any product to save items to your personal vault.</p>
              <button
                onClick={() => navigateTo('shop')}
                className="px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold uppercase rounded-xl cursor-pointer"
              >
                Browse Collection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {wishlistProducts.map((p) => {
                const imageUrl = p.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80';
                const hasValidPrice = typeof p.price === 'number' && p.price > 0;

                return (
                  <div key={p.id} className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="aspect-[3/4] bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden relative group">
                        <img
                          src={imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        {p.category && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-md text-white text-[9px] font-mono uppercase tracking-wider rounded">
                            {p.category}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold truncate text-neutral-900 dark:text-white" title={p.name}>
                          {p.name}
                        </h4>
                        {p.description && (
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                            {p.description}
                          </p>
                        )}
                        {hasValidPrice ? (
                          <p className="text-xs font-mono font-bold text-amber-500 mt-1">
                            {formatPrice(p.price)}
                          </p>
                        ) : (
                          <p className="text-xs font-mono text-neutral-400 mt-1">
                            Price unavailable
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <button
                        onClick={() => addToCart(p, p.sizes?.[0] || 'M', p.colors?.[0]?.name || 'Standard', 1, true)}
                        className="flex-1 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold uppercase rounded-lg hover:opacity-90 transition cursor-pointer font-mono"
                      >
                        Add Bag
                      </button>
                      <button
                        onClick={() => removeFromWishlist(p.id)}
                        className="p-2 text-neutral-400 hover:text-red-500 transition cursor-pointer"
                        title="Remove from Wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
