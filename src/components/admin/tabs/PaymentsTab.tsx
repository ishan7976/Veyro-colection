import React from 'react';
import { Order } from '../../../types';
import { formatPrice } from '../../../lib/currency';
import { useTheme } from '../../../context/ThemeContext';
import { CheckCircle, XCircle, AlertCircle, QrCode } from 'lucide-react';

interface PaymentsTabProps {
  orders: Order[];
  onConfirmUpi: (order: Order) => void;
  onRejectUpi: (order: Order) => void;
  onSelectOrder: (order: Order) => void;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({
  orders,
  onConfirmUpi,
  onRejectUpi,
  onSelectOrder
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const pendingUpiOrders = orders.filter(o => o.paymentStatus === 'PENDING_VERIFICATION');

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* Header */}
      <div>
        <h2 className={`text-xl font-bold uppercase tracking-wider ${
          isDark ? 'text-white' : 'text-neutral-950'
        }`}>
          Payments & UPI Verification Queue
        </h2>
        <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
          Instant reconciliation for Google Pay, PhonePe, Paytm QR and Cashfree gateway
        </p>
      </div>

      {/* UPI Queue Alert Banner */}
      {pendingUpiOrders.length > 0 && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between transition ${
          isDark 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
            : 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <div className="font-bold">
                {pendingUpiOrders.length} UPI Payment(s) Pending Immediate Approval
              </div>
              <div className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-neutral-700'}`}>
                Customers have submitted UTR reference numbers waiting for bank credit confirmation.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments Records Table */}
      <div className={`p-6 rounded-2xl border overflow-x-auto transition ${
        isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <table className="w-full text-left">
          <thead>
            <tr className={`border-b text-[11px] ${
              isDark ? 'border-neutral-800 text-neutral-400' : 'border-neutral-200 text-neutral-600'
            }`}>
              <th className="py-3 px-3">Order ID</th>
              <th className="py-3 px-3">Customer</th>
              <th className="py-3 px-3">Method</th>
              <th className="py-3 px-3">UTR / Txn Ref</th>
              <th className="py-3 px-3">Amount</th>
              <th className="py-3 px-3">Verification Status</th>
              <th className="py-3 px-3 text-right">Approve / Reject</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-neutral-800/70' : 'divide-neutral-100'}`}>
            {orders.map(ord => (
              <tr key={ord.id} className={`transition ${
                isDark ? 'hover:bg-neutral-900/40' : 'hover:bg-neutral-50'
              }`}>
                <td className="py-3 px-3 font-bold text-amber-500">#{ord.id}</td>
                <td className="py-3 px-3">
                  <div className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>{ord.shippingAddress?.fullName}</div>
                  <div className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>{ord.shippingAddress?.phone}</div>
                </td>
                <td className="py-3 px-3">
                  <span className="font-bold flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-amber-500" />
                    <span>{ord.paymentMethod.toUpperCase()}</span>
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="font-mono text-neutral-400">
                    {(ord as any).upiRefNumber || `TXN-${ord.id.slice(-6)}`}
                  </span>
                </td>
                <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPrice(ord.total)}
                </td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ord.paymentStatus === 'PAID' || ord.paymentStatus === 'Paid'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : ord.paymentStatus === 'PENDING_VERIFICATION'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  }`}>
                    {ord.paymentStatus || 'Paid'}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  {ord.paymentStatus === 'PENDING_VERIFICATION' ? (
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onConfirmUpi(ord)}
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle className="w-3 h-3" /> Approve PAID
                      </button>
                      <button
                        onClick={() => onRejectUpi(ord)}
                        className="px-2.5 py-1 bg-rose-500 hover:bg-rose-400 text-white rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectOrder(ord)}
                      className={`text-[10px] hover:underline cursor-pointer ${
                        isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-950'
                      }`}
                    >
                      View Receipt
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
