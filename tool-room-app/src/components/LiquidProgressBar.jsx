'use client';
import { useEffect, useState } from 'react';

export default function LiquidProgressBar({ 
  percentage = 0, 
  title = "Storage", 
  usedText = "0 MB", 
  totalText = "500 MB",
  liquidColor = "#4d73ec", 
  waveAccent = "rgba(144, 202, 249, 0.4)" 
}) {
  const [displayCount, setDisplayCount] = useState(0);
  const target = Math.min(Math.max(percentage, 0), 100);

  useEffect(() => {
    let start = 0;
    const duration = 900; // ms
    const stepTime = 15;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setDisplayCount(Math.round(target));
        clearInterval(timer);
      } else {
        setDisplayCount(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="flex flex-col items-center bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/80 shadow-sm w-full max-w-[220px]">
      <span className="text-xs font-black uppercase text-gray-500 mb-3 tracking-wider">{title}</span>

      {/* Deep Navy Circular Tank */}
      <div className="relative w-36 h-36 rounded-full overflow-hidden bg-[#070d30] shadow-[inset_0_4px_12px_rgba(0,0,0,0.4)] flex items-center justify-center border-2 border-white/20">
        
        {/* Dynamic Liquid Container */}
        <div 
          className="liquid-layer"
          style={{ height: `${target}%` }}
        >
          {/* Wave 1 (Base Wave) */}
          <div 
            className="wave wave-back" 
            style={{ backgroundColor: liquidColor }}
          />
          {/* Wave 2 (Lighter Accent Depth) */}
          <div 
            className="wave wave-front" 
            style={{ backgroundColor: waveAccent }}
          />
        </div>

        {/* Center Percentage Text with Diff Overlay */}
        <div className="relative z-10 text-2xl font-black text-white select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
          {displayCount}%
        </div>
      </div>

      {/* Used / Total Info */}
      <div className="mt-3 text-center">
        <span className="text-xs font-bold text-[#1a2b3c] block">{usedText} used</span>
        <span className="text-[10px] text-gray-400 font-medium">of {totalText} limit</span>
      </div>

      {/* Scoped CSS for Realistic Liquid Waves */}
      <style jsx>{`
        .liquid-layer {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background: ${liquidColor};
          transition: height 0.6s ease-in-out;
        }

        .wave {
          position: absolute;
          width: 220%;
          height: 220%;
          top: 0;
          left: 50%;
        }

        .wave-back {
          border-radius: 45%;
          animation: waveRotate 6s linear infinite;
        }

        .wave-front {
          border-radius: 40%;
          animation: waveRotate 3.5s linear infinite;
        }

        @keyframes waveRotate {
          0% {
            transform: translate(-50%, -95%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -95%) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}