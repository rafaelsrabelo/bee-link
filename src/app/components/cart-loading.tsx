"use client";

import { ShoppingCart } from "lucide-react";

export default function CartLoading() {
  return (
    <div className="relative flex items-center gap-3">
      <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20 animate-pulse">
        <div className="w-12 h-4 bg-white/20 rounded" />
      </div>
      <div className="text-white/50 p-2 rounded-full animate-pulse">
        <ShoppingCart className="w-6 h-6" />
      </div>
    </div>
  );
} 