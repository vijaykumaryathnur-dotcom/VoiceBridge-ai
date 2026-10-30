import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, Volume2, Sparkles } from 'lucide-react';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceOrbProps {
  state: OrbState;
  audioLevel: number; // 0 to 1
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  audioLevel,
  onClick,
  size = 'lg'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const dimensions = {
    sm: { canvasSize: 200, coreSize: 'w-24 h-24', radius: 44 },
    md: { canvasSize: 280, coreSize: 'w-36 h-36', radius: 68 },
    lg: { canvasSize: 360, coreSize: 'w-48 h-48 md:w-56 md:h-56', radius: 96 }
  }[size];

  // Dynamic scale driven by audioLevel
  const reactiveScale = 1 + audioLevel * 0.26;

  // Render organic layered copper waveforms and ambient illumination on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let tick = 0;

    // Organic floating ambient embers/particles
    const embers = Array.from({ length: 28 }, (_, i) => ({
      angle: (i / 28) * Math.PI * 2,
      distance: dimensions.radius * (0.82 + Math.random() * 0.65),
      speed: 0.005 + Math.random() * 0.007,
      size: 1.1 + Math.random() * 1.6,
      opacity: 0.25 + Math.random() * 0.45,
      wobbleSpeed: 0.015 + Math.random() * 0.025
    }));

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // 1. Organic layered copper waveforms
      const waveCount = state === 'listening' || state === 'speaking' ? 4 : 2;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const baseR = dimensions.radius * (1 + w * 0.2);
        const waveAmp = (
          state === 'listening'
            ? audioLevel * 24
            : state === 'speaking'
            ? Math.sin(tick * 0.07 + w * 1.2) * 9 + 10
            : 3.5
        ) * (1 - w * 0.16);

        const points = 48;
        for (let p = 0; p <= points; p++) {
          const theta = (p / points) * Math.PI * 2;
          const offset =
            Math.sin(theta * 3 + tick * 0.035 + w) * waveAmp +
            Math.cos(theta * 2 - tick * 0.025) * (waveAmp * 0.55);
          const r = baseR + offset;
          const x = centerX + Math.cos(theta) * r;
          const y = centerY + Math.sin(theta) * r;

          if (p === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();

        const strokeAlpha = Math.max(0.04, (0.32 - w * 0.07) * (state === 'idle' ? 0.35 : 1));
        // Layered burnished copper and amber gradient stroke
        ctx.strokeStyle = w % 2 === 0
          ? `rgba(200, 122, 75, ${strokeAlpha})` // burnished copper
          : `rgba(224, 163, 100, ${strokeAlpha * 0.85})`; // muted amber
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }

      // 2. Animated floating ambient embers
      embers.forEach((emb, idx) => {
        emb.angle += state === 'thinking' ? emb.speed * 2.2 : emb.speed;
        const currentDist =
          emb.distance +
          Math.sin(tick * emb.wobbleSpeed + idx) * 7 +
          (state === 'listening' ? audioLevel * 22 : 0);
        const px = centerX + Math.cos(emb.angle) * currentDist;
        const py = centerY + Math.sin(emb.angle) * currentDist;

        ctx.beginPath();
        ctx.arc(px, py, emb.size, 0, Math.PI * 2);

        const alpha = Math.min(0.65, emb.opacity * (state === 'idle' ? 0.35 : 0.85));
        ctx.fillStyle = idx % 3 === 0
          ? `rgba(245, 239, 230, ${alpha * 0.9})` // warm ivory
          : idx % 2 === 0
          ? `rgba(224, 163, 100, ${alpha})` // muted amber
          : `rgba(200, 122, 75, ${alpha})`; // burnished copper
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, audioLevel, dimensions.radius]);

  // Ambient glow gradient mapped to Midnight Atelier
  const getStateGlow = () => {
    switch (state) {
      case 'listening':
        return 'from-[#C87A4B]/30 via-[#E0A364]/15 to-transparent';
      case 'thinking':
        return 'from-[#7A402A]/25 via-[#C87A4B]/15 to-transparent';
      case 'speaking':
        return 'from-[#C87A4B]/35 via-[#E0A364]/20 to-transparent';
      case 'idle':
      default:
        return 'from-[#C87A4B]/10 via-[#1C1A17]/10 to-transparent';
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-3">
      
      {/* Background Ambient Illumination */}
      <div
        className={`absolute rounded-full blur-3xl pointer-events-none transition-all duration-700 bg-gradient-to-tr ${getStateGlow()}`}
        style={{
          width: `${dimensions.canvasSize * 1.1}px`,
          height: `${dimensions.canvasSize * 1.1}px`,
          transform: `scale(${reactiveScale})`
        }}
      />

      {/* Layered Canvas Waveforms & Floating Embers */}
      <canvas
        ref={canvasRef}
        width={dimensions.canvasSize}
        height={dimensions.canvasSize}
        className="absolute pointer-events-none z-0"
        style={{
          transform: `scale(${reactiveScale})`,
          transition: 'transform 80ms ease-out'
        }}
      />

      {/* Primary Interaction Core Orb */}
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ scale: 1.025 }}
        whileTap={{ scale: 0.97 }}
        className={`relative ${dimensions.coreSize} rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C87A4B] group overflow-hidden transition-all duration-300 z-10`}
        style={{
          transform: `scale(${reactiveScale})`,
          boxShadow: state === 'listening' || state === 'speaking'
            ? '0 20px 50px -10px rgba(200, 122, 75, 0.4), inset 0 1px 2px rgba(245, 239, 230, 0.35)'
            : '0 15px 35px -10px rgba(0, 0, 0, 0.85), inset 0 1px 2px rgba(245, 239, 230, 0.15)'
        }}
        aria-label={`Voice assistant: ${state}. Tap to speak.`}
      >
        {/* Core Midnight Atelier Multi-Stop Radial Gradient */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-700"
          style={{
            background: state === 'listening'
              ? 'radial-gradient(circle at 38% 34%, #E0A364 0%, #C87A4B 40%, #683921 75%, #181412 100%)'
              : state === 'thinking'
              ? 'radial-gradient(circle at 45% 45%, #E0A364 0%, #87482D 45%, #422014 75%, #141210 100%)'
              : state === 'speaking'
              ? 'radial-gradient(circle at 35% 30%, #F5EFE6 0%, #E0A364 35%, #C87A4B 70%, #3A1D13 100%)'
              : 'radial-gradient(circle at 36% 32%, #2A2521 0%, #1D1A17 45%, #141210 80%, #0A0A09 100%)'
          }}
        />

        {/* Subtle Light Refraction Shimmer */}
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: state === 'thinking' ? [1, 1.07, 1] : [1, 1.02, 1]
          }}
          transition={{
            rotate: { duration: state === 'thinking' ? 6 : 24, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3.8, repeat: Infinity, ease: 'easeInOut' }
          }}
          className="absolute -inset-4 rounded-full opacity-60 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 30% 28%, rgba(245, 239, 230, 0.5) 0%, rgba(224, 163, 100, 0.2) 35%, transparent 65%)'
          }}
        />

        {/* Burnished Copper Rim Detailing */}
        <div className="absolute inset-1 rounded-full border border-[#F5EFE6]/15 pointer-events-none" />

        {/* Center Feedback Icon */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#F5EFE6] z-10">
          {state === 'listening' ? (
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              className="flex flex-col items-center"
            >
              <Mic className="w-8 h-8 md:w-9 md:h-9 text-[#F5EFE6] drop-shadow-sm" />
              <span className="text-[10px] font-semibold tracking-widest text-[#F5EFE6] mt-1.5 uppercase font-sans opacity-95">
                Listening
              </span>
            </motion.div>
          ) : state === 'thinking' ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="flex flex-col items-center"
            >
              <Sparkles className="w-8 h-8 md:w-9 md:h-9 text-[#E0A364] drop-shadow-sm" />
              <span className="text-[10px] font-semibold tracking-widest text-[#E0A364] mt-1.5 uppercase font-sans">
                Reflecting
              </span>
            </motion.div>
          ) : state === 'speaking' ? (
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 0.85, ease: 'easeInOut' }}
              className="flex flex-col items-center"
            >
              <Volume2 className="w-8 h-8 md:w-9 md:h-9 text-[#0D0D0C] drop-shadow-sm" />
              <span className="text-[10px] font-bold tracking-widest text-[#0D0D0C] mt-1.5 uppercase font-sans">
                Speaking
              </span>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center opacity-85 group-hover:opacity-100 transition-opacity">
              <Mic className="w-7 h-7 md:w-8 md:h-8 text-[#C87A4B]" />
              <span className="text-[10px] font-medium tracking-widest text-[#A89F91] mt-1.5 uppercase font-sans">
                Tap to Speak
              </span>
            </div>
          )}
        </div>
      </motion.button>

      {/* Subtle organic harmonic indicator */}
      <div className="flex items-center gap-1 mt-5 h-5">
        {[0.25, 0.5, 0.85, 0.6, 1.0, 0.75, 0.4, 0.2].map((f, idx) => {
          const height = state === 'listening'
            ? Math.max(3, Math.round(audioLevel * f * 20))
            : state === 'speaking'
            ? Math.max(3, Math.round(Math.sin(Date.now() / 160 + idx) * 8 + 10))
            : 3;

          return (
            <div
              key={idx}
              className={`w-1 rounded-full transition-all duration-75 ${
                state === 'listening'
                  ? 'bg-[#C87A4B]'
                  : state === 'speaking'
                  ? 'bg-[#E0A364]'
                  : 'bg-[#23201C]'
              }`}
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>

    </div>
  );
};
