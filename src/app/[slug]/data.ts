// Dados das lojas (futuramente virá de um banco de dados)
export const stores = {
  lessari: {
    store_name: "Lessari",
    description: "Bolsas de crochê autorais & feitas à mão",
    slug: "lessari",
    logo: "/lessari/logo.jpeg",
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
      { 
        image: "/lessari/media-alca-removivel.JPG", 
        price: "R$ 69,99", 
        name: "Bolsa média alça removível", 
        category: "bag",
        description: "Bolsa média versátil com alça removível, perfeita para o dia a dia. Confeccionada à mão com fios de crochê de alta qualidade, oferece praticidade e estilo único."
      },
      { 
        image: "/lessari/baguete-marrom.JPG", 
        price: "R$ 49,99", 
        name: "Bolsa baguete marrom", 
        category: "bag",
        description: "Bolsa baguete elegante em tom marrom, compacta e sofisticada. Ideal para carregar seus itens essenciais com muito estilo e charme."
      },
      { 
        image: "/lessari/media-terracota.JPG", 
        price: "R$ 69,99", 
        name: "Bolsa média terracota", 
        category: "bag",
        description: "Bolsa média em cor terracota, espaçosa e confortável. Cada peça é única e confeccionada com muito carinho e dedicação artesanal."
      },
      { 
        image: "/lessari/round-bag.JPG", 
        price: "R$ 99,99", 
        name: "Round bag", 
        category: "bag",
        description: "Round bag com design circular moderno e charmoso. Feita à mão com técnicas tradicionais, combina tradição e contemporaneidade."
      },
      { 
        image: "/lessari/shoulder-bag.JPG", 
        price: "R$ 49,99", 
        name: "Shoulder bag", 
        category: "bag",
        description: "Shoulder bag confortável e estilosa, perfeita para o uso diário. Confeccionada manualmente com atenção aos detalhes."
      },
      { 
        image: "/lessari/media-off-white.JPG", 
        price: "R$ 69,99", 
        name: "Bolsa média off white", 
        category: "bag",
        description: "Bolsa média em cor off white, elegante e versátil. Cada peça é única e traz consigo a dedicação de horas de trabalho manual."
      },
      { 
        image: "/lessari/baguete-terracota.JPG", 
        price: "R$ 49,99", 
        name: "Bolsa baguete terracota", 
        category: "bag",
        description: "Bolsa baguete em cor terracota, compacta e charmosa. Ideal para quem busca praticidade sem abrir mão do estilo artesanal."
      }
    ]
  },
  "dindin-da-leia": {
    store_name: "Dindin da Leia",
    description: "Muito sabor e carinho desde 2016",
    slug: "dindin-da-leia",
    logo: "/dindin-da-leia/logo.png",
    colors: {
      primary: "#FE3F5C", // Vermelho salmão
      secondary: "#007AC4", // Azul
      accent: "#FF6B8A" // Rosa claro (accent escolhido)
    },
    social_networks: {
      instagram: "dindin.daleia",
      whatsapp: "+5585996826836"
    },
    products: [
      { 
        image: "/dindin-da-leia/produto-teste.jpg", 
        price: "R$ 25,00", 
        name: "Ninho com Nutella", 
        category: "default",
        description: "Delicioso ninho preparado com ingredientes frescos e muito amor. Cada receita é única e traz consigo anos de experiência culinária."
      }
    ]
  }
};

export type StoreData = typeof stores.lessari;

// Tipo para produto com descrição
export interface Product {
  name: string;
  price: string;
  image: string;
  category: string;
  description: string;
} 