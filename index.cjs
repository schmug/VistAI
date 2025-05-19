// Ultra-simple search engine with no dependencies
// This will override the default entrypoint and work more reliably
const http = require('http');
const API_KEY = process.env.OPENROUTER_API_KEY;

const HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VistAI</title>
  <style>
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      max-width: 900px; 
      margin: 0 auto; 
      padding: 20px; 
      background-color: #121212; 
      color: #e0e0e0; 
      line-height: 1.5;
    }
    h1, h2 { color: #9333EA; }
    input { 
      width: 75%; 
      padding: 12px 16px; 
      border: 1px solid #333;
      border-radius: 24px 0 0 24px; 
      background-color: #1e1e1e;
      color: #e0e0e0;
      font-size: 16px;
      outline: none;
    }
    input:focus {
      border-color: #9333EA;
      box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.2);
    }
    button { 
      background: #9333EA; 
      color: white; 
      border: none; 
      padding: 12px 20px;
      border-radius: 0 24px 24px 0;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }
    button:hover {
      background: #7e22ce;
    }
    .search-container {
      display: flex;
      margin: 32px 0;
    }
    .results { margin-top: 30px; }
    .card { 
      border: 1px solid #333; 
      padding: 20px; 
      margin-bottom: 24px; 
      border-radius: 8px; 
      background-color: #1e1e1e;
      transition: all 0.2s;
    }
    .card:hover {
      transform: translateY(-3px);
      border-color: #9333EA;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .model-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 13px;
      margin-bottom: 12px;
      font-weight: 500;
    }
    .gpt { background-color: rgba(16, 185, 129, 0.2); color: #10B981; }
    .claude { background-color: rgba(147, 51, 234, 0.2); color: #9333EA; }
    .llama { background-color: rgba(245, 158, 11, 0.2); color: #F59E0B; }
    .mistral { background-color: rgba(59, 130, 246, 0.2); color: #3B82F6; }
    .response-time {
      font-size: 12px;
      color: #888;
      margin-top: 12px;
      text-align: right;
    }
    .loading { 
      text-align: center; 
      padding: 30px;
      color: #9ca3af;
    }
    .error { 
      color: #f87171; 
      padding: 12px;
      border: 1px solid rgba(248, 113, 113, 0.3);
      border-radius: 6px;
      background-color: rgba(248, 113, 113, 0.1);
    }
    h3 { 
      margin-top: 0;
      color: #f8f8f8;
    }
    .intro {
      text-align: center;
      max-width: 600px;
      margin: 0 auto 40px auto;
      color: #9ca3af;
    }
    .footer {
      margin-top: 60px;
      text-align: center;
      color: #666;
      font-size: 13px;
    }
    .status {
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 4px;
      background: rgba(147, 51, 234, 0.1);
      color: #9333EA;
      position: fixed;
      bottom: 12px;
      right: 12px;
    }
  </style>
</head>
<body>
  <h1 style="text-align: center; font-size: 36px; margin-top: 60px;">AI<span style="color: #e0e0e0;">Search</span></h1>
  
  <div class="intro">
    <p>Compare responses from leading AI models in one search. See which one answers your question best!</p>
  </div>
  
  <div class="search-container">
    <input id="search-input" type="text" placeholder="Ask AI anything...">
    <button id="search-button">Search</button>
  </div>
  
  <div id="results" class="results"></div>
  
  <div class="footer">
    &copy; 2025 VistAI • Powered by OpenRouter
  </div>
  
  <div id="status" class="status"></div>
  
  <script>
    // Set status message
    document.getElementById('status').textContent = 'OpenRouter API: ${API_KEY ? 'Connected' : 'Not configured'}';
    
    // Handle search
    document.getElementById('search-button').addEventListener('click', search);
    document.getElementById('search-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') search();
    });
    
    async function search() {
      const query = document.getElementById('search-input').value;
      if (!query) return;
      
      document.getElementById('results').innerHTML = 
        '<div class="loading">' +
          '<p style="margin-bottom: 6px;">Searching multiple AI models...</p>' +
          '<p style="font-size: 13px;">This might take 10-15 seconds</p>' +
        '</div>';
      
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
        document.getElementById('results').innerHTML = '<div class="error">Error: ' + error.message + '</div>';
      }
    }
  </script>
</body>
</html>
`;

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  console.log(`${req.method} ${path}`);
  
  // Serve HTML
  if (path === '/' || path === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML);
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
                    max_tokens: 500
                  }),
                });
                
                if (!apiResponse.ok) {
                  throw new Error(`API Error: ${apiResponse.status}`);
                }
                
                const data = await apiResponse.json();
                
                return {
                  id: index + 1,
                  modelId,
                  content: data.choices[0]?.message?.content || "No response",
                  title: data.choices[0]?.message?.content?.split('\n')[0] || modelId.split('/')[1],
                  responseTime: Math.round(data.usage?.total_ms || 0),
                  modelName: modelId.split('/')[1]
                };
              } catch (error) {
                console.error(`Error with ${modelId}:`, error.message);
                
                // Return error result
                return {
                  id: index + 1,
                  modelId,
                  content: `Error getting response: ${error.message}`,
                  title: `Error from ${modelId.split('/')[1]}`,
                  responseTime: 0,
                  modelName: modelId.split('/')[1]
                };
              }
            });
            
            const results = await Promise.all(modelPromises);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              search: { query },
              results,
              totalTime: Math.max(...results.map(r => r.responseTime || 0))
            }));
            return;
          } catch (error) {
            console.error("OpenRouter API error:", error);
          }
        }
        
        // Fall back to mock responses
        console.log("Using mock responses");
        const mockResults = models.map((modelId, index) => ({
          id: index + 1,
          modelId,
          content: `This is a placeholder response about "${query}" from ${modelId.split('/')[1]}.\n\nIn a real implementation, this would be generated by the actual AI model.`,
          title: `About: ${query}`,
          responseTime: Math.floor(Math.random() * 1500) + 500,
          modelName: modelId.split('/')[1]
        }));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          search: { query },
          results: mockResults,
          totalTime: Math.max(...mockResults.map(r => r.responseTime))
        }));
        
      } catch (error) {
        console.error("Request error:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
      }
    });
    return;
  }
  
  // Handle status
  if (path === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      apiKey: !!API_KEY,
      time: new Date().toISOString()
    }));
    return;
  }
  
  // 404 for other paths
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
  
}).listen(3000, '0.0.0.0', () => {
  console.log('Ultra-simple server running at http://localhost:3000/');
  console.log('OpenRouter API configured:', !!API_KEY);
});