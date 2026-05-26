import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export default function CustomCursor() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 220, mass: 0.45 };
  const cursorXSpring = useSpring(mouseX, springConfig);
  const cursorYSpring = useSpring(mouseY, springConfig);

  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for mobile/touch interface
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseleave', handleMouseLeave);

    const handleHoverStart = () => setIsHovered(true);
    const handleHoverEnd = () => setIsHovered(false);

    // Watch hover events for active tags, inputs, and triggers
    const addListeners = () => {
      const targets = document.querySelectorAll(
        'button, a, input, select, textarea, [role="button"], label, .hover-trigger, .leaflet-interactive, [data-cursor="hover"]'
      );
      targets.forEach(t => {
        t.addEventListener('mouseenter', handleHoverStart);
        t.addEventListener('mouseleave', handleHoverEnd);
      });
    };

    addListeners();

    const observer = new MutationObserver(addListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseleave', handleMouseLeave);
      observer.disconnect();
      const targets = document.querySelectorAll(
        'button, a, input, select, textarea, [role="button"], label, .hover-trigger, .leaflet-interactive, [data-cursor="hover"]'
      );
      targets.forEach(t => {
        t.removeEventListener('mouseenter', handleHoverStart);
        t.removeEventListener('mouseleave', handleHoverEnd);
      });
    };
  }, [mouseX, mouseY, isVisible]);

  // Hide entirely on touch devices
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  if (!isVisible) return null;

  return (
    <>
      {/* Outer spring ring — luxury warm-gold editorial follow ring */}
      <motion.div
        style={{ x: cursorXSpring, y: cursorYSpring }}
        className="pointer-events-none fixed left-0 top-0 z-[9999] hidden md:block"
        aria-hidden
      >
        <motion.div
          animate={{
            width: isHovered ? 48 : 10,
            height: isHovered ? 48 : 10,
            opacity: isHovered ? 0.35 : 0.65,
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="-translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
          style={{
            boxShadow: isHovered ? 'var(--shadow-accent)' : 'none',
          }}
        />
      </motion.div>

      {/* Inner instant dot — solid core */}
      <motion.div
        style={{ x: mouseX, y: mouseY }}
        className="pointer-events-none fixed left-0 top-0 z-[9998] hidden md:block"
        aria-hidden
      >
        <div className="-translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-foreground" />
      </motion.div>
    </>
  );
}
