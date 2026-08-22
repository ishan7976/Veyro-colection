import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Product,
  Order,
  OrderStatus,
  CourierPartner,
  Shipment,
  PromoCode
} from '../../types';
import { formatPrice } from '../../lib/currency';
import {
  supabase,
  fetchProductsFromSupabase,
  saveProductToSupabase,
  deleteProductFromSupabase,
  updateProductStockInSupabase,
  fetchOrdersFromSupabase,
  updateOrderStatusInSupabase,
  fetchCustomersFromSupabase,
  fetchShipmentsFromSupabase,
  saveShipmentToSupabase,
  fetchPromoCodesFromSupabase,
  savePromoCodeToSupabase,
  deletePromoCodeFromSupabase
} from '../../lib/supabase';

// Icons
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Boxes,
  Truck,
  CreditCard,
  BarChart3,
  Tag,
  Settings,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Lock,
  Eye,
  Trash2
} from 'lucide-react';

// Modals
import { ProductFormModal } from '../admin/ProductFormModal';
import { CreateShipmentModal } from '../admin/CreateShipmentModal';
import { CreateManualOrderModal } from '../admin/CreateManualOrderModal';
import { InvoiceModal } from '../admin/InvoiceModal';

// Sub Tabs
import { OverviewTab } from '../admin/tabs/OverviewTab';
import { ProductsTab } from '../admin/tabs/ProductsTab';
import { OrdersTab } from '../admin/tabs/OrdersTab';
import { CustomersTab } from '../admin/tabs/CustomersTab';
import { InventoryTab } from '../admin/tabs/InventoryTab';
import { ShippingTab } from '../admin/tabs/ShippingTab';
import { PaymentsTab } from '../admin/tabs/PaymentsTab';
import { AnalyticsTab } from '../admin/tabs/AnalyticsTab';
import { MarketingTab } from '../admin/tabs/MarketingTab';
import { SettingsTab } from '../admin/tabs/SettingsTab';

