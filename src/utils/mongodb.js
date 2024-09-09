import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  };

  // replace the uri string with your connection string
  const client = new MongoClient(process.env.MONGODB_URI);
  // replace 'tee_api_demo' with your database name
  const database = client.db('tee_api_demo');
  // replace 'users' with your collection name
  const db = database.collection('users');
  
  cachedClient = client;
  cachedDb = db;

  return { client, db };
};