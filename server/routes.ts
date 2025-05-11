import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClickSchema, insertSearchSchema } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer } from "ws";

// OpenRouter API handling
async function queryOpenRouter(prompt: string, modelId: string) {
  try {
    const API_KEY = process.env.OPENROUTER_API_KEY;
    
    if (!API_KEY) {
      throw new Error("OpenRouter API key is not configured");
    }
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": "https://aisearch.replit.app", // Adjust based on your app's domain
        "X-Title": "AI Search Engine"
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || "No response from model",
      title: extractTitle(data.choices[0]?.message?.content),
      responseTime: Math.round(data.usage?.total_ms || 0)
    };
  } catch (error) {
    console.error(`Error querying model ${modelId}:`, error);
    return {
      content: `Error getting response from ${modelId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      title: `Error from ${modelId}`,
      responseTime: 0
    };
  }
}

// Helper to extract a title from response content
function extractTitle(content: string = ""): string {
  if (!content) return "AI Response";
  
  // Look for common title patterns in AI responses
  const titleMatch = content.match(/^#\s+(.*?)$|^Title:\s*(.*?)$|^(.*?)[\n\r]/m);
  if (titleMatch) {
    // Return the first non-undefined capturing group
    for (let i = 1; i < titleMatch.length; i++) {
      if (titleMatch[i]) return titleMatch[i].trim();
    }
  }
  
  // If no title found, use the first few words
  const words = content.split(/\s+/).slice(0, 5).join(" ");
  return words + (words.length < content.length ? "..." : "");
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Send initial model stats
    storage.getModelStats().then(stats => {
      ws.send(JSON.stringify({ type: 'modelStats', data: stats }));
    });
    
    ws.on('error', console.error);
  });
  
  // Broadcast updates to all connected clients
  const broadcastUpdate = (type: string, data: any) => {
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify({ type, data }));
      }
    });
  };

  // API routes
  app.use("/api", async (req, res, next) => {
    // Basic CORS headers for API routes
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    
    next();
  });
  
  // Search endpoint
  app.post("/api/search", async (req: Request, res: Response) => {
    try {
      const { query } = insertSearchSchema.parse(req.body);
      
      // Create search record
      const search = await storage.createSearch({ query });
      
      // Define models to query (these would be your OpenRouter models)
      const models = [
        "openai/gpt-4",
        "anthropic/claude-2", 
        "meta-llama/llama-2-70b-chat",
        "mistralai/mistral-7b-instruct"
      ];
      
      // Track model usage
      for (const modelId of models) {
        await storage.incrementModelSearches(modelId);
      }
      
      // Query models
      const resultPromises = models.map(async (modelId) => {
        const modelResponse = await queryOpenRouter(query, modelId);
        
        // Store result
        const result = await storage.createResult({
          searchId: search.id,
          modelId,
          content: modelResponse.content,
          title: modelResponse.title,
          responseTime: modelResponse.responseTime
        });
        
        return { ...result, modelName: modelId.split('/').pop() };
      });
      
      // Wait for all model responses
      const results = await Promise.all(resultPromises);
      
      res.json({ 
        search, 
        results,
        totalTime: Math.max(...results.map(r => r.responseTime || 0))
      });
      
    } catch (error) {
      console.error("Search error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid search query", errors: error.errors });
      }
      res.status(500).json({ message: "Error processing search" });
    }
  });
  
  // Track clicks on results
  app.post("/api/track-click", async (req: Request, res: Response) => {
    try {
      const clickData = insertClickSchema.parse(req.body);
      
      const click = await storage.trackClick(clickData);
      
      // After tracking, broadcast updated stats
      const updatedStats = await storage.getModelStats();
      broadcastUpdate('modelStats', updatedStats);
      
      res.json({ success: true, click });
      
    } catch (error) {
      console.error("Click tracking error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid click data", errors: error.errors });
      }
      res.status(500).json({ message: "Error tracking click" });
    }
  });
  
  // Get model stats
  app.get("/api/model-stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getModelStats();
      
      // Calculate percentages
      const totalClicks = stats.reduce((sum, stat) => sum + stat.clickCount, 0);
      
      const statsWithPercentages = stats.map(stat => ({
        ...stat,
        percentage: totalClicks > 0 ? Math.round((stat.clickCount / totalClicks) * 100) : 0,
        displayName: stat.modelId.split('/').pop() // Extract just the model name
      }));
      
      res.json(statsWithPercentages);
      
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ message: "Error retrieving stats" });
    }
  });
  
  // Get top models
  app.get("/api/top-models", async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 5;
      const topModels = await storage.getTopModels(limit);
      
      // Calculate percentages
      const totalClicks = topModels.reduce((sum, model) => sum + model.clickCount, 0);
      
      const topModelsWithPercentages = topModels.map(model => ({
        ...model,
        percentage: totalClicks > 0 ? Math.round((model.clickCount / totalClicks) * 100) : 0,
        displayName: model.modelId.split('/').pop() // Extract just the model name
      }));
      
      res.json(topModelsWithPercentages);
      
    } catch (error) {
      console.error("Top models error:", error);
      res.status(500).json({ message: "Error retrieving top models" });
    }
  });

  return httpServer;
}
