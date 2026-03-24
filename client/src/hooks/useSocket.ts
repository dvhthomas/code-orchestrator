import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@remote-orchestrator/shared';
import { getToken } from '../services/api.js';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let sharedSocket: TypedSocket | null = null;

function getSocket(): TypedSocket {
  if (!sharedSocket) {
    const token = getToken();
    sharedSocket = io({
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
    });
  }
  return sharedSocket;
}

export function reconnectSocket(): void {
  if (sharedSocket) {
    const token = getToken();
    sharedSocket.auth = token ? { token } : {};
    sharedSocket.disconnect().connect();
  }
}

export function useSocket(): TypedSocket {
  const socketRef = useRef<TypedSocket>(getSocket());

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  return socketRef.current;
}
