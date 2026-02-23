import { Router, Response } from "express";
import { checkJwt } from "../config/auth0.js";
import { syncOrCreateUser } from "../middleware/auth.middleware.js";
import { AuthRequest } from "../types/auth.types.js";

const router = Router();

router.get(
  "/me",
  checkJwt,
  syncOrCreateUser,
  (req: AuthRequest, res: Response) => {
    res.status(200).json(req.user);
  }
);

export default router;
