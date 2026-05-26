import React, { useRef, useState } from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { motion, Variants, useScroll, useTransform } from 'motion/react';

// Word-by-word reveal
function TextReveal({ text, className, delay = 0.15 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(' ');
  
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: delay }
    }
  };

  const wordVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <motion.span 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {words.map((word, idx) => (
        <span key={idx} className="inline-block mr-2.5 overflow-hidden py-1">
          <motion.span variants={wordVariants} className="inline-block">
            {word}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

// Interactive Magnetic Button Wrapper
function MagneticButton({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setCoords({ x: x * 0.22, y: y * 0.22 }); // 22% Apple-style lag
  };

  const handleMouseLeave = () => {
    setCoords({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ x: coords.x, y: coords.y }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`cursor-pointer ${className}`}
    >
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}

interface HeroSectionProps {
  onNavigateTo: (page: string) => void;
}

export default function HeroSection({ onNavigateTo }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parallax tracking of scroll movements
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.35]);
  const orbY1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const orbY2 = useTransform(scrollYProgress, [0, 1], [0, 70]);

  return (
    <section ref={containerRef} className="relative w-full overflow-hidden pb-16 pt-8 select-none">
      
      {/* 1. Multi-layered gold glows base */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[680px] glow-hero z-0" />
      
      {/* 2. Floating gold ambient orbs */}
      <motion.div
        aria-hidden
        style={{ y: orbY1 }}
        className="pointer-events-none absolute left-[10%] top-32 hidden h-28 w-28 rounded-full bg-[var(--accent-soft)] opacity-40 blur-3xl float-slow md:block z-0"
      />
      <motion.div
        aria-hidden
        style={{ y: orbY2 }}
        className="pointer-events-none absolute right-[12%] top-20 hidden h-36 w-36 rounded-full bg-[var(--accent)] opacity-20 blur-3xl float-slow md:block z-0"
      />

      {/* 3. Text Descriptions */}
      <motion.div
        style={{ opacity: heroOpacity }}
        className="relative z-10 mx-auto max-w-4xl px-6 pb-12 pt-12 text-center"
      >
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 rounded-full bg-background/80 border border-border backdrop-blur-md px-4.5 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-accent font-bold"
        >
          <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
          <span>New collection · sonus one</span>
        </motion.div>

        <h1 className="mt-8 text-balance text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl lg:text-[88px] text-foreground font-display">
          <TextReveal text="Sound," />{' '}
          <span className="text-accent italic">
            <TextReveal text="sculpted." delay={0.15} />
          </span>
        </h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mx-auto mt-6 max-w-xl text-pretty text-base text-muted-foreground md:text-lg font-medium leading-relaxed"
        >
          A new chapter in personal audio. Levitate your shopping experience in deep space. Lighter, quieter, infinitely more present.
        </motion.p>

        {/* Action launches */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-10 flex items-center justify-center gap-3.5"
        >
          <MagneticButton 
            onClick={() => onNavigateTo('shop')}
            className="shine btn-accent inline-flex h-12 items-center justify-center rounded-full px-7 text-xs font-bold uppercase tracking-widest font-mono select-none active:scale-[0.97]"
          >
            <span>Launch Catalog</span>
            <ArrowRight className="h-4 w-4" />
          </MagneticButton>

          <MagneticButton 
            onClick={() => {
              const nextEl = document.getElementById('categories-section');
              if (nextEl) nextEl.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background/60 hover:bg-surface px-7 text-xs font-bold uppercase tracking-widest font-mono backdrop-blur-sm transition hover:border-foreground/30 hover:shadow-soft"
          >
            <span>Explore</span>
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* 4. Large Parallax card with premium paper film grain */}
      <div className="relative z-10 mx-auto max-w-4xl px-6">
        <div className="group relative overflow-hidden rounded-[2.5rem] bg-surface border border-border grain [box-shadow:var(--shadow-float)] aspect-[16/10] sm:aspect-[16/9]">
          <motion.img
            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=80"
            alt="Sonus One headphones"
            style={{ y: heroY, scale: heroScale }}
            className="h-full w-full object-cover will-change-transform"
          />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background/70 to-transparent" />
        </div>
      </div>

      {/* 5. Minimalist Golden Line Drawing */}
      <div aria-hidden className="mx-auto mt-16 h-px max-w-2xl draw-line" />

      {/* 6. Bounce Down hint */}
      <div className="flex justify-center mt-8">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-1.5 text-[9px] font-mono tracking-[0.25em] text-muted-foreground cursor-pointer uppercase font-bold"
          onClick={() => {
            const nextEl = document.getElementById('categories-section');
            if (nextEl) nextEl.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span>Explore Cosmos</span>
          <ArrowDown className="h-3.5 w-3.5 text-accent" />
        </motion.div>
      </div>

    </section>
  );
}
