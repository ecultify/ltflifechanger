import CryptoJS from 'crypto-js';

// Constants from the API specifications
const SECRET_KEY = "njCYgvluCmiQoeNydE32jjTTrdpB9Mp8";
const IV = "VFoFgj2NsTlpAtXS";

/**
 * Encrypts a string using AES-256-CBC with PKCS5Padding
 * @param {string} plainText - The string to encrypt
 * @returns {string} - Base64 encoded encrypted string
 */
export const encrypt = (plainText) => {
  try {
    // Convert the key and IV to WordArrays
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
    const iv = CryptoJS.enc.Utf8.parse(IV);

    // Encrypt using AES in CBC mode with PKCS5Padding
    const encrypted = CryptoJS.AES.encrypt(plainText, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7 // Note: CryptoJS uses PKCS7, which is equivalent to PKCS5 for AES
    });

    // Return the Base64 encoded result
    return encrypted.toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
};

/**
 * Decrypts a Base64 encoded encrypted string using AES-256-CBC with PKCS5Padding
 * @param {string} encryptedText - Base64 encoded encrypted string
 * @returns {string} - The decrypted string
 */
export const decrypt = (encryptedText) => {
  try {
    // Convert the key and IV to WordArrays
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
    const iv = CryptoJS.enc.Utf8.parse(IV);

    // Decrypt using AES in CBC mode with PKCS5Padding
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7 // Note: CryptoJS uses PKCS7, which is equivalent to PKCS5 for AES
    });

    // Return the UTF-8 decoded result
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
};

/**
 * Prepares the encrypted payload for Send OTP API
 * @param {string} phoneNumber - The phone number to send OTP to
 * @param {string} countryCode - The country code of the phone number
 * @returns {Object} - The encrypted request body
 */
export const prepareSendOtpPayload = (phoneNumber, countryCode) => {
  // Create the JSON object to encrypt
  const dataToEncrypt = JSON.stringify({
    mobile: phoneNumber,
    countryCode: countryCode.replace('+', ''),
    otpType: "MOBILE"
  });
  
  // Encrypt the data
  const encryptedData = encrypt(dataToEncrypt);
  
  // Return the payload as expected by the API
  return {
    body: encryptedData
  };
};

/**
 * Prepares the encrypted payload for Verify OTP API
 * @param {string} phoneNumber - The phone number
 * @param {string} countryCode - The country code
 * @param {string} otp - The OTP to verify
 * @returns {Object} - The encrypted request body
 */
export const prepareVerifyOtpPayload = (phoneNumber, countryCode, otp) => {
  // Create the JSON object to encrypt
  const dataToEncrypt = JSON.stringify({
    mobile: phoneNumber,
    countryCode: countryCode.replace('+', ''),
    otpType: "MOBILE",
    otp: otp
  });
  
  // Encrypt the data
  const encryptedData = encrypt(dataToEncrypt);
  
  // Return the payload as expected by the API
  return {
    body: encryptedData
  };
}; 