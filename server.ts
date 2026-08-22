import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jsonwebtoken from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/database';
import { 
  saveAppointmentToSupabase, 
  fetchAppointmentsFromSupabase, 
  saveOrderToSupabase,
  fetchOrdersFromSupabase,
  fetchCustomersFromSupabase,
  saveProductToSupabase,
  deleteProductFromSupabase,
  fetchProductsFromSupabase,
  seedProductsToSupabase,
  updateOrderStatusInSupabase,
  updateProductStockInSupabase,
  GENERATE_SUPABASE_RLS_SQL,
  SUPABASE_PROJECT_ID,
  SUPABASE_URL
} from './src/lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'veyro_streetwear_jwt_secret_key_2026';
const PORT = 3000;

const app = express();

app.use(express.json());

// Helper to decode either a local JWT or a Supabase Auth JWT token
const decodeToken = (token: string): { userId?: string; email?: string; role?: string } | null => {
  if (!token) return null;
  try {
    const verified: any = jsonwebtoken.verify(token, JWT_SECRET);
    if (verified) {
      return {
        userId: verified.userId || verified.sub || verified.id,
        email: verified.email,
        role: verified.role
      };
    }
  } catch (err) {
    // If not signed with local secret, decode token payload (e.g. Supabase Auth JWT)
    try {
      const decoded: any = jsonwebtoken.decode(token);
      if (decoded) {
        return {
          userId: decoded.sub || decoded.userId || decoded.id,
          email: decoded.email,
          role: decoded.user_metadata?.role || decoded.app_metadata?.role || decoded.role
        };
      }
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Auth middleware helper
const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
};

// Admin Auth Middleware
const authenticateAdmin = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Admin access token required' });
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired session token' });
  }

  const cleanEmail = (decoded.email || '').toLowerCase().trim();
  const dbUser = decoded.userId ? db.getUserById(decoded.userId) : (cleanEmail ? db.getUserByEmail(cleanEmail) : undefined);

  const isAdmin = 
    decoded.role === 'admin' ||
    dbUser?.role === 'admin' ||
    cleanEmail === 'ishansharma3305@gmail.com' ||
    cleanEmail === 'ishan.sharma.7976@gmail.com' ||
    cleanEmail === 'admin@veyro.com';

  if (!isAdmin) {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }

  req.user = dbUser || { id: decoded.userId || 'usr_admin', email: cleanEmail, role: 'admin' };
  next();
};

// --- API ROUTES ---

// 1. Get Products list with filters from Supabase
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { category, search, minPrice, maxPrice, sizes, sortBy, limitedOnly } = req.query;

    const { success, data: supabaseProducts, error } = await fetchProductsFromSupabase();

    if (!success) {
      return res.status(500).json({
        error: error || 'Failed to fetch products from Supabase',
        products: [],
        total: 0
      });
    }

    let products = [...(supabaseProducts || [])];

    // Filter by Category
    if (category && category !== 'All') {
      products = products.filter(p => (p.category || '').toLowerCase() === (category as string).toLowerCase());
    }

    // Filter by Search Query
    if (search) {
      const q = (search as string).toLowerCase().trim();
      products = products.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some((t: string) => (t || '').toLowerCase().includes(q)))
      );
    }

    // Min / Max Price
    if (minPrice) {
      const min = parseFloat(minPrice as string);
      if (!isNaN(min)) products = products.filter(p => p.price >= min);
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice as string);
      if (!isNaN(max)) products = products.filter(p => p.price <= max);
    }

    // Sizes filter
    if (sizes) {
      const parsedSizes = Array.isArray(sizes) ? sizes : (sizes as string).split(',');
      products = products.filter(p => p.sizes && Array.isArray(p.sizes) && p.sizes.some((s: string) => parsedSizes.includes(s)));
    }

    // Limited Drops filter
    if (limitedOnly === 'true') {
      products = products.filter(p => p.isLimitedDrop);
    }

    // Sorting
    if (sortBy === 'price-low' || sortBy === 'price-asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high' || sortBy === 'price-desc') {
      products.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'newest') {
      products.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    res.json({ products, total: products.length, source: 'supabase' });
  } catch (err: any) {
    console.error('Failed to fetch products from Supabase:', err);
    res.status(500).json({ products: [], total: 0, error: err?.message || 'Failed to fetch products from Supabase' });
  }
});

