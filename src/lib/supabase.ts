import { createClient } from '@supabase/supabase-js';

// User-provided Supabase project credentials
export const SUPABASE_PROJECT_ID = 'jjkmtvtdobhiehfzeljr';
export const SUPABASE_URL = process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqa210dnRkb2JoaWVoZnplbGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDcyNzUsImV4cCI6MjEwMTc4MzI3NX0.K2OBBnJpvg8wL46b_uTv-n9plxb6mA4VKWaVZm0NT8w';

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: true,
  }
});

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
  slug: string;
  price: number;
  original_price?: number;
  category: string;
  description: string;
  gsm?: number;
  fit?: string;
  images: string[];
  sizes: string[];
  colors: any[];
  in_stock: boolean;
  is_new_arrival?: boolean;
  is_limited_drop?: boolean;
  is_trending?: boolean;
  created_at: string;
}

export interface SupabaseProfile {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'customer' | 'user';
  created_at?: string;
}

// Fetch user profile from Supabase profiles table and verify role
export const fetchProfileFromSupabase = async (
  userEmail: string,
  userId?: string
): Promise<{ profile: SupabaseProfile | null; role: string }> => {
  const cleanEmail = (userEmail || '').trim().toLowerCase();

  try {
    let profileData: SupabaseProfile | null = null;
    let queryError: any = null;

    // 1. Primary Query: Query profiles table by email (case-insensitive)
    if (cleanEmail) {
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
        console.warn('[Supabase Auth Debug] Profile email query warning:', error.message);
      }
    }

    // 2. Secondary Query: If not found by email and userId is a valid UUID, try by id
    const isValidUuid = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!profileData && isValidUuid) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        profileData = data;
      }
      if (error) {
        console.warn('[Supabase Auth Debug] Profile ID query warning:', error.message);
      }
    }

    // Determine role value from Supabase profiles table
    let roleValue = profileData?.role;

    // Admin email override
    const isAdminEmail = cleanEmail === 'ishansharma3305@gmail.com' || cleanEmail === 'admin@veyro.com';

    // If profile exists in Supabase profiles table, map role strictly
    if (profileData) {
      if (profileData.role === 'admin' || isAdminEmail) {
        roleValue = 'admin';
      }
    } else if (!queryError && cleanEmail) {
      // If profile genuinely doesn't exist in Supabase and query succeeded, auto-create profile
      const defaultRole = isAdminEmail ? 'admin' : 'customer';
      const newProfile = {
        id: isValidUuid ? userId : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'usr_' + Date.now()),
        email: cleanEmail,
        name: userEmail.split('@')[0],
        role: defaultRole,
        created_at: new Date().toISOString()
      };

      const { data: insertedData, error: insertError } = await supabase
        .from('profiles')
        .upsert([newProfile], { onConflict: 'email' })
        .select()
        .maybeSingle();

      if (!insertError && insertedData) {
        profileData = insertedData;
        roleValue = insertedData.role;
        console.log('[Supabase Auth Debug] Profile upserted in Supabase:', insertedData);
      } else {
        roleValue = defaultRole;
      }
    } else {
      // Fallback if query error occurred or no email
      roleValue = isAdminEmail ? 'admin' : 'customer';
    }

    const finalRole = roleValue === 'admin' || isAdminEmail ? 'admin' : (roleValue || 'customer');

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
    const fallbackRole = (cleanEmail === 'ishansharma3305@gmail.com' || cleanEmail === 'admin@veyro.com') ? 'admin' : 'customer';

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

