import { createClient } from '@supabase/supabase-js';
import { INITIAL_PRODUCTS } from '../data/products';

// User-provided Supabase project credentials
export const SUPABASE_PROJECT_ID = 'jjkmtvtdobhiehfzeljr';
const envUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_URL = envUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqa210dnRkb2JoaWVoZnplbGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDcyNzUsImV4cCI6MjEwMTc4MzI3NX0.K2OBBnJpvg8wL46b_uTv-n9plxb6mA4VKWaVZm0NT8w';
export const SUPABASE_SERVICE_ROLE_KEY = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_SERVICE_ROLE_KEY) || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

// Initialize Supabase Client (Anon)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: true,
  }
});

// Admin Supabase Client (bypasses RLS when service role key is provided)
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;

export interface SupabaseAppointment {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  appointment_type: string;
  preferred_date: string;
  preferred_time: string;
  location: string;
  notes?: string;
  status: string;
  created_at: string;
}

export interface SupabaseOrder {
  id: string;
  user_id?: string;
  items: any;
  shipping_address: any;
  shipping_method: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
}

export interface SupabaseProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  stock?: number;
  stock_quantity?: number;
  created_at?: string;
  original_price?: number | null;
  fabric_gsm?: number;
  in_stock?: boolean;
  new_arrival_badge?: boolean;
  limited_drop_badge?: boolean;
  // UI & compatibility extensions
  slug?: string;
  gsm?: number;
  fit?: string;
  images?: string[];
  sizes?: string[];
  colors?: any[];
  is_new_arrival?: boolean;
  is_limited_drop?: boolean;
  is_trending?: boolean;
  rating?: number;
  review_count?: number;
  tags?: string[];
  drop_number?: string;
}

export interface SupabaseProfile {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'customer' | 'user';
  created_at?: string;
}

// Fetch user profile from Supabase profiles table and verify role
export const fetchProfileFromSupabase = async (
  userEmail: string,
  userId?: string,
  extraMetadata?: { fullName?: string; avatarUrl?: string }
): Promise<{ profile: SupabaseProfile | null; role: string }> => {
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const isAdminEmail = cleanEmail === 'ishansharma3305@gmail.com' || cleanEmail === 'admin@veyro.com';

  try {
    let profileData: SupabaseProfile | null = null;
    let queryError: any = null;
    const isValidUuid = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    // 1. Primary Query: If userId is a valid UUID (from auth.users.id), query by primary key 'id'
    if (isValidUuid) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        profileData = data;
      } else if (error) {
        console.warn('[Supabase Auth Debug] Profile ID query note:', error.message);
      }
    }

    // 2. Secondary Query: If not found by id, query profiles table by email (case-insensitive)
    if (!profileData && cleanEmail) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (data) {
        profileData = data;
      }
      if (error) {
        queryError = error;
        console.warn('[Supabase Auth Debug] Profile email query note:', error.message);
      }
    }

    // Determine role value from Supabase profiles table
    let roleValue = profileData?.role;

    // If profile exists in Supabase profiles table, preserve role and update missing avatar_url/full_name if provided
    if (profileData) {
      if (profileData.role === 'admin' || isAdminEmail) {
        roleValue = 'admin';
      }
      // Non-destructive update for Google metadata if missing
      const resolvedName = extraMetadata?.fullName;
      const avatar = extraMetadata?.avatarUrl;

      if (profileData.id && (resolvedName || avatar)) {
        const updateCandidates: Record<string, any>[] = [];
        
        // Check if full_name or name needs updating
        if (resolvedName && !profileData.full_name && !profileData.name) {
          if (avatar && !profileData.avatar_url) {
            updateCandidates.push({ full_name: resolvedName, avatar_url: avatar });
            updateCandidates.push({ name: resolvedName, avatar_url: avatar });
          }
          updateCandidates.push({ full_name: resolvedName });
          updateCandidates.push({ name: resolvedName });
        } else if (avatar && !profileData.avatar_url) {
          updateCandidates.push({ avatar_url: avatar });
        }

        for (const candidate of updateCandidates) {
          try {
            const { data: updated, error: updateErr } = await supabase
              .from('profiles')
              .update(candidate)
              .eq('id', profileData.id)
              .select()
              .maybeSingle();

            if (!updateErr && updated) {
              profileData = updated;
              break;
            }
          } catch (e) {
            // Ignore minor update issues
            break;
          }
        }
      }
    } else if (!queryError && cleanEmail && isValidUuid) {
      // If profile genuinely doesn't exist in Supabase and query succeeded, auto-create profile
      const defaultRole = isAdminEmail ? 'admin' : 'user';
      const resolvedName = extraMetadata?.fullName || userEmail.split('@')[0];
      const avatarUrl = extraMetadata?.avatarUrl || null;

      const dbClient = supabaseAdmin || supabase;

      // Candidate payloads for different common Supabase profile table schemas
      // Note: We MUST NEVER mix 'name' and 'full_name' in the same payload, or PostgREST throws PGRST204
      const candidatePayloads = [
        // Schema 1: Standard Supabase (id, email, full_name, avatar_url, role, created_at)
        { id: userId, email: cleanEmail, full_name: resolvedName, avatar_url: avatarUrl, role: defaultRole, created_at: new Date().toISOString() },
        // Schema 2: Standard Supabase without created_at (if DB defaults to now())
        { id: userId, email: cleanEmail, full_name: resolvedName, avatar_url: avatarUrl, role: defaultRole },
        // Schema 3: Without role column
        { id: userId, email: cleanEmail, full_name: resolvedName, avatar_url: avatarUrl },
        // Schema 4: Schema using 'name' column instead of 'full_name'
        { id: userId, email: cleanEmail, name: resolvedName, avatar_url: avatarUrl, role: defaultRole },
        { id: userId, email: cleanEmail, name: resolvedName, avatar_url: avatarUrl },
        // Schema 5: Minimal profile
        { id: userId, email: cleanEmail, full_name: resolvedName },
        { id: userId, email: cleanEmail, name: resolvedName },
        { id: userId, full_name: resolvedName, avatar_url: avatarUrl }
      ];

      let insertedSuccessfully = false;

      for (const payload of candidatePayloads) {
        try {
          const { data: insertedData, error: insertError } = await dbClient
            .from('profiles')
            .upsert([payload], { onConflict: 'id' })
            .select()
            .maybeSingle();

          if (!insertError && insertedData) {
            profileData = insertedData;
            roleValue = insertedData.role;
            insertedSuccessfully = true;
            console.log('[Supabase Auth Debug] Profile successfully upserted in Supabase:', insertedData);
            break;
          } else if (insertError) {
            // Check if error is PGRST204 (column not found) or similar schema mismatch
            const isColumnNotFound = insertError.code === 'PGRST204' || insertError.code === '42703' || insertError.message?.toLowerCase().includes('column');
            if (isColumnNotFound) {
              // Try next candidate payload
              continue;
            } else {
              console.warn('[Supabase Auth Debug] Profile insert notice:', insertError.message);
              break;
            }
          }
        } catch (err: any) {
          console.warn('[Supabase Auth Debug] Insert candidate exception:', err?.message);
          continue;
        }
      }

      if (!insertedSuccessfully) {
        // Fallback local memory representation
        profileData = {
          id: userId,
          email: cleanEmail,
          full_name: resolvedName,
          name: resolvedName,
          avatar_url: avatarUrl || undefined,
          role: defaultRole,
          created_at: new Date().toISOString()
        };
        roleValue = defaultRole;
      }
    } else {
      // Fallback if query error occurred or no email
      roleValue = isAdminEmail ? 'admin' : 'user';
    }

    const finalRole = roleValue === 'admin' || isAdminEmail ? 'admin' : (roleValue || 'user');

    // REQUIRED CONSOLE LOGS FOR DEBUGGING:
    console.log('--------------------------------------------------');
    console.log('current user:', userEmail);
    console.log('profile data:', profileData);
    console.log('role value:', finalRole);
    console.log('profile.role === "admin":', profileData ? profileData.role === 'admin' : finalRole === 'admin');
    console.log('--------------------------------------------------');

    return {
      profile: profileData || null,
      role: finalRole
    };
  } catch (err: any) {
    console.error('[Supabase Auth Debug] Exception checking profile:', err);
    const fallbackRole = (cleanEmail === 'ishansharma3305@gmail.com' || cleanEmail === 'admin@veyro.com') ? 'admin' : 'user';

    console.log('--------------------------------------------------');
    console.log('current user:', userEmail);
    console.log('profile data:', null);
    console.log('role value:', fallbackRole);
    console.log('--------------------------------------------------');

    return {
      profile: null,
      role: fallbackRole
    };
  }
};

