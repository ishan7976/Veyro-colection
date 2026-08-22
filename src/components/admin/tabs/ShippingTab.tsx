import React from 'react';
import { Shipment } from '../../../types';
import { formatPrice } from '../../../lib/currency';
import { useTheme } from '../../../context/ThemeContext';
import { Truck, ShieldCheck, MapPin, ExternalLink, Clock } from 'lucide-react';

interface ShippingTabProps {
  shipments: Shipment[];
}

export const ShippingTab: React.FC<ShippingTabProps> = ({ shipments }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* Header */}
      <div>
        <h2 className={`text-xl font-bold uppercase tracking-wider ${
          isDark ? 'text-white' : 'text-neutral-950'
        }`}>
          Logistics Aggregator & Courier Hub
        </h2>
        <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
          Integrated Quickink & Shiprocket multi-carrier dispatch console
        </p>
      </div>

      {/* Courier Partner Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className={`p-5 rounded-2xl border space-y-3 transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 font-bold text-sm">
                DLHV
              </div>
              <div>
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>Delhivery Direct</h3>
                <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Surface & Express Air</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              CONNECTED
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className={`p-2 rounded-lg border ${
              isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
            }`}>
              <span className={isDark ? 'text-neutral-500' : 'text-neutral-500'}>Avg Time:</span> 2.1 Days
            </div>
            <div className={`p-2 rounded-lg border ${
              isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
            }`}>
              <span className={isDark ? 'text-neutral-500' : 'text-neutral-500'}>SLA Success:</span> 98.6%
            </div>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border space-y-3 transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 font-bold text-sm">
                BLDT
              </div>
              <div>
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>BlueDart Air</h3>
                <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Apex Overnight Flights</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              CONNECTED
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className={`p-2 rounded-lg border ${
              isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
            }`}>
              <span className={isDark ? 'text-neutral-500' : 'text-neutral-500'}>Avg Time:</span> 1.4 Days
            </div>
            <div className={`p-2 rounded-lg border ${
              isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
            }`}>
              <span className={isDark ? 'text-neutral-500' : 'text-neutral-500'}>SLA Success:</span> 99.4%
            </div>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border space-y-3 transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 font-bold text-sm">
                QINK
              </div>
              <div>
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>Quickink Express</h3>
                <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Streetwear Dedicated Fleet</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              CONNECTED
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className={`p-2 rounded-lg border ${
              isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
            }`}>
              <span className={isDark ? 'text-neutral-500' : 'text-neutral-500'}>Avg Time:</span> 2.0 Days
            </div>
            <div className={`p-2 rounded-lg border ${
              isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
            }`}>
              <span className={isDark ? 'text-neutral-500' : 'text-neutral-500'}>SLA Success:</span> 98.9%
            </div>
          </div>
        </div>

      </div>

      {/* Manifested Dispatches Table */}
      <div className={`p-6 rounded-2xl border overflow-x-auto transition ${
        isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold uppercase tracking-wider text-sm ${isDark ? 'text-white' : 'text-neutral-950'}`}>
            Live Courier Consignments
          </h3>
          <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>{shipments.length} Active Shipments</span>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className={`border-b text-[11px] ${
              isDark ? 'border-neutral-800 text-neutral-400' : 'border-neutral-200 text-neutral-600'
            }`}>
              <th className="py-3 px-3">AWB Tracking #</th>
              <th className="py-3 px-3">Order ID</th>
              <th className="py-3 px-3">Courier Partner</th>
              <th className="py-3 px-3">Recipient & City</th>
              <th className="py-3 px-3">Parcel Weight</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Last Milestone</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-neutral-800/70' : 'divide-neutral-100'}`}>
            {shipments.map(shp => (
              <tr key={shp.id} className={`transition ${
                isDark ? 'hover:bg-neutral-900/40' : 'hover:bg-neutral-50'
              }`}>
                <td className="py-3 px-3 font-bold text-amber-500">{shp.awbNumber}</td>
                <td className={`py-3 px-3 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>#{shp.orderId}</td>
                <td className="py-3 px-3">
                  <span className="font-bold text-sky-500">{shp.courierPartner}</span>
                </td>
                <td className="py-3 px-3">
                  <div className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>{shp.customerName}</div>
                  <div className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{shp.destCity}</div>
                </td>
                <td className={`py-3 px-3 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>{shp.weightKg} kg</td>
                <td className="py-3 px-3">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                    shp.status === 'Delivered'
                      ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                      : shp.status === 'In Transit'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                  }`}>
                    {shp.status}
                  </span>
                </td>
                <td className={`py-3 px-3 text-right ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {shp.timeline?.[shp.timeline.length - 1]?.title || 'Hub Processing'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
