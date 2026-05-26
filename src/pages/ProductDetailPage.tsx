import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, ShoppingBag, Star, Shield, RefreshCw, Truck, 
  Loader2, Heart, X, Plus, Minus, ArrowRight, ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';

interface ProductDetailPageProps {
  productId: string;
  onNavigateTo: (page: string) => void;
}

export default function ProductDetailPage({ productId, onNavigateTo }: ProductDetailPageProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { cart, addToCart, updateCartQuantity, removeFromCart, toggleWishlist, wishlist } = useCart();

  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'reviews'>('desc');

  const [reviews, setReviews] = useState<any[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Cart Drawer state
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll hooks for Parallax effect on product image
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  // Transform y positions from -20px to 20px
  const imageY = useTransform(scrollYProgress, [0, 1], [-20, 20]);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
      fetchReviews();
    }
  }, [productId]);

  // Close drawer on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (cartDrawerOpen && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setCartDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [cartDrawerOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (cartDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [cartDrawerOpen]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        const found = (data.products || []).find((p: any) => p.id === productId);
        if (found) {
          setProduct(found);
          setActiveImage(found.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80');
        }
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
        const filtered = (data.reviews || []).filter((r: any) => r.productId === productId);
        setReviews(filtered);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getRatingDetails = () => {
    if (reviews.length === 0) return { avg: 5.0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return { avg: parseFloat((sum / reviews.length).toFixed(1)), count: reviews.length };
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          reviewerName: user?.name || 'Customer',
          reviewerEmail: user?.email || 'customer@omnibazaar.in',
          rating: newRating,
          reviewText: newReviewText
        })
      });
      if (res.ok) {
        setNewReviewText('');
        setNewRating(5);
        fetchReviews();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCartClick = () => {
    if (!product) return;
    addToCart(product.id, quantity);
    setJustAdded(true);
    setCartDrawerOpen(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const isWishlisted = () => product ? wishlist.some(w => w.id === product.id) : false;

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center select-none">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-cyan-400 mb-3" />
        <p className="text-xs text-frost/50 font-mono uppercase tracking-widest">Synthesizing Product Details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center select-none">
        <p className="text-sm text-frost/50 font-mono italic">Product coordinates lost in void space.</p>
        <button type="button" onClick={() => onNavigateTo('shop')} className="mt-6 bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl text-xs cursor-pointer shadow-lg">
          Back to Shop Catalog
        </button>
      </div>
    );
  }

  const { avg, count } = getRatingDetails();
 
  const isVideo = (url: string) => {
    return url && (url.startsWith('data:video/') || url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg'));
  };

  const extraThumbnails = [
    ...(product.images || []),
    ...(product.video ? [product.video] : [])
  ].filter(Boolean);
  
  if (extraThumbnails.length === 0) {
    extraThumbnails.push('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80');
  }

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      
      {/* Cart Drawer Overlay */}
      <AnimatePresence>
        {cartDrawerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[50]" 
          />
        )}
      </AnimatePresence>

      {/* Cart Drawer Panel (frosted glass variant) */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[#020408]/95 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.9)] z-[51] flex flex-col transition-transform duration-300 ease-out ${
          cartDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-cyan-400" />
            <h3 className="font-bold font-display text-white text-base">Levitating Cart</h3>
            <span className="bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]">{cartCount}</span>
          </div>
          <button type="button"
            onClick={() => setCartDrawerOpen(false)}
            className="cursor-pointer h-8 w-8 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors border border-white/10"
          >
            <X className="h-4 w-4 text-frost/60 hover:text-white" />
          </button>
        </div>

        {/* Just Added Banner */}
        {justAdded && (
          <div className="mx-4 mt-3 p-3 bg-cyan-500/10 border border-cyan-400/20 rounded-xl flex items-center gap-2 text-cyan-300 text-xs font-mono font-bold">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            {quantity} Item(s) floated to the cart!
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <ShoppingBag className="h-12 w-12 text-frost/20 mx-auto" />
              <p className="text-sm text-frost/45 font-medium italic">Your space-cart is empty</p>
              <button type="button" onClick={() => { setCartDrawerOpen(false); onNavigateTo('shop'); }}
                className="cursor-pointer text-xs font-bold text-cyan-400 hover:underline uppercase tracking-wider">
                Browse Shop Catalog
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 p-3.5 glassmorphic rounded-2xl border border-white/10">
                <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-xl object-cover border border-white/5 bg-black shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-white truncate">{item.name}</h4>
                  <p className="text-[9px] text-frost/45 font-mono mt-0.5">{item.brand}</p>
                  <p className="text-sm font-extrabold text-cyan-400 font-mono mt-1">₹{item.price.toLocaleString('en-IN')}</p>
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center bg-black/40 rounded-lg border border-white/10 overflow-hidden">
                      <button type="button"
                        onClick={() => updateCartQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="cursor-pointer w-7 h-7 flex items-center justify-center hover:bg-white/5 text-frost/70 font-bold transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold font-mono text-white">{item.quantity}</span>
                      <button type="button"
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="cursor-pointer w-7 h-7 flex items-center justify-center hover:bg-white/5 text-frost/70 font-bold transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="cursor-pointer text-frost/40 hover:text-red-400 transition-colors p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-white/10 space-y-3 bg-[#020408] z-10">
            <div className="flex justify-between items-center px-1">
              <span className="text-sm font-bold text-frost/70">Subtotal ({cartCount} items)</span>
              <span className="text-xl font-extrabold text-cyan-450 font-mono">₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[10px] text-frost/40 text-center font-mono">Quantum shipping computed at checkout</p>
            <button type="button"
              onClick={() => { setCartDrawerOpen(false); onNavigateTo('cart'); }}
              className="cursor-pointer w-full bg-linear-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-display shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button"
              onClick={() => { setCartDrawerOpen(false); }}
              className="cursor-pointer w-full text-center text-xs font-bold text-frost/50 hover:text-white transition-colors py-2 uppercase tracking-wider"
            >
              Continue Floating
            </button>
          </div>
        )}
      </div>

      {/* Back button link */}
      <div>
        <button type="button"
          onClick={() => onNavigateTo('shop')}
          className="cursor-pointer font-bold text-xs text-frost/80 hover:text-cyan-400 flex items-center gap-1.5 transition-colors bg-white/5 px-4 py-2 rounded-xl border border-white/10 hover:border-cyan-500/30"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalog
        </button>
      </div>

      {/* Product Layout grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Left aspect: Image Gallery with scroll transform parallax */}
        <div className="md:col-span-6 space-y-4">
          <div className="aspect-square bg-black/40 rounded-3xl overflow-hidden border border-white/10 relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            
            {/* Parallax wrapper around the primary media display */}
            <motion.div 
              style={{ y: imageY }}
              className="w-full h-full"
            >
              {isVideo(activeImage) ? (
                <video src={activeImage} controls className="h-full w-full object-cover" autoPlay muted loop />
              ) : (
                <img src={activeImage} alt={product.name} className="h-full w-full object-cover" />
              )}
            </motion.div>

            {product.stock > 0 ? (
              <span className="absolute top-4 left-4 text-[9px] font-mono tracking-widest uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.25)] z-10">
                In Stock
              </span>
            ) : (
              <span className="absolute top-4 left-4 text-[9px] font-mono tracking-widest uppercase bg-rose-500/20 text-rose-450 border border-rose-400/30 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.25)] z-10 animate-pulse">
                Sold Out
              </span>
            )}
            <button type="button"
              onClick={() => toggleWishlist(product)}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/45 hover:border-cyan-400 transition-all text-frost/70 flex items-center justify-center z-10 cursor-pointer border border-white/10 shadow-md"
            >
              <Heart className={`h-4.5 w-4.5 ${isWishlisted() ? 'fill-red-500 text-red-500' : 'text-frost/60'}`} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {extraThumbnails.map((mediaUrl, i) => {
              const isVid = isVideo(mediaUrl);
              return (
                <button type="button"
                  key={i}
                  onClick={() => setActiveImage(mediaUrl)}
                  className={`cursor-pointer rounded-xl overflow-hidden border aspect-square bg-black/20 transition-all relative ${
                    activeImage === mediaUrl 
                      ? 'border-cyan-400 scale-[1.03] shadow-[0_0_12px_rgba(6,182,212,0.3)]' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {isVid ? (
                    <div className="h-full w-full relative flex items-center justify-center bg-slate-950">
                      <video src={mediaUrl} className="h-full w-full object-cover opacity-50" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-[8px] bg-black/70 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">▶ Vid</span>
                      </div>
                    </div>
                  ) : (
                    <img src={mediaUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right aspect: Sticky Purchase Panel with Glass Card styling */}
        <div className="md:col-span-6">
          <div className="glassmorphic rounded-3xl p-6 sm:p-8 space-y-6 md:sticky md:top-24 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
            
            <div className="space-y-3.5">
              <div className="flex gap-2.5 items-center text-[10px] font-mono font-bold">
                <span className="bg-indigo-500/10 border border-indigo-400/20 text-cyan-300 px-2.5 py-1 rounded-md uppercase tracking-wider">
                  {product.category}
                </span>
                <span className="text-white/20">|</span>
                <span className="text-frost/45 uppercase tracking-widest">Brand: {product.brand}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">{product.name}</h1>
              <div className="flex items-center gap-2 select-none">
                <div className="flex text-amber-400 gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.floor(avg) ? 'fill-amber-400 text-amber-400' : 'text-white/10'}`} />
                  ))}
                </div>
                <span className="text-xs font-bold text-frost/65 font-mono">({count} reviews)</span>
                <span className="text-white/20">•</span>
                <span className="text-xs text-frost/50 font-bold uppercase tracking-wider">{product.vendorStoreName || 'OmniBazaar Store'}</span>
              </div>
            </div>

            {/* Price indicator */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] text-frost/40 font-bold uppercase tracking-wider font-mono">Price:</span>
                <span className="text-3xl font-extrabold text-cyan-400 font-mono tracking-wider">₹{product.price.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-[10px] text-cyan-300 font-mono mt-1">✓ Secure quantum escrow enabled. Free space delivery above ₹1,00,000.</p>
            </div>

            {/* Add to Cart purchase morphing CTA controls */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                {/* Quantity adjustments */}
                <div className="flex border border-white/10 bg-black/40 rounded-xl items-center overflow-hidden w-fit">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="cursor-pointer px-4 py-2.5 hover:bg-white/5 text-frost/70 font-bold transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="px-5 py-2 font-bold font-mono text-sm w-12 text-center text-white">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => q + 1)}
                    className="cursor-pointer px-4 py-2.5 hover:bg-white/5 text-frost/70 font-bold transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Add to Cart morphing CTA */}
                <motion.button 
                  type="button"
                  onClick={handleAddToCartClick}
                  disabled={product.stock <= 0}
                  animate={justAdded ? { scale: [1, 1.05, 1], boxShadow: "0 0 25px rgba(6,182,212,0.8)" } : {}}
                  transition={{ repeat: justAdded ? 1 : 0, duration: 1 }}
                  className={`cursor-pointer flex-1 disabled:bg-white/5 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-95 text-xs uppercase tracking-widest font-display select-none ${
                    justAdded 
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white' 
                      : 'bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                  }`}
                >
                  <ShoppingCart className="h-4.5 w-4.5" />
                  {justAdded ? '✓ Floating to Cart' : 'Float to Cart'}
                </motion.button>
              </div>

              {cartCount > 0 && (
                <button type="button"
                  onClick={() => setCartDrawerOpen(true)}
                  className="cursor-pointer w-full border border-indigo-400/30 bg-indigo-500/10 text-cyan-300 hover:bg-indigo-500/20 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-display transition-all"
                >
                  <ShoppingBag className="h-4.5 w-4.5" />
                  View Cart ({cartCount} items)
                </button>
              )}
            </div>

            {/* space trust metrics */}
            <div className="grid grid-cols-3 gap-2.5 pt-4.5 border-t border-white/5 select-none">
              {[
                { icon: Truck, label: 'Fast Parsec delivery' },
                { icon: RefreshCw, label: '30-Day Return' },
                { icon: Shield, label: 'Secure Pay' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center text-center p-3 bg-white/[0.01] border border-white/5 rounded-xl text-[9px] text-frost/45 font-mono uppercase tracking-wider font-semibold">
                  <Icon className="h-4.5 w-4.5 text-cyan-400 mb-1.5" />
                  {label}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Tabs segment: Description & reviews */}
      <div className="glassmorphic border border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex border-b border-white/10 text-xs font-bold font-mono tracking-widest uppercase">
          <button type="button"
            onClick={() => setActiveTab('desc')}
            className={`cursor-pointer pb-3.5 px-4 border-b-2 transition-all ${
              activeTab === 'desc' 
                ? 'border-cyan-400 text-cyan-400 font-extrabold' 
                : 'border-transparent text-frost/45 hover:text-frost'
            }`}
          >
            Description & Specs
          </button>
          <button type="button"
            onClick={() => setActiveTab('reviews')}
            className={`cursor-pointer pb-3.5 px-4 border-b-2 transition-all ${
              activeTab === 'reviews' 
                ? 'border-cyan-400 text-cyan-400 font-extrabold' 
                : 'border-transparent text-frost/45 hover:text-frost'
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {activeTab === 'desc' ? (
          <div className="space-y-6 text-sm leading-relaxed text-frost/70">
            <p className="font-medium text-frost/90 leading-relaxed text-sm sm:text-base">{product.description}</p>
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl font-mono text-xs pt-4">
              {[
                { label: 'Brand', value: product.brand },
                { label: 'Category', value: product.category },
                { label: 'Quantum Stock Available', value: `${product.stock} units` },
                { label: 'Cosmic Rating', value: `${avg} / 5.0 ★` },
                { label: 'Exhibiting Vendor', value: product.vendorStoreName || 'OmniBazaar Store' },
              ].map(row => (
                <div key={row.label} className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-frost/40 uppercase tracking-widest">{row.label}:</span>
                  <span className="font-bold text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-xs text-frost/40 italic font-mono">No reviews yet. Be the first explorer to comment!</p>
              ) : (
                reviews.map(rev => (
                  <div key={rev.id} className="p-4.5 bg-white/[0.01] border border-white/5 rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-cyan-400">{rev.userName || rev.reviewerName || 'Customer'}</span>
                        <span className="text-frost/40 text-[9px] font-mono ml-2.5">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex text-amber-400 gap-0.5">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-frost/80 leading-relaxed font-medium">"{rev.reviewText}"</p>
                  </div>
                ))
              )}
            </div>

            {/* Submit reviews form */}
            <form onSubmit={handleAddReview} className="p-6 border border-white/10 bg-black/40 rounded-2xl max-w-xl space-y-4.5">
              <h5 className="font-bold font-display text-white text-sm">Submit Orbit Assessment</h5>
              
              <div className="flex items-center gap-3 select-none">
                <span className="text-xs font-bold font-mono text-frost/50 uppercase tracking-wider">Rating:</span>
                <div className="flex gap-1.5">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setNewRating(s)} className="cursor-pointer hover:scale-110 active:scale-95 transition-transform">
                      <Star className={`h-5 w-5 ${s <= newRating ? 'fill-amber-400 text-amber-400' : 'text-white/10'}`} />
                    </button>
                  ))}
                </div>
              </div>
              
              <textarea
                rows={3}
                required
                value={newReviewText}
                onChange={e => setNewReviewText(e.target.value)}
                placeholder="Share your experience in orbit with this product..."
                className="w-full bg-black/30 border border-white/10 focus:border-cyan-500/50 rounded-xl px-4 py-3 outline-none text-frost placeholder-frost/30 text-xs font-semibold"
              />
              
              <button
                type="submit"
                disabled={submittingReview}
                className="cursor-pointer bg-white text-black hover:bg-frost font-bold px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-mono flex items-center gap-2 active:scale-95 transition-all shadow-md"
              >
                {submittingReview ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Log assessment'}
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
