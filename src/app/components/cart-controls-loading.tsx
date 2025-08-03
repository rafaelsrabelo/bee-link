"use client";

import { Minus, Plus } from "lucide-react";

export default function CartControlsLoading() {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 mb-4 shadow-xl">
      <div className="flex items-center justify-center gap-6">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse">
          <Minus className="w-6 h-6 text-white/30" />
        </div>
        
        <div className="bg-white/95 backdrop-blur-sm text-lg font-medium px-6 py-2 rounded-full min-w-[60px] text-center animate-pulse">
          <div className="w-8 h-6 bg-white/30 rounded" />
        </div>
        
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse">
          <Plus className="w-6 h-6 text-white/30" />
        </div>
      </div>
    </div>
  );
} 