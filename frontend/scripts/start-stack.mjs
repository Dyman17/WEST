import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(frontendRoot, "..");
const backendRoot = path.resolve(projectRoot, "..", "backend");
const nodeCommand = process.execPath;
function startProcess(command, args, cwd, label, stopOnExit = true) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code, signal) => {
    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.log(`[${label}] exited with ${reason}`);
    if (stopOnExit && !stopped) stopAll(code ?? 0);
  });

  return child;
}

let stopped = false;
let backendProcess;
let frontendProcess;

function stopAll(exitCode = 0) {
  if (stopped) return;
  stopped = true;
  for (const child of [backendProcess, frontendProcess]) {
    if (child && !child.killed) {
      child.kill();
    }
  }
  process.exit(exitCode);
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));

backendProcess = startProcess(nodeCommand, ["scripts/start.mjs"], backendRoot, "backend");
frontendProcess = startProcess(nodeCommand, ["dist/index.js"], projectRoot, "frontend");
