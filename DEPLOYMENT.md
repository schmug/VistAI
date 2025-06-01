# VistAI Deployment Guide

This guide covers deploying VistAI to Cloudflare Pages (frontend) and Cloudflare Workers (backend).

## Prerequisites

- Cloudflare account
- Node.js and npm installed
- Wrangler CLI installed: `npm install -g wrangler`
- OpenRouter API key (get one at [openrouter.ai](https://openrouter.ai))

## 1. Database Setup

Create and configure the D1 database:

```bash
# Create the database
wrangler d1 create vistai

# Copy the database_id from the output and update wrangler.toml
# Replace the database_id in wrangler.toml with your actual ID

# Apply migrations
wrangler d1 migrations apply vistai
```

## 2. Worker Configuration

Set up required secrets and environment variables:

```bash
# Set OpenRouter API key (required)
wrangler secret put OPENROUTER_API_KEY

# Set JWT secret for authentication (recommended)
wrangler secret put JWT_SECRET

# For production deployment
wrangler secret put OPENROUTER_API_KEY --env production
wrangler secret put JWT_SECRET --env production
```

## 3. Deploy Worker

Deploy the backend API:

```bash
# Development deployment
wrangler deploy

# Production deployment  
wrangler deploy --env production
```

## 4. Frontend Deployment

Deploy to Cloudflare Pages:

### Option A: Using Cloudflare Dashboard

1. Go to Cloudflare Dashboard > Pages
2. Connect your GitHub repository
3. Set build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist/public`
   - **Environment variables**:
     - `API_BASE_URL`: Your worker URL (e.g., `https://vistai-worker.your-subdomain.workers.dev`)

### Option B: Using Wrangler

```bash
# Build the frontend
npm run build

# Deploy to Pages (configure pages project first)
wrangler pages deploy dist/public
```

## 5. Environment Variables

### Required Secrets (Worker)
- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `JWT_SECRET` - Secret for JWT token signing (generates random if not set)

### Optional Variables (Worker)
- `ACCESS_CONTROL_ALLOW_ORIGIN` - CORS configuration (defaults to "*")

### Required Variables (Frontend - Cloudflare Pages)
- `API_BASE_URL` - Your worker URL for API requests

## 6. Database Configuration

Update `wrangler.toml` with your actual database ID:

```toml
[[d1_databases]]
binding = "DB" 
database_name = "vistai"
database_id = "YOUR_ACTUAL_DATABASE_ID_HERE"
```

## 7. Production Environment

For production, use the production environment:

```bash
# Deploy worker to production
wrangler deploy --env production

# Set production-specific secrets
wrangler secret put OPENROUTER_API_KEY --env production
```

## 8. Verify Deployment

1. Check worker status: Visit `https://your-worker.workers.dev/api/status`
2. Check frontend: Visit your Pages URL
3. Test search functionality
4. Verify user registration/login

## Troubleshooting

### Common Issues

1. **Database not found**
   - Verify database_id in wrangler.toml matches your D1 database
   - Run migrations: `wrangler d1 migrations apply vistai`

2. **CORS errors**  
   - Set `ACCESS_CONTROL_ALLOW_ORIGIN` to your frontend URL
   - For development, use "*"

3. **API key errors**
   - Ensure `OPENROUTER_API_KEY` is set as a secret
   - Test with `/api/status` endpoint

4. **Frontend can't reach API**
   - Set `API_BASE_URL` environment variable in Pages
   - Check that worker URL is correct

### Environment-Specific Deployment

- **Development**: `wrangler deploy --env development`
- **Production**: `wrangler deploy --env production` 

## GitHub Actions (Optional)

The repository includes GitHub Actions for automatic deployment. Configure these secrets in your repository:

- `CF_API_TOKEN` - Cloudflare API token
- `CF_ACCOUNT_ID` - Your Cloudflare account ID