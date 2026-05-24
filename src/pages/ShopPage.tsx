import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { Search, Heart, ShoppingCart, SlidersHorizontal, Check, Eye, Loader2, Star, ArrowRight } from 'lucide-react';

interface ShopPageProps {
  onNavigateTo: (page: string) => void;
  searchQuery: string;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onSelectProductId: (productId: string) => void;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mb-6 pb-2 border-b border-gray-100">
        <button type="button" onClick={() => onNavigateTo('home')} className="cursor-pointer hover:text-indigo-650 transition-colors">Home</button>
        <span>/</span>
        <span className="text-gray-600 font-bold">Browse Shop</span>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0 bg-white border border-gray-200/80 p-5 rounded-2xl shadow-xs h-fit space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold font-display text-gray-800 text-sm flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
              Catalog Filters
            </h3>
            <button type="button" onClick={clearFilters} className="text-[10px] text-gray-400 hover:text-red-500 font-bold tracking-wider uppercase">Clear All</button>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold text-gray-700 tracking-wider">Keyword Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search titles, brands..."
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border rounded-xl outline-none focus:border-violet-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold text-gray-700 tracking-wider">Filter Category</label>
            <div className="space-y-1">
              <button type="button"
                onClick={() => { setCategoryFilter('all'); onSelectCategory('all'); }}
                className={`cursor-pointer w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${categoryFilter === 'all' ? 'bg-violet-50 text-violet-700 border-l-2 border-violet-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span>All Categories</span>
                {categoryFilter === 'all' && <Check className="h-3 w-3 text-violet-600 shrink-0" />}
              </button>

              {categoriesList.map((cat) => {
                const isSelected = categoryFilter.toLowerCase() === cat.slug.toLowerCase();
                return (
                  <button type="button"
                    key={cat.id}
                    onClick={() => { setCategoryFilter(cat.slug); onSelectCategory(cat.slug); }}
                    className={`cursor-pointer w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${isSelected ? 'bg-violet-50 text-violet-700 border-l-2 border-violet-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span className="capitalize">{cat.name}</span>
                    {isSelected && <Check className="h-3 w-3 text-violet-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold text-gray-700 tracking-wider">Filter Brand</label>
            <select
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              className="w-full text-xs border rounded-xl p-2 outline-none focus:border-violet-500 font-mono"
            >
              {brands.map((b) => (
                <option key={b} value={b}>{b === 'all' ? 'All Brands' : b}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] uppercase font-bold text-gray-700 tracking-wider">Price Range</label>
              <span className="text-[10px] font-bold font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                ₹{priceMax.toLocaleString('en-IN')} max
              </span>
            </div>
            <input
              type="range" min="0" max="150000" step="1000"
              value={priceMax} onChange={e => setPriceMax(Number(e.target.value))}
              className="w-full cursor-pointer accent-violet-605 h-1 bg-gray-200 rounded-lg appearance-none"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100">
            <input
              type="checkbox" id="instock" checked={inStockOnly}
              onChange={e => setInStockOnly(e.target.checked)}
              className="h-4 w-4 accent-violet-605 cursor-pointer"
            />
            <label htmlFor="instock" className="text-xs font-semibold text-gray-700 select-none cursor-pointer">In Stock Only</label>
          </div>
        </aside>

        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-gray-800">
                Found <span className="text-violet-650 text-base">{sortedProducts.length}</span> matching products
              </h2>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">Multi-vendor marketplace catalog</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-gray-400">Sort By:</span>
              <select
                value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="text-xs border rounded-xl px-2 py-1.5 outline-none focus:border-violet-500 font-mono bg-slate-50 font-bold"
              >
                <option value="featured">Featured Picks</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-150">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-700 mb-2" />
              <p className="text-xs text-gray-400 font-mono">Loading products...</p>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-150 text-gray-400 italic text-xs font-mono space-y-3">
              <p>No Matching Products Found</p>
              <button type="button" onClick={clearFilters} className="cursor-pointer bg-violet-600 hover:bg-violet-750 text-white font-bold px-4 py-2 rounded-xl text-xs">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((p) => {
                const ratings = getProductRatingDetails(p.id);
                return (
                  <div key={p.id} className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative">
                    <button type="button"
                      onClick={() => toggleWishlist(p)}
                      className="cursor-pointer absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center border hover:scale-110 active:scale-95 transition-all shadow-xs z-20"
                    >
                      <Heart className={`h-4.5 w-4.5 ${isItemWishlisted(p.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                    </button>

                    <div className="p-4 space-y-3.5 relative">
                      <div className="aspect-square bg-gray-50 rounded-xl relative overflow-hidden">
                        <img
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'}
                          alt={p.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-350"
                        />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex items-center justify-center z-10">
                          <button type="button"
                            onClick={() => handleInspectProduct(p.id)}
                            className="bg-white hover:bg-slate-50 text-gray-800 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Eye className="h-4 w-4 text-violet-600" />
                            View Product
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-[10px] uppercase font-mono text-gray-400">
                          <span>{p.category}</span>
                          <span>{p.brand}</span>
                        </div>
                        <h4 onClick={() => handleInspectProduct(p.id)} className="font-bold text-gray-800 hover:text-indigo-650 text-sm truncate leading-tight mt-1 cursor-pointer">
                          {p.name}
                        </h4>
                        <div className="flex gap-1 items-center mt-2.5">
                          <div className="flex text-amber-400 gap-0.5">
                            {Array.from({ length: Math.floor(ratings.avg) }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-amber-450 text-amber-450" />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-gray-700 font-mono">({ratings.count})</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t border-gray-150 bg-gray-50/50 flex justify-between items-center text-xs">
                      <span className="font-black text-gray-855 font-mono text-sm">₹{p.price.toLocaleString('en-IN')}</span>
                      <button type="button"
                        onClick={() => addToCart(p.id, 1)}
                        className="cursor-pointer bg-violet-605 hover:bg-violet-750 text-white font-bold py-1.5 px-3 rounded-lg border outline-none shadow-xs text-[10px] flex items-center gap-1"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
