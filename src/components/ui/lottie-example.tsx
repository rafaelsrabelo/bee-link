'use client';

import LottieLoader from './lottie-loader';

// Exemplo de como usar o componente com um arquivo JSON do Lottie
export default function LottieExample() {
  // Quando você baixar um arquivo JSON do LottieFiles, você pode:
  
  // 1. Importar diretamente (se o arquivo estiver na pasta public)
  // import loadingAnimation from '/public/animations/loading.json';
  
  // 2. Ou colocar o JSON inline (como neste exemplo)
  const customAnimation = {
    // Cole aqui o conteúdo do arquivo JSON que você baixou do LottieFiles
    // Exemplo:
    v: "5.7.4",
    fr: 60,
    ip: 0,
    op: 120,
    w: 200,
    h: 200,
    nm: "Custom Loading",
    // ... resto do JSON
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Loading Padrão</h3>
        <LottieLoader text="Carregando..." />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Loading Customizado</h3>
        <LottieLoader 
          animationData={customAnimation}
          text="Carregando com animação customizada..." 
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Diferentes Tamanhos</h3>
        <div className="flex gap-8">
          <LottieLoader size="sm" text="Pequeno" />
          <LottieLoader size="md" text="Médio" />
          <LottieLoader size="lg" text="Grande" />
        </div>
      </div>
    </div>
  );
}

/*
INSTRUÇÕES PARA USAR ARQUIVO JSON DO LOTTIE:

1. Vá para https://lottiefiles.com/
2. Procure por uma animação de loading que você goste
3. Clique na animação e depois em "Download"
4. Escolha "Lottie JSON" como formato
5. Salve o arquivo .json na pasta public/animations/ (crie a pasta se não existir)
6. Importe o arquivo no seu componente:

import loadingAnimation from '/public/animations/seu-arquivo.json';

7. Use no componente:

<LottieLoader 
  animationData={loadingAnimation}
  text="Carregando..." 
/>

OU

8. Cole o conteúdo do JSON diretamente no componente:

const customAnimation = {
  // Cole aqui o conteúdo do arquivo JSON
};

<LottieLoader 
  animationData={customAnimation}
  text="Carregando..." 
/>
*/ 