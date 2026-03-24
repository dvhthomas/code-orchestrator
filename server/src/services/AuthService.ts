import crypto from 'crypto';
import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@remote-orchestrator/shared';

export class AuthService {
  private passwordHash: string | null = null;
  private validTokens: Set<string> = new Set();
  private io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

  setIo(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
    this.io = io;
  }

  get enabled(): boolean {
    return this.passwordHash !== null;
  }

  setPassword(password: string): void {
    this.passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    this.io?.emit('auth:required', { required: true });
  }

  verifyPassword(password: string): boolean {
    if (!this.passwordHash) return false;
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(this.passwordHash, 'hex'),
    );
  }

  generateToken(): string {
    const token = crypto.randomUUID();
    this.validTokens.add(token);
    return token;
  }

  validateToken(token: string): boolean {
    return this.validTokens.has(token);
  }

  clearAuth(): void {
    this.passwordHash = null;
    this.validTokens.clear();
    this.io?.emit('auth:required', { required: false });
  }
}
