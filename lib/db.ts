"use server";

import mongoose from "mongoose";

// Update this to point to your gianconstruct database
const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const mongooseCache: MongooseCache = { conn: null, promise: null };

async function dbConnect(): Promise<typeof mongoose> {
  if (mongooseCache.conn) {
    console.log("MongoDB is already connected to gianconstruct database");
    return mongooseCache.conn;
  }

  if (!mongooseCache.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
      dbName: "gianconstruct",
    };

    mongooseCache.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("Connected to MongoDB database: gianconstruct");
        return mongoose;
      });
  }

  try {
    mongooseCache.conn = await mongooseCache.promise;
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();
      console.log(
        "Available collections in gianconstruct:",
        collections.map((c) => c.name)
      );
    }
  } catch (e) {
    mongooseCache.promise = null;
    console.error("Failed to connect to MongoDB:", e);
    throw e;
  }

  return mongooseCache.conn;
}

process.on("SIGINT", async () => {
  await mongoose.disconnect();
  console.log("MongoDB disconnected on app termination");
  process.exit(0);
});

export default dbConnect;
