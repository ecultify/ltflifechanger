import React, { useState, useEffect } from 'react';
import '../styles/pages/OtpVerification.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const OtpVerification = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91'); // Default to India country code
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [remainingTime, setRemainingTime] = useState(30);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [usingTestMode, setUsingTestMode] = useState(false);
  const [consentChecked, setConsentChecked] = useState(true); // Auto-checked for testing
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  // API URLs
  const API_BASE_URL = 'http://localhost:5000/api'; // Replace with your production URL if needed

  // Check if on mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
    };
    
    // Check initially
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // No longer pre-filling phone number for actual implementation
  // useEffect(() => {
  //   // Pre-fill with testing number
  //   setPhoneNumber('9876543210');
  // }, []);
  
  // Handle phone number input change
  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    // Only allow digits
    if (/^\d*$/.test(value)) {
      setPhoneNumber(value);
    }
  };

  // Handle country code change
  const handleCountryCodeChange = (e) => {
    setCountryCode(e.target.value);
  };

  // Handle consent checkbox change
  const handleConsentChange = (e) => {
    setConsentChecked(e.target.checked);
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto focus next input
      if (value && index < 5) {
        document.getElementById(`otp-input-${index + 1}`).focus();
      }
    }
  };

  // Handle keydown for OTP inputs for better UX
  const handleKeyDown = (index, e) => {
    // If backspace is pressed and the current field is empty, focus on the previous field
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-input-${index - 1}`).focus();
    }
  };

  // Start countdown timer
  const startCountdown = () => {
    setRemainingTime(30);
    const timer = setInterval(() => {
      setRemainingTime(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  // Handle get OTP button click - Now using actual API with fallback
  const handleGetOtp = async () => {
    try {
      setIsLoading(true);
      setError('');
      setUsingTestMode(false);
      
      // Call the API to send OTP
      const response = await axios.post(`${API_BASE_URL}/send-otp`, {
        phoneNumber,
        countryCode
      });
      
      if (response.data.success) {
        setShowOtpInput(true);
        startCountdown();
        setOtp(['', '', '', '', '', '']); // Clear any previous OTP
        
        // Check if we're using test mode (fallback)
        if (response.data.note && response.data.note.includes('fallback')) {
          setUsingTestMode(true);
          setError('Note: Using test mode due to API integration issues. For testing purposes, use "123456" as the OTP.');
          setOtp(['1', '2', '3', '4', '5', '6']); // Pre-fill OTP in test mode
        }
      } else {
        setError(response.data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setError(error.response?.data?.message || 'Unable to send OTP at this time. Please try again later.');
      
      // For demo purposes, allow continuing with test OTP
      setShowOtpInput(true);
      startCountdown();
      setUsingTestMode(true);
      setOtp(['1', '2', '3', '4', '5', '6']); // Pre-fill OTP for demo
      setError('Note: Using test mode due to connection issues. For testing purposes, use "123456" as the OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP - Now using actual API with fallback
  const handleResendOtp = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      
      // Call the API to resend OTP
      const response = await axios.post(`${API_BASE_URL}/send-otp`, {
        phoneNumber,
        countryCode
      });
      
      if (response.data.success) {
        startCountdown();
        
        // Check if we're using test mode (fallback)
        if (response.data.note && response.data.note.includes('fallback')) {
          setUsingTestMode(true);
          setOtp(['1', '2', '3', '4', '5', '6']); // Pre-fill OTP in test mode
          setError('Note: Using test mode. For testing purposes, use "123456" as the OTP.');
        } else {
          setOtp(['', '', '', '', '', '']); // Clear any previous OTP
          setError('OTP resent successfully. Please check your phone.');
        }
      } else {
        setError(response.data.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setError(error.response?.data?.message || 'Failed to resend OTP. Please try again later.');
      
      // For demo purposes, continue with test OTP
      startCountdown();
      setUsingTestMode(true);
      setOtp(['1', '2', '3', '4', '5', '6']); // Pre-fill OTP for demo
      setError('Note: Using test mode due to connection issues. For testing purposes, use "123456" as the OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verify button click - Now using actual API with fallback
  const handleVerify = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // If in test mode, bypass actual verification
      if (usingTestMode && otp.join('') === '123456') {
        // Store phone number in sessionStorage 
        sessionStorage.setItem('phoneNumber', `${countryCode} ${phoneNumber}`);
        
        // Navigate to the next page
        navigate('/add-details');
        return;
      }
      
      // Combine OTP digits into a single string
      const otpString = otp.join('');
      
      // Call the API to verify OTP
      const response = await axios.post(`${API_BASE_URL}/verify-otp`, {
        phoneNumber,
        countryCode,
        otp: otpString
      });
      
      if (response.data.success) {
        // Store phone number in sessionStorage 
        sessionStorage.setItem('phoneNumber', `${countryCode} ${phoneNumber}`);
        
        // Navigate to the next page
        navigate('/add-details');
      } else {
        setError(response.data.message || 'Failed to verify OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError(error.response?.data?.message || 'Failed to verify OTP. Please check the code and try again.');
      
      // For demo purposes, if the OTP is 123456, allow proceeding despite API errors
      if (otp.join('') === '123456') {
        sessionStorage.setItem('phoneNumber', `${countryCode} ${phoneNumber}`);
        navigate('/add-details');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="otp-page" style={{ backgroundImage: `url('/mobile/images/otpverfication/BG (1).png')` }}>
      {!isMobile && (
        <div className="left-section">
          <img 
            src="/images/OTP Verification.png" 
            alt="L&T Finance OTP Verification" 
            className="left-section-image"
          />
        </div>
      )}
      
      <div className={`right-section ${isMobile ? 'mobile-view' : ''}`}>
        <div className="right-content">
          {/* Logo only shown on mobile */}
          {isMobile && (
            <div className="logo-container">
              <img 
                src="/mobile/images/otpverfication/LOGO (2).png" 
                alt="L&T Finance Logo" 
                className="logo"
              />
            </div>
          )}
          
          {/* Bumrah image above the form - only on mobile */}
          {isMobile && (
            <div className="bumrah-container">
              <img 
                src="/mobile/images/otpverfication/Bumrah.png" 
                alt="Bumrah" 
                className="bumrah-image"
              />
            </div>
          )}
          
          <div className="form-container">
            {/* Progress tracker shown in different places based on device */}
            <div className="progress-tracker">
              <div className="progress-step active">
                <div className="step-circle">1</div>
                <div className="step-label">OTP</div>
              </div>
              <div className="progress-line"></div>
              <div className="progress-step">
                <div className="step-circle">2</div>
                <div className="step-label">Add Details</div>
              </div>
              <div className="progress-line"></div>
              <div className="progress-step">
                <div className="step-circle">3</div>
                <div className="step-label">Upload</div>
              </div>
            </div>
            
            <h1 className="form-title">Game on.</h1>
            <h2 className="form-subtitle">First delivery's yours!</h2>
            
            <p className="form-description">
              Enter your phone number to receive a One-Time Password (OTP) for verification.
            </p>
            
            {error && <div className={`message-box ${usingTestMode ? 'info-message' : 'error-message'}`}>{error}</div>}
            
            <div className="phone-input-group">
              <div className="input-group">
                <div className="country-phone-container">
                  <select 
                    className="country-code-select border-blue"
                    value={countryCode}
                    onChange={handleCountryCodeChange}
                    disabled={isLoading || showOtpInput}
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+971">🇦🇪 +971</option>
                  </select>
                  <input 
                    type="tel" 
                    placeholder="Mobile number" 
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    className="phone-input border-blue"
                    maxLength={10}
                    disabled={isLoading || showOtpInput}
                  />
                </div>
                <button 
                  className="get-otp-btn" 
                  onClick={handleGetOtp}
                  disabled={isLoading || phoneNumber.length !== 10 || showOtpInput}
                >
                  {isLoading && !showOtpInput ? 'Sending...' : 'Get OTP'}
                </button>
              </div>
            </div>
            
            {/* Desktop OTP entry (inline) */}
            {!isMobile && showOtpInput && (
              <div className="desktop-otp-container">
                <h3 className="otp-title">Enter OTP</h3>
                <p className="otp-instruction">
                  Enter the 6-digit OTP sent to your mobile number
                </p>
                
                <div className="otp-container">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-input-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="otp-input border-blue"
                      disabled={isLoading}
                      autoComplete="off"
                    />
                  ))}
                </div>
                
                <div className="otp-info">
                  <p className="remaining-time">
                    {remainingTime > 0 ? `Resending in ${remainingTime}s` : 'OTP expired'}
                  </p>
                  <p className="resend-link">
                    Didn't get the code? 
                    <button 
                      onClick={handleResendOtp} 
                      className="resend-btn"
                      disabled={remainingTime > 0 || isLoading}
                    >
                      Resend
                    </button>
                  </p>
                </div>
                
                <button 
                  className="verify-btn" 
                  onClick={handleVerify}
                  disabled={isLoading || otp.join('').length !== 6}
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            )}
            
            {/* Mobile OTP entry (modal) */}
            {isMobile && showOtpInput && (
              <div className="otp-modal">
                <div className="otp-modal-content">
                  <h3 className="otp-modal-title">Enter OTP</h3>
                  <p className="otp-modal-instruction">
                    Enter the 6-digit OTP sent to your mobile number
                  </p>
                  
                  <div className="otp-container">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-input-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="otp-input border-blue"
                        disabled={isLoading}
                        autoComplete="off"
                      />
                    ))}
                  </div>
                  
                  <div className="otp-info">
                    <p className="remaining-time">
                      {remainingTime > 0 ? `Resending in ${remainingTime}s` : 'OTP expired'}
                    </p>
                    <p className="resend-link">
                      Didn't get the code? 
                      <button 
                        onClick={handleResendOtp} 
                        className="resend-btn"
                        disabled={remainingTime > 0 || isLoading}
                      >
                        Resend
                      </button>
                    </p>
                  </div>
                  
                  <button 
                    className="verify-btn" 
                    onClick={handleVerify}
                    disabled={isLoading || otp.join('').length !== 6}
                  >
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>
            )}
            
            <div className="consent-container">
              <input 
                type="checkbox" 
                id="consent" 
                checked={consentChecked}
                onChange={handleConsentChange}
                disabled={isLoading || showOtpInput}
              />
              <label htmlFor="consent">
              I hereby consent to L&T Finance Limited and its affiliates to use, edit, reproduce, and publish the photographs, videos, audio recordings, and any AI-generated or campaign-related content featuring me or submitted by me, for marketing, promotional, and other commercial purposes related to the "LTF Game Changer Poster with Jasprit Bumrah" campaign, across any media platforms including digital, print, outdoor, or broadcast, without any compensation or further approval.
              </label>
            </div>
            
            {!showOtpInput && (
              <button 
                className="verify-btn initial-verify-btn" 
                onClick={handleGetOtp}
                disabled={isLoading || phoneNumber.length !== 10 || !consentChecked}
              >
                {isLoading ? 'Processing...' : 'Continue'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification; 