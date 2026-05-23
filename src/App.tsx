import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';

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

import { Loader2 } from 'lucide-react';

function AppContent() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();

  const [currentPage, setCurrentPage] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center font-mono text-xs">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-violet-600 mb-2" />
          <p className="text-gray-500 font-bold">Loading OmniBazaar...</p>
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
  if (user.role === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50">
        {renderDashboardByRole()}
      </div>
    );
  }

  // Delivery partners see only their dashboard
  if (user.role === 'delivery') {
    return (
      <div className="min-h-screen bg-slate-50">
        {renderDashboardByRole()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between">
      
      {/* Top Banner Navigation Header */}
      <Header
        currentPage={currentPage}
        onSearchChange={setSearchQuery}
        onNavigateTo={handleNavigateTo}
        onSelectCategory={setSelectedCategory}
        selectedCategory={selectedCategory}
      />

      {/* Main Pages router body */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigateTo={handleNavigateTo}
            searchQuery={searchQuery}
            onSelectProductId={setSelectedProductId}
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

      {/* Structured Footer */}
      <footer className="bg-slate-900 text-slate-400 mt-12 py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs font-mono">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6 mb-6">
            <div>
              <h5 className="font-bold text-white text-sm font-display tracking-tight">OmniBazaar</h5>
              <p className="mt-1">India's Premium Multi-Vendor Marketplace</p>
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => handleNavigateTo('home')} className="cursor-pointer hover:text-white transition-colors">Home</button>
              <button onClick={() => handleNavigateTo('shop')} className="cursor-pointer hover:text-white transition-colors">Shop</button>
              <button onClick={() => handleNavigateTo('cart')} className="cursor-pointer hover:text-white transition-colors">Cart</button>
              <button onClick={() => handleNavigateTo('dashboard')} className="cursor-pointer hover:text-white transition-colors">Dashboard</button>
            </div>
          </div>

          <p className="text-center">
            © 2026 OmniBazaar · Secure Multi-Vendor Marketplace · All Rights Reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
