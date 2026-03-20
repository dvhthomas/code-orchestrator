import { Router } from 'express';
import { execFile } from 'child_process';
import { getPathCompletions } from '../utils/fsAutocomplete.js';
import { getDirectoryChildren } from '../utils/fsChildren.js';

export function createFilesystemRoutes(): Router {
  const router = Router();

  router.get('/autocomplete', async (req, res) => {
    const pathQuery = req.query.path as string;

    if (!pathQuery) {
      res.json({ completions: [] });
      return;
    }

    const completions = await getPathCompletions(pathQuery);
    res.json({ completions });
  });

  router.get('/children', async (req, res) => {
    const dirPath = req.query.path as string | undefined;
    const result = await getDirectoryChildren(dirPath);
    res.json(result);
  });

  router.post('/pick-folder', (_req, res) => {
    execFile('osascript', ['-e', 'POSIX path of (choose folder with prompt "Select project folder")'], (err, stdout) => {
      if (err) {
        // User cancelled or osascript error
        res.json({ path: null });
        return;
      }
      const folderPath = stdout.trim().replace(/\/$/, '');
      res.json({ path: folderPath });
    });
  });

  return router;
}
