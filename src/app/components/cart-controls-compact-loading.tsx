"use client";

import { Minus, Plus } from "lucide-react";

export default function CartControlsCompactLoading() {
  return (
    <div className="flex items-center justify-center gap-4">
      <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse">
        <Minus className="w-4 h-4 text-white/30" />
      </div>
      
      <div className="bg-white/95 backdrop-blur-sm text-sm font-medium px-3 py-1 rounded-full min-w-[28px] text-center animate-pulse">
        <div className="w-4 h-4 bg-white/30 rounded" />
      </div>
      
      <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse">
        <Plus className="w-4 h-4 text-white/30" />
      </div>
    </div>
  );
} 