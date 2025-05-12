#!/bin/bash

# Script to start the static version of AI Search Engine
# This script avoids WebSocket errors by using a standalone server

# Kill any existing node processes
pkill node || true

# Start the static server with environment variables
OPENROUTER_API_KEY=$OPENROUTER_API_KEY npx tsx server/start-static.ts