// 2. Get Single Product from Supabase
app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const { success, data: products, error } = await fetchProductsFromSupabase();
    if (!success) {
      return res.status(500).json({ error: error || 'Failed to fetch products from Supabase' });
    }
    const product = (products || []).find(p => String(p.id) === String(req.params.id) || p.slug === req.params.id);
    if (!product) {
      return res.status(404).json({ error: `Product "${req.params.id}" not found in Supabase database` });
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch product details from Supabase' });
  }
});

// 3. Get Categories Summary from Supabase
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const { success, data: allProducts, error } = await fetchProductsFromSupabase();
    if (!success) {
      return res.status(500).json({ error: error || 'Failed to fetch categories from Supabase' });
    }
    const categories = [
      'Oversized T-Shirts',
      'Graphic T-Shirts',
      'Hoodies',
      'Limited Edition Drops'
    ].map(catName => ({
      name: catName,
      count: (allProducts || []).filter(p => p.category === catName).length
    }));

    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch categories summary' });
  }
});

// 4. Auth - Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const user = db.createUser(email, password, name);
  const token = jsonwebtoken.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  const { passwordHash, ...safeUser } = user;
  res.status(201).json({ token, user: safeUser });
});

// 5. Auth - Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const hashed = db.hashPassword(password);
  if (user.passwordHash !== hashed) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jsonwebtoken.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash, ...safeUser } = user;

  res.json({ token, user: safeUser });
});

// 6. Auth - Get Current User Profile
app.get('/api/auth/me', authenticateToken, (req: any, res: Response) => {
  const user = db.getUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { passwordHash, ...safeUser } = user;
  res.json(safeUser);
});

// 7. Auth - Update Profile
app.put('/api/auth/profile', authenticateToken, (req: any, res: Response) => {
  const updated = db.updateUser(req.user.userId, req.body);
  if (!updated) {
    return res.status(400).json({ error: 'Failed to update user profile' });
  }
  res.json(updated);
});

