import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// Ler produtos do Supabase
async function readProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao ler produtos:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao ler produtos:', error);
    return [];
  }
}

// Salvar produtos no Supabase
async function saveProducts(products: any[]) {
  try {
    // Primeiro, deletar todos os produtos existentes
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .neq('id', 0); // Deletar todos
    
    if (deleteError) {
      console.error('Erro ao deletar produtos:', deleteError);
      return false;
    }
    
    // Depois, inserir os novos produtos
    if (products.length > 0) {
      const { error: insertError } = await supabase
        .from('products')
        .insert(products);
      
      if (insertError) {
        console.error('Erro ao inserir produtos:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar produtos:', error);
    return false;
  }
}

// GET - Buscar produtos
export async function GET() {
  try {
    const products = await readProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro no GET:', error);
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
    console.error('Erro no POST:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar produtos' },
      { status: 500 }
    );
  }
} 