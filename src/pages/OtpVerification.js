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
  const [consentChecked, setConsentChecked] = useState(true); // Auto-checked for testing
  const navigate = useNavigate();

  // Add useEffect to pre-fill mobile number for testing
  useEffect(() => {
    // Pre-fill with testing number
    setPhoneNumber('9876543210');
  }, []);

  // Removed API headers as they're now handled by the backend proxy
  
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

  // Handle get OTP button click - MODIFIED FOR TESTING
  const handleGetOtp = async () => {
    // For testing, just show OTP input without actual API call
        setShowOtpInput(true);
        startCountdown();
    // Pre-fill OTP with "123456" for easy testing
    setOtp(['1', '2', '3', '4', '5', '6']);
    setError('OTP verification bypassed for testing. Click "Verify" to proceed.');
  };

  // Handle resend OTP - MODIFIED FOR TESTING
  const handleResendOtp = async (e) => {
    e.preventDefault();
    
    // For testing, just restart countdown
        startCountdown();
    setOtp(['1', '2', '3', '4', '5', '6']);
    setError('OTP verification bypassed for testing. Click "Verify" to proceed.');
  };

  // Handle verify button click - MODIFIED FOR TESTING
  const handleVerify = async () => {
    // Store phone number in sessionStorage instead of localStorage
    sessionStorage.setItem('phoneNumber', `${countryCode} ${phoneNumber}`);
    
    // For testing, navigate directly to the next page
    navigate('/add-details');
  };

  return (
    <div className="otp-page">
      <div className="left-section">
        <img 
          src="/images/OTP Verification.png" 
          alt="L&T Finance OTP Verification" 
          className="left-section-image"
        />
      </div>
      
      <div className="right-section">
        <div className="right-content">
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
          
          <div className="form-container">
            <h1 className="form-title">Game on.</h1>
            <h2 className="form-subtitle">First delivery's yours!</h2>
            
            <p className="form-description">
              Enter your phone number to receive a One-Time Password (OTP) for verification.
            </p>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="phone-input-group">
              <div className="input-group">
                <div className="country-code-select-container">
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
                </div>
                <input 
                  type="tel" 
                  placeholder="Mobile number" 
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  className="phone-input border-blue"
                  maxLength={10}
                  disabled={isLoading || showOtpInput}
                />
                <button 
                  className="get-otp-btn" 
                  onClick={handleGetOtp}
                  disabled={isLoading || phoneNumber.length !== 10 || showOtpInput}
                >
                  {isLoading && !showOtpInput ? 'Sending...' : 'Get OTP'}
                </button>
              </div>
            </div>
            
            {showOtpInput && (
              <>
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
              </>
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
                I consent to L&T Finance Limited to use, call, and collect my personal information, including information via telemarketing, messaging, and email.
              </label>
            </div>
            
            <button 
              className="verify-btn" 
              onClick={handleVerify}
              disabled={isLoading || !showOtpInput || otp.join('').length !== 6}
            >
              {isLoading && showOtpInput ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification; 