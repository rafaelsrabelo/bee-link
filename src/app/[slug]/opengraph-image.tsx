import { ImageResponse } from 'next/og';
import { stores } from './page';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const store = stores[params.slug as keyof typeof stores];

  if (!store) {
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #856342 0%, #6B4F35 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <h1 style={{ fontSize: 48, marginBottom: 16 }}>Loja não encontrada</h1>
        </div>
      ),
      size
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #856342 0%, #6B4F35 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: 40,
        }}
      >
        {/* Logo da loja */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            backgroundColor: '#A67C52',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            fontSize: 48,
            fontWeight: 'bold',
          }}
        >
          L
        </div>

        {/* Nome da loja */}
        <h1
          style={{
            fontSize: 64,
            fontWeight: 'bold',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          {store.store_name}
        </h1>

        {/* Descrição */}
        <p
          style={{
            fontSize: 24,
            marginBottom: 32,
            textAlign: 'center',
            opacity: 0.9,
            maxWidth: 800,
          }}
        >
          {store.description}
        </p>

        {/* Bee Link branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 18,
            opacity: 0.8,
          }}
        >
          <span>🐝</span>
          <span>Criado com Bee Link</span>
        </div>
      </div>
    ),
    size
  );
} 