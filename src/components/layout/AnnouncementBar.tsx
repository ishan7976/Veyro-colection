import React from 'react';
import { Sparkles, Flame, Zap } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-[#050505] text-white text-[10px] font-mono tracking-[0.2em] py-2.5 px-4 overflow-hidden border-b border-white/10 relative z-30 select-none">
      <div className="flex whitespace-nowrap animate-marquee items-center gap-12">
        <div className="flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-white fill-current" />
          <span>DROP 004 IS LIVE • LIMITED QUANTITIES WORLDWIDE</span>
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <Zap className="w-3.5 h-3.5 text-white fill-current" />
          <span>FREE EXPRESS SHIPPING ON ORDERS OVER $150</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-white fill-current" />
          <span>USE CODE <span className="underline font-black text-white">IDENTITY15</span> FOR 15% OFF</span>
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <Flame className="w-3.5 h-3.5 text-white fill-current" />
          <span>WEAR YOUR IDENTITY • HIGH DENSITY 320-480 GSM COTTON</span>
        </div>
      </div>
    </div>
  );
};
