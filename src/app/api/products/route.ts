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
      console.error('Erro ao ler produtos:', error);
      return [];
    }
    
    console.log('Debug - Produtos lidos com sucesso:', data);
    return data || [];
  } catch (error) {
    console.error('Erro ao ler produtos:', error);
    return [];
  }
}

// Salvar produtos no Supabase
async function saveProducts(products: any[]) {
  try {
    console.log('Debug - Tentando salvar produtos:', products);
    
    // Primeiro, deletar todos os produtos existentes
    console.log('Debug - Deletando produtos existentes...');
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .neq('id', 0); // Deletar todos
    
    if (deleteError) {
      console.error('Erro ao deletar produtos:', deleteError);
      return false;
    }
    
    console.log('Debug - Produtos deletados com sucesso');
    
    // Depois, inserir os novos produtos
    if (products.length > 0) {
      console.log('Debug - Inserindo novos produtos...');
      const { data, error: insertError } = await supabase
        .from('products')
        .insert(products)
        .select();
      
      if (insertError) {
        console.error('Erro ao inserir produtos:', insertError);
        return false;
      }
      
      console.log('Debug - Produtos inseridos com sucesso:', data);
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