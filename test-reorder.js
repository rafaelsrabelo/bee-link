// Script para testar as APIs de reordenação
const testReorder = async () => {
  const baseUrl = 'http://localhost:3000';
  const storeSlug = 'lessari';

  console.log('🧪 Testando APIs de reordenação...\n');

  // Teste 1: Reordenação de categorias
  console.log('1️⃣ Testando reordenação de categorias...');
  try {
    const categoriesResponse = await fetch(`${baseUrl}/api/stores/${storeSlug}/categories/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categories: [
          { id: 39, sort_order: 0 },
          { id: 40, sort_order: 1 },
          { id: 36, sort_order: 2 }
        ]
      })
    });

    const categoriesResult = await categoriesResponse.json();
    console.log('Status:', categoriesResponse.status);
    console.log('Resposta:', JSON.stringify(categoriesResult, null, 2));
  } catch (error) {
    console.error('❌ Erro na reordenação de categorias:', error.message);
  }

  console.log('\n2️⃣ Testando reordenação de produtos...');
  try {
    const productsResponse = await fetch(`${baseUrl}/api/stores/${storeSlug}/products/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        products: [
          { id: '1754851942186406', display_order: 0 },
          { id: '1754852728152451', display_order: 1 },
          { id: '175485216478070', display_order: 2 }
        ]
      })
    });

    const productsResult = await productsResponse.json();
    console.log('Status:', productsResponse.status);
    console.log('Resposta:', JSON.stringify(productsResult, null, 2));
  } catch (error) {
    console.error('❌ Erro na reordenação de produtos:', error.message);
  }
};

// Executar o teste
testReorder();
