#!/usr/bin/env node

const { testOtpApi, encrypt, decrypt } = require('./otpApiTest');

// Set the phone number here or as a command line argument
const phoneNumber = process.argv[2] || '9876543210';

console.log(`\n=====================================================`);
console.log(`STARTING OTP API TEST WITH PHONE NUMBER: ${phoneNumber}`);
console.log(`=====================================================\n`);

// Test encryption and decryption
console.log('TESTING ENCRYPTION/DECRYPTION FUNCTIONS:');
const testObject = { mobile: phoneNumber, countryCode: '91', otpType: 'MOBILE' };
console.log(`Original: ${JSON.stringify(testObject)}`);

const encrypted = encrypt(testObject);
console.log(`Encrypted: ${encrypted}`);

const decrypted = decrypt(encrypted);
console.log(`Decrypted: ${decrypted}`);
console.log(`Success: ${JSON.stringify(testObject) === decrypted}`);

console.log(`\n=====================================================`);
console.log(`STARTING API TESTS`);
console.log(`=====================================================\n`);

// Run the API tests
testOtpApi(phoneNumber)
  .then(() => {
    console.log('\nAPI testing completed.');
  })
  .catch(error => {
    console.error('Error running tests:', error);
  }); 