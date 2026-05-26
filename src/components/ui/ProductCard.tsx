import React, { useRef } from 'react';
import { Heart, ShoppingBag, Eye, Star } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface ProductCardProps {
  p: any;
  ratings: { avg: number; count: number };
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onSelect: () => void;
  onAddToCart: () => void;
  addToCartLabel?: string;
}

export default function ProductCard({
  p,
  ratings,
  isWishlisted,
  onToggleWishlist,
  onSelect,
  onAddToCart,
  addToCartLabel = 'Add to Cart'
}: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Motion values for the premium 3D Tilt effect
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  
  // Map mouse coordinates to smooth rotation values [-6deg, 6deg] for a subtle, high-end Apple effect
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 180, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 180, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    
    // Normalize coordinates (-0.5 to 0.5)
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
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1200 }}
      className="w-full select-none"
    >
      <motion.div
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-soft hover:shadow-float lift flex flex-col justify-between group h-full"
      >
        {/* Wishlist ribbon toggle */}
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist();
          }}
          className="cursor-pointer absolute top-4 right-4 h-8 w-8 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center border border-border hover:scale-105 active:scale-95 transition-all shadow-sm z-25 hover:border-accent"
          aria-label="Add to wishlist"
        >
          <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground/80 hover:text-red-400'}`} />
        </button>

        {/* Media section with dynamic .shine reflection */}
        <div 
          onClick={onSelect}
          className="aspect-[4/5] bg-surface relative overflow-hidden cursor-pointer shine"
        >
          <div className="absolute inset-0 bg-radial-glow opacity-30" />
          <motion.img
            src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover will-change-transform"
            initial={{ scale: 1.05 }}
            whileHover={{ scale: 1.12 }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
          
          {/* Category tag */}
          <div className="absolute left-4 top-4 rounded-full bg-background/80 border border-border backdrop-blur-md px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-accent font-bold">
            {p.category}
          </div>

          {/* Quick actions popup overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2 items-center justify-center z-20 p-3">
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="w-36 bg-background hover:bg-surface text-foreground text-xs font-bold py-2.5 rounded-full shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 border border-border"
            >
              <Eye className="h-3.5 w-3.5 text-accent" />
              Quick View
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              className="w-36 btn-accent text-xs font-bold py-2.5 rounded-full shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 border border-white/10"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Add to Cart
            </button>
          </div>
        </div>

        {/* Labels & prices */}
        <div className="p-5 flex-1 flex flex-col justify-between bg-card z-10 relative">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[8px] uppercase font-mono tracking-widest text-muted-foreground font-bold">
              <span className="text-accent">{p.brand}</span>
              <span>{p.stock > 0 ? `${p.stock} units` : 'Sold out'}</span>
            </div>
            
            <h3
              onClick={onSelect}
              className="font-display text-[17px] font-semibold text-foreground hover:text-accent mt-1 cursor-pointer transition-colors leading-tight truncate"
            >
              {p.name}
            </h3>
            
            <p className="text-muted-foreground text-xs line-clamp-1 italic font-medium">"{p.description}"</p>

            <div className="flex gap-1 items-center pt-2 select-none">
              <div className="flex text-amber-400 gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-3 w-3 ${
                      i < Math.floor(ratings.avg) 
                        ? 'fill-amber-450 text-amber-450' 
                        : 'text-foreground/10'
                    }`} 
                  />
                ))}
              </div>
              <span className="text-[9px] font-bold text-muted-foreground font-mono">({ratings.count})</span>
            </div>
          </div>

          {/* Escrow prices */}
          <div className="mt-4 pt-3.5 border-t border-border flex justify-between items-center font-mono">
            <span className="font-bold text-foreground text-sm tracking-wider">
              ₹{p.price.toLocaleString('en-IN')}
            </span>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              className="cursor-pointer bg-secondary hover:bg-muted text-foreground font-bold py-1.5 px-3.5 rounded-full text-[10px] flex items-center gap-1.5 transition-colors border border-border active:scale-95"
            >
              <ShoppingBag className="h-3 w-3 text-accent" />
              {addToCartLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
