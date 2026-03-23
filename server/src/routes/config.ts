import { Router } from 'express';
import type { ConfigStore } from '../persistence/ConfigStore.js';
import type { AgentRegistry } from '../services/AgentRegistry.js';

export function createConfigRoutes(configStore: ConfigStore): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const config = await configStore.load();
    res.json(config);
  });

  router.put('/', async (req, res) => {
    const current = await configStore.load();
    const { defaultAgent, customAgents } = req.body;
    const updated = {
      defaultAgent: defaultAgent ?? current.defaultAgent,
      customAgents: customAgents ?? current.customAgents,
    };
    await configStore.save(updated);
    res.json(updated);
  });

  return router;
}

export function createAgentRoutes(agentRegistry: AgentRegistry): Router {
  const router = Router();

  router.get('/detect', (_req, res) => {
    const agents = agentRegistry.detectInstalled();
    res.json({ agents });
  });

  return router;
}
