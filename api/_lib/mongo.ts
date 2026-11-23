// MongoDB connection with a module-level cache so warm serverless invocations
// reuse the same client instead of opening a new pool each request.
import { MongoClient, type Db } from 'mongodb'

let clientPromise: Promise<MongoClient> | null = null

export function mongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI)
}

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set.')

  if (!clientPromise) {
    const client = new MongoClient(uri)
    clientPromise = client.connect()
  }

  const client = await clientPromise
  return client.db(process.env.MONGODB_DB || 'studio')
}