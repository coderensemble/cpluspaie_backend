import { DBUser, JWTPayload } from './auth.types';
import { VerifyJwtResult } from 'express-oauth2-jwt-bearer';

declare global {
  namespace Express {
    interface Request {
      auth?: JWTPayload & { sub?: string };
      user?: DBUser & { sub?: string };
    }
  }
}

export {};