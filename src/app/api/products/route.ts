import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const productsFilePath = path.join(process.cwd(), 'data', 'products.json');

// Garantir que o diretório existe
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Produtos padrão para inicialização
const defaultProducts = [
  {
    id: '1',
    image: "/lessari/media-alca-removivel.JPG",
    price: "R$ 69,99",
    name: "Bolsa média alça removível",
    category: "bag",
    description: "Bolsa média versátil com alça removível, perfeita para o dia a dia. Confeccionada à mão com fios de crochê de alta qualidade, oferece praticidade e estilo único.",
    readyToShip: false,
    available: true
  },
  {
    id: '2',
    image: "/lessari/baguete-marrom.JPG",
    price: "R$ 49,99",
    name: "Bolsa baguete marrom",
    category: "bag",
    description: "Bolsa baguete elegante em tom marrom, compacta e sofisticada. Ideal para carregar seus itens essenciais com muito estilo e charme.",
    readyToShip: true,
    available: true
  },
  {
    id: '3',
    image: "/lessari/media-terracota.JPG",
    price: "R$ 69,99",
    name: "Bolsa média terracota",
    category: "bag",
    description: "Bolsa média em cor terracota, espaçosa e confortável. Cada peça é única e confeccionada com muito carinho e dedicação artesanal.",
    readyToShip: true,
    available: true
  },
  {
    id: '4',
    image: "/lessari/round-bag.JPG",
    price: "R$ 99,99",
    name: "Round bag",
    category: "bag",
    description: "Round bag com design circular moderno e charmoso. Feita à mão com técnicas tradicionais, combina tradição e contemporaneidade.",
    readyToShip: true,
    available: true
  },
  {
    id: '5',
    image: "/lessari/shoulder-bag.JPG",
    price: "R$ 49,99",
    name: "Shoulder bag",
    category: "bag",
    description: "Shoulder bag confortável e estilosa, perfeita para o uso diário. Confeccionada manualmente com atenção aos detalhes.",
    readyToShip: true,
    available: true
  },
  {
    id: '6',
    image: "/lessari/media-off-white.JPG",
    price: "R$ 69,99",
    name: "Bolsa média off white",
    category: "bag",
    description: "Bolsa média em cor off white, elegante e versátil. Cada peça é única e traz consigo a dedicação de horas de trabalho manual.",
    readyToShip: false,
    available: true
  },
  {
    id: '7',
    image: "/lessari/baguete-terracota.JPG",
    price: "R$ 49,99",
    name: "Bolsa baguete terracota",
    category: "bag",
    description: "Bolsa baguete em cor terracota, compacta e charmosa. Ideal para quem busca praticidade sem abrir mão do estilo artesanal.",
    readyToShip: true,
    available: true
  }
];

// Ler produtos do arquivo JSON
async function readProducts() {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(productsFilePath, 'utf-8');
    const products = JSON.parse(data);
    
    // Se o arquivo estiver vazio ou não tiver produtos, inicializar com produtos padrão
    if (!products || products.length === 0) {
      await saveProducts(defaultProducts);
      return defaultProducts;
    }
    
    return products;
  } catch (error) {
    // Se o arquivo não existe, criar com produtos padrão
    await saveProducts(defaultProducts);
    return defaultProducts;
  }
}

// Salvar produtos no arquivo JSON
async function saveProducts(products: unknown[]) {
  await ensureDataDirectory();
  await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2));
}

// GET - Buscar produtos
export async function GET() {
  try {
    const products = await readProducts();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}

// POST - Salvar produtos
export async function POST(request: NextRequest) {
  try {
    const products = await request.json();
    await saveProducts(products);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao salvar produtos' },
      { status: 500 }
    );
  }
} 