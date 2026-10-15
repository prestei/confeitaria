import dns from "node:dns";
import mongoose from "mongoose";

// Windows DNS on this machine is 127.0.0.1, which refuses SRV lookups
// required by mongodb+srv. The MongoDB driver resolves SRV through
// dns.promises, and that resolver is created lazily — dns.setServers()
// does not update it if it does not exist yet. Switch both resolvers
// to public DNS when either one is still loopback-only.
const PUBLIC_RESOLVERS = ["1.1.1.1", "8.8.8.8"];

function isLoopbackOnly(servers: string[]) {
  return (
    servers.length > 0 &&
    servers.every((server) => {
      const host = server.replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
      return host === "127.0.0.1" || host === "::1";
    })
  );
}

function usePublicResolversIfNeeded() {
  const callbackServers = dns.getServers();
  const promiseServers = dns.promises.getServers();
  if (isLoopbackOnly(callbackServers) || isLoopbackOnly(promiseServers)) {
    dns.setServers(PUBLIC_RESOLVERS);
    dns.promises.setServers(PUBLIC_RESOLVERS);
  }
}

usePublicResolversIfNeeded();

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
    usePublicResolversIfNeeded();
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
