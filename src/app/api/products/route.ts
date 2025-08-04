import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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



// Ler produtos do arquivo JSON
async function readProducts() {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(productsFilePath, 'utf-8');
    const products = JSON.parse(data);
    
    // Retornar produtos ou array vazio
    return products || [];
  } catch (error) {
    // Se o arquivo não existe, retornar array vazio
    return [];
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