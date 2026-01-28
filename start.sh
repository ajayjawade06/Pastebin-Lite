#!/bin/bash
# Pastebin Lite - Development & Deployment Script
# Usage: ./start.sh [dev|build|test|deploy]

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Pastebin Lite${NC}"
echo "=============="
echo ""

case "${1:-dev}" in
  dev)
    echo -e "${GREEN}Starting development server...${NC}"
    npm run dev
    ;;
  
  build)
    echo -e "${GREEN}Building for production...${NC}"
    npm run build
    echo -e "${GREEN}Build complete! Ready to deploy.${NC}"
    ;;
  
  start)
    echo -e "${GREEN}Starting production server...${NC}"
    npm run start
    ;;
  
  test)
    echo -e "${GREEN}Running test suite...${NC}"
    npm test
    ;;
  
  test:deterministic)
    echo -e "${GREEN}Running deterministic time tests...${NC}"
    TEST_MODE=1 npm test
    ;;
  
  lint)
    echo -e "${GREEN}Running linter...${NC}"
    npm run lint
    ;;
  
  help|--help|-h)
    echo "Commands:"
    echo "  ./start.sh dev              Start development server (default)"
    echo "  ./start.sh build            Build for production"
    echo "  ./start.sh start            Start production server"
    echo "  ./start.sh test             Run test suite"
    echo "  ./start.sh test:deterministic   Run tests with TEST_MODE=1"
    echo "  ./start.sh lint             Run ESLint"
    echo "  ./start.sh help             Show this help message"
    echo ""
    echo "Documentation:"
    echo "  - README.md               Project overview and tech stack"
    echo "  - QUICK_START.md          5-minute setup guide"
    echo "  - API.md                  Complete API reference"
    echo "  - DEPLOY.md               Deployment guide (Vercel, Docker, VPS)"
    echo "  - PROJECT_SUMMARY.md      Project structure and key features"
    ;;
  
  *)
    echo "Unknown command: $1"
    echo "Run './start.sh help' for usage"
    exit 1
    ;;
esac
