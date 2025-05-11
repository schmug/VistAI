// A completely standalone server with no external dependencies beyond Node.js stdlib
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Create HTTP server
const server = http.createServer((req, res) => {
  // Parse the URL
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  
  console.log(`Request: ${req.method} ${pathname}`);
  
  // Handle API endpoints
  if (pathname === '/api/search' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const query = data.query;
        
        if (!query || typeof query !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid query. Please provide a search query.' }));
          return;
        }
        
        console.log(`Processing search query: "${query}"`);
        
        // Define models to query
        const models = [
          "openai/gpt-4",
          "anthropic/claude-2", 
          "meta-llama/llama-2-70b-chat",
          "mistralai/mistral-7b-instruct"
        ];
        
        try {
          // Use real OpenRouter API if the key is available
          const API_KEY = process.env.OPENROUTER_API_KEY;
          
          if (API_KEY) {
            console.log("Using OpenRouter API for search...");
            
            const fetchPromises = models.map(async (modelId, index) => {
              try {
                console.log(`Querying model ${modelId}...`);
                
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
                  }),
                });
                
                if (!apiResponse.ok) {
                  const errorText = await apiResponse.text();
                  throw new Error(`API Error: ${apiResponse.status} - ${errorText}`);
                }
                
                const data = await apiResponse.json();
                
                return {
                  id: index + 1,
                  searchId: 1,
                  modelId,
                  content: data.choices[0]?.message?.content || "No response from model",
                  title: data.choices[0]?.message?.content?.split('\n')[0] || `${modelId.split('/')[1]} Response`,
                  responseTime: Math.round(data.usage?.total_ms || 0),
                  createdAt: new Date().toISOString(),
                  modelName: modelId.split('/')[1]
                };
              } catch (error) {
                console.error(`Error with model ${modelId}:`, error.message);
                
                return {
                  id: index + 1,
                  searchId: 1,
                  modelId,
                  content: `Error getting response from ${modelId}: ${error.message}`,
                  title: `Error from ${modelId}`,
                  responseTime: 0,
                  createdAt: new Date().toISOString(),
                  modelName: modelId.split('/')[1]
                };
              }
            });
            
            const results = await Promise.all(fetchPromises);
            
            const responseData = {
              search: {
                id: 1,
                query,
                createdAt: new Date().toISOString()
              },
              results,
              totalTime: Math.max(...results.map(r => r.responseTime || 0))
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(responseData));
            return;
          }
        } catch (apiError) {
          console.error("OpenRouter API error:", apiError);
          // Fall back to mock responses if API fails
        }
        
        // Mock responses if API call fails or no API key
        console.log("Using mock responses for search");
        const results = models.map((modelId, index) => ({
          id: index + 1,
          searchId: 1,
          modelId,
          content: `This is a placeholder response from ${modelId} for query: "${query}"`,
          title: `${modelId.split('/')[1]} Response`,
          responseTime: Math.floor(Math.random() * 2000) + 500,
          createdAt: new Date().toISOString(),
          modelName: modelId.split('/')[1]
        }));
        
        const responseData = {
          search: {
            id: 1,
            query,
            createdAt: new Date().toISOString()
          },
          results,
          totalTime: Math.max(...results.map(r => r.responseTime))
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responseData));
        
      } catch (error) {
        console.error('Error parsing request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON in request body' }));
      }
    });
    return;
  }
  
  // Serve static HTML page for root
  if (pathname === '/' || pathname === '/search' || pathname === '/index.html') {
    const pathsToTry = [
      path.join(__dirname, 'server', 'public', 'fallback.html'),
      path.join(__dirname, 'server', 'static-index.html'),
      path.join(__dirname, 'fallback.html')
    ];
    
    // Try each path until we find a file that exists
    let fileFound = false;
    
    for (const htmlPath of pathsToTry) {
      if (fs.existsSync(htmlPath)) {
        fs.readFile(htmlPath, (err, data) => {
          if (err) {
            res.writeHead(500);
            res.end(`Error reading file: ${err.message}`);
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        });
        fileFound = true;
        break;
      }
    }
    
    if (!fileFound) {
      // If no file found, serve a basic HTML page
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AISearch</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #9333EA; }
            input { width: 70%; padding: 8px; }
            button { background: #9333EA; color: white; border: none; padding: 8px 15px; cursor: pointer; }
            .results { margin-top: 20px; }
            .card { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>AISearch</h1>
          <p>Search across multiple AI models</p>
          
          <div>
            <input id="search-input" type="text" placeholder="Enter your query...">
            <button id="search-button">Search</button>
          </div>
          
          <div id="results" class="results"></div>
          
          <script>
            document.getElementById('search-button').addEventListener('click', search);
            document.getElementById('search-input').addEventListener('keydown', e => {
              if (e.key === 'Enter') search();
            });
            
            async function search() {
              const query = document.getElementById('search-input').value;
              if (!query) return;
              
              document.getElementById('results').innerHTML = '<p>Searching...</p>';
              
              try {
                const response = await fetch('/api/search', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ query })
                });
                
                if (!response.ok) throw new Error('Search failed');
                
                const data = await response.json();
                
                let html = '<h2>Search Results</h2>';
                data.results.forEach(result => {
                  html += \`
                    <div class="card">
                      <h3>\${result.title || 'AI Response'}</h3>
                      <p><strong>\${result.modelName || result.modelId}</strong></p>
                      <p>\${result.content}</p>
                    </div>
                  \`;
                });
                
                document.getElementById('results').innerHTML = html;
              } catch (error) {
                document.getElementById('results').innerHTML = '<p>Error: ' + error.message + '</p>';
              }
            }
          </script>
        </body>
      </html>
      `);
    }
    return;
  }
  
  // Status endpoint
  if (pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      time: new Date().toISOString(),
      node: process.version
    }));
    return;
  }
  
  // Handle 404 - Not Found
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Pure Node.js server running on port ${PORT}`);
  console.log(`Server time: ${new Date().toISOString()}`);
  console.log(`View app at: http://localhost:${PORT}/`);
});