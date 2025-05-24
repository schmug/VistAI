import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import fs from 'fs';

// Serve static files from public directory
const publicPath = path.resolve('./server/public');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from public directory if it exists
if (fs.existsSync(publicPath)) {
  app.use('/static-assets', express.static(publicPath));
  console.log('Serving static files from', publicPath);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Serve static HTML fallback
app.get(['/static', '/static-app', '/fallback'], (req, res) => {
  // Try multiple paths to find the HTML file
  const possiblePaths = [
    path.resolve('./server/static-index.html'),
    path.resolve('./server/public/fallback.html')
  ];
  
  for (const htmlPath of possiblePaths) {
    try {
      if (fs.existsSync(htmlPath)) {
        return res.sendFile(htmlPath);
      }
    } catch (error) {
      console.error('Error checking path:', htmlPath, error);
    }
  }
  
  // If we get here, no file was found
  res.status(404).send('Static HTML file not found. Paths attempted: ' + possiblePaths.join(', '));
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    const hasKey = Boolean(process.env.OPENROUTER_API_KEY);
    console.log(`OpenRouter API key configured: ${hasKey}`);
    if (!hasKey) {
      console.warn('OPENROUTER_API_KEY is not set - real model queries will return an error payload');
    }
  });
})();
