import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

interface PrintSettings {
  default_printer: string;
  auto_print: boolean;
  print_format: 'thermal' | 'a4';
  paper_width: number;
  auto_cut: boolean;
  print_logo: boolean;
  print_address: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    console.log('🔍 Buscando configurações de impressão para loja:', slug);

    // Primeiro verificar se a loja existe de forma simples
    const { data: simpleStore, error: simpleError } = await supabase
      .from('stores')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();

    console.log('🔍 Teste simples da loja:', { simpleStore, simpleError });

    if (simpleError || !simpleStore) {
      console.error('❌ Loja não encontrada no teste simples');
      return NextResponse.json(
        { error: 'Loja não encontrada (teste simples)' },
        { status: 404 }
      );
    }

    // Agora buscar com print_settings
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, print_settings')
      .eq('slug', slug)
      .single();

    console.log('📊 Resultado da busca completa:', { store, storeError });

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      );
    }

    // Retornar configurações de impressão ou configurações padrão
    const defaultSettings: PrintSettings = {
      default_printer: '',
      auto_print: false,
      print_format: 'thermal',
      paper_width: 80,
      auto_cut: true,
      print_logo: true,
      print_address: true
    };

    return NextResponse.json({
      print_settings: store.print_settings || defaultSettings
    });

  } catch (error) {
    console.error('Erro ao buscar configurações de impressão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { print_settings } = await request.json();

    console.log('💾 Salvando configurações de impressão:', { slug, print_settings });

    // Validar dados
    if (!print_settings) {
      return NextResponse.json(
        { error: 'Configurações de impressão são obrigatórias' },
        { status: 400 }
      );
    }

    // Buscar loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      );
    }

    // Atualizar configurações de impressão
    const { error: updateError } = await supabase
      .from('stores')
      .update({ print_settings })
      .eq('id', store.id);

    if (updateError) {
      console.error('Erro ao atualizar configurações:', updateError);
      return NextResponse.json(
        { error: 'Erro ao salvar configurações' },
        { status: 500 }
      );
    }

    console.log('✅ Configurações de impressão salvas com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Configurações de impressão salvas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao salvar configurações de impressão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
