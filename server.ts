import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jsonwebtoken from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/database';
import { 
  saveAppointmentToSupabase, 
  fetchAppointmentsFromSupabase, 
  saveOrderToSupabase,
  saveProductToSupabase,
  deleteProductFromSupabase,
  updateOrderStatusInSupabase,
  GENERATE_SUPABASE_RLS_SQL,
  SUPABASE_PROJECT_ID,
  SUPABASE_URL
} from './src/lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'veyro_streetwear_jwt_secret_key_2026';
const PORT = 3000;

const app = express();

app.use(express.json());

// Auth middleware helper
const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded: any = jsonwebtoken.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Admin Auth Middleware
const authenticateAdmin = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Admin access token required' });
  }

  try {
    const decoded: any = jsonwebtoken.verify(token, JWT_SECRET);
    const user = db.getUserById(decoded.userId) || (decoded.email ? db.getUserByEmail(decoded.email) : undefined);
    
    const cleanDecodedEmail = (decoded.email || '').toLowerCase().trim();
    const isAdmin = user?.role === 'admin' || cleanDecodedEmail === 'ishansharma3305@gmail.com' || cleanDecodedEmail === 'admin@veyro.com';

    if (!isAdmin) {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }

    req.user = user || { id: decoded.userId || 'usr_admin', email: decoded.email, role: 'admin' };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token' });
  }
};

// --- API ROUTES ---

// 1. Get Products list with filters
app.get('/api/products', (req: Request, res: Response) => {
  try {
    const { category, search, minPrice, maxPrice, sizes, sortBy, limitedOnly } = req.query;

    const parsedSizes = sizes ? (Array.isArray(sizes) ? sizes : (sizes as string).split(',')) : undefined;

    const products = db.getProducts({
      category: category as string,
      search: search as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      sizes: parsedSizes as string[],
      sortBy: sortBy as string,
      limitedOnly: limitedOnly === 'true'
    });

    res.json({ products, total: products.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// 2. Get Single Product
app.get('/api/products/:id', (req: Request, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// 3. Get Categories Summary
app.get('/api/categories', (req: Request, res: Response) => {
  const allProducts = db.getProducts();
  const categories = [
    'Oversized T-Shirts',
    'Graphic T-Shirts',
    'Hoodies',
    'Limited Edition Drops'
  ].map(catName => ({
    name: catName,
    count: allProducts.filter(p => p.category === catName).length
  }));

  res.json(categories);
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
    const { items, shippingAddress, shippingMethod, subtotal, discount, promoCodeApplied, shippingFee, tax, total, paymentMethod, userId } = req.body;

    if (!items || items.length === 0 || !shippingAddress) {
      return res.status(400).json({ error: 'Order items and shipping address are required' });
    }

    const order = db.createOrder({
      userId,
      items,
      shippingAddress,
      shippingMethod: shippingMethod || 'standard',
      subtotal,
      discount: discount || 0,
      promoCodeApplied,
      shippingFee: shippingFee || 0,
      tax: tax || 0,
      total,
      paymentMethod: paymentMethod || 'card'
    });

    // Save to Supabase database asynchronously
    saveOrderToSupabase(order).catch(err => console.warn('Supabase order sync warning:', err));

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to place order' });
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
app.get('/api/admin/overview', authenticateAdmin, (req: Request, res: Response) => {
  try {
    const products = db.getProducts();
    const orders = db.getAllOrders();
    const users = db.getAllUsers();
    const appointments = db.getAppointments();

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const lowStockCount = products.filter(p => !p.inStock).length;

    const categoryStats = products.reduce((acc: Record<string, number>, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      totalCustomers: users.length,
      totalAppointments: appointments.length,
      lowStockCount,
      recentOrders: orders.slice(0, 6),
      categoryStats,
      supabaseProjectId: SUPABASE_PROJECT_ID
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate overview metrics' });
  }
});

// B. Product Management - Get All
app.get('/api/admin/products', authenticateAdmin, (req: Request, res: Response) => {
  try {
    const products = db.getProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
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

// F. Order Management - Get All Orders
app.get('/api/admin/orders', authenticateAdmin, (req: Request, res: Response) => {
  try {
    const orders = db.getAllOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// G. Order Management - Update Status
app.put('/api/admin/orders/:id/status', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status, trackingNumber } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Order status is required' });
    }

    const updatedOrder = db.updateOrderStatus(req.params.id, status, trackingNumber);
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Sync order status change to Supabase
    await updateOrderStatusInSupabase(req.params.id, status);

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// H. Customer Management - Get All Users
app.get('/api/admin/customers', authenticateAdmin, (req: Request, res: Response) => {
  try {
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