// 8. Orders - Create Order
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const { 
      items, 
      shippingAddress, 
      shippingMethod, 
      subtotal, 
      discount, 
      promoCodeApplied, 
      shippingFee, 
      tax, 
      total, 
      paymentMethod, 
      paymentStatus, 
      upiRefNumber, 
      cashfreeOrderId, 
      cashfreePaymentId, 
      paidAt, 
      userId,
      customer_name,
      customerName,
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      zipCode
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    const resolvedShippingAddress = (shippingAddress && typeof shippingAddress === 'object') ? shippingAddress : {
      fullName: customer_name || customerName || name || 'Customer',
      email: email || 'customer@veyro.com',
      phone: phone || '',
      address: address || '',
      city: city || 'Mumbai',
      state: state || 'Maharashtra',
      zipCode: pincode || zipCode || '400001',
      country: 'India'
    };

    const calculatedSubtotal = Number(subtotal ?? items.reduce((acc: number, it: any) => acc + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0));
    const calculatedTotal = Number(total ?? (calculatedSubtotal - (Number(discount) || 0) + (Number(shippingFee) || 0) + (Number(tax) || 0)));

    const order = db.createOrder({
      id: req.body.id,
      userId,
      items,
      shippingAddress: resolvedShippingAddress,
      shippingMethod: shippingMethod || 'standard',
      subtotal: calculatedSubtotal,
      discount: Number(discount) || 0,
      promoCodeApplied,
      shippingFee: Number(shippingFee) || 0,
      tax: Number(tax) || 0,
      total: calculatedTotal,
      paymentMethod: paymentMethod || 'card',
      paymentStatus: paymentStatus || (paymentMethod === 'UPI' ? 'PENDING_VERIFICATION' : 'Paid')
    });

    if (upiRefNumber) (order as any).upiRefNumber = upiRefNumber;
    if (cashfreeOrderId) (order as any).cashfreeOrderId = cashfreeOrderId;
    if (cashfreePaymentId) (order as any).cashfreePaymentId = cashfreePaymentId;
    if (paidAt) (order as any).paidAt = paidAt;

    console.log(`[API Orders] Creating order ${order.id} for customer: ${resolvedShippingAddress.fullName} (${resolvedShippingAddress.phone || 'no phone'})`);
    
    // Save to Supabase database (both orders and order_items tables)
    const supaRes = await saveOrderToSupabase(order);
    if (!supaRes.success) {
      console.warn('[API Orders] Supabase order insertion notice:', supaRes.error);
    } else {
      console.log(`[API Orders] Order ${order.id} successfully saved to Supabase orders & order_items tables.`);
    }

    res.status(201).json({
      ...order,
      supabaseSynced: supaRes.success
    });
  } catch (err) {
    console.error('[API Orders] Failed to place order:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// 8.1 Cashfree Payment - Create Order Proxy Endpoint
app.post('/api/create-payment-order', async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      orderAmount,
      customerName,
      customerEmail,
      customerPhone,
      customerId
    } = req.body;

    if (!orderId || !orderAmount || !customerEmail) {
      return res.status(400).json({ error: 'orderId, orderAmount, customerEmail are required' });
    }

    const appId = process.env.CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID || '';
    const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.CASHFREE_CLIENT_SECRET || '';
    const envMode = (process.env.CASHFREE_ENV || 'SANDBOX').toUpperCase();
    const isProd = envMode === 'PRODUCTION';

    if (!appId || !secretKey || appId.startsWith('MY_') || appId === 'your_cashfree_app_id') {
      return res.json({
        success: true,
        simulated: true,
        order_id: orderId,
        payment_session_id: `session_sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        order_status: 'ACTIVE',
        environment: 'SANDBOX',
        message: 'Cashfree test mode order created.'
      });
    }

    const https = await import('https');
    const cashfreePayload = {
      order_id: String(orderId),
      order_amount: parseFloat(Number(orderAmount).toFixed(2)),
      order_currency: 'INR',
      customer_details: {
        customer_id: String(customerId || customerEmail.split('@')[0] || 'cust_' + Date.now()).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 45),
        customer_name: customerName || 'Customer',
        customer_email: customerEmail,
        customer_phone: String(customerPhone || '9876543210').replace(/\D/g, '').slice(-10).padStart(10, '9')
      },
      order_meta: {
        payment_methods: 'cc,dc,upi,netbanking,paylater'
      },
      order_note: `VEYRO Streetwear Order #${orderId}`
    };

    const postData = JSON.stringify(cashfreePayload);
    const options = {
      hostname: isProd ? 'api.cashfree.com' : 'sandbox.cashfree.com',
      port: 443,
      path: '/pg/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': process.env.CASHFREE_API_VERSION || '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const cfRes: any = await new Promise((resolve, reject) => {
      const cfReq = https.request(options, (resp) => {
        let raw = '';
        resp.on('data', (d) => { raw += d; });
        resp.on('end', () => {
          try {
            resolve({ statusCode: resp.statusCode, body: JSON.parse(raw) });
          } catch {
            resolve({ statusCode: resp.statusCode, body: { raw } });
          }
        });
      });
      cfReq.on('error', reject);
      cfReq.write(postData);
      cfReq.end();
    });

    if (cfRes.statusCode >= 200 && cfRes.statusCode < 300) {
      return res.json({
        success: true,
        order_id: cfRes.body.order_id || orderId,
        payment_session_id: cfRes.body.payment_session_id,
        order_status: cfRes.body.order_status,
        cf_order_id: cfRes.body.cf_order_id,
        environment: isProd ? 'PRODUCTION' : 'SANDBOX'
      });
    }

    return res.status(cfRes.statusCode || 500).json({
      success: false,
      error: cfRes.body.message || 'Cashfree order creation failed'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Payment server error' });
  }
});

// 8.2 Cashfree Payment - Verify Payment Proxy Endpoint
app.get('/api/verify-payment', async (req: Request, res: Response) => {
  try {
    const orderId = req.query.orderId as string;
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const appId = process.env.CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID || '';
    const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.CASHFREE_CLIENT_SECRET || '';
    const envMode = (process.env.CASHFREE_ENV || 'SANDBOX').toUpperCase();
    const isProd = envMode === 'PRODUCTION';

    if (!appId || !secretKey || appId.startsWith('MY_') || appId === 'your_cashfree_app_id') {
      return res.json({
        success: true,
        order_id: orderId,
        order_status: 'PAID',
        payment_status: 'SUCCESS',
        cf_payment_id: `pay_sim_${Date.now()}`,
        simulated: true
      });
    }

    const https = await import('https');
    const options = {
      hostname: isProd ? 'api.cashfree.com' : 'sandbox.cashfree.com',
      port: 443,
      path: `/pg/orders/${encodeURIComponent(orderId)}/payments`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': process.env.CASHFREE_API_VERSION || '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secretKey
      }
    };

    const cfRes: any = await new Promise((resolve, reject) => {
      const cfReq = https.request(options, (resp) => {
        let raw = '';
        resp.on('data', (d) => { raw += d; });
        resp.on('end', () => {
          try {
            resolve({ statusCode: resp.statusCode, body: JSON.parse(raw) });
          } catch {
            resolve({ statusCode: resp.statusCode, body: { raw } });
          }
        });
      });
      cfReq.on('error', reject);
      cfReq.end();
    });

    if (cfRes.statusCode >= 200 && cfRes.statusCode < 300) {
      const payments = Array.isArray(cfRes.body) ? cfRes.body : [cfRes.body];
      const successful = payments.find((p: any) => p.payment_status === 'SUCCESS');
      const isPaid = !!successful;
      return res.json({
        success: isPaid,
        order_id: orderId,
        order_status: isPaid ? 'PAID' : (payments[0]?.payment_status || 'PENDING'),
        payment_status: isPaid ? 'SUCCESS' : (payments[0]?.payment_status || 'PENDING'),
        cf_payment_id: successful ? (successful.cf_payment_id || successful.payment_id) : (payments[0]?.cf_payment_id || '')
      });
    }

    return res.status(cfRes.statusCode || 500).json({
      success: false,
      error: cfRes.body.message || 'Payment verification failed'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Payment server error' });
  }
});

// 8b. Appointments - Create Booking
app.post('/api/appointments', async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, appointmentType, preferredDate, preferredTime, location, notes, userId } = req.body;

    if (!fullName || !email || !phone || !preferredDate || !preferredTime || !location) {
      return res.status(400).json({ error: 'Full name, email, phone, date, time, and location are required.' });
    }

    const appointment = db.createAppointment({
      userId,
      fullName,
      email,
      phone,
      appointmentType: appointmentType || 'Personal Fitting',
      preferredDate,
      preferredTime,
      location,
      notes: notes || ''
    });

    // Persist directly into Supabase 'appointments' table
    const supabaseResult = await saveAppointmentToSupabase(appointment);

    res.status(201).json({
      ...appointment,
      supabaseSynced: supabaseResult.success,
      supabaseProjectId: SUPABASE_PROJECT_ID
    });
  } catch (err) {
    console.error('Failed to create appointment:', err);
    res.status(500).json({ error: 'Failed to schedule appointment' });
  }
});

