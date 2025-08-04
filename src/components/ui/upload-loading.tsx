'use client';

import Lottie from 'lottie-react';
import loadingAnimation from '../../../public/animations/loading-dots-blue.json';

interface UploadLoadingProps {
  text?: string;
}

export default function UploadLoading({ text = "Fazendo upload da imagem..." }: UploadLoadingProps) {
  // Animação de upload (você pode substituir por um arquivo JSON do Lottie)
  const uploadAnimation = {
    v: "5.7.4",
    fr: 60,
    ip: 0,
    op: 180,
    w: 200,
    h: 200,
    nm: "Upload",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Upload Icon",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
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
                ty: "rc",
                s: { a: 0, k: [60, 80] },
                p: { a: 0, k: [0, 0] },
                r: { a: 0, k: 8 }
              },
              {
                ty: "fl",
                c: { a: 0, k: [0.52, 0.39, 0.26, 1] },
                o: { a: 0, k: 100 },
                r: 1,
                bm: 0,
                nm: "Fill 1",
                mn: "ADBE Vector Graphic - Fill",
                hd: false
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
            nm: "Rectangle 1",
            mn: "ADBE Vector Shape - Rect",
            hd: false
          },
          {
            ty: "gr",
            it: [
              {
                d: 1,
                ty: "el",
                s: { a: 0, k: [20, 20] },
                p: { a: 0, k: [0, -30] }
              },
              {
                ty: "fl",
                c: { a: 0, k: [0.52, 0.39, 0.26, 1] },
                o: { a: 0, k: 100 },
                r: 1,
                bm: 0,
                nm: "Fill 1",
                mn: "ADBE Vector Graphic - Fill",
                hd: false
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
            nm: "Ellipse 1",
            mn: "ADBE Vector Shape - Ellipse",
            hd: false
          }
        ],
        ip: 0,
        op: 180,
        st: 0,
        bm: 0
      }
    ],
    markers: []
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl">
      <div className="w-20 h-20">
        <Lottie 
          animationData={loadingAnimation}
          loop={true}
          autoplay={true}
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">{text}</p>
        <p className="text-xs text-gray-500 mt-1">Aguarde um momento...</p>
      </div>
    </div>
  );
} 