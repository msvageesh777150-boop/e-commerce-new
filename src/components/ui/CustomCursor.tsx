import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export default function CustomCursor() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 250, mass: 0.4 };
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

    // Watch hover events for links, buttons, inputs, custom cursor hover triggers, and maps
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

    // Dynamically re-bind selectors on DOM changes
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

  // Disable completely on mobile touch layouts
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  if (!isVisible) return null;

  return (
    <>
      {/* Outer spring ring — luxury magnetic neon capsule with mix-blend overlay */}
      <motion.div
        style={{ x: cursorXSpring, y: cursorYSpring }}
        className="pointer-events-none fixed left-0 top-0 z-[9999] hidden md:block"
        aria-hidden
      >
        <motion.div
          animate={{
            width: isHovered ? 56 : 12,
            height: isHovered ? 56 : 12,
            opacity: isHovered ? 0.6 : 1,
          }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="-translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora mix-blend-difference"
        />
      </motion.div>

      {/* Inner instant dot — accurate click guide */}
      <motion.div
        style={{ x: mouseX, y: mouseY }}
        className="pointer-events-none fixed left-0 top-0 z-[9998] hidden md:block"
        aria-hidden
      >
        <div className="-translate-x-1/2 -translate-y-1/2 h-1 w-1 rounded-full bg-white mix-blend-difference" />
      </motion.div>
    </>
  );
}
