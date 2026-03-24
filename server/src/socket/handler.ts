import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@remote-orchestrator/shared';
import type { SessionManager } from '../services/SessionManager.js';
import type { AuthService } from '../services/AuthService.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function setupSocketHandler(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  manager: SessionManager,
  authService: AuthService,
): void {
  io.use((socket, next) => {
    if (!authService.enabled) {
      next();
      return;
    }
    const token = socket.handshake.auth?.token as string | undefined;
    if (token && authService.validateToken(token)) {
      next();
    } else {
      next(new Error('Authentication required'));
    }
  });

  io.on('connection', (socket: TypedSocket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('session:join', (sessionId: string) => {
      socket.join(sessionId);
      // Replay buffered output so terminal isn't blank after reconnect
      const buffer = manager.getSessionBuffer(sessionId);
      if (buffer) {
        socket.emit('session:output', { sessionId, data: buffer });
      }
    });

    socket.on('session:leave', (sessionId: string) => {
      socket.leave(sessionId);
      console.log(`Client ${socket.id} left session ${sessionId}`);
    });

    socket.on('session:input', ({ sessionId, data }) => {
      try {
        manager.writeToSession(sessionId, data);
      } catch (err) {
        console.error(`Error writing to session ${sessionId}:`, err);
      }
    });

    socket.on('session:resize', ({ sessionId, cols, rows }) => {
      try {
        manager.resizeSession(sessionId, cols, rows);
      } catch (err) {
        console.error(`Error resizing session ${sessionId}:`, err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
