import { Router } from 'express';
import { checkJwt } from '../config/auth0.js';
import { syncOrCreateUser } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/roleCheck.middleware.js';
import { getAllUsers } from '../controllers/user.controller.js';

const router = Router();

router.get(
  '/',
  checkJwt,
  syncOrCreateUser,
  requireAdmin,
  getAllUsers
);

export default router;
