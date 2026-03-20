import { v4 as uuidv4 } from 'uuid';
import { access } from 'fs/promises';
import path from 'path';
import type { IPty } from 'node-pty';
import type { Server } from 'socket.io';
import type {
  SessionInfo,
  SessionStatus,
  ClientToServerEvents,
  ServerToClientEvents,
} from '@remote-orchestrator/shared';
import { PtyManager } from './PtyManager.js';
import { StateDetector } from './StateDetector.js';
import { SessionStore, type PersistedSession } from '../persistence/SessionStore.js';

interface ManagedSession {
  id: string;
  name: string;
  folderPath: string;
  status: SessionStatus;
  createdAt: string;
  pty: IPty;
  stateDetector: StateDetector;
  ptyListenerAttached: boolean;
  outputBuffer: string;
}

export class SessionManager {
  private sessions = new Map<string, ManagedSession>();
  private ptyManager = new PtyManager();
  private store: SessionStore;
  private io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

  constructor(dataDir: string) {
    this.store = new SessionStore(path.join(dataDir, 'sessions.json'));
  }

  setIo(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
    this.io = io;
  }

  async createSession(folderPath: string, name?: string): Promise<SessionInfo> {
    // Validate folder exists
    await access(folderPath);

    const id = uuidv4();
    const sessionName = name || path.basename(folderPath);
    const createdAt = new Date().toISOString();

    const stateDetector = new StateDetector((status) => {
      const session = this.sessions.get(id);
      if (session) {
        session.status = status;
        this.io?.to(id).emit('session:status', { sessionId: id, status });
      }
    });

    const ptyProcess = this.ptyManager.spawn(folderPath);

    ptyProcess.onData((data) => {
      // Buffer output for replay on reconnect
      session.outputBuffer += data;
      if (session.outputBuffer.length > 100_000) {
        session.outputBuffer = session.outputBuffer.slice(-100_000);
      }
      stateDetector.feed(data);
      this.io?.to(id).emit('session:output', { sessionId: id, data });
    });

    ptyProcess.onExit(({ exitCode }) => {
      stateDetector.setExited();
      this.io?.to(id).emit('session:exit', { sessionId: id, exitCode });
    });

    const session: ManagedSession = {
      id,
      name: sessionName,
      folderPath,
      status: 'running',
      createdAt,
      pty: ptyProcess,
      stateDetector,
      ptyListenerAttached: true,
      outputBuffer: '',
    };

    this.sessions.set(id, session);
    await this.persistSessions();

    const info = this.toSessionInfo(session);
    this.io?.emit('session:created', info);
    return info;
  }

  async destroySession(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (!session) throw new Error(`Session ${id} not found`);

    session.stateDetector.destroy();
    this.ptyManager.kill(session.pty);
    this.sessions.delete(id);
    await this.persistSessions();

    this.io?.emit('session:deleted', { sessionId: id });
  }

  getSession(id: string): ManagedSession | undefined {
    return this.sessions.get(id);
  }

  getSessionInfo(id: string): SessionInfo | undefined {
    const session = this.sessions.get(id);
    return session ? this.toSessionInfo(session) : undefined;
  }

  getAllSessions(): SessionInfo[] {
    return Array.from(this.sessions.values()).map((s) => this.toSessionInfo(s));
  }

  getSessionBuffer(id: string): string | undefined {
    return this.sessions.get(id)?.outputBuffer;
  }

  writeToSession(id: string, data: string): void {
    const session = this.sessions.get(id);
    if (!session) throw new Error(`Session ${id} not found`);
    this.ptyManager.write(session.pty, data);
  }

  resizeSession(id: string, cols: number, rows: number): void {
    const session = this.sessions.get(id);
    if (!session) throw new Error(`Session ${id} not found`);
    this.ptyManager.resize(session.pty, cols, rows);
  }

  async restoreSessions(): Promise<void> {
    const persisted = await this.store.load();

    for (const p of persisted) {
      try {
        await access(p.folderPath);
        await this.createSession(p.folderPath, p.name);
        console.log(`Restored session: ${p.name} (${p.folderPath})`);
      } catch {
        console.warn(`Skipping session ${p.name}: folder ${p.folderPath} not accessible`);
      }
    }
  }

  private toSessionInfo(session: ManagedSession): SessionInfo {
    return {
      id: session.id,
      name: session.name,
      folderPath: session.folderPath,
      status: session.status,
      createdAt: session.createdAt,
    };
  }

  private async persistSessions(): Promise<void> {
    const data: PersistedSession[] = Array.from(this.sessions.values()).map((s) => ({
      id: s.id,
      name: s.name,
      folderPath: s.folderPath,
      createdAt: s.createdAt,
    }));
    await this.store.save(data);
  }
}
