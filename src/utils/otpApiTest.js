const axios = require('axios');
const CryptoJS = require('crypto-js');

// Configure logging
const logger = {
  info: (message) => console.log(`INFO: ${message}`),
  error: (message) => console.error(`ERROR: ${message}`)
};

/**
 * Encrypt data using the same method as in the Java implementation
 * @param {object|string} data - The data to encrypt
 * @returns {string} - Base64 encoded encrypted string
 */
function encrypt(data) {
  // Convert to JSON string if object
  if (typeof data === 'object') {
    data = JSON.stringify(data);
  }
  
  // Key and IV from the screenshots
  const key = CryptoJS.enc.Utf8.parse("njCYgvluCmiQoeNydE32jjTTrdpB9Mp8");
  const iv = CryptoJS.enc.Utf8.parse("VFoFgj2NsTlpAtXS");
  
  // Encrypt using AES-CBC with PKCS7 padding (equivalent to PKCS5 in Java)
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  // Return Base64 encoded string
  return encrypted.toString();
}

/**
 * Decrypt a Base64 encoded encrypted string
 * @param {string} encryptedB64 - Base64 encoded encrypted string
 * @returns {string|null} - Decrypted string or null if error
 */
function decrypt(encryptedB64) {
  try {
    // Key and IV from the screenshots
    const key = CryptoJS.enc.Utf8.parse("njCYgvluCmiQoeNydE32jjTTrdpB9Mp8");
    const iv = CryptoJS.enc.Utf8.parse("VFoFgj2NsTlpAtXS");
    
    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(encryptedB64, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Convert to UTF-8 string
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    logger.error(`Decryption error: ${error.message}`);
    return null;
  }
}

/**
 * Test the OTP API with various payload formats
 * @param {string} phoneNumber - The phone number to send OTP to
 */
async function testOtpApi(phoneNumber) {
  // API configuration
  const url = "/proxy.php?endpoint=sendOtps";
  const headers = {
    "flsId": "VEN03799",
    "lendToken": "eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI1MDA2NDA2MyIsImlhdCI6MTcxOTMxMDI1Nywic3ViIjoiSldUIFRlc3QiLCJpc3MiOiJMVCIsImV4cCI6MTcxOTMzOTA1N30.tiz1dlY7KvYf7Y9xxWZ2JqZAWnJCfiOzsSfJqWTNuGw",
    "producttype": "SME",
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Node.js)"
  };
  
  // Original working example
  const workingPayload = "ve+dp06Wd9abVgUrYeFZtBAmLN5iDZJeZXq5pFRY8/QTZikEPcQm04Msvl5GUqM0ZmIv+M50deNvhmOAqjzTal3O4z9TqvY/OpOKlTXSoDdryXRlcnKpLfV/pxVhEXMtmV88BIfzIkn99z+ye+0liybSwb8sQS2weJrnvFNovQyYUpDlr8MXkAc3Di72RdED";
  
  // Test variants of the mobile field format
  const testPayloads = [
    { mobile: phoneNumber },                            // String format
    { mobile: parseInt(phoneNumber) },                  // Integer format
    { mobile: phoneNumber, otpType: "MOBILE" },         // With otpType
    { mobile: phoneNumber, countryCode: "91" },         // With countryCode
    { mobile: phoneNumber, countryCode: "91", otpType: "MOBILE" }  // Complete
  ];
  
  // First test with working payload
  logger.info("Testing with original working payload...");
  try {
    const response = await axios.post(
      url,
      { body: workingPayload },
      { headers: headers }
    );
    
    logger.info(`Working payload response: ${response.status}`);
    logger.info(`Response body: ${JSON.stringify(response.data)}`);
    
    if (response.status === 200) {
      try {
        if (response.data.body) {
          logger.info(`Encrypted response: ${response.data.body}`);
          const decrypted = decrypt(response.data.body);
          logger.info(`Decrypted response: ${decrypted}`);
        }
      } catch (error) {
        logger.error(`Error processing response: ${error.message}`);
      }
    }
  } catch (error) {
    logger.error(`Request error: ${error.message}`);
    if (error.response) {
      logger.error(`Response status: ${error.response.status}`);
      logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
    }
  }
  
  // Test with our dynamic payloads
  for (let i = 0; i < testPayloads.length; i++) {
    const payload = testPayloads[i];
    logger.info(`\n---------------- Test #${i+1} ----------------`);
    logger.info(`Testing with payload: ${JSON.stringify(payload)}`);
    
    // Encrypt the payload
    const encryptedPayload = encrypt(payload);
    logger.info(`Encrypted payload: ${encryptedPayload}`);
    
    try {
      // Send the request
      const response = await axios.post(
        url,
        { body: encryptedPayload },
        { headers: headers }
      );
      
      logger.info(`Response status: ${response.status}`);
      logger.info(`Response body: ${JSON.stringify(response.data)}`);
      
      // Try to process the response
      if (response.status === 200) {
        try {
          if (response.data.body) {
            logger.info(`Encrypted response: ${response.data.body}`);
            const decrypted = decrypt(response.data.body);
            logger.info(`Decrypted response: ${decrypted}`);
          }
        } catch (error) {
          logger.error(`Error processing response: ${error.message}`);
        }
      }
    } catch (error) {
      logger.error(`Request error: ${error.message}`);
      if (error.response) {
        logger.error(`Response status: ${error.response.status}`);
        logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
  
  logger.info("\n---------------- Testing Complete ----------------");
}

// Export for use in a command-line tool
module.exports = { testOtpApi, encrypt, decrypt };

// If run directly (node otpApiTest.js)
if (require.main === module) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Enter your phone number (without country code): ', (phoneNumber) => {
    testOtpApi(phoneNumber).then(() => {
      readline.close();
    });
  });
} 