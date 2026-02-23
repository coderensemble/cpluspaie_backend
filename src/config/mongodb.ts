import { MongoClient } from 'mongodb';
import { env } from './environment.js';

let client: MongoClient;

export async function connectMongo() {
  try {
    client = new MongoClient(env.MONGO_URI);
    await client.connect();

    // 🔎 Ping de la base
    await client.db('admin').command({ ping: 1 });

    return client.db(env.MONGO_DB || 'cpaie');
  } catch (error) {
    console.error('❌ MongoDB connection failed', error);
    process.exit(1);
  }
}