// Database sync helper utilities
export const saveAppointmentToSupabase = async (appointmentData: any) => {
  try {
    const payload = {
      id: appointmentData.id,
      user_id: appointmentData.userId || null,
      full_name: appointmentData.fullName,
      email: appointmentData.email,
      phone: appointmentData.phone,
      appointment_type: appointmentData.appointmentType,
      preferred_date: appointmentData.preferredDate,
      preferred_time: appointmentData.preferredTime,
      location: appointmentData.location,
      notes: appointmentData.notes || '',
      status: appointmentData.status || 'Confirmed',
      created_at: appointmentData.createdAt || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('appointments')
      .upsert([payload], { onConflict: 'id' })
      .select();

    if (error) {
      console.log('[Supabase Sync Notice] Appointment table sync:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.log('[Supabase Sync Notice] Appointment sync exception:', err?.message || err);
    return { success: false, error: err?.message };
  }
};

export const fetchAppointmentsFromSupabase = async (userId?: string) => {
  try {
    let query = supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.log('[Supabase Sync Notice] Fetch appointments status:', error.message);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (err: any) {
    console.log('[Supabase Sync Notice] Fetch appointments exception:', err?.message);
    return { success: false, error: err?.message, data: [] };
  }
};

export const fetchCustomersFromSupabase = async (): Promise<{ success: boolean; data: any[]; error?: string }> => {
  try {
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: orders } = await supabase
      .from('orders')
      .select('*');

    if (profileErr) {
      console.warn('[Supabase Customers] Fetch profile error:', profileErr.message);
    }

    const orderList = orders || [];
    const customerList = (profiles || []).map((p: any) => {
      const email = (p.email || '').toLowerCase().trim();
      const pId = p.id;
      const userOrders = orderList.filter((o: any) => {
        const oUserId = o.user_id || o.userId;
        const oEmail = (o.shipping_address?.email || o.shippingAddress?.email || '').toLowerCase().trim();
        return (pId && oUserId === pId) || (email && oEmail === email);
      });

      const totalSpent = userOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
      const lastOrder = userOrders.sort((a: any, b: any) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime())[0];

      return {
        id: p.id,
        email: p.email,
        name: p.full_name || p.name || p.email?.split('@')[0] || 'Customer',
        role: p.role || 'customer',
        createdAt: p.created_at || new Date().toISOString(),
        orderCount: userOrders.length,
        totalSpent,
        lastOrderDate: lastOrder ? (lastOrder.created_at || lastOrder.createdAt) : null
      };
    });

    return { success: true, data: customerList };
  } catch (err: any) {
    console.error('[Supabase Customers] Exception:', err);
    return { success: false, data: [], error: err?.message };
  }
};

export const fetchOrdersFromSupabase = async (userId?: string): Promise<{ success: boolean; data: any[]; error?: string }> => {
  try {
    console.log('[Supabase Orders] Executing query: supabase.from("orders").select("*")...');
    const dbClient = supabaseAdmin || supabase;
    let query = dbClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[Supabase Orders] Fetch error from public.orders:', error.message);
      return { success: false, data: [], error: error.message };
    }

    // Also fetch order_items in case items were stored in separate table
    let allOrderItems: any[] = [];
    try {
      const { data: itemsData } = await dbClient
        .from('order_items')
        .select('*');
      if (Array.isArray(itemsData)) {
        allOrderItems = itemsData;
      }
    } catch {
      // order_items table might not be present, ignore
    }

    const safeParseNum = (val: any, defaultVal = 0): number => {
      if (val === undefined || val === null || val === '') return defaultVal;
      if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
      const str = String(val).replace(/[^0-9.-]+/g, '');
      const n = parseFloat(str);
      return isNaN(n) ? defaultVal : n;
    };

    const mappedOrders = (data || []).map((o: any) => {
      // 1. Resolve items: check embedded items first, then fallback to order_items table
      let items = o.items ?? o.order_items ?? o.orderItems ?? o.products ?? [];
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch (e) { items = []; }
      }
      if (!Array.isArray(items) || items.length === 0) {
        // Find items in order_items table for this order id
        const matched = allOrderItems.filter((it: any) => String(it.order_id) === String(o.id));
        if (matched.length > 0) {
          items = matched.map((it: any) => ({
            productId: it.product_id || it.productId || 'prod_unknown',
            name: it.product_name || it.name || 'VEYRO Garment',
            image: it.image || it.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
            size: it.size || 'M',
            color: it.color || 'Obsidian Black',
            price: safeParseNum(it.price, 0),
            quantity: safeParseNum(it.quantity, 1)
          }));
        } else {
          items = [];
        }
      } else {
        // Normalize embedded items
        items = items.map((it: any) => ({
          productId: it.productId || it.product_id || it.id || 'prod_unknown',
          name: it.name || it.product_name || it.productName || 'VEYRO Garment',
          image: it.image || it.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
          size: it.size || 'M',
          color: typeof it.color === 'string' ? it.color : (it.color?.name || 'Obsidian Black'),
          price: safeParseNum(it.price, 0),
          quantity: safeParseNum(it.quantity, 1)
        }));
      }

      // 2. Resolve Shipping Address and Customer Info
      let shippingAddress = o.shipping_address ?? o.shippingAddress ?? o.delivery_address ?? {};
      if (typeof shippingAddress === 'string') {
        try { shippingAddress = JSON.parse(shippingAddress); } catch (e) { shippingAddress = {}; }
      }

      const customerName = o.customer_name || o.customerName || shippingAddress?.fullName || 'Customer';
      const customerEmail = o.email || o.customer_email || shippingAddress?.email || 'customer@veyro.com';
      const customerPhone = o.phone || o.customer_phone || shippingAddress?.phone || '';
      const rawAddress = o.address || shippingAddress?.address || '';

      const normalizedShippingAddress = {
        fullName: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: rawAddress || (typeof shippingAddress?.address === 'string' ? shippingAddress.address : 'Standard Delivery Destination'),
        apartment: shippingAddress?.apartment || '',
        city: o.city || shippingAddress?.city || 'Delhi NCR',
        state: o.state || shippingAddress?.state || 'Delhi',
        zipCode: o.pincode || o.zip_code || shippingAddress?.zipCode || '110001',
        country: shippingAddress?.country || 'India',
        deliveryNotes: shippingAddress?.deliveryNotes || o.delivery_notes || ''
      };

      const rawTotal = o.total_amount ?? o.total ?? o.totalAmount ?? o.amount ?? o.grand_total ?? o.grandTotal ?? o.final_total;
      const rawSubtotal = o.subtotal ?? o.sub_total ?? o.subTotal;
      const subtotal = safeParseNum(rawSubtotal, safeParseNum(rawTotal, 0));
      const total = safeParseNum(rawTotal, subtotal);
      const discount = safeParseNum(o.discount ?? o.discount_amount ?? o.discountAmount, 0);
      const shippingFee = safeParseNum(o.shipping_fee ?? o.shippingFee ?? o.shipping_amount ?? o.shipping, 0);
      const tax = safeParseNum(o.tax ?? o.tax_amount ?? o.taxAmount ?? o.gst, 0);

      let rawStatus = (o.order_status ?? o.status ?? o.orderStatus ?? 'Processing').toString().trim();
      if (!rawStatus) rawStatus = 'Processing';
      const sLower = rawStatus.toLowerCase();
      let normalizedStatus: string = 'Processing';
      if (sLower === 'processing' || sLower === 'in_progress' || sLower === 'pending') {
        normalizedStatus = 'Processing';
      } else if (sLower === 'confirmed') {
        normalizedStatus = 'Confirmed';
      } else if (sLower === 'shipped' || sLower === 'dispatched' || sLower === 'in_transit') {
        normalizedStatus = 'Shipped';
      } else if (sLower === 'out for delivery' || sLower === 'out_for_delivery') {
        normalizedStatus = 'Out for Delivery';
      } else if (sLower === 'delivered' || sLower === 'completed') {
        normalizedStatus = 'Delivered';
      } else if (sLower === 'cancelled' || sLower === 'canceled') {
        normalizedStatus = 'Cancelled';
      } else {
        normalizedStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
      }

      return {
        id: String(o.id || `ord_${Date.now()}`),
        userId: o.user_id ?? o.userId ?? o.customer_id ?? o.customerId,
        items,
        shippingAddress: normalizedShippingAddress,
        shippingMethod: o.shipping_method ?? o.shippingMethod ?? 'standard',
        subtotal,
        discount,
        shippingFee,
        tax,
        total,
        status: normalizedStatus,
        paymentMethod: o.payment_method ?? o.paymentMethod ?? 'card',
        paymentStatus: o.payment_status ?? o.paymentStatus ?? (normalizedStatus === 'Delivered' ? 'Paid' : 'Pending'),
        upiRefNumber: o.upi_ref_number ?? o.upiRefNumber ?? undefined,
        cashfreeOrderId: o.cashfree_order_id ?? o.cashfreeOrderId ?? undefined,
        cashfreePaymentId: o.cashfree_payment_id ?? o.cashfreePaymentId ?? undefined,
        paidAt: o.paid_at ?? o.paidAt ?? undefined,
        trackingNumber: o.tracking_number ?? o.trackingNumber ?? o.tracking ?? '',
        createdAt: o.created_at ?? o.createdAt ?? o.inserted_at ?? new Date().toISOString(),
        estimatedDelivery: o.estimated_delivery ?? o.estimatedDelivery ?? '3-5 Business Days'
      };
    });

    console.log(`[Supabase Orders] Successfully fetched ${mappedOrders.length} orders from Supabase public.orders table.`);
    return { success: true, data: mappedOrders };
  } catch (err: any) {
    console.error('[Supabase Orders] Exception fetching orders:', err);
    return { success: false, data: [], error: err?.message };
  }
};

export const fetchOrderStatsFromSupabase = async (): Promise<{
  success: boolean;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  processingQueue: number;
  statusBreakdown: Record<string, number>;
  data: any[];
  error?: string;
}> => {
  try {
    const { success, data: orders, error } = await fetchOrdersFromSupabase();
    if (!success || error) {
      return {
        success: false,
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        processingQueue: 0,
        statusBreakdown: {},
        data: [],
        error: error || 'Failed to fetch orders from Supabase'
      };
    }

    const validOrders = Array.isArray(orders) ? orders : [];
    const totalOrders = validOrders.length;

    // Total Revenue = SUM(actual order total amount)
    const totalRevenue = validOrders.reduce((sum: number, o: any) => {
      const amount = Number(o.total) || 0;
      return sum + amount;
    }, 0);

    // Average Order Value = Total Revenue / Total Orders
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Processing Queue = COUNT orders where status = 'Processing' or 'Pending'
    const processingQueue = validOrders.filter((o: any) => {
      const status = typeof o.status === 'string' ? o.status.trim().toLowerCase() : '';
      return status === 'processing' || status === 'pending';
    }).length;

    // Status breakdown map
    const statusBreakdown = validOrders.reduce((acc: Record<string, number>, o: any) => {
      const status = (typeof o.status === 'string' && o.status.trim()) ? o.status.trim() : 'Processing';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      success: true,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      processingQueue,
      statusBreakdown,
      data: validOrders
    };
  } catch (err: any) {
    return {
      success: false,
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      processingQueue: 0,
      statusBreakdown: {},
      data: [],
      error: err?.message
    };
  }
};

export const saveOrderToSupabase = async (orderData: any) => {
  try {
    const dbClient = supabaseAdmin || supabase;

    // Validate UUID format for user_id to prevent foreign key errors on auth.users(id)
    const isValidUuid = (val: any) =>
      typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

    const resolvedUserId = isValidUuid(orderData.userId || orderData.user_id) ? (orderData.userId || orderData.user_id) : null;
    
    // Extract clean customer details
    const shippingAddr = typeof orderData.shippingAddress === 'object' ? orderData.shippingAddress : {};
    const customerName = shippingAddr?.fullName || orderData.customerName || orderData.customer_name || 'Customer';
    const email = shippingAddr?.email || orderData.email || 'customer@veyro.com';
    const phone = shippingAddr?.phone || orderData.phone || '';
    const fullAddress = typeof orderData.shippingAddress === 'string'
      ? orderData.shippingAddress
      : [
          shippingAddr?.address,
          shippingAddr?.apartment,
          shippingAddr?.city,
          shippingAddr?.state,
          shippingAddr?.zipCode,
          shippingAddr?.country
        ].filter(Boolean).join(', ') || orderData.address || '';

    const totalAmount = Number(orderData.total ?? orderData.total_amount ?? 0);
    const subtotal = Number(orderData.subtotal ?? totalAmount);
    const discount = Number(orderData.discount ?? 0);
    const shippingFee = Number(orderData.shippingFee ?? orderData.shipping_fee ?? 0);
    const tax = Number(orderData.tax ?? 0);
    const orderStatus = orderData.status || orderData.order_status || 'Processing';
    const paymentStatus = orderData.paymentStatus || orderData.payment_status || (orderData.paymentMethod === 'UPI' ? 'PENDING_VERIFICATION' : 'Paid');
    const paymentMethod = orderData.paymentMethod || orderData.payment_method || 'card';
    const trackingNumber = orderData.trackingNumber || orderData.tracking_number || '';
    const createdAt = orderData.createdAt || orderData.created_at || new Date().toISOString();
    const orderId = String(orderData.id || `VYR-${Math.floor(100000 + Math.random() * 900000)}`);

    // Base standard payload adhering strictly to Supabase orders table schema
    let currentPayload: Record<string, any> = {
      id: orderId,
      user_id: resolvedUserId,
      items: Array.isArray(orderData.items) ? orderData.items : [],
      shipping_address: shippingAddr,
      shipping_method: orderData.shippingMethod || 'standard',
      subtotal: subtotal,
      discount: discount,
      shipping_fee: shippingFee,
      tax: tax,
      total: totalAmount,
      status: orderStatus,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      tracking_number: trackingNumber,
      created_at: createdAt
    };

    console.log('[Supabase Orders] inserting order payload', {
      orderId,
      customer: customerName,
      amount: totalAmount,
      payload: currentPayload
    });
    
    // Adaptive insert: if column missing (PGRST204) or FK error (23503), prune and retry
    let insertResult: any = null;
    let attempts = 0;
    const maxAttempts = 8;
    let lastErrorMessage: string = '';

    while (attempts < maxAttempts) {
      attempts++;
      const { data, error } = await dbClient
        .from('orders')
        .upsert([currentPayload], { onConflict: 'id' })
        .select();

      console.log(`[Supabase Orders] Supabase response (attempt ${attempts}):`, { data, error });

      if (!error && data && data.length > 0) {
        insertResult = data;
        console.log('[Supabase Orders] created order id:', orderId);
        break;
      }

      if (error) {
        lastErrorMessage = error.message || error.details || 'Supabase orders insert failed';
        console.warn(`[Supabase Orders] Insert attempt ${attempts} notice:`, lastErrorMessage);

        // Check if error is missing column (e.g. column "phone" does not exist)
        const missingColMatch = error.message.match(/Could not find the ['"]?([a-zA-Z0-9_]+)['"]? column/i)
          || error.message.match(/column ['"]?([a-zA-Z0-9_]+)['"]? of relation ['"]?orders['"]? does not exist/i)
          || error.message.match(/column ['"]?([a-zA-Z0-9_]+)['"]? does not exist/i);

        if (missingColMatch && missingColMatch[1]) {
          const badCol = missingColMatch[1];
          console.log(`[Supabase Orders] Pruning non-existent column "${badCol}" from orders payload and retrying...`);
          delete currentPayload[badCol];
          continue;
        }

        // Check if foreign key on user_id failed
        if (error.code === '23503' || error.message.toLowerCase().includes('foreign key') || error.message.toLowerCase().includes('user_id')) {
          console.log('[Supabase Orders] Foreign key constraint on user_id triggered. Setting user_id = null and retrying...');
          currentPayload.user_id = null;
          continue;
        }

        // Fallback: try ultra-minimal standard payload without optional columns
        if (attempts === maxAttempts - 1) {
          console.log('[Supabase Orders] Trying ultra-minimal standard payload for orders table...');
          currentPayload = {
            id: orderId,
            items: Array.isArray(orderData.items) ? orderData.items : [],
            shipping_address: shippingAddr,
            total: totalAmount,
            status: orderStatus,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            created_at: createdAt
          };
          continue;
        }

        break;
      }
    }

    if (!insertResult) {
      console.error('[Supabase Orders] Failed to save order to public.orders table:', lastErrorMessage);
      return {
        success: false,
        error: lastErrorMessage || 'Could not insert order into Supabase database (RLS or schema error)',
        orderId
      };
    }

    // 2. Insert line items into order_items table
    if (Array.isArray(orderData.items) && orderData.items.length > 0) {
      console.log('[Supabase Orders] inserting order items', {
        orderId,
        itemCount: orderData.items.length,
        items: orderData.items
      });

      const itemsToInsert = orderData.items.map((item: any) => {
        const rawPid = item.productId || item.product_id || item.id;
        const validPid = isValidUuid(rawPid) ? rawPid : null;
        return {
          order_id: orderId,
          product_id: validPid || (rawPid ? String(rawPid) : null),
          product_name: item.name || item.productName || item.product_name || 'VEYRO Garment',
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
          size: String(item.size || 'M'),
          color: typeof item.color === 'string' ? item.color : (item.color?.name || 'Obsidian Black'),
          created_at: createdAt
        };
      });

      try {
        const { data: itemsData, error: itemsErr } = await dbClient
          .from('order_items')
          .upsert(itemsToInsert)
          .select();

        console.log('[Supabase Order Items] Supabase response for order_items:', { data: itemsData, error: itemsErr });

        if (itemsErr) {
          console.warn('[Supabase Order Items] Upsert notice on order_items table:', itemsErr.message);
          // If FK failed on product_id, retry with product_id: null
          if (itemsErr.code === '23503' || itemsErr.message?.toLowerCase().includes('product_id')) {
            const itemsNoFk = itemsToInsert.map(i => ({ ...i, product_id: null }));
            const { error: retryErr } = await dbClient.from('order_items').upsert(itemsNoFk);
            if (retryErr) {
              console.warn('[Supabase Order Items] Retry without FK notice:', retryErr.message);
            }
          }
        } else {
          console.log('[Supabase Order Items] Successfully inserted products into public.order_items table.');
        }
      } catch (itemException: any) {
        console.warn('[Supabase Order Items] Exception writing to order_items:', itemException?.message);
      }
    }

    return { 
      success: true, 
      data: insertResult || [currentPayload],
      orderId 
    };
  } catch (err: any) {
    console.error('[Supabase Orders] Order sync exception:', err?.message);
    return { success: false, error: err?.message || 'Unexpected error while syncing order to Supabase' };
  }
};

export const updateOrderStatusInSupabase = async (
  orderId: string, 
  status: string, 
  trackingNumber?: string,
  paymentStatus?: string,
  extra?: { cashfreePaymentId?: string; cashfreeOrderId?: string; paidAt?: string }
) => {
  try {
    const updatePayload: Record<string, any> = { status };
    if (trackingNumber !== undefined) updatePayload.tracking_number = trackingNumber;
    if (paymentStatus !== undefined) updatePayload.payment_status = paymentStatus;
    if (extra?.cashfreePaymentId) updatePayload.cashfree_payment_id = extra.cashfreePaymentId;
    if (extra?.cashfreeOrderId) updatePayload.cashfree_order_id = extra.cashfreeOrderId;
    if (extra?.paidAt) updatePayload.paid_at = extra.paidAt;

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select();

    if (error) {
      console.log('[Supabase Sync Notice] Order status update status:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    console.log('[Supabase Sync Notice] Order status update exception:', err?.message);
    return { success: false, error: err?.message };
  }
};

export const updateProductStockInSupabase = async (productId: string, stockQuantity: number) => {
  try {
    const inStock = stockQuantity > 0;
    const { data, error } = await supabase
      .from('products')
      .update({
        stock_quantity: stockQuantity,
        in_stock: inStock
      })
      .eq('id', productId)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data?.[0] };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
};

export const saveProductToSupabase = async (productData: any) => {
  try {
    const isValidUuid = (val: any) =>
      typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

    const isExistingUuid = isValidUuid(productData.id);

    const name = productData.name;
    const description = productData.description || '';
    const price = Number(productData.price);
    const category = productData.category;
    const original_price = productData.originalPrice ? Number(productData.originalPrice) : (productData.original_price ? Number(productData.original_price) : null);
    const fabric_gsm = Number(productData.gsm || productData.fabric_gsm || 280);
    const stock_quantity = productData.stockQuantity !== undefined ? Number(productData.stockQuantity) : (productData.stock_quantity !== undefined ? Number(productData.stock_quantity) : 25);
    const image_url = Array.isArray(productData.images) && productData.images.length > 0 
      ? productData.images[0] 
      : (productData.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80');
    const in_stock = stock_quantity > 0 && productData.inStock !== false && productData.in_stock !== false;
    const new_arrival_badge = Boolean(productData.isNewArrival ?? productData.new_arrival_badge);
    const limited_drop_badge = Boolean(productData.isLimitedDrop ?? productData.limited_drop_badge);
    const created_at = productData.createdAt || productData.created_at || new Date().toISOString();

    const exactRequestedPayload: Record<string, any> = {
      name,
      category,
      price,
      original_price,
      fabric_gsm,
      stock_quantity,
      image_url,
      description,
      in_stock,
      new_arrival_badge,
      limited_drop_badge,
      created_at
    };

    // ONLY pass `id` if updating an existing record with a valid UUID
    if (isExistingUuid) {
      exactRequestedPayload.id = productData.id;
    }

    const dbClient = supabaseAdmin || supabase;

    console.log('[Supabase Products] Saving product to public.products table (isExistingUuid:', isExistingUuid, '):', exactRequestedPayload);
    
    let { data, error } = isExistingUuid
      ? await dbClient
          .from('products')
          .upsert([exactRequestedPayload], { onConflict: 'id' })
          .select()
      : await dbClient
          .from('products')
          .insert([exactRequestedPayload])
          .select();

    // If column error occurs (e.g. if table schema uses alternative column names like gsm or images), retry with merged compatibility payload
    if (error && (error.code === 'PGRST204' || error.message?.includes('column'))) {
      console.warn('[Supabase Products] Exact column check notice:', error.message, '. Retrying with multi-column schema...');
      const compatPayload: Record<string, any> = {
        ...exactRequestedPayload,
        gsm: fabric_gsm,
        images: Array.isArray(productData.images) && productData.images.length > 0 ? productData.images : [image_url],
        is_new_arrival: new_arrival_badge,
        is_limited_drop: limited_drop_badge,
        is_trending: Boolean(productData.isTrending ?? productData.is_trending),
        slug: productData.slug || (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'veyro-piece'),
        fit: productData.fit || 'Oversized Boxy Fit',
        sizes: productData.sizes || ['S', 'M', 'L', 'XL'],
        colors: productData.colors || [{ name: 'Obsidian Black', hex: '#121212' }]
      };

      const retry = isExistingUuid
        ? await dbClient
            .from('products')
            .upsert([compatPayload], { onConflict: 'id' })
            .select()
        : await dbClient
            .from('products')
            .insert([compatPayload])
            .select();

      data = retry.data;
      error = retry.error;
    }

    if (error) {
      const isRlsError = error.code === '42501' || error.message?.toLowerCase().includes('row-level security');
      console.warn('[Supabase Products] Supabase product insert notice:', error.message, '(RLS active:', isRlsError, ')');
      return { 
        success: false, 
        isRlsError,
        error: isRlsError 
          ? 'Row-Level Security (RLS) is enabled on Supabase table "products". Public inserts require an INSERT policy on public.products or SUPABASE_SERVICE_ROLE_KEY.'
          : error.message 
      };
    }

    const savedId = data?.[0]?.id || (isExistingUuid ? productData.id : 'generated-uuid');
    console.log('[Supabase Products] Product saved successfully in Supabase public.products with UUID:', savedId);
    return { success: true, data };
  } catch (err: any) {
    console.error('[Supabase Products] Sync exception:', err?.message);
    return { success: false, error: err?.message };
  }
};

export const uploadProductImageToSupabase = async (
  file: File
): Promise<{ success: boolean; publicUrl?: string; error?: string }> => {
  try {
    // 1. Validate image type
    if (!file || !file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Invalid file format. Please upload a valid image file (PNG, JPG, WEBP, GIF, SVG).'
      };
    }

    // 2. Validate image file size (max 5MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        success: false,
        error: `File size (${fileSizeMB}MB) exceeds the maximum limit of 5.00MB.`
      };
    }

    // 3. Generate clean, unique file path
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
    const cleanFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
    const filePath = `garments/${Date.now()}_${cleanFileName}.${fileExt}`;

    const BUCKET_NAME = 'product-images';

    console.log(`[Supabase Storage] Uploading image "${file.name}" to bucket "${BUCKET_NAME}" at path "${filePath}"...`);

    // 4. Upload file to Supabase Storage bucket 'product-images'
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (error) {
      console.error('[Supabase Storage Upload Error]', error.message);
      return {
        success: false,
        error: `Supabase Storage upload failed: ${error.message}`
      };
    }

    // 5. Get public URL automatically from 'product-images' bucket
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      return {
        success: false,
        error: 'Failed to retrieve public URL for the uploaded image.'
      };
    }

    console.log('[Supabase Storage] Upload successful! Public URL:', publicUrlData.publicUrl);

    return {
      success: true,
      publicUrl: publicUrlData.publicUrl
    };
  } catch (err: any) {
    console.error('[Supabase Storage Exception]', err);
    return {
      success: false,
      error: err?.message || 'Unexpected exception while uploading image to Supabase Storage.'
    };
  }
};

export const deleteProductFromSupabase = async (productId: string) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.log('[Supabase Sync Notice] Product delete status:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
};

export const seedProductsToSupabase = async () => {
  try {
    console.log('[Supabase Seed Products] Seeding INITIAL_PRODUCTS into Supabase products table...');
    const isValidUuid = (val: any) =>
      typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

    const productsToInsert = INITIAL_PRODUCTS.map(p => {
      const item: Record<string, any> = {
        name: p.name,
        slug: p.slug,
        price: p.price,
        original_price: p.originalPrice || null,
        category: p.category,
        description: p.description || '',
        fabric_details: p.fabricDetails || '100% Combed Heavyweight Cotton • 280 GSM',
        gsm: p.gsm || 280,
        fit: p.fit || 'Oversized Boxy Fit',
        images: p.images || [],
        sizes: p.sizes || ['S', 'M', 'L', 'XL'],
        colors: p.colors || [],
        in_stock: p.inStock !== false,
        is_new_arrival: Boolean(p.isNewArrival),
        is_limited_drop: Boolean(p.isLimitedDrop),
        is_trending: Boolean(p.isTrending),
        drop_number: p.dropNumber || null,
        rating: p.rating || 4.8,
        review_count: p.reviewCount || 10,
        tags: p.tags || ['Heavyweight', 'Streetwear'],
        created_at: p.createdAt || new Date().toISOString()
      };
      if (isValidUuid(p.id)) {
        item.id = p.id;
      }
      return item;
    });

    let { data, error } = await supabase
      .from('products')
      .insert(productsToInsert)
      .select();

    if (error && (error.code === 'PGRST204' || error.message?.includes('column'))) {
      console.warn('[Supabase Seed Products] Full payload notice. Fallback seeding with core schema...');
      const coreProducts = INITIAL_PRODUCTS.map(p => {
        const item: Record<string, any> = {
          name: p.name,
          price: p.price,
          category: p.category,
          description: p.description || '',
          image_url: p.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
          created_at: p.createdAt || new Date().toISOString()
        };
        if (isValidUuid(p.id)) {
          item.id = p.id;
        }
        return item;
      });
      const retry = await supabase
        .from('products')
        .insert(coreProducts)
        .select();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.warn('[Supabase Seed Products] Notice:', error.message);
      return { success: false, error: error.message, data: [] };
    }

    console.log('[Supabase Seed Products] Successfully seeded products into Supabase count:', data?.length);
    return { success: true, data: data || [] };
  } catch (err: any) {
    console.error('[Supabase Seed Products] Exception:', err);
    return { success: false, error: err?.message, data: [] };
  }
};

export const fetchProductsFromSupabase = async (): Promise<{ success: boolean; data: any[]; error?: string; rawCount?: number }> => {
  try {
    console.log('[Supabase Products] Target URL:', SUPABASE_URL);
    console.log('[Supabase Products] Querying public.products table directly: supabase.from("products").select("*")...');
    
    const dbClient = supabaseAdmin || supabase;
    
    // 1. Primary Query: Direct client select with created_at ordering
    let { data, error, status, statusText } = await dbClient
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    // 2. Fallback: If ordering failed, try raw select without order
    if (error) {
      console.warn('[Supabase Products] Primary query note:', error.message || statusText);
      const fallbackQuery = await dbClient.from('products').select('*');
      if (fallbackQuery.data && !fallbackQuery.error) {
        data = fallbackQuery.data;
        error = null;
        status = fallbackQuery.status;
        statusText = fallbackQuery.statusText;
      }
    }

    // 3. Fallback: Direct Fetch to REST API endpoint if JS client was cached or encountered 404
    if (error && (error.code === 'PGRST200' || error.code === 'PGRST205' || status === 404 || error.message?.includes('404'))) {
      try {
        console.log('[Supabase Products] Retrying with direct REST fetch endpoint...');
        const restUrl = `${SUPABASE_URL}/rest/v1/products?select=*`;
        const headers: Record<string, string> = {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        };
        const restResp = await fetch(restUrl, { method: 'GET', headers });
        if (restResp.ok) {
          const restJson = await restResp.json();
          if (Array.isArray(restJson)) {
            data = restJson;
            error = null;
            status = restResp.status;
            statusText = restResp.statusText;
          }
        }
      } catch (restErr: any) {
        console.warn('[Supabase Products] Direct REST fetch note:', restErr?.message);
      }
    }

    // Console Logs for diagnostics
    console.log('[Supabase Products] Fetch success. Number of products received:', data ? data.length : 0);
    if (error) {
      console.warn('[Supabase Products] Supabase notice/error:', error);
    }

    if (error) {
      const isRls = error.code === '42501' || error.message?.toLowerCase().includes('row-level security') || error.message?.toLowerCase().includes('permission denied');
      const errorMsg = isRls 
        ? `Row Level Security (RLS) blocked SELECT on "products". Run SQL: CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true); (${error.message})`
        : (error.message || `Supabase query error (${error.code || status || 'unknown'}): ${statusText || 'Failed to fetch products'}`);
      
      console.error('[Supabase Products] Error fetching from Supabase:', errorMsg);
      return { success: false, data: [], error: errorMsg, rawCount: 0 };
    }

    // Gracefully handle empty table
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('[Supabase Products] 0 products found in public.products table (table is empty).');
      return { success: true, data: [], rawCount: 0 };
    }

    const mappedProducts = data.map(mapSupabaseProductToProduct);
    return { success: true, data: mappedProducts, rawCount: data.length };
  } catch (err: any) {
    console.error('[Supabase Products] Exception during fetchProductsFromSupabase:', err);
    return { success: false, data: [], error: err?.message || 'Network exception connecting to Supabase', rawCount: 0 };
  }
};

export const mapSupabaseProductToProduct = (p: any): any => {
  if (!p) {
    return {
      id: 'unknown',
      name: 'VEYRO Garment',
      slug: 'veyro-garment',
      price: 0,
      category: 'Oversized T-Shirts',
      description: '',
      fabricDetails: '280 GSM Heavyweight Combed Cotton',
      gsm: 280,
      fit: 'Oversized Boxy Fit',
      image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'],
      colors: [{ name: 'Obsidian Black', hex: '#121212' }],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      inStock: true,
      stockQuantity: 25,
      rating: 4.9,
      reviewCount: 18,
      tags: ['Heavyweight', 'Streetwear'],
      createdAt: new Date().toISOString()
    };
  }

  // Safe number parser
  const parseNum = (val: any, fallback = 0): number => {
    if (val === null || val === undefined || val === '') return fallback;
    const parsed = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
    return isNaN(parsed) ? fallback : parsed;
  };

  // 1. Schema fields: id, name, description, price, category, created_at
  const id = String(p.id ?? '');
  const name = String(p.name || 'VEYRO Garment');
  const description = String(p.description || '');
  const price = parseNum(p.price, 0);
  const category = (p.category || 'Oversized T-Shirts');
  const createdAt = String(p.created_at || p.createdAt || new Date().toISOString());

  // 2. Schema field: original_price
  const originalPrice = (p.original_price !== undefined && p.original_price !== null)
    ? parseNum(p.original_price)
    : (p.originalPrice !== undefined && p.originalPrice !== null ? parseNum(p.originalPrice) : undefined);

  // 3. Schema field: fabric_gsm (with fallback to gsm)
  const gsm = parseNum(p.fabric_gsm ?? p.gsm, 280);
  const fabricDetails = p.fabric_details || `${gsm} GSM Heavyweight Combed Cotton (Preshrunk)`;
  const fit = p.fit || 'Oversized Boxy Fit';

  // 4. Schema field: image_url
  const imageUrl = p.image_url 
    || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null)
    || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80';
  const images = (Array.isArray(p.images) && p.images.length > 0) ? p.images : [imageUrl];

  // 5. Schema fields: stock, stock_quantity, in_stock
  const stockQuantity = parseNum(p.stock_quantity ?? p.stock ?? p.stockQuantity, 25);
  const inStock = (p.in_stock !== undefined && p.in_stock !== null)
    ? Boolean(p.in_stock)
    : (p.inStock !== undefined ? Boolean(p.inStock) : stockQuantity > 0);

  // 6. Schema fields: new_arrival_badge, limited_drop_badge
  const isNewArrival = Boolean(p.new_arrival_badge ?? p.is_new_arrival ?? p.isNewArrival ?? false);
  const isLimitedDrop = Boolean(p.limited_drop_badge ?? p.is_limited_drop ?? p.isLimitedDrop ?? false);
  const isTrending = Boolean(p.is_trending ?? p.isTrending ?? false);

  // 7. Auxiliary presentation fields
  const slug = p.slug || (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : id || 'veyro-piece');
  const colors = (Array.isArray(p.colors) && p.colors.length > 0)
    ? p.colors
    : [{ name: 'Obsidian Black', hex: '#121212' }];
  const sizes = (Array.isArray(p.sizes) && p.sizes.length > 0)
    ? p.sizes
    : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const tags = (Array.isArray(p.tags) && p.tags.length > 0)
    ? p.tags
    : [category, `${gsm} GSM`, isLimitedDrop ? 'Limited Drop' : 'Streetwear'];
  const rating = parseNum(p.rating, 4.9);
  const reviewCount = parseNum(p.review_count ?? p.reviewCount, 24);
  const dropNumber = p.drop_number || (isLimitedDrop ? 'LIMITED' : undefined);

  return {
    id,
    name,
    slug,
    price,
    originalPrice,
    category,
    description,
    fabricDetails,
    gsm,
    fit,
    image_url: imageUrl,
    images,
    colors,
    sizes,
    inStock,
    stockQuantity,
    isNewArrival,
    isTrending,
    isLimitedDrop,
    dropNumber,
    rating,
    reviewCount,
    tags,
    createdAt
  };
};

export const fetchWishlistFromSupabase = async (
  userIdOrEmail: string
): Promise<{ success: boolean; data: any[]; productIds: string[]; error?: string }> => {
  if (!userIdOrEmail) return { success: false, data: [], productIds: [] };

  try {
    const { data: rawWishlist, error: rawError } = await supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', userIdOrEmail);

    if (rawError) {
      console.warn('[Supabase Wishlist] Query notice:', rawError.message);
      return { success: false, data: [], productIds: [], error: rawError.message };
    }

    if (!rawWishlist || !Array.isArray(rawWishlist)) {
      return { success: true, data: [], productIds: [] };
    }

    const productIds = rawWishlist.map((w: any) => w.product_id).filter(Boolean);

    if (productIds.length > 0) {
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (!prodError && prodData && Array.isArray(prodData) && prodData.length > 0) {
        const products = prodData.map(mapSupabaseProductToProduct);
        return { success: true, data: products, productIds };
      }
    }

    return { success: true, data: [], productIds };
  } catch (err: any) {
    console.warn('[Supabase Wishlist] Exception:', err?.message || err);
    return { success: false, data: [], productIds: [], error: err?.message };
  }
};

export const addWishlistItemToSupabase = async (userIdOrEmail: string, productId: string) => {
  if (!userIdOrEmail || !productId) return;
  try {
    const { error } = await supabase
      .from('wishlist')
      .upsert([
        { user_id: userIdOrEmail, product_id: productId }
      ], { onConflict: 'user_id,product_id' });

    if (error) {
      console.warn('[Supabase Wishlist Sync] Upsert notice:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase Wishlist Sync] Upsert exception:', err);
  }
};

export const removeWishlistItemFromSupabase = async (userIdOrEmail: string, productId: string) => {
  if (!userIdOrEmail || !productId) return;
  try {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userIdOrEmail)
      .eq('product_id', productId);

    if (error) {
      console.warn('[Supabase Wishlist Sync] Delete notice:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase Wishlist Sync] Delete exception:', err);
  }
};

// SQL RLS Generator string for Supabase Dashboard setup
export const GENERATE_SUPABASE_RLS_SQL = `-- VEYRO Streetwear - Complete E-Commerce Database Schema & RLS Policies
-- Execute in Supabase SQL Editor: https://supabase.com/dashboard/project/jjkmtvtdobhiehfzeljr/sql

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  category TEXT NOT NULL DEFAULT 'Oversized T-Shirts',
  description TEXT,
  fabric_gsm INT DEFAULT 280,
  gsm INT DEFAULT 280,
  fit TEXT DEFAULT 'Oversized Boxy Fit',
  image_url TEXT,
  images TEXT[],
  sizes TEXT[],
  colors JSONB,
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INT DEFAULT 25,
  new_arrival_badge BOOLEAN DEFAULT false,
  limited_drop_badge BOOLEAN DEFAULT false,
  is_new_arrival BOOLEAN DEFAULT false,
  is_limited_drop BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure stock_quantity & image_url exist on products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 25;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fabric_gsm INT DEFAULT 280;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS new_arrival_badge BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS limited_drop_badge BOOLEAN DEFAULT false;

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  customer_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'Paid',
  order_status TEXT DEFAULT 'Processing',
  items JSONB,
  shipping_address JSONB,
  shipping_method TEXT DEFAULT 'standard',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  shipping_fee NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'Processing',
  payment_method TEXT DEFAULT 'card',
  tracking_number TEXT DEFAULT '',
  upi_ref_number TEXT,
  cashfree_order_id TEXT,
  cashfree_payment_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all order columns exist on existing databases
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'Processing';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Paid';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS upi_ref_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cashfree_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cashfree_payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0;

-- 4. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  size TEXT DEFAULT 'M',
  color TEXT DEFAULT 'Obsidian Black',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. STORAGE BUCKET FOR PRODUCT IMAGES
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES FOR PROFILES
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone manage profiles" ON public.profiles;

CREATE POLICY "Anyone manage profiles" ON public.profiles
  FOR ALL USING (true) WITH CHECK (true);

-- 8. RLS POLICIES FOR PRODUCTS
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Anyone manage products" ON public.products;

CREATE POLICY "Public read products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Anyone manage products" ON public.products
  FOR ALL USING (true) WITH CHECK (true);

-- 9. RLS POLICIES FOR ORDERS
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone manage orders" ON public.orders;

CREATE POLICY "Public read orders" ON public.orders
  FOR SELECT USING (true);

CREATE POLICY "Anyone manage orders" ON public.orders
  FOR ALL USING (true) WITH CHECK (true);

-- 10. RLS POLICIES FOR ORDER_ITEMS
DROP POLICY IF EXISTS "Public read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone manage order_items" ON public.order_items;

CREATE POLICY "Public read order_items" ON public.order_items
  FOR SELECT USING (true);

CREATE POLICY "Anyone manage order_items" ON public.order_items
  FOR ALL USING (true) WITH CHECK (true);

-- 11. STORAGE POLICIES FOR PRODUCT-IMAGES BUCKET
DROP POLICY IF EXISTS "Public Read Product Storage" ON storage.objects;
DROP POLICY IF EXISTS "Anyone Upload Product Storage" ON storage.objects;

CREATE POLICY "Public Read Product Storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Anyone Upload Product Storage" ON storage.objects
  FOR ALL USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');
`;

// 10. SHIPMENTS & LOGISTICS MANAGEMENT (Quickink / Shiprocket style)
export const fetchShipmentsFromSupabase = async (): Promise<{ success: boolean; data: any[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase Shipments] Notice querying public.shipments table:', error.message);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err: any) {
    console.warn('[Supabase Shipments] Exception:', err?.message || err);
    return { success: false, data: [], error: err?.message };
  }
};

export const saveShipmentToSupabase = async (shipment: any): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const payload = {
      id: shipment.id,
      order_id: shipment.orderId,
      customer_name: shipment.customerName,
      customer_phone: shipment.customerPhone || '',
      courier_partner: shipment.courierPartner,
      awb_number: shipment.awbNumber,
      status: shipment.status,
      origin_city: shipment.originCity,
      dest_city: shipment.destCity,
      dest_pincode: shipment.destPincode,
      weight_kg: shipment.weightKg,
      shipping_fee: shipment.shippingFee,
      rto_reason: shipment.rtoReason || null,
      timeline: shipment.timeline || [],
      created_at: shipment.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('shipments')
      .upsert([payload], { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('[Supabase Shipments] Upsert notice:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.warn('[Supabase Shipments] Exception:', err?.message || err);
    return { success: false, error: err?.message };
  }
};

export const updateShipmentStatusInSupabase = async (
  shipmentId: string,
  status: string,
  newTimelineEvent?: { title: string; location: string; timestamp: string; done: boolean }
): Promise<{ success: boolean; error?: string }> => {
  try {
    let currentTimeline: any[] = [];
    if (newTimelineEvent) {
      const { data } = await supabase.from('shipments').select('timeline').eq('id', shipmentId).single();
      if (data?.timeline && Array.isArray(data.timeline)) {
        currentTimeline = [...data.timeline, newTimelineEvent];
      } else {
        currentTimeline = [newTimelineEvent];
      }
    }

    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString()
    };
    if (newTimelineEvent) {
      updatePayload.timeline = currentTimeline;
    }

    const { error } = await supabase
      .from('shipments')
      .update(updatePayload)
      .eq('id', shipmentId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
};

// 11. MARKETING & PROMO CODES
export const fetchPromoCodesFromSupabase = async (): Promise<{ success: boolean; data: any[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, data: [], error: error.message };
    }
    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message };
  }
};

export const savePromoCodeToSupabase = async (promo: any): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const payload = {
      id: promo.id,
      code: promo.code.toUpperCase().trim(),
      discount_percent: promo.discountPercent,
      discount_amount: promo.discountAmount || 0,
      min_order_value: promo.minOrderValue || 0,
      usage_limit: promo.usageLimit || 100,
      times_used: promo.timesUsed || 0,
      is_active: promo.isActive !== false,
      expires_at: promo.expiresAt,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('promo_codes')
      .upsert([payload], { onConflict: 'code' })
      .select();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
};

export const deletePromoCodeFromSupabase = async (code: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('code', code.toUpperCase().trim());

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
};

// Real-time Postgres Changes Listener
export const subscribeToSupabaseRealtime = (
  tables: ('products' | 'orders' | 'profiles' | 'shipments')[],
  onChange: (payload: any) => void
) => {
  try {
    const channelName = `realtime-admin-dashboard-${Date.now()}`;
    const channel = supabase.channel(channelName);

    tables.forEach(table => {
      channel.on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table },
        (payload: any) => {
          console.log(`[Supabase Realtime] Event on ${table}:`, payload);
          onChange({ table, ...payload });
        }
      );
    });

    channel.subscribe((status) => {
      console.log(`[Supabase Realtime] Channel status: ${status}`);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (e) {
    console.warn('[Supabase Realtime] Subscription error:', e);
    return () => {};
  }
};

