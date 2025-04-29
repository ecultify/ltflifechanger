# OTP API Testing Utility

This utility provides a simple way to test the OTP API encryption, decryption, and API endpoint functionality.

## Features

- Test encryption and decryption of data objects
- Automatically test the OTP API with various payload formats
- Logs detailed information about requests and responses
- Supports custom phone numbers for testing
- Provides logging to timestamped files for record-keeping

## Usage

### Using NPM script

```bash
# Run basic test with default phone number (9876543210)
npm run test-otp

# Run basic test with custom phone number
npm run test-otp -- 8765432109

# Run test with logging (default phone number)
npm run log-otp-test

# Run test with logging and custom phone number
npm run log-otp-test -- 8765432109
```

### Direct execution

```bash
# Run with default phone number (9876543210)
node src/utils/runApiTest.js

# Run with custom phone number
node src/utils/runApiTest.js 8765432109

# Alternative execution method (requires executable permission)
./src/utils/runApiTest.js 8765432109

# Run with logging (default phone number)
./src/utils/logApiTest.sh

# Run with logging and custom phone number
./src/utils/logApiTest.sh 8765432109
```

Make sure to set execute permissions if using direct execution:
```bash
chmod +x src/utils/runApiTest.js
chmod +x src/utils/logApiTest.sh
```

## Logging

The logging script (`logApiTest.sh`) will:
1. Create a timestamped log file in the `logs/` directory
2. Display output to both console and log file
3. Format logs with timestamp and phone number information
4. Save logs as `logs/otp_api_test_YYYYMMDD_HHMMSS.log`

This is useful for:
- Tracking API test results over time
- Sharing test results with team members
- Debugging issues with the API

## Output Examples

The script outputs:
1. Initial test parameters
2. Encryption/decryption test results
3. API test results with detailed logging
4. Error messages if applicable

## Test Variations

The script tests the following payload formats:
1. `{ mobile: "phone_number" }`
2. `{ mobile: phone_number }` (numeric format)
3. `{ mobile: "phone_number", otpType: "MOBILE" }`
4. `{ mobile: "phone_number", countryCode: "91" }`
5. `{ mobile: "phone_number", countryCode: "91", otpType: "MOBILE" }`

## Troubleshooting

If you encounter a 500 Server Error from the API, it may indicate:
- The API endpoint is down
- The payload format is incorrect
- The encryption is not compatible with the server's expectation
- Authentication/authorization issues

Check the response logs for more details. 