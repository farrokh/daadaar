#!/bin/bash
# Development script to run both frontend and backend concurrently

# Run frontend and backend in parallel
bun --cwd frontend run dev &
FRONTEND_PID=$!

bun --cwd backend run dev &
BACKEND_PID=$!

# Function to cleanup on exit
cleanup() {
  echo "Stopping servers..."
  kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
  exit
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait

