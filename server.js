const { createServer } = require('node:http');
const { parse } = require('node:url');
const next = require('next');
const { initializeWebSocketServer } = require('./src/lib/websocket-server.js');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3001;

// Preparar o app Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Criar servidor HTTP
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Inicializar servidor WebSocket
  initializeWebSocketServer(server);
  console.log('🔌 WebSocket Server inicializado com sucesso');

  // Iniciar servidor
  server.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://${hostname}:${port}`);
    console.log(`🔌 WebSocket disponível em ws://${hostname}:${port}`);
  });
});
