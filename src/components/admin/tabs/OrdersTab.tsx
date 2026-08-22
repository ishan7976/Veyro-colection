import React from 'react';
import { Order, OrderStatus } from '../../../types';
import { formatPrice } from '../../../lib/currency';
import { useTheme } from '../../../context/ThemeContext';
import {
  Search,
  Eye,
  Printer,
  Truck,
  CheckCircle,
  XCircle,
  Plus
} from 'lucide-react';

interface OrdersTabProps {
  orders: Order[];
  filteredOrders: Order[];
  orderSearch: string;
  setOrderSearch: (s: string) => void;
  orderStatusFilter: string;
  setOrderStatusFilter: (s: string) => void;
  onOpenManualOrderModal: () => void;
  onSelectOrder: (order: Order) => void;
  onOpenShipmentModal: (order: Order) => void;
  onPrintInvoice: (order: Order) => void;
  onUpdateOrderStatus: (order: Order, status: string, paymentStatus?: string) => Promise<void>;
  onConfirmUpi: (order: Order) => void;
  onRejectUpi: (order: Order) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  filteredOrders,
  orderSearch,
  setOrderSearch,
  orderStatusFilter,
  setOrderStatusFilter,
  onOpenManualOrderModal,
  onSelectOrder,
  onOpenShipmentModal,
  onPrintInvoice,
  onUpdateOrderStatus,
  onConfirmUpi,
  onRejectUpi
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const statuses: OrderStatus[] = [
    'Pending',
    'Confirmed',
    'Processing',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
    'Returned'
  ];

  return (
    <div className="space-y-6 font-mono">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-xl font-bold uppercase tracking-wider ${
            isDark ? 'text-white' : 'text-neutral-950'
          }`}>
            Orders & Logistics Pipeline
          </h2>
          <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Fulfillment status, real-time AWB dispatches, and UPI payments verification
          </p>
        </div>

        <button
          onClick={onOpenManualOrderModal}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold uppercase rounded-xl transition shadow-md cursor-pointer text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create Manual Order</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className={`p-4 rounded-2xl border space-y-4 text-xs transition ${
        isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        
        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setOrderStatusFilter('All')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-bold whitespace-nowrap ${
              orderStatusFilter === 'All'
                ? 'bg-amber-500 text-neutral-950'
                : isDark 
                  ? 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800' 
                  : 'bg-neutral-100 text-neutral-700 hover:text-neutral-950 border border-neutral-200'
            }`}
          >
            All Orders
          </button>
          {statuses.map(st => (
            <button
              key={st}
              onClick={() => setOrderStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-bold whitespace-nowrap ${
                orderStatusFilter === st
                  ? 'bg-amber-500 text-neutral-950'
                  : isDark 
                    ? 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800' 
                    : 'bg-neutral-100 text-neutral-700 hover:text-neutral-950 border border-neutral-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer Name, Email, or AWB tracking..."
            value={orderSearch}
            onChange={e => setOrderSearch(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 border rounded-xl focus:outline-none transition ${
              isDark 
                ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-amber-500' 
                : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-amber-500'
            }`}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className={`p-6 rounded-2xl border overflow-x-auto text-xs transition ${
        isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <table className="w-full text-left">
          <thead>
            <tr className={`border-b text-[11px] ${
              isDark ? 'border-neutral-800 text-neutral-400' : 'border-neutral-200 text-neutral-600'
            }`}>
              <th className="py-3 px-3">Order ID</th>
              <th className="py-3 px-3">Customer & Destination</th>
              <th className="py-3 px-3">Total Items</th>
              <th className="py-3 px-3">Amount</th>
              <th className="py-3 px-3">Payment Info</th>
              <th className="py-3 px-3">Fulfillment Status</th>
              <th className="py-3 px-3">Logistics & AWB</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-neutral-800/70' : 'divide-neutral-100'}`}>
            {filteredOrders.map(ord => (
              <tr key={ord.id} className={`transition ${
                isDark ? 'hover:bg-neutral-900/40' : 'hover:bg-neutral-50'
              }`}>
                <td className="py-3 px-3 font-bold text-amber-500">#{ord.id}</td>
                <td className="py-3 px-3">
                  <div className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>
                    {ord.shippingAddress?.fullName}
                  </div>
                  <div className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {ord.shippingAddress?.city}, {ord.shippingAddress?.state} ({ord.shippingAddress?.zipCode})
                  </div>
                </td>
                <td className={`py-3 px-3 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  {ord.items.reduce((acc, it) => acc + it.quantity, 0)} Items
                </td>
                <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPrice(ord.total)}
                </td>
                <td className="py-3 px-3">
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ord.paymentStatus === 'PAID' || ord.paymentStatus === 'Paid'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : ord.paymentStatus === 'PENDING_VERIFICATION'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                      {ord.paymentMethod.toUpperCase()} • {ord.paymentStatus || 'Paid'}
                    </span>
                    {ord.paymentStatus === 'PENDING_VERIFICATION' && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <button
                          onClick={() => onConfirmUpi(ord)}
                          className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-0.5"
                        >
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                        <button
                          onClick={() => onRejectUpi(ord)}
                          className="px-2 py-0.5 bg-rose-500 hover:bg-rose-400 text-white rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-0.5"
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <select
                    value={ord.status}
                    onChange={(e) => onUpdateOrderStatus(ord, e.target.value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold focus:outline-none transition cursor-pointer border ${
                      isDark 
                        ? 'bg-neutral-900 border-neutral-800 text-white' 
                        : 'bg-neutral-100 border-neutral-300 text-neutral-900'
                    }`}
                  >
                    {statuses.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-3">
                  {ord.trackingNumber ? (
                    <div className="space-y-0.5">
                      <span className="font-bold text-amber-500 text-[11px]">{ord.trackingNumber}</span>
                      <div className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>Delhivery Air</div>
                    </div>
                  ) : (
                    <button
                      onClick={() => onOpenShipmentModal(ord)}
                      className={`flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-bold transition cursor-pointer ${
                        isDark 
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20' 
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
                      }`}
                    >
                      <Truck className="w-3 h-3" />
                      <span>Dispatch AWB</span>
                    </button>
                  )}
                </td>
                <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                  <button
                    onClick={() => onSelectOrder(ord)}
                    className={`p-1.5 rounded transition cursor-pointer ${
                      isDark ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    }`}
                    title="View Full Order Info"
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
  );
};
