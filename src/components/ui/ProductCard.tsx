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
  
  // Map mouse coordinates to smooth rotation values [-8deg, 8deg]
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

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
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1200 }}
      className="w-full select-none"
    >
      <motion.div
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className="relative overflow-hidden rounded-3xl glass hover-lift flex flex-col justify-between group h-full"
      >
        {/* Wishlist Ribbon Toggler */}
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist();
          }}
          className="cursor-pointer absolute top-4 right-4 h-8 w-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:scale-110 active:scale-95 transition-all shadow-md z-20 hover:border-primary"
          aria-label="Add to wishlist"
        >
          <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-foreground/60 hover:text-red-400'}`} />
        </button>

        {/* Media Image Aspect */}
        <div 
          onClick={onSelect}
          className="aspect-[4/5] bg-black/20 relative overflow-hidden cursor-pointer"
        >
          <div className="absolute inset-0 bg-radial-glow opacity-60" />
          <motion.img
            src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover"
            initial={{ scale: 1.1 }}
            whileHover={{ scale: 1.18 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/10 to-transparent" />
          
          {/* Curated Category Tag */}
          <div className="absolute left-4 top-4 rounded-full glass px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-foreground font-semibold">
            {p.category}
          </div>

          {/* Interactive Hover Control Overlay */}
          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2 items-center justify-center z-10 p-3">
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="w-36 bg-white hover:bg-frost text-black text-xs font-bold py-2.5 rounded-full shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95"
            >
              <Eye className="h-3.5 w-3.5 text-primary" />
              Quick View
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              className="w-36 bg-aurora text-white text-xs font-bold py-2.5 rounded-full shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Add to Cart
            </button>
          </div>
        </div>

        {/* Text and Ratings Details */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[8px] uppercase font-mono tracking-widest text-muted-foreground font-bold">
              <span>{p.brand}</span>
              <span>{p.stock > 0 ? `${p.stock} units` : 'Sold out'}</span>
            </div>
            
            <h3
              onClick={onSelect}
              className="font-display text-lg font-medium text-foreground hover:text-primary mt-1 cursor-pointer transition-colors leading-tight truncate"
            >
              {p.name}
            </h3>
            
            <p className="text-muted-foreground text-xs line-clamp-1 italic font-medium">"{p.description}"</p>

            <div className="flex gap-1 items-center pt-2">
              <div className="flex text-amber-400 gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-3 w-3 ${
                      i < Math.floor(ratings.avg) 
                        ? 'fill-amber-400 text-amber-400' 
                        : 'text-white/10'
                    }`} 
                  />
                ))}
              </div>
              <span className="text-[9px] font-bold text-muted-foreground font-mono">({ratings.count})</span>
            </div>
          </div>

          {/* Pricing & Cart Escrow Actions */}
          <div className="mt-4 pt-3.5 border-t border-white/5 flex justify-between items-center">
            <span className="font-bold text-primary font-mono text-sm tracking-wider">
              ₹{p.price.toLocaleString('en-IN')}
            </span>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              className="cursor-pointer bg-white/5 hover:bg-white/10 text-foreground font-bold py-1.5 px-3 rounded-full text-[10px] flex items-center gap-1.5 transition-colors border border-white/8 active:scale-95"
            >
              <ShoppingBag className="h-3 w-3 text-primary" />
              {addToCartLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
