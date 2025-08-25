const { Server: SocketIOServer } = require('socket.io');

class WebSocketManager {
  constructor() {
    this.io = null;
    this.storeConnections = new Map(); // storeId -> Set<socketId>
    this.userConnections = new Map(); // userId -> Set<socketId>
  }

  initialize(server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    console.log('🚀 WebSocket Server inicializado');
  }

  setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`🔌 Cliente conectado: ${socket.id}`);

      // Inscrever em atualizações de uma loja específica
      socket.on('subscribe_store', (storeId) => {
        socket.join(`store:${storeId}`);
        this.addStoreConnection(storeId, socket.id);
        console.log(`📡 Socket ${socket.id} inscrito na loja ${storeId}`);
      });

      // Cancelar inscrição de uma loja
      socket.on('unsubscribe_store', (storeId) => {
        socket.leave(`store:${storeId}`);
        this.removeStoreConnection(storeId, socket.id);
        console.log(`📡 Socket ${socket.id} cancelou inscrição na loja ${storeId}`);
      });

      // Ping/Pong para manter conexão ativa
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Desconexão
      socket.on('disconnect', () => {
        console.log(`🔌 Cliente desconectado: ${socket.id}`);
        this.removeSocketConnections(socket.id);
      });
    });
  }

  // Métodos para gerenciar conexões
  addStoreConnection(storeId, socketId) {
    if (!this.storeConnections.has(storeId)) {
      this.storeConnections.set(storeId, new Set());
    }
    this.storeConnections.get(storeId)?.add(socketId);
  }

  removeStoreConnection(storeId, socketId) {
    const connections = this.storeConnections.get(storeId);
    if (connections) {
      connections.delete(socketId);
      if (connections.size === 0) {
        this.storeConnections.delete(storeId);
      }
    }
  }

  addUserConnection(userId, socketId) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)?.add(socketId);
  }

  removeUserConnection(userId, socketId) {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.delete(socketId);
      if (connections.size === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  removeSocketConnections(socketId) {
    // Remover de todas as lojas
    for (const [storeId, connections] of this.storeConnections.entries()) {
      if (connections.has(socketId)) {
        this.removeStoreConnection(storeId, socketId);
      }
    }

    // Remover de todos os usuários
    for (const [userId, connections] of this.userConnections.entries()) {
      if (connections.has(socketId)) {
        this.removeUserConnection(userId, socketId);
      }
    }
  }

  // Métodos para enviar mensagens
  emitToStore(storeId, event, data) {
    if (!this.io) return;
    
    this.io.to(`store:${storeId}`).emit(event, data);
    console.log(`📤 Enviado para loja ${storeId}: ${event}`, data);
  }

  emitToUser(userId, event, data) {
    if (!this.io) return;
    
    const userSockets = this.userConnections.get(userId);
    if (userSockets) {
      for (const socketId of userSockets) {
        this.io.to(socketId).emit(event, data);
      }
      console.log(`📤 Enviado para usuário ${userId}: ${event}`, data);
    }
  }

  emitToAll(event, data) {
    if (!this.io) return;
    
    this.io.emit(event, data);
    console.log(`📤 Enviado para todos: ${event}`, data);
  }

  // Métodos específicos para pedidos
  notifyNewOrder(storeId, order) {
    this.emitToStore(storeId, 'new_order', {
      type: 'new_order',
      data: order,
      storeId,
      timestamp: new Date().toISOString()
    });
  }

  notifyOrderUpdate(storeId, order) {
    this.emitToStore(storeId, 'order_update', {
      type: 'order_update',
      data: order,
      storeId,
      timestamp: new Date().toISOString()
    });
  }

  notifyOrderDelete(storeId, orderId) {
    this.emitToStore(storeId, 'order_delete', {
      type: 'order_delete',
      data: { id: orderId },
      storeId,
      timestamp: new Date().toISOString()
    });
  }

  notifyPendingOrdersCount(storeId, count) {
    this.emitToStore(storeId, 'pending_orders_count', {
      type: 'pending_orders_count',
      data: { count },
      storeId,
      timestamp: new Date().toISOString()
    });
  }

  // Estatísticas
  getStats() {
    return {
      totalConnections: this.io?.engine.clientsCount || 0,
      storeConnections: Object.fromEntries(
        Array.from(this.storeConnections.entries()).map(([storeId, connections]) => [
          storeId,
          connections.size
        ])
      ),
      userConnections: Object.fromEntries(
        Array.from(this.userConnections.entries()).map(([userId, connections]) => [
          userId,
          connections.size
        ])
      )
    };
  }
}

// Instância singleton
const websocketManager = new WebSocketManager();

// Função para inicializar o servidor WebSocket
function initializeWebSocketServer(server) {
  websocketManager.initialize(server);
}

// Função para obter a instância do servidor
function getWebSocketManager() {
  return websocketManager;
}

module.exports = {
  initializeWebSocketServer,
  getWebSocketManager,
  websocketManager
};
