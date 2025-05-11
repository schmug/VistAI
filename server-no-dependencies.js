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
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const query = data.query;
        
        if (!query || typeof query !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid query. Please provide a search query.' }));
          return;
        }
        
        // Mock response data for now
        const models = [
          "openai/gpt-4",
          "anthropic/claude-2", 
          "meta-llama/llama-2-70b-chat",
          "mistralai/mistral-7b-instruct"
        ];
        
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
  if (pathname === '/' || pathname === '/search') {
    const htmlPath = path.join(__dirname, 'server', 'public', 'fallback.html');
    
    fs.readFile(htmlPath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
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