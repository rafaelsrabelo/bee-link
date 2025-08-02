import { TrendingUp } from "lucide-react";

export const TotalVisits = () => {
  return (
    <div className="w-min whitespace-nowrap flex items-center gap-3 bg-background-secondary border border-border-primary px-4 py-2 rounded-xl shadow-lg">
      <span className="font-medium text-sm text-content-body">Total de visitas</span>
      <div className="flex items-center gap-2 text-accent-green">
        <span className="text-xl font-bold">12</span>
        <TrendingUp size={18} />
      </div>
    </div>
  );
}