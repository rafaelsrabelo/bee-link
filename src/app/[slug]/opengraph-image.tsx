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
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2c3e50',
          padding: 60,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 20%, rgba(133, 99, 66, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(107, 79, 53, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 40% 60%, rgba(166, 124, 82, 0.02) 0%, transparent 50%)
            `,
          }}
        />

        {/* Elegant Border */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            border: '1px solid rgba(133, 99, 66, 0.1)',
            borderRadius: 16,
          }}
        />

        {/* Main Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          {/* Elegant Logo Container */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #856342 0%, #6B4F35 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 40,
              boxShadow: '0 8px 32px rgba(133, 99, 66, 0.2)',
              border: '3px solid rgba(255, 255, 255, 0.9)',
            }}
          >
            <span
              style={{
                color: 'white',
                fontSize: 36,
                fontWeight: '300',
                letterSpacing: '2px',
              }}
            >
              L
            </span>
          </div>

          {/* Store Name */}
          <h1
            style={{
              fontSize: 48,
              fontWeight: '300',
              marginBottom: 16,
              textAlign: 'center',
              color: '#2c3e50',
              letterSpacing: '1px',
            }}
          >
            {store.store_name}
          </h1>

          {/* Elegant Divider */}
          <div
            style={{
              width: 60,
              height: 2,
              background: 'linear-gradient(90deg, transparent 0%, #856342 50%, transparent 100%)',
              marginBottom: 24,
            }}
          />

          {/* Description */}
          <p
            style={{
              fontSize: 20,
              marginBottom: 40,
              textAlign: 'center',
              color: '#6c757d',
              fontWeight: '300',
              lineHeight: 1.6,
              maxWidth: 600,
            }}
          >
            {store.description}
          </p>

          {/* Professional Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: 'rgba(133, 99, 66, 0.05)',
              borderRadius: 50,
              border: '1px solid rgba(133, 99, 66, 0.1)',
              fontSize: 14,
              color: '#856342',
              fontWeight: '400',
              letterSpacing: '0.5px',
            }}
          >
            <span style={{ fontSize: 16 }}>🐝</span>
            <span>Criado com Bee Link</span>
          </div>
        </div>

        {/* Subtle Corner Accents */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 60,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'rgba(133, 99, 66, 0.2)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 60,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(107, 79, 53, 0.15)',
          }}
        />
      </div>
    ),
    size
  );
} 