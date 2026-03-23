import { Router } from 'express';
import type { NgrokService } from '../services/NgrokService.js';

export function createNgrokRoutes(ngrokService: NgrokService): Router {
  const router = Router();

  router.get('/status', (_req, res) => {
    res.json(ngrokService.getStatus());
  });

  router.post('/start', async (req, res) => {
    if (!ngrokService.installed) {
      res.status(400).json({ error: 'ngrok is not installed' });
      return;
    }
    try {
      const port = typeof req.body?.port === 'number' ? req.body.port : 5173;
      const publicUrl = await ngrokService.start(port);
      res.json({ publicUrl });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start ngrok';
      res.status(500).json({ error: message });
    }
  });

  router.post('/stop', async (_req, res) => {
    try {
      await ngrokService.stop();
      res.status(204).send();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop ngrok';
      res.status(500).json({ error: message });
    }
  });

  router.post('/recheck', (_req, res) => {
    ngrokService.recheckInstallation();
    res.json(ngrokService.getStatus());
  });

  return router;
}
