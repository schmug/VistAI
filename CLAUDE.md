# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `npm run build` - Build frontend and inject API base URL
- `npm run check` - TypeScript type checking
- `npm test` - Run test suite using tsx
- `npx wrangler dev` - Run Cloudflare Worker locally for development

### Database
- `wrangler d1 create vistai` - Create D1 database
- `wrangler d1 migrations apply vistai` - Apply database migrations

### Testing
Run single test file: `tsx --test tests/[filename].test.ts`

## Architecture Overview

VistAI is a multi-LLM search platform with three main components:

### Frontend (`client/`)
- React app using Wouter for routing
- Radix UI + Tailwind CSS for components
- TanStack Query for data fetching
- Main pages: Home, SearchResults, Dashboard, Settings, Login/Register

### Worker (`worker/`)
- Cloudflare Worker handling API requests
- Integrates with OpenRouter for multiple AI models
- Uses D1 database for analytics and user management
- Supports both regular JSON and streaming responses

### Shared (`shared/`)
- Database schema definitions using Drizzle ORM
- Zod validation schemas for type safety

## Key Technical Details

### API Integration
- OpenRouter API for querying multiple LLM models
- Fallback models: `google/gemini-2.0-flash-001`, `openai/gpt-4o-mini`, `anthropic/claude-3.7-sonnet`, etc.
- Dynamic model selection from top-performing and trending models

### Database Schema
Core tables: `users`, `searches`, `results`, `clicks`, `model_stats`
- Tracks search queries, model responses, and user click analytics
- Analytics show model performance and user preferences

### Environment Configuration
- `OPENROUTER_API_KEY` - Required for API access
- `API_BASE_URL` - Frontend API endpoint configuration
- `ACCESS_CONTROL_ALLOW_ORIGIN` - CORS configuration

### Deployment
- Frontend: Cloudflare Pages with `npm run build`
- Worker: Cloudflare Workers with `wrangler deploy`
- Database: D1 with migrations in `worker/migrations/`

## Development Notes

### Frontend State Management
- No global state management - uses React Query for server state
- Authentication via Bearer tokens stored in localStorage
- Dark theme with high-contrast Material design

### Worker Architecture
- Single entry point with route-based request handling
- Streaming and regular response modes for search endpoints
- Built-in OpenAPI documentation at `/docs`

### Testing Strategy
- Unit tests in `tests/` directory
- Uses Node.js built-in test runner via tsx
- Tests cover worker endpoints, utilities, and model selection