import CryptoJS from 'crypto-js';

// Constants from the Python implementation
const KEY_MAIN = "njCYgvluCmiQoeWydE32jjTTrdpB9Wg8";
const INIT_VECTOR = "VFoEgjZNsT1pAtXS";

/**
 * Encrypts a string value using AES-CBC with PKCS7 padding
 * @param {string} value - The string to encrypt
 * @returns {string} Base64 encoded encrypted string
 */
export const encrypt = (value) => {
  try {
    // Convert the plaintext to a CryptoJS compatible format
    const plaintextWordArray = CryptoJS.enc.Utf8.parse(value);
    
    // Create key and IV as WordArrays
    const key = CryptoJS.enc.Utf8.parse(KEY_MAIN);
    const iv = CryptoJS.enc.Utf8.parse(INIT_VECTOR);
    
    // Perform encryption using AES-CBC with PKCS7 padding
    const encrypted = CryptoJS.AES.encrypt(plaintextWordArray, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Return the base64 representation of the ciphertext
    return encrypted.toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

/**
 * Decrypts a base64 encoded string that was encrypted with AES-CBC
 * @param {string} encrypted - Base64 encoded encrypted string
 * @returns {string} Decrypted string
 */
export const decrypt = (encrypted) => {
  try {
    // Create key and IV as WordArrays
    const key = CryptoJS.enc.Utf8.parse(KEY_MAIN);
    const iv = CryptoJS.enc.Utf8.parse(INIT_VECTOR);
    
    // Decrypt the ciphertext
    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Convert the decrypted WordArray to UTF-8 string
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

/**
 * Extracts a potential OTP from a text string
 * @param {string} text - Text to search for OTP patterns
 * @returns {string|null} Extracted OTP or null if not found
 */
export const extractPotentialOtp = (text) => {
  if (!text) return null;
  
  // Define patterns for 4-6 digit sequences that could be OTPs
  const patterns = [/\b\d{4}\b/, /\b\d{5}\b/, /\b\d{6}\b/];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      console.log('Potential OTPs found:', matches);
      return matches[0]; // Return the first match
    }
  }
  
  return null;
}; 