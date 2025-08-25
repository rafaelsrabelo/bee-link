import { v2 as cloudinary } from 'cloudinary';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Configurar Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dkd3ajw3s';
const apiKey = process.env.CLOUDINARY_API_KEY || '251789498317919';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'ImemNXOQjT6ET2YuKw5v7S4cjgc';

console.log('🔧 Configurando Cloudinary com:', {
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret ? `***${apiSecret.slice(-4)}` : 'undefined'
});

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

export async function POST(request: NextRequest) {
  try {
    // Debug: verificar se as variáveis estão carregadas
    console.log('🔍 Debug Cloudinary config:');
    console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('API Key:', process.env.CLOUDINARY_API_KEY);
    console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? `***${process.env.CLOUDINARY_API_SECRET.slice(-4)}` : 'undefined');
    
    const formData = await request.formData();
    // Aceitar tanto 'file' quanto 'image' para compatibilidade
    const file = (formData.get('file') || formData.get('image')) as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhuma imagem foi enviada. Selecione uma imagem e tente novamente.' },
        { status: 400 }
      );
    }
    
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'Arquivo vazio. Selecione uma imagem válida.' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato de arquivo inválido. Use JPG, PNG, WebP ou GIF.' },
        { status: 400 }
      );
    }

    // Validar tamanho (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const sizeMB = Math.round(file.size / (1024 * 1024));
      return NextResponse.json(
        { error: `Imagem muito grande (${sizeMB}MB). O tamanho máximo é 5MB.` },
        { status: 400 }
      );
    }

    // Validar dimensões mínimas
    const minWidth = 200;
    const minHeight = 200;

    // Converter File para base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    try {
      // Upload para Cloudinary com configuração básica
      const result = await cloudinary.uploader.upload(base64Image, {
        folder: 'bee-link-products'
      });

      // Verificar se as dimensões são adequadas
      if (result.width < minWidth || result.height < minHeight) {
        // Excluir a imagem do Cloudinary
        await cloudinary.uploader.destroy(result.public_id);
        
        return NextResponse.json(
          { error: `A imagem é muito pequena. Dimensões mínimas: ${minWidth}x${minHeight}px` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        imageUrl: result.secure_url,
        fileName: result.public_id,
        width: result.width,
        height: result.height
      });

    } catch (cloudinaryError) {
      console.error('Erro no Cloudinary:', cloudinaryError);
      return NextResponse.json(
        { error: 'Erro ao processar a imagem. Tente novamente com outra imagem.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
} 