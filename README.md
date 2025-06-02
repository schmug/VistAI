# VistAI - Multi-LLM Search Platform

VistAI is a platform that aggregates responses from various language models via OpenRouter, providing a unified and intuitive search experience.

## How to Run

Run the Cloudflare worker locally with:

```bash
npx wrangler dev
```

Build the static frontend with:

```bash
npm run build
```

If `API_BASE_URL` is set when running the build command a post-build script will append
```
<script>window.API_BASE_URL = "<%= process.env.API_BASE_URL %>";</script>
```
to `dist/public/index.html`.

Open `dist/public/index.html` in your browser to test locally.

## Features

- **Multi-Model Search**: Query multiple AI models simultaneously and compare their responses
- **Real-time Analytics**: Track which models users prefer through click metrics
- **Responsive UI**: Material dark theme built with Material Web components and high-contrast colors that works on all devices
- **Performance Tracking**: See which models respond fastest and are chosen most often
- **User Accounts**: Register and log in to track personal model preferences
- **Voice Search**: Click the microphone to dictate your question

## Environment Variables

Set `OPENROUTER_API_KEY` as a secret when deploying the Cloudflare worker.
The worker uses this server-side key exclusively.
Use `ACCESS_CONTROL_ALLOW_ORIGIN` to control which origins may access the Worker
APIs. By default no cross-origin requests are allowed. Provide `*` for
development or a comma separated list of allowed origins.

## D1 Database

Search analytics are persisted in a Cloudflare D1 database. The worker expects a binding named `DB` which is configured in `wrangler.toml`. Replace the sample `database_id` with the ID of your database from the Cloudflare dashboard and apply the migrations:

```bash
# create the database if you haven't already
wrangler d1 create vistai
wrangler d1 migrations apply vistai
```

The schema for the initial migration lives in `worker/migrations/0001_init.sql`.

## Project Structure

- `client/`: React frontend components and pages
- `shared/`: Shared types and schemas
- `worker/`: Cloudflare Worker implementation

## Testing and Type Checking

Install dependencies including development packages before running the
test suite and TypeScript compilation:

```bash
npm ci
npm test
npm run check
```

## Development Best Practices

See [docs/best-practices.md](docs/best-practices.md) for code style guidelines and
commit etiquette.

## API Documentation

Interactive API docs are available when the worker is running. Visit
`/docs` in your browser to view a Swagger UI powered by the OpenAPI
specification exposed at `/api/openapi.yaml`.

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

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Deploy

1. **Database**: `wrangler d1 create vistai` and update database_id in `wrangler.toml`
2. **Secrets**: `wrangler secret put OPENROUTER_API_KEY` and `wrangler secret put JWT_SECRET`  
3. **Worker**: `wrangler deploy --env production`
4. **Frontend**: Deploy to Cloudflare Pages with `API_BASE_URL` environment variable

The application supports environment-specific configurations for development and production deployments.

## License

This project is licensed under the [MIT License](LICENSE).
