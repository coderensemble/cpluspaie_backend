// src/services/ai.service.ts
import { pool } from '../config/database.js';
import { connectMongo } from '../config/mongodb.js';
import { openai } from '../services/openai.service.js';

export class AIService {
  MAX_QUOTA = 100;

  /** Vérifie combien de requêtes l'utilisateur a déjà faites ce mois */
  async checkQuota(userId: string, maxQuota: number = this.MAX_QUOTA) {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const res = await pool.query(
      `SELECT * FROM ai_usage WHERE user_id = $1 AND month = $2`,
      [userId, monthStart]
    );

    if (res.rows.length === 0) {
      await pool.query(
        `INSERT INTO ai_usage (user_id, month, requests, quota) VALUES ($1, $2, 0, $3)`,
        [userId, monthStart, maxQuota]
      );
      return 0;
    }

    return res.rows[0].requests;
  }

  /** Incrémente le compteur de requêtes pour ce mois */
  async incrementQuota(userId: string) {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    await pool.query(
      `UPDATE ai_usage SET requests = requests + 1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND month = $2`,
      [userId, monthStart]
    );
  }

  /** Analyse le prompt via OpenAI et enregistre la réponse dans MongoDB */
  async analyzePrompt(
    userId: string,
    prompt: string,
    extraData: Record<string, any> = {}
  ) {
    // 1️⃣ Vérifier le quota
    const requests = await this.checkQuota(userId);
    if (requests >= this.MAX_QUOTA) {
      throw new Error('Quota atteint ce mois');
    }

    // 2️⃣ Appel à OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = completion.choices[0].message?.content || '';

    // 3️⃣ Connexion à Mongo et insertion
    const db = await connectMongo(); // attendre la connexion
    const collection = db.collection('ai_responses'); // collection Mongo
    await collection.insertOne({
      userId,
      prompt,
      response: responseText,
      extraData,
      createdAt: new Date(),
    });

    // 4️⃣ Incrémenter le quota Postgres
    await this.incrementQuota(userId);

    return responseText;
  }
}

export const aiService = new AIService();
