const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API Headers - Secure, not exposed to client
const API_HEADERS = {
  'flsId': 'VEN03799',
  'lendToken': 'eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI1MDA2NDA2MyIsImlhdCI6MTcxOTMxMDI1Nywic3ViIjoiSldUIFRlc3QiLCJpc3MiOiJMVCIsImV4cCI6MTcxOTMzOTA1N30.tiz1dlY7KvYf7Y9xxWZ2JqZAWnJCfiOzsSfJqWTNuGw',
  'producttype': 'SME',
  'Content-Type': 'application/json'
};

// Route to send OTP - exact match to the provided curl command
app.post('/api/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    console.log(`Client requested OTP for: ${phoneNumber}`);
    console.log('NOTE: The L&T API requires an encrypted request body.');
    console.log('Currently using the encrypted example from the curl command.');
    console.log('This will NOT send an OTP to your specified number but to a pre-configured test number.');
    
    // Using the exact encrypted body from the curl command - PROVEN TO WORK
    const requestBody = {
      body: "ve+dp06Wd9abVgUrYeFZtBAmLN5iDZJeZXq5pFRY8/QTZikEPcQm04Msvl5GUqM0ZmIv+M50deNvhmOAqjzTal3O4z9TqvY/OpOKlTXSoDdryXRlcnKpLfV/pxVhEXMtmV88BIfzIkn99z+ye+0liybSwb8sQS2weJrnvFNovQyYUpDlr8MXkAc3Di72RdED"
    };
    
    console.log('Sending request to L&T API with encrypted body...');
    
    // Make the API call to L&T's service - EXACTLY AS PER WORKING CURL COMMAND
    const response = await axios.post(
      'https://apiclouduat.ltfs.com:1132/LTFSME/api/sendOtps',
      requestBody,
      { headers: API_HEADERS }
    );
    
    console.log('L&T API response received:', response.data);
    
    // Add detailed explanation in the response
    res.json({
      success: true,
      message: 'API request was successful. However, the OTP was sent to a test number, not to your phone number.',
      note: 'To receive OTPs on your actual phone number, the L&T team needs to provide you with the encryption mechanism or pre-encrypted requests for your specific number.',
      data: response.data
    });
    
  } catch (error) {
    console.error('Error sending OTP:', error.response ? error.response.data : error.message);
    res.status(500).json({
      success: false,
      message: error.response ? error.response.data.message || 'Failed to send OTP' : 'Failed to send OTP'
    });
  }
});

// Route to verify OTP - exact match to the provided curl command
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    
    console.log(`Client attempted to verify OTP: ${otp} for phone: ${phoneNumber}`);
    console.log('NOTE: The L&T API requires an encrypted request body.');
    console.log('Currently using the encrypted example from the curl command.');
    console.log('This will NOT verify your entered OTP, but will return a pre-configured success response.');
    
    // Using the exact encrypted body from the curl command - PROVEN TO WORK
    const requestBody = {
      body: "Pkblal8hw+rvOmXrantfYKAGT56Ys3loUwBKHl8UFD0pNF7s2J58AWinA6jC/zr/8ImTDpfQuKyBwEkNJOdqSw=="
    };
    
    console.log('Sending verification request to L&T API with encrypted body...');
    
    // Make the API call to L&T's service - EXACTLY AS PER WORKING CURL COMMAND
    const response = await axios.post(
      'https://apiclouduat.ltfs.com:1132/LTFSME/api/verifyOtps',
      requestBody,
      { headers: API_HEADERS }
    );
    
    console.log('L&T API verification response received:', response.data);
    
    // Add detailed explanation in the response
    res.json({
      success: true,
      message: 'API request was successful. However, this verifies a test OTP, not the one you entered.',
      note: 'To verify your actual OTP, the L&T team needs to provide you with the encryption mechanism or guidance on how to properly encrypt OTP verification requests.',
      data: response.data
    });
    
  } catch (error) {
    console.error('Error verifying OTP:', error.response ? error.response.data : error.message);
    res.status(500).json({
      success: false,
      message: error.response ? error.response.data.message || 'Failed to verify OTP' : 'Failed to verify OTP'
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`===========================================================`);
  console.log(`Secure OTP proxy server running on port ${PORT}`);
  console.log(`Proxying requests to L&T API service`);
  console.log(`===========================================================`);
  console.log(`IMPORTANT: This server is successfully connecting to the L&T API,`);
  console.log(`but is using pre-encrypted test data from the curl examples.`);
  console.log(`This means OTPs are being sent to a test phone number, not yours.`);
  console.log(`===========================================================`);
  console.log(`To properly integrate your application with L&T's API:`);
  console.log(`1. Contact L&T for their encryption method/mechanism`);
  console.log(`2. Request sample code for encrypting the payload`);
  console.log(`3. Update this server to dynamically encrypt requests`);
  console.log(`===========================================================`);
}); 