// 8c. Appointments - Get User / All Bookings
app.get('/api/appointments', async (req: any, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const localAppts = db.getAppointments(userId);

    // Try fetching live bookings from Supabase
    const { success, data: supabaseAppts } = await fetchAppointmentsFromSupabase(userId);

    if (success && Array.isArray(supabaseAppts) && supabaseAppts.length > 0) {
      // Map Supabase column names to Appointment interface
      const mappedSupabaseAppts = supabaseAppts.map((sa: any) => ({
        id: sa.id,
        userId: sa.user_id || sa.userId,
        fullName: sa.full_name || sa.fullName,
        email: sa.email,
        phone: sa.phone,
        appointmentType: sa.appointment_type || sa.appointmentType,
        preferredDate: sa.preferred_date || sa.preferredDate,
        preferredTime: sa.preferred_time || sa.preferredTime,
        location: sa.location,
        notes: sa.notes,
        status: sa.status || 'Confirmed',
        createdAt: sa.created_at || sa.createdAt
      }));

      // Combine & deduplicate by ID
      const apptMap = new Map();
      [...mappedSupabaseAppts, ...localAppts].forEach(item => {
        if (item && item.id) apptMap.set(item.id, item);
      });

      return res.json(Array.from(apptMap.values()));
    }

    res.json(localAppts);
  } catch (err) {
    res.json(db.getAppointments(req.query.userId as string));
  }
});

