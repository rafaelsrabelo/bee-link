import { v2 as cloudinary } from 'cloudinary';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Configurar Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('Cloudinary Config:', {
  cloudName: cloudName ? '✅ Set' : '❌ Missing',
  apiKey: apiKey ? '✅ Set' : '❌ Missing',
  apiSecret: apiSecret ? '✅ Set' : '❌ Missing'
});

cloudinary.config({
  cloud_name: cloudName || 'demo',
  api_key: apiKey || 'demo',
  api_secret: apiSecret || 'demo'
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhuma imagem foi enviada' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Arquivo deve ser uma imagem' },
        { status: 400 }
      );
    }

    // Validar tamanho (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Imagem deve ter menos de 5MB' },
        { status: 400 }
      );
    }

    // Converter File para base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload para Cloudinary
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'bee-link-products',
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    return NextResponse.json({
      success: true,
      imageUrl: result.secure_url,
      fileName: result.public_id
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 