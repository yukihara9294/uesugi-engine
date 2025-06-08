#!/bin/bash

echo "Starting Uesugi Engine..."

# Stop any existing containers
docker compose down

# Start backend services first
echo "Starting backend services..."
docker compose up -d db redis backend

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
sleep 10

# Start frontend separately
echo "Starting frontend..."
docker compose up -d frontend

echo ""
echo "Services starting up..."
echo "Frontend will be available at http://localhost:3000 in about 60-90 seconds"
echo ""
echo "You can check the status with:"
echo "  docker logs uesugi-engine-frontend-1 --tail 20"
echo ""
echo "Once you see 'Compiled successfully!' in the logs, the app is ready."