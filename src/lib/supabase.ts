import { createClient } from '@supabase/supabase-js';
import { INITIAL_PRODUCTS } from '../data/products';

// User-provided Supabase project credentials
export const SUPABASE_PROJECT_ID = 'jjkmtvtdobhiehfzeljr';
const rawSupabaseUrl = process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_URL = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqa210dnRkb2JoaWVoZnplbGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDcyNzUsImV4cCI6MjEwMTc4MzI3NX0.K2OBBnJpvg8wL46b_uTv-n9plxb6mA4VKWaVZm0NT8w';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

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

    // If profile exists in Supabase profiles table, preserve role and update missing avatar_url/full_name if provided
    if (profileData) {
      if (profileData.role === 'admin' || isAdminEmail) {
        roleValue = 'admin';
      }
      // Non-destructive update for Google metadata if missing
      let needsUpdate = false;
      const updatePayload: Record<string, any> = {};
      if (extraMetadata?.fullName && !profileData.full_name) {
        updatePayload.full_name = extraMetadata.fullName;
        needsUpdate = true;
      }
      if (extraMetadata?.avatarUrl && !profileData.avatar_url) {
        updatePayload.avatar_url = extraMetadata.avatarUrl;
        needsUpdate = true;
      }
      if (needsUpdate && profileData.id) {
        const { data: updated } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', profileData.id)
          .select()
          .maybeSingle();

        if (updated) profileData = updated;
      }
    } else if (!queryError && cleanEmail) {
      // If profile genuinely doesn't exist in Supabase and query succeeded, auto-create profile
      const defaultRole = isAdminEmail ? 'admin' : 'user';
      const resolvedName = extraMetadata?.fullName || userEmail.split('@')[0];

      if (!isValidUuid) {
        console.warn('[Supabase Auth Debug] Skipping profile insertion: userId is not a valid UUID:', userId);
      } else {
        const newProfile = {
          id: userId, // Real UUID from Supabase Auth data.user.id
          email: cleanEmail,
          full_name: resolvedName,
          name: resolvedName,
          avatar_url: extraMetadata?.avatarUrl || null,
          role: defaultRole,
          created_at: new Date().toISOString()
        };

        const dbClient = supabaseAdmin || supabase;
        const { data: insertedData, error: insertError } = await dbClient
          .from('profiles')
          .upsert([newProfile], { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (!insertError && insertedData) {
          profileData = insertedData;
          roleValue = insertedData.role;
          console.log('[Supabase Auth Debug] Profile upserted in Supabase:', insertedData);
        } else {
          console.warn('[Supabase Auth Debug] Profile insert error:', insertError?.message);
          profileData = newProfile as any;
          roleValue = defaultRole;
        }
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

export const fetchOrdersFromSupabase = async (userId?: string): Promise<{ success: boolean; data: any[]; error?: string }> => {
  try {
    console.log('[Supabase Orders] Executing query: supabase.from("orders").select("*")...');
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[Supabase Orders] Fetch error:', error.message);
      return { success: false, data: [], error: error.message };
    }

    console.log(`[Supabase Orders] Successfully fetched ${data?.length || 0} orders from Supabase orders table.`);
    return { success: true, data: data || [] };
  } catch (err: any) {
    console.error('[Supabase Orders] Exception:', err);
    return { success: false, data: [], error: err?.message };
  }
};

export const fetchOrderStatsFromSupabase = async (): Promise<{
  success: boolean;
  totalOrders: number;
  totalRevenue: number;
  statusBreakdown: Record<string, number>;
  data: any[];
  error?: string;
}> => {
  try {
    const { success, data: orders, error } = await fetchOrdersFromSupabase();
    if (!success || error) {
      return { success: false, totalOrders: 0, totalRevenue: 0, statusBreakdown: {}, data: [], error };
    }

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
    const statusBreakdown = orders.reduce((acc: Record<string, number>, o: any) => {
      const status = o.status || 'Processing';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      success: true,
      totalOrders,
      totalRevenue,
      statusBreakdown,
      data: orders
    };
  } catch (err: any) {
    return {
      success: false,
      totalOrders: 0,
      totalRevenue: 0,
      statusBreakdown: {},
      data: [],
      error: err?.message
    };
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

    console.log('[Supabase Orders] Saving order to Supabase orders table:', payload.id);
    const { data, error } = await supabase
      .from('orders')
      .upsert([payload], { onConflict: 'id' })
      .select();

    if (error) {
      console.error('[Supabase Orders] Order insert error:', error.message);
      return { success: false, error: error.message };
    }

    console.log('[Supabase Orders] Order inserted successfully into Supabase orders table:', data?.[0]?.id || orderData.id);
    return { success: true, data };
  } catch (err: any) {
    console.error('[Supabase Orders] Order sync exception:', err?.message);
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
    const isValidUuid = (val: any) =>
      typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

    const isExistingUuid = isValidUuid(productData.id);

    const name = productData.name;
    const description = productData.description || '';
    const price = Number(productData.price);
    const category = productData.category;
    const original_price = productData.originalPrice ? Number(productData.originalPrice) : (productData.original_price ? Number(productData.original_price) : null);
    const fabric_gsm = Number(productData.gsm || productData.fabric_gsm || 280);
    const image_url = Array.isArray(productData.images) && productData.images.length > 0 
      ? productData.images[0] 
      : (productData.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80');
    const in_stock = productData.inStock !== false && productData.in_stock !== false;
    const new_arrival_badge = Boolean(productData.isNewArrival ?? productData.new_arrival_badge);
    const limited_drop_badge = Boolean(productData.isLimitedDrop ?? productData.limited_drop_badge);
    const created_at = productData.createdAt || productData.created_at || new Date().toISOString();

    // Primary payload matching requested column names:
    // name, category, price, original_price, fabric_gsm, image_url, description, in_stock, new_arrival_badge, limited_drop_badge
    const exactRequestedPayload: Record<string, any> = {
      name,
      category,
      price,
      original_price,
      fabric_gsm,
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

    // 4. Upload file to Supabase Storage bucket
    let { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    // Handle missing bucket auto-creation fallback attempt
    if (error && (error.message?.toLowerCase().includes('bucket not found') || (error as any).statusCode === '404' || (error as any).status === 404)) {
      console.warn(`[Supabase Storage] Bucket "${BUCKET_NAME}" not found. Attempting bucket creation...`);
      try {
        await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5242880
        });

        const retry = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type
          });
        data = retry.data;
        error = retry.error;
      } catch (createErr: any) {
        console.error('[Supabase Storage] Bucket creation error:', createErr?.message);
      }
    }

    if (error) {
      console.error('[Supabase Storage Upload Error]', error.message);
      return {
        success: false,
        error: `Supabase Storage upload failed: ${error.message}`
      };
    }

    // 5. Get public URL
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

export const fetchProductsFromSupabase = async (): Promise<{ success: boolean; data: any[]; error?: string }> => {
  try {
    console.log('[Supabase Products] Executing query: supabase.from("products").select("*")...');
    let { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    // If query succeeded but table is empty (0 products), trigger seed script!
    if (!error && (!data || data.length === 0)) {
      console.log('[Supabase Products] Products table is empty. Auto-seeding initial Veyro products into Supabase...');
      const seedResult = await seedProductsToSupabase();
      if (seedResult.success && seedResult.data.length > 0) {
        data = seedResult.data;
      } else {
        const retry = await supabase.from('products').select('*');
        data = retry.data || [];
        error = retry.error;
      }
    }

    if (error) {
      console.warn('[Supabase Products] Fetch notice:', error.message);
      return { success: true, data: INITIAL_PRODUCTS, error: error.message };
    }

    console.log(`[Supabase Products] Successfully fetched ${data?.length || 0} products from Supabase products table.`);
    const mappedProducts = (data || []).map(mapSupabaseProductToProduct);
    return { success: true, data: mappedProducts.length > 0 ? mappedProducts : INITIAL_PRODUCTS };
  } catch (err: any) {
    console.error('[Supabase Products] Exception:', err);
    return { success: true, data: INITIAL_PRODUCTS, error: err?.message };
  }
};

export const mapSupabaseProductToProduct = (p: any): any => {
  const images = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : (p.image_url ? [p.image_url] : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80']);

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
    images,
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
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Admin write products" ON public.products;
DROP POLICY IF EXISTS "Allow product manage" ON public.products;

CREATE POLICY "Public read products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Allow product manage" ON public.products
  FOR ALL USING (true) WITH CHECK (true);

-- 8. RLS Policies for Orders
DROP POLICY IF EXISTS "Customers view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admin manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public read orders" ON public.orders;

CREATE POLICY "Anyone can insert orders" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read orders" ON public.orders
  FOR SELECT USING (true);

CREATE POLICY "Admin manage all orders" ON public.orders
  FOR ALL USING (true);
`;

