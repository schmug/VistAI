//================================================================
// Pure Node.js server for AI Search Engine
// - No dependencies
// - Self-contained
// - Works with "type": "module" in package.json
//================================================================

import http from 'http';
import { promises as fs } from 'fs';

// Get API key from environment
const API_KEY = process.env.OPENROUTER_API_KEY;

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  console.log(`${req.method} ${path}`);
  
  // Serve HTML
  if (path === '/' || path === '/index.html') {
    try {
      // Read our HTML from disk
      const htmlContent = await fs.readFile('./index.html', 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(htmlContent);
    } catch (error) {
      console.error('Error reading HTML file:', error);
      
      // Fallback: basic HTML
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>AI Search Engine</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #121212; color: #e0e0e0; }
            h1 { color: #9333EA; }
            .error { color: #ef4444; padding: 10px; border: 1px solid #ef4444; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>AI Search Engine</h1>
          <div class="error">
            <p>Error: Could not load index.html file</p>
            <p>Please ensure index.html exists in the root directory</p>
          </div>
        </body>
        </html>
      `);
    }
    return;
  }
  
  // Handle API status check
  if (path === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      apiKey: !!API_KEY,
      time: new Date().toISOString()
    }));
    return;
  }
  
  // Handle API search
  if (path === '/api/search' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { query } = JSON.parse(body);
        
        if (!query || typeof query !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Invalid query' }));
        }
        
        console.log(`Search query: "${query}"`);
        
        // Define models to query
        const models = [
          "openai/gpt-4",
          "anthropic/claude-2", 
          "meta-llama/llama-2-70b-chat",
          "mistralai/mistral-7b-instruct"
        ];
        
        // Check if API key is available
        if (API_KEY) {
          console.log("Using OpenRouter API");
          
          try {
            // Query each model
            const modelPromises = models.map(async (modelId, index) => {
              try {
                console.log(`Querying ${modelId}...`);
                const startTime = Date.now();
                
                const apiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`,
                    "HTTP-Referer": "https://aisearch.replit.app",
                    "X-Title": "AI Search Engine"
                  },
                  body: JSON.stringify({
                    model: modelId,
                    messages: [{ role: "user", content: query }],
                    max_tokens: 500
                  }),
                });
                
                if (!apiResponse.ok) {
                  throw new Error(`API Error: ${apiResponse.status}`);
                }
                
                const data = await apiResponse.json();
                const responseTime = Date.now() - startTime;
                
                // Extract content
                const content = data.choices[0]?.message?.content || "No response";
                
                // Generate a title from the first line
                const firstLine = content.split('\n')[0].trim();
                const title = firstLine.length > 70 
                  ? firstLine.substring(0, 70) + '...' 
                  : firstLine;
                
                return {
                  id: index + 1,
                  searchId: 1,
                  modelId,
                  content,
                  title,
                  responseTime,
                  createdAt: new Date().toISOString(),
                  modelName: modelId.split('/')[1]
                };
              } catch (error) {
                console.error(`Error with ${modelId}:`, error.message);
                
                // Return error result
                return {
                  id: index + 1,
                  searchId: 1,
                  modelId,
                  content: `Error getting response: ${error.message}`,
                  title: `Error from ${modelId.split('/')[1]}`,
                  responseTime: 0,
                  createdAt: new Date().toISOString(),
                  modelName: modelId.split('/')[1]
                };
              }
            });
            
            const results = await Promise.all(modelPromises);
            
            // Track click counts (simplified in-memory version)
            const totalResponseTime = Math.max(...results.map(r => r.responseTime || 0));
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              search: { 
                id: 1,
                query,
                createdAt: new Date().toISOString()
              },
              results,
              totalTime: totalResponseTime
            }));
            return;
          } catch (error) {
            console.error("OpenRouter API error:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: 'Server error processing OpenRouter API request',
              details: error.message 
            }));
            return;
          }
        } else {
          // API key not configured
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'OpenRouter API key not configured',
            details: 'Please set the OPENROUTER_API_KEY environment variable' 
          }));
          return;
        }
      } catch (error) {
        console.error("Request error:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error parsing request' }));
      }
    });
    return;
  }
  
  // 404 for other paths
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Search Engine running at http://localhost:${PORT}/`);
  console.log(`OpenRouter API key configured: ${!!API_KEY}`);
});