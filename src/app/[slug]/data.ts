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
      { image: "/lessari/media-alca-removivel.JPG", price: "R$ 69,99", name: "Bolsa média alça removível", category: "bag" },
      { image: "/lessari/baguete-marrom.JPG", price: "R$ 49,99", name: "Bolsa baguete marrom", category: "bag" },
      { image: "/lessari/media-terracota.JPG", price: "R$ 69,99", name: "Bolsa média terracota", category: "bag" },
      { image: "/lessari/round-bag.JPG", price: "R$ 99,99", name: "Round bag", category: "bag" },
      { image: "/lessari/shoulder-bag.JPG", price: "R$ 49,99", name: "Shoulder bag", category: "bag" },
      { image: "/lessari/media-off-white.JPG", price: "R$ 69,99", name: "Bolsa média off white", category: "bag" },
      { image: "/lessari/baguete-terracota.JPG", price: "R$ 49,99", name: "Bolsa baguete terracota", category: "bag" }
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
      { image: "/dindin-da-leia/produto-teste.jpg", price: "R$ 25,00", name: "Ninho com Nutella", category: "default" }
    ]
  }
};

export type StoreData = typeof stores.lessari; 