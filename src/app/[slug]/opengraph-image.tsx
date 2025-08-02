import { ImageResponse } from 'next/og';
import { stores } from './data';

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
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Image Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #856342 0%, #6B4F35 100%)',
            opacity: 0.8,
          }}
        />

        {/* Decorative Elements - Bolas decorativas */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '5%',
            width: '15%',
            height: '15%',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '15%',
            right: '10%',
            width: '10%',
            height: '10%',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '15%',
            width: '20%',
            height: '20%',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '40%',
            right: '5%',
            width: '12%',
            height: '12%',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '25%',
            left: '10%',
            width: '18%',
            height: '18%',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '35%',
            right: '15%',
            width: '25%',
            height: '25%',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }}
        />

        {/* Marble texture elements */}
        <div
          style={{
            position: 'absolute',
            top: '25%',
            right: '-10%',
            width: '30%',
            height: '30%',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            transform: 'translateX(50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '-12%',
            width: '35%',
            height: '35%',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            transform: 'translateX(-50%)',
          }}
        />

        {/* Conteúdo principal */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
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
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
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
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
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
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
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
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
            }}
          >
            <span>🐝</span>
            <span>Criado com Bee Link</span>
          </div>
        </div>
      </div>
    ),
    size
  );
} 