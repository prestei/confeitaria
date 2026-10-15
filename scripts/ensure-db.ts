import { execSync } from "node:child_process";
import net from "node:net";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { User } from "../src/models/User";

const HOST = "127.0.0.1";
const PORT = Number(process.env.MONGO_PORT ?? "27017");
const WAIT_MS = 45_000;
const POLL_MS = 400;

function loadEnv() {
  for (const file of [".env", ".env.local"]) {
    const envPath = resolve(process.cwd(), file);
    if (!existsSync(envPath)) continue;
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isPortOpen(host: string, port: number): Promise<boolean> {
  return new Promise((resolvePort) => {
    const socket = net.createConnection({ host, port });
    const done = (open: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolvePort(open);
    };
    socket.setTimeout(2000);
    socket.on("connect", () => done(true));
    socket.on("timeout", () => done(false));
    socket.on("error", () => done(false));
  });
}

async function waitForMongo(): Promise<boolean> {
  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    if (await isPortOpen(HOST, PORT)) return true;
    await sleep(POLL_MS);
  }
  return false;
}

function tryDockerCompose(): boolean {
  try {
    execSync("docker info", { stdio: "ignore" });
  } catch {
    return false;
  }
  try {
    execSync("docker compose up -d", { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

function tryMongoLocalScript() {
  execSync("bash scripts/mongo-local.sh", { stdio: "inherit" });
}

async function ensureMongoRunning() {
  if (await isPortOpen(HOST, PORT)) {
    console.log(`MongoDB já está em ${HOST}:${PORT}`);
    return;
  }

  console.log("MongoDB não está rodando — iniciando...");

  if (tryDockerCompose()) {
    console.log("Docker Compose: serviço mongo solicitado.");
  } else {
    console.log("Docker indisponível — usando mongod local (scripts/mongo-local.sh).");
    tryMongoLocalScript();
  }

  if (!(await waitForMongo())) {
    console.error(
      `\nNão foi possível conectar em mongodb://${HOST}:${PORT}.\n` +
        "Verifique Docker (npm run db:up) ou logs em /tmp/confeitaria-mongod.log.\n",
    );
    process.exit(1);
  }

  console.log(`MongoDB pronto em ${HOST}:${PORT}`);
}

const DEMO_EMAIL = "demo@doceencanto.com";

async function ensureDemoSeed() {
  await connectDB();
  const demo = await User.findOne({ email: DEMO_EMAIL }).select("_id").lean();
  if (demo) return;

  const total = await User.countDocuments();
  if (total === 0) {
    console.log("Banco vazio — executando seed de demonstração...");
  } else {
    console.log(
      `Conta demo (${DEMO_EMAIL}) ausente — executando seed (dados locais serão recriados).`,
    );
  }
  execSync("npm run db:seed", { stdio: "inherit" });
}

async function main() {
  loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI não definida. Copie .env.example para .env");
    process.exit(1);
  }

  await ensureMongoRunning();
  await ensureDemoSeed();
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
