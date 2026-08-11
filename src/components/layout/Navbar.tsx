import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  LogOut,
  PackageCheck,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  onOpenSearch: () => void;
}

export const Navbar: React.FC = () => {
  const { page, navigateTo, setIsSearchOpen } = useNavigation();
  const { toggleCart, itemCount, wishlist } = useCart();
  const { user, openAuthModal, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navCategories = [
    { name: 'All Collection', cat: 'All' },
    { name: 'Oversized T-Shirts', cat: 'Oversized T-Shirts' },
    { name: 'Graphic T-Shirts', cat: 'Graphic T-Shirts' },
    { name: 'Hoodies & Outerwear', cat: 'Hoodies' },
    { name: 'Limited Drops', cat: 'Limited Edition Drops' }
  ];

  const handleCategoryClick = (catName: string) => {
    navigateTo('shop', { category: catName });
    setIsShopDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 dark:bg-[#050505]/95 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 shadow-lg py-2.5 sm:py-3'
          : 'bg-white dark:bg-[#050505] border-b border-neutral-200 dark:border-white/10 py-3 sm:py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-8 flex items-center justify-between h-12 sm:h-16">
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-2.5 sm:gap-8">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 text-neutral-700 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white transition rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => navigateTo('home')}
            className="cursor-pointer group flex items-center gap-1.5 sm:gap-2"
          >
            <span className="font-logo text-xl sm:text-3xl font-bold tracking-[0.15em] sm:tracking-[0.18em] text-neutral-900 dark:text-white group-hover:opacity-80 transition-opacity">
              VEYRO
            </span>
            <span className="hidden sm:inline-block text-[9px] font-mono font-bold tracking-[0.25em] text-neutral-500 dark:text-white/40 border-l border-neutral-300 dark:border-white/20 pl-2 uppercase">
              Streetwear
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 font-button text-[11px] font-medium tracking-[0.15em] uppercase text-neutral-600 dark:text-white/60">
            <button
              onClick={() => navigateTo('home')}
              className={`hover:text-neutral-900 dark:hover:text-white transition-colors ${
                page === 'home' ? 'text-neutral-900 dark:text-white font-bold border-b-2 border-neutral-900 dark:border-white pb-0.5' : ''
              }`}
            >
              New Drops
            </button>

            <div
              className="relative"
              onMouseEnter={() => setIsShopDropdownOpen(true)}
              onMouseLeave={() => setIsShopDropdownOpen(false)}
            >
              <button
                onClick={() => navigateTo('shop')}
                className={`hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1 ${
                  page === 'shop' ? 'text-neutral-900 dark:text-white font-bold border-b-2 border-neutral-900 dark:border-white pb-0.5' : ''
                }`}
              >
                <span>Collections</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {isShopDropdownOpen && (
                <div className="absolute top-full left-0 w-56 pt-3 z-50">
                  <div className="bg-white dark:bg-[#0A0A0A] border border-neutral-200 dark:border-white/15 rounded-xl shadow-2xl p-2 backdrop-blur-xl animate-fade-in">
                    {navCategories.map((item) => (
                      <button
                        key={item.cat}
                        onClick={() => handleCategoryClick(item.cat)}
                        className="w-full text-left px-3.5 py-2.5 rounded-lg text-[10px] uppercase tracking-wider font-bold text-neutral-800 dark:text-white/80 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white transition flex items-center justify-between"
                      >
                        <span>{item.name}</span>
                        {item.cat === 'Limited Edition Drops' && (
                          <span className="px-1.5 py-0.5 bg-neutral-900 text-white dark:bg-white dark:text-black text-[8px] font-black uppercase rounded-sm">
                            HOT
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigateTo('about')}
              className={`hover:text-neutral-900 dark:hover:text-white transition-colors ${
                page === 'about' ? 'text-neutral-900 dark:text-white font-bold border-b-2 border-neutral-900 dark:border-white pb-0.5' : ''
              }`}
            >
              Archive
            </button>

            <button
              onClick={() => navigateTo('contact')}
              className={`hover:text-neutral-900 dark:hover:text-white transition-colors ${
                page === 'contact' ? 'text-neutral-900 dark:text-white font-bold border-b-2 border-neutral-900 dark:border-white pb-0.5' : ''
              }`}
            >
              About
            </button>

            <button
              onClick={() => navigateTo('admin')}
              className={`hover:text-amber-500 transition-colors flex items-center gap-1.5 ${
                page === 'admin' ? 'text-amber-500 font-bold border-b-2 border-amber-500 pb-0.5' : 'text-amber-600 dark:text-amber-400 font-bold'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </nav>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-5">
          {/* Search Button (Compact icon on mobile, Pill on tablet/desktop) */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center border border-neutral-300 dark:border-white/20 hover:border-neutral-900 dark:hover:border-white/60 bg-neutral-100/90 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-full p-2 sm:px-5 sm:py-2 gap-2 transition-all duration-200 cursor-pointer text-neutral-800 dark:text-white/90 hover:text-neutral-900 dark:hover:text-white shadow-xs group"
            aria-label="Open Quick Search"
          >
            <Search className="w-4 h-4 text-neutral-700 dark:text-white/80 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-xs uppercase tracking-widest font-mono font-bold">Search</span>
          </button>

          {/* Theme Toggle (Visible on desktop/tablet, also inside mobile menu) */}
          <button
            onClick={toggleTheme}
            className="hidden sm:block p-1.5 text-neutral-700 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white transition rounded-full hover:bg-neutral-100 dark:hover:bg-white/10"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-neutral-800" />}
          </button>

          {/* Wishlist Icon */}
          <button
            onClick={() => navigateTo('account')}
            className="relative p-1.5 text-neutral-700 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white transition hidden sm:block"
            title="Wishlist"
          >
            <Heart className="w-4.5 h-4.5" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-mono font-bold rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Account Icon / Dropdown */}
          <div className="relative hidden sm:block">
            {user ? (
              <button
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="flex items-center gap-1.5 text-xs font-medium text-neutral-900 dark:text-white hover:opacity-80 transition cursor-pointer"
              >
                <span className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-white/10 border border-neutral-300 dark:border-white/20 text-neutral-900 dark:text-white text-[10px] font-mono font-bold flex items-center justify-center">
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </span>
                <span className="hidden md:inline text-[11px] tracking-wider uppercase font-mono">{(user.name || 'User').split(' ')[0]}</span>
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="text-xs font-medium text-neutral-700 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white transition tracking-widest uppercase cursor-pointer"
              >
                Account
              </button>
            )}

            {isAccountDropdownOpen && user && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#0A0A0A] border border-neutral-200 dark:border-white/15 rounded-xl shadow-2xl p-2 z-50 animate-fade-in">
                <div className="p-3 border-b border-neutral-200 dark:border-white/10 mb-1">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">{user.name}</p>
                  <p className="text-[10px] text-neutral-500 dark:text-white/50 truncate font-mono">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    navigateTo('account');
                    setIsAccountDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-[10px] uppercase tracking-wider font-bold text-neutral-800 dark:text-white/80 hover:bg-neutral-100 dark:hover:bg-white/10 flex items-center gap-2"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Orders & Profile</span>
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => {
                      navigateTo('admin');
                      setIsAccountDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-[10px] uppercase tracking-wider font-bold text-amber-500 hover:bg-amber-500/10 flex items-center gap-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Dashboard</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsAccountDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-[10px] uppercase tracking-wider font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Cart Button */}
          <button
            onClick={toggleCart}
            className="relative flex items-center justify-center p-1.5 text-neutral-900 dark:text-white hover:opacity-80 transition cursor-pointer"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5 text-neutral-900 dark:text-white" />
            <span className="absolute -top-1 -right-1 bg-neutral-900 text-white dark:bg-white dark:text-black text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-black border border-white dark:border-black">
              {itemCount}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 dark:border-white/10 bg-white/98 dark:bg-[#0A0A0A]/98 backdrop-blur-xl p-5 space-y-4 animate-fade-in shadow-2xl">
          <div className="space-y-2.5 text-xs uppercase tracking-widest">
            {/* Account & Wishlist Summary Bar */}
            <div className="p-3 bg-neutral-100 dark:bg-neutral-900 rounded-xl flex items-center justify-between">
              {user ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black text-[11px] font-mono font-bold flex items-center justify-center flex-shrink-0">
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-neutral-900 dark:text-white text-xs truncate">{user.name}</p>
                    <p className="text-[9px] text-neutral-500 dark:text-white/50 truncate font-mono">{user.email}</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    openAuthModal('login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="font-bold text-neutral-900 dark:text-white text-xs flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  <span>SIGN IN / ACCOUNT</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigateTo('account');
                    setIsMobileMenuOpen(false);
                  }}
                  className="p-1.5 relative text-neutral-700 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white"
                  title="Wishlist & Account"
                >
                  <Heart className="w-4 h-4" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-mono font-bold rounded-full flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={toggleTheme}
                  className="p-1.5 text-neutral-700 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white"
                  title="Toggle Theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-neutral-800" />}
                </button>
              </div>
            </div>

            {/* Navigation Links */}
            <button
              onClick={() => {
                navigateTo('home');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-white/10"
            >
              NEW DROPS
            </button>
            <button
              onClick={() => {
                navigateTo('shop');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-white/10"
            >
              ALL COLLECTIONS
            </button>

            <div className="pl-3 space-y-1.5 border-l-2 border-neutral-200 dark:border-white/20 my-1">
              {navCategories.map((c) => (
                <button
                  key={c.cat}
                  onClick={() => handleCategoryClick(c.cat)}
                  className="block text-[11px] font-mono text-neutral-600 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white py-1 w-full text-left"
                >
                  {c.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                navigateTo('about');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-white/10"
            >
              ARCHIVE
            </button>

            <button
              onClick={() => {
                navigateTo('contact');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-white/10"
            >
              ABOUT VEYRO
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  navigateTo('admin');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 font-bold text-amber-500 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>ADMIN DASHBOARD</span>
              </button>
            )}

            {user && (
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 font-bold text-red-500 flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-white/10"
              >
                <LogOut className="w-4 h-4" />
                <span>SIGN OUT</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
