import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { motion, Variants } from 'motion/react';
import * as THREE from 'three';
import ErrorBoundary from '../ui/ErrorBoundary';

// Fallback background in case Canvas fails to render or compile
function GradientMeshBg() {
  return (
    <div className="absolute inset-0 bg-background flex items-center justify-center overflow-hidden pointer-events-none">
      <div className="absolute w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] animate-pulse -top-20 -left-20" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-accent/10 blur-[150px] animate-pulse -bottom-20 -right-20" />
    </div>
  );
}

// 3D Distorting Luxury Orb
function Orb() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.x = t * 0.15;
    ref.current.rotation.y = t * 0.2;
    
    // Float slightly towards the mouse pointer position
    const mx = state.pointer.x;
    const my = state.pointer.y;
    ref.current.position.x += (mx * 0.5 - ref.current.position.x) * 0.05;
    ref.current.position.y += (my * 0.3 - ref.current.position.y) * 0.05;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.2}>
      <mesh ref={ref} scale={1.6}>
        <icosahedronGeometry args={[1, 16]} />
        <MeshDistortMaterial
          color="#7c3aed"
          emissive="#5b21b6"
          emissiveIntensity={0.35}
          roughness={0.15}
          metalness={0.95}
          distort={0.35}
          speed={1.6}
        />
      </mesh>
    </Float>
  );
}

// Orbiting thin glowing rings
function Ring({ radius = 2.6, tilt = 0.5, speed = 0.3 }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.z = s.clock.elapsedTime * speed;
  });
  return (
    <mesh ref={ref} rotation={[tilt, 0.3, 0]}>
      <torusGeometry args={[radius, 0.004, 16, 200]} />
      <meshBasicMaterial color="#a78bfa" transparent opacity={0.45} />
    </mesh>
  );
}

// Complete 3D Canvas Scene
function HeroScene() {
  return (
    <Suspense fallback={null}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#a78bfa" />
      <directionalLight position={[-5, -3, -5]} intensity={0.6} color="#22d3ee" />
      
      <Orb />
      <Ring radius={2.2} tilt={0.4} speed={0.25} />
      <Ring radius={2.6} tilt={-0.6} speed={-0.18} />
      <Ring radius={3.0} tilt={1.1} speed={0.12} />
      
      <Sparkles count={80} scale={8} size={2} speed={0.4} color="#a78bfa" />
    </Suspense>
  );
}

// Word-by-word typographic reveal
function TextReveal({ text, className }: { text: string; className?: string }) {
  const words = text.split(' ');
  
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.15 }
    }
  };

  const wordVariants: Variants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] }
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
        <span key={idx} className="inline-block mr-3 overflow-hidden py-1">
          <motion.span variants={wordVariants} className="inline-block">
            {word}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

// Interactive Magnetic Button
function MagneticButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setCoords({ x: x * 0.25, y: y * 0.25 }); // 25% stickiness lag
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
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer relative inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-xs font-bold uppercase tracking-widest font-mono bg-aurora text-white shadow-soft hover:shadow-[0_0_40px_-8px_oklch(0.78_0.22_295/0.7)] border border-white/20 select-none overflow-hidden"
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
  return (
    <section className="relative w-full h-[90vh] min-h-[620px] flex items-center justify-center overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-surface shadow-elevated">
      
      {/* 3D Canvas Scene Overlay */}
      <div className="absolute inset-0 z-0 w-full h-full pointer-events-none">
        <ErrorBoundary fallback={<GradientMeshBg />}>
          <Suspense fallback={<GradientMeshBg />}>
            <Canvas
              camera={{ position: [0, 0, 4.8], fov: 50 }}
              dpr={[1, 1.8]}
              gl={{ antialias: true, alpha: true }}
            >
              <HeroScene />
            </Canvas>
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Grid line layer + Radial overlay */}
      <div className="absolute inset-0 bg-radial-glow opacity-50 pointer-events-none z-5" />
      <div className="absolute inset-0 grid-lines opacity-25 pointer-events-none z-5" />

      {/* Text Context Overlay */}
      <div className="relative z-10 text-center max-w-4xl px-6 flex flex-col items-center gap-6 select-none pointer-events-auto">
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground border border-white/10"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
          <span>Antigravity Engine Engaged</span>
        </motion.div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-medium font-display leading-[0.95] tracking-tight text-white">
          <TextReveal text="Objects designed" className="block" />
          <TextReveal text="for the next century." className="block text-gradient mt-2" />
        </h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed font-sans font-medium"
        >
          Levitate your shopping experience in deep space. Discover custom multi-vendor products drifting lazily in an optimized three-dimensional physics space.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0, type: 'spring', stiffness: 120 }}
          className="pt-4 flex items-center justify-center"
        >
          <MagneticButton onClick={() => onNavigateTo('shop')}>
            <span>Launch Catalog</span>
            <ArrowRight className="h-4.5 w-4.5 text-white" />
          </MagneticButton>
        </motion.div>
      </div>

      {/* Bounce Down Scroll Hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-1.5 text-[10px] font-mono tracking-widest text-muted-foreground cursor-pointer select-none"
          onClick={() => {
            const nextEl = document.getElementById('categories-section');
            if (nextEl) nextEl.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span>Explore Cosmos</span>
          <ArrowDown className="h-3.5 w-3.5 text-primary" />
        </motion.div>
      </div>

    </section>
  );
}
