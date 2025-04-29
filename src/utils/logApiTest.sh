#!/bin/bash

# Directory for storing logs
LOG_DIR="logs"
mkdir -p $LOG_DIR

# Create timestamped filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/otp_api_test_$TIMESTAMP.log"

# Check if phone number was provided
if [ $# -eq 0 ]; then
  PHONE="9876543210"  # Default phone number
else
  PHONE="$1"
fi

echo "Running OTP API test with phone number: $PHONE"
echo "Logging output to: $LOG_FILE"

# Run the test and tee output to both console and log file
node src/utils/runApiTest.js "$PHONE" | tee "$LOG_FILE"

echo ""
echo "Test completed. Log saved to: $LOG_FILE" 