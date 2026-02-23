// routes/client.routes.ts
import { Router } from 'express';
import { checkJwt } from '../config/auth0.js';
import { syncOrCreateUser } from '../middleware/auth.middleware.js';
import { getMyRequests, getStats, createDevisRequest, createAIRequest } from '../controllers/client.controller';
import { requireClient } from '../middleware/roleCheck.middleware.js';

const router = Router();

// Toutes les routes nécessitent authentification
router.use(checkJwt);
router.use(syncOrCreateUser);
router.use(requireClient);

router.get('/contacts', getMyRequests);
router.get('/stats', getStats)
router.post('/requests/devis', createDevisRequest);
router.post('/ai/optimization', createAIRequest);

export default router;
