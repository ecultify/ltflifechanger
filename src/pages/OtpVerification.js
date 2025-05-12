import React, { useState, useEffect } from "react";
import "../styles/pages/OtpVerification.css";
import "../styles/pages/StepColorOverrides.css"; // Added step color overrides
import "../styles/components/FixedStepper.css"; // For fixed position stepper
import "../styles/pages/OtpVerificationOverrides.css"; // Added custom overrides for layout
import "../styles/pages/OtpScrollFixOverrides.css"; // Added scroll fixes for mobile
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Loader from "../components/Loader";
import { sendOtp, verifyOtp } from "../services/otpService";

const OtpVerification = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91"); // Default to India country code
  const [otp, setOtp] = useState(["1", "2", "3", "4", "5", "6"]); // Pre-filled with hardcoded OTP
  const [remainingTime, setRemainingTime] = useState(30);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [usingTestMode, setUsingTestMode] = useState(true); // Always in test mode
  const [consentChecked, setConsentChecked] = useState(true); // Auto-checked for testing
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [customerName, setCustomerName] = useState("Customer"); // Default customer name

  // Improved scroll handling for smoother experience
  useEffect(() => {
    // Only apply scroll handling if not on mobile
    if (!isMobile) {
      let scrollPosition = window.pageYOffset;
      let isUserScrolling = false;
      let scrollTimeout;

      // Store scroll position when user scrolls
      const handleScroll = () => {
        isUserScrolling = true;
        scrollPosition = window.pageYOffset;
        
        // Reset the user scrolling flag after a short delay
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          isUserScrolling = false;
        }, 100);
      };

      // Function to restore scroll position only if not user-initiated
      const preventAutoScroll = () => {
        // Only prevent auto scrolling if user isn't actively scrolling
        if (!isUserScrolling) {
          window.scrollTo({
            top: scrollPosition,
            behavior: 'auto' // Use auto instead of smooth for less visual disruption
          });
        }
      };

      // Add event listeners with passive true for better performance
      window.addEventListener("scroll", handleScroll, { passive: true });

      // Check less frequently and only when needed
      const intervalId = setInterval(preventAutoScroll, 500);

      // Cleanup on unmount
      return () => {
        window.removeEventListener("scroll", handleScroll);
        clearTimeout(scrollTimeout);
        clearInterval(intervalId);
      };
    }
  }, [isMobile]);

  // Check if on mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
    };

    // Check initially
    checkIfMobile();

    // Add resize listener
    window.addEventListener("resize", checkIfMobile);

    // Clean up
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

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

  // Handle consent checkbox change (used with custom checkbox)
  const handleConsentChange = () => {
    setConsentChecked(!consentChecked);
  };

  // Open consent modal
  const openConsentModal = (e) => {
    if (e) e.preventDefault();
    setShowConsentModal(true);
  };

  // Close consent modal
  const closeConsentModal = () => {
    setShowConsentModal(false);
  };

  // Accept consent from modal
  const acceptConsent = () => {
    setConsentChecked(true);
    setShowConsentModal(false);
  };

  // Decline consent from modal
  const declineConsent = () => {
    setConsentChecked(false);
    setShowConsentModal(false);
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
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-input-${index - 1}`).focus();
    }
  };

  // Start countdown timer
  const startCountdown = () => {
    setRemainingTime(30);
    const timer = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  // Handle get OTP button click - Using hardcoded approach
  const handleGetOtp = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Show the OTP input section
      setShowOtpInput(true);
      startCountdown();

      // Pre-fill the OTP with 123456
      setOtp(["1", "2", "3", "4", "5", "6"]);

      setUsingTestMode(true);
    } catch (error) {
      console.error("Error sending OTP:", error);

      // Still show the OTP input with pre-filled value
      setShowOtpInput(true);
      startCountdown();
      setUsingTestMode(true);
      setOtp(["1", "2", "3", "4", "5", "6"]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP - Using hardcoded approach
  const handleResendOtp = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError("");

      // Reset and start countdown
      startCountdown();

      // Pre-fill the OTP with 123456
      setOtp(["1", "2", "3", "4", "5", "6"]);

      setUsingTestMode(true);
    } catch (error) {
      console.error("Error resending OTP:", error);

      // Still show the OTP input with pre-filled value
      startCountdown();
      setUsingTestMode(true);
      setOtp(["1", "2", "3", "4", "5", "6"]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verify button click - Using hardcoded approach
  const handleVerify = async () => {
    try {
      setIsLoading(true);
      setError("");

      // If OTP is 123456, proceed to the next page
      if (otp.join("") === "123456") {
        // Store phone number in sessionStorage
        sessionStorage.setItem("phoneNumber", `${countryCode} ${phoneNumber}`);

        // Navigate to the next page
        navigate("/add-details");
        return;
      } else {
        setError("Invalid OTP. The correct OTP is 123456.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);

      // For consistency, still check the hardcoded OTP
      if (otp.join("") === "123456") {
        sessionStorage.setItem("phoneNumber", `${countryCode} ${phoneNumber}`);
        navigate("/add-details");
      } else {
        setError("Invalid OTP. The correct OTP is 123456.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="otp-page">
      {" "}
      {isLoading && !showOtpInput && <Loader />}{" "}
      {!isMobile && (
        <div className="left-section">
          <img
            src="/images/otpverfication/otpverfifcationbg.png"
            alt="Background"
            className="left-section-background"
          />
          <Link to="/">
            <img
              src="/images/LOGO.png"
              alt="Game Changer Logo"
              className="left-section-logo"
            />
          </Link>{" "}
          <img
            src="/images/otpverfication/Frame162427.png"
            alt="Person"
            className="left-section-person"
          />
        </div>
      )}{" "}
      <div className={`right-section ${isMobile ? "mobile-view" : ""}`}>
        {" "}
        {/* Mobile view logo and Bumrah image */}{" "}
        {isMobile ? (
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              className="logo-container"
              style={{ marginTop: "0", padding: "0", textAlign: "center" }}
            >
              <Link to="/">
                <img
                  src="images/otpverfication/LOGO.png"
                  alt="Game Changer Logo"
                  className="logo"
                  style={{
                    maxWidth: "440px",
                    left: "210px",
                    margin: "10px auto",
                    display: "block",
                    position: "relative",
                  }}
                />{" "}
              </Link>{" "}
            </div>{" "}
            <div
              className="bumrah-container"
              style={{
                minHeight: "180px",
                display: "flex",
                justifyContent: "center",
                marginBottom: "10px",
                marginTop: "-25px",
                /* Pushed up by 25px */
                width: "100%",
                maxWidth: "450px",
              }}
            >
              <img
                src="images/otpverfication/Frame162427.png"
                alt="Bumrah"
                className="bumrah-image"
                style={{
                  maxWidth: "290px",
                  /* Adjusted from 320px */
                  margin: "0 auto",
                  display: "block",
                  height: "auto",
                  position: "relative",
                  left: "0", /* Centered properly */
                  right: "0", /* Reset any right offset */
                  marginLeft: "auto",
                  marginRight: "auto"
                }}
              />{" "}
            </div>{" "}
            <div
              className="form-container"
              style={{
                width: "100%",
                maxWidth: "450px",
                marginTop: "-20px",
                zIndex: 10,
                position: "relative",
              }}
            >
              {" "}
              {/* Form content for mobile */}{" "}
              <MobileFormContent
                error={error}
                usingTestMode={usingTestMode}
                countryCode={countryCode}
                handleCountryCodeChange={handleCountryCodeChange}
                phoneNumber={phoneNumber}
                handlePhoneNumberChange={handlePhoneNumberChange}
                isLoading={isLoading}
                showOtpInput={showOtpInput}
                handleGetOtp={handleGetOtp}
                otp={otp}
                handleOtpChange={handleOtpChange}
                handleKeyDown={handleKeyDown}
                remainingTime={remainingTime}
                handleResendOtp={handleResendOtp}
                handleVerify={handleVerify}
                consentChecked={consentChecked}
                handleConsentChange={handleConsentChange}
                openConsentModal={openConsentModal}
              />{" "}
            </div>{" "}
          </div>
        ) : (
          /* Desktop view */
          <>
            {" "}
            {/* Fixed position stepper in right column - only shown on desktop */}{" "}
            <div className="fixed-stepper-container">
              <div className="fixed-stepper">
                <div className="progress-step active">
                  <div className="step-circle"> 1 </div>{" "}
                  <div className="step-label"> OTP </div>{" "}
                </div>{" "}
                <div className="progress-line active"> </div>{" "}
                <div className="progress-step">
                  <div className="step-circle"> 2 </div>{" "}
                  <div className="step-label"> Add Details </div>{" "}
                </div>{" "}
                <div className="progress-line"> </div>{" "}
                <div className="progress-step">
                  <div className="step-circle"> 3 </div>{" "}
                  <div className="step-label"> Upload </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* Right content with form for desktop */}{" "}
            <div className="right-content" style={{ position: "relative" }}>
              <div className="form-container">
                {" "}
                {/* Form content for desktop */}{" "}
                <DesktopFormContent
                  error={error}
                  usingTestMode={usingTestMode}
                  countryCode={countryCode}
                  handleCountryCodeChange={handleCountryCodeChange}
                  phoneNumber={phoneNumber}
                  handlePhoneNumberChange={handlePhoneNumberChange}
                  isLoading={isLoading}
                  showOtpInput={showOtpInput}
                  handleGetOtp={handleGetOtp}
                  otp={otp}
                  handleOtpChange={handleOtpChange}
                  handleKeyDown={handleKeyDown}
                  remainingTime={remainingTime}
                  handleResendOtp={handleResendOtp}
                  handleVerify={handleVerify}
                  consentChecked={consentChecked}
                  handleConsentChange={handleConsentChange}
                  openConsentModal={openConsentModal}
                />{" "}
              </div>{" "}
            </div>{" "}
          </>
        )}{" "}
      </div>{" "}
      {/* Consent Modal for Both Mobile and Desktop */}{" "}
      {showConsentModal && (
        <div
          className="consent-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            className="consent-modal-content"
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "25px",
              width: "90%",
              maxWidth: "450px",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
            }}
          >
            <h3
              className="consent-modal-title"
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                marginBottom: "15px",
                color: "#0a1a34",
                textAlign: "center",
              }}
            >
              {" "}
              Terms & Conditions{" "}
            </h3>{" "}
            <div
              className="consent-modal-text"
              style={{
                fontSize: "14px",
                color: "#333",
                lineHeight: "1.5",
                marginBottom: "20px",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  display: "block",
                  maxHeight: "none",
                  overflow: "visible",
                }}
              >
                I hereby consent to L & T Finance Limited and its affiliates to
                use, edit, reproduce, and publish the photographs, videos, audio
                recordings, contact numbers, and any AI - generated or campaign
                - related content featuring me or submitted by me, for
                marketing, promotional, and other commercial purposes related to
                the "Bumrah X You" campaign, across any media platforms
                including digital, print, outdoor, or broadcast, without any
                compensation or further approval.{" "}
              </p>{" "}
            </div>{" "}
            <div
              className="consent-modal-buttons"
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "15px",
              }}
            >
              <button
                className="decline-btn"
                onClick={declineConsent}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "30px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid #ddd",
                  backgroundColor: "#f5f5f5",
                  color: "#333",
                }}
              >
                Decline{" "}
              </button>{" "}
              <button
                className="accept-btn"
                onClick={acceptConsent}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "30px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: "#0083B5",
                  color: "white",
                }}
              >
                Accept{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </div>
  );
};

// Mobile form content component
const MobileFormContent = ({
  error,
  usingTestMode,
  countryCode,
  handleCountryCodeChange,
  phoneNumber,
  handlePhoneNumberChange,
  isLoading,
  showOtpInput,
  handleGetOtp,
  otp,
  handleOtpChange,
  handleKeyDown,
  remainingTime,
  handleResendOtp,
  handleVerify,
  consentChecked,
  handleConsentChange,
  openConsentModal,
}) => (
  <>
    {" "}
    {/* Added stepper indicator for mobile view inside form container */}{" "}
    <div className="mobile-stepper-container form-stepper">
      <div className="mobile-stepper">
        <div className="progress-step active">
          <div className="step-circle"> 1 </div>{" "}
          <div className="step-label"> OTP </div>{" "}
        </div>{" "}
        <div className="progress-line active"> </div>{" "}
        <div className="progress-step">
          <div className="step-circle"> 2 </div>{" "}
          <div className="step-label"> Add Details </div>{" "}
        </div>{" "}
        <div className="progress-line"> </div>{" "}
        <div className="progress-step">
          <div className="step-circle"> 3 </div>{" "}
          <div className="step-label"> Upload </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>{" "}
    <h2 className="form-title" style={{ textAlign: "center" }}>
      {" "}
      Game on.{" "}
    </h2>{" "}
    <h2 className="form-subtitle" style={{ textAlign: "center" }}>
      {" "}
      First delivery 's yours!{" "}
    </h2>{" "}
    <p className="form-description" style={{ textAlign: "center" }}>
      Enter your phone number to receive a One - Time Password(OTP) for
      verification.{" "}
    </p>{" "}
    {error && (
      <div
        className={`message-box ${
          usingTestMode ? "info-message" : "error-message"
        }`}
      >
        {" "}
        {error}{" "}
      </div>
    )}{" "}
    <div className="phone-input-group">
      <div className="input-group">
        <div className="country-phone-container">
          <select
            className="country-code-select border-blue"
            value={countryCode}
            onChange={handleCountryCodeChange}
            disabled={isLoading || showOtpInput}
          >
            <option value="+91"> 🇮🇳+91 </option>{" "}
            <option value="+1"> 🇺🇸+1 </option>{" "}
            <option value="+44"> 🇬🇧+44 </option>{" "}
            <option value="+61"> 🇦🇺+61 </option>{" "}
            <option value="+971"> 🇦🇪+971 </option>{" "}
          </select>{" "}
          <input
            type="tel"
            placeholder="Mobile number"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            className="phone-input border-blue"
            maxLength={10}
            disabled={isLoading || showOtpInput}
          />{" "}
        </div>{" "}
        <button
          className="get-otp-btn"
          onClick={handleGetOtp}
          disabled={isLoading || phoneNumber.length !== 10 || showOtpInput}
        >
          {" "}
          {isLoading && !showOtpInput ? "Sending..." : "Get OTP"}{" "}
        </button>{" "}
      </div>{" "}
    </div>{" "}
    {/* Mobile OTP entry (modal) */}{" "}
    {showOtpInput && (
      <div className="otp-modal">
        <div className="otp-modal-content">
          <h3 className="otp-modal-title"> Enter OTP </h3>{" "}
          <p className="otp-modal-instruction">
            Enter the 6 - digit OTP sent to your mobile number{" "}
          </p>{" "}
          <div className="otp-container">
            {" "}
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
            ))}{" "}
          </div>{" "}
          <div className="otp-info">
            <p className="remaining-time">
              {" "}
              {remainingTime > 0
                ? `Resending in ${remainingTime}s`
                : "OTP expired"}{" "}
            </p>{" "}
            <div className="resend-link">
              <span> Didn 't get the code?</span>{" "}
              <button
                onClick={handleResendOtp}
                className="resend-btn"
                disabled={remainingTime > 0 || isLoading}
              >
                Resend{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
          <button
            className="verify-btn"
            onClick={handleVerify}
            disabled={isLoading || otp.join("").length !== 6}
          >
            {" "}
            {isLoading ? "Verifying..." : "Verify"}{" "}
          </button>{" "}
        </div>{" "}
      </div>
    )}{" "}
    <div
      className="consent-container"
      style={{ display: "flex", alignItems: "flex-start", margin: "10px 0" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {" "}
        {/* Single custom checkbox implementation */}{" "}
        <div
          onClick={(e) => {
            e.preventDefault();
            handleConsentChange();
          }}
          style={{
            width: "10px",
            height: "10px",
            minWidth: "10px",
            border: "1px solid #999",
            borderRadius: "2px",
            marginRight: "8px",
            marginTop: "3px",
            backgroundColor: consentChecked ? "#0a1a34" : "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: isLoading || showOtpInput ? "default" : "pointer",
            opacity: isLoading || showOtpInput ? 0.5 : 1,
          }}
        >
          {" "}
          {consentChecked && (
            <div
              style={{
                width: "4px",
                height: "6px",
                borderRight: "2px solid white",
                borderBottom: "2px solid white",
                transform: "rotate(45deg) translate(-1px, -1px)",
              }}
            />
          )}{" "}
        </div>{" "}
        <span style={{ fontSize: "12px", lineHeight: "1.3" }}>
          By continuing, I accept the{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              openConsentModal(e);
            }}
          >
            {" "}
            Terms & Conditions{" "}
          </a>{" "}
        </span>{" "}
      </div>{" "}
    </div>{" "}
    {!showOtpInput && (
      <button
        className="verify-btn initial-verify-btn"
        onClick={handleGetOtp}
        disabled={isLoading || phoneNumber.length !== 10 || !consentChecked}
      >
        {" "}
        {isLoading ? "Processing..." : "Continue"}{" "}
      </button>
    )}{" "}
  </>
);

// Desktop form content component - simplified to match mobile approach
const DesktopFormContent = ({
  error,
  usingTestMode,
  countryCode,
  handleCountryCodeChange,
  phoneNumber,
  handlePhoneNumberChange,
  isLoading,
  showOtpInput,
  handleGetOtp,
  otp,
  handleOtpChange,
  handleKeyDown,
  remainingTime,
  handleResendOtp,
  handleVerify,
  consentChecked,
  handleConsentChange,
  openConsentModal,
}) => (
  <>
    <h2 className="form-title"> Game on. </h2>{" "}
    <h2 className="form-subtitle"> First delivery 's yours!</h2>{" "}
    <p className="form-description">
      Enter your phone number to receive a One - Time Password(OTP) for
      verification.{" "}
    </p>{" "}
    {error && (
      <div
        className={`message-box ${
          usingTestMode ? "info-message" : "error-message"
        }`}
      >
        {" "}
        {error}{" "}
      </div>
    )}{" "}
    <div className="phone-input-group">
      <div className="input-group">
        <div className="country-phone-container">
          <select
            className="country-code-select border-blue"
            value={countryCode}
            onChange={handleCountryCodeChange}
            disabled={isLoading || showOtpInput}
          >
            <option value="+91"> 🇮🇳+91 </option>{" "}
            <option value="+1"> 🇺🇸+1 </option>{" "}
            <option value="+44"> 🇬🇧+44 </option>{" "}
            <option value="+61"> 🇦🇺+61 </option>{" "}
            <option value="+971"> 🇦🇪+971 </option>{" "}
          </select>{" "}
          <input
            type="tel"
            placeholder="Mobile number"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            className="phone-input border-blue"
            maxLength={10}
            disabled={isLoading || showOtpInput}
          />{" "}
        </div>{" "}
        <button
          className="get-otp-btn"
          onClick={handleGetOtp}
          disabled={isLoading || phoneNumber.length !== 10 || showOtpInput}
        >
          {" "}
          {isLoading && !showOtpInput ? "Sending..." : "Get OTP"}{" "}
        </button>{" "}
      </div>{" "}
    </div>{" "}
    {/* Desktop OTP entry (inline) */}{" "}
    {showOtpInput && (
      <div className="simple-otp-container">
        <div className="otp-container">
          {" "}
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
          ))}{" "}
        </div>{" "}
        <div className="otp-info">
          <p className="remaining-time">
            {" "}
            {remainingTime > 0
              ? `Resending in ${remainingTime}s`
              : "OTP expired"}{" "}
          </p>{" "}
          <div className="resend-link">
            <span> Didn 't get the code?</span>{" "}
            <button
              onClick={handleResendOtp}
              className="resend-btn"
              disabled={remainingTime > 0 || isLoading}
            >
              Resend{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
        <button
          className="verify-btn"
          onClick={handleVerify}
          disabled={isLoading || otp.join("").length !== 6}
        >
          {" "}
          {isLoading ? "Verifying..." : "Verify"}{" "}
        </button>{" "}
      </div>
    )}{" "}
    {/* Simple consent container like in mobile view */}{" "}
    <div
      className="consent-container"
      style={{ display: "flex", alignItems: "flex-start", margin: "10px 0" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {" "}
        {/* Simple checkbox implementation */}{" "}
        <div
          onClick={(e) => {
            if (!isLoading && !showOtpInput) {
              handleConsentChange();
            }
          }}
          style={{
            width: "12px",
            height: "12px",
            minWidth: "12px",
            border: "1px solid #0083B5",
            borderRadius: "2px",
            marginRight: "8px",
            marginTop: "3px",
            backgroundColor: consentChecked ? "#0a1a34" : "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: isLoading || showOtpInput ? "default" : "pointer",
            opacity: isLoading || showOtpInput ? 0.5 : 1,
          }}
        >
          {" "}
          {consentChecked && (
            <div
              style={{
                width: "4px",
                height: "6px",
                borderRight: "2px solid white",
                borderBottom: "2px solid white",
                transform: "rotate(45deg) translate(-1px, -1px)",
              }}
            />
          )}{" "}
        </div>{" "}
        <span style={{ fontSize: "12px", lineHeight: "1.3" }}>
          By continuing, I accept the{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              openConsentModal(e);
            }}
          >
            {" "}
            Terms & Conditions{" "}
          </a>{" "}
        </span>{" "}
      </div>{" "}
    </div>{" "}
    {!showOtpInput && (
      <button
        className="verify-btn initial-verify-btn"
        onClick={handleGetOtp}
        disabled={isLoading || phoneNumber.length !== 10 || !consentChecked}
      >
        {" "}
        {isLoading ? "Processing..." : "Continue"}{" "}
      </button>
    )}{" "}
  </>
);

export default OtpVerification;
