import type { SessionInfo, CreateSessionRequest, PathCompletionResponse, DirectoryChildrenResponse, FileContentResponse, FileSearchResponse, GitDiffResponse, NgrokStatus, NgrokStartResponse, AppConfig, AgentDetectionResponse } from '@remote-orchestrator/shared';

const API_BASE = '/api';

export const api = {
  getSessions: async (): Promise<SessionInfo[]> => {
    const res = await fetch(`${API_BASE}/sessions`);
    return res.json();
  },

  createSession: async (data: CreateSessionRequest): Promise<SessionInfo> => {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create session');
    }
    return res.json();
  },

  deleteSession: async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/sessions/${id}`, { method: 'DELETE' });
  },

  getPathCompletions: async (path: string): Promise<string[]> => {
    const res = await fetch(`${API_BASE}/fs/autocomplete?path=${encodeURIComponent(path)}`);
    const data: PathCompletionResponse = await res.json();
    return data.completions;
  },

  pickFolder: async (): Promise<string | null> => {
    const res = await fetch(`${API_BASE}/fs/pick-folder`, { method: 'POST' });
    const data = await res.json();
    return data.path;
  },

  getDirectoryChildren: async (dirPath?: string, includeFiles = false): Promise<DirectoryChildrenResponse> => {
    const params = new URLSearchParams();
    if (dirPath) params.set('path', dirPath);
    if (includeFiles) params.set('includeFiles', 'true');
    const res = await fetch(`${API_BASE}/fs/children?${params}`);
    return res.json();
  },

  searchFiles: async (rootPath: string, query: string): Promise<FileSearchResponse> => {
    const params = new URLSearchParams({ path: rootPath, q: query });
    const res = await fetch(`${API_BASE}/fs/search?${params}`);
    return res.json();
  },

  getFileContent: async (filePath: string): Promise<FileContentResponse> => {
    const res = await fetch(`${API_BASE}/fs/file?path=${encodeURIComponent(filePath)}`);
    if (!res.ok) {
      const err = await res.json() as { error: string };
      throw new Error(err.error);
    }
    return res.json();
  },

  getSessionOrder: async (): Promise<string[]> => {
    const res = await fetch(`${API_BASE}/sessions/order`);
    const data = await res.json();
    return data.order;
  },

  saveSessionOrder: async (order: string[]): Promise<void> => {
    await fetch(`${API_BASE}/sessions/order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });
  },

  getSessionDiff: async (sessionId: string): Promise<GitDiffResponse> => {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/diff`);
    return res.json();
  },

  getNgrokStatus: async (): Promise<NgrokStatus> => {
    const res = await fetch(`${API_BASE}/ngrok/status`);
    return res.json();
  },

  startNgrok: async (port: number = 5173): Promise<NgrokStartResponse> => {
    const res = await fetch(`${API_BASE}/ngrok/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ port }),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error || 'Failed to start ngrok');
    }
    return res.json();
  },

  stopNgrok: async (): Promise<void> => {
    const res = await fetch(`${API_BASE}/ngrok/stop`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error || 'Failed to stop ngrok');
    }
  },

  recheckNgrok: async (): Promise<NgrokStatus> => {
    const res = await fetch(`${API_BASE}/ngrok/recheck`, { method: 'POST' });
    return res.json();
  },

  getConfig: async (): Promise<AppConfig> => {
    const res = await fetch(`${API_BASE}/config`);
    return res.json();
  },

  updateConfig: async (data: Partial<AppConfig>): Promise<AppConfig> => {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  detectAgents: async (): Promise<AgentDetectionResponse> => {
    const res = await fetch(`${API_BASE}/agents/detect`);
    return res.json();
  },
};
