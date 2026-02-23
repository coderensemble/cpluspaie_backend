// src/services/auth0.service.ts
import axios, { AxiosInstance } from 'axios';
import { auth0Config } from '../config/auth0.js';

// 🔹 Typage pour la réponse d'Auth0 Management API
export interface Auth0User {
  user_id: string;
  email: string;
  name?: string;
  nickname?: string;
  picture?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
}

class Auth0Service {
  private managementToken: string | null = null;
  private tokenExpiry: number = 0;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: `https://${auth0Config.domain}`,
    });
  }

  private async getManagementToken(): Promise<string> {
    const now = Date.now();

    if (this.managementToken && this.tokenExpiry > now) {
      return this.managementToken;
    }

    const response = await this.axiosInstance.post('/oauth/token', {
      client_id: auth0Config.clientId,
      client_secret: auth0Config.clientSecret,
      audience: `https://${auth0Config.domain}/api/v2/`,
      grant_type: 'client_credentials',
    });

    // ✅ Vérification stricte pour TS
    const token = response.data.access_token;
    if (!token) {
      throw new Error('Failed to get Auth0 management token');
    }

    this.managementToken = token;
    this.tokenExpiry = now + (response.data.expires_in - 60) * 1000; // 60s de marge

    // ✅ Vérification stricte pour TS
    if (!this.managementToken) {
      throw new Error('Failed to get Auth0 management token');
    }

    return this.managementToken;
  }

  // Récupère les infos d'un utilisateur depuis Auth0
  async getUserInfo(auth0Id: string): Promise<Auth0User> {
    const token = await this.getManagementToken();

    const response = await this.axiosInstance.get<Auth0User>(
      `/api/v2/users/${encodeURIComponent(auth0Id)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  }

  // Met à jour les metadata utilisateur
  async updateUserMetadata(
    auth0Id: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    const token = await this.getManagementToken();

    await this.axiosInstance.patch(
      `/api/v2/users/${encodeURIComponent(auth0Id)}`,
      { user_metadata: metadata },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }
}

export const auth0Service = new Auth0Service();
