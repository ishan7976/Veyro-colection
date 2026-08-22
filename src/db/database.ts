import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { INITIAL_PRODUCTS, INITIAL_REVIEWS } from '../data/products';
import { Product, ProductReview, User, Order, ShippingAddress, Appointment } from '../types';

interface DBUser extends User {
  passwordHash: string;
}

interface NewsletterSubscriber {
  id: string;
  email: string;
  discountCode: string;
  createdAt: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

interface DBData {
  products: Product[];
  reviews: ProductReview[];
  users: DBUser[];
  orders: Order[];
  newsletters: NewsletterSubscriber[];
  contactMessages: ContactMessage[];
  appointments: Appointment[];
}

const DB_DIR = path.join(process.cwd(), '.data');
const DB_PATH = path.join(DB_DIR, 'db.json');

class DatabaseEngine {
  private data: DBData = {
    products: [],
    reviews: [],
    users: [],
    orders: [],
    newsletters: [],
    contactMessages: [],
    appointments: []
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure products exist if empty
        if (!this.data.products || this.data.products.length === 0) {
          this.data.products = INITIAL_PRODUCTS;
        }
        if (!this.data.reviews || this.data.reviews.length === 0) {
          this.data.reviews = INITIAL_REVIEWS;
        }
        // Ensure admin users exist
        if (!this.data.users.find(u => u.email.toLowerCase() === 'admin@veyro.com')) {
          this.data.users.push({
            id: 'usr_admin_1',
            email: 'admin@veyro.com',
            name: 'VEYRO Lead Admin',
            role: 'admin',
            loyaltyPoints: 9999,
            addresses: [],
            passwordHash: this.hashPassword('admin123'),
            createdAt: new Date().toISOString()
          });
          this.save();
        }
        if (!this.data.users.find(u => u.email.toLowerCase() === 'ishansharma3305@gmail.com')) {
          this.data.users.push({
            id: 'usr_admin_ishan',
            email: 'ishansharma3305@gmail.com',
            name: 'Ishan Sharma (Admin)',
            role: 'admin',
            loyaltyPoints: 9999,
            addresses: [],
            passwordHash: this.hashPassword('admin123'),
            createdAt: new Date().toISOString()
          });
          this.save();
        }
      } else {
        // Seed default initial data
        const adminUser: DBUser = {
          id: 'usr_admin_1',
          email: 'admin@veyro.com',
          name: 'VEYRO Lead Admin',
          role: 'admin',
          loyaltyPoints: 9999,
          addresses: [],
          passwordHash: this.hashPassword('admin123'),
          createdAt: new Date().toISOString()
        };

        this.data = {
          products: INITIAL_PRODUCTS,
          reviews: INITIAL_REVIEWS,
          users: [adminUser],
          orders: [],
          newsletters: [],
          contactMessages: [],
          appointments: []
        };
        this.save();
      }
    } catch (err) {
      console.error('Database initialization error:', err);
      this.data.products = INITIAL_PRODUCTS;
      this.data.reviews = INITIAL_REVIEWS;
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  public hashPassword(pwd: string): string {
    return crypto.createHash('sha256').update(pwd + 'VEYRO_SALT_KEY').digest('hex');
  }

  // --- Products ---
  public getProducts(filters?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sizes?: string[];
    sortBy?: string;
    limitedOnly?: boolean;
  }): Product[] {
    let list = [...this.data.products];

    if (filters?.category && filters.category !== 'All') {
      list = list.filter(p => p.category.toLowerCase() === filters.category!.toLowerCase());
    }

    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }

