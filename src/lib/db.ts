import dns from "node:dns";
import mongoose from "mongoose";

// Node on this machine resolves via 127.0.0.1, which refuses SRV lookups
// required by mongodb+srv. Fall back to public resolvers in that case.
const dnsServers = dns.getServers();
const loopbackOnly =
  dnsServers.length > 0 &&
  dnsServers.every((server) => {
    const host = server.replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
    return host === "127.0.0.1" || host === "::1";
  });
if (loopbackOnly) {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
}

type Cache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: Cache | undefined;
}

const cache: Cache = global.__mongooseCache ?? { conn: null, promise: null };
global.__mongooseCache = cache;

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (error) {
    cache.promise = null;
    cache.conn = null;
    throw error;
  }
}
