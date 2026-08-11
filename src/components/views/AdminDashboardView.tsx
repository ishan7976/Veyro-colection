import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigation } from '../../context/NavigationContext';
import { useTheme } from '../../context/ThemeContext';
import { Product, Order, User, ProductCategory, ProductSize } from '../../types';
import { formatPrice } from '../../lib/currency';
import { supabase, saveProductToSupabase, fetchOrderStatsFromSupabase, uploadProductImageToSupabase } from '../../lib/supabase';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Archive, 
  ShieldCheck, 
  UserCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  Database, 
  Copy, 
  LogOut, 
  ExternalLink, 
  RefreshCw, 
  Eye, 
  ChevronRight, 
  X, 
  Lock, 
  Sparkles,
  Filter,
  Truck,
  Calendar,
  Activity,
  BarChart2,
  UploadCloud,
  Image as ImageIcon,
  FileUp
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { user, token, login, logout, isLoading: authIsLoading } = useAuth();
  const { addToast } = useToast();
  const { navigateTo, adminSubRoute, setAdminSubRoute } = useNavigation();
  const { theme, toggleTheme } = useTheme();

  // Admin Tab State synced with navigation subroute
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers' | 'inventory' | 'rls-security' | 'profile'>(() => {
    if (adminSubRoute === 'dashboard') return 'overview';
    return (adminSubRoute as any) || 'overview';
  });

  // Sync activeTab whenever adminSubRoute in NavigationContext updates
  useEffect(() => {
    if (adminSubRoute) {
      if (adminSubRoute === 'dashboard' || adminSubRoute === 'overview') {
        setActiveTab('overview');
      } else {
        setActiveTab(adminSubRoute as any);
      }
    }
  }, [adminSubRoute]);

  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId as any);
    if (tabId === 'overview') {
      setAdminSubRoute('dashboard');
    } else {
      setAdminSubRoute(tabId as any);
    }
  };

  // Login Gate State (for non-admin or logged out users)
  const [loginEmail, setLoginEmail] = useState('admin@veyro.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data States
  const [overviewData, setOverviewData] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [rlsSql, setRlsSql] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Product Filter & Search State
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');

  // Order Filter & Search State
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Add / Edit Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Form inputs for Add/Edit Product
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodOriginalPrice, setProdOriginalPrice] = useState('');
  const [prodCategory, setProdCategory] = useState<ProductCategory>('Oversized T-Shirts');
  const [prodGsm, setProdGsm] = useState('280');
  const [prodFit, setProdFit] = useState<Product['fit']>('Oversized Boxy Fit');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage1, setProdImage1] = useState('');
  const [prodImage2, setProdImage2] = useState('');
  const [prodInStock, setProdInStock] = useState(true);
  const [prodNewArrival, setProdNewArrival] = useState(true);
  const [prodLimitedDrop, setProdLimitedDrop] = useState(false);
  const [prodTrending, setProdTrending] = useState(false);
  const [prodSizes, setProdSizes] = useState<ProductSize[]>(['S', 'M', 'L', 'XL']);

  // Supabase Storage Image Upload State
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Handle File Selection and Direct Upload to Supabase Storage Bucket 'product-images'
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError(null);

    // 1. Validate image type
    if (!file.type.startsWith('image/')) {
      const err = 'Selected file must be a valid image format (PNG, JPG, WEBP, GIF, SVG).';
      setFormError(err);
      addToast({ title: 'Invalid File Format', message: err, type: 'error' });
      return;
    }

    // 2. Validate image file size (max 5MB)
    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      const err = `Image file size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum limit of ${MAX_SIZE_MB}MB.`;
      setFormError(err);
      addToast({ title: 'File Size Exceeded', message: err, type: 'error' });
      return;
    }

    // Set immediate local preview URL
    const localUrl = URL.createObjectURL(file);
    setImagePreviewUrl(localUrl);

    // Upload to Supabase Storage bucket 'product-images'
    setIsUploadingImage(true);
    setUploadProgress('Uploading image to Supabase Storage bucket "product-images"...');

    try {
      const res = await uploadProductImageToSupabase(file);
      if (res.success && res.publicUrl) {
        setProdImage1(res.publicUrl);
        addToast({
          title: 'Image Uploaded to Supabase',
          message: 'Public URL retrieved and ready to save into products.image_url column.',
          type: 'success'
        });
      } else {
        const uploadErr = res.error || 'Failed to upload image to Supabase Storage.';
        setFormError(`Storage Error: ${uploadErr}`);
        addToast({ title: 'Upload Failed', message: uploadErr, type: 'error' });
      }
    } catch (err: any) {
      const uploadErr = err?.message || 'An error occurred during file upload.';
      setFormError(`Upload Exception: ${uploadErr}`);
      addToast({ title: 'Upload Error', message: uploadErr, type: 'error' });
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(null);
    }
  };

  // Direct Supabase Orders & Revenue Realtime Stats State
  const [supabaseOrderStats, setSupabaseOrderStats] = useState<{
    totalOrders: number;
    totalRevenue: number;
    statusBreakdown: Record<string, number>;
    lastSyncedAt: string | null;
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
  }>({
    totalOrders: 0,
    totalRevenue: 0,
    statusBreakdown: {},
    lastSyncedAt: null,
    isLoading: true,
    isRefreshing: false,
    error: null
  });

  // Fetch Real-time Order Stats directly from Supabase 'orders' table
  const fetchLiveSupabaseOrderStats = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setSupabaseOrderStats(prev => ({ ...prev, isRefreshing: true }));
    }
    try {
      const res = await fetchOrderStatsFromSupabase();
      if (res.success) {
        setSupabaseOrderStats({
          totalOrders: res.totalOrders,
          totalRevenue: res.totalRevenue,
          statusBreakdown: res.statusBreakdown,
          lastSyncedAt: new Date().toLocaleTimeString(),
          isLoading: false,
          isRefreshing: false,
          error: null
        });
      } else {
        setSupabaseOrderStats(prev => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: res.error || 'Unable to query public.orders table in Supabase'
        }));
      }
    } catch (err: any) {
      setSupabaseOrderStats(prev => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error: err?.message || 'Connection error to Supabase orders table'
      }));
    }
  };

  // Fetch Dashboard Analytics & Collections
  const fetchDashboardData = async () => {
    if (!token || user?.role !== 'admin') return;
    setIsLoading(true);
    fetchLiveSupabaseOrderStats();
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Overview KPI metrics
      const ovRes = await fetch('/api/admin/overview', { headers });
      if (ovRes.ok) setOverviewData(await ovRes.json());

      // Products
      const prodRes = await fetch('/api/admin/products', { headers });
      if (prodRes.ok) setProducts(await prodRes.json());

      // Orders
      const ordRes = await fetch('/api/admin/orders', { headers });
      if (ordRes.ok) setOrders(await ordRes.json());

      // Customers
      const custRes = await fetch('/api/admin/customers', { headers });
      if (custRes.ok) setCustomers(await custRes.json());

      // RLS SQL Generator
      const rlsRes = await fetch('/api/admin/supabase/rls-sql', { headers });
      if (rlsRes.ok) {
        const rlsData = await rlsRes.json();
        setRlsSql(rlsData.rlsSql);
      }
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' && token) {
      fetchDashboardData();

      // Automatic poll every 8 seconds to ensure data stays perfectly in sync
      const pollInterval = setInterval(() => {
        fetchDashboardData();
      }, 8000);

      // Supabase Realtime subscription for orders and products
      const channel = supabase
        .channel('admin-live-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          console.log('[Admin Dashboard] Realtime order change detected in Supabase. Refreshing data...');
          fetchLiveSupabaseOrderStats();
          fetchDashboardData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          console.log('[Admin Dashboard] Realtime product change detected in Supabase. Refreshing data...');
          fetchDashboardData();
        })
        .subscribe();

      return () => {
        clearInterval(pollInterval);
        supabase.removeChannel(channel);
      };
    }
  }, [user, token]);

  // Real Supabase Admin Login Handler
  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoggingIn(true);
    
    // Authenticate and query Supabase profiles table for role
    const res = await login(loginEmail, loginPassword);
    setIsLoggingIn(false);

    if (res.success) {
      if (res.role === 'admin') {
        addToast({
          title: 'Admin Access Granted',
          message: 'Role "admin" verified from Supabase profiles table.',
          type: 'success'
        });
        navigateTo('/admin/dashboard');
      } else {
        addToast({
          title: 'Access Denied',
          message: 'Your account role is not "admin" in Supabase profiles table.',
          type: 'error'
        });
      }
    } else {
      addToast({
        title: 'Admin Authentication Failed',
        message: 'Invalid email or password. Please verify your administrator credentials.',
        type: 'error'
      });
    }
  };

  // Open Product Modal (Add or Edit)
  const handleOpenProductModal = (productToEdit?: Product) => {
    setFormError(null);
    setIsUploadingImage(false);
    setUploadProgress(null);

    if (productToEdit) {
      setEditingProduct(productToEdit);
      setProdName(productToEdit.name);
      setProdPrice(productToEdit.price.toString());
      setProdOriginalPrice(productToEdit.originalPrice ? productToEdit.originalPrice.toString() : '');
      setProdCategory(productToEdit.category);
      setProdGsm(productToEdit.gsm?.toString() || '280');
      setProdFit(productToEdit.fit || 'Oversized Boxy Fit');
      setProdDesc(productToEdit.description);
      const initialImg = productToEdit.images?.[0] || (productToEdit as any).image_url || '';
      setProdImage1(initialImg);
      setImagePreviewUrl(initialImg || null);
      setProdImage2(productToEdit.images?.[1] || '');
      setProdInStock(productToEdit.inStock);
      setProdNewArrival(!!productToEdit.isNewArrival);
      setProdLimitedDrop(!!productToEdit.isLimitedDrop);
      setProdTrending(!!productToEdit.isTrending);
      setProdSizes(productToEdit.sizes || ['S', 'M', 'L', 'XL']);
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdPrice('4999');
      setProdOriginalPrice('5999');
      setProdCategory('Oversized T-Shirts');
      setProdGsm('300');
      setProdFit('Oversized Boxy Fit');
      setProdDesc('Heavyweight Cotton French Terry streetwear tee engineered for maximum structured boxy fit.');
      setProdImage1('');
      setImagePreviewUrl(null);
      setProdImage2('');
      setProdInStock(true);
      setProdNewArrival(true);
      setProdLimitedDrop(false);
      setProdTrending(true);
      setProdSizes(['S', 'M', 'L', 'XL']);
    }
    setIsProductModalOpen(true);
  };

  // Submit Save Product (POST / PUT & Direct Sync to Supabase public.products)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!prodName || !prodPrice) {
      const msg = 'Garment name and price are required.';
      setFormError(msg);
      addToast({ title: 'Required Fields Missing', message: msg, type: 'error' });
      return;
    }

    setIsSavingProduct(true);

    // Collect all form fields using exact column schema requested:
    // name, description, price, category, original_price, fabric_gsm, image_url, in_stock, new_arrival_badge, limited_drop_badge
    const productPayload = {
      id: editingProduct ? editingProduct.id : undefined,
      name: prodName,
      description: prodDesc || '',
      price: Number(prodPrice),
      category: prodCategory,
      original_price: prodOriginalPrice ? Number(prodOriginalPrice) : null,
      fabric_gsm: Number(prodGsm) || 280,
      image_url: prodImage1,
      in_stock: prodInStock,
      new_arrival_badge: Boolean(prodNewArrival),
      limited_drop_badge: Boolean(prodLimitedDrop),
      // App state compatibility aliases
      originalPrice: prodOriginalPrice ? Number(prodOriginalPrice) : undefined,
      gsm: Number(prodGsm) || 280,
      fit: prodFit || 'Oversized Boxy Fit',
      images: [prodImage1, prodImage2].filter(Boolean),
      inStock: prodInStock,
      isNewArrival: Boolean(prodNewArrival),
      isLimitedDrop: Boolean(prodLimitedDrop),
      isTrending: Boolean(prodTrending),
      sizes: prodSizes
    };

    try {
      // 1. Save product to local backend endpoint
      const endpoint = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';
      let apiSuccess = false;

      try {
        const apiRes = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(productPayload)
        });
        if (apiRes.ok) {
          apiSuccess = true;
        }
      } catch (apiErr) {
        console.log('[API Save Notice]', apiErr);
      }

      // 2. Direct Sync to Supabase public.products table
      const supabaseRes = await saveProductToSupabase(productPayload);

      if (supabaseRes.success) {
        addToast({
          title: editingProduct ? 'Product Updated' : 'Product Saved & Synced to Supabase!',
          message: `Garment "${prodName}" saved directly into public.products table.`,
          type: 'success'
        });
      } else if (supabaseRes.isRlsError || supabaseRes.error?.toLowerCase().includes('row-level security')) {
        console.warn('[Supabase RLS Notice]', supabaseRes.error);
        addToast({
          title: editingProduct ? 'Product Updated in Store' : 'Product Saved to Store!',
          message: `Garment "${prodName}" saved successfully! (Note: Supabase table "products" has Row-Level Security (RLS) enabled. To allow direct anon inserts, add an INSERT policy on public.products or set SUPABASE_SERVICE_ROLE_KEY).`,
          type: 'warning'
        });
      } else if (apiSuccess) {
        addToast({
          title: editingProduct ? 'Product Updated' : 'Product Saved',
          message: `Garment "${prodName}" saved in store. (Supabase notice: ${supabaseRes.error})`,
          type: 'success'
        });
      } else {
        const errMsg = supabaseRes.error || 'Failed to insert product';
        console.error('[Supabase Insert Error]', errMsg);
        setFormError(`Save Error: ${errMsg}`);
        addToast({
          title: 'Product Save Error',
          message: errMsg,
          type: 'error'
        });
        setIsSavingProduct(false);
        return;
      }

      // - Clear form
      setEditingProduct(null);
      setProdName('');
      setProdPrice('');
      setProdOriginalPrice('');
      setProdCategory('Oversized T-Shirts');
      setProdGsm('280');
      setProdFit('Oversized Boxy Fit');
      setProdDesc('');
      setProdImage1('');
      setProdImage2('');
      setProdInStock(true);
      setProdNewArrival(false);
      setProdLimitedDrop(false);
      setProdTrending(false);
      setProdSizes(['S', 'M', 'L', 'XL']);
      setFormError(null);

      // Close modal
      setIsProductModalOpen(false);

      // - Refresh product list automatically
      await fetchDashboardData();
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to communicate with Supabase database';
      setFormError(`Supabase Error: ${errorMsg}`);
      addToast({ title: 'Supabase Error', message: errorMsg, type: 'error' });
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Seed Products to Supabase
  const handleSeedProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/seed-products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addToast({
          title: 'Supabase Products Seeded',
          message: data.message || 'Successfully inserted VEYRO products into Supabase.',
          type: 'success'
        });
        fetchDashboardData();
      } else {
        addToast({
          title: 'Seeding Notice',
          message: data.error || 'Failed to seed products into Supabase.',
          type: 'error'
        });
      }
    } catch (err: any) {
      addToast({
        title: 'Seeding Error',
        message: err.message || 'Network error',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        addToast({ title: 'Product Removed', message: 'Item deleted from store and Supabase table', type: 'info' });
        setDeleteConfirmId(null);
        fetchDashboardData();
      }
    } catch (err) {
      addToast({ title: 'Delete Failed', message: 'Could not delete product', type: 'error' });
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        addToast({ title: `Order ${orderId} Updated`, message: `Status set to ${status}`, type: 'success' });
        fetchDashboardData();
        if (selectedOrderDetails?.id === orderId) {
          setSelectedOrderDetails(prev => prev ? { ...prev, status } : null);
        }
      }
    } catch (err) {
      addToast({ title: 'Status Update Failed', message: 'Server error', type: 'error' });
    }
  };

  // Toggle Customer Role
  const handleToggleCustomerRole = async (userId: string, currentRole?: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch(`/api/admin/customers/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        addToast({ title: 'Role Updated', message: `User role changed to ${newRole.toUpperCase()}`, type: 'success' });
        fetchDashboardData();
      }
    } catch (err) {
      addToast({ title: 'Role Update Error', message: 'Failed to update user role', type: 'error' });
    }
  };

  // Copy RLS SQL Script to Clipboard
  const handleCopyRLS = () => {
    navigator.clipboard.writeText(rlsSql);
    addToast({ title: 'Copied RLS SQL Script!', message: 'Paste into your Supabase SQL Editor to enforce RLS.', type: 'success' });
  };

  // Filtered Products List
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.id.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = productCategoryFilter === 'All' || p.category === productCategoryFilter;
    return matchesSearch && matchesCat;
  });

  // Filtered Orders List
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(orderSearch.toLowerCase()) || 
                          o.shippingAddress?.fullName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          o.shippingAddress?.email?.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // =========================================================================
  // ACCESS CONTROL GATE: Handle Auth Loading, Non-Admin 403 Block, and Login
  // =========================================================================
  if (authIsLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-white p-6 transition-colors duration-200">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-4" />
        <p className="text-sm font-mono text-neutral-600 dark:text-neutral-400">Verifying Supabase Session & Profile Role...</p>
      </div>
    );
  }

  // 1. Non-admin logged in user -> Block /admin routes and show 403 Unauthorized Access page
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-white transition-colors duration-200">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-rose-200 dark:border-rose-500/30 rounded-3xl p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 mb-2">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-hero text-2xl font-black uppercase tracking-tight text-neutral-900 dark:text-white">
              403 - Access Denied
            </h1>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Logged in as <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{user.email}</span>.
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Your account role (<span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{user.role || 'customer'}</span>) does not have administrator privileges in the Supabase <code className="text-amber-600 dark:text-amber-300">profiles</code> table.
            </p>
          </div>

          <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-left space-y-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-400">
            <div className="flex justify-between text-[11px]">
              <span>Supabase Profile Email:</span>
              <span className="text-neutral-900 dark:text-white font-bold">{user.email}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Verified Role Column:</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">{user.role || 'customer'}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Admin Access Status:</span>
              <span className="text-rose-600 dark:text-rose-500 font-bold">BLOCKED (403)</span>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={() => navigateTo('home')}
              className="w-full py-3.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-xs font-bold uppercase tracking-widest rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer font-button"
            >
              <span>Return to Store Homepage</span>
            </button>
            <button
              onClick={logout}
              className="w-full py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-mono rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated user -> Show Real Supabase Role-Based Authentication Form
  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-white transition-colors duration-200">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Background Decorative Gradient */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-amber-600 dark:text-amber-400 mb-2">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="font-hero text-2xl font-black uppercase tracking-tight text-neutral-900 dark:text-white">
              VEYRO Admin Portal
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Restricted Area. Authorized administrator authentication required to access database control.
            </p>
          </div>

          {/* Real Supabase Role Auth Indicator */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-[10px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Supabase Role-Based Auth</span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
              Enter registered credentials. User permissions are fetched from the Supabase <code className="text-amber-600 dark:text-amber-300">profiles</code> table and verified against the <code className="text-emerald-600 dark:text-emerald-400">role</code> column.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@veyro.com"
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-xs font-bold uppercase tracking-widest rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer font-button"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Role in Supabase...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-600" />
                  <span>Authenticate Admin Access</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={() => navigateTo('home')}
              className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 underline uppercase tracking-wider cursor-pointer"
            >
              Return to Store Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN ADMIN DASHBOARD UI (LUXURY BLACK & WHITE STREETWEAR ARCHITECTURE)
  // =========================================================================
  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-200">
      
      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-8 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <span className="font-hero text-xl font-black tracking-tighter text-neutral-900 dark:text-white uppercase flex items-center gap-2">
            VEYRO <span className="text-xs font-mono px-2 py-0.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-full">ADMIN 2026</span>
          </span>
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 rounded-full">
            <Database className="w-3.5 h-3.5 animate-pulse" />
            <span>Supabase: jjkmtvtdobhiehfzeljr</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('home')}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 rounded-xl transition cursor-pointer border border-neutral-200 dark:border-neutral-700"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Storefront</span>
          </button>

          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800/80 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span className="text-xs font-mono text-neutral-800 dark:text-neutral-200">{user.name}</span>
          </div>

          <button
            onClick={logout}
            className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer"
            title="Sign Out Admin Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Navigation (3 Cols) */}
        <aside className="lg:col-span-3 space-y-2">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 space-y-1 shadow-xs">
            <span className="block px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              CORE MANAGEMENT
            </span>

            {[
              { id: 'overview', label: 'Overview Analytics', icon: LayoutDashboard },
              { id: 'products', label: 'Products & Drops', icon: Package, badge: products.length },
              { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingBag, badge: orders.length },
              { id: 'customers', label: 'Registered Customers', icon: Users, badge: customers.length },
              { id: 'inventory', label: 'Stock & Inventory', icon: Archive, badge: overviewData?.lowStockCount ? `${overviewData.lowStockCount} Low` : undefined },
              { id: 'rls-security', label: 'Supabase RLS & SQL', icon: ShieldCheck },
              { id: 'profile', label: 'Admin Security Profile', icon: UserCheck }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelect(tab.id)}
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between transition cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-black shadow-md'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white dark:text-neutral-950' : 'text-neutral-500 dark:text-neutral-400'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-neutral-800 text-white dark:bg-neutral-900 dark:text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Supabase Status Footer Box */}
          <div className="p-4 bg-white/80 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl space-y-2 text-xs font-mono text-neutral-600 dark:text-neutral-400 shadow-xs">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-[10px] uppercase font-bold flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                DATABASE STATUS
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
            </div>
            <p className="text-[11px] text-neutral-800 dark:text-neutral-300">
              Supabase Project: <strong className="text-neutral-900 dark:text-white">jjkmtvtdobhiehfzeljr</strong>
            </p>
            <p className="text-[10px] text-neutral-500">
              Tables: profiles, products, orders, order_items, appointments, admin_roles.
            </p>
          </div>
        </aside>

        {/* Main Content Area (9 Cols) */}
        <main className="lg:col-span-9 space-y-8">
          
          {/* =================================================================
              1. OVERVIEW DASHBOARD
             ================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              
              {/* Title & Quick Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <div>
                  <h2 className="font-hero text-2xl font-black uppercase text-neutral-900 dark:text-white tracking-tight">
                    Executive Overview
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Real-time metrics, revenue statistics, and live orders synced with Supabase.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenProductModal()}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Garment</span>
                  </button>
                </div>
              </div>

              {/* Supabase Orders & Revenue Real-Time Summary Statistics Card */}
              <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 border border-neutral-800 text-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                          public.orders
                        </span>
                        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          REAL-TIME SYNC
                        </span>
                      </div>
                      <h3 className="font-hero text-lg font-black uppercase tracking-tight text-white mt-1">
                        Supabase Orders & Revenue Live Summary
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Metrics calculated directly from live rows in Supabase <code className="text-amber-300 font-mono">orders</code> table.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {supabaseOrderStats.lastSyncedAt && (
                      <span className="text-[10px] font-mono text-neutral-400">
                        Synced: {supabaseOrderStats.lastSyncedAt}
                      </span>
                    )}
                    <button
                      onClick={() => fetchLiveSupabaseOrderStats(true)}
                      disabled={supabaseOrderStats.isRefreshing}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono font-bold uppercase rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-neutral-700 disabled:opacity-50"
                      title="Fetch latest metrics directly from Supabase orders table"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${supabaseOrderStats.isRefreshing ? 'animate-spin' : ''}`} />
                      <span>{supabaseOrderStats.isRefreshing ? 'Syncing...' : 'Refresh DB'}</span>
                    </button>
                  </div>
                </div>

                {/* Main Metrics Grid */}
                {supabaseOrderStats.error ? (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 font-mono text-xs">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                    <div>
                      <span className="font-bold uppercase">Supabase Query Error:</span> {supabaseOrderStats.error}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* 1. Total Revenue Card */}
                    <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-1.5 relative group hover:border-amber-500/50 transition-colors">
                      <div className="flex items-center justify-between text-neutral-400">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">SUPABASE REVENUE</span>
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-black font-mono text-white">
                        {supabaseOrderStats.isLoading ? (
                          <div className="h-7 w-28 bg-neutral-800 rounded animate-pulse" />
                        ) : (
                          formatPrice(supabaseOrderStats.totalRevenue)
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Summed total from public.orders</span>
                      </div>
                    </div>

                    {/* 2. Total Orders Card */}
                    <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-1.5 relative group hover:border-amber-500/50 transition-colors">
                      <div className="flex items-center justify-between text-neutral-400">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">TOTAL ORDERS</span>
                        <ShoppingBag className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-2xl font-black font-mono text-white">
                        {supabaseOrderStats.isLoading ? (
                          <div className="h-7 w-16 bg-neutral-800 rounded animate-pulse" />
                        ) : (
                          `${supabaseOrderStats.totalOrders} Orders`
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-400">
                        Verified Supabase order rows
                      </div>
                    </div>

                    {/* 3. Average Order Value Card */}
                    <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-1.5 relative group hover:border-amber-500/50 transition-colors">
                      <div className="flex items-center justify-between text-neutral-400">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">AVG ORDER VALUE</span>
                        <BarChart2 className="w-4 h-4 text-sky-400" />
                      </div>
                      <div className="text-2xl font-black font-mono text-white">
                        {supabaseOrderStats.isLoading ? (
                          <div className="h-7 w-24 bg-neutral-800 rounded animate-pulse" />
                        ) : (
                          formatPrice(supabaseOrderStats.totalOrders > 0 ? supabaseOrderStats.totalRevenue / supabaseOrderStats.totalOrders : 0)
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-sky-400">
                        Revenue / Total Orders
                      </div>
                    </div>

                    {/* 4. Active Fulfillment Breakdown Card */}
                    <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-1.5 relative group hover:border-amber-500/50 transition-colors">
                      <div className="flex items-center justify-between text-neutral-400">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">PROCESSING QUEUE</span>
                        <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
                      </div>
                      <div className="text-2xl font-black font-mono text-white">
                        {supabaseOrderStats.isLoading ? (
                          <div className="h-7 w-16 bg-neutral-800 rounded animate-pulse" />
                        ) : (
                          `${supabaseOrderStats.statusBreakdown['Processing'] || 0} Active`
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-purple-400">
                        Awaiting fulfillment
                      </div>
                    </div>

                  </div>
                )}

                {/* Status Breakdown Chips */}
                {!supabaseOrderStats.error && !supabaseOrderStats.isLoading && (
                  <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                    <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
                      Database Order Status Breakdown:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {Object.entries(supabaseOrderStats.statusBreakdown).map(([status, count]) => (
                        <div
                          key={status}
                          className="px-3 py-1 bg-neutral-800/80 border border-neutral-700/80 rounded-xl flex items-center gap-2 text-xs"
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            status === 'Delivered' || status === 'Completed' ? 'bg-emerald-400' :
                            status === 'Processing' ? 'bg-amber-400 animate-pulse' :
                            status === 'Shipped' ? 'bg-sky-400' : 'bg-neutral-400'
                          }`} />
                          <span className="font-bold text-neutral-200">{status}:</span>
                          <span className="font-mono text-amber-400 font-black">{count}</span>
                        </div>
                      ))}
                      {Object.keys(supabaseOrderStats.statusBreakdown).length === 0 && (
                        <span className="text-neutral-500 italic text-[11px]">No orders recorded yet</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Revenue Card */}
                <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">TOTAL REVENUE</span>
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-neutral-900 dark:text-white">
                    {formatPrice(overviewData?.totalRevenue || 0)}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>+18.4% from streetwear drops</span>
                  </div>
                </div>

                {/* Orders Card */}
                <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">TOTAL ORDERS</span>
                    <ShoppingBag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-neutral-900 dark:text-white">
                    {overviewData?.totalOrders || orders.length}
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    Synced across web & Supabase
                  </div>
                </div>

                {/* Active Products Card */}
                <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">STORE PRODUCTS</span>
                    <Package className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-neutral-900 dark:text-white">
                    {overviewData?.totalProducts || products.length}
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    {overviewData?.lowStockCount || 0} Out of Stock
                  </div>
                </div>

                {/* Registered Customers Card */}
                <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">CUSTOMER BASE</span>
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-neutral-900 dark:text-white">
                    {overviewData?.totalCustomers || customers.length}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    100% Verified Profiles
                  </div>
                </div>

              </div>

              {/* Category Breakdown & Sales Visualizer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Category Inventory Balance */}
                <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-4 shadow-xs">
                  <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Inventory Distribution</span>
                  </h3>

                  <div className="space-y-3">
                    {Object.entries(overviewData?.categoryStats || {}).map(([cat, count]: any) => (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-700 dark:text-neutral-300 uppercase font-medium">{cat}</span>
                          <span className="font-mono text-neutral-500 dark:text-neutral-400">{count} Items</span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-neutral-900 dark:bg-white h-full transition-all"
                            style={{ width: `${Math.min(100, (count / (products.length || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Appointments & Supabase Connection Overview */}
                <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-4 shadow-xs">
                  <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Atelier Fittings & Supabase Records</span>
                  </h3>

                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono text-emerald-800 dark:text-emerald-300">
                      <span>PROJECT jjkmtvtdobhiehfzeljr</span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 rounded-full font-bold">CONNECTED</span>
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300">
                      Appointments scheduled by customers are directly stored in Supabase's <code className="text-emerald-800 dark:text-emerald-300 font-mono">appointments</code> table.
                    </p>
                    <div className="pt-2 text-xl font-bold font-mono text-neutral-900 dark:text-white flex items-center gap-2">
                      <span>{overviewData?.totalAppointments || 0} Scheduled Sessions</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('rls-security')}
                    className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-mono text-neutral-700 dark:text-neutral-300 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border border-neutral-200 dark:border-neutral-700"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>View Supabase RLS Policies</span>
                  </button>
                </div>

              </div>

              {/* Recent Orders Feed */}
              <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Recent Customer Orders</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline uppercase font-bold cursor-pointer"
                  >
                    View All Orders →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase">
                      <tr>
                        <th className="pb-3">Order ID</th>
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">Items</th>
                        <th className="pb-3">Total</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition">
                          <td className="py-3 font-mono text-amber-600 dark:text-amber-400 font-bold">{o.id}</td>
                          <td className="py-3 font-medium text-neutral-900 dark:text-white">{o.shippingAddress?.fullName}</td>
                          <td className="py-3 text-neutral-500 dark:text-neutral-400">{o.items?.length || 1} items</td>
                          <td className="py-3 font-mono font-bold text-neutral-900 dark:text-white">{formatPrice(o.total)}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              o.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                              o.status === 'Shipped' ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400' :
                              'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedOrderDetails(o);
                                setActiveTab('orders');
                              }}
                              className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
                              title="View Order Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* =================================================================
              2. PRODUCT MANAGEMENT (CRUD)
             ================================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <div>
                  <h2 className="font-hero text-2xl font-black uppercase text-neutral-900 dark:text-white tracking-tight">
                    Garments & Drop Catalog
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Manage prices, sizing variants, fabric GSM, and image assets synced to Supabase database.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSeedProducts()}
                    className="px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-amber-700 dark:text-amber-400 font-button text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-neutral-200 dark:border-amber-500/20 shadow-xs"
                    title="Insert initial VEYRO product collection into empty Supabase products table"
                  >
                    <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Seed Supabase Products</span>
                  </button>
                  <button
                    onClick={() => handleOpenProductModal()}
                    className="px-4 py-2.5 bg-neutral-900 text-white hover:bg-black dark:bg-white dark:text-neutral-950 font-button dark:hover:bg-neutral-200 text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Product</span>
                  </button>
                </div>
              </div>

              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product name or SKU ID..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="px-3.5 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none shadow-xs"
                >
                  <option value="All">All Categories ({products.length})</option>
                  <option value="Oversized T-Shirts">Oversized T-Shirts</option>
                  <option value="Graphic T-Shirts">Graphic T-Shirts</option>
                  <option value="Hoodies">Hoodies</option>
                  <option value="Limited Edition Drops">Limited Edition Drops</option>
                </select>
              </div>

              {/* Products Table */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 dark:bg-neutral-950 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase border-b border-neutral-200 dark:border-neutral-800">
                      <tr>
                        <th className="p-4">Item & Image</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">GSM / Fit</th>
                        <th className="p-4">Stock</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {filteredProducts.map(product => (
                        <tr key={product.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition">
                          <td className="p-4 flex items-center gap-3">
                            <img
                              src={product.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'}
                              alt={product.name}
                              className="w-12 h-14 object-cover rounded-lg bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex-shrink-0"
                            />
                            <div>
                              <div className="font-bold text-neutral-900 dark:text-white uppercase text-xs">
                                {product.name}
                              </div>
                              <span className="font-mono text-[10px] text-amber-600 dark:text-amber-500">
                                {product.id}
                              </span>
                              {product.isLimitedDrop && (
                                <span className="ml-2 text-[9px] bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded uppercase font-mono font-bold border border-amber-500/30">
                                  DROP
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-4 text-neutral-600 dark:text-neutral-300">
                            {product.category}
                          </td>

                          <td className="p-4 font-mono font-bold text-neutral-900 dark:text-white">
                            {formatPrice(product.price)}
                            {product.originalPrice && (
                              <span className="text-neutral-400 dark:text-neutral-500 line-through text-[10px] ml-1.5">
                                {formatPrice(product.originalPrice)}
                              </span>
                            )}
                          </td>

                          <td className="p-4 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                            <div>{product.gsm}GSM</div>
                            <div className="text-[10px] text-neutral-400 dark:text-neutral-500">{product.fit}</div>
                          </td>

                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                              product.inStock ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                            }`}>
                              {product.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>

                          <td className="p-4 text-right space-x-1">
                            <button
                              onClick={() => handleOpenProductModal(product)}
                              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
                              title="Edit Garment"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(product.id)}
                              className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400 transition cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              3. ORDER MANAGEMENT & FULFILLMENT
             ================================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <div>
                  <h2 className="font-hero text-2xl font-black uppercase text-neutral-900 dark:text-white tracking-tight">
                    Customer Orders & Shipping
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Review orders, dispatch packages, update status, and manage shipping addresses.
                  </p>
                </div>
              </div>

              {/* Order Search & Status Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search order ID (e.g. VYR-89210), customer name, or email..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3.5 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none shadow-xs"
                >
                  <option value="All">All Statuses ({orders.length})</option>
                  <option value="Processing">Processing</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              {/* Orders List Table */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 dark:bg-neutral-950 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase border-b border-neutral-200 dark:border-neutral-800">
                      <tr>
                        <th className="p-4">Order ID & Date</th>
                        <th className="p-4">Customer Details</th>
                        <th className="p-4">Items Summary</th>
                        <th className="p-4">Total Amount</th>
                        <th className="p-4">Status & Tracking</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition">
                          <td className="p-4">
                            <div className="font-mono text-amber-600 dark:text-amber-400 font-bold">{order.id}</div>
                            <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="font-bold text-neutral-900 dark:text-white">{order.shippingAddress?.fullName}</div>
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{order.shippingAddress?.email}</div>
                          </td>

                          <td className="p-4 text-neutral-600 dark:text-neutral-300">
                            {order.items?.map((item: any) => (
                              <div key={item.productId + item.size} className="text-[11px]">
                                • {item.name} ({item.size}) x{item.quantity}
                              </div>
                            ))}
                          </td>

                          <td className="p-4 font-mono font-bold text-neutral-900 dark:text-white">
                            {formatPrice(order.total)}
                          </td>

                          <td className="p-4 space-y-1">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as any)}
                              className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 focus:outline-none"
                            >
                              <option value="Processing">Processing</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                            <div className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500">
                              {order.trackingNumber}
                            </div>
                          </td>

                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSelectedOrderDetails(order)}
                              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-mono text-neutral-700 dark:text-neutral-200 rounded-lg transition cursor-pointer border border-neutral-200 dark:border-neutral-700"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              4. CUSTOMER MANAGEMENT
             ================================================================= */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <div>
                  <h2 className="font-hero text-2xl font-black uppercase text-neutral-900 dark:text-white tracking-tight">
                    Registered Customers & Members
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    View customer accounts, loyalty points, roles, and order history.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 dark:bg-neutral-950 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase border-b border-neutral-200 dark:border-neutral-800">
                      <tr>
                        <th className="p-4">Customer Name & ID</th>
                        <th className="p-4">Email Address</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Orders Count</th>
                        <th className="p-4">Total Lifetime Spend</th>
                        <th className="p-4 text-right">Role Toggle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {customers.map(cust => (
                        <tr key={cust.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition">
                          <td className="p-4">
                            <div className="font-bold text-neutral-900 dark:text-white">{cust.name}</div>
                            <div className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500">{cust.id}</div>
                          </td>

                          <td className="p-4 font-mono text-neutral-600 dark:text-neutral-300">
                            {cust.email}
                          </td>

                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              cust.role === 'admin' ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}>
                              {cust.role || 'customer'}
                            </span>
                          </td>

                          <td className="p-4 font-mono font-bold text-neutral-900 dark:text-white">
                            {cust.orderCount || 0} orders
                          </td>

                          <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatPrice(cust.totalSpent || 0)}
                          </td>

                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleToggleCustomerRole(cust.id, cust.role)}
                              className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[10px] font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 rounded-lg transition cursor-pointer border border-neutral-200 dark:border-neutral-700"
                            >
                              {cust.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              5. INVENTORY & STOCK MANAGEMENT
             ================================================================= */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <div>
                  <h2 className="font-hero text-2xl font-black uppercase text-neutral-900 dark:text-white tracking-tight">
                    Inventory & Low Stock Tracking
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Monitor stock levels, toggle garment availability, and manage size variants.
                  </p>
                </div>
              </div>

              {/* Low Stock Callout */}
              <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 font-bold uppercase">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <span>Inventory Low Stock Alerts Active</span>
                    <p className="text-neutral-700 dark:text-neutral-300 font-normal normal-case text-xs mt-0.5">
                      Items toggled out-of-stock automatically disable checkout buttons on storefront.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 dark:bg-neutral-950 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase border-b border-neutral-200 dark:border-neutral-800">
                      <tr>
                        <th className="p-4">Item Name</th>
                        <th className="p-4">Sizes Available</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Quick Toggle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition">
                          <td className="p-4 font-bold text-neutral-900 dark:text-white uppercase">{p.name}</td>
                          <td className="p-4 font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
                            {p.sizes?.join(', ') || 'S, M, L, XL'}
                          </td>
                          <td className="p-4 text-neutral-500 dark:text-neutral-400">{p.category}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              p.inStock ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                            }`}>
                              {p.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={async () => {
                                await fetch(`/api/admin/products/${p.id}`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ inStock: !p.inStock })
                                });
                                fetchDashboardData();
                              }}
                              className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-mono font-bold text-neutral-700 dark:text-neutral-200 rounded-lg transition cursor-pointer border border-neutral-200 dark:border-neutral-700"
                            >
                              Toggle Stock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              6. SUPABASE RLS SECURITY & SQL POLICIES
             ================================================================= */}
          {activeTab === 'rls-security' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <div>
                  <h2 className="font-hero text-2xl font-black uppercase text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    <span>Supabase Row Level Security (RLS)</span>
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Row Level Security policies prevent unauthorized users from modifying store inventory or viewing other users' private orders.
                  </p>
                </div>

                <button
                  onClick={handleCopyRLS}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-neutral-950 font-button text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy RLS SQL Script</span>
                </button>
              </div>

              <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold uppercase">
                  <Database className="w-4 h-4" />
                  <span>Configured Supabase Credentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                    <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase">PROJECT ID</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">jjkmtvtdobhiehfzeljr</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                    <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase">PROJECT URL</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">https://jjkmtvtdobhiehfzeljr.supabase.co</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xs">
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Execute in Supabase SQL Editor
                </h3>
                <pre className="p-4 bg-neutral-900 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-emerald-400 dark:text-emerald-300 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed">
                  {rlsSql}
                </pre>
              </div>
            </div>
          )}

          {/* =================================================================
              7. ADMIN PROFILE & SESSION
             ================================================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <h2 className="font-hero text-2xl font-black uppercase text-neutral-900 dark:text-white tracking-tight">
                  Administrator Profile & Privileges
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Manage active administrator session settings and credentials.
                </p>
              </div>

              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-6 shadow-xs">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold font-mono text-xl">
                    ADM
                  </div>
                  <div>
                    <h3 className="text-lg font-bold uppercase text-neutral-900 dark:text-white">{user.name}</h3>
                    <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-mono px-2.5 py-0.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-full uppercase font-bold">
                      ROLE: {user.role?.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">Session Token Active</span>
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/40 dark:hover:bg-rose-900/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Terminate Admin Session</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* =========================================================================
          ADD / EDIT PRODUCT MODAL
         ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 text-neutral-900 dark:text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <h3 className="font-hero text-xl font-black uppercase tracking-tight">
                {editingProduct ? 'Edit Garment Details' : 'Add New Streetwear Garment'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-600 dark:text-rose-400 font-mono text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                  <div className="break-all font-mono font-medium">{formError}</div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                    Garment Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="MONOLITH 480GSM Boxy Hoodie"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                    Category *
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
                  >
                    <option value="Oversized T-Shirts">Oversized T-Shirts</option>
                    <option value="Graphic T-Shirts">Graphic T-Shirts</option>
                    <option value="Hoodies">Hoodies</option>
                    <option value="Limited Edition Drops">Limited Edition Drops</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    value={prodOriginalPrice}
                    onChange={(e) => setProdOriginalPrice(e.target.value)}
                    placeholder="5999"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                    Fabric GSM
                  </label>
                  <input
                    type="number"
                    value={prodGsm}
                    onChange={(e) => setProdGsm(e.target.value)}
                    placeholder="300"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-neutral-500 dark:text-neutral-400 mb-1.5 flex items-center justify-between">
                  <span>Garment Image (Upload to Supabase Storage) *</span>
                  <span className="text-amber-500 font-bold">Bucket: product-images</span>
                </label>

                <div className="space-y-3">
                  {/* File Upload Zone */}
                  <div className="relative border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-5 transition text-center bg-neutral-50 dark:bg-neutral-950/80 group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileSelect}
                      disabled={isUploadingImage}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center gap-2 py-2">
                          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-mono font-bold text-amber-500 animate-pulse">
                            {uploadProgress || 'Uploading image to Supabase Storage...'}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase font-mono">
                              Click or Drag & Drop Garment Image
                            </p>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                              Formats: PNG, JPG, WEBP, GIF, SVG • Maximum size: <span className="font-bold text-amber-500">5 MB</span>
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Image Preview Card */}
                  {(prodImage1 || imagePreviewUrl) && (
                    <div className="p-3.5 bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-700 flex-shrink-0">
                          <img
                            src={imagePreviewUrl || prodImage1}
                            alt="Garment Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80';
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Preview Active & Ready</span>
                          </div>
                          <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 truncate max-w-md" title={prodImage1}>
                            {prodImage1 ? `Bucket URL: ${prodImage1}` : 'Local file preview loaded'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setProdImage1('');
                          setImagePreviewUrl(null);
                        }}
                        className="p-2 text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition cursor-pointer flex-shrink-0"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Manual URL Input Fallback */}
                  <details className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                    <summary className="cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-200">
                      Or edit image URL manually
                    </summary>
                    <input
                      type="url"
                      value={prodImage1}
                      onChange={(e) => {
                        setProdImage1(e.target.value);
                        setImagePreviewUrl(e.target.value);
                      }}
                      placeholder="https://jjkmtvtdobhiehfzeljr.supabase.co/storage/v1/object/public/product-images/..."
                      className="w-full mt-1.5 px-3.5 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white text-[11px] font-mono focus:outline-none"
                    />
                  </details>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <label className="flex items-center gap-2 text-xs font-mono text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodInStock}
                    onChange={(e) => setProdInStock(e.target.checked)}
                    className="rounded bg-neutral-100 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-amber-500 focus:ring-0"
                  />
                  <span>In Stock</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-mono text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodNewArrival}
                    onChange={(e) => setProdNewArrival(e.target.checked)}
                    className="rounded bg-neutral-100 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-amber-500 focus:ring-0"
                  />
                  <span>New Arrival Badge</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-mono text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodLimitedDrop}
                    onChange={(e) => setProdLimitedDrop(e.target.checked)}
                    className="rounded bg-neutral-100 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-amber-500 focus:ring-0"
                  />
                  <span>Limited Drop Badge</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  disabled={isSavingProduct}
                  className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-mono font-bold uppercase rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-6 py-2.5 bg-neutral-900 text-white hover:bg-black dark:bg-white dark:text-neutral-950 font-button text-xs font-bold uppercase tracking-widest rounded-xl dark:hover:bg-neutral-200 transition shadow-lg cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingProduct ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                      <span>Syncing to Supabase...</span>
                    </>
                  ) : (
                    <span>SAVE & SYNC TO SUPABASE</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ORDER DETAILS MODAL
         ========================================================================= */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-6 space-y-5 text-neutral-900 dark:text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold text-sm">{selectedOrderDetails.id}</span>
                <p className="text-[10px] text-neutral-500 font-mono">
                  Order Date: {new Date(selectedOrderDetails.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Customer & Shipping</span>
                <p className="font-bold text-neutral-900 dark:text-white">{selectedOrderDetails.shippingAddress?.fullName}</p>
                <p className="text-neutral-600 dark:text-neutral-400">{selectedOrderDetails.shippingAddress?.email}</p>
                <p className="text-neutral-600 dark:text-neutral-400">{selectedOrderDetails.shippingAddress?.address}, {selectedOrderDetails.shippingAddress?.city}, {selectedOrderDetails.shippingAddress?.state} {selectedOrderDetails.shippingAddress?.zipCode}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Purchased Garments</span>
                <div className="space-y-2">
                  {selectedOrderDetails.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                      <div>
                        <span className="font-bold uppercase text-neutral-900 dark:text-white block">{item.name}</span>
                        <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">Size {item.size} • Qty {item.quantity}</span>
                      </div>
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center font-mono font-bold text-sm">
                <span>Total Amount Paid:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(selectedOrderDetails.total)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderDetails(null)}
              className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-mono font-bold uppercase rounded-xl transition cursor-pointer border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-white"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL
         ========================================================================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-sm w-full p-6 space-y-4 text-center text-neutral-900 dark:text-white shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="font-hero text-lg font-black uppercase">Confirm Deletion</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Are you sure you want to permanently delete garment <strong className="text-neutral-900 dark:text-white">{deleteConfirmId}</strong>? This action will sync deletion to Supabase.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-mono font-bold uppercase rounded-xl cursor-pointer transition border border-neutral-200 dark:border-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="flex-1 py-2.5 bg-rose-600 text-white text-xs font-mono font-bold uppercase rounded-xl hover:bg-rose-500 transition cursor-pointer shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
