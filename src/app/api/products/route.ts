import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// Ler produtos do Supabase
async function readProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');
    
    if (error) {
      return [];
    }
    
    return data || [];
  } catch (error) {
    return [];
  }
}

// Salvar produtos no Supabase
async function saveProducts(products: unknown[]) {
  try {
    
    // Primeiro, deletar todos os produtos existentes
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .neq('id', 0); // Deletar todos
    
    if (deleteError) {
      return false;
    }
    
    
    // Depois, inserir os novos produtos
    if (products.length > 0) {
      const { data, error: insertError } = await supabase
        .from('products')
        .insert(products)
        .select();
      
      if (insertError) {
        return false;
      }
      
    }
    
    return true;
  } catch (error) {
    return false;
  }
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
    const success = await saveProducts(products);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Erro ao salvar produtos' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao salvar produtos' },
      { status: 500 }
    );
  }
} 