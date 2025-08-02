import { cn } from "@/app/lib/utils";

export default function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={cn(
        `w-full px-3 py-2 md:px-4 md:py-3 bg-background-secondary text-content-headline placeholder:text-content-placeholder rounded-xl 
        border border-border-primary hover:border-border-secondary focus:border-accent-purple focus:outline-none 
        transition-all duration-200 shadow-sm text-sm md:text-base`,
        props.className
      )}
    />
  );
}