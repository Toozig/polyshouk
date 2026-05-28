#!/usr/bin/env node
/**
 * Runs `next dev` and appends all stdout/stderr to logs/dev-server.log
 * so agents can diagnose local runs without relying on ephemeral terminal state.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const logDir = path.join(projectRoot, "logs");
const logFile = path.join(logDir, "dev-server.log");

fs.mkdirSync(logDir, { recursive: true });

const sessionHeader = `\n--- dev session ${new Date().toISOString()} ---\n`;
fs.appendFileSync(logFile, sessionHeader);
process.stdout.write(sessionHeader);

const logStream = fs.createWriteStream(logFile, { flags: "a" });

const child = spawn("npx", ["next", "dev"], {
  cwd: projectRoot,
  stdio: ["inherit", "pipe", "pipe"],
  env: process.env,
  shell: process.platform === "win32",
});

function relay(stream, target) {
  stream.on("data", (chunk) => {
    logStream.write(chunk);
    target.write(chunk);
  });
}

relay(child.stdout, process.stdout);
relay(child.stderr, process.stderr);

function endSession(code) {
  const footer = `--- dev session ended (code ${code ?? "?"}) ${new Date().toISOString()} ---\n`;
  fs.appendFileSync(logFile, footer);
  logStream.end();
}

child.on("close", (code) => {
  endSession(code);
  process.exit(code ?? 0);
});

child.on("error", (err) => {
  const line = `[dev-with-log] spawn error: ${err.message}\n`;
  fs.appendFileSync(logFile, line);
  process.stderr.write(line);
  endSession(1);
  process.exit(1);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
