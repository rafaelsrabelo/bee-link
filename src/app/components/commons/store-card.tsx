import { Instagram, MessageCircle, Music, Phone, Plus, Video } from "lucide-react";
import Button from "../ui/button";

export default function StoreCard() {
  // Objeto com os links sociais - só renderiza se tiver valor
  const socialLinks = {
    instagram: "https://instagram.com/sua_loja",
    tiktok: "", // Vazio, não vai aparecer
    spotify: "", // Vazio, não vai aparecer
    youtubeMusic: "", // Vazio, não vai aparecer
    whatsapp: "https://wa.me/5511999999999",
    telegram: ""  // Vazio, não vai aparecer
  };

  // Mapear ícones para cada rede social
  const iconMap = {
    instagram: Instagram,
    tiktok: Video,
    spotify: Music,
    youtubeMusic: Music,
    whatsapp: MessageCircle,
    telegram: Phone
  };

  // Filtrar apenas links que têm valor
  const activeLinks = Object.entries(socialLinks).filter(([key, url]) => url);

  return (
    <div className="w-full max-w-[348px] mx-auto flex flex-col gap-5 items-center p-6 border border-border-primary bg-background-secondary rounded-3xl shadow-lg">
      <div className="size-32">
        <div className="rounded-full bg-gradient-to-br from-accent-purple to-accent-pink w-full h-full flex items-center justify-center text-3xl font-bold text-white border-2 border-border-primary">
          🏪
        </div>
      </div>
      
      <div className="flex flex-col gap-2 w-full text-center">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-2xl font-bold text-content-headline">
            Nome da sua loja
          </h3>
        </div>
        <p className="text-base text-content-body px-2">
          &ldquo;Uma descrição para sua loja&rdquo;
        </p>
      </div>
      
      <div className="flex flex-col gap-4 w-full">
        <span className="uppercase text-xs font-medium text-content-placeholder text-center">
          Suas Redes
        </span>

        <div className="flex gap-3 justify-center flex-wrap">
          {activeLinks.map(([platform, url]) => {
            const IconComponent = iconMap[platform as keyof typeof iconMap];
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-background-tertiary hover:bg-accent-purple hover:text-white transition-all duration-200 text-content-body"
              >
                <IconComponent size={20} />
              </a>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Button className="w-full bg-accent-purple text-white hover:bg-accent-purple/90">
            Crie seus produtos
          </Button>
          
          {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
          <button className="p-3 rounded-xl bg-background-tertiary hover:bg-accent-purple hover:text-white transition-all duration-200 text-content-body mx-auto">
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}