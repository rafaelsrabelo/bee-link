const { createServer } = require('node:http');
const { initializeWebSocketServer } = require('./src/lib/websocket-server.js');

const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.WS_PORT || 3001;

// Criar servidor HTTP simples para WebSocket
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'WebSocket Server Running',
    timestamp: new Date().toISOString(),
    connections: getWebSocketManager().getStats()
  }));
});

// Inicializar servidor WebSocket
initializeWebSocketServer(server);

// Iniciar servidor
server.listen(port, () => {
  console.log(`🔌 WebSocket Server rodando em http://${hostname}:${port}`);
  console.log(`📡 WebSocket disponível em ws://${hostname}:${port}`);
});

// Função para obter o gerenciador WebSocket
function getWebSocketManager() {
  const { getWebSocketManager } = require('./src/lib/websocket-server.js');
  return getWebSocketManager();
}
