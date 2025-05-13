#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Testing OTP Service Changes ===${NC}"
echo -e "${YELLOW}============================${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
fi

# Build the project
echo -e "${YELLOW}Building project...${NC}"
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Build successful!${NC}"
  
  # If we have a local server, start it
  if command -v serve &> /dev/null; then
    echo -e "${YELLOW}Starting local server...${NC}"
    echo -e "${GREEN}Test the OTP functionality at: http://localhost:3000/cors-test${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop the server when done${NC}"
    serve -s build
  else
    echo -e "${YELLOW}To test your changes:${NC}"
    echo -e "1. Run ${GREEN}npx serve -s build${NC}"
    echo -e "2. Open ${GREEN}http://localhost:3000/cors-test${NC} in your browser"
    echo -e "3. Test the OTP functionality"
  fi
else
  echo -e "${RED}Build failed!${NC}"
  exit 1
fi 