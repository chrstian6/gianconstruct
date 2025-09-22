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

// Use globalThis to persist across hot reloads in development
const globalWithMongoose = globalThis as unknown as {
  mongooseCache: MongooseCache;
};

const mongooseCache: MongooseCache = globalWithMongoose.mongooseCache || {
  conn: null,
  promise: null,
};

// Store in global scope to persist across hot reloads
if (process.env.NODE_ENV !== "production") {
  globalWithMongoose.mongooseCache = mongooseCache;
}

async function dbConnect(): Promise<typeof mongoose> {
  if (mongooseCache.conn) {
    // Optional: Check if connection is still alive
    if (mongooseCache.conn.connection.readyState === 1) {
      console.log("MongoDB is already connected to gianconstruct database");
      return mongooseCache.conn;
    }
    // If connection is dead, reset cache
    mongooseCache.conn = null;
    mongooseCache.promise = null;
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
      })
      .catch((error) => {
        // Reset promise on error to allow retry
        mongooseCache.promise = null;
        console.error("Failed to connect to MongoDB:", error);
        throw error;
      });
  }

  try {
    mongooseCache.conn = await mongooseCache.promise;

    // Log collections only in development for debugging
    if (
      process.env.NODE_ENV === "development" &&
      mongoose.connection.readyState === 1 &&
      mongoose.connection.db
    ) {
      try {
        const collections = await mongoose.connection.db
          .listCollections()
          .toArray();
        console.log(
          "Available collections in gianconstruct:",
          collections.map((c) => c.name)
        );
      } catch (collectionError) {
        console.warn("Could not list collections:", collectionError);
      }
    }
  } catch (e) {
    mongooseCache.promise = null;
    console.error("Failed to connect to MongoDB:", e);
    throw e;
  }

  return mongooseCache.conn;
}

// Cleanup on process termination
process.on("SIGINT", async () => {
  try {
    await mongoose.disconnect();
    console.log("MongoDB disconnected on app termination");
  } catch (error) {
    console.error("Error disconnecting MongoDB:", error);
  }
  process.exit(0);
});

export default dbConnect;