// 8d. Supabase Connection Status
app.get('/api/supabase/status', (req: Request, res: Response) => {
  res.json({
    connected: true,
    projectId: SUPABASE_PROJECT_ID,
    url: SUPABASE_URL,
    provider: 'Supabase Database',
    tables: ['appointments', 'orders', 'users']
  });
});

// 9. Orders - Get User Orders
app.get('/api/orders', (req: any, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userId = req.query.userId as string;

    if (token) {
      try {
        const decoded: any = jsonwebtoken.verify(token, JWT_SECRET);
        userId = decoded.userId || userId;
      } catch (err) {
        // Invalid token; proceed with query userId if provided
      }
    }

    if (!userId) {
      return res.json([]);
    }

    const orders = db.getOrdersByUserId(userId);
    res.json(Array.isArray(orders) ? orders : []);
  } catch (err) {
    res.json([]);
  }
});

// 10. Orders - Get Single Order
app.get('/api/orders/:id', (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

// 11. Product Reviews - Get
app.get('/api/products/:id/reviews', (req: Request, res: Response) => {
  const reviews = db.getReviewsByProduct(req.params.id);
  res.json(reviews);
});

// 12. Product Reviews - Create
app.post('/api/products/:id/reviews', (req: Request, res: Response) => {
  const { userName, rating, comment, title, fitFeedback } = req.body;
  if (!userName || !rating || !comment || !title) {
    return res.status(400).json({ error: 'Name, rating, title, and comment are required' });
  }

  const review = db.addReview({
    productId: req.params.id,
    userName,
    rating: Number(rating),
    comment,
    title,
    verifiedPurchase: true,
    fitFeedback
  });

  res.status(201).json(review);
});

// 13. Promo Code Validation
app.post('/api/promo/validate', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  const c = (code || '').toUpperCase().trim();

  if (c === 'IDENTITY15' || c === 'IDENTITY20') {
    const pct = c === 'IDENTITY20' ? 0.20 : 0.15;
    const discount = Math.round(subtotal * pct * 100) / 100;
    return res.json({ valid: true, discount, message: `${pct * 100}% VEYRO Identity Discount Applied!`, code: c });
  }

  if (c === 'VEYRO10') {
    const discount = Math.round(subtotal * 0.10 * 100) / 100;
    return res.json({ valid: true, discount, message: '10% Welcome Discount Applied!', code: c });
  }

  if (c === 'FREESHIP') {
    return res.json({ valid: true, freeShipping: true, discount: 0, message: 'Free Express Shipping Activated!', code: c });
  }

  if (c.startsWith('VEYRO')) {
    const discount = Math.round(subtotal * 0.15 * 100) / 100;
    return res.json({ valid: true, discount, message: '15% Exclusive Subscriber Discount Applied!', code: c });
  }

  res.status(400).json({ valid: false, error: 'Invalid or expired promo code' });
});

// 14. Newsletter
app.post('/api/newsletter', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  const result = db.subscribeNewsletter(email);
  res.json({
    message: result.alreadySubscribed ? 'Welcome back! You are already subscribed.' : 'Subscribed successfully!',
    discountCode: result.discountCode
  });
});

