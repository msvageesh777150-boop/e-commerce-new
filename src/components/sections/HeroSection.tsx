import React, { useRef, useState } from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { motion, Variants } from 'motion/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Grid } from '@react-three/drei';
import * as THREE from 'three';

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

// 1. High-fidelity 3D Floating Glass Card
function FloatingGlassCard() {
  const meshRef = useRef<THREE.Mesh>(null);
  const borderRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    
    // Slow cinematic bobbing
    const bob = Math.sin(time * 0.7) * 0.12;

    // Gentle automatic spin rotation
    const autoRotX = Math.sin(time * 0.25) * 0.05;
    const autoRotY = Math.cos(time * 0.25) * 0.05;

    // Viewport-based interactive mouse tilt with Apple easing
    const targetX = state.pointer.y * 0.45 + autoRotX;
    const targetY = state.pointer.x * 0.45 + autoRotY;

    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetX, 0.07);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetY, 0.07);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, bob, 0.07);

    if (borderRef.current) {
      borderRef.current.rotation.x = meshRef.current.rotation.x;
      borderRef.current.rotation.y = meshRef.current.rotation.y;
      borderRef.current.position.y = meshRef.current.position.y;
    }
  });

  return (
    <group>
      {/* Gold spotlight glow backdrop */}
      <mesh position={[0, 0, -0.15]}>
        <planeGeometry args={[3.5, 2.0]} />
        <meshBasicMaterial 
          color="#dfbd69" 
          transparent 
          opacity={0.05} 
          blending={THREE.AdditiveBlending} 
        />
      </mesh>

      {/* Main Frosted Gold Glass Card */}
      <mesh ref={meshRef}>
        <boxGeometry args={[3.2, 1.8, 0.06]} />
        <meshPhysicalMaterial
          transmission={0.92}
          roughness={0.12}
          thickness={0.55}
          clearcoat={1.0}
          clearcoatRoughness={0.08}
          color="#ffffff"
          attenuationColor="#cca751"
          attenuationDistance={1.2}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Glowing boundary gold edge wireframe */}
      <mesh ref={borderRef}>
        <boxGeometry args={[3.22, 1.82, 0.07]} />
        <meshBasicMaterial 
          color="#cca751" 
          wireframe 
          transparent 
          opacity={0.4} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// 2. Slow-rotating starry space particles
function CosmicBackdrop() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.015;
    }
  });

  return (
    <group ref={groupRef}>
      <Stars 
        radius={85} 
        depth={45} 
        count={320} 
        factor={3.5} 
        saturation={0.75} 
        fade 
        speed={1} 
      />
    </group>
  );
}

// 3. Coordinate Perspective Grid lines
function GridBackground() {
  return (
    <Grid
      position={[0, -1.8, -0.8]}
      rotation={[Math.PI / 2.2, 0, 0]}
      cellSize={0.5}
      cellThickness={0.9}
      cellColor="#cca751"
      sectionSize={2.0}
      sectionThickness={1.3}
      sectionColor="#dfbd69"
      fadeDistance={18}
      fadeStrength={1}
      infiniteGrid
    />
  );
}

interface HeroSectionProps {
  onNavigateTo: (page: string) => void;
}

export default function HeroSection({ onNavigateTo }: HeroSectionProps) {
  return (
    <section className="relative w-full overflow-hidden select-none min-h-[85vh] lg:min-h-[90vh] flex flex-col justify-center items-center pb-20 pt-10">
      
      {/* A. Dynamic Three.js Cosmic Gold Backdrop */}
      <div className="absolute inset-0 -z-10 w-full h-full pointer-events-none overflow-hidden bg-radial-glow opacity-30">
        <Canvas 
          camera={{ position: [0, 0, 4.5], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.65} />
          <directionalLight position={[5, 5, 5]} intensity={2.0} color="#dfbd69" />
          <pointLight position={[-5, -5, -2]} intensity={0.7} color="#cca751" />
          
          <FloatingGlassCard />
          <GridBackground />
          <CosmicBackdrop />
        </Canvas>
      </div>

      {/* B. Glass overlays */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[380px] glow-hero z-0 opacity-40" />

      {/* C. Typography Content (Curated Selection) */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 rounded-full bg-background/80 border border-border backdrop-blur-md px-4.5 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-accent font-bold"
        >
          <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
          <span>intelligent marketplace · premium edition</span>
        </motion.div>

        <h1 className="mt-8 text-balance text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl lg:text-[88px] text-foreground font-display">
          <TextReveal text="Commerce," />{' '}
          <span className="text-accent italic">
            <TextReveal text="curated." delay={0.15} />
          </span>
        </h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg font-medium leading-relaxed"
        >
          AI-guided intelligence meets a handpicked network of premium vendors. Explore selection, refined.
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
      </div>

      {/* D. Minimalist Golden Line Drawing */}
      <div aria-hidden className="mx-auto mt-20 h-px w-full max-w-2xl draw-line" />

      {/* E. Bounce Down exploration hint */}
      <div className="flex justify-center mt-12">
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
