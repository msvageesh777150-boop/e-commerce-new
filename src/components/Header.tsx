import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Heart, Globe, LogOut, LayoutDashboard, User, Search, Store, Mic, Clock, X, Trash2 } from 'lucide-react';
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

  // Smart Search States
  const [searchLocal, setSearchLocal] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<{term: string, timestamp: number}[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Auto-cleanup searches older than 30 days
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        let parsed = JSON.parse(stored);
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        parsed = parsed.filter((item: any) => now - item.timestamp < thirtyDaysMs);
        setRecentSearches(parsed);
        localStorage.setItem('recentSearches', JSON.stringify(parsed));
      }
    } catch (e) {
      console.error('Failed to parse recent searches', e);
    }
  }, []);

  // Fetch data for suggestions
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategoriesList(data.categories || []))
      .catch(err => console.error(err));

    fetch('/api/products')
      .then(res => res.json())
      .then(data => setAllProducts(data.products || []))
      .catch(err => console.error(err));
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Voice Search Web Speech API Setup
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Voice Search.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onstart = () => {
      setIsListening(true);
      setSearchDropdownOpen(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchLocal(transcript);
      if (onSearchChange) onSearchChange(transcript);
      
      if (event.results[0].isFinal) {
        finalTranscript = transcript;
        recognition.stop();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        handleSearchSubmit(finalTranscript.trim());
      }
    };

    recognition.start();
  };

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const now = Date.now();
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t.term.toLowerCase() !== term.toLowerCase());
      const updated = [{ term: term.trim(), timestamp: now }, ...filtered].slice(0, 8);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const removeRecentSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(t => t.term !== term);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSearchSubmit = (term: string) => {
    if (!term.trim()) return;
    saveRecentSearch(term);
    if (onSearchChange) onSearchChange(term);
    setSearchLocal(term);
    setSearchDropdownOpen(false);
    onNavigateTo('shop');
  };

  // Generate live suggestions
  const getSuggestions = () => {
    const term = searchLocal.toLowerCase().trim();
    if (!term) return { products: [], categories: [], brands: [] };

    const matchedProducts = allProducts.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.description.toLowerCase().includes(term)
    ).slice(0, 3);

    const matchedCategories = categoriesList.filter(c => 
      c.name.toLowerCase().includes(term)
    ).slice(0, 2);

    const allBrands = Array.from(new Set(allProducts.map(p => p.brand).filter(Boolean)));
    const matchedBrands = allBrands.filter(b => 
      b.toLowerCase().includes(term)
    ).slice(0, 2);

    return { products: matchedProducts, categories: matchedCategories, brands: matchedBrands };
  };

  const suggestions = getSuggestions();

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

          {/* Search bar with Smart Dropdown */}
          <div ref={searchContainerRef} className="flex-1 max-w-lg relative hidden sm:block">
            <div className={`relative flex items-center w-full bg-gray-50 hover:bg-white focus-within:bg-white border rounded-xl transition-all ${searchDropdownOpen ? 'border-violet-500 ring-1 ring-violet-500/30 shadow-md' : 'border-gray-250/70'}`}>
              <Search className="absolute left-3.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={isListening ? "Listening..." : t('nav.search')}
                value={searchLocal}
                onFocus={() => setSearchDropdownOpen(true)}
                onChange={(e) => {
                  setSearchLocal(e.target.value);
                  setSearchDropdownOpen(true);
                  if (onSearchChange) onSearchChange(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit(searchLocal);
                  }
                }}
                className="w-full bg-transparent pl-10 pr-10 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none"
              />
              {isListening ? (
                <div className="absolute right-3.5 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
              ) : (
                <button 
                  type="button" 
                  onClick={startVoiceSearch}
                  className="absolute right-3.5 cursor-pointer text-gray-400 hover:text-violet-600 transition-colors"
                  title="Voice Search"
                >
                  <Mic className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Smart Suggestions Dropdown */}
            {searchDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-200">
                {!searchLocal.trim() ? (
                  /* Recent Searches */
                  <div className="p-2">
                    <div className="flex justify-between items-center px-3 py-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Searches</span>
                      {recentSearches.length > 0 && (
                        <button type="button" onClick={clearAllRecent} className="text-[10px] text-gray-400 hover:text-red-500 cursor-pointer font-bold">Clear All</button>
                      )}
                    </div>
                    {recentSearches.length > 0 ? (
                      recentSearches.map((item, idx) => (
                        <div key={idx} 
                          onClick={() => handleSearchSubmit(item.term)}
                          className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-xl cursor-pointer group transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-700">{item.term}</span>
                          </div>
                          <button type="button" onClick={(e) => removeRecentSearch(e, item.term)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 cursor-pointer p-1 transition-all">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-xs text-gray-400 italic font-mono">No recent searches</div>
                    )}
                  </div>
                ) : (
                  /* Live Suggestions */
                  <div className="p-2 space-y-1">
                    {suggestions.categories.length > 0 && (
                      <div className="mb-2">
                        <span className="block px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Categories</span>
                        {suggestions.categories.map((c: any) => (
                          <div key={c.id} onClick={() => {
                            if (onSelectCategory) onSelectCategory(c.slug);
                            handleSearchSubmit(c.name);
                          }} className="flex items-center gap-2 px-3 py-2 hover:bg-violet-50 rounded-xl cursor-pointer text-sm font-semibold text-gray-700 transition-colors">
                            <Search className="h-3 w-3 text-violet-400" />
                            {c.name}
                          </div>
                        ))}
                      </div>
                    )}

                    {suggestions.brands.length > 0 && (
                      <div className="mb-2">
                        <span className="block px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Brands</span>
                        {suggestions.brands.map((b: any, idx: number) => (
                          <div key={idx} onClick={() => handleSearchSubmit(b)} className="flex items-center gap-2 px-3 py-2 hover:bg-violet-50 rounded-xl cursor-pointer text-sm font-semibold text-gray-700 transition-colors">
                            <Search className="h-3 w-3 text-violet-400" />
                            {b}
                          </div>
                        ))}
                      </div>
                    )}

                    {suggestions.products.length > 0 ? (
                      <div>
                        <span className="block px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Products</span>
                        {suggestions.products.map((p: any) => (
                          <div key={p.id} onClick={() => handleSearchSubmit(p.name)} className="flex items-center gap-3 px-3 py-2 hover:bg-violet-50 rounded-xl cursor-pointer transition-colors">
                            <img src={p.images?.[0]} alt="" className="h-8 w-8 rounded object-cover border bg-white" />
                            <div>
                              <div className="text-sm font-semibold text-gray-800 leading-tight">{p.name}</div>
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">{p.brand} in {p.category}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-3 py-4 text-center text-xs text-gray-400 italic font-mono">
                        Press Enter to search for "{searchLocal}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
