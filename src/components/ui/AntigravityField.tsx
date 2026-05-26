import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
  glow: boolean;
}

export default function AntigravityField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const colors = [
      'rgba(99, 102, 241, ',  // Indigo #6366f1
      'rgba(6, 182, 212, ',   // Cyan #06b6d4
      'rgba(232, 237, 245, ',  // Frost #e8edf5
    ];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 25000) || 50;
      // Cap particle numbers between 40 and 60
      const finalCount = Math.min(Math.max(particleCount, 40), 60);

      for (let i = 0; i < finalCount; i++) {
        const baseColor = colors[Math.floor(Math.random() * colors.length)];
        const opacity = Math.random() * 0.4 + 0.3; // opacity 0.3 to 0.7
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1, // 1 to 4px random sizes
          speedX: (Math.random() - 0.5) * 0.2, // drifting slowly
          speedY: (Math.random() - 0.5) * 0.2,
          color: baseColor + opacity + ')',
          opacity: opacity,
          glow: Math.random() > 0.4,
        });
      }
    };

    const draw = () => {
      // Clear with dark transparent trails if desired, or clear completely for clean render
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        ctx.beginPath();
        
        // Add subtle neon shadows for glowing dots
        if (p.glow) {
          ctx.shadowBlur = p.size * 2.5;
          ctx.shadowColor = p.color;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Increment drift coordinates
        p.x += p.speedX;
        p.y += p.speedY;

        // Infinite loop wrap boundaries
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;
      });

      // Clear shadows so other drawings aren't impacted
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{
        background: 'transparent',
        pointerEvents: 'none',
      }}
    />
  );
}
