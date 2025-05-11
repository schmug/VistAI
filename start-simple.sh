#!/bin/bash

# Kill any existing node processes
pkill node || true

# Start the simplified server with API key from environment
OPENROUTER_API_KEY=$OPENROUTER_API_KEY node server.js