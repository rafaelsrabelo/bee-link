'use client';

import Lottie from 'lottie-react';

interface LottieLoaderProps {
  animationData?: unknown; // JSON do Lottie
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  color?: string; // Cor personalizada para a animação
}

export default function LottieLoader({ 
  animationData, 
  size = 'md', 
  text,
  className = '',
  color = '#8B5CF6' // Cor padrão roxa
}: LottieLoaderProps) {
  // Animação padrão simples (será substituída pelo JSON que você baixar)
  const defaultAnimation = {
    v: "5.7.4",
    fr: 60,
    ip: 0,
    op: 120,
    w: 200,
    h: 200,
    nm: "Loading",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Circle",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 1, k: [{ i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 0, s: [0] }, { t: 120, s: [360] }] },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                d: 1,
                ty: "el",
                s: { a: 0, k: [80, 80] },
                p: { a: 0, k: [0, 0] }
              },
              {
                ty: "st",
                c: { a: 0, k: [0.545, 0.361, 0.965, 1] }, // Cor roxa padrão
                o: { a: 0, k: 100 },
                w: { a: 0, k: 8 },
                lc: 2,
                lj: 1
              },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 },
                sk: { a: 0, k: 0 },
                sa: { a: 0, k: 0 }
              }
            ],
            nm: "Ellipse Path 1",
            mn: "ADBE Vector Shape - Ellipse",
            hd: false
          }
        ],
        ip: 0,
        op: 120,
        st: 0,
        bm: 0
      }
    ],
    markers: []
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  // Função para converter hex para RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [0.545, 0.361, 0.965]; // Cor padrão roxa
  };

  // Aplicar cor personalizada à animação
  const customAnimation = animationData || {
    ...defaultAnimation,
    layers: defaultAnimation.layers.map(layer => ({
      ...layer,
      shapes: layer.shapes?.map(shape => ({
        ...shape,
        it: shape.it?.map(item => {
          if (item.ty === "st") {
            const [r, g, b] = hexToRgb(color);
            return {
              ...item,
              c: { a: 0, k: [r, g, b, 1] }
            };
          }
          return item;
        })
      }))
    }))
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={sizeClasses[size]}>
        <Lottie 
          animationData={customAnimation}
          loop={true}
          autoplay={true}
        />
      </div>
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
} 