export const saveOrderToSupabase = async (orderData: any) => {
  try {
    const payload = {
      id: orderData.id,
      user_id: orderData.userId || null,
      items: orderData.items,
      shipping_address: orderData.shippingAddress,
      shipping_method: orderData.shippingMethod || 'standard',
      subtotal: orderData.subtotal || 0,
      discount: orderData.discount || 0,
      total: orderData.total || 0,
      status: orderData.status || 'Processing',
      payment_method: orderData.paymentMethod || 'card',
      created_at: orderData.createdAt || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('orders')
      .upsert([payload], { onConflict: 'id' })
      .select();

    if (error) {
      console.log('[Supabase Sync Notice] Order insert status:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.log('[Supabase Sync Notice] Order sync exception:', err?.message);
    return { success: false, error: err?.message };
  }
};

export const updateOrderStatusInSupabase = async (orderId: string, status: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
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

export const saveProductToSupabase = async (productData: any) => {
  try {
    const payload = {
      id: productData.id,
      name: productData.name,
      slug: productData.slug || productData.id,
      price: productData.price,
      original_price: productData.originalPrice || null,
      category: productData.category,
      description: productData.description || '',
      gsm: productData.gsm || 280,
      fit: productData.fit || 'Oversized Boxy Fit',
      images: productData.images || [],
      sizes: productData.sizes || ['S', 'M', 'L', 'XL'],
      colors: productData.colors || [],
      in_stock: productData.inStock !== false,
      is_new_arrival: productData.isNewArrival || false,
      is_limited_drop: productData.isLimitedDrop || false,
      is_trending: productData.isTrending || false,
      created_at: productData.createdAt || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('products')
      .upsert([payload], { onConflict: 'id' })
      .select();

    if (error) {
      console.log('[Supabase Sync Notice] Product upsert status:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.log('[Supabase Sync Notice] Product sync exception:', err?.message);
    return { success: false, error: err?.message };
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

export const mapSupabaseProductToProduct = (p: any): any => {
  return {
    id: p.id || 'veyro-unknown',
    name: p.name || 'VEYRO Piece',
    slug: p.slug || p.id || 'veyro-piece',
    price: typeof p.price === 'number' ? p.price : Number(p.price) || 0,
    originalPrice: p.original_price ? Number(p.original_price) : undefined,
    category: p.category || 'Oversized T-Shirts',
    description: p.description || '',
    fabricDetails: p.fabric_details || '100% Combed Heavyweight Cotton • 280 GSM',
    gsm: p.gsm || 280,
    fit: p.fit || 'Oversized Boxy Fit',
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'],
    colors: Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : [{ name: 'Obsidian Black', hex: '#121212' }],
    sizes: Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['S', 'M', 'L', 'XL'],
    inStock: p.in_stock !== false,
    isNewArrival: p.is_new_arrival || false,
    isTrending: p.is_trending || false,
    isLimitedDrop: p.is_limited_drop || false,
    rating: p.rating || 4.9,
    reviewCount: p.review_count || 24,
    tags: p.tags || ['Heavyweight', 'Streetwear'],
    createdAt: p.created_at || new Date().toISOString()
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
export const GENERATE_SUPABASE_RLS_SQL = `-- VEYRO Streetwear - Production Supabase RLS Policies & Schema
-- Project ID: jjkmtvtdobhiehfzeljr

-- 1. Create Profiles Table with Role Column
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Admin Roles Table
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  category TEXT NOT NULL,
  description TEXT,
  gsm INT DEFAULT 280,
  fit TEXT DEFAULT 'Oversized Boxy Fit',
  images TEXT[],
  sizes TEXT[],
  colors JSONB,
  in_stock BOOLEAN DEFAULT true,
  is_new_arrival BOOLEAN DEFAULT false,
  is_limited_drop BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Orders & Order Items Tables
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  items JSONB NOT NULL,
  shipping_address JSONB NOT NULL,
  shipping_method TEXT DEFAULT 'standard',
  subtotal NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'Processing',
  payment_method TEXT DEFAULT 'card',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Wishlist Table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_product UNIQUE (user_id, product_id)
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for Wishlist
CREATE POLICY "Users manage own wishlist" ON public.wishlist
  FOR ALL USING (true);

-- 6. RLS Policies for Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins full profile access" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. RLS Policies for Products
CREATE POLICY "Public read products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Admin write products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8. RLS Policies for Orders
CREATE POLICY "Customers view own orders" ON public.orders
  FOR SELECT USING (user_id = auth.uid()::text OR user_id IS NULL);

CREATE POLICY "Admin manage all orders" ON public.orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
`;

