import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { Sparkles, ArrowRight, ShoppingCart, Heart, Star, Search, Flame, MapPin, Loader2 } from 'lucide-react';

interface HomePageProps {
  onNavigateTo: (page: string) => void;
  searchQuery: string;
  onSelectProductId?: (productId: string) => void;
}

export default function HomePage({ onNavigateTo, searchQuery, onSelectProductId }: HomePageProps) {
  const { t } = useLanguage();
  const { addToCart, toggleWishlist, wishlist } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchReviewsSummary();
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



  const fetchReviewsSummary = async () => {
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

  // Filter products by search query
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProductRatingDetails = (prodId: string) => {
    const prodReviews = reviews.filter(r => r.productId === prodId);
    if (prodReviews.length === 0) return { avg: 4.5, count: 3 }; // High default fallback
    const sum = prodReviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      avg: parseFloat((sum / prodReviews.length).toFixed(1)),
      count: prodReviews.length
    };
  };

  const isItemWishlisted = (id: string) => wishlist.some(w => w.id === id);



  return (
    <div id="homescreen" className="space-y-12 pb-16">
      
      {/* 1. Hero banner section with glowing badges and high contrast buttons */}
      <section className="relative overflow-hidden bg-linear-to-b from-violet-905 via-indigo-950 to-purple-950 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 px-6 py-10 sm:py-16 lg:px-10 shadow-2xl border border-slate-800">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero block text */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight font-display text-white leading-tight">
              Future E-Commerce<br />Built for Everyone
            </h1>
            <p className="text-slate-300 text-sm sm:text-base lg:text-lg max-w-xl leading-relaxed font-sans font-medium">
              Explore a premium multi-vendor experience powered by a persistent Supabase simulation and responsive filters.
            </p>
            <div className="flex flex-wrap gap-3.5 pt-2">
              <button type="button"
                onClick={() => onNavigateTo('shop')}
                className="cursor-pointer bg-white hover:bg-slate-100 text-slate-900 font-bold px-6 py-3 rounded-xl shadow-lg transition-all active:scale-95 text-xs sm:text-sm flex items-center gap-2"
              >
                Browse Shop Catalog
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Showcase category links */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h3 className="text-lg font-bold font-display tracking-tight text-gray-900 border-b pb-3 border-gray-100">
          {t('home.curated_categories')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigateTo('shop')}
            className="cursor-pointer p-4 bg-linear-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl hover:scale-[1.02] shadow-xs text-center space-y-2.5 transition-all"
          >
            <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80" alt="Electronics" className="h-14 w-14 rounded-full mx-auto object-cover border-2 border-violet-100 shadow-sm" />
            <div>
              <h5 className="font-bold text-gray-805 text-sm leading-tight">{t('home.electronics')}</h5>
              <p className="text-[9px] text-gray-400 font-mono mt-0.5 uppercase tracking-wider">{t('home.mapped_tenant')}</p>
            </div>
          </div>

          <div
            onClick={() => onNavigateTo('shop')}
            className="cursor-pointer p-4 bg-linear-to-br from-fuchsia-50 to-pink-50 border border-fuchsia-100 rounded-2xl hover:scale-[1.02] shadow-xs text-center space-y-2.5 transition-all"
          >
            <img src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&q=80" alt="Apparel" className="h-14 w-14 rounded-full mx-auto object-cover border-2 border-fuchsia-100 shadow-sm" />
            <div>
              <h5 className="font-bold text-gray-805 text-sm leading-tight">{t('home.fashion')}</h5>
              <p className="text-[9px] text-gray-400 font-mono mt-0.5 uppercase tracking-wider">{t('home.mapped_tenant')}</p>
            </div>
          </div>

          <div
            onClick={() => onNavigateTo('shop')}
            className="cursor-pointer p-4 bg-linear-to-br from-amber-50 to-yellow-50 border border-amber-100 rounded-2xl hover:scale-[1.02] shadow-xs text-center space-y-2.5 transition-all"
          >
            <img src="https://images.unsplash.com/photo-1596790011558-b13c6c1eae74?w=300&q=80" alt="Spices" className="h-14 w-14 rounded-full mx-auto object-cover border-2 border-amber-100 shadow-sm" />
            <div>
              <h5 className="font-bold text-gray-805 text-sm leading-tight">{t('home.herbs')}</h5>
              <p className="text-[9px] text-gray-400 font-mono mt-0.5 uppercase tracking-wider">{t('home.mapped_tenant')}</p>
            </div>
          </div>

          <div
            onClick={() => onNavigateTo('shop')}
            className="cursor-pointer p-4 bg-linear-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl hover:scale-[1.02] shadow-xs text-center space-y-2.5 transition-all"
          >
            <img src="https://images.unsplash.com/photo-1610832958506-ee5633619144?w=300&q=80" alt="Grocery" className="h-14 w-14 rounded-full mx-auto object-cover border-2 border-emerald-100 shadow-sm" />
            <div>
              <h5 className="font-bold text-gray-805 text-sm leading-tight">{t('home.grocery')}</h5>
              <p className="text-[9px] text-gray-400 font-mono mt-0.5 uppercase tracking-wider">{t('home.mapped_tenant')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Products Marketplace Showcase Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-center border-b pb-3 border-gray-150">
          <h3 className="text-lg font-bold font-display text-gray-900 flex items-center gap-1.5">
            <Flame className="h-5 w-5 text-amber-500 fill-amber-500" />
            {t('home.trending_exhibits')}
          </h3>
          <span className="text-xs font-mono text-gray-400">{t('home.total_exhibiting')}: {filteredProducts.length} {t('home.units')}</span>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-700" />
            <p className="text-xs text-gray-400 mt-2 font-mono">{t('home.syncing')}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 italic text-xs font-mono">
            {t('home.no_matching')}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {filteredProducts.map((p) => {
              const ratings = getProductRatingDetails(p.id);
              return (
                <div key={p.id} className="bg-white border border-gray-205 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative">
                  
                  {/* Wishlist ribbon selector */}
                  <button type="button"
                    onClick={() => toggleWishlist(p)}
                    className="cursor-pointer absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center border hover:scale-110 active:scale-95 transition-all shadow-xs z-10"
                  >
                    <Heart className={`h-4 w-4 ${isItemWishlisted(p.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </button>

                  <div className="p-3.5 space-y-3">
                    <div
                      onClick={() => {
                        if (onSelectProductId) onSelectProductId(p.id);
                        onNavigateTo('product-detail');
                      }}
                      className="aspect-square bg-gray-50 rounded-xl relative overflow-hidden cursor-pointer"
                    >
                      <img
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'}
                        alt={p.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-350"
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center text-[10px] uppercase font-mono text-gray-400">
                        <span>{p.category}</span>
                        <span>{p.brand}</span>
                      </div>
                      <h4
                        onClick={() => {
                          if (onSelectProductId) onSelectProductId(p.id);
                          onNavigateTo('product-detail');
                        }}
                        className="font-bold text-gray-800 text-sm truncate leading-tight mt-1 cursor-pointer hover:text-indigo-600"
                      >
                        {p.name}
                      </h4>
                      <p className="text-gray-500 text-[11px] line-clamp-1 italic mt-1">"{p.description}"</p>

                      <div className="flex gap-1 items-center mt-2">
                        <div className="flex text-amber-400 gap-0.5">
                          {Array.from({ length: Math.floor(ratings.avg) }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-450 text-amber-450" />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-gray-700 font-mono">({ratings.count})</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 border-t border-gray-150 bg-gray-50/50 flex justify-between items-center text-xs">
                    <span className="font-black text-gray-850 font-mono text-sm">₹{p.price.toLocaleString('en-IN')}</span>
                    <button type="button"
                      onClick={() => addToCart(p.id, 1)}
                      className="cursor-pointer bg-violet-605 group-hover:bg-violet-750 text-white font-bold py-1.5 px-3 rounded-lg border outline-none shadow-xs text-[10px] flex items-center gap-1"
                    >
                      <ShoppingCart className="h-3 w-3" />
                      {t('home.add_to_cart')}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
