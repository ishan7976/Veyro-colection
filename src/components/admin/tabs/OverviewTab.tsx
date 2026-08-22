import React from 'react';
import { Order, Product, OrderStatus } from '../../../types';
import { formatPrice } from '../../../lib/currency';
import { useTheme } from '../../../context/ThemeContext';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Users,
  Truck,
  ArrowUpRight,
  ChevronRight,
  Eye,
  Printer
} from 'lucide-react';

interface OverviewTabProps {
  stats: {
    totalRevenue: number;
    totalOrdersCount: number;
    pendingOrdersCount: number;
    deliveredOrdersCount: number;
    returnOrdersCount: number;
    totalInventoryUnits: number;
    totalInventoryValue: number;
    customerCount: number;
    deliveryRate: number;
    returnRate: string;
  };
  lastSyncTime: Date;
  pipelineStatuses: Array<{ label: OrderStatus; color: string; bg: string }>;
  pipelineCounts: Record<string, { count: number; value: number }>;
  orders: Order[];
  analyticsRange: '7D' | '30D' | '90D' | '1Y';
  setAnalyticsRange: (range: '7D' | '30D' | '90D' | '1Y') => void;
  renderSparkline: (points: number[], color?: string) => React.ReactNode;
  onNavigateTab: (tabId: string) => void;
  onFilterStatus: (status: string) => void;
  onSelectOrder: (order: Order) => void;
  onPrintInvoice: (order: Order) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  lastSyncTime,
  pipelineStatuses,
  pipelineCounts,
  orders,
  analyticsRange,
  setAnalyticsRange,
  renderSparkline,
  onNavigateTab,
  onFilterStatus,
  onSelectOrder,
  onPrintInvoice
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-8 font-mono">
      
