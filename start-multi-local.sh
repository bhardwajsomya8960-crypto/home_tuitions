#!/bin/bash

# Multi-port startup script for local development
# Runs all services in separate terminals on different ports

echo "🚀 Starting home tution on multiple ports..."
echo ""
echo "📍 Service Ports:"
echo "   Backend API:     http://localhost:5000"
echo "   Frontend Main:   http://localhost:3000"
echo "   Tutor Portal:    http://localhost:3001"
echo "   Parent Portal:   http://localhost:3002"
echo "   Admin Portal:    http://localhost:3003"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to start a service
start_service() {
  local name=$1
  local port=$2
  local dir=$3
  local cmd=$4

  echo -e "${BLUE}Starting $name on port $port...${NC}"

  if [ "$dir" == "root" ]; then
    cd /Users/somyabhardwaj/Desktop/home
  else
    cd /Users/somyabhardwaj/Desktop/home/$dir
  fi

  if [ "$cmd" == "npm run dev" ]; then
    PORT=$port npm run dev &
  elif [ "$cmd" == "npm install && npm run dev" ]; then
    npm install > /dev/null 2>&1 && PORT=$port npm run dev &
  fi

  echo -e "${GREEN}✓ $name started (PID: $!)${NC}"
}

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo "❌ npm not found. Please install Node.js and npm first."
  exit 1
fi

# Start Backend
echo ""
echo -e "${YELLOW}=== BACKEND ===${NC}"
start_service "Backend API" "5000" "backend" "npm install && npm run dev"
BACKEND_PID=$!
sleep 3

# Start Frontend Main
echo ""
echo -e "${YELLOW}=== FRONTEND (MAIN) ===${NC}"
start_service "Frontend Main" "3000" "frontend" "npm install && npm run dev"
MAIN_PID=$!
sleep 3

# Start Tutor Portal
echo ""
echo -e "${YELLOW}=== TUTOR PORTAL ===${NC}"
start_service "Tutor Portal" "3001" "frontend" "npm run dev"
TUTOR_PID=$!
sleep 2

# Start Parent Portal
echo ""
echo -e "${YELLOW}=== PARENT PORTAL ===${NC}"
start_service "Parent Portal" "3002" "frontend" "npm run dev"
PARENT_PID=$!
sleep 2

# Start Admin Portal
echo ""
echo -e "${YELLOW}=== ADMIN PORTAL ===${NC}"
start_service "Admin Portal" "3003" "frontend" "npm run dev"
ADMIN_PID=$!
sleep 2

# Summary
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ All services started successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo "📍 Access the application:"
echo "   🏠 Landing Page:      http://localhost:3000"
echo "   👨‍🏫 Tutor Admin:        http://localhost:3001/tutor/dashboard"
echo "   👨‍👩‍👧 Parent Admin:       http://localhost:3002/parent/dashboard"
echo "   ⚙️  Internal Admin:     http://localhost:3003/admin/dashboard"
echo "   🔌 API Health:        http://localhost:5000/health"
echo ""
echo "Process IDs:"
echo "   Backend:             $BACKEND_PID"
echo "   Frontend Main:       $MAIN_PID"
echo "   Tutor Portal:        $TUTOR_PID"
echo "   Parent Portal:       $PARENT_PID"
echo "   Admin Portal:        $ADMIN_PID"
echo ""
echo -e "${YELLOW}💡 To stop all services, run: pkill -P $$${NC}"
echo ""

# Wait for all processes
wait
