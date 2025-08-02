import Image from "next/image";
import Link from "next/link";
interface LogoProps {
  className?: string;
}

export const Logo = ({ className = "" }: LogoProps) => {
  return (
    <button 
      type="button"
      onClick={() => { window.location.href = '/'; }}
      title="BeeStore | Página Inicial"
      className={`text-foreground font-bold text-xl hover:text-primary transition-colors ${className}`
    }
    >
      <Image src="/logo.png" alt="BeeLink" width={100} height={100} />
    </button>
  );
}; 