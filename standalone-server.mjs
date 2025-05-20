// A standalone Express server that doesn't rely on Vite or WebSockets
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { fileURLToPath } from 'url';

// Create proper paths with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from public directory
const publicPath = path.resolve('./server/public');
app.use('/static-assets', express.static(publicPath));

// OpenRouter API handling
async function queryOpenRouter(prompt, modelId) {
  try {
    const API_KEY = process.env.OPENROUTER_API_KEY;
    
    if (!API_KEY) {
      throw new Error("OpenRouter API key is not configured");
    }
    
    console.log(`Querying model ${modelId} for prompt: "${prompt.substring(0, 30)}..."`);
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": "https://vistai.replit.app",
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
      content: `Error getting response from ${modelId}: ${error.message || 'Unknown error'}`,
      title: `Error from ${modelId}`,
      responseTime: 0
    };
  }
}

// Helper to extract a title from response content
function extractTitle(content = "") {
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

// API endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    // Validate query
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid query. Please provide a search query.' });
    }
    
    // Define models to query
    const models = [
      "openai/gpt-4",
      "anthropic/claude-2", 
      "meta-llama/llama-2-70b-chat",
      "mistralai/mistral-7b-instruct"
    ];
    
    console.log(`Processing search query: "${query}"`);
    
    // Query OpenRouter for each model
    const resultPromises = models.map(async (modelId, index) => {
      const modelResponse = await queryOpenRouter(query, modelId);
      
      return {
        id: index + 1,
        searchId: 1,
        modelId,
        content: modelResponse.content,
        title: modelResponse.title,
        responseTime: modelResponse.responseTime,
        createdAt: new Date(),
        modelName: modelId.split('/')[1]
      };
    });
    
    // Wait for all model responses
    const results = await Promise.all(resultPromises);
    
    res.json({
      search: {
        id: 1,
        query,
        createdAt: new Date()
      },
      results,
      totalTime: Math.max(...results.map(r => r.responseTime || 0))
    });
    
  } catch (error) {
    console.error('Error processing search:', error);
    res.status(500).json({ error: 'Server error processing search' });
  }
});

// Serve our static HTML
app.get(['/', '/search'], (req, res) => {
  const htmlPath = path.resolve('./server/public/fallback.html');
  res.sendFile(htmlPath);
});

// Additional route for debugging
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV,
    apiKeyConfigured: !!process.env.OPENROUTER_API_KEY,
    publicPath: publicPath,
    publicPathExists: fs.existsSync(publicPath),
    htmlExists: fs.existsSync(path.resolve('./server/public/fallback.html'))
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Standalone server running on port ${PORT}`);
  console.log(`Server time: ${new Date().toISOString()}`);
  console.log(`Serving static files from: ${publicPath}`);
  console.log(`View app at: http://localhost:${PORT}/`);
});