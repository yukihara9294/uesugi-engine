#!/bin/bash

# Run GTFS integration script in the backend container
# This script mounts the necessary volumes and runs the integration

echo "Starting GTFS integration..."

docker run --rm \
  --network uesugi-engine_default \
  --env-file .env \
  -e DATABASE_URL=postgresql://uesugi_user:uesugi_password@db:5432/uesugi_heatmap \
  -e POSTGRES_HOST=db \
  -e POSTGRES_PORT=5432 \
  -e POSTGRES_DB=uesugi_heatmap \
  -e POSTGRES_USER=uesugi_user \
  -e POSTGRES_PASSWORD=uesugi_password \
  -v $(pwd)/scripts:/scripts:ro \
  -v $(pwd)/uesugi-engine-data:/uesugi-engine-data:ro \
  -v $(pwd)/src/backend:/app \
  -w /app \
  uesugi-engine_backend \
  python /scripts/integrate_gtfs_to_postgresql.py

echo "GTFS integration completed!"