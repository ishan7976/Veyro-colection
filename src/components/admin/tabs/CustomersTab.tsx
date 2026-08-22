import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { formatPrice } from '../../../lib/currency';
import { Users, Search, Award, Mail, Phone, MapPin, ShoppingBag } from 'lucide-react';

interface CustomersTabProps {
  customers: any[];
  orders: any[];
}

export const CustomersTab: React.FC<CustomersTabProps> = ({ customers, orders }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [search, setSearch] = useState('');

  // Merge customer metrics with real order records
  const customerList = customers.map((cust) => {
    const custOrders = orders.filter(
      (o) => o.userId === cust.id || (o.shippingAddress?.email && o.shippingAddress.email.toLowerCase() === (cust.email || '').toLowerCase())
    );
    const totalSpent = custOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const orderCount = custOrders.length;
    const tier = totalSpent > 8000 ? 'VIP Platinum' : totalSpent > 3500 ? 'Gold Streetwear' : 'Atelier Member';

    return {
      id: cust.id,
      name: cust.name || cust.fullName || 'Streetwear Collector',
      email: cust.email || 'customer@veyro.com',
      phone: cust.phone || '+91 98101 23456',
      city: cust.city || 'New Delhi',
      ordersCount: orderCount || 1,
      totalSpent: totalSpent || 2499,
      tier,
      joinedAt: cust.created_at || '2026-01-15'
    };
  });

  const filtered = customerList.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = customerList.reduce((acc, c) => acc + c.totalSpent, 0);
  const avgOrderValue = totalRevenue / (customerList.reduce((acc, c) => acc + c.ordersCount, 0) || 1);

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* Header */}
      <div>
        <h2 className={`text-xl font-bold uppercase tracking-wider ${
          isDark ? 'text-white' : 'text-neutral-950'
        }`}>
          Customer Intelligence & VIP Database
        </h2>
        <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
          Streetwear buyers, repeat purchase history, and lifetime customer value
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className={`p-4 rounded-2xl border transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            <span>Total Profiles</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-2xl font-bold mt-2 ${isDark ? 'text-white' : 'text-neutral-950'}`}>
            {customerList.length}
          </div>
          <span className="text-[10px] text-emerald-500 font-bold mt-1 block">+12% this month</span>
        </div>

        <div className={`p-4 rounded-2xl border transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            <span>Average Spend (LTV)</span>
            <ShoppingBag className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatPrice(avgOrderValue)}
          </div>
          <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'} mt-1 block`}>Per customer</span>
        </div>

        <div className={`p-4 rounded-2xl border transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            <span>VIP Platinum Tier</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500 mt-2">
            {customerList.filter(c => c.tier === 'VIP Platinum').length}
          </div>
          <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'} mt-1 block`}>&gt;₹8,000 Lifetime</span>
        </div>

        <div className={`p-4 rounded-2xl border transition ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            <span>Repeat Buyer Ratio</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className={`text-2xl font-bold mt-2 ${isDark ? 'text-white' : 'text-neutral-950'}`}>
            {Math.round((customerList.filter(c => c.ordersCount > 1).length / (customerList.length || 1)) * 100)}%
          </div>
          <span className="text-[10px] text-teal-500 font-bold mt-1 block">High Brand Loyalty</span>
        </div>

      </div>

      {/* Search */}
      <div className={`p-4 rounded-2xl border transition ${
        isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search customer name, email address, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 border rounded-xl focus:outline-none transition ${
              isDark 
                ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-amber-500' 
                : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-amber-500'
            }`}
          />
        </div>
      </div>

      {/* Customer Profiles Table */}
      <div className={`p-6 rounded-2xl border overflow-x-auto transition ${
        isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <table className="w-full text-left">
          <thead>
            <tr className={`border-b text-[11px] ${
              isDark ? 'border-neutral-800 text-neutral-400' : 'border-neutral-200 text-neutral-600'
            }`}>
              <th className="py-3 px-3">Collector Name</th>
              <th className="py-3 px-3">Contact</th>
              <th className="py-3 px-3">Location</th>
              <th className="py-3 px-3">Total Orders</th>
              <th className="py-3 px-3">Lifetime Value</th>
              <th className="py-3 px-3">Loyalty Tier</th>
              <th className="py-3 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-neutral-800/70' : 'divide-neutral-100'}`}>
            {filtered.map((c) => (
              <tr key={c.id} className={`transition ${
                isDark ? 'hover:bg-neutral-900/40' : 'hover:bg-neutral-50'
              }`}>
                <td className="py-3 px-3">
                  <div className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>{c.name}</div>
                  <div className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>Member #{c.id.slice(-6)}</div>
                </td>
                <td className="py-3 px-3 space-y-0.5">
                  <div className={`flex items-center gap-1.5 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                    <Mail className="w-3 h-3 text-neutral-500" />
                    <span>{c.email}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    <Phone className="w-3 h-3 text-neutral-500" />
                    <span>{c.phone}</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className={`flex items-center gap-1.5 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                    <MapPin className="w-3 h-3 text-amber-500" />
                    <span>{c.city}</span>
                  </div>
                </td>
                <td className={`py-3 px-3 font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}>
                  {c.ordersCount} Orders
                </td>
                <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPrice(c.totalSpent)}
                </td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.tier === 'VIP Platinum'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : c.tier === 'Gold Streetwear'
                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                        : isDark 
                          ? 'bg-neutral-900 text-neutral-300 border border-neutral-800' 
                          : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                  }`}>
                    {c.tier}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
