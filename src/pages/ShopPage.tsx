import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { Search, SlidersHorizontal, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProductCard from '../components/ui/ProductCard';

interface ShopPageProps {
  onNavigateTo: (page: string) => void;
  searchQuery: string;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onSelectProductId: (productId: string) => void;
}

// Shimmer Skeleton matching the ProductCard shape precisely
function ShimmerSkeleton() {
  return (
    <div className="glassmorphic rounded-2xl p-4 border border-white/10 w-full flex flex-col justify-between animate-pulse select-none">
      <div className="space-y-4">
        <div className="aspect-square w-full bg-white/5 rounded-xl border border-white/5" />
        <div className="space-y-2.5">
          <div className="flex justify-between">
            <div className="h-3 w-12 bg-white/5 rounded" />
            <div className="h-3 w-12 bg-white/5 rounded" />
          </div>
          <div className="h-4 w-3/4 bg-white/10 rounded" />
          <div className="h-3 w-5/6 bg-white/5 rounded italic" />
          <div className="h-3 w-16 bg-white/5 rounded mt-2" />
        </div>
      </div>
      <div className="h-8 w-full bg-white/10 rounded-lg mt-4 border border-white/5" />
    </div>
  );
}

export default function ShopPage({
  onNavigateTo,
  searchQuery,
  selectedCategory,
  onSelectCategory,
  onSelectProductId
}: ShopPageProps) {
  const { t } = useLanguage();
  const { addToCart, toggleWishlist, wishlist } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  const [localSearch, setLocalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(selectedCategory || 'all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [priceMax, setPriceMax] = useState(150000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    if (selectedCategory) setCategoryFilter(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    fetchProducts();
    fetchReviews();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategoriesList(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getProductRatingDetails = (prodId: string) => {
    const prodReviews = reviews.filter(r => r.productId === prodId);
    if (prodReviews.length === 0) return { avg: 4.5, count: 3 };
    const sum = prodReviews.reduce((acc, r) => acc + r.rating, 0);
    return { avg: parseFloat((sum / prodReviews.length).toFixed(1)), count: prodReviews.length };
  };

  const isItemWishlisted = (id: string) => wishlist.some(w => w.id === id);

  const brands = ['all', ...Array.from(new Set(products.map(p => p.brand).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const query = localSearch || searchQuery;
    const term = query.toLowerCase().trim();
    const matchesSearch =
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term);
    const matchesCategory = categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesBrand = brandFilter === 'all' || p.brand.toLowerCase() === brandFilter.toLowerCase();
    const matchesPrice = p.price <= priceMax;
    const matchesStock = !inStockOnly || p.stock > 0;
    return matchesSearch && matchesCategory && matchesBrand && matchesPrice && matchesStock;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return Number(a.price || 0) - Number(b.price || 0);
    if (sortBy === 'price-high') return Number(b.price || 0) - Number(a.price || 0);
    if (sortBy === 'rating') {
      const rA = getProductRatingDetails(a.id).avg;
      const rB = getProductRatingDetails(b.id).avg;
      return rB - rA;
    }
    return 0;
  });

  const handleInspectProduct = (id: string) => {
    onSelectProductId(id);
    onNavigateTo('product-detail');
  };

  const clearFilters = () => {
    setLocalSearch('');
    setCategoryFilter('all');
    onSelectCategory('all');
    setBrandFilter('all');
    setPriceMax(150000);
    setInStockOnly(false);
    setSortBy('featured');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none">
      
      {/* Breadcrumb - Neon indicator */}
      <div className="flex items-center gap-2.5 text-xs text-frost/40 font-mono mb-6 pb-3 border-b border-white/10 select-none">
        <button type="button" onClick={() => onNavigateTo('home')} className="cursor-pointer hover:text-cyan-400 transition-colors">Home</button>
        <span>/</span>
        <span className="text-frost font-bold">Browse Catalog</span>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* sidebar Filters panel - Glass Card */}
        <aside className="w-full md:w-64 shrink-0 glassmorphic p-5 rounded-2xl h-fit space-y-6 border border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold font-display text-white text-sm flex items-center gap-2">
              <SlidersHorizontal className="h-4.5 w-4.5 text-cyan-400" />
              Catalog Filters
            </h3>
            <button 
              type="button" 
              onClick={clearFilters} 
              className="text-[10px] text-frost/45 hover:text-red-400 transition-colors font-mono font-bold tracking-wider uppercase"
            >
              Clear All
            </button>
          </div>

          {/* Keyword search input */}
          <div className="space-y-2">
            <label className="block text-[9px] uppercase font-bold text-frost/50 tracking-widest font-mono">Keyword Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-frost/40" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-black/30 border border-white/10 hover:border-white/20 focus:border-cyan-500/50 rounded-xl text-frost placeholder-frost/30 outline-none transition-colors font-mono font-medium"
              />
            </div>
          </div>

          {/* Categories Pills - Aurora active indicator */}
          <div className="space-y-2.5">
            <label className="block text-[9px] uppercase font-bold text-frost/50 tracking-widest font-mono">Filter Category</label>
            <div className="space-y-1.5">
              <button type="button"
                onClick={() => { setCategoryFilter('all'); onSelectCategory('all'); }}
                className={`cursor-pointer w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  categoryFilter === 'all' 
                    ? 'bg-indigo-500/15 text-cyan-400 border-l-4 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                    : 'text-frost/65 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>All Categories</span>
                {categoryFilter === 'all' && <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
              </button>

              {categoriesList.map((cat) => {
                const isSelected = categoryFilter.toLowerCase() === cat.slug.toLowerCase();
                return (
                  <button type="button"
                    key={cat.id}
                    onClick={() => { setCategoryFilter(cat.slug); onSelectCategory(cat.slug); }}
                    className={`cursor-pointer w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all capitalize ${
                      isSelected 
                        ? 'bg-indigo-500/15 text-cyan-400 border-l-4 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                        : 'text-frost/65 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand select */}
          <div className="space-y-2">
            <label className="block text-[9px] uppercase font-bold text-frost/50 tracking-widest font-mono">Filter Brand</label>
            <select
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              className="w-full text-xs bg-black/40 border border-white/10 hover:border-white/20 focus:border-cyan-500/50 rounded-xl p-2 outline-none transition-colors text-frost font-mono font-bold cursor-pointer"
            >
              {brands.map((b) => (
                <option key={b} value={b} className="bg-[#020408] text-frost py-2">
                  {b === 'all' ? 'All Brands' : b}
                </option>
              ))}
            </select>
          </div>

          {/* Price slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center select-none">
              <label className="block text-[9px] uppercase font-bold text-frost/50 tracking-widest font-mono">Price Range</label>
              <span className="text-[10px] font-bold font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/15">
                ₹{priceMax.toLocaleString('en-IN')} max
              </span>
            </div>
            <input
              type="range" min="0" max="150000" step="1000"
              value={priceMax} onChange={e => setPriceMax(Number(e.target.value))}
              className="w-full cursor-pointer accent-cyan-400 h-1 bg-white/10 rounded-lg appearance-none"
            />
          </div>

          {/* Checkbox triggers */}
          <div className="flex items-center gap-2.5 pt-3.5 border-t border-white/10">
            <input
              type="checkbox" id="instock" checked={inStockOnly}
              onChange={e => setInStockOnly(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-white/20 bg-transparent text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-indigo-500"
            />
            <label htmlFor="instock" className="text-xs font-bold text-frost/85 select-none cursor-pointer hover:text-cyan-400 transition-colors">
              In Stock Only
            </label>
          </div>
        </aside>

        {/* Results layout */}
        <div className="flex-1 space-y-6">
          
          {/* Header metrics bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glassmorphic p-4 rounded-2xl border border-white/10">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide select-none">
                Found <span className="text-cyan-400 text-base font-extrabold font-mono">{sortedProducts.length}</span> matching products
              </h2>
              <p className="text-[9px] text-frost/45 font-mono uppercase tracking-widest mt-0.5">Zero Gravity Multi-Vendor Marketplace</p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[9px] uppercase font-bold text-frost/50 tracking-widest font-mono">Sort By:</span>
              <select
                value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="text-xs bg-black/45 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-cyan-500/50 text-frost font-mono font-bold cursor-pointer"
              >
                <option value="featured" className="bg-[#020408] text-frost">Featured Picks</option>
                <option value="price-low" className="bg-[#020408] text-frost">Price: Low to High</option>
                <option value="price-high" className="bg-[#020408] text-frost">Price: High to Low</option>
                <option value="rating" className="bg-[#020408] text-frost">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Grid display layout */}
          {loading ? (
            // Shimmer Loading States (6 grid shapes)
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ShimmerSkeleton key={i} />
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            // No matches panel
            <div className="text-center py-24 glassmorphic rounded-2xl border border-white/10 text-frost/40 italic text-xs font-mono space-y-4">
              <p>No Matching Products Found in Deep Space</p>
              <button 
                type="button" 
                onClick={clearFilters} 
                className="cursor-pointer bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs active:scale-95 transition-all shadow-md select-none border border-white/10"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            // Kinetic transition grid of items using AnimatePresence
            <motion.div 
              layout
              className="grid grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {sortedProducts.map((p) => {
                  const ratings = getProductRatingDetails(p.id);
                  return (
                    <motion.div
                      layout
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    >
                      <ProductCard
                        p={p}
                        ratings={ratings}
                        isWishlisted={isItemWishlisted(p.id)}
                        onToggleWishlist={() => toggleWishlist(p)}
                        onSelect={() => handleInspectProduct(p.id)}
                        onAddToCart={() => addToCart(p.id, 1)}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
