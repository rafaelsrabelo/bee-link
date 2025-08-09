import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OrderData {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address?: string;
  delivery_type?: 'delivery' | 'pickup';
  delivery_cep?: string;
  delivery_city?: string;
  delivery_state?: string;
  payment_method?: 'money' | 'pix' | 'credit_card' | 'debit_card';
  items: OrderItem[];
  total: number;
  status: string;
  notes?: string;
  created_at: string;
  delivery_fee?: number;
  coupon_discount?: number;
  stores: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    address?: {
      street?: string;
      number?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zip_code?: string;
      complement?: string;
    };
    colors?: Record<string, string>;
    social_networks?: {
      whatsapp?: string;
      instagram?: string;
      tiktok?: string;
      youtube?: string;
      spotify?: string;
    };
  };
}

// Para ambiente browser, vamos criar uma API que gera o formato ESC/POS como texto
// O navegador não pode acessar diretamente impressoras USB
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();
    
    console.log('🖨️ API Impressão - OrderID recebido:', orderId);

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido é obrigatório' },
        { status: 400 }
      );
    }

    // 1. Buscar o pedido primeiro
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    console.log('🔍 Pedido encontrado:', { orderData, orderError });

    if (orderError || !orderData) {
      console.error('❌ Erro ao buscar pedido:', orderError);
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // 2. Buscar a loja separadamente
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, name, slug, logo, address, colors, social_networks')
      .eq('id', orderData.store_id)
      .single();

    console.log('🏪 Loja encontrada:', { storeData, storeError });

    if (storeError || !storeData) {
      console.error('❌ Erro ao buscar loja:', storeError);
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      );
    }

    // 3. Combinar os dados
    const order = {
      ...orderData,
      stores: storeData
    };

    // Gerar o conteúdo formatado para impressão
    const printContent = generatePrintContent(order);

    return NextResponse.json({
      success: true,
      content: printContent,
      // Para uso futuro com impressoras via driver/plugin
      escposCommands: generateESCPOSCommands(order)
    });

  } catch (error) {
    console.error('Erro ao gerar impressão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function generatePrintContent(order: OrderData): string {
  const store = order.stores;
  const createdAt = new Date(order.created_at);
  
  let content = '';
  
  // Cabeçalho
  content += '================================\n';
  content += `    ${store.name.toUpperCase()}\n`;
  content += '================================\n';
  content += '\n';
  
  // Informações do pedido
  content += `Pedido: #${order.id.slice(-8)}\n`;
  content += `Data: ${createdAt.toLocaleDateString('pt-BR')}\n`;
  content += `Hora: ${createdAt.toLocaleTimeString('pt-BR')}\n`;
  content += `Status: ${getStatusText(order.status)}\n`;
  content += '\n';
  
  // Dados do cliente
  content += '--- DADOS DO CLIENTE ---\n';
  content += `Nome: ${order.customer_name}\n`;
  content += `Telefone: ${order.customer_phone}\n`;
  
  if (order.delivery_type === 'delivery' && order.delivery_address) {
    content += `Endereço: ${order.delivery_address}\n`;
    if (order.delivery_cep) content += `CEP: ${order.delivery_cep}\n`;
    if (order.delivery_city) content += `Cidade: ${order.delivery_city}\n`;
  } else {
    content += 'Tipo: RETIRADA NO LOCAL\n';
  }
  content += '\n';
  
  // Itens do pedido
  content += '--- ITENS DO PEDIDO ---\n';
  let subtotal = 0;
  
  for (const item of order.items) {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    
    content += `${item.quantity}x ${item.name}\n`;
    content += `    R$ ${item.price.toFixed(2)} cada\n`;
    content += `    Total: R$ ${itemTotal.toFixed(2)}\n`;
    content += '\n';
  }
  
  // Totais
  content += '================================\n';
  content += `Subtotal: R$ ${subtotal.toFixed(2)}\n`;
  
  if (order.delivery_fee && order.delivery_fee > 0) {
    content += `Taxa de entrega: R$ ${order.delivery_fee.toFixed(2)}\n`;
  }
  
  if (order.coupon_discount && order.coupon_discount > 0) {
    content += `Desconto: -R$ ${order.coupon_discount.toFixed(2)}\n`;
  }
  
  content += '================================\n';
  content += `TOTAL: R$ ${order.total.toFixed(2)}\n`;
  content += '================================\n';
  content += '\n';
  
  // Método de pagamento
  if (order.payment_method) {
    content += `Pagamento: ${getPaymentMethodText(order.payment_method)}\n`;
    content += '\n';
  }
  
  // Observações
  if (order.notes) {
    content += '--- OBSERVAÇÕES ---\n';
    content += `${order.notes}\n`;
    content += '\n';
  }
  
  // Rodapé
  if (store.social_networks?.whatsapp) {
    content += `WhatsApp: ${store.social_networks.whatsapp}\n`;
  }
  content += '\n';
  content += '    Obrigado pela preferência!\n';
  content += '================================\n';
  
  return content;
}

function generateESCPOSCommands(order: OrderData): string[] {
  // Comandos ESC/POS básicos para impressoras térmicas
  const commands = [];
  const store = order.stores;
  const createdAt = new Date(order.created_at);
  
  // Inicializar impressora
  commands.push('\x1b\x40'); // ESC @ - inicializar
  
  // Cabeçalho centralizado e em negrito
  commands.push('\x1b\x61\x01'); // centralizar
  commands.push('\x1b\x45\x01'); // negrito on
  commands.push('================================\n');
  commands.push(`    ${store.name.toUpperCase()}\n`);
  commands.push('================================\n\n');
  commands.push('\x1b\x45\x00'); // negrito off
  commands.push('\x1b\x61\x00'); // alinhamento à esquerda
  
  // Informações do pedido
  commands.push(`Pedido: #${order.id.slice(-8)}\n`);
  commands.push(`Data: ${createdAt.toLocaleDateString('pt-BR')}\n`);
  commands.push(`Hora: ${createdAt.toLocaleTimeString('pt-BR')}\n`);
  commands.push(`Status: ${getStatusText(order.status)}\n\n`);
  
  // Continuar com o resto do conteúdo...
  // (implementação completa dos comandos ESC/POS)
  
  // Cortar papel
  commands.push('\x1d\x56\x42\x00'); // GS V B 0 - corte total
  
  return commands;
}

function getStatusText(status: string): string {
  const statusMap = {
    'pending': 'PENDENTE',
    'accepted': 'ACEITO',
    'preparing': 'PREPARANDO',
    'delivering': 'SAIU PARA ENTREGA',
    'delivered': 'ENTREGUE',
    'cancelled': 'CANCELADO'
  };
  return statusMap[status as keyof typeof statusMap] || status.toUpperCase();
}

function getPaymentMethodText(method: string): string {
  const methodMap = {
    'money': 'DINHEIRO',
    'pix': 'PIX',
    'credit_card': 'CARTÃO DE CRÉDITO',
    'debit_card': 'CARTÃO DE DÉBITO'
  };
  return methodMap[method as keyof typeof methodMap] || method.toUpperCase();
}
