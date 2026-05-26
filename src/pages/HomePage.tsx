import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { Sparkles, Loader2, Flame } from 'lucide-react';
import HeroSection from '../components/sections/HeroSection';
import ProductCard from '../components/ui/ProductCard';
import { motion } from 'motion/react';

const getCategoryImageUrl = (slug: string) => {
  const normalized = slug.toLowerCase();
  if (normalized.includes('electronic') || normalized.includes('mobile')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80';
  }
  if (normalized.includes('fashion') || normalized.includes('apparel') || normalized.includes('clothing')) {
    return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&q=80';
  }
  if (normalized.includes('spice') || normalized.includes('herb')) {
    return 'https://images.unsplash.com/photo-1596790011558-b13c6c1eae74?w=300&q=80';
  }
  if (normalized.includes('grocery') || normalized.includes('pantry') || normalized.includes('food')) {
    return 'https://images.unsplash.com/photo-1610832958506-ee5633619144?w=300&q=80';
  }
  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80';
};

interface HomePageProps {
  onNavigateTo: (page: string) => void;
  searchQuery: string;
  onSelectProductId?: (productId: string) => void;
  onSelectCategory?: (category: string) => void;
}

export default function HomePage({ onNavigateTo, searchQuery, onSelectProductId, onSelectCategory }: HomePageProps) {
  const { t } = useLanguage();
  const { addToCart, toggleWishlist, wishlist } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchReviewsSummary();
    fetchCategories();
  }, []);

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
    <div id="homescreen" className="space-y-16 pb-16">
      
      {/* 1. Hero banner section - redone with R3F Canvas and magnetic CTA */}
      <div className="mx-4 sm:mx-6 lg:mx-8">
        <HeroSection onNavigateTo={onNavigateTo} />
      </div>

      {/* 2. Showcase category links */}
      <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-4">
        <h3 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2 border-b pb-3 border-white/10 select-none">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          {t('home.curated_categories')}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categoriesList.map((cat, idx) => {
            const imgUrl = getCategoryImageUrl(cat.slug);
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.06, type: 'spring' }}
                whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => {
                  if (onSelectCategory) {
                    onSelectCategory(cat.slug);
                  }
                  onNavigateTo('shop');
                }}
                className="cursor-pointer p-5 glassmorphic rounded-2xl hover:shadow-[0_15px_30px_rgba(99,102,241,0.15)] text-center space-y-3.5 transition-all duration-300 flex flex-col justify-center items-center border border-white/10"
              >
                <img 
                  src={imgUrl} 
                  alt={cat.name} 
                  className="h-16 w-16 rounded-full object-cover border border-white/10 shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-black/40" 
                />
                <div>
                  <h5 className="font-extrabold text-white text-sm sm:text-base leading-tight capitalize tracking-wide select-none">{cat.name}</h5>
                  <p className="text-[9px] text-frost/40 font-mono mt-1 uppercase tracking-widest select-none">{t('home.mapped_tenant')}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 3. Products Marketplace Showcase Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-4">
        <div className="flex justify-between items-center border-b pb-3 border-white/10 select-none">
          <h3 className="text-xl font-bold font-display text-white flex items-center gap-2">
            <Flame className="h-5 w-5 text-indigo-400 fill-indigo-500/10" />
            {t('home.trending_exhibits')}
          </h3>
          <span className="text-[10px] font-mono text-frost/50 uppercase tracking-widest">
            {t('home.total_exhibiting')}: {filteredProducts.length} {t('home.units')}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-24 glassmorphic rounded-2xl border border-white/10">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-cyan-400 mb-3" />
            <p className="text-xs text-frost/50 font-mono uppercase tracking-widest">{t('home.syncing')}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 glassmorphic rounded-2xl border border-white/10 text-frost/45 italic text-xs font-mono">
            {t('home.no_matching')}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {filteredProducts.map((p) => {
              const ratings = getProductRatingDetails(p.id);
              return (
                <ProductCard
                  key={p.id}
                  p={p}
                  ratings={ratings}
                  isWishlisted={isItemWishlisted(p.id)}
                  onToggleWishlist={() => toggleWishlist(p)}
                  onSelect={() => {
                    if (onSelectProductId) onSelectProductId(p.id);
                    onNavigateTo('product-detail');
                  }}
                  onAddToCart={() => addToCart(p.id, 1)}
                  addToCartLabel={t('home.add_to_cart')}
                />
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