      {/* 1. LIVE STATISTIC CARDS (7 Primary Metrics) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className={`text-xl font-bold uppercase tracking-wider ${
              isDark ? 'text-white' : 'text-neutral-950'
            }`}>
              Atelier Performance Overview
            </h2>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Real-time revenue, order fulfillment & inventory telemetry
            </p>
          </div>
          <div className={`text-[11px] flex items-center gap-1.5 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Last Synced: {lastSyncTime.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          
          {/* Card 1: Total Revenue */}
          <div className={`p-4 rounded-2xl border transition shadow-sm space-y-2 ${
            isDark 
              ? 'bg-neutral-950/90 border-neutral-800 hover:border-amber-500/40 text-neutral-100' 
              : 'bg-white border-neutral-200 hover:border-amber-500/40 text-neutral-900'
          }`}>
            <div className={`flex items-center justify-between text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              <span>Total Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>
              {formatPrice(stats.totalRevenue)}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-emerald-500 flex items-center font-bold">
                <ArrowUpRight className="w-3 h-3" /> +18.4%
              </span>
              {renderSparkline([20, 28, 35, 45, 60, 75, 92], '#10b981')}
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className={`p-4 rounded-2xl border transition shadow-sm space-y-2 ${
            isDark 
              ? 'bg-neutral-950/90 border-neutral-800 hover:border-amber-500/40 text-neutral-100' 
              : 'bg-white border-neutral-200 hover:border-amber-500/40 text-neutral-900'
          }`}>
            <div className={`flex items-center justify-between text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              <span>Total Orders</span>
              <ShoppingBag className="w-4 h-4 text-amber-500" />
            </div>
            <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>
              {stats.totalOrdersCount}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-amber-500 flex items-center font-bold">
                <ArrowUpRight className="w-3 h-3" /> +12.8%
              </span>
              {renderSparkline([10, 15, 12, 22, 28, 35, stats.totalOrdersCount], '#f59e0b')}
            </div>
          </div>

          {/* Card 3: Pending Orders */}
          <div className={`p-4 rounded-2xl border transition shadow-sm space-y-2 ${
            isDark 
              ? 'bg-neutral-950/90 border-neutral-800 hover:border-amber-500/40 text-neutral-100' 
              : 'bg-white border-neutral-200 hover:border-amber-500/40 text-neutral-900'
          }`}>
            <div className={`flex items-center justify-between text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              <span>Pending Queue</span>
              <Clock className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-xl font-bold text-sky-500">
              {stats.pendingOrdersCount}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Action Needed</span>
              {renderSparkline([8, 6, 12, 10, 7, 9, stats.pendingOrdersCount], '#38bdf8')}
            </div>
          </div>

          {/* Card 4: Delivered Orders */}
          <div className={`p-4 rounded-2xl border transition shadow-sm space-y-2 ${
            isDark 
              ? 'bg-neutral-950/90 border-neutral-800 hover:border-amber-500/40 text-neutral-100' 
              : 'bg-white border-neutral-200 hover:border-amber-500/40 text-neutral-900'
          }`}>
            <div className={`flex items-center justify-between text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              <span>Delivered</span>
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-xl font-bold text-teal-500">
              {stats.deliveredOrdersCount}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-teal-500 font-bold">{stats.deliveryRate}% Success</span>
              {renderSparkline([5, 12, 18, 25, 30, 42, stats.deliveredOrdersCount], '#14b8a6')}
            </div>
          </div>

          {/* Card 5: Return Orders */}
          <div className={`p-4 rounded-2xl border transition shadow-sm space-y-2 ${
            isDark 
              ? 'bg-neutral-950/90 border-neutral-800 hover:border-amber-500/40 text-neutral-100' 
              : 'bg-white border-neutral-200 hover:border-amber-500/40 text-neutral-900'
          }`}>
            <div className={`flex items-center justify-between text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              <span>RTO / Returns</span>
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-xl font-bold text-orange-500">
              {stats.returnOrdersCount}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{stats.returnRate}% RTO</span>
              {renderSparkline([1, 2, 1, 3, 2, 1, stats.returnOrdersCount], '#fb923c')}
            </div>
          </div>

          {/* Card 6: Inventory Value */}
          <div className={`p-4 rounded-2xl border transition shadow-sm space-y-2 ${
            isDark 
              ? 'bg-neutral-950/90 border-neutral-800 hover:border-amber-500/40 text-neutral-100' 
              : 'bg-white border-neutral-200 hover:border-amber-500/40 text-neutral-900'
          }`}>
            <div className={`flex items-center justify-between text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              <span>Inventory Value</span>
              <Boxes className="w-4 h-4 text-indigo-500" />
            </div>
            <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>
              {formatPrice(stats.totalInventoryValue)}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-indigo-500">{stats.totalInventoryUnits} Units</span>
              {renderSparkline([90, 85, 95, 110, 105, 120, stats.totalInventoryUnits], '#818cf8')}
            </div>
          </div>

          {/* Card 7: Active Buyers */}
          <div className={`p-4 rounded-2xl border transition shadow-sm space-y-2 ${
            isDark 
              ? 'bg-neutral-950/90 border-neutral-800 hover:border-amber-500/40 text-neutral-100' 
              : 'bg-white border-neutral-200 hover:border-amber-500/40 text-neutral-900'
          }`}>
            <div className={`flex items-center justify-between text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              <span>Active Buyers</span>
              <Users className="w-4 h-4 text-amber-500" />
            </div>
            <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>
              {stats.customerCount}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-amber-500 font-bold">+9.2%</span>
              {renderSparkline([12, 18, 24, 30, 38, 45, stats.customerCount], '#f59e0b')}
            </div>
          </div>

        </div>
      </div>

      {/* 2. ORDER STATUS PIPELINE DASHBOARD */}
      <div className={`p-6 rounded-2xl border space-y-6 transition ${
        isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-neutral-950'
            }`}>
              <Truck className="w-4 h-4 text-amber-500" />
              <span>Fulfillment & Dispatch Pipeline</span>
            </h3>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Orders tracked through complete streetwear fulfillment lifecycle
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs text-amber-500 hover:underline flex items-center gap-1 cursor-pointer font-bold"
          >
            <span>View Orders Management</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pipeline Horizontal Stepper Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
          {pipelineStatuses.map((st) => {
            const data = pipelineCounts[st.label] || { count: 0, value: 0 };
            return (
              <div
                key={st.label}
                onClick={() => {
                  onFilterStatus(st.label);
                  onNavigateTab('orders');
                }}
                className={`p-3 rounded-xl border transition cursor-pointer hover:border-amber-500/50 ${
                  isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200 shadow-xs'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase block truncate ${st.color}`}>
                  {st.label}
                </span>
                <div className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-neutral-950'}`}>
                  {data.count}
                </div>
                <div className={`text-[10px] truncate mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {formatPrice(data.value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ANALYTICS & LOGISTICS SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        
        {/* Revenue Growth Chart */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border space-y-6 transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h4 className={`font-bold uppercase tracking-wider text-sm ${isDark ? 'text-white' : 'text-neutral-950'}`}>
                Revenue Trend & Order Velocity
              </h4>
              <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>Gross merchandise volume timeline</span>
            </div>
            <div className={`flex items-center gap-1 p-1 rounded-lg border ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
            }`}>
              {(['7D', '30D', '90D', '1Y'] as const).map((rng) => (
                <button
                  key={rng}
                  onClick={() => setAnalyticsRange(rng)}
                  className={`px-2.5 py-1 text-[11px] rounded transition cursor-pointer font-bold ${
                    analyticsRange === rng 
                      ? 'bg-amber-500 text-neutral-950 shadow-sm' 
                      : isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {rng}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Bar/Area Chart */}
          <div className={`h-48 w-full flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b ${
            isDark ? 'border-neutral-800' : 'border-neutral-200'
          }`}>
            {[42, 68, 55, 78, 92, 110, 85, 125, 140, 165, 190, 220].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-amber-500/20 to-amber-500 hover:from-amber-400 hover:to-amber-300 transition"
                  style={{ height: `${(val / 220) * 140}px` }}
                ></div>
                <span className={`text-[9px] ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>M{idx + 1}</span>
                
                {/* Tooltip */}
                <div className={`absolute bottom-full mb-2 hidden group-hover:block p-1.5 rounded border text-[10px] whitespace-nowrap z-10 shadow-lg ${
                  isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-neutral-900 border-neutral-800 text-white'
                }`}>
                  ₹{val * 1000} GMV
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quickink / Shiprocket Logistics Widget */}
        <div className={`p-6 rounded-2xl border space-y-5 transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <h4 className={`font-bold uppercase tracking-wider text-sm flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-neutral-950'
            }`}>
              <Truck className="w-4 h-4 text-amber-500" />
              <span>Logistics Hub</span>
            </h4>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded font-bold">
              Active API
            </span>
          </div>

          <div className="space-y-3">
            <div className={`p-3 rounded-xl border flex justify-between items-center ${
              isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>Delhivery Express:</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>98.4% SLA</span>
            </div>
            <div className={`p-3 rounded-xl border flex justify-between items-center ${
              isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>BlueDart Apex:</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>99.1% SLA</span>
            </div>
            <div className={`p-3 rounded-xl border flex justify-between items-center ${
              isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>Average Transit Time:</span>
              <span className="font-bold text-amber-500">2.4 Days</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('shipping')}
            className={`w-full py-2.5 rounded-xl font-bold uppercase transition cursor-pointer border ${
              isDark 
                ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400' 
                : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-700'
            }`}
          >
            Open Logistics Dashboard
          </button>
        </div>

      </div>

      {/* 4. RECENT ORDERS PREVIEW TABLE */}
      <div className={`p-6 rounded-2xl border space-y-4 text-xs transition ${
        isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wider ${
              isDark ? 'text-white' : 'text-neutral-950'
            }`}>
              Recent Streetwear Orders
            </h3>
            <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
              Latest customer transactions synchronized from Supabase
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-amber-500 hover:underline flex items-center gap-1 cursor-pointer font-bold"
          >
            <span>View All {orders.length} Orders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={`border-b text-[11px] ${
                isDark ? 'border-neutral-800 text-neutral-400' : 'border-neutral-200 text-neutral-600'
              }`}>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Items</th>
                <th className="py-2.5 px-3">Total</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-neutral-800/60' : 'divide-neutral-100'}`}>
              {orders.slice(0, 5).map((ord) => (
                <tr key={ord.id} className={`transition ${
                  isDark ? 'hover:bg-neutral-900/40' : 'hover:bg-neutral-50'
                }`}>
                  <td className="py-3 px-3 font-bold text-amber-500">#{ord.id}</td>
                  <td className="py-3 px-3">
                    <div className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>
                      {ord.shippingAddress.fullName}
                    </div>
                    <div className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>
                      {ord.shippingAddress.city}
                    </div>
                  </td>
                  <td className={`py-3 px-3 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                    {ord.items.length} Item(s)
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                    {formatPrice(ord.total)}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ord.paymentStatus === 'PAID' || ord.paymentStatus === 'Paid'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : ord.paymentStatus === 'PENDING_VERIFICATION'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                      {ord.paymentMethod.toUpperCase()} • {ord.paymentStatus || 'Paid'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 border rounded text-[10px] ${
                      isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-200' : 'bg-neutral-100 border-neutral-200 text-neutral-700'
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    <button
                      onClick={() => onSelectOrder(ord)}
                      className={`p-1.5 rounded transition cursor-pointer ${
                        isDark ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                      }`}
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onPrintInvoice(ord)}
                      className={`p-1.5 rounded border transition cursor-pointer ${
                        isDark 
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20' 
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
                      }`}
                      title="Print Tax Invoice"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
