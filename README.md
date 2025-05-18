# VistAI - Multi-LLM Search Platform

VistAI is a platform that aggregates responses from various language models via OpenRouter, providing a unified and intuitive search experience.

## ⚠️ IMPORTANT: How to Run the Application

Due to compatibility issues with Replit's environment, please use our **minimal standalone server**:

```bash
./start.sh
```

Then open the web preview URL or visit http://localhost:5000/ in your browser.

## Features

- **Multi-Model Search**: Query multiple AI models simultaneously and compare their responses
- **Real-time Analytics**: Track which models users prefer through click metrics
- **Responsive UI**: Dark-mode Google-inspired interface that works on all devices
- **Performance Tracking**: See which models respond fastest and are chosen most often

## Troubleshooting

If you encounter any issues:

1. Make sure you have the `OPENROUTER_API_KEY` environment variable set
2. Check if the server is running with `ps aux | grep node`
3. If needed, kill existing processes with `pkill node`
4. Restart the standalone server with `./start.sh`

## Project Structure

- `minimal-server.cjs`: A completely standalone implementation that works in Replit
- `server/`: Backend Express API and server logic (standard implementation)
- `client/`: React frontend components and pages (standard implementation)
- `shared/`: Shared types and schemas between frontend and backend

## OpenRouter Integration

This application integrates with OpenRouter to query various AI models including:
- OpenAI GPT-4
- Anthropic Claude 2
- Meta Llama 2
- Mistral AI

## Implementation Details

1. A search query is sent to multiple AI models via OpenRouter
2. Responses are collected and displayed side-by-side for comparison
3. User clicks on responses are tracked to build a performance profile of each model
4. Analytics show which models users prefer for different types of queries

## Development Challenges

The initial implementation using Vite and WebSockets faced compatibility issues in the Replit environment. We created a simplified standalone version that works reliably without external dependencies.

## Next Steps

Future enhancements could include:
- User accounts and personalized model rankings
- Adding more AI models to the comparison
- Implementing revenue sharing based on user preferences