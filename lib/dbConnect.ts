// lib/dbConnect.ts
import mongoose from 'mongoose';

// Get the MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI!;

// Check if the URI is defined, otherwise throw an error
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Global variable to store the connection promise, preventing new connections on hot reload
// declare global {
//   // eslint-disable-next-line no-var
//   var mongoose: { conn: mongoose.Connection | null; promise: Promise<mongoose.Connection> | null };
// }

let cached = global.mongoose as { conn: mongoose.Connection | null; promise: Promise<mongoose.Connection> | null };

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose.connection;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  
  return cached.conn;
}

export default dbConnect;