export const AdminDashboardView: React.FC = () => {
  const { user, login } = useAuth();
  const { addToast } = useToast();
  const { navigateTo, adminSubRoute, setAdminSubRoute } = useNavigation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Active Admin Sub-tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'orders' | 'customers' | 'inventory' | 'shipping' | 'payments' | 'analytics' | 'marketing' | 'settings'
  >(() => {
    if (adminSubRoute === 'dashboard' || !adminSubRoute) return 'overview';
    return adminSubRoute as any;
  });

  // Sync tab with NavigationContext
  useEffect(() => {
    if (adminSubRoute) {
      if (adminSubRoute === 'dashboard') {
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

  // Mobile Sidebar Drawer
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Global Admin Search Bar
  const [globalSearch, setGlobalSearch] = useState('');
  const [isGlobalSearchFocused, setIsGlobalSearchFocused] = useState(false);

  // Notifications Popover
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; time: string; type: 'order' | 'stock' | 'payment' | 'shipping'; read: boolean }>>([
    { id: '1', title: 'New UPI payment requires verification for Order #VR-8492', time: '5m ago', type: 'payment', read: false },
    { id: '2', title: 'Heavyweight Boxy Tee stock below threshold (4 units left)', time: '25m ago', type: 'stock', read: false },
    { id: '3', title: 'Delhivery courier pickup dispatched for 3 parcels', time: '1h ago', type: 'shipping', read: true },
    { id: '4', title: 'Supabase Real-time connection established successfully', time: '2h ago', type: 'order', read: true }
  ]);

  // Login Gate State
  const [loginEmail, setLoginEmail] = useState('admin@veyro.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Core Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [shipmentOrder, setShipmentOrder] = useState<Order | null>(null);

  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Filters
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productViewMode, setProductViewMode] = useState<'grid' | 'table'>('grid');

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [analyticsRange, setAnalyticsRange] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');

  // Marketing Promo Code Form
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('15');
  const [newPromoMinOrder, setNewPromoMinOrder] = useState('2499');

  // 1. Initial Load & Supabase Fetch
  const loadDashboardData = async (showToastNotice = false) => {
    setIsSyncing(true);
    try {
      const [prodRes, ordRes, custRes, shpRes, promoRes] = await Promise.all([
        fetchProductsFromSupabase(),
        fetchOrdersFromSupabase(),
        fetchCustomersFromSupabase(),
        fetchShipmentsFromSupabase(),
        fetchPromoCodesFromSupabase()
      ]);

      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data);
      }
      if (ordRes.success && ordRes.data) {
        setOrders(ordRes.data);
      }
      if (custRes.success && custRes.data) {
        setCustomers(custRes.data);
      }
      if (shpRes.success && shpRes.data && shpRes.data.length > 0) {
        setShipments(shpRes.data);
      } else {
        setShipments([
          {
            id: 'shp_101',
            orderId: 'VR-8492',
            customerName: 'Aarav Singhania',
            courierPartner: 'Delhivery',
            awbNumber: 'DLHV-928174829',
            status: 'In Transit',
            originCity: 'New Delhi HQ',
            destCity: 'Mumbai, Maharashtra',
            destPincode: '400050',
            weightKg: 0.95,
            shippingFee: 85,
            timeline: [
              { title: 'Manifested & Label Created', location: 'Delhi Hub', timestamp: '2026-08-20T10:00:00Z', done: true },
              { title: 'Picked Up by Delhivery Courier', location: 'Delhi Hub', timestamp: '2026-08-20T14:30:00Z', done: true },
              { title: 'In Transit to Mumbai Sorting Facility', location: 'Transit Center', timestamp: '2026-08-21T02:15:00Z', done: true },
              { title: 'Out For Delivery', location: 'Bandra Delivery Center', timestamp: '2026-08-21T09:00:00Z', done: false }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'shp_102',
            orderId: 'VR-8488',
            customerName: 'Devika Mehra',
            courierPartner: 'BlueDart',
            awbNumber: 'BLDT-482910481',
            status: 'Delivered',
            originCity: 'New Delhi HQ',
            destCity: 'Bengaluru, Karnataka',
            destPincode: '560038',
            weightKg: 1.2,
            shippingFee: 145,
            timeline: [
              { title: 'Picked Up Air Hub', location: 'Delhi Air Cargo', timestamp: '2026-08-19T08:00:00Z', done: true },
              { title: 'Delivered to Consignee', location: 'Indiranagar Bangalore', timestamp: '2026-08-20T17:00:00Z', done: true }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      }
      if (promoRes.success && promoRes.data && promoRes.data.length > 0) {
        setPromoCodes(promoRes.data);
      } else {
        setPromoCodes([
          { id: '1', code: 'VEYRO10', discountPercent: 10, minOrderValue: 1999, usageLimit: 500, timesUsed: 142, isActive: true, expiresAt: '2026-12-31' },
          { id: '2', code: 'STREET20', discountPercent: 20, minOrderValue: 3499, usageLimit: 200, timesUsed: 89, isActive: true, expiresAt: '2026-11-30' },
          { id: '3', code: 'FIRSTDROP', discountPercent: 15, minOrderValue: 2499, usageLimit: 1000, timesUsed: 312, isActive: true, expiresAt: '2026-12-31' }
        ]);
      }

      setLastSyncTime(new Date());

      if (showToastNotice) {
        addToast({
          title: 'Supabase Synchronized',
          message: `Live telemetry updated (${ordRes.data?.length || 0} orders, ${prodRes.data?.length || 0} garments).`,
          type: 'success'
        });
      }
    } catch (err) {
      console.error('Error fetching admin data from Supabase:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh interval every 12 seconds to catch newly placed orders across tabs/devices
    const interval = setInterval(() => {
      loadDashboardData(false);
    }, 12000);

    // Supabase real-time subscription for instant updates on orders table
    let channel: any = null;
    try {
      channel = supabase
        .channel('admin-live-telemetry')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          console.log('[Admin Dashboard] Live Supabase order event received, reloading data...');
          loadDashboardData(false);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          loadDashboardData(false);
        })
        .subscribe();
    } catch (e) {
      console.warn('[Admin Dashboard] Realtime setup notice:', e);
    }

    return () => {
      clearInterval(interval);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // cleanup
        }
      }
    };
  }, []);

  // 2. Computed Analytics & Statistics
  const dashboardStats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => {
      if (o.paymentStatus === 'PAID' || o.paymentStatus === 'Paid' || o.status === 'Delivered' || o.status === 'Shipped') {
        return sum + o.total;
      }
      return sum + (o.total || 0);
    }, 0);

    const totalOrdersCount = orders.length;
    const pendingOrdersCount = orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed' || o.paymentStatus === 'PENDING_VERIFICATION').length;
    const deliveredOrdersCount = orders.filter(o => o.status === 'Delivered').length;
    const returnOrdersCount = orders.filter(o => o.status === 'Returned' || o.status === 'Cancelled').length;

    const totalInventoryUnits = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * (p.stockQuantity || 0)), 0);
    const customerCount = customers.length || 24;

    const deliveryRate = totalOrdersCount > 0 ? Math.round((deliveredOrdersCount / totalOrdersCount) * 100) : 94;
    const returnRate = totalOrdersCount > 0 ? ((returnOrdersCount / totalOrdersCount) * 100).toFixed(1) : '2.1';

    return {
      totalRevenue,
      totalOrdersCount,
      pendingOrdersCount,
      deliveredOrdersCount,
      returnOrdersCount,
      totalInventoryUnits,
      totalInventoryValue,
      customerCount,
      deliveryRate,
      returnRate
    };
  }, [orders, products, customers]);

  // Order Pipeline statuses
  const pipelineStatuses: Array<{ label: OrderStatus; color: string; bg: string }> = [
    { label: 'Pending', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Confirmed', color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { label: 'Processing', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Packed', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Shipped', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Out for Delivery', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'Delivered', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Returned', color: 'text-orange-500', bg: 'bg-orange-500/10' }
  ];

  const pipelineCounts = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    pipelineStatuses.forEach(st => {
      counts[st.label] = { count: 0, value: 0 };
    });

    orders.forEach(o => {
      if (counts[o.status]) {
        counts[o.status].count += 1;
        counts[o.status].value += o.total;
      }
    });
    return counts;
  }, [orders]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = productSearch === '' ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.slug.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = productCategoryFilter === 'All' || p.category === productCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, productCategoryFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = orderSearch === '' ||
        o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.shippingAddress?.fullName || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.shippingAddress?.email || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.trackingNumber || '').toLowerCase().includes(orderSearch.toLowerCase());

      const matchesStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Universal Search Global Results
  const globalSearchResults = useMemo(() => {
    if (!globalSearch.trim()) return null;
    const query = globalSearch.toLowerCase().trim();

    const matchedProds = products.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)).slice(0, 3);
    const matchedOrds = orders.filter(o => o.id.toLowerCase().includes(query) || (o.shippingAddress?.fullName || '').toLowerCase().includes(query) || (o.trackingNumber || '').toLowerCase().includes(query)).slice(0, 3);
    const matchedCusts = customers.filter(c => (c.name || '').toLowerCase().includes(query) || (c.email || '').toLowerCase().includes(query)).slice(0, 3);

    return {
      products: matchedProds,
      orders: matchedOrds,
      customers: matchedCusts
    };
  }, [globalSearch, products, orders, customers]);

  // 3. Handlers
  const handleSaveProduct = async (productData: any) => {
    const res = await saveProductToSupabase(productData);
    if (res.success) {
      addToast({
        title: 'Product Saved',
        message: `${productData.name} synchronized with Supabase catalog.`,
        type: 'success'
      });
      loadDashboardData();
    } else {
      addToast({
        title: 'Error Saving Product',
        message: res.error || 'Failed to save product',
        type: 'error'
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await deleteProductFromSupabase(id);
    if (res.success) {
      addToast({
        title: 'Product Deleted',
        message: 'Product removed from Supabase and catalog.',
        type: 'info'
      });
      setDeleteConfirmId(null);
      loadDashboardData();
    } else {
      addToast({
        title: 'Delete Failed',
        message: res.error || 'Failed to delete product',
        type: 'error'
      });
    }
  };

  const handleUpdateOrderStatus = async (
    order: Order, 
    newStatus: string, 
    newPaymentStatus?: string, 
    newTrackingNumber?: string
  ) => {
    const statusVal = newStatus || order.status;
    const paymentStatusVal = newPaymentStatus || order.paymentStatus || 'Pending';
    const trackingVal = newTrackingNumber !== undefined ? newTrackingNumber : order.trackingNumber;

    const res = await updateOrderStatusInSupabase(order.id, statusVal, trackingVal, paymentStatusVal);
    if (res.success) {
      addToast({
        title: 'Order Status Updated',
        message: `Order #${order.id} set to ${statusVal} (${paymentStatusVal})`,
        type: 'success'
      });
      loadDashboardData();
      if (selectedOrderDetails && selectedOrderDetails.id === order.id) {
        setSelectedOrderDetails({
          ...selectedOrderDetails,
          status: statusVal as any,
          paymentStatus: paymentStatusVal as any,
          trackingNumber: trackingVal
        });
      }
    } else {
      addToast({
        title: 'Update Error',
        message: res.error || 'Failed to update order status in Supabase',
        type: 'error'
      });
    }
  };

  const handleConfirmUpiPayment = (order: Order) => {
    handleUpdateOrderStatus(order, order.status, 'PAID');
  };

  const handleRejectUpiPayment = (order: Order) => {
    handleUpdateOrderStatus(order, 'Cancelled', 'FAILED');
  };

  const handleSaveShipment = async (shipment: Shipment, newOrderStatus?: string) => {
    const res = await saveShipmentToSupabase(shipment);
    if (res.success) {
      addToast({
        title: 'Shipment Manifested',
        message: `AWB ${shipment.awbNumber} generated via ${shipment.courierPartner}.`,
        type: 'success'
      });

      const targetOrder = orders.find(o => o.id === shipment.orderId);
      if (targetOrder) {
        await updateOrderStatusInSupabase(
          targetOrder.id,
          newOrderStatus || 'Shipped',
          shipment.awbNumber,
          targetOrder.paymentStatus || 'Paid'
        );
      }
      loadDashboardData();
    } else {
      addToast({
        title: 'Shipment Error',
        message: res.error || 'Failed to manifest shipment',
        type: 'error'
      });
    }
  };

  const handleSaveManualOrder = async (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    try {
      const resp = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      if (resp.ok) {
        addToast({
          title: 'Manual Order Created',
          message: `Order #${newOrder.id} successfully recorded in Supabase.`,
          type: 'success'
        });
      }
    } catch (e) {
      console.warn('Manual order API notice:', e);
    }
    loadDashboardData();
  };

  const handleStockAdjust = async (product: Product, delta: number) => {
    const newQty = Math.max(0, (product.stockQuantity || 0) + delta);
    const inStock = newQty > 0;
    await updateProductStockInSupabase(product.id, newQty);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stockQuantity: newQty, inStock } : p));
  };

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim()) return;

    const promo: PromoCode = {
      id: `promo_${Date.now()}`,
      code: newPromoCode.trim().toUpperCase(),
      discountPercent: parseInt(newPromoDiscount) || 15,
      minOrderValue: parseInt(newPromoMinOrder) || 1999,
      usageLimit: 500,
      timesUsed: 0,
      isActive: true,
      expiresAt: '2026-12-31'
    };

    const res = await savePromoCodeToSupabase(promo);
    if (res.success) {
      addToast({
        title: 'Promo Code Created',
        message: `Code ${promo.code} is now live for checkout discounts.`,
        type: 'success'
      });
      setNewPromoCode('');
      loadDashboardData();
    }
  };

  const handleDeletePromo = async (code: string) => {
    await deletePromoCodeFromSupabase(code);
    addToast({
      title: 'Promo Code Removed',
      message: `Code ${code} deactivated.`,
      type: 'info'
    });
    loadDashboardData();
  };

  // Sparkline Trend SVG helper
  const renderSparkline = (points: number[], color = '#f59e0b') => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 80;
    const height = 24;

    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords}
        />
      </svg>
    );
  };

  // 4. Navigation Menu Items
  const navMenuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products & Drops', icon: Package, badge: products.length },
    { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingBag, badge: dashboardStats.pendingOrdersCount || undefined },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'shipping', label: 'Shipping & Tracking', icon: Truck },
    { id: 'payments', label: 'Payments & UPI', icon: CreditCard, alert: orders.some(o => o.paymentStatus === 'PENDING_VERIFICATION') },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'marketing', label: 'Marketing', icon: Tag },
    { id: 'settings', label: 'Settings & Theme', icon: Settings }
  ];

  // 5. Authentication Gate
  if (!user || user.role !== 'admin') {
    return (
      <div className={`min-h-[85vh] flex items-center justify-center p-4 transition-colors ${
        isDark ? 'bg-[#050505] text-white' : 'bg-neutral-100 text-neutral-900'
      }`}>
        <div className={`w-full max-w-md border backdrop-blur-xl rounded-2xl p-8 shadow-2xl space-y-6 transition ${
          isDark 
            ? 'bg-neutral-900/90 border-amber-500/20 text-neutral-100' 
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}>
          {/* Quick theme switcher for login view */}
          <div className="flex justify-end">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition cursor-pointer text-xs font-mono flex items-center gap-1.5 ${
                isDark 
                  ? 'bg-neutral-950 border-neutral-800 text-amber-400' 
                  : 'bg-neutral-50 border-neutral-200 text-amber-700'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <h2 className={`text-2xl font-black font-mono tracking-tighter uppercase ${
                isDark ? 'text-white' : 'text-neutral-950'
              }`}>
                VEYRO
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-amber-400/10 text-amber-500 border border-amber-400/20 rounded font-bold">
                HQ ADMIN
              </span>
            </div>
            <p className={`text-xs font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Atelier Management Console & Logistics Portal
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsLoggingIn(true);
              const success = await login(loginEmail, loginPassword);
              setIsLoggingIn(false);
              if (success) {
                addToast({ title: 'Authenticated', message: 'Welcome back, Atelier Administrator.', type: 'success' });
              } else {
                addToast({ title: 'Access Denied', message: 'Invalid admin credentials or role unauthorized.', type: 'error' });
              }
            }}
            className="space-y-4 font-mono text-xs"
          >
            <div>
              <label className={`block mb-1 font-bold text-[10px] uppercase ${
                isDark ? 'text-neutral-400' : 'text-neutral-700'
              }`}>
                Admin Email
              </label>
              <input
                id="admin-login-email"
                type="email"
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-xl focus:border-amber-500 focus:outline-none transition ${
                  isDark 
                    ? 'bg-neutral-950 border-neutral-800 text-white' 
                    : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                }`}
              />
            </div>
            <div>
              <label className={`block mb-1 font-bold text-[10px] uppercase ${
                isDark ? 'text-neutral-400' : 'text-neutral-700'
              }`}>
                Password
              </label>
              <input
                id="admin-login-password"
                type="password"
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-xl focus:border-amber-500 focus:outline-none transition ${
                  isDark 
                    ? 'bg-neutral-950 border-neutral-800 text-white' 
                    : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                }`}
              />
            </div>

            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold uppercase rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoggingIn ? 'Authenticating...' : 'Access Admin Dashboard'}</span>
            </button>
          </form>

          <div className={`pt-4 border-t text-center font-mono text-[11px] ${
            isDark ? 'border-neutral-800 text-neutral-500' : 'border-neutral-200 text-neutral-600'
          }`}>
            <span>Demo credentials: admin@veyro.com / admin123</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans selection:bg-amber-500 selection:text-black transition-colors duration-200 ${
      isDark ? 'bg-[#050505] text-neutral-100' : 'bg-neutral-50 text-neutral-900'
    }`}>
      
      {/* Top Banner with Quick Actions & Live Status */}
      <div className={`border-b px-4 sm:px-6 py-2 flex items-center justify-between font-mono text-xs ${
        isDark ? 'bg-neutral-950/80 border-neutral-800/80 text-neutral-400' : 'bg-neutral-100 border-neutral-200 text-neutral-600'
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              SUPABASE REAL-TIME ACTIVE
            </span>
          </div>
          <span className="hidden md:inline text-neutral-400">|</span>
          <span className="hidden md:inline text-[11px]">
            Express Courier APIs: Delhivery, BlueDart & Quickink Live
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <button
            onClick={() => navigateTo('shop')}
            className="flex items-center gap-1 hover:text-amber-500 transition cursor-pointer font-bold"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-41px)]">
        
        {/* =========================================================================
            1. LEFT SIDEBAR NAVIGATION
           ========================================================================= */}
        
        {/* Mobile Sidebar Overlay */}
        {isMobileNavOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          ></div>
        )}

        <aside
          className={`fixed lg:sticky top-0 z-40 h-screen w-64 border-r flex flex-col justify-between transition-all duration-300 ${
            isDark ? 'bg-neutral-950 border-neutral-800/80' : 'bg-white border-neutral-200 shadow-sm'
          } ${
            isMobileNavOpen ? 'left-0' : '-left-64 lg:left-0'
          }`}
        >
          <div className="p-4 space-y-6">
            
            {/* VEYRO Logo Branding */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-black font-mono text-base shadow-md">
                  V
                </div>
                <div>
                  <h1 className={`font-black font-mono tracking-tighter text-lg leading-none uppercase ${
                    isDark ? 'text-white' : 'text-neutral-950'
                  }`}>
                    VEYRO
                  </h1>
                  <span className="text-[9px] font-mono text-amber-500 font-bold uppercase tracking-widest">
                    STREETWEAR ADMIN
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className={`lg:hidden p-1.5 rounded-lg ${
                  isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-950'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Menu Links */}
            <nav className="space-y-1 font-mono text-xs">
              {navMenuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`admin-nav-${item.id}`}
                    onClick={() => {
                      handleTabSelect(item.id);
                      setIsMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition cursor-pointer border ${
                      isActive
                        ? isDark
                          ? 'bg-neutral-900 text-amber-400 border-amber-500/30 shadow-sm'
                          : 'bg-amber-50 text-amber-800 border-amber-300 font-bold shadow-xs'
                        : isDark
                          ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60 border-transparent'
                          : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent className={`w-4 h-4 ${isActive ? 'text-amber-500' : ''}`} />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.alert && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                      )}
                      {item.badge !== undefined && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isActive
                            ? 'bg-amber-500 text-neutral-950'
                            : isDark
                              ? 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                              : 'bg-neutral-200 text-neutral-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>

          </div>

          {/* Sidebar Footer User Badge */}
          <div className={`p-4 border-t font-mono text-xs ${
            isDark ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-neutral-50'
          }`}>
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-neutral-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <div className="truncate">
                  <div className={`font-bold text-[11px] truncate ${isDark ? 'text-white' : 'text-neutral-950'}`}>
                    {user?.fullName || 'Atelier Admin'}
                  </div>
                  <div className="text-[9px] text-amber-500 font-bold uppercase">Super Admin</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* =========================================================================
            2. MAIN CONTENT AREA & HEADER
           ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* TOP HEADER */}
          <header className={`sticky top-0 z-30 px-4 sm:px-8 py-3.5 border-b backdrop-blur-xl flex items-center justify-between gap-4 transition-colors duration-200 ${
            isDark ? 'bg-[#050505]/90 border-neutral-800/80' : 'bg-white/90 border-neutral-200 shadow-sm'
          }`}>
            
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileNavOpen(true)}
                className={`lg:hidden p-2 rounded-xl border transition cursor-pointer ${
                  isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-neutral-100 border-neutral-200 text-neutral-700'
                }`}
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Global Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  id="admin-global-search"
                  type="text"
                  placeholder="Search orders, garments, customers, AWB..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onFocus={() => setIsGlobalSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsGlobalSearchFocused(false), 200)}
                  className={`w-full pl-10 pr-4 py-2 text-xs font-mono rounded-xl border focus:outline-none transition ${
                    isDark 
                      ? 'bg-neutral-900/90 border-neutral-800 text-white placeholder-neutral-500 focus:border-amber-500' 
                      : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-amber-500'
                  }`}
                />

                {/* Autocomplete Search Dropdown */}
                {isGlobalSearchFocused && globalSearchResults && (
                  <div className={`absolute left-0 top-full mt-2 w-full border rounded-2xl p-3 shadow-2xl z-50 space-y-3 font-mono text-xs ${
                    isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                  }`}>
                    {globalSearchResults.products.length > 0 && (
                      <div>
                        <span className="text-[10px] text-amber-500 font-bold uppercase">Products</span>
                        {globalSearchResults.products.map(p => (
                          <div
                            key={p.id}
                            onMouseDown={() => {
                              setActiveTab('products');
                              setProductSearch(p.name);
                            }}
                            className={`p-2 rounded-lg cursor-pointer flex justify-between ${
                              isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'
                            }`}
                          >
                            <span className="font-bold truncate">{p.name}</span>
                            <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(p.price)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {globalSearchResults.orders.length > 0 && (
                      <div>
                        <span className="text-[10px] text-amber-500 font-bold uppercase">Orders</span>
                        {globalSearchResults.orders.map(o => (
                          <div
                            key={o.id}
                            onMouseDown={() => {
                              setActiveTab('orders');
                              setOrderSearch(o.id);
                            }}
                            className={`p-2 rounded-lg cursor-pointer flex justify-between ${
                              isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'
                            }`}
                          >
                            <span>#{o.id} • {o.shippingAddress?.fullName}</span>
                            <span className="text-amber-500 font-bold">{o.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Header Controls */}
            <div className="flex items-center gap-2 sm:gap-3 font-mono">
              
              {/* Sync Database Live */}
              <button
                id="sync-database-btn"
                onClick={() => loadDashboardData(true)}
                disabled={isSyncing}
                title="Synchronize with Supabase"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs transition cursor-pointer ${
                  isDark 
                    ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300' 
                    : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-700'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{isSyncing ? 'Syncing...' : 'Sync DB'}</span>
              </button>

              {/* Quick Action: Create Order */}
              <button
                id="quick-create-order-btn"
                onClick={() => setIsManualOrderModalOpen(true)}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs transition cursor-pointer ${
                  isDark 
                    ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300' 
                    : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-700'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                <span>+ Order</span>
              </button>

              {/* Quick Action: Add Product */}
              <button
                id="quick-add-product-btn"
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase transition shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Garment</span>
              </button>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  id="admin-notifications-btn"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className={`p-2 rounded-xl border relative transition cursor-pointer ${
                    isDark 
                      ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300' 
                      : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-700'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400"></span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div className={`absolute right-0 top-full mt-2 w-80 border rounded-2xl p-4 shadow-2xl z-50 space-y-3 font-mono text-xs ${
                    isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
                  }`}>
                    <div className={`flex items-center justify-between pb-2 border-b ${
                      isDark ? 'border-neutral-800' : 'border-neutral-200'
                    }`}>
                      <span className={`font-bold uppercase text-[11px] ${isDark ? 'text-white' : 'text-neutral-950'}`}>
                        Atelier Notifications
                      </span>
                      <button
                        onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                        className="text-[10px] text-amber-500 hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
                            n.read 
                              ? isDark ? 'bg-neutral-950/40 border-neutral-800 text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                              : isDark ? 'bg-neutral-950 border-amber-500/30 text-neutral-200' : 'bg-amber-50/60 border-amber-300 text-neutral-900'
                          }`}
                        >
                          <div className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>{n.title}</div>
                          <div className="text-[10px] text-neutral-500">{n.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </header>

          {/* MAIN VIEW CONTENT CONTAINER */}
          <main className="p-4 sm:p-8 flex-1">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <OverviewTab
                stats={dashboardStats}
                lastSyncTime={lastSyncTime}
                pipelineStatuses={pipelineStatuses}
                pipelineCounts={pipelineCounts}
                orders={orders}
                analyticsRange={analyticsRange}
                setAnalyticsRange={setAnalyticsRange}
                renderSparkline={renderSparkline}
                onNavigateTab={handleTabSelect}
                onFilterStatus={(st) => setOrderStatusFilter(st)}
                onSelectOrder={(ord) => setSelectedOrderDetails(ord)}
                onPrintInvoice={(ord) => {
                  setInvoiceOrder(ord);
                  setIsInvoiceModalOpen(true);
                }}
              />
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
              <ProductsTab
                products={products}
                filteredProducts={filteredProducts}
                productSearch={productSearch}
                setProductSearch={setProductSearch}
                productCategoryFilter={productCategoryFilter}
                setProductCategoryFilter={setProductCategoryFilter}
                productViewMode={productViewMode}
                setProductViewMode={setProductViewMode}
                onAddNewProduct={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                onEditProduct={(p) => {
                  setEditingProduct(p);
                  setIsProductModalOpen(true);
                }}
                onDeleteProductPrompt={(id) => setDeleteConfirmId(id)}
                onAdjustStock={handleStockAdjust}
              />
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <OrdersTab
                orders={orders}
                filteredOrders={filteredOrders}
                orderSearch={orderSearch}
                setOrderSearch={setOrderSearch}
                orderStatusFilter={orderStatusFilter}
                setOrderStatusFilter={setOrderStatusFilter}
                onOpenManualOrderModal={() => setIsManualOrderModalOpen(true)}
                onSelectOrder={(ord) => setSelectedOrderDetails(ord)}
                onOpenShipmentModal={(ord) => {
                  setShipmentOrder(ord);
                  setIsShipmentModalOpen(true);
                }}
                onPrintInvoice={(ord) => {
                  setInvoiceOrder(ord);
                  setIsInvoiceModalOpen(true);
                }}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onConfirmUpi={handleConfirmUpiPayment}
                onRejectUpi={handleRejectUpiPayment}
              />
            )}

            {/* CUSTOMERS TAB */}
            {activeTab === 'customers' && (
              <CustomersTab
                customers={customers}
                orders={orders}
              />
            )}

            {/* INVENTORY TAB */}
            {activeTab === 'inventory' && (
              <InventoryTab
                products={products}
                onAdjustStock={handleStockAdjust}
              />
            )}

            {/* SHIPPING TAB */}
            {activeTab === 'shipping' && (
              <ShippingTab
                shipments={shipments}
              />
            )}

            {/* PAYMENTS TAB */}
            {activeTab === 'payments' && (
              <PaymentsTab
                orders={orders}
                onConfirmUpi={handleConfirmUpiPayment}
                onRejectUpi={handleRejectUpiPayment}
                onSelectOrder={(ord) => setSelectedOrderDetails(ord)}
              />
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <AnalyticsTab
                products={products}
                orders={orders}
              />
            )}

            {/* MARKETING TAB */}
            {activeTab === 'marketing' && (
              <MarketingTab
                promoCodes={promoCodes}
                newPromoCode={newPromoCode}
                setNewPromoCode={setNewPromoCode}
                newPromoDiscount={newPromoDiscount}
                setNewPromoDiscount={setNewPromoDiscount}
                newPromoMinOrder={newPromoMinOrder}
                setNewPromoMinOrder={setNewPromoMinOrder}
                onCreatePromoCode={handleCreatePromoCode}
                onDeletePromo={handleDeletePromo}
              />
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <SettingsTab
                productsCount={products.length}
                ordersCount={orders.length}
                customersCount={customers.length}
                onCopySql={() => {
                  addToast({ title: 'Copied', message: 'SQL schema copied to clipboard.', type: 'info' });
                }}
              />
            )}

          </main>

        </div>
      </div>

      {/* =========================================================================
          GLOBAL MODALS (Print Invoice, Quickink Dispatch, Manual Order, Edit Product)
         ========================================================================= */}

      {/* 1. Print Invoice Modal */}
      {isInvoiceModalOpen && (
        <InvoiceModal
          order={invoiceOrder}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setInvoiceOrder(null);
          }}
        />
      )}

      {/* 2. Create Quickink / Shiprocket Dispatch Modal */}
      {isShipmentModalOpen && (
        <CreateShipmentModal
          order={shipmentOrder}
          onClose={() => {
            setIsShipmentModalOpen(false);
            setShipmentOrder(null);
          }}
          onSaveShipment={handleSaveShipment}
        />
      )}

      {/* 3. Create Manual Order Modal */}
      {isManualOrderModalOpen && (
        <CreateManualOrderModal
          products={products}
          onClose={() => setIsManualOrderModalOpen(false)}
          onSaveOrder={handleSaveManualOrder}
        />
      )}

      {/* 4. Add / Edit Product Modal */}
      {isProductModalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
        />
      )}

      {/* 5. Delete Product Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`w-full max-w-md border rounded-2xl p-6 shadow-2xl font-mono text-xs space-y-4 ${
            isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
          }`}>
            <h3 className="text-base font-bold text-rose-500 uppercase">Confirm Delete Garment</h3>
            <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
              Are you sure you want to delete this product? It will be removed from Supabase and will no longer appear in the store.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className={`px-4 py-2 rounded-xl border transition cursor-pointer font-bold ${
                  isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-neutral-100 border-neutral-300 text-neutral-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Delete Garment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Order Details Quick Drawer */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`w-full max-w-xl border rounded-2xl shadow-2xl p-6 font-mono text-xs space-y-5 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-500 uppercase">Order #{selectedOrderDetails.id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedOrderDetails.status === 'Delivered' 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {selectedOrderDetails.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-950'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Shipping Info */}
            <div className={`p-4 rounded-xl border space-y-2 ${
              isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <div className="font-bold text-amber-500 uppercase text-[11px]">Delivery & Recipient Details</div>
              <div className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>{selectedOrderDetails.shippingAddress?.fullName}</div>
              <div className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
                {selectedOrderDetails.shippingAddress?.address}, {selectedOrderDetails.shippingAddress?.city}, {selectedOrderDetails.shippingAddress?.state} - {selectedOrderDetails.shippingAddress?.zipCode}
              </div>
              <div className="text-neutral-500">Phone: {selectedOrderDetails.shippingAddress?.phone}</div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="font-bold text-amber-500 uppercase text-[11px]">Ordered Items ({selectedOrderDetails.items.length})</div>
              <div className="space-y-1.5">
                {selectedOrderDetails.items.map((it, idx) => (
                  <div key={idx} className={`p-2.5 rounded-lg border flex justify-between items-center ${
                    isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                  }`}>
                    <div>
                      <div className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>{it.name}</div>
                      <div className="text-[10px] text-neutral-500">Size: {it.size} • Qty: {it.quantity}</div>
                    </div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(it.price * it.quantity)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-3 border-t border-neutral-800 text-sm font-bold">
              <span className={isDark ? 'text-white' : 'text-neutral-950'}>Grand Total</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(selectedOrderDetails.total)}</span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setInvoiceOrder(selectedOrderDetails);
                  setIsInvoiceModalOpen(true);
                }}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  isDark ? 'bg-neutral-800 border-neutral-700 text-amber-400' : 'bg-amber-50 border-amber-300 text-amber-700'
                }`}
              >
                Print Tax Invoice
              </button>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs uppercase cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
