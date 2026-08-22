import React, { useState } from 'react';
import { Order, CourierPartner, Shipment } from '../../types';
import { Truck, X, ShieldCheck, CheckCircle2, ArrowRight, Zap, Box, MapPin } from 'lucide-react';
import { formatPrice } from '../../lib/currency';
import { useTheme } from '../../context/ThemeContext';

interface CreateShipmentModalProps {
  order: Order | null;
  onClose: () => void;
  onSaveShipment: (shipment: Shipment, updatedOrderStatus?: string) => Promise<void>;
}

export const CreateShipmentModal: React.FC<CreateShipmentModalProps> = ({
  order,
  onClose,
  onSaveShipment
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!order) return null;

  const [courier, setCourier] = useState<CourierPartner>('Delhivery');
  const [weightKg, setWeightKg] = useState<number>(0.85);
  const [pickupWarehouse, setPickupWarehouse] = useState<string>('Delhi NCR Hub (Primary)');
  const [customAwb, setCustomAwb] = useState<string>(() => {
    return `VR-${Math.floor(100000000 + Math.random() * 900000000)}`;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courierRates: Record<CourierPartner, { name: string; time: string; fee: number; rating: number; tag: string }> = {
    'Delhivery': { name: 'Delhivery Surface Pro', time: '2-3 Days', fee: 85, rating: 4.9, tag: 'RECOMMENDED' },
    'BlueDart': { name: 'BlueDart Air Apex', time: '1-2 Days', fee: 145, rating: 4.9, tag: 'FASTEST AIR' },
    'Shiprocket': { name: 'Shiprocket Multi-Carrier', time: '2-4 Days', fee: 75, rating: 4.7, tag: 'ECONOMY' },
    'Quickink': { name: 'Quickink Streetwear Logistics', time: '2-3 Days', fee: 90, rating: 4.8, tag: 'INTEGRATED' },
    'XpressBees': { name: 'XpressBees Direct', time: '3-4 Days', fee: 70, rating: 4.6, tag: 'BUDGET' },
    'Shadowfax': { name: 'Shadowfax Hyperlocal/Express', time: '2-3 Days', fee: 80, rating: 4.7, tag: 'RELIABLE' },
    'DTDC': { name: 'DTDC Priority Express', time: '3-5 Days', fee: 95, rating: 4.5, tag: 'STANDARD' }
  };

  const handleGenerateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newShipment: Shipment = {
        id: `shp_${Date.now()}`,
        orderId: order.id,
        customerName: order.shippingAddress.fullName,
        customerPhone: order.shippingAddress.phone,
        courierPartner: courier,
        awbNumber: customAwb.trim() || `VR-${Date.now()}`,
        status: 'Manifested',
        originCity: 'New Delhi (HQ)',
        destCity: `${order.shippingAddress.city}, ${order.shippingAddress.state}`,
        destPincode: order.shippingAddress.zipCode,
        weightKg: Number(weightKg) || 0.85,
        shippingFee: courierRates[courier]?.fee || 85,
        timeline: [
          {
            title: 'Shipment Manifested & Label Generated',
            location: 'VEYRO Atelier Hub, New Delhi',
            timestamp: new Date().toISOString(),
            done: true
          },
          {
            title: `Assigned to ${courier} Express Dispatch`,
            location: 'Warehouse Hub',
            timestamp: new Date().toISOString(),
            done: true
          },
          {
            title: 'Pickup Scheduled with Courier Partner',
            location: 'Awaiting Pickup Carrier',
            timestamp: new Date(Date.now() + 3600000).toISOString(),
            done: false
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSaveShipment(newShipment, 'Shipped');
      onClose();
    } catch (err) {
      console.error('Shipment creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="shipment-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className={`relative w-full max-w-2xl border rounded-2xl shadow-2xl overflow-hidden my-8 transition-colors ${
        isDark 
          ? 'bg-neutral-900 border-neutral-800 text-neutral-100' 
          : 'bg-white border-neutral-200 text-neutral-900'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-neutral-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-500">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-mono font-bold text-sm uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-neutral-950'
              }`}>
                Create Quickink / Shiprocket Dispatch
              </h3>
              <p className={`font-mono text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Order #{order.id} • {order.shippingAddress.fullName}</p>
            </div>
          </div>
          <button
            id="close-shipment-modal-btn"
            onClick={onClose}
            className={`p-2 rounded-lg transition cursor-pointer ${
              isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleGenerateShipment} className="p-6 space-y-6">
          
          {/* Order Summary Pill */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-mono text-xs ${
            isDark ? 'bg-neutral-950 border-neutral-800/80' : 'bg-neutral-50 border-neutral-200'
          }`}>
            <div>
              <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>Delivery Destination:</span>
              <div className={`font-bold flex items-center gap-1.5 mt-0.5 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>{order.shippingAddress.city}, {order.shippingAddress.state} ({order.shippingAddress.zipCode})</span>
              </div>
            </div>
            <div className="text-right">
              <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>Total Items:</span>
              <div className="font-bold text-emerald-600 dark:text-emerald-400">
                {order.items.reduce((acc, it) => acc + it.quantity, 0)} Pcs • {formatPrice(order.total)}
              </div>
            </div>
          </div>

          {/* Courier Selection Grid */}
          <div className="space-y-2">
            <label className={`block font-mono text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-neutral-300' : 'text-neutral-700'
            }`}>
              Select Courier Partner
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(courierRates) as CourierPartner[]).map((cKey) => {
                const info = courierRates[cKey];
                const isSelected = courier === cKey;
                return (
                  <div
                    key={cKey}
                    onClick={() => setCourier(cKey)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? isDark
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                          : 'bg-amber-50 border-amber-500 text-neutral-900 shadow-sm'
                        : isDark
                          ? 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                          : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-mono font-bold text-xs flex items-center gap-1.5 ${
                        isSelected ? (isDark ? 'text-white' : 'text-amber-900') : (isDark ? 'text-white' : 'text-neutral-900')
                      }`}>
                        {info.name}
                      </span>
                      {info.tag && (
                        <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded ${
                          info.tag === 'RECOMMENDED'
                            ? isDark
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                            : isDark
                              ? 'bg-neutral-800 text-neutral-300'
                              : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {info.tag}
                        </span>
                      )}
                    </div>
                    <div className={`flex items-center justify-between font-mono text-[11px] pt-1 border-t ${
                      isDark ? 'border-neutral-800/60' : 'border-neutral-100'
                    }`}>
                      <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>Est. {info.time}</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{formatPrice(info.fee)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Logistics Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div>
              <label className={`block mb-1 font-bold uppercase text-[10px] ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                Package Weight (KG)
              </label>
              <input
                id="shipment-weight-input"
                type="number"
                step="0.05"
                min="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0.5)}
                className={`w-full px-3 py-2 border rounded-lg focus:border-amber-500 focus:outline-none ${
                  isDark 
                    ? 'bg-neutral-950 border-neutral-800 text-white' 
                    : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                }`}
              />
            </div>
            <div>
              <label className={`block mb-1 font-bold uppercase text-[10px] ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                Pickup Warehouse Hub
              </label>
              <select
                id="shipment-warehouse-select"
                value={pickupWarehouse}
                onChange={(e) => setPickupWarehouse(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:border-amber-500 focus:outline-none ${
                  isDark 
                    ? 'bg-neutral-950 border-neutral-800 text-white' 
                    : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                }`}
              >
                <option value="Delhi NCR Hub (Primary)">Delhi NCR Hub (Primary)</option>
                <option value="Mumbai West Express Atelier">Mumbai West Express Atelier</option>
                <option value="Bengaluru Tech Vault">Bengaluru Tech Vault</option>
              </select>
            </div>
            <div>
              <label className={`block mb-1 font-bold uppercase text-[10px] ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                AWB Tracking Code
              </label>
              <input
                id="shipment-awb-input"
                type="text"
                value={customAwb}
                onChange={(e) => setCustomAwb(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-amber-600 dark:text-amber-400 font-bold focus:border-amber-500 focus:outline-none ${
                  isDark 
                    ? 'bg-neutral-950 border-neutral-800' 
                    : 'bg-neutral-50 border-neutral-200'
                }`}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className={`flex items-center justify-end gap-3 pt-4 border-t ${
            isDark ? 'border-neutral-800' : 'border-neutral-200'
          }`}>
            <button
              type="button"
              id="cancel-shipment-btn"
              onClick={onClose}
              className={`px-4 py-2.5 text-xs font-mono font-bold uppercase rounded-xl border transition cursor-pointer ${
                isDark 
                  ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' 
                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-shipment-btn"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-mono font-bold uppercase rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 transition shadow-lg cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isSubmitting ? 'Manifesting...' : 'Generate AWB & Dispatch'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

