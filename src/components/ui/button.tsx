import { cn } from "@/lib/utils";

export default function Button({
  children,
  variant = "primary",
  ...props
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "px-4 py-2 md:px-6 md:py-3 rounded-xl font-medium whitespace-nowrap transition-all duration-200 disabled:opacity-70 text-sm md:text-base",
        variant === "primary" && "bg-accent-purple text-white hover:bg-accent-purple/90 shadow-md",
        variant === "secondary" && "bg-background-tertiary text-content-headline hover:bg-border-secondary border border-border-primary",
        variant === "ghost" && "border border-border-primary text-content-body hover:bg-background-tertiary",
        props.className
      )}
    >
      {children}
    </button>
  );
}