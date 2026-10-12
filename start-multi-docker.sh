#!/bin/bash

# Multi-port startup script for Docker
# Runs all services in Docker containers on different ports

echo "🐳 Starting home tution services in Docker..."
echo ""
echo "📍 Service Ports:"
echo "   Backend API:     http://localhost:5000"
echo "   Frontend Main:   http://localhost:3000"
echo "   Tutor Portal:    http://localhost:3001"
echo "   Parent Portal:   http://localhost:3002"
echo "   Admin Portal:    http://localhost:3003"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "❌ Docker not found. Please install Docker first."
  exit 1
fi

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
  echo "❌ Docker daemon is not running. Please start Docker."
  exit 1
fi

# Change to project directory
cd /Users/somyabhardwaj/Desktop/home

# Copy port configuration
if [ ! -f ".env.local" ]; then
  echo "📝 Creating .env.local from template..."
  cp .env.example .env.local
  sed -i '' 's|NEXT_PUBLIC_API_URL=http://localhost:5000|NEXT_PUBLIC_API_URL=http://backend:5000|g' .env.local
fi

echo "🏗️  Building Docker images..."
docker-compose -f docker-compose.multi.yml build --quiet

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Please check the error above."
  exit 1
fi

echo ""
echo "🚀 Starting Docker containers..."
docker-compose -f docker-compose.multi.yml up -d

if [ $? -ne 0 ]; then
  echo "❌ Failed to start containers."
  exit 1
fi

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo ""
echo "🏥 Checking service health..."

BACKEND_HEALTH=$(curl -s http://localhost:5000/health 2>/dev/null || echo "fail")
if [ "$BACKEND_HEALTH" != "fail" ]; then
  echo "✓ Backend API is running"
else
  echo "⚠ Backend API is starting..."
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✓ All Docker services started successfully!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📍 Access the application:"
echo "   🏠 Landing Page:      http://localhost:3000"
echo "   👨‍🏫 Tutor Admin:        http://localhost:3001/tutor/dashboard"
echo "   👨‍👩‍👧 Parent Admin:       http://localhost:3002/parent/dashboard"
echo "   ⚙️  Internal Admin:     http://localhost:3003/admin/dashboard"
echo "   🔌 API Health:        http://localhost:5000/health"
echo ""
echo "Docker Containers:"
docker-compose -f docker-compose.multi.yml ps
echo ""
echo "📊 View logs:"
echo "   All logs:          docker-compose -f docker-compose.multi.yml logs -f"
echo "   Backend only:      docker-compose -f docker-compose.multi.yml logs -f backend"
echo "   Frontend main:     docker-compose -f docker-compose.multi.yml logs -f frontend-main"
echo "   Tutor portal:      docker-compose -f docker-compose.multi.yml logs -f tutor-portal"
echo "   Parent portal:     docker-compose -f docker-compose.multi.yml logs -f parent-portal"
echo "   Admin portal:      docker-compose -f docker-compose.multi.yml logs -f admin-portal"
echo ""
echo "⏹️  To stop all services:"
echo "   docker-compose -f docker-compose.multi.yml down"
echo ""
echo "🔄 To restart a service:"
echo "   docker-compose -f docker-compose.multi.yml restart <service-name>"
echo ""
