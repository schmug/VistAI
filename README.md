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

## Environment Variables

Set `OPENROUTER_API_KEY` as a secret when deploying the Cloudflare worker.
Use `ACCESS_CONTROL_ALLOW_ORIGIN` to control which origins may access the Worker
APIs. Provide `*` to allow any origin or a comma separated list of allowed
origins.

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

## Deploying to Cloudflare

1. Deploy the static frontend using **Cloudflare Pages**.

   - Set the build command to `npm run build` and the output directory to `dist/public`.
   - **Do not set** the `GITHUB_PAGES` environment variable when building for Cloudflare Pages. Leaving it enabled changes Vite's `base` path to `/VistAI/`, which will break asset and API URLs.
  - Provide the Worker URL via the `API_BASE_URL` environment variable. When this variable is set the build script automatically appends the following snippet into `dist/public/index.html`:

    ```html
    <script>window.API_BASE_URL = "<%= process.env.API_BASE_URL %>";</script>
    ```

     The application reads `window.API_BASE_URL` at runtime and prefixes all API requests with this value. If `GITHUB_PAGES` is enabled or `API_BASE_URL` points to the wrong location, the frontend will request assets and API routes from incorrect paths and you will see 404 errors.

2. Deploy the API using **Cloudflare Workers** with `wrangler`. The Worker's configuration is defined in `wrangler.toml`.

3. Set your OpenRouter API key as a secret for the Worker. Run `wrangler secret put OPENROUTER_API_KEY` or add the variable under **Settings > Variables** in the Cloudflare dashboard so the Worker can authenticate with OpenRouter.

   The Worker checks that both this API key and the `DB` database binding are configured before handling any request. If either is missing it responds with HTTP 500 and a descriptive error.

4. The repository includes a GitHub Actions workflow that automatically runs `wrangler deploy` whenever changes to the Worker are pushed to the `main` branch. Configure `CF_API_TOKEN` and `CF_ACCOUNT_ID` secrets in your repository settings to enable this automation.

Once both are deployed the site will automatically call the Worker endpoints via the configured base URL.

## License

This project is licensed under the [MIT License](LICENSE).
