import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClickSchema, insertSearchSchema } from "@shared/schema";
import { z } from "zod";
// WebSocket removed to avoid connection errors

// OpenRouter API handling
async function queryOpenRouter(prompt: string, modelId: string) {
  try {
    const API_KEY = process.env.OPENROUTER_API_KEY;

    if (!API_KEY) {
      return {
        content: `OpenRouter API key not configured`,
        title: `Error from ${modelId}`,
        responseTime: 0,
        error: 'OPENROUTER_API_KEY_MISSING'
      };
    }
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": "https://vistai.replit.app", // Adjust based on your app's domain
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
      responseTime: 0,
      error: error instanceof Error ? error.message : String(error)
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
  
  // Disable WebSockets to avoid persistent errors
  // We'll implement a polling approach instead
  
  // Create a mock broadcast function that does nothing
  const broadcastUpdate = (type: string, data: any) => {
    console.log(`[WebSocketDisabled] Would broadcast update: ${type}`);
    // No actual broadcasting since WebSockets are disabled
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
    const useSSE = req.headers.accept === "text/event-stream";

    if (useSSE) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
    }

    try {
      const { query } = insertSearchSchema.parse(req.body);

      const search = await storage.createSearch({ query });

      const models = [
        "openai/gpt-4",
        "anthropic/claude-2",
        "meta-llama/llama-2-70b-chat",
        "mistralai/mistral-7b-instruct",
      ];

      for (const modelId of models) {
        await storage.incrementModelSearches(modelId);
      }

      if (useSSE) {
        res.write(`event: search\n`);
        res.write(`data:${JSON.stringify(search)}\n\n`);
      }

      const results: any[] = [];
      for (const modelId of models) {
        const modelResponse = await queryOpenRouter(query, modelId);
        const result = await storage.createResult({
          searchId: search.id,
          modelId,
          content: modelResponse.content,
          title: modelResponse.title,
          responseTime: modelResponse.responseTime,
        });

        const finalResult = { ...result, modelName: modelId.split("/").pop() };
        results.push(finalResult);

        if (useSSE) {
          res.write(`event: result\n`);
          res.write(`data:${JSON.stringify(finalResult)}\n\n`);
        }
      }

      const payload = {
        search,
        results,
        totalTime: Math.max(...results.map((r) => r.responseTime || 0)),
      };

      if (useSSE) {
        res.write(`event: done\n`);
        res.write(`data:${JSON.stringify(payload)}\n\n`);
        res.end();
      } else {
        res.json(payload);
      }
    } catch (error) {
      console.error("Search error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid search query", errors: error.errors });
      }
      if (useSSE) {
        res.write(`event: error\n`);
        res.write(`data:${JSON.stringify({ message: "Error processing search" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Error processing search" });
      }
    }
  });
  
  // Track clicks on results
  app.post("/api/track-click", async (req: Request, res: Response) => {
    try {
      const clickData = insertClickSchema.parse(req.body);
      
      const click = await storage.trackClick(clickData);
      
      // Get updated stats for the response
      const updatedStats = await storage.getModelStats();
      
      // Return stats directly in the response instead of broadcasting
      res.json({ 
        success: true, 
        click,
        stats: updatedStats // Include the stats in the response
      });
      
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
