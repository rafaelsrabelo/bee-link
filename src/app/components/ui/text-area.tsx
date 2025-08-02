import { cn } from "@/app/lib/utils";

export default function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={cn(
        `w-full px-3 py-2 md:px-4 md:py-3 bg-background-secondary text-content-headline placeholder:text-content-placeholder rounded-xl 
        border border-border-primary hover:border-border-secondary focus:border-accent-purple focus:outline-none 
        transition-all duration-200 shadow-sm resize-none min-h-[80px] md:min-h-[100px] text-sm md:text-base`,
        props.className
      )}
    />
  );
}