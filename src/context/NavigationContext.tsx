import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PageView, FilterState, Order } from '../types';

export type AdminSubRoute = 'overview' | 'dashboard' | 'products' | 'orders' | 'customers' | 'inventory' | 'rls-security';

interface NavigationContextType {
  page: PageView;
  adminSubRoute: AdminSubRoute;
  selectedProductId: string | null;
  lastPlacedOrder: Order | null;
  filters: FilterState;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  navigateTo: (
    page: PageView | string,
    options?: {
      productId?: string;
      category?: string;
      searchQuery?: string;
      order?: Order;
      adminSubRoute?: AdminSubRoute;
    }
  ) => void;
  setAdminSubRoute: (subRoute: AdminSubRoute) => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  openProductDetail: (productId: string) => void;
}

const DEFAULT_FILTERS: FilterState = {
  category: 'All',
  minPrice: 0,
  maxPrice: 25000,
  sizes: [],
  searchQuery: '',
  sortBy: 'newest',
  inStockOnly: false,
  limitedDropsOnly: false
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Helper to parse initial path from window.location.pathname
const parseInitialRoute = (): { page: PageView; adminSubRoute: AdminSubRoute } => {
  if (typeof window === 'undefined') return { page: 'home', adminSubRoute: 'dashboard' };

  const path = window.location.pathname.toLowerCase();

  if (path === '/admin' || path === '/admin/' || path === '/admin/dashboard') {
    return { page: 'admin', adminSubRoute: 'dashboard' };
  }
  if (path === '/admin/products') {
    return { page: 'admin', adminSubRoute: 'products' };
  }
  if (path === '/admin/orders') {
    return { page: 'admin', adminSubRoute: 'orders' };
  }
  if (path.startsWith('/admin')) {
    return { page: 'admin', adminSubRoute: 'dashboard' };
  }
  if (path === '/shop') return { page: 'shop', adminSubRoute: 'dashboard' };
  if (path === '/cart') return { page: 'cart', adminSubRoute: 'dashboard' };
  if (path === '/checkout') return { page: 'checkout', adminSubRoute: 'dashboard' };
  if (path === '/about') return { page: 'about', adminSubRoute: 'dashboard' };
  if (path === '/contact') return { page: 'contact', adminSubRoute: 'dashboard' };
  if (path === '/booking') return { page: 'booking', adminSubRoute: 'dashboard' };
  if (path === '/account') return { page: 'account', adminSubRoute: 'dashboard' };

  return { page: 'home', adminSubRoute: 'dashboard' };
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = parseInitialRoute();
  const [page, setPage] = useState<PageView>(initial.page);
  const [adminSubRoute, setAdminSubRouteState] = useState<AdminSubRoute>(initial.adminSubRoute);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Sync URL history state
  const syncBrowserUrl = (targetPage: PageView, subRoute?: AdminSubRoute) => {
    try {
      let targetPath = '/';
      if (targetPage === 'admin') {
        const route = subRoute || 'dashboard';
        if (route === 'dashboard' || route === 'overview') targetPath = '/admin/dashboard';
        else targetPath = `/admin/${route}`;
      } else if (targetPage !== 'home') {
        targetPath = `/${targetPage}`;
      }

      if (window.location.pathname !== targetPath) {
        window.history.pushState({ page: targetPage, adminSubRoute: subRoute }, '', targetPath);
      }
    } catch (e) {
      // Ignore pushState restrictions in iframe if any
    }
  };

  const setAdminSubRoute = useCallback((subRoute: AdminSubRoute) => {
    setAdminSubRouteState(subRoute);
    syncBrowserUrl('admin', subRoute);
  }, []);

  const navigateTo = useCallback(
    (
      newPageInput: PageView | string,
      options?: {
        productId?: string;
        category?: string;
        searchQuery?: string;
        order?: Order;
        adminSubRoute?: AdminSubRoute;
      }
    ) => {
      let targetPage: PageView = 'home';
      let subRoute: AdminSubRoute = options?.adminSubRoute || 'dashboard';

      // Support string route inputs like '/admin/products', '/admin/orders', etc.
      if (newPageInput === '/admin' || newPageInput === '/admin/dashboard') {
        targetPage = 'admin';
        subRoute = 'dashboard';
      } else if (newPageInput === '/admin/products') {
        targetPage = 'admin';
        subRoute = 'products';
      } else if (newPageInput === '/admin/orders') {
        targetPage = 'admin';
        subRoute = 'orders';
      } else if (typeof newPageInput === 'string' && newPageInput.startsWith('/admin')) {
        targetPage = 'admin';
        subRoute = 'dashboard';
      } else {
        targetPage = newPageInput as PageView;
      }

      if (options?.productId) {
        setSelectedProductId(options.productId);
      }
      if (options?.order) {
        setLastPlacedOrder(options.order);
      }
      if (options?.category) {
        setFilters(prev => ({ ...prev, category: options.category! }));
      }
      if (options?.searchQuery !== undefined) {
        setFilters(prev => ({ ...prev, searchQuery: options.searchQuery! }));
      }

      setPage(targetPage);
      if (targetPage === 'admin') {
        setAdminSubRouteState(subRoute);
      }

      syncBrowserUrl(targetPage, subRoute);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  // Handle browser back/forward buttons & custom navigation events
  useEffect(() => {
    const handlePopState = () => {
      const route = parseInitialRoute();
      setPage(route.page);
      setAdminSubRouteState(route.adminSubRoute);
    };

    const handleCustomNavigate = (e: any) => {
      if (e.detail?.page) {
        navigateTo(e.detail.page);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('veyro_navigate', handleCustomNavigate);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('veyro_navigate', handleCustomNavigate);
    };
  }, [navigateTo]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const openProductDetail = useCallback((productId: string) => {
    setSelectedProductId(productId);
    setPage('product-detail');
    syncBrowserUrl('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        page,
        adminSubRoute,
        selectedProductId,
        lastPlacedOrder,
        filters,
        isSearchOpen,
        setIsSearchOpen,
        navigateTo,
        setAdminSubRoute,
        setFilters,
        resetFilters,
        openProductDetail
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within NavigationProvider');
  return context;
};
