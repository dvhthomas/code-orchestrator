export type SessionStatus = 'waiting' | 'running' | 'idle' | 'exited';

export type BuiltinAgentId = 'claude' | 'gemini' | 'codex';
export type AgentType = BuiltinAgentId | string;

export interface AgentDefinition {
  id: string;
  name: string;
  command: string;
  builtin: boolean;
  installCommand?: string;
  installUrl?: string;
}

export interface AppConfig {
  defaultAgent: AgentType;
  customAgents: AgentDefinition[];
}

export interface AgentStatus {
  agent: AgentDefinition;
  installed: boolean;
  resolvedPath?: string;
}

export interface AgentDetectionResponse {
  agents: AgentStatus[];
}

export interface SessionInfo {
  id: string;
  name: string;
  folderPath: string;
  status: SessionStatus;
  createdAt: string;
  agentType: AgentType;
}

export interface CreateSessionRequest {
  folderPath: string;
  name?: string;
  agentType?: AgentType;
}

export interface CreateSessionResponse extends SessionInfo {}

export interface PathCompletionResponse {
  completions: string[];
}

// Socket.io typed events
export interface ClientToServerEvents {
  'session:join': (sessionId: string) => void;
  'session:leave': (sessionId: string) => void;
  'session:input': (payload: { sessionId: string; data: string }) => void;
  'session:resize': (payload: { sessionId: string; cols: number; rows: number }) => void;
}

export interface ServerToClientEvents {
  'session:output': (payload: { sessionId: string; data: string }) => void;
  'session:status': (payload: { sessionId: string; status: SessionStatus }) => void;
  'session:exit': (payload: { sessionId: string; exitCode: number }) => void;
  'session:created': (session: SessionInfo) => void;
  'session:deleted': (payload: { sessionId: string }) => void;
  'ngrok:status': (status: NgrokStatus) => void;
}

export type NgrokTunnelStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface NgrokStatus {
  installed: boolean;
  tunnelStatus: NgrokTunnelStatus;
  publicUrl: string | null;
  error: string | null;
  platform: string;
}

export interface NgrokStartResponse {
  publicUrl: string;
}

export interface GitDiffResponse {
  unstaged: string;
  staged: string;
  branch: string;
  error?: string;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  hasChildren: boolean;
}

export interface DirectoryChildrenResponse {
  entries: DirectoryEntry[];
  parentPath: string;
}
