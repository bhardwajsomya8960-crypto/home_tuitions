#!/bin/bash

# Multi-port startup script for local development
# Runs all services concurrently with isolated .next build directories

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo "❌ npm not found. Please install Node.js and npm first."
  exit 1
fi

# Cleanup on exit (Ctrl+C)
cleanup() {
  echo ""
  echo -e "${YELLOW}Stopping all services...${NC}"
  pkill -P $$ 2>/dev/null
  lsof -ti:5000,3000,3001,3002,3003 2>/dev/null | xargs kill -9 2>/dev/null
  echo -e "${GREEN}All services stopped.${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Free up ports before starting
echo -e "${YELLOW}Freeing up ports 5000, 3000, 3001, 3002, 3003...${NC}"
lsof -ti:5000,3000,3001,3002,3003 2>/dev/null | xargs kill -9 2>/dev/null
sleep 1

# Function to start a service
start_service() {
  local name=$1
  local port=$2
  local target_dir=$3
  local cmd=$4

  echo -e "${BLUE}Starting $name on port $port...${NC}"

  if [ "$cmd" == "npm run dev" ]; then
    (cd "$SCRIPT_DIR/$target_dir" && PORT=$port NEXT_DIST_DIR=".next-$port" npm run dev) &
  elif [ "$cmd" == "npm install && npm run dev" ]; then
    (cd "$SCRIPT_DIR/$target_dir" && npm install > /dev/null 2>&1 && PORT=$port NEXT_DIST_DIR=".next-$port" npm run dev) &
  fi

  local pid=$!
  echo -e "${GREEN}✓ $name started (PID: $pid)${NC}"
  return 0
}

# 1. Start Backend
echo ""
echo -e "${YELLOW}=== BACKEND ===${NC}"
start_service "Backend API" "5000" "backend" "npm run dev"
BACKEND_PID=$!
sleep 2

# 2. Start Frontend Main
echo ""
echo -e "${YELLOW}=== FRONTEND (MAIN) ===${NC}"
start_service "Frontend Main" "3000" "frontend" "npm run dev"
MAIN_PID=$!
sleep 2

# 3. Start Tutor Portal
echo ""
echo -e "${YELLOW}=== TUTOR PORTAL ===${NC}"
start_service "Tutor Portal" "3001" "frontend" "npm run dev"
TUTOR_PID=$!
sleep 1

# 4. Start Parent Portal
echo ""
echo -e "${YELLOW}=== PARENT PORTAL ===${NC}"
start_service "Parent Portal" "3002" "frontend" "npm run dev"
PARENT_PID=$!
sleep 1

# 5. Start Admin Portal
echo ""
echo -e "${YELLOW}=== ADMIN PORTAL ===${NC}"
start_service "Admin Portal" "3003" "frontend" "npm run dev"
ADMIN_PID=$!
sleep 1

# Summary
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ All services started successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo "📍 Access the application:"
echo "   🏠 Landing Page:      http://localhost:3000"
echo "   👨‍🏫 Tutor Portal:      http://localhost:3001/tutor/dashboard"
echo "   👨‍👩‍👧 Parent Portal:     http://localhost:3002/parent/dashboard"
echo "   ⚙️  Admin Portal:      http://localhost:3003/admin/dashboard"
echo "   🔌 API Health:        http://localhost:5000/health"
echo ""
echo -e "${YELLOW}💡 Press Ctrl+C at any time to shut down all services.${NC}"
echo ""

# Wait indefinitely
wait
