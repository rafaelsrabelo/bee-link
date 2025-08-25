const { createServer } = require('node:http');
const { WebSocketServer } = require('ws');

const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.WS_PORT || 3001;

// Criar servidor HTTP simples
const server = createServer((req, res) => {
  // Endpoint para notificações
  if (req.method === 'POST' && req.url === '/notify') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { storeSlug, eventType, data } = JSON.parse(body);
        notifyStore(storeSlug, eventType, data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('❌ Erro ao processar notificação:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Endpoint de status
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'WebSocket Server Running',
    timestamp: new Date().toISOString(),
    connections: wss.clients.size,
    stats: getStats()
  }));
});

// Criar servidor WebSocket
const wss = new WebSocketServer({ server });

// Armazenar conexões por loja
const storeConnections = new Map();

console.log('🚀 Iniciando servidor WebSocket...');

wss.on('connection', (ws) => {
  console.log('🔌 Nova conexão WebSocket estabelecida');
  
  let currentStore = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📨 Mensagem recebida:', data);
      
      if (data.type === 'subscribe_store') {
        currentStore = data.storeSlug;
        
        // Adicionar à lista de conexões da loja
        if (!storeConnections.has(currentStore)) {
          storeConnections.set(currentStore, new Set());
        }
        storeConnections.get(currentStore).add(ws);
        
        console.log(`📦 Cliente inscrito na loja: ${currentStore}`);
        console.log(`📊 Conexões ativas para ${currentStore}: ${storeConnections.get(currentStore).size}`);
        
        // Enviar confirmação
        ws.send(JSON.stringify({
          type: 'subscribed',
          storeSlug: currentStore,
          message: 'Inscrito com sucesso'
        }));
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 Conexão WebSocket fechada');
    
    // Remover da lista de conexões da loja
    if (currentStore && storeConnections.has(currentStore)) {
      storeConnections.get(currentStore).delete(ws);
      
      // Se não há mais conexões para esta loja, remover a entrada
      if (storeConnections.get(currentStore).size === 0) {
        storeConnections.delete(currentStore);
      }
      
      console.log(`📦 Cliente removido da loja: ${currentStore}`);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ Erro na conexão WebSocket:', error);
  });
});

// Função para notificar lojas sobre mudanças
function notifyStore(storeSlug, eventType, data) {
  if (storeConnections.has(storeSlug)) {
    const connections = storeConnections.get(storeSlug);
    const message = JSON.stringify({
      type: eventType,
      data: data,
      timestamp: new Date().toISOString()
    });
    
    connections.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
        console.log(`📤 Notificação enviada para ${storeSlug}: ${eventType}`);
      }
    });
  }
}

// Função para obter estatísticas
function getStats() {
  const stats = {
    totalConnections: wss.clients.size,
    stores: {}
  };
  
  for (const [storeSlug, connections] of storeConnections) {
    stats.stores[storeSlug] = connections.size;
  }
  
  return stats;
}

// Iniciar servidor
server.listen(port, () => {
  console.log(`🔌 WebSocket Server rodando em http://${hostname}:${port}`);
  console.log(`📡 WebSocket disponível em ws://${hostname}:${port}`);
});

// Exportar funções para uso externo
module.exports = {
  notifyStore,
  getStats,
  wss
};
