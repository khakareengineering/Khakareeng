'use client';
import { useEffect, useState } from 'react';

export default function LiquidProgressBar({ 
  percentage = 0, 
  title = "Storage", 
  usedText = "0 MB", 
  totalText = "500 MB",
  liquidColor = "#3db2a8", 
  waveAccent = "rgba(61, 178, 168, 0.4)" 
}) {
  const [displayCount, setDisplayCount] = useState(0);
  const target = Math.min(Math.max(percentage, 0), 100);

  useEffect(() => {
    let start = 0;
    const duration = 800; // ms
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

      {/* Circle Container */}
      <div className="relative w-36 h-36 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-inner flex items-center justify-center">
        {/* Animated Liquid */}
        <div 
          className="absolute bottom-0 left-0 w-full transition-all duration-700 ease-in-out"
          style={{ height: `${target}%`, backgroundColor: liquidColor }}
        >
          {/* Wave 1 */}
          <div 
            className="absolute w-[200%] h-[200%] top-0 left-1/2 -translate-x-1/2 -translate-y-[95%] rounded-[45%] animate-spin"
            style={{ 
              backgroundColor: liquidColor,
              animationDuration: '6s'
            }}
          />
          {/* Wave 2 (Depth Accent) */}
          <div 
            className="absolute w-[200%] h-[200%] top-0 left-1/2 -translate-x-1/2 -translate-y-[95%] rounded-[40%] animate-spin"
            style={{ 
              backgroundColor: waveAccent,
              animationDuration: '4s'
            }}
          />
        </div>

        {/* Counter Text */}
        <div className="relative z-10 text-xl font-black text-gray-800 mix-blend-multiply select-none">
          {displayCount}%
        </div>
      </div>

      {/* Used / Total Info */}
      <div className="mt-3 text-center">
        <span className="text-xs font-bold text-[#1a2b3c] block">{usedText} used</span>
        <span className="text-[10px] text-gray-400 font-medium">of {totalText} limit</span>
      </div>
    </div>
  );
}