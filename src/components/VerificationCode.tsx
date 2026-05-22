import React, { useState, useEffect, useRef } from 'react';
import { RotateCw, Volume2 } from 'lucide-react';

interface VerificationCodeProps {
  onVerifyGenerated: (code: string) => void;
  id?: string;
}

export default function VerificationCode({ onVerifyGenerated, id = 'captcha-verify' }: VerificationCodeProps) {
  const [code, setCode] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate 5-character readable random alphanumeric code
  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing characters like I, O, 0, 1, 1
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
    onVerifyGenerated(result);
  };

  useEffect(() => {
    generateCode();
  }, []);

  // Visual render of distorted canvas captcha
  useEffect(() => {
    if (!canvasRef.current || !code) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and set background with subtle grid lines
    ctx.fillStyle = '#f3f4f6'; // Gray-100 background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw random security background circles and paths
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 120 + 100)}, ${Math.floor(Math.random() * 120 + 50)}, 255, 0.25)`;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Render characters with varying rotations, positions, and fonts
    ctx.font = 'bold 26px "Space Grotesk", sans-serif';
    ctx.textBaseline = 'middle';

    const segmentWidth = canvas.width / code.length;
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      ctx.save();
      
      // Compute positions
      const x = i * segmentWidth + segmentWidth / 2 + (Math.random() * 6 - 3);
      const y = canvas.height / 2 + (Math.random() * 6 - 3);

      // Rotate slightly
      const angle = (Math.random() * 40 - 20) * Math.PI / 180;
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Deep purple/indigo tone matching brand
      ctx.fillStyle = `rgb(${Math.floor(Math.random() * 40 + 80)}, 30, ${Math.floor(Math.random() * 80 + 150)})`;
      ctx.fillText(char, -10, 0);
      ctx.restore();
    }

    // Add noise dots
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(139, 92, 246, ${Math.random() * 0.4})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
  }, [code]);

  // Audio accessibility support utilizing HTML5 native Web Speech API
  const playAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Speak slowly and clearly
      const spelledCode = code.split('').join(', ');
      const utterance = new SpeechSynthesisUtterance(`Human verification verification digits: ${spelledCode}`);
      utterance.rate = 0.75;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis unsupported');
    }
  };

  return (
    <div id={id} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs">
      <div className="relative overflow-hidden rounded-lg border border-gray-100 flex-1 h-12 flex items-center justify-center bg-gray-50">
        <canvas
          ref={canvasRef}
          width={150}
          height={48}
          className="w-full h-full block select-none cursor-not-allowed"
          aria-label="Visual captcha representation"
        />
      </div>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={playAudio}
          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer"
          title="Play Audio Code"
          aria-label="Play auditory accessibility code"
        >
          <Volume2 className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          onClick={generateCode}
          className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
          title="Refresh Captcha Code"
          aria-label="Regenerate visual verification code"
        >
          <RotateCw className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}
