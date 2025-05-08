import React, { useState, useEffect } from 'react';
import { sendOtp, verifyOtp } from '../services/otpService';
import '../styles/pages/OtpVerification.css';
import Loader from '../components/Loader';

const CorsErrorTest = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('Test User');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [corsError, setCorsError] = useState(null);
  const [step, setStep] = useState('send'); // 'send' or 'verify'
  const [responseData, setResponseData] = useState(null);

  // Format error for display
  const formatErrorForDisplay = (error) => {
    return (
      <div className="error-details">
        <h3>CORS Error Details (for documentation):</h3>
        <pre>{JSON.stringify(error, null, 2)}</pre>
        <div className="error-note">
          <p>📸 Take a screenshot of this error for documentation</p>
          <p>This error shows that the API needs CORS headers to be enabled for your domain.</p>
        </div>
      </div>
    );
  };

  // Handle sending OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setMessage('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setMessage('Sending OTP...');
    setCorsError(null);
    
    try {
      // This will trigger the CORS error
      const response = await sendOtp(phoneNumber, customerName);
      console.log('OTP Response:', response);
      
      setResponseData(response);
      
      if (response.corsError) {
        setCorsError(response);
        setMessage('CORS error detected! This is good for your documentation.');
      } else if (response.success) {
        setMessage(`OTP sent successfully! For testing, use: ${response.otp}`);
        setStep('verify');
      } else {
        setMessage('Failed to send OTP. See console for details.');
      }
    } catch (error) {
      console.error('Error in OTP send:', error);
      setMessage('Error sending OTP: ' + error.message);
      if (error.message && error.message.includes('CORS')) {
        setCorsError({ error: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verifying OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setMessage('Please enter the OTP');
      return;
    }

    setIsLoading(true);
    setMessage('Verifying OTP...');
    setCorsError(null);
    
    try {
      // This will trigger the CORS error
      const response = await verifyOtp(phoneNumber, otp);
      console.log('OTP Verification Response:', response);
      
      setResponseData(response);
      
      if (response.corsError) {
        setCorsError(response);
        setMessage('CORS error detected! This is good for your documentation.');
      } else if (response.success) {
        setMessage('OTP verified successfully!');
      } else {
        setMessage(response.message || 'Failed to verify OTP');
      }
    } catch (error) {
      console.error('Error in OTP verification:', error);
      setMessage('Error verifying OTP: ' + error.message);
      if (error.message && error.message.includes('CORS')) {
        setCorsError({ error: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="otp-page cors-test-page">
      <div className="container">
        <div className="otp-container">
          <h1 className="test-title">CORS Error Test Page</h1>
          <p className="test-description">
            This page will help you reproduce the CORS error when calling the OTP API.
            It's designed to create a screenshot that you can share with the API team.
          </p>
          
          {isLoading ? (
            <Loader fullScreen={false} message="Processing..." />
          ) : (
            <>
              {step === 'send' ? (
                <form onSubmit={handleSendOtp} className="otp-form">
                  <div className="form-group">
                    <label htmlFor="phoneNumber">Mobile Number</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      className="form-control"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="customerName">Customer Name (optional)</label>
                    <input
                      type="text"
                      id="customerName"
                      className="form-control"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer Name"
                    />
                  </div>
                  
                  <button type="submit" className="btn otp-btn">
                    Send OTP & Generate CORS Error
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="otp-form">
                  <div className="form-group">
                    <label htmlFor="otp">Enter OTP</label>
                    <input
                      type="text"
                      id="otp"
                      className="form-control"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter OTP received"
                      maxLength={6}
                      required
                    />
                    <small className="form-hint">For testing, you can use 123456</small>
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn btn-outline"
                      onClick={() => setStep('send')}
                    >
                      Back
                    </button>
                    <button type="submit" className="btn otp-btn">
                      Verify OTP & Generate CORS Error
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
          
          {message && <div className="message-box">{message}</div>}
          
          {corsError && formatErrorForDisplay(corsError)}
          
          {responseData && (
            <div className="response-data">
              <h3>API Response Data:</h3>
              <pre>{JSON.stringify(responseData, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CorsErrorTest;
