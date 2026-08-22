import React from 'react';
import { Order } from '../../types';
import { formatPrice } from '../../lib/currency';
import { X, Printer, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const invoiceNo = `INV-${order.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`;

  return (
    <div id="invoice-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div className={`relative w-full max-w-3xl max-h-[92vh] flex flex-col border rounded-2xl shadow-2xl overflow-hidden my-auto print:border-none print:shadow-none print:bg-white print:text-black print:my-0 print:max-h-none print:overflow-visible transition-colors ${
        isDark 
          ? 'bg-neutral-900 border-amber-500/20 text-neutral-100' 
          : 'bg-white border-neutral-200 text-neutral-900 shadow-xl'
      }`}>
        
        {/* Top Controls Bar (Hidden during printing) */}
        <div className={`flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b flex-shrink-0 print:hidden transition-colors ${
          isDark 
            ? 'border-neutral-800 bg-neutral-950/90' 
            : 'border-neutral-200 bg-neutral-50/90'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
            <span className="font-mono text-[11px] sm:text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold truncate">
              Tax Invoice • {invoiceNo}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              id="print-invoice-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-mono font-bold uppercase rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 transition shadow-lg cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Print / PDF</span>
            </button>
            <button
              id="close-invoice-modal-btn"
              onClick={onClose}
              className={`p-1.5 sm:p-2 rounded-lg transition cursor-pointer ${
                isDark 
                  ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' 
                  : 'text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100'
              }`}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet (Scrollable on small screens, full height during print) */}
        <div className="p-4 sm:p-8 md:p-10 space-y-6 sm:space-y-8 overflow-y-auto print:p-0 print:overflow-visible print:text-black">
          
          {/* Header */}
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 sm:pb-6 border-b print:border-neutral-300 ${
            isDark ? 'border-neutral-800' : 'border-neutral-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-2xl sm:text-3xl font-black tracking-tighter uppercase font-mono print:text-black ${
                  isDark ? 'text-white' : 'text-neutral-950'
                }`}>
                  VEYRO
                </span>
                <span className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-mono uppercase border rounded font-semibold print:border-black print:text-black ${
                  isDark ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  STREETWEAR ATELIER
                </span>
              </div>
              <p className={`text-xs print:text-neutral-600 font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Luxury Heavyweight Streetwear • Wear Your Identity
              </p>
              <p className={`text-[11px] print:text-neutral-600 font-mono ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                GSTIN: 07AABCU9603R1ZM • support@veyro.com
              </p>
            </div>

            <div className="text-left sm:text-right font-mono self-start sm:self-auto">
              <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 print:text-black">TAX INVOICE</div>
              <div className={`text-xs print:text-neutral-700 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Invoice: #{invoiceNo}</div>
              <div className={`text-xs print:text-neutral-700 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Order ID: #{order.id}</div>
              <div className={`text-xs print:text-neutral-700 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Date: {invoiceDate}</div>
            </div>
          </div>

          {/* Billing & Shipping Grid */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-5 rounded-xl border print:bg-neutral-50 print:border-neutral-200 ${
            isDark 
              ? 'bg-neutral-950/50 border-neutral-800/80' 
              : 'bg-neutral-50 border-neutral-200'
          }`}>
            <div>
              <span className={`text-[10px] font-mono uppercase tracking-widest print:text-neutral-500 block mb-1 ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                Billed & Shipped To
              </span>
              <h4 className={`font-bold print:text-black text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>{order.shippingAddress?.fullName || 'Valued Customer'}</h4>
              <p className={`text-xs print:text-neutral-700 mt-1 leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                {order.shippingAddress?.address}
                {order.shippingAddress?.apartment ? `, ${order.shippingAddress.apartment}` : ''}
                <br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}
              </p>
              <p className={`text-xs print:text-neutral-600 font-mono mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Phone: {order.shippingAddress?.phone || 'N/A'}
                <br />
                Email: {order.shippingAddress?.email || 'N/A'}
              </p>
            </div>

            <div className={`font-mono text-xs space-y-1.5 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:pl-6 print:border-neutral-200 ${
              isDark ? 'border-neutral-800 sm:border-neutral-800' : 'border-neutral-200 sm:border-neutral-200'
            }`}>
              <span className={`text-[10px] uppercase tracking-widest print:text-neutral-500 block mb-1 ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                Logistics & Payment
              </span>
              <div className="flex justify-between">
                <span className={`print:text-neutral-600 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Payment Mode:</span>
                <span className={`font-bold print:text-black uppercase ${isDark ? 'text-white' : 'text-neutral-900'}`}>{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className={`print:text-neutral-600 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Payment Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 print:text-black uppercase">{order.paymentStatus || 'PAID'}</span>
              </div>
              {order.upiRefNumber && (
                <div className="flex justify-between">
                  <span className={`print:text-neutral-600 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>UPI Ref / UTR:</span>
                  <span className={`font-bold print:text-black ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>{order.upiRefNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className={`print:text-neutral-600 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Courier Partner:</span>
                <span className={`print:text-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>{order.courierPartner || 'Delhivery Express'}</span>
              </div>
              <div className="flex justify-between">
                <span className={`print:text-neutral-600 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>AWB Tracking:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 print:text-black">{order.trackingNumber || 'PENDING DISPATCH'}</span>
              </div>
            </div>
          </div>

          {/* Itemized Table (Responsive Scroll & Clear Formatting) */}
          <div className="overflow-x-auto rounded-lg">
            <table className="w-full text-left font-mono text-xs min-w-[460px]">
              <thead>
                <tr className={`border-b print:border-neutral-300 print:text-neutral-600 ${
                  isDark ? 'border-neutral-800 text-neutral-400' : 'border-neutral-200 text-neutral-500'
                }`}>
                  <th className="py-2.5 px-2 w-8">#</th>
                  <th className="py-2.5 px-2">Item Description</th>
                  <th className="py-2.5 px-2 text-center w-20">Size</th>
                  <th className="py-2.5 px-2 text-center w-14">Qty</th>
                  <th className="py-2.5 px-2 text-right w-24">Unit Price</th>
                  <th className="py-2.5 px-2 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody className={`divide-y print:divide-neutral-200 ${
                isDark ? 'divide-neutral-800/60 text-neutral-200' : 'divide-neutral-100 text-neutral-800'
              }`}>
                {order.items.map((item, idx) => (
                  <tr key={idx} className="print:text-neutral-800">
                    <td className="py-3 px-2 text-neutral-400 dark:text-neutral-500">{idx + 1}</td>
                    <td className="py-3 px-2">
                      <div className={`font-bold print:text-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>{item.name}</div>
                      {item.color && (
                        <div className={`text-[11px] print:text-neutral-600 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Color: {item.color}</div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono print:bg-neutral-200 ${
                        isDark ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-100 text-neutral-800'
                      }`}>
                        {item.size}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 px-2 text-right">{formatPrice(item.price)}</td>
                    <td className={`py-3 px-2 text-right font-bold print:text-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      {formatPrice(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Breakdown */}
          <div className={`flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 pt-4 border-t print:border-neutral-300 ${
            isDark ? 'border-neutral-800' : 'border-neutral-200'
          }`}>
            <div className={`w-full sm:max-w-xs text-[11px] print:text-neutral-600 font-mono space-y-1 ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              <p className={`font-bold print:text-black ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>Terms & Conditions:</p>
              <p>1. Returns / Exchanges accepted within 7 days in unworn condition with original tags.</p>
              <p>2. This is a computer generated invoice and requires no physical signature.</p>
            </div>

            <div className="w-full sm:w-64 space-y-2 font-mono text-xs">
              <div className={`flex justify-between print:text-neutral-600 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                <span>Subtotal:</span>
                <span className={`print:text-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Discount {order.promoCodeApplied ? `(${order.promoCodeApplied})` : ''}:</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className={`flex justify-between print:text-neutral-600 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                <span>Shipping & Handling:</span>
                <span className={`print:text-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>{order.shippingFee === 0 ? 'FREE' : formatPrice(order.shippingFee)}</span>
              </div>
              <div className={`flex justify-between print:text-neutral-600 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                <span>Included GST (18%):</span>
                <span className={`print:text-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>{formatPrice(order.tax || (order.total * 0.18))}</span>
              </div>
              <div className={`flex justify-between pt-2 border-t text-sm font-bold text-amber-600 dark:text-amber-400 print:text-black ${
                isDark ? 'border-neutral-800' : 'border-neutral-200'
              }`}>
                <span>Total Amount:</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className={`text-center pt-4 border-t print:border-neutral-200 ${
            isDark ? 'border-neutral-800/60 text-neutral-500' : 'border-neutral-100 text-neutral-400'
          }`}>
            <p className="text-[10px] font-mono uppercase tracking-widest">
              THANK YOU FOR CHOOSING VEYRO • WEAR YOUR IDENTITY
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

