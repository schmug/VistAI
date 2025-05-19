#!/bin/bash
# Canonical start script for the minimal standalone server
export OPENROUTER_API_KEY=${OPENROUTER_API_KEY:-}
node minimal-server.cjs