    if (filters?.minPrice !== undefined) {
      list = list.filter(p => p.price >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined) {
      list = list.filter(p => p.price <= filters.maxPrice!);
    }

    if (filters?.sizes && filters.sizes.length > 0) {
      list = list.filter(p => filters.sizes!.some(s => p.sizes.includes(s as any)));
    }

    if (filters?.limitedOnly) {
      list = list.filter(p => p.isLimitedDrop);
    }

    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price-asc':
          list.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          list.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          list.sort((a, b) => b.rating - a.rating);
          break;
        case 'popular':
          list.sort((a, b) => b.reviewCount - a.reviewCount);
          break;
        case 'newest':
        default:
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }
    }

    return list;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id || p.slug === id);
  }

  // --- Users & Auth ---
  public getUserByEmail(email: string): DBUser | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): DBUser | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(email: string, passwordPlain: string, name: string): DBUser {
    const newUser: DBUser = {
      id: 'usr_' + Date.now().toString(36),
      email: email.toLowerCase(),
      name,
      role: 'user',
      loyaltyPoints: 100, // Welcome points
      addresses: [],
      savedWishlistIds: [],
      passwordHash: this.hashPassword(passwordPlain),
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateUser(userId: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === userId);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    const { passwordHash, ...safeUser } = this.data.users[idx];
    return safeUser;
  }

  // --- Orders ---
  public createOrder(orderData: Partial<Order> & Omit<Order, 'id' | 'createdAt' | 'trackingNumber' | 'status' | 'estimatedDelivery'>): Order {
    const orderId = orderData.id || ('VYR-' + Math.floor(100000 + Math.random() * 900000));
    const tracking = orderData.trackingNumber || ('VY-' + Math.floor(100000000 + Math.random() * 900000000) + '-US');
    
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (orderData.shippingMethod === 'express' ? 3 : 6));

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      status: (orderData.status as any) || 'Processing',
      trackingNumber: tracking,
      createdAt: orderData.createdAt || new Date().toISOString(),
      estimatedDelivery: orderData.estimatedDelivery || deliveryDate.toISOString().split('T')[0]
    };

    this.data.orders.unshift(newOrder);

    // Award loyalty points to user
    if (orderData.userId) {
      const u = this.getUserById(orderData.userId);
      if (u) {
        const earned = Math.floor(orderData.total * 2);
        u.loyaltyPoints = (u.loyaltyPoints || 0) + earned;
      }
    }

    this.save();
    return newOrder;
  }

  public getOrdersByUserId(userId: string): Order[] {
    return this.data.orders.filter(o => o.userId === userId);
  }

  public getOrderById(orderId: string): Order | undefined {
    return this.data.orders.find(o => o.id === orderId);
  }

  // --- Reviews ---
  public getReviewsByProduct(productId: string): ProductReview[] {
    return this.data.reviews.filter(r => r.productId === productId);
  }

  public addReview(review: Omit<ProductReview, 'id' | 'createdAt'>): ProductReview {
    const newRev: ProductReview = {
      ...review,
      id: 'rev_' + Date.now().toString(36),
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.data.reviews.unshift(newRev);

    // Recalculate rating on product
    const productRevs = this.getReviewsByProduct(review.productId);
    const avg = productRevs.reduce((acc, curr) => acc + curr.rating, 0) / productRevs.length;
    const p = this.getProductById(review.productId);
    if (p) {
      p.rating = Math.round(avg * 10) / 10;
      p.reviewCount = productRevs.length;
    }

    this.save();
    return newRev;
  }

  // --- Newsletters ---
  public subscribeNewsletter(email: string): { discountCode: string; alreadySubscribed: boolean } {
    const existing = this.data.newsletters.find(n => n.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { discountCode: existing.discountCode, alreadySubscribed: true };
    }
    const code = 'VEYRO' + Math.floor(10 + Math.random() * 90);
    this.data.newsletters.push({
      id: 'nl_' + Date.now().toString(36),
      email: email.toLowerCase(),
      discountCode: code,
      createdAt: new Date().toISOString()
    });
    this.save();
    return { discountCode: code, alreadySubscribed: false };
  }

  // --- Contact Messages ---
  public saveContactMessage(msg: { name: string; email: string; subject: string; message: string }): ContactMessage {
    const newMsg: ContactMessage = {
      ...msg,
      id: 'msg_' + Date.now().toString(36),
      createdAt: new Date().toISOString()
    };
    this.data.contactMessages.push(newMsg);
    this.save();
    return newMsg;
  }

  // --- Appointments / Bookings ---
  public createAppointment(apptData: Omit<Appointment, 'id' | 'createdAt' | 'status'>): Appointment {
    if (!this.data.appointments) {
      this.data.appointments = [];
    }
    const appt: Appointment = {
      ...apptData,
      id: 'APT-' + Math.floor(100000 + Math.random() * 900000),
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    };
    this.data.appointments.push(appt);
    this.save();
    return appt;
  }

  public getAppointments(userId?: string): Appointment[] {
    if (!this.data.appointments) return [];
    if (userId) {
      return this.data.appointments.filter(a => a.userId === userId || a.email?.toLowerCase() === userId.toLowerCase());
    }
    return this.data.appointments;
  }

  // --- Admin CRUD Operations ---
  public addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'rating' | 'reviewCount'>): Product {
    const id = 'veyro-' + Math.floor(100 + Math.random() * 900);
    const slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newProd: Product = {
      ...productData,
      id,
      slug: slug || id,
      rating: 5.0,
      reviewCount: 1,
      createdAt: new Date().toISOString()
    };
    this.data.products.unshift(newProd);
    this.save();
    return newProd;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | undefined {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.data.products[idx] = { ...this.data.products[idx], ...updates };
    this.save();
    return this.data.products[idx];
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    if (this.data.products.length < initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getAllOrders(): Order[] {
    return this.data.orders;
  }

  public updateOrderStatus(orderId: string, status: Order['status'], trackingNumber?: string): Order | undefined {
    const idx = this.data.orders.findIndex(o => o.id === orderId);
    if (idx === -1) return undefined;
    this.data.orders[idx].status = status;
    if (trackingNumber) {
      this.data.orders[idx].trackingNumber = trackingNumber;
    }
    this.save();
    return this.data.orders[idx];
  }

  public getAllUsers(): User[] {
    return this.data.users.map(({ passwordHash, ...safeUser }) => safeUser);
  }

  public updateUserRole(userId: string, role: 'user' | 'admin'): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === userId);
    if (idx === -1) return undefined;
    this.data.users[idx].role = role;
    this.save();
    const { passwordHash, ...safeUser } = this.data.users[idx];
    return safeUser;
  }
}

export const db = new DatabaseEngine();
