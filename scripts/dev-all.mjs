import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmCommand = process.platform === "win32" ? "cmd.exe" : "npm";
const npmArgs = process.platform === "win32" ? ["/c", "npm.cmd", "--prefix", "frontend", "run", "dev:all"] : ["--prefix", "frontend", "run", "dev:all"];

const child = spawn(npmCommand, npmArgs, {
  cwd: rootDir,
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
