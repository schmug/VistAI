#!/bin/bash

# Kill any existing node processes to avoid port conflicts
pkill node || true

# Start the simplified server with the .cjs extension, passing the API key
OPENROUTER_API_KEY=$OPENROUTER_API_KEY node simple-server.cjs