// 15. Contact Support Message
app.post('/api/contact', (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const saved = db.saveContactMessage({ name, email, subject: subject || 'General Query', message });
  res.json({ message: 'Your message has been received by VEYRO Support. Ticket #' + saved.id });
});

// ==========================================
// ADMIN DASHBOARD API ROUTES
// ==========================================

// A. Overview Analytics & Stats
app.get('/api/admin/overview', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { data: products } = await fetchProductsFromSupabase();
    const { success: ordersSuccess, data: supaOrders, error: ordersError } = await fetchOrdersFromSupabase();
    // Only real orders from Supabase public.orders table (no mock fallback)
    const orders = (ordersSuccess && Array.isArray(supaOrders)) ? supaOrders : [];
    const { success: custSuccess, data: supaCustomers } = await fetchCustomersFromSupabase();
    const customers = (custSuccess && Array.isArray(supaCustomers)) ? supaCustomers : [];
    const appointments = db.getAppointments();

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => {
      const orderTotal = Number(o.total) || 0;
      return sum + orderTotal;
    }, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const processingQueue = orders.filter(o => {
      const st = (o.status || '').toString().trim().toLowerCase();
      return st === 'processing';
    }).length;

    const lowStockCount = (products || []).filter(p => !p.inStock || (p.stockQuantity !== undefined && p.stockQuantity < 10)).length;

    const categoryStats = (products || []).reduce((acc: Record<string, number>, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      processingQueue,
      totalProducts: (products || []).length,
      totalCustomers: customers.length || db.getAllUsers().length,
      totalAppointments: appointments.length,
      lowStockCount,
      recentOrders: orders.slice(0, 6),
      categoryStats,
      supabaseProjectId: SUPABASE_PROJECT_ID
    });
  } catch (err) {
    console.error('Failed to generate overview metrics:', err);
    res.status(500).json({ error: 'Failed to generate overview metrics' });
  }
});

// B. Product Management - Get All from Supabase
app.get('/api/admin/products', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { success, data: products, error } = await fetchProductsFromSupabase();
    if (!success) {
      return res.status(500).json({ error: error || 'Failed to fetch products from Supabase' });
    }
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin products from Supabase' });
  }
});

// B2. Manual Product Seed Route
app.post('/api/admin/seed-products', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const result = await seedProductsToSupabase();
    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to seed products into Supabase' });
    }
    res.json({ message: 'Veyro products seeded successfully into Supabase', count: result.data.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to seed products' });
  }
});

// C. Product Management - Create
app.post('/api/admin/products', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { name, price, originalPrice, category, description, gsm, fit, images, colors, sizes, inStock, isNewArrival, isLimitedDrop, isTrending } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const newProd = db.addProduct({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category,
      description: description || 'Premium VEYRO Streetwear garment crafted with heavy Cotton French Terry.',
      fabricDetails: '100% Combed Heavyweight Cotton French Terry (Preshrunk)',
      gsm: Number(gsm) || 280,
      fit: fit || 'Oversized Boxy Fit',
      images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'],
      colors: Array.isArray(colors) && colors.length > 0 ? colors : [{ name: 'Obsidian Black', hex: '#121212' }],
      sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'],
      inStock: inStock !== false,
      isNewArrival: Boolean(isNewArrival),
      isLimitedDrop: Boolean(isLimitedDrop),
      isTrending: Boolean(isTrending),
      tags: [category, 'Streetwear', 'VEYRO 2026']
    });

    // Sync product to Supabase Database
    const supabaseRes = await saveProductToSupabase(newProd);

    res.status(201).json({
      ...newProd,
      supabaseSynced: supabaseRes.success
    });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// D. Product Management - Update
app.put('/api/admin/products/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const updated = db.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Sync updated product to Supabase
    await saveProductToSupabase(updated);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// E. Product Management - Delete
app.delete('/api/admin/products/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const deleted = db.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found or already deleted' });
    }

    // Remove from Supabase
    await deleteProductFromSupabase(req.params.id);

    res.json({ message: 'Product successfully deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// F. Order Management - Get All Orders from Supabase
app.get('/api/admin/orders', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { success, data: orders, error } = await fetchOrdersFromSupabase();
    if (!success) {
      console.warn('[API Admin Orders] Supabase fetch error:', error);
      return res.json([]);
    }
    res.json(orders || []);
  } catch (err) {
    console.error('[API Admin Orders] Failed to fetch orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// G. Order Management - Update Status & Shipping Tracking
app.put('/api/admin/orders/:id/status', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status, trackingNumber, paymentStatus } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Order status is required' });
    }

    const updatedOrder = db.updateOrderStatus(req.params.id, status, trackingNumber);

    // Sync order status, tracking_number and payment_status to Supabase
    const supabaseRes = await updateOrderStatusInSupabase(req.params.id, status, trackingNumber, paymentStatus);

    res.json({
      ...(updatedOrder || { id: req.params.id, status, trackingNumber, paymentStatus }),
      supabaseSynced: supabaseRes.success
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// G2. Product Stock Management - Update Stock Quantity
app.put('/api/admin/products/:id/stock', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { stockQuantity } = req.body;
    if (stockQuantity === undefined || isNaN(Number(stockQuantity))) {
      return res.status(400).json({ error: 'Valid stockQuantity is required' });
    }

    const qty = Number(stockQuantity);
    const updatedProd = db.updateProduct(req.params.id, {
      stockQuantity: qty,
      inStock: qty > 0
    });

    const supabaseRes = await updateProductStockInSupabase(req.params.id, qty);

    res.json({
      ...(updatedProd || { id: req.params.id, stockQuantity: qty, inStock: qty > 0 }),
      supabaseSynced: supabaseRes.success
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product stock' });
  }
});

// H. Customer Management - Get All Customers from Supabase profiles
app.get('/api/admin/customers', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { success, data: customers, error } = await fetchCustomersFromSupabase();
    
    if (success && customers && customers.length > 0) {
      return res.json(customers);
    }

    // Fallback to local DB if profiles table is empty or error
    const users = db.getAllUsers();
    const orders = db.getAllOrders();

    const usersWithStats = users.map(user => {
      const userOrders = orders.filter(o => o.userId === user.id || o.shippingAddress?.email?.toLowerCase() === user.email.toLowerCase());
      const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      return {
        ...user,
        orderCount: userOrders.length,
        totalSpent,
        lastOrderDate: userOrders[0]?.createdAt || null
      };
    });

    res.json(usersWithStats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer list' });
  }
});

// I. Customer Management - Update Role
app.put('/api/admin/customers/:id/role', authenticateAdmin, (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ error: 'Role must be user or admin' });
    }

    const updatedUser = db.updateUserRole(req.params.id, role);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// J. Supabase RLS SQL Generator
app.get('/api/admin/supabase/rls-sql', authenticateAdmin, (req: Request, res: Response) => {
  res.json({
    rlsSql: GENERATE_SUPABASE_RLS_SQL,
    projectId: SUPABASE_PROJECT_ID,
    supabaseUrl: SUPABASE_URL
  });
});

// Explicit JSON 404 Handler for /api/* to prevent falling through to Vite HTML middleware
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

export { app };

// --- VITE / STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VEYRO] Server operational on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.NETLIFY && !process.env.LAMBDA_TASK_ROOT) {
  startServer();
}
