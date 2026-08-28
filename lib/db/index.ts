import mongoose from 'mongoose'

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

const globalWithMongoose = global as typeof globalThis & {
  mongoose?: MongooseCache
}

const cached = globalWithMongoose.mongoose ?? { conn: null, promise: null }

globalWithMongoose.mongoose = cached

export const connectToDatabase = async (
  MONGODB_URI = process.env.MONGODB_URI
) => {
  if (cached.conn) return cached.conn

  if (!MONGODB_URI) throw new Error('MONGODB_URI is missing')

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI)
  }

  try {
    cached.conn = await cached.promise
  } catch (error) {
    cached.promise = null
    throw error
  }

  return cached.conn
}
