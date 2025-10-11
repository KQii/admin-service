#!/bin/bash

# Build and deploy admin service to Docker

echo "🚀 Starting Admin Service Deployment..."

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Remove old images (optional)
echo "🗑️ Cleaning up old images..."
docker image prune -f

# Build new image
echo "🔨 Building new image..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
echo "▶️ Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Run database migrations
echo "📊 Running database migrations..."
docker-compose -f docker-compose.prod.yml exec admin-service npx prisma migrate deploy

# Show status
echo "✅ Deployment completed!"
echo "📊 Service status:"
docker-compose -f docker-compose.prod.yml ps

echo "🌐 Admin Service is available at: http://localhost:8000"
echo "📊 Health check: http://localhost:8000/"

# Show logs
echo "📝 Recent logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20 admin-service