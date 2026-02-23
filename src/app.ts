import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import OpenAI from 'openai';
import { connectMongo } from './config/mongodb.js';
import { pool } from './config/database.js';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import clientRoutes from './routes/client.routes';
import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { AuthRequest } from '../src/types/auth.types.js';

const allowedOrigins = [
  'http://localhost:3000',      // ton frontend local
  'https://cpluspaie.vercel.app', // prod
];


const app = express();

/* ======================
   Security
====================== */
app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ CORS blocked:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);

app.options("*", cors());

app.use(compression() as unknown as express.RequestHandler);

/* ======================
   Rate limiting
====================== */
const limiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests',
});
app.use('/api', (req, res, next) => {
    console.log('Origin:', req.headers.origin);

  if (req.method === 'OPTIONS') return res.sendStatus(200);
  return limiter(req, res, next);
});

/* ======================
   Body parser
====================== */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ======================
   Health check
====================== */
app.get('/health', (_req: AuthRequest, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ======================
   Routes existantes
====================== */
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);


/* ======================
   OpenAI IA endpoint
====================== */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/analyze', async (req: Request, res: Response) => {
  const data = req.body;
  if (!data) return res.status(400).json({ error: 'No data provided' });

  const prompt = `
Tu es un expert RH et paie.
Analyse cette situation et propose des recommandations :
- Convention collective : ${data.ccn}
- Secteur : ${data.secteur}
- Effectif : ${data.effectif}
- Types de contrats : ${data.typeContrats?.join(', ')}
- Objectifs : ${data.objectifs?.join(', ')}
- Problèmes : ${data.problemes}
- Priorité : ${data.priorite}

Donne une réponse concise et structurée.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const analysis = response.choices[0].message?.content ?? '';
    return res.json({ analysis });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/* ======================
   404 handler
====================== */
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

/* ======================
   Error handler
====================== */
app.use(errorHandler);

/* ======================
   Server & DB start
====================== */
async function startServer() {
  try {
    // 🔌 Connexion PostgreSQL
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connected');

    // 🔌 Connexion Mongo
    await connectMongo();
    console.log('✅ MongoDB connected');

  } catch (error) {
    console.error('❌ Failed to start server', error);
    process.exit(1);
  }
}

startServer();


export default app;
