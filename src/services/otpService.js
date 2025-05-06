import axios from 'axios';
import { encrypt, decrypt, extractPotentialOtp } from '../utils/cryptoUtils';

// Constants for API calls
const SEND_OTP_URL = "https://apiclouduat.ltfs.com:1132/LTFSME/api/sendPosterOtp";
const VERIFY_OTP_URL = "https://apiclouduat.ltfs.com:1132/LTFSME/api/verifyOtps";
const FLS_ID = "VEN03799";
const LEND_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI1MDA2NDA2MyIsImlhdCI6MTcxOTMxMDI1Nywic3ViIjoiSldUIFRlc3QiLCJpc3MiOiJMVCIsImV4cCI6MTcxOTMzOTA1N30.tiz1dlY7KvYf7Y9xxWZ2JqZAWnJCfiOzsSfJqWTNuGw";
const PRODUCT_TYPE = "SME";

/**
 * Sends an OTP to the provided phone number
 * @param {string} phoneNumber - Phone number without country code
 * @param {string} customerName - Name of the customer
 * @returns {Promise<{success: boolean, otp?: string, message?: string}>} 
 */
export const sendOtp = async (phoneNumber, customerName = "Customer") => {
  try {
    // Generate a random loan ID for each request
    const loanId = "BL" + Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
    
    // Create payload with the required format
    const payload = {
      "number": phoneNumber,
      "Customer_Name": customerName,
      "Loan_Application_Id": loanId,
      "flsId": FLS_ID
    };
    
    console.log('Sending payload:', payload);
    
    // Convert to JSON string and encrypt
    const payloadStr = JSON.stringify(payload);
    const encryptedPayload = encrypt(payloadStr);
    
    if (!encryptedPayload) {
      return { success: false, message: "Failed to encrypt request data" };
    }
    
    // Create request body
    const requestBody = { "body": encryptedPayload };
    
    // Create headers
    const headers = {
      "flsId": FLS_ID,
      "lendToken": LEND_TOKEN,
      "producttype": PRODUCT_TYPE,
      "Content-Type": "application/json"
    };
    
    // Make the API call
    const response = await axios.post(
      SEND_OTP_URL,
      requestBody,
      { headers, timeout: 30000 }
    );
    
    console.log('OTP send response status:', response.status);
    
    if (response.status === 200 && response.data && response.data.body) {
      // Try to decrypt the response
      const decryptedResponse = decrypt(response.data.body);
      console.log('Decrypted OTP response:', decryptedResponse);
      
      // Try to extract OTP from the response if available
      let otp = null;
      
      if (decryptedResponse) {
        otp = extractPotentialOtp(decryptedResponse);
        
        // If no direct OTP found, try to parse as JSON
        if (!otp) {
          try {
            const responseJson = JSON.parse(decryptedResponse);
            console.log('Parsed response JSON:', responseJson);
            
            // Look for common OTP field names
            const otpFields = ["otp", "OTP", "otpCode", "code", "pin", "passcode"];
            for (const field of otpFields) {
              if (responseJson[field]) {
                otp = responseJson[field];
                break;
              }
            }
          } catch (e) {
            console.log('Response is not valid JSON');
          }
        }
      }
      
      return { 
        success: true, 
        otp, 
        message: "OTP sent successfully" 
      };
    } else {
      return { 
        success: false, 
        message: "Failed to send OTP. Please try again." 
      };
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    
    // Provide more detailed error information
    const errorMsg = error.response?.data?.message || 
                    error.message || 
                    "Could not connect to OTP service";
    
    return { 
      success: false, 
      message: errorMsg 
    };
  }
};

/**
 * Verifies an OTP for a given phone number
 * @param {string} phoneNumber - Phone number without country code
 * @param {string} otp - OTP code to verify
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const verifyOtp = async (phoneNumber, otp) => {
  try {
    // Create payload
    const payload = {
      "number": phoneNumber,
      "otp": otp,
      "flsId": FLS_ID
    };
    
    console.log('Verifying payload:', payload);
    
    // Convert to JSON string and encrypt
    const payloadStr = JSON.stringify(payload);
    const encryptedPayload = encrypt(payloadStr);
    
    if (!encryptedPayload) {
      return { success: false, message: "Failed to encrypt verification data" };
    }
    
    // Create request body
    const requestBody = { "body": encryptedPayload };
    
    // Create headers
    const headers = {
      "flsId": FLS_ID,
      "lendToken": LEND_TOKEN,
      "producttype": PRODUCT_TYPE,
      "Content-Type": "application/json"
    };
    
    // Make the API call
    const response = await axios.post(
      VERIFY_OTP_URL,
      requestBody,
      { headers, timeout: 30000 }
    );
    
    console.log('OTP verification response status:', response.status);
    
    if (response.status === 200 && response.data && response.data.body) {
      // Try to decrypt the response
      const decryptedResponse = decrypt(response.data.body);
      console.log('Decrypted verification response:', decryptedResponse);
      
      // Try to parse the JSON response
      try {
        const responseJson = JSON.parse(decryptedResponse);
        console.log('Parsed verification JSON:', responseJson);
        
        // Check for success indicators in the response
        if (responseJson.status === "success" || 
            responseJson.status === "Success" || 
            responseJson.isSuccess === true || 
            responseJson.verified === true) {
          return { success: true, message: "OTP verified successfully" };
        } else {
          return { 
            success: false, 
            message: responseJson.message || "Invalid OTP. Please try again." 
          };
        }
      } catch (e) {
        console.log('Verification response is not valid JSON');
        
        // For now, assume success if we got a 200 status
        return { success: true, message: "OTP verified" };
      }
    } else {
      return { 
        success: false, 
        message: "Failed to verify OTP. Please try again." 
      };
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    
    // Provide more detailed error information
    const errorMsg = error.response?.data?.message || 
                    error.message || 
                    "Could not connect to OTP verification service";
    
    return { 
      success: false, 
      message: errorMsg 
    };
  }
}; 