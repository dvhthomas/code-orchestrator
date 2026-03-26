import { Router } from 'express';
import { execFile } from 'child_process';
import { execSync } from 'child_process';
import type { SessionManager } from '../services/SessionManager.js';
import { GitService } from '../services/GitService.js';

function findGit(): string {
  try {
    return execSync('which git', { encoding: 'utf-8' }).trim();
  } catch {
    return 'git';
  }
}

const GIT_PATH = findGit();

export function createGitRoutes(manager: SessionManager): Router {
  const router = Router();
  const gitService = new GitService();

  router.get('/sessions/:id/diff', async (req, res) => {
    const session = manager.getSessionInfo(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const diff = await gitService.getDiff(session.folderPath);

    if (diff.error === 'Not a git repository') {
      res.status(400).json(diff);
      return;
    }

    if (diff.error) {
      res.status(500).json(diff);
      return;
    }

    res.setHeader('Cache-Control', 'no-cache');
    res.json(diff);
  });

  router.post('/sessions/:id/git-add', (req, res) => {
    const session = manager.getSessionInfo(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const { filePath } = req.body as { filePath?: string };
    if (!filePath) {
      res.status(400).json({ error: 'filePath required' });
      return;
    }

    execFile(GIT_PATH, ['add', filePath], { cwd: session.folderPath }, (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ ok: true });
    });
  });

  return router;
}
