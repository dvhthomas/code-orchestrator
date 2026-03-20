import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@remote-orchestrator/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let sharedSocket: TypedSocket | null = null;

function getSocket(): TypedSocket {
  if (!sharedSocket) {
    sharedSocket = io({ transports: ['websocket', 'polling'] });
  }
  return sharedSocket;
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
