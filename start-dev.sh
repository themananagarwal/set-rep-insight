#!/bin/bash
echo "Starting backend..."
(cd server && npm run dev) &
BACKEND_PID=$!
echo "Starting frontend..."
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
