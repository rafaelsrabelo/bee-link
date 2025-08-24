// Teste simples das APIs de reordenação
const testSimple = async () => {
  console.log('🧪 Testando APIs de reordenação...\n');

  // Teste 1: Verificar se o campo display_order existe
  console.log('1️⃣ Verificando campos de ordenação...');
  try {
    const response = await fetch('http://localhost:3000/api/test-order');
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Campos existem:', {
      products: data.products.hasDisplayOrder,
      categories: data.categories.hasSortOrder
    });
  } catch (error) {
    console.error('❌ Erro ao verificar campos:', error.message);
  }

  console.log('\n2️⃣ Testando reordenação de categorias...');
  try {
    const response = await fetch('http://localhost:3000/api/stores/lessari/categories/reorder', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categories: [
          { id: 36, sort_order: 0 },
          { id: 48, sort_order: 1 }
        ]
      })
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Resposta:', result);
  } catch (error) {
    console.error('❌ Erro na reordenação de categorias:', error.message);
  }

  console.log('\n3️⃣ Testando reordenação de produtos...');
  try {
    const response = await fetch('http://localhost:3000/api/stores/lessari/products/reorder', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        products: [
          { id: '1754280345286', display_order: 0 },
          { id: '1754280306729', display_order: 1 }
        ]
      })
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Resposta:', result);
  } catch (error) {
    console.error('❌ Erro na reordenação de produtos:', error.message);
  }
};

testSimple();
