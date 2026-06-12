import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const basePort = Number(process.env.PORT || 3000);

  const listen = (port: number) =>
    new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, () => {
        server.off("error", reject);
        console.log(`Server running on http://localhost:${port}/`);
        resolve();
      });
    });

  for (let port = basePort; port < basePort + 10; port += 1) {
    try {
      await listen(port);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | undefined)?.code;
      if (code !== "EADDRINUSE") {
        throw error;
      }
    }
  }

  throw new Error(`No free port available near ${basePort}`);
}

startServer().catch(console.error);
