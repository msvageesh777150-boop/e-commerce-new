import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import SmoothScroll from './components/ui/SmoothScroll';
import CustomCursor from './components/ui/CustomCursor';
import AntigravityField from './components/ui/AntigravityField';
import ErrorBoundary from './components/ui/ErrorBoundary';


import Header from './components/Header';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import AuthPage from './pages/AuthPage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import WishlistPage from './pages/WishlistPage';

import DashboardCustomer from './components/DashboardCustomer';
import DashboardVendor from './components/DashboardVendor';
import DashboardAdmin from './components/DashboardAdmin';
import DashboardDelivery from './components/DashboardDelivery';
import AiChatbot from './components/AiChatbot';
import CustomerCare from './components/CustomerCare';

import { Loader2 } from 'lucide-react';

function AppContent() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();

  const [currentPage, setCurrentPage] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [hasInitializedRole, setHasInitializedRole] = useState(false);

  React.useEffect(() => {
    if (!loading && user && !hasInitializedRole) {
      if (['admin', 'vendor', 'delivery'].includes(user.role)) {
        setCurrentPage('dashboard');
      }
      setHasInitializedRole(true);
    }
  }, [loading, user, hasInitializedRole]);

  React.useEffect(() => {
    const handleAINavigation = (e: Event) => {
      const customEvent = e as CustomEvent;
      setSelectedProductId(customEvent.detail);
      setCurrentPage('product-detail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('NAVIGATE_TO_PRODUCT', handleAINavigation);
    return () => window.removeEventListener('NAVIGATE_TO_PRODUCT', handleAINavigation);
  }, []);

  const handleNavigateTo = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (role: string) => {
    if (role === 'admin') {
      setCurrentPage('dashboard');
    } else if (role === 'vendor') {
      setCurrentPage('dashboard');
    } else if (role === 'delivery') {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('home');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center select-none text-frost">
        <div className="text-center font-mono text-xs">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-cyan-400 mb-3" />
          <p className="text-frost/65 font-bold uppercase tracking-widest">Warping OmniBazaar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthPage 
        onSuccess={handleAuthSuccess} 
        onNavigateHome={() => {}}
      />
    );
  }

  const renderDashboardByRole = () => {
    switch (user.role) {
      case 'admin':
        return <DashboardAdmin onNavigateTo={handleNavigateTo} />;
      case 'vendor':
        return <DashboardVendor onNavigateTo={handleNavigateTo} />;
      case 'delivery':
        return <DashboardDelivery onNavigateTo={handleNavigateTo} />;
      default:
        return <DashboardCustomer onNavigateTo={handleNavigateTo} />;
    }
  };

  // Admin sees only the dashboard — no header/footer
  if (user.role === 'admin' && currentPage === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50">
        {renderDashboardByRole()}
      </div>
    );
  }

  // Delivery partners see only their dashboard
  if (user.role === 'delivery' && currentPage === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50">
        {renderDashboardByRole()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between relative z-10 overflow-hidden grain">
      
      {/* Ambient gold-editorial glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-radial-glow opacity-20" />
        <div className="absolute -left-40 top-1/4 h-[35rem] w-[35rem] rounded-full bg-[var(--accent-soft)] opacity-30 blur-3xl" />
        <div className="absolute right-0 top-2/3 h-[25rem] w-[25rem] rounded-full bg-[var(--accent)] opacity-15 blur-3xl" />
      </div>

      {/* Top Banner Navigation Header */}
      <Header
        currentPage={currentPage}
        onSearchChange={setSearchQuery}
        onNavigateTo={handleNavigateTo}
        onSelectCategory={setSelectedCategory}
        selectedCategory={selectedCategory}
      />

      {/* Main Pages router body */}
      <main className="flex-1 pt-28 md:pt-32">
        {currentPage === 'home' && (
          <HomePage
            onNavigateTo={handleNavigateTo}
            searchQuery={searchQuery}
            onSelectProductId={setSelectedProductId}
            onSelectCategory={setSelectedCategory}
          />
        )}

        {currentPage === 'shop' && (
          <ShopPage
            onNavigateTo={handleNavigateTo}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onSelectProductId={setSelectedProductId}
          />
        )}

        {currentPage === 'product-detail' && (
          <ProductDetailPage
            productId={selectedProductId}
            onNavigateTo={handleNavigateTo}
          />
        )}

        {currentPage === 'cart' && (
          <CartPage onNavigateTo={handleNavigateTo} />
        )}

        {currentPage === 'wishlist' && (
          <WishlistPage onNavigateTo={handleNavigateTo} />
        )}

        {currentPage === 'auth' && (
          <AuthPage onSuccess={handleAuthSuccess} onNavigateHome={() => handleNavigateTo('home')} />
        )}

        {currentPage === 'dashboard' && renderDashboardByRole()}
      </main>

      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-4 items-end pointer-events-none">
        <div className="pointer-events-auto relative">
          <CustomerCare />
        </div>
        <div className="pointer-events-auto relative">
          <AiChatbot />
        </div>
      </div>

      {/* Structured Footer */}
      <footer className="bg-black/60 text-frost/50 mt-12 py-10 border-t border-white/10 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs font-mono">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/10 pb-6 mb-6">
            <div>
              <h5 className="font-bold text-white text-sm font-display tracking-wide uppercase">OmniBazaar</h5>
              <p className="mt-1 text-frost/45">Premium Zero-Gravity Multi-Vendor Marketplace</p>
            </div>
            
            <div className="flex gap-6 font-bold text-frost/70">
              <button onClick={() => handleNavigateTo('home')} className="cursor-pointer hover:text-white hover:text-cyan-400 transition-colors uppercase tracking-wider">Home</button>
              <button onClick={() => handleNavigateTo('shop')} className="cursor-pointer hover:text-white hover:text-cyan-400 transition-colors uppercase tracking-wider">Shop</button>
              <button onClick={() => handleNavigateTo('cart')} className="cursor-pointer hover:text-white hover:text-cyan-400 transition-colors uppercase tracking-wider">Cart</button>
              <button onClick={() => handleNavigateTo('dashboard')} className="cursor-pointer hover:text-white hover:text-cyan-400 transition-colors uppercase tracking-wider">Console</button>
            </div>
          </div>

          <p className="text-center text-frost/30 tracking-widest font-bold uppercase text-[9px]">
            © 2026 OmniBazaar · Secure zero-gravity multitenant system · All Rights Reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <SmoothScroll>
              <CustomCursor />
              <AntigravityField />
              <AppContent />
            </SmoothScroll>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
