import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { ToastProvider } from './context/ToastContext';

import { AnnouncementBar } from './components/layout/AnnouncementBar';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

import { CartDrawer } from './components/common/CartDrawer';
import { AuthModal } from './components/common/AuthModal';
import { QuickSearchModal } from './components/common/QuickSearchModal';
import { ToastContainer } from './components/common/ToastContainer';

import { HomeView } from './components/views/HomeView';
import { ShopView } from './components/views/ShopView';
import { ProductDetailView } from './components/views/ProductDetailView';
import { CartView } from './components/views/CartView';
import { CheckoutView } from './components/views/CheckoutView';
import { OrderConfirmationView } from './components/views/OrderConfirmationView';
import { AboutView } from './components/views/AboutView';
import { ContactView } from './components/views/ContactView';
import { AccountView } from './components/views/AccountView';
import { BookingAppointmentView } from './components/views/BookingAppointmentView';
import { AdminDashboardView } from './components/views/AdminDashboardView';

const AppContent: React.FC = () => {
  const { page } = useNavigation();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#050505] text-neutral-900 dark:text-white flex flex-col font-sans selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-200">
      <AnnouncementBar />
      <Navbar onOpenSearch={() => {}} />

      <main className="flex-1">
        {page === 'home' && <HomeView />}
        {page === 'shop' && <ShopView />}
        {(page === 'product' || page === 'product-detail') && <ProductDetailView />}
        {page === 'cart' && <CartView />}
        {page === 'checkout' && <CheckoutView />}
        {page === 'order-confirmation' && <OrderConfirmationView />}
        {page === 'about' && <AboutView />}
        {page === 'contact' && <ContactView />}
        {page === 'booking' && <BookingAppointmentView />}
        {page === 'account' && <AccountView />}
        {page === 'admin' && <AdminDashboardView />}
      </main>

      <Footer />

      {/* Global Drawers & Modals */}
      <CartDrawer />
      <AuthModal />
      <QuickSearchModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <NavigationProvider>
              <AppContent />
            </NavigationProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

