#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Deploying to Production ===${NC}"
echo -e "${YELLOW}=========================${NC}"

# Build the project first
echo -e "${YELLOW}Building project...${NC}"
CI=false npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Build successful!${NC}"
  
  # Create a timestamp for the deployment
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  
  # Create deployment archive
  echo -e "${YELLOW}Creating deployment archive...${NC}"
  zip -r "deploy_$TIMESTAMP.zip" build/*
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment archive created: deploy_$TIMESTAMP.zip${NC}"
    echo -e "${YELLOW}To complete deployment:${NC}"
    echo -e "1. Upload deploy_$TIMESTAMP.zip to your Hostinger control panel"
    echo -e "2. Extract the files to the website root directory"
    echo -e "3. Ensure the php files in the public directory are correctly set"
    echo -e "4. Backup any customized configuration before overwriting"
    
    # If FTP credentials are set as environment variables, we could also add automated upload
    if [ ! -z "$FTP_HOST" ] && [ ! -z "$FTP_USER" ] && [ ! -z "$FTP_PASS" ]; then
      echo -e "${YELLOW}FTP credentials found. Attempting to upload...${NC}"
      # This would use something like curl or lftp to upload the files
      # For security reasons, keeping this commented out for now
      # lftp -u $FTP_USER,$FTP_PASS $FTP_HOST -e "mirror -R build/ /; quit"
    else
      echo -e "${YELLOW}No FTP credentials set. Manual upload required.${NC}"
    fi
  else
    echo -e "${RED}Failed to create deployment archive!${NC}"
    exit 1
  fi
else
  echo -e "${RED}Build failed!${NC}"
  exit 1
fi 