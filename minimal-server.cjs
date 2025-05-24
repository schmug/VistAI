// A minimal, single-file server implementation
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 5000;
const API_KEY = process.env.OPENROUTER_API_KEY;

// Create a basic HTML page
const MINIMAL_HTML = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VistAI</title>
    <style>
      body { 
        font-family: Arial, sans-serif; 
        max-width: 800px; 
        margin: 0 auto; 
        padding: 20px; 
        background-color: #121212; 
        color: #e0e0e0; 
      }
      h1 { color: #9333EA; }
      input { 
        width: 70%; 
        padding: 12px; 
        border: 1px solid #444;
        border-radius: 24px 0 0 24px; 
        background-color: #1e1e1e;
        color: #e0e0e0;
        font-size: 16px;
      }
      button { 
        background: #9333EA; 
        color: white; 
        border: none; 
        padding: 12px 15px;
        border-radius: 0 24px 24px 0;
        cursor: pointer; 
      }
      .search-container {
        display: flex;
        margin: 30px 0;
      }
      .results { margin-top: 30px; }
      .card { 
        border: 1px solid #333; 
        padding: 15px; 
        margin-bottom: 20px; 
        border-radius: 8px; 
        background-color: #1e1e1e;
        transition: transform 0.2s;
      }
      .card:hover {
        transform: translateY(-5px);
        border-color: #9333EA;
      }
      .model-badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 12px;
        margin-bottom: 10px;
      }
      .gpt { background-color: rgba(16, 185, 129, 0.2); color: #10B981; }
      .claude { background-color: rgba(147, 51, 234, 0.2); color: #9333EA; }
      .llama { background-color: rgba(245, 158, 11, 0.2); color: #F59E0B; }
      .mistral { background-color: rgba(59, 130, 246, 0.2); color: #3B82F6; }
      .response-time {
        font-size: 12px;
        color: #888;
        margin-top: 10px;
        text-align: right;
      }
      .loading { 
        text-align: center; 
        padding: 20px;
        font-style: italic;
      }
      h3 { margin-top: 0; }
      .error { color: #f87171; }
    </style>
  </head>
  <body>
    <h1>VistAI</h1>
    <p>Compare responses from multiple AI models</p>
    
    <div class="search-container">
      <input id="search-input" type="text" placeholder="Ask AI anything...">
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
        
        document.getElementById('results').innerHTML = '<div class="loading">Searching multiple AI models. This might take a moment...</div>';
        
        try {
          const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
          });
          
          if (!response.ok) throw new Error('Search failed with status: ' + response.status);
          
          const data = await response.json();
          
          let html = '<h2>Search Results</h2>';
          data.results.forEach(result => {
            const modelName = result.modelName || result.modelId.split('/').pop();
            let modelClass = 'mistral';
            
            if (modelName.includes('gpt')) {
              modelClass = 'gpt';
            } else if (modelName.includes('claude')) {
              modelClass = 'claude';
            } else if (modelName.includes('llama')) {
              modelClass = 'llama';
            }
            
            html += \`
              <div class="card">
                <div class="model-badge \${modelClass}">\${modelName}</div>
                <h3>\${result.title || 'AI Response'}</h3>
                <div>\${result.content.replace(/\\n/g, '<br>')}</div>
                <div class="response-time">Response time: \${(result.responseTime / 1000).toFixed(2)}s</div>
              </div>
            \`;
          });
          
          document.getElementById('results').innerHTML = html;
        } catch (error) {
          document.getElementById('results').innerHTML = '<p class="error">Error: ' + error.message + '</p>';
        }
      }
    </script>
  </body>
</html>
`;

// Create server
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  console.log(`${req.method} ${path}`);
  
  // Serve HTML for root path
  if (path === '/' || path === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(MINIMAL_HTML);
    return;
  }
  
  // Handle API search endpoint
  if (path === '/api/search' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const requestData = JSON.parse(body);
        const { query } = requestData;
        
        if (!query || typeof query !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            error: 'Invalid query. Please provide a search query.'
          }));
        }
        
        console.log(`Processing search query: "${query}"`);
        
        // Define models to query
        const models = [
          "openai/gpt-4",
          "anthropic/claude-2", 
          "meta-llama/llama-2-70b-chat",
          "mistralai/mistral-7b-instruct"
        ];
        
        const useRealAPI = !!API_KEY;
        
        if (useRealAPI) {
          console.log("Using OpenRouter API for search...");
          
          try {
            // Query each model through OpenRouter
            const modelPromises = models.map(async (modelId, index) => {
              try {
                console.log(`Querying ${modelId}...`);
                
                const apiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`,
                    "HTTP-Referer": "https://vistai.replit.app",
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
            
            const results = await Promise.all(modelPromises);
            
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
          } catch (apiError) {
            console.error("Error calling OpenRouter API:", apiError);
            // Fall back to mock data if API call fails
          }
        }
        
        // Mock responses for testing or when API key not available
        console.log("Using mock responses for search");
        
        // Create mock responses 
        const mockResults = models.map((modelId, index) => ({
          id: index + 1,
          searchId: 1,
          modelId,
          content: `This is a placeholder response from ${modelId} about "${query}".\n\nIn a full implementation, this would be a response from the actual AI model.`,
          title: `Response about: ${query}`,
          responseTime: Math.floor(Math.random() * 1500) + 500,
          createdAt: new Date().toISOString(),
          modelName: modelId.split('/')[1]
        }));
        
        const responseData = {
          search: {
            id: 1,
            query,
            createdAt: new Date().toISOString()
          },
          results: mockResults,
          totalTime: Math.max(...mockResults.map(r => r.responseTime))
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responseData));
        
      } catch (error) {
        console.error("Error processing request:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  }
  
  // Handle status endpoint
  if (path === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      time: new Date().toISOString(),
      apiKeyConfigured: !!API_KEY
    }));
    return;
  }
  
  // Default 404 handler
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
  
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal server running on port ${PORT}`);
  const hasKey = !!API_KEY;
  console.log(`OpenRouter API Key configured: ${hasKey}`);
  if (!hasKey) {
    console.warn('OPENROUTER_API_KEY is not set - using mock responses');
  }
  console.log(`Server time: ${new Date().toISOString()}`);
  console.log(`View app at: http://localhost:${PORT}/`);
});