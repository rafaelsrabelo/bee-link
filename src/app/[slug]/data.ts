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
      whatsapp: "+558594100683",
      tiktok: "",
      spotify: "",
      youtube: ""
    },
    products: []
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

export type StoreData = {
  store_name: string;
  description: string;
  slug: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  social_networks: {
    instagram: string;
    whatsapp: string;
  };
  products: Array<{
    name: string;
    price: string;
    image: string;
    category: string;
    description: string;
    readyToShip?: boolean;
  }>;
};

// Tipo para produto com descrição
export interface Product {
  name: string;
  price: string;
  image: string;
  category: string;
  description: string;
  readyToShip?: boolean;
  available?: boolean;
}

 