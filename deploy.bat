@echo off
echo 🚀 Starting Admin Service Deployment...

REM Stop existing containers
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.prod.yml down

REM Remove old images (optional)
echo 🗑️ Cleaning up old images...
docker image prune -f

REM Build new image
echo 🔨 Building new image...
docker-compose -f docker-compose.prod.yml build --no-cache

REM Start services
echo ▶️ Starting services...
docker-compose -f docker-compose.prod.yml up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak > nul

REM Run database migrations
echo 📊 Running database migrations...
docker-compose -f docker-compose.prod.yml exec admin-service npx prisma migrate deploy

REM Show status
echo ✅ Deployment completed!
echo 📊 Service status:
docker-compose -f docker-compose.prod.yml ps

echo 🌐 Admin Service is available at: http://localhost:8000
echo 📊 Health check: http://localhost:8000/

REM Show logs
echo 📝 Recent logs:
docker-compose -f docker-compose.prod.yml logs --tail=20 admin-service

pause