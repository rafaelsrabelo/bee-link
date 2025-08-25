import { Server as SocketIOServer } from 'socket.io';

class WebSocketManager {
  private io: SocketIOServer | null = null;
  private storeConnections: Map<string, Set<string>> = new Map(); // storeId -> Set<socketId>
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>



  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  initialize(server: any) {
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
  addStoreConnection(storeId: string, socketId: string) {
    if (!this.storeConnections.has(storeId)) {
      this.storeConnections.set(storeId, new Set());
    }
    this.storeConnections.get(storeId)?.add(socketId);
  }

  removeStoreConnection(storeId: string, socketId: string) {
    const connections = this.storeConnections.get(storeId);
    if (connections) {
      connections.delete(socketId);
      if (connections.size === 0) {
        this.storeConnections.delete(storeId);
      }
    }
  }

  addUserConnection(userId: string, socketId: string) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)?.add(socketId);
  }

  removeUserConnection(userId: string, socketId: string) {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.delete(socketId);
      if (connections.size === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  removeSocketConnections(socketId: string) {
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
  emitToStore(storeId: string, event: string, data: unknown) {
    if (!this.io) return;
    
    this.io.to(`store:${storeId}`).emit(event, data);
    console.log(`📤 Enviado para loja ${storeId}: ${event}`, data);
  }

  emitToUser(userId: string, event: string, data: unknown) {
    if (!this.io) return;
    
    const userSockets = this.userConnections.get(userId);
    if (userSockets) {
      for (const socketId of userSockets) {
        this.io.to(socketId).emit(event, data);
      }
      console.log(`📤 Enviado para usuário ${userId}: ${event}`, data);
    }
  }

  emitToAll(event: string, data: unknown) {
    if (!this.io) return;
    
    this.io.emit(event, data);
    console.log(`📤 Enviado para todos: ${event}`, data);
  }

  // Métodos específicos para pedidos
  notifyNewOrder(storeId: string, order: unknown) {
    this.emitToStore(storeId, 'new_order', {
      type: 'new_order',
      data: order,
      storeId,
      timestamp: new Date().toISOString()
    });
  }

  notifyOrderUpdate(storeId: string, order: unknown) {
    this.emitToStore(storeId, 'order_update', {
      type: 'order_update',
      data: order,
      storeId,
      timestamp: new Date().toISOString()
    });
  }

  notifyOrderDelete(storeId: string, orderId: string) {
    this.emitToStore(storeId, 'order_delete', {
      type: 'order_delete',
      data: { id: orderId },
      storeId,
      timestamp: new Date().toISOString()
    });
  }

  notifyPendingOrdersCount(storeId: string, count: number) {
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
function initializeWebSocketServer(server: unknown) {
  websocketManager.initialize(server);
}

// Função para obter a instância do servidor
function getWebSocketManager() {
  return websocketManager;
}

export {
  initializeWebSocketServer,
  getWebSocketManager,
  websocketManager
};
