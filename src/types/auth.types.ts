import { Request } from 'express';

// src/types/auth.types.ts
export interface JWTPayload {
  sub: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  scope?: string;
  [key: string]: any;
}

export type UserRole = 'Client' | 'Admin';

export interface DBUser {
  id: string;
  auth0_id: string;  // <-- ajouter cette ligne
  email: string;
  name: string | null;
  role: UserRole;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

// AuthRequest : on laisse req.auth comme `any` pour éviter conflit VerifyJwtResult

export interface AuthRequest<Body = any> extends Request<any, any, Body> {
  user?: DBUser;
  auth?: any;
}

export interface Auth0User {
  user_id: string;
  email: string;
  name?: string;
  nickname?: string;
  app_metadata?: {
    role?: 'Admin' | 'Client';
  };
  user_metadata?: Record<string, any>;
}
