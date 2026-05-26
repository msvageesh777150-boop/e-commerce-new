import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Heart, Globe, LogOut, LayoutDashboard, User, Search, Store, Mic, Clock, X, Menu } from 'lucide-react';
import { useLanguage, LANGUAGES, LanguageCode } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';

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

  // Scroll and Mobile menu states
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on page shift
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPage]);

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

  // Drawer Stagger Variants
  const drawerListVariants = {
    open: {
      transition: { staggerChildren: 0.07, delayChildren: 0.15 }
    },
    closed: {
      transition: { staggerChildren: 0.05, staggerDirection: -1 }
    }
  };

  const drawerItemVariants = {
    open: {
      y: 0,
      opacity: 1,
      transition: { y: { stiffness: 1000, velocity: -100 } }
    },
    closed: {
      y: 30,
      opacity: 0,
      transition: { y: { stiffness: 1000 } }
    }
  };

  const navLinks = [
    { page: 'home', label: t('nav.home') },
    { page: 'shop', label: t('nav.shop') }
  ];

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-[100] px-4 pt-4 md:px-8 md:pt-6"
    >
      <nav
        className={`mx-auto flex max-w-7xl items-center justify-between rounded-full px-5 py-3 transition-all duration-500 md:px-7 ${
          scrolled ? 'glass-strong shadow-elevated' : 'glass'
        }`}
      >
        {/* Brand Logo with Glow */}
        <div 
          onClick={() => onNavigateTo('home')} 
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div className="relative h-7 w-7">
            <div className="absolute inset-0 rounded-full bg-aurora blur-md opacity-70" />
            <div className="relative h-7 w-7 rounded-full bg-aurora flex items-center justify-center text-white">
              <Store className="h-4.5 w-4.5" />
            </div>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            OmniBazaar
          </span>
        </div>

        {/* Navigation Links — Satisfying capsule layout */}
        <ul className="hidden items-center gap-1.5 md:flex">
          {navLinks.map((l) => {
            const active = currentPage === l.page && (!selectedCategory || selectedCategory === 'all');
            return (
              <li key={l.page}>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectCategory) onSelectCategory('all');
                    onNavigateTo(l.page);
                  }}
                  className="relative rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/5"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className={`relative ${active ? 'text-foreground font-semibold' : ''}`}>
                    {l.label}
                  </span>
                </button>
              </li>
            );
          })}

          {/* Curated Categories Dropdown */}
          <li 
            className="relative"
            onMouseEnter={() => setCategoriesDropdownOpen(true)}
            onMouseLeave={() => setCategoriesDropdownOpen(false)}
          >
            <button 
              type="button"
              onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
              className={`relative rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer flex items-center gap-1`}
            >
              {currentPage === 'shop' && selectedCategory !== 'all' && selectedCategory && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-white/5"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className={`relative flex items-center gap-1 ${currentPage === 'shop' && selectedCategory !== 'all' && selectedCategory ? 'text-foreground font-semibold' : ''}`}>
                Categories
                <span className="text-[8px] opacity-60">▼</span>
              </span>
            </button>

            <AnimatePresence>
              {categoriesDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-2 w-48 glass-strong rounded-2xl shadow-elevated py-2 z-[200] border border-white/10"
                >
                  <button 
                    type="button"
                    onClick={() => {
                      if (onSelectCategory) onSelectCategory('all');
                      onNavigateTo('shop');
                      setCategoriesDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-frost/95 hover:bg-white/5 hover:text-primary transition-colors cursor-pointer"
                  >
                    All Catalog
                  </button>
                  {categoriesList.map((cat) => (
                    <button 
                      type="button"
                      key={cat.id}
                      onClick={() => {
                        if (onSelectCategory) onSelectCategory(cat.slug);
                        onNavigateTo('shop');
                        setCategoriesDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-frost/85 hover:bg-white/5 hover:text-primary transition-colors cursor-pointer capitalize"
                    >
                      {cat.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        </ul>

        {/* Search Bar (Desktop) */}
        <div ref={searchContainerRef} className="flex-1 max-w-sm lg:max-w-md relative hidden sm:block mx-4">
          <div className={`relative flex items-center w-full bg-white/5 hover:bg-white/10 border rounded-full transition-all duration-300 ${
            searchDropdownOpen 
              ? 'border-primary/50 shadow-glow ring-1 ring-primary/30 bg-black/40' 
              : 'border-white/8'
          }`}>
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
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
              className="w-full bg-transparent pl-10 pr-10 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none font-medium"
            />
            {isListening ? (
              <div className="absolute right-3.5 h-3.5 w-3.5 bg-primary rounded-full animate-ping" />
            ) : (
              <button 
                type="button" 
                onClick={startVoiceSearch}
                className="absolute right-3.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                title="Voice Search"
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Smart Search Suggestions Dropdown */}
          <AnimatePresence>
            {searchDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 w-full mt-2 glass-strong rounded-3xl shadow-elevated overflow-hidden z-[200] border border-white/10"
              >
                {!searchLocal.trim() ? (
                  <div className="p-3">
                    <div className="flex justify-between items-center px-3 py-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent Searches</span>
                      {recentSearches.length > 0 && (
                        <button type="button" onClick={clearAllRecent} className="text-[10px] text-primary hover:text-red-400 cursor-pointer font-bold uppercase tracking-wider">Clear All</button>
                      )}
                    </div>
                    {recentSearches.length > 0 ? (
                      recentSearches.map((item, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => handleSearchSubmit(item.term)}
                          className="flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer group transition-colors animate-fade-in"
                        >
                          <div className="flex items-center gap-2.5">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <span className="text-xs font-semibold text-foreground/85">{item.term}</span>
                          </div>
                          <button type="button" onClick={(e) => removeRecentSearch(e, item.term)} className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-red-400 cursor-pointer p-1 transition-all">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground italic font-mono">No recent searches</div>
                    )}
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {suggestions.categories.length > 0 && (
                      <div className="mb-2">
                        <span className="block px-3 py-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Categories</span>
                        {suggestions.categories.map((c: any) => (
                          <div 
                            key={c.id} 
                            onClick={() => {
                              if (onSelectCategory) onSelectCategory(c.slug);
                              handleSearchSubmit(c.name);
                            }} 
                            className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer text-xs font-bold text-foreground transition-colors"
                          >
                            <Search className="h-3.5 w-3.5 text-primary" />
                            {c.name}
                          </div>
                        ))}
                      </div>
                    )}

                    {suggestions.brands.length > 0 && (
                      <div className="mb-2">
                        <span className="block px-3 py-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Brands</span>
                        {suggestions.brands.map((b: any, idx: number) => (
                          <div 
                            key={idx} 
                            onClick={() => handleSearchSubmit(b)} 
                            className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer text-xs font-bold text-foreground transition-colors"
                          >
                            <Search className="h-3.5 w-3.5 text-primary" />
                            {b}
                          </div>
                        ))}
                      </div>
                    )}

                    {suggestions.products.length > 0 ? (
                      <div>
                        <span className="block px-3 py-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Products</span>
                        {suggestions.products.map((p: any) => (
                          <div 
                            key={p.id} 
                            onClick={() => handleSearchSubmit(p.name)} 
                            className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
                          >
                            <img src={p.images?.[0]} alt="" className="h-8 w-8 rounded-lg object-cover border border-white/8 bg-black" />
                            <div>
                              <div className="text-xs font-bold text-foreground leading-tight">{p.name}</div>
                              <div className="text-[9px] text-muted-foreground font-mono mt-0.5">{p.brand} in {p.category}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground italic font-mono">
                        Press Enter to search for "{searchLocal}"
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Actions Panel */}
        <div className="flex items-center gap-2 md:gap-3">
          
          {/* Lang Selector */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="cursor-pointer h-10 w-10 flex items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
              aria-label="Toggle Language"
            >
              <Globe className="h-4.5 w-4.5 text-primary" />
            </button>

            <AnimatePresence>
              {langDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 mt-2 w-44 glass-strong rounded-2xl shadow-elevated py-1.5 z-[200] border border-white/10"
                >
                  {LANGUAGES.map((lang) => (
                    <button 
                      type="button"
                      key={lang.code}
                      onClick={() => handleLangChange(lang.code)}
                      className={`cursor-pointer w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-white/5 transition-colors flex items-center justify-between ${
                        language === lang.code ? 'text-primary bg-white/5' : 'text-foreground/85'
                      }`}
                    >
                      <span>{lang.nativeName}</span>
                      <span className="text-[9px] text-muted-foreground font-mono">({lang.code})</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Wishlist Icon */}
          <button 
            type="button"
            onClick={() => onNavigateTo('wishlist')}
            className={`relative h-10 w-10 flex items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/5 hover:text-foreground cursor-pointer ${
              currentPage === 'wishlist' ? 'bg-white/5 text-foreground' : ''
            }`}
            title={t('nav.wishlist')}
          >
            <Heart className={`h-4.5 w-4.5 ${wishlist.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Icon — Premium capsule styling */}
          <button 
            type="button"
            onClick={() => onNavigateTo('cart')}
            className="relative flex h-10 items-center gap-2 rounded-full bg-white/5 px-4 text-sm transition hover:bg-white/10 text-foreground cursor-pointer"
            title={t('nav.cart')}
          >
            <ShoppingBag className="h-4 w-4 text-primary" />
            {cartCount > 0 ? (
              <motion.span 
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="font-mono text-xs font-bold text-primary"
              >
                {cartCount}
              </motion.span>
            ) : (
              <span className="font-mono text-xs text-muted-foreground">0</span>
            )}
          </button>

          {/* Profile Dropdown */}
          {user ? (
            <div className="relative">
              <button 
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="cursor-pointer h-9 w-9 bg-aurora text-white font-bold text-xs rounded-full flex items-center justify-center border border-white/20 hover:scale-105 active:scale-95 transition-all shadow-soft"
                aria-label="User profile dropdown"
              >
                {getInitials(user.name)}
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-3 w-56 glass-strong rounded-3xl shadow-elevated py-2 z-[200] border border-white/10"
                  >
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-[9px] text-primary uppercase font-mono tracking-widest bg-primary/10 inline-block px-2.5 py-0.5 rounded-full font-bold mb-1.5">
                        {user.role}
                      </p>
                      <h4 className="font-bold text-sm text-foreground tracking-tight leading-4">{user.name}</h4>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user.email}</p>
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        onNavigateTo('dashboard');
                      }}
                      className="cursor-pointer w-full text-left px-4 py-2.5 text-xs font-bold text-foreground/80 hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      {t('nav.dashboard')}
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                        onNavigateTo('home');
                      }}
                      className="cursor-pointer w-full text-left px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/15 flex items-center gap-2.5 transition-colors border-t border-white/5 mt-1"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('nav.logout')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => onNavigateTo('auth')}
              className="cursor-pointer h-10 w-10 flex items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
            >
              <User className="h-4.5 w-4.5" />
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden h-10 w-10 flex items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/5 hover:text-foreground cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>

        </div>
      </nav>

      {/* Mobile Menu Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="glass-strong mx-auto mt-2 max-w-7xl rounded-3xl p-5 md:hidden border border-white/10 shadow-elevated"
          >
            {/* Search Input for Mobile */}
            <div className="relative flex items-center w-full bg-white/5 border border-white/8 rounded-full mb-6">
              <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('nav.search')}
                value={searchLocal}
                onChange={(e) => {
                  setSearchLocal(e.target.value);
                  if (onSearchChange) onSearchChange(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit(searchLocal);
                    setMobileMenuOpen(false);
                  }
                }}
                className="w-full bg-transparent pl-10 pr-10 py-3 text-sm text-foreground placeholder-muted-foreground outline-none font-medium"
              />
            </div>

            {/* Mobile Drawer Links */}
            <motion.div 
              variants={drawerListVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="flex flex-col gap-2 font-display font-medium text-lg text-foreground"
            >
              {navLinks.map((l) => (
                <motion.button
                  key={l.page}
                  variants={drawerItemVariants}
                  onClick={() => {
                    if (onSelectCategory) onSelectCategory('all');
                    onNavigateTo(l.page);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left rounded-2xl px-4 py-3 hover:bg-white/5 transition capitalize ${
                    currentPage === l.page ? 'text-primary bg-white/5 font-semibold' : ''
                  }`}
                >
                  {l.label}
                </motion.button>
              ))}

              {/* Mobile Drawer Categories Segment */}
              <motion.div variants={drawerItemVariants} className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/5">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono font-bold px-4 mb-1">Curated Categories</span>
                {categoriesList.slice(0, 5).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (onSelectCategory) onSelectCategory(cat.slug);
                      onNavigateTo('shop');
                      setMobileMenuOpen(false);
                    }}
                    className={`text-left text-sm py-2 px-4 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground capitalize ${
                      selectedCategory === cat.slug ? 'text-primary bg-white/5 font-semibold' : ''
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
