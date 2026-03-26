import { execFile as execFileCb } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { gt as semverGt, valid as semverValid, clean as semverClean } from 'semver';
import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, UpdateStatus } from '@remote-orchestrator/shared';

const execFile = promisify(execFileCb);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_PACKAGE_JSON = path.resolve(__dirname, '..', '..', '..', '..', 'package.json');
const REPO_OWNER = 'antonioromano';
const REPO_NAME = 'code-orchestrator';
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

function readCurrentVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(ROOT_PACKAGE_JSON, 'utf-8')) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

interface GitHubRelease {
  tag_name: string;
  body: string;
  html_url: string;
}

export class UpdateService {
  private io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;
  private readonly currentVersion: string;
  private latestVersion: string | null = null;
  private changelog: string = '';
  private releaseUrl: string = '';
  private hasUpdate: boolean = false;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private isApplying: boolean = false;

  constructor() {
    this.currentVersion = readCurrentVersion();
  }

  setIo(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
    this.io = io;
  }

  start(): void {
    void this.checkForUpdate();
    this.checkInterval = setInterval(() => { void this.checkForUpdate(); }, CHECK_INTERVAL_MS);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  getStatus(): UpdateStatus {
    return {
      currentVersion: this.currentVersion,
      latestVersion: this.latestVersion,
      hasUpdate: this.hasUpdate,
      changelog: this.changelog,
      releaseUrl: this.releaseUrl,
    };
  }

  /** Re-emit current update status to a single newly-connected socket. */
  broadcastToSocket(socket: Socket<ClientToServerEvents, ServerToClientEvents>): void {
    if (this.hasUpdate) {
      socket.emit('update:available', this.getStatus());
    }
  }

  async checkForUpdate(): Promise<void> {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
        { headers: { 'User-Agent': 'code-orchestrator-update-check' } },
      );

      if (res.status === 404) {
        // No releases published yet — not an error
        return;
      }

      if (!res.ok) {
        console.warn(`[update] GitHub API returned ${res.status}, skipping check`);
        return;
      }

      const release = await res.json() as GitHubRelease;
      const rawTag = release.tag_name ?? '';
      const remoteVersion = semverClean(rawTag) ?? semverValid(rawTag);

      if (!remoteVersion) {
        console.warn(`[update] Could not parse release tag: ${rawTag}`);
        return;
      }

      this.latestVersion = remoteVersion;
      this.changelog = release.body ?? '';
      this.releaseUrl = release.html_url ?? '';
      this.hasUpdate = semverGt(remoteVersion, this.currentVersion) ?? false;

      if (this.hasUpdate) {
        this.io?.emit('update:available', this.getStatus());
      }
    } catch (err) {
      console.warn('[update] Version check failed (network error), will retry next interval:', (err as Error).message);
    }
  }

  async applyUpdate(): Promise<{ success: boolean; error?: string; depsChanged: boolean }> {
    if (this.isApplying) {
      return { success: false, error: 'Update already in progress', depsChanged: false };
    }
    this.isApplying = true;

    try {
      // Guard: check for uncommitted local changes
      const { stdout: statusOut } = await execFile('git', ['status', '--porcelain'], { cwd: this.repoRoot() });
      if (statusOut.trim()) {
        return { success: false, error: 'Cannot update: you have local changes. Stash or commit them first.', depsChanged: false };
      }

      // Run git pull
      const { stdout: pullOut } = await execFile('git', ['pull'], { cwd: this.repoRoot() });

      // Check if package.json changed
      let depsChanged = false;
      try {
        const { stdout: changedFiles } = await execFile('git', ['diff', '--name-only', 'ORIG_HEAD', 'HEAD'], { cwd: this.repoRoot() });
        depsChanged = changedFiles.split('\n').some((f) => f.trim() === 'package.json' || f.trim() === 'package-lock.json');
      } catch {
        // ORIG_HEAD may not exist on first pull — not critical
      }

      console.log('[update] git pull output:', pullOut.trim());

      this.io?.emit('update:applying');

      // Give the response time to flush before exiting
      setTimeout(() => process.exit(0), 500);

      return { success: true, depsChanged };
    } catch (err) {
      this.isApplying = false;
      const message = (err as Error).message ?? 'git pull failed';
      console.error('[update] applyUpdate error:', message);
      return { success: false, error: message, depsChanged: false };
    }
  }

  private repoRoot(): string {
    return path.resolve(__dirname, '..', '..', '..', '..');
  }
}
