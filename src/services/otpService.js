import axios from 'axios';
import { encrypt, decrypt, extractPotentialOtp } from '../utils/cryptoUtils';

// Constants for API calls
// const SEND_OTP_URL = "https://apiclouduat.ltfs.com:1132/LTFSME/api/sendPosterOtp";
// const VERIFY_OTP_URL = "https://apiclouduat.ltfs.com:1132/LTFSME/api/verifyOtps";
// const FLS_ID = "VEN03799";
// const LEND_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI1MDA2NDA2MyIsImlhdCI6MTcxOTMxMDI1Nywic3ViIjoiSldUIFRlc3QiLCJpc3MiOiJMVCIsImV4cCI6MTcxOTMzOTA1N30.tiz1dlY7KvYf7Y9xxWZ2JqZAWnJCfiOzsSfJqWTNuGw";
// const PRODUCT_TYPE = "SME";

/**
 * Sends an OTP to the provided phone number
 * @param {string} phoneNumber - Phone number without country code
 * @param {string} customerName - Name of the customer
 * @returns {Promise<{success: boolean, otp?: string, message?: string}>} 
 */
export const sendOtp = async (phoneNumber, customerName = "Customer") => {
  try {
    // HARDCODED FOR TESTING: Always return success with hardcoded OTP
    console.log('Sending OTP to:', phoneNumber);
    
    // Return successful response with hardcoded OTP
    return { 
      success: true, 
      otp: "123456", 
      message: "OTP sent successfully (TEST MODE)" 
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    
    // Even in case of error, return success with hardcoded OTP
    return { 
      success: true, 
      otp: "123456",
      message: "OTP sent successfully (TEST MODE)" 
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
    console.log('Verifying OTP:', otp, 'for phone:', phoneNumber);
    
    // HARDCODED FOR TESTING: Always accept "123456" as valid OTP
    if (otp === "123456") {
      return { success: true, message: "OTP verified successfully" };
    } else {
      return { 
        success: false, 
        message: "Invalid OTP. The correct OTP is 123456." 
      };
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    
    // In case of error, still allow "123456" as valid OTP
    if (otp === "123456") {
      return { success: true, message: "OTP verified successfully (despite error)" };
    } else {
      return { 
        success: false, 
        message: "Invalid OTP. The correct OTP is 123456." 
      };
    }
  }
}; 