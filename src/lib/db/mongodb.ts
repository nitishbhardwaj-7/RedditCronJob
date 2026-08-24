import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function dbConnect(): Promise<typeof mongoose | null> {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Configure MONGODB_URI in .env.local');
  }

  if (cached?.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 4000,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log('✅ Connected to MongoDB');
      return m;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e: unknown) {
    cached!.promise = null;
    const msg = e instanceof Error ? e.message : String(e);
    console.error('❌ MongoDB connection error:', msg);

    if (msg.includes('ECONNREFUSED')) {
      throw new Error(
        'MongoDB is not running on 127.0.0.1:27017. Please start the MongoDB service on your machine or use a MongoDB Atlas cloud URI in .env.local.'
      );
    }
    throw e;
  }

  return cached!.conn;
}
