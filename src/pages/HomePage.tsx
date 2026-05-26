import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { Sparkles, Loader2, Flame } from 'lucide-react';
import HeroSection from '../components/sections/HeroSection';
import ProductCard from '../components/ui/ProductCard';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

// Highly-premium interactive 3D Category Card component inspired by opendue.com
function CategoryCard({ cat, idx, onClick, imgUrl }: { cat: any; idx: number; onClick: () => void; imgUrl: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  // Smooth springs for 3D tilt interaction [stiffness: 150, damping: 18]
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 18 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1000 }}
      onClick={onClick}
      className="cursor-pointer w-full select-none"
    >
      <motion.div
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className="relative p-6 glassmorphic rounded-2xl border border-white/10 hover:border-accent/40 shadow-soft hover:shadow-[var(--shadow-accent)] flex flex-col items-center text-center space-y-4 group transition-all duration-300 transform-gpu overflow-hidden"
      >
        {/* Dynamic metallic light reflection sweep */}
        <div aria-hidden className="absolute inset-0 bg-radial-glow opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none -z-10" />

        {/* Floating gold ring spotlight backdrop */}
        <div className="relative transform-gpu group-hover:scale-105 transition-transform duration-500">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-accent/50 to-accent-soft/30 blur-sm opacity-50 group-hover:opacity-100 transition-opacity" />
          <img 
            src={imgUrl} 
            alt={cat.name} 
            className="relative h-20 w-20 rounded-full object-cover border border-white/10 shadow-[0_0_15px_rgba(204,167,81,0.25)] bg-black/40 z-10" 
          />
        </div>

        <div className="space-y-1 z-10">
          <h5 className="font-extrabold text-white text-sm sm:text-base leading-tight capitalize tracking-wide select-none group-hover:text-accent transition-colors">
            {cat.name}
          </h5>
          <p className="text-[8px] text-frost/45 font-mono uppercase tracking-[0.2em] select-none font-bold">
            Explore Exhibit
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

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
              <CategoryCard
                key={cat.id}
                cat={cat}
                idx={idx}
                imgUrl={imgUrl}
                onClick={() => {
                  if (onSelectCategory) {
                    onSelectCategory(cat.slug);
                  }
                  onNavigateTo('shop');
                }}
              />
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
