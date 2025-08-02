import { notFound } from 'next/navigation';
import StorePageClient from './store-page-client';

// Dados das lojas (futuramente virá de um banco de dados)
const stores = {
  lessari: {
    store_name: "Lessari",
    description: "Bolsas de crochê autorais & feitas à mão",
    slug: "lessari",
    logo: "/lessari/logo.png",
    colors: {
      primary: "#856342", // Marrom principal
      secondary: "#6B4F35", // Marrom mais escuro
      accent: "#A67C52" // Marrom mais claro
    },
    social_networks: {
      instagram: "lessaricroche",
      whatsapp: "+558594100683"
    },
    products: [
      { image: "/lessari/image.png", price: "R$ 69,99", name: "Bolsa média alça removível" },
      { image: "/lessari/image2.png", price: "R$ 49,99", name: "Bolsa baguete marrom" },
      { image: "/lessari/image3.png", price: "R$ 69,99", name: "Bolsa média terracota" },
      { image: "/lessari/image4.png", price: "R$ 99,99", name: "Round bag" },
      { image: "/lessari/image5.png", price: "R$ 49,99", name: "Shoulder bag" },
      { image: "/lessari/image6.png", price: "R$ 69,99", name: "Bolsa média off white" },
      { image: "/lessari/image7.png", price: "R$ 49,99", name: "Baguete terracota" }
    ]
  }
};

export type StoreData = typeof stores.lessari;

interface StorePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  const store = stores[slug as keyof typeof stores];

  // Se a loja não existir, mostra página 404
  if (!store) {
    notFound();
  }

  return <StorePageClient store={store} />;
}