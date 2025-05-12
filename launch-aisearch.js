// Minimal AI Search Engine Start Script
// This script requires no dependencies and launches the application directly

// Import Node built-in modules
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get environment variables
const API_KEY = process.env.OPENROUTER_API_KEY || null;
console.log(`OpenRouter API key configured: ${!!API_KEY}`);

// Create HTML page with embedded JavaScript
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AISearch - Compare AI Model Responses</title>
  <meta name="description" content="Search across multiple AI models to compare responses">
  
  <style>
    :root {
      --primary: #9333EA;
      --primary-hover: #7e22ce;
      --background: #121212;
      --card: #1e1e1e;
      --border: #333333;
      --text: #e0e0e0;
      --text-muted: #9ca3af;
      --gpt-color: #10B981;
      --claude-color: #9333EA;
      --llama-color: #F59E0B;
      --mistral-color: #3B82F6;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--background);
      color: var(--text);
      line-height: 1.6;
      padding: 0 20px;
    }
    
    .container {
      max-width: 960px;
      margin: 0 auto;
      padding: 40px 0;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .header h1 {
      font-size: 36px;
      margin-bottom: 10px;
    }
    
    .header p {
      color: var(--text-muted);
    }
    
    .search-container {
      margin: 30px 0;
      display: flex;
      max-width: 700px;
      margin: 0 auto 50px auto;
    }
    
    .search-input {
      flex: 1;
      padding: 12px 20px;
      border: 1px solid var(--border);
      border-radius: 24px 0 0 24px;
      background-color: var(--card);
      color: var(--text);
      font-size: 16px;
      outline: none;
    }
    
    .search-input:focus {
      border-color: var(--primary);
    }
    
    .search-button {
      background-color: var(--primary);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 0 24px 24px 0;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    
    .search-button:hover {
      background-color: var(--primary-hover);
    }
    
    .results-title {
      margin-bottom: 20px;
      color: var(--primary);
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
    }
    
    .error {
      background-color: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    
    .card {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      transition: transform 0.2s, border-color 0.2s;
    }
    
    .card:hover {
      transform: translateY(-3px);
      border-color: var(--primary);
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .model-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 500;
    }
    
    .gpt {
      background-color: rgba(16, 185, 129, 0.1);
      color: var(--gpt-color);
    }
    
    .claude {
      background-color: rgba(147, 51, 234, 0.1);
      color: var(--claude-color);
    }
    
    .llama {
      background-color: rgba(245, 158, 11, 0.1);
      color: var(--llama-color);
    }
    
    .mistral {
      background-color: rgba(59, 130, 246, 0.1);
      color: var(--mistral-color);
    }
    
    .card-title {
      margin-bottom: 10px;
      color: white;
    }
    
    .card-content {
      margin-bottom: 15px;
      color: var(--text);
      white-space: pre-line;
    }
    
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--text-muted);
      font-size: 14px;
      border-top: 1px solid var(--border);
      padding-top: 15px;
      margin-top: 15px;
    }
    
    .footer {
      text-align: center;
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 14px;
    }
    
    .api-status {
      position: fixed;
      bottom: 15px;
      right: 15px;
      background-color: rgba(147, 51, 234, 0.1);
      color: var(--primary);
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 20px 0;
      }
      
      .search-container {
        flex-direction: column;
        margin-bottom: 30px;
      }
      
      .search-input {
        border-radius: 24px;
        margin-bottom: 10px;
        width: 100%;
      }
      
      .search-button {
        border-radius: 24px;
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1><span style="color: var(--primary);">AI</span>Search</h1>
      <p>Compare responses from multiple AI models with a single search</p>
    </header>
    
    <div class="search-container">
      <input type="text" id="search-input" class="search-input" placeholder="Ask AI anything...">
      <button id="search-button" class="search-button">Search</button>
    </div>
    
    <div id="results">
      <!-- Search results will appear here -->
    </div>
    
    <footer class="footer">
      <p>&copy; 2025 AISearch • Powered by OpenRouter API</p>
      <p style="margin-top: 5px; font-size: 12px;">Results are provided by various AI models and may vary in accuracy and content</p>
    </footer>
  </div>
  
  <div id="api-status" class="api-status">API Status: Checking...</div>
  
  <script>
    // DOM elements
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const resultsContainer = document.getElementById('results');
    const apiStatus = document.getElementById('api-status');
    
    // Check API status
    async function checkApiStatus() {
      try {
        const response = await fetch('/api/status');
        if (response.ok) {
          const data = await response.json();
          apiStatus.textContent = \`API Status: \${data.apiKey ? 'Connected' : 'Not configured'}\`;
          apiStatus.style.backgroundColor = data.apiKey ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
          apiStatus.style.color = data.apiKey ? '#10B981' : '#ef4444';
        } else {
          apiStatus.textContent = 'API Status: Error';
          apiStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          apiStatus.style.color = '#ef4444';
        }
      } catch (error) {
        apiStatus.textContent = 'API Status: Unavailable';
        apiStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        apiStatus.style.color = '#ef4444';
      }
    }
    
    // Format responses
    function createResultCard(result) {
      const modelName = result.modelName || result.modelId.split('/').pop();
      let modelClass = 'mistral';
      
      if (modelName.toLowerCase().includes('gpt')) {
        modelClass = 'gpt';
      } else if (modelName.toLowerCase().includes('claude')) {
        modelClass = 'claude';
      } else if (modelName.toLowerCase().includes('llama')) {
        modelClass = 'llama';
      }
      
      return \`
        <div class="card">
          <div class="card-header">
            <span class="model-badge \${modelClass}">\${modelName}</span>
          </div>
          <h3 class="card-title">\${result.title || 'AI Response'}</h3>
          <div class="card-content">\${result.content}</div>
          <div class="card-footer">
            <span>Response time: \${(result.responseTime / 1000).toFixed(2)}s</span>
          </div>
        </div>
      \`;
    }
    
    // Perform search
    async function performSearch() {
      const query = searchInput.value.trim();
      
      if (!query) {
        return;
      }
      
      // Show loading state
      resultsContainer.innerHTML = \`
        <div class="loading">
          <p>Searching across multiple AI models...</p>
          <p style="font-size: 14px; margin-top: 10px;">This may take 10-15 seconds</p>
        </div>
      \`;
      
      try {
        // Make search request
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query })
        });
        
        // Handle errors
        if (!response.ok) {
          throw new Error(\`Server error: \${response.status}\`);
        }
        
        // Parse response
        const data = await response.json();
        
        // Display results
        let resultsHTML = \`
          <h2 class="results-title">Search Results</h2>
        \`;
        
        // Create result cards
        data.results.forEach(result => {
          resultsHTML += createResultCard(result);
        });
        
        resultsContainer.innerHTML = resultsHTML;
        
      } catch (error) {
        // Display error
        resultsContainer.innerHTML = \`
          <div class="error">
            <p>Error: \${error.message}</p>
            <p style="margin-top: 8px; font-size: 14px;">Please try again in a few moments</p>
          </div>
        \`;
      }
    }
    
    // Event listeners
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
    
    // Check API status on load
    checkApiStatus();
    
    // Add example suggestions
    const exampleQueries = [
      "Explain quantum computing in simple terms",
      "What are the best programming languages to learn in 2025?",
      "Compare React vs Angular vs Vue for frontend development",
      "How does machine learning work?",
      "What's the difference between artificial intelligence and machine learning?"
    ];
    
    // Focus search input on load
    searchInput.focus();
    searchInput.placeholder = exampleQueries[Math.floor(Math.random() * exampleQueries.length)];
  </script>
</body>
</html>`;

// Create server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  console.log(`${req.method} ${path}`);
  
  // Serve HTML
  if (path === '/' || path === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlContent);
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

// Start server - use port 3333 to avoid conflicts with existing server
const PORT = 3333;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`AI Search Engine is running!`);
  console.log(`======================================================`);
  console.log(`👉 View: http://localhost:${PORT}/`);
  console.log(`OpenRouter API key configured: ${!!API_KEY}`);
  console.log(`======================================================\n`);
});