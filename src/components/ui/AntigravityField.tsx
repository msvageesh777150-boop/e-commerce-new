import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AntigravityField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Initialize Scene, Camera, and WebGLRenderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 2. Generate optimized starfield coordinates (200 particles)
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      // Coordinate distribution
      positions[i] = (Math.random() - 0.5) * 220; // x
      positions[i + 1] = (Math.random() - 0.5) * 220; // y
      positions[i + 2] = (Math.random() - 0.5) * 120 - 40; // z (slightly pushed back)

      // Random slow drifts
      speeds[i] = (Math.random() - 0.5) * 0.05;
      speeds[i + 1] = (Math.random() - 0.5) * 0.05;
      speeds[i + 2] = (Math.random() - 0.5) * 0.05;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // 3. Create glowing circular canvas texture in memory
    const createCircleTexture = () => {
      const textureCanvas = document.createElement('canvas');
      textureCanvas.width = 16;
      textureCanvas.height = 16;
      const ctx = textureCanvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(223, 189, 105, 0.85)'); // Accent color: gold #dfbd69
        gradient.addColorStop(0.6, 'rgba(204, 167, 81, 0.2)');   // Deep gold #cca751
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 16, 16);
      }
      return new THREE.CanvasTexture(textureCanvas);
    };

    // 4. Create premium golden Points Material
    const material = new THREE.PointsMaterial({
      size: 2.2,
      map: createCircleTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.55,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 5. Setup smooth mouse interpolation parallax
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX - window.innerWidth / 2) * 0.025;
      targetY = (e.clientY - window.innerHeight / 2) * 0.025;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 6. Handle resizing dynamically
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // 7. Core animation frame loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Slow orbital rotate
      particles.rotation.y = elapsedTime * 0.015;
      particles.rotation.x = elapsedTime * 0.008;

      // Mouse-move easing (lerp)
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      // Apply 3D coordinate displacement
      particles.position.x = currentX;
      particles.position.y = -currentY;

      // Subtle dynamic drifting
      const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
      if (positionAttr) {
        const arr = positionAttr.array as Float32Array;
        for (let i = 0; i < particleCount * 3; i += 3) {
          arr[i] += speeds[i];
          arr[i + 1] += speeds[i + 1];
          arr[i + 2] += speeds[i + 2];

          // Boundary wraps
          if (Math.abs(arr[i]) > 110) arr[i] = -arr[i];
          if (Math.abs(arr[i + 1]) > 110) arr[i + 1] = -arr[i + 1];
          if (Math.abs(arr[i + 2]) > 60) arr[i + 2] = -arr[i + 2];
        }
        positionAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 8. Lifecycle cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-20"
      style={{
        background: 'transparent',
        pointerEvents: 'none',
      }}
    />
  );
}
