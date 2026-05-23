import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Globe, LogOut, LayoutDashboard, User, Search, Store } from 'lucide-react';
import { useLanguage, LANGUAGES, LanguageCode } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface HeaderProps {
  onSearchChange?: (val: string) => void;
  onNavigateTo: (page: string) => void;
  currentPage: string;
  onSelectCategory?: (val: string) => void;
  selectedCategory?: string;
}

export default function Header({
  onSearchChange,
  onNavigateTo,
  currentPage,
  onSelectCategory,
  selectedCategory
}: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const { cart, wishlist } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategoriesList(data.categories || []))
      .catch(err => console.error(err));
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLangChange = (code: LanguageCode) => {
    setLanguage(code);
    setLangDropdownOpen(false);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-100 bg-white/85 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo brand */}
          <div 
            onClick={() => onNavigateTo('home')} 
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-sm transition-transform active:scale-95">
              <Store className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-800">
              OmniBazaar
            </span>
          </div>

          {/* Quick links & shop categories */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <button type="button" 
              onClick={() => onNavigateTo('home')} 
              className={`hover:text-violet-600 transition-colors cursor-pointer ${currentPage === 'home' ? 'text-violet-600 font-semibold' : ''}`}
            >
              {t('nav.home')}
            </button>
            <button type="button" 
              onClick={() => onNavigateTo('shop')} 
              className={`hover:text-violet-600 transition-colors cursor-pointer ${currentPage === 'shop' && (selectedCategory === 'all' || !selectedCategory) ? 'text-violet-600 font-semibold' : ''}`}
            >
              {t('nav.shop')}
            </button>

            {/* Hoverable Categories Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setCategoriesDropdownOpen(true)}
              onMouseLeave={() => setCategoriesDropdownOpen(false)}
            >
              <button type="button" 
                onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                className={`hover:text-violet-600 transition-colors cursor-pointer flex items-center gap-1 py-2 ${currentPage === 'shop' && selectedCategory !== 'all' && selectedCategory ? 'text-violet-600 font-semibold' : ''}`}
              >
                Categories
                <span className="text-[10px] pl-0.5 opacity-60">▼</span>
              </button>

              {categoriesDropdownOpen && (
                <div className="absolute top-full left-0 w-44 bg-white border border-gray-150 rounded-xl shadow-lg py-1.5 z-20">
                  <button type="button"
                    onClick={() => {
                      if (onSelectCategory) {
                        onSelectCategory('all');
                      }
                      onNavigateTo('shop');
                      setCategoriesDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-violet-50 hover:text-violet-750 transition-colors cursor-pointer"
                  >
                    All Catalog
                  </button>
                  {categoriesList.map((cat) => (
                    <button type="button"
                      key={cat.id}
                      onClick={() => {
                        if (onSelectCategory) {
                          onSelectCategory(cat.slug);
                        }
                        onNavigateTo('shop');
                        setCategoriesDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-violet-50 hover:text-violet-750 transition-colors cursor-pointer capitalize"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Search bar */}
          <div className="flex-1 max-w-md relative hidden sm:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('nav.search')}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="w-full bg-gray-50/80 hover:bg-gray-50 focus:bg-white rounded-xl pl-10 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 border border-gray-250/70 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 outline-none transition-all"
            />
          </div>

          {/* Actions panel */}
          <div className="flex items-center gap-3.5">
            
            {/* Lang switcher */}
            <div className="relative">
              <button type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="cursor-pointer p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-1 text-xs font-semibold"
                aria-label="Toggle Language"
              >
                <Globe className="h-4.5 w-4.5" />
                <span className="uppercase">{language}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-200">
                  {LANGUAGES.map((lang) => (
                    <button type="button"
                      key={lang.code}
                      onClick={() => handleLangChange(lang.code)}
                      className={`cursor-pointer w-full text-left px-4 py-2 text-xs font-semibold hover:bg-violet-50 transition-colors flex items-center justify-between ${language === lang.code ? 'text-violet-700 bg-violet-25/50' : 'text-gray-700'}`}
                    >
                      <span>{lang.nativeName}</span>
                      <span className="text-[10px] text-gray-400 font-medium">({lang.name})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Wishlist */}
            <button type="button"
              onClick={() => onNavigateTo('wishlist')}
              className={`relative p-2 rounded-xl text-gray-500 hover:text-red-500 hover:bg-gray-100 transition-colors cursor-pointer ${currentPage === 'wishlist' ? 'bg-gray-100 text-red-500' : ''}`}
              title={t('nav.wishlist')}
            >
              <Heart className={`h-4.5 w-4.5 ${wishlist.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart icon */}
            <button type="button"
              onClick={() => onNavigateTo('cart')}
              className="relative p-2 rounded-xl text-gray-500 hover:text-violet-600 hover:bg-gray-100 transition-colors cursor-pointer"
              title={t('nav.cart')}
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-violet-600 text-[9px] font-bold text-white rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile actions dropdown */}
            {user ? (
              <div className="relative">
                <button type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="cursor-pointer h-9 w-9 bg-linear-to-tr from-violet-600 to-indigo-800 text-white font-bold text-sm rounded-full flex items-center justify-center border border-white hover:scale-105 active:scale-95 transition-all shadow-sm"
                  aria-label="User profile dropdown"
                >
                  {getInitials(user.name)}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-200">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-xs text-gray-400 capitalize bg-neutral-100 font-mono inline-block px-2 py-0.5 rounded-full font-bold mb-1">
                        {user.role}
                      </p>
                      <h4 className="font-semibold text-sm text-gray-800 tracking-tight leading-4">{user.name}</h4>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                    </div>

                    <button type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        onNavigateTo('dashboard');
                      }}
                      className="cursor-pointer w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 text-gray-500" />
                      {t('nav.dashboard')}
                    </button>

                    <button type="button"
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                        onNavigateTo('home');
                      }}
                      className="cursor-pointer w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-gray-100 mt-1"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button type="button"
                onClick={() => onNavigateTo('auth')}
                className="cursor-pointer bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <User className="h-4 w-4" />
                {t('nav.login')}
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
