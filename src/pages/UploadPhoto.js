import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/UploadPhoto.css';
import axios from 'axios';
import * as faceapi from 'face-api.js';

const UploadPhoto = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedGender, setDetectedGender] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [manualGenderSelection, setManualGenderSelection] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // Load face-api.js models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        
        // Check if models are already loaded
        if (!modelsLoaded) {
          setLoadingProgress(10);
          
          // Load required models
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
          ]);
          
          console.log('Face detection models loaded successfully');
          setModelsLoaded(true);
        }
      } catch (error) {
        console.error('Error loading face detection models:', error);
        // Continue with app even if models fail to load
        setModelsLoaded(false);
      }
    };
    
    loadModels();
  }, [modelsLoaded]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(droppedFile);
    }
  };
  
  // Handle camera activation
  const activateCamera = async () => {
    try {
      setIsCameraActive(true);
      
      // Access user's camera (front-facing)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });
      
      // Set the video source to the camera stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check camera permissions.");
      setIsCameraActive(false);
    }
  };
  
  // Handle taking a photo with the camera
  const takePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to the canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to data URL
    const photoDataUrl = canvas.toDataURL('image/jpeg');
    
    // Set the photo as the preview
    setPreviewUrl(photoDataUrl);
    
    // Create a file from the data URL
    canvas.toBlob((blob) => {
      const newFile = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
      setFile(newFile);
    }, 'image/jpeg');
    
    // Stop camera stream
    stopCamera();
  };
  
  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsCameraActive(false);
  };

  const removeImageBackground = async (imageFile) => {
    try {
      setLoadingProgress(25);
      
      // Create FormData to send the image
      const formData = new FormData();
      formData.append('image_file', imageFile);
      
      // Set the headers including the API key
      const headers = {
        'X-Api-Key': 'rXjhNaRAqHWtxLaugDbCKHZW',
      };
      
      setLoadingProgress(40);
      
      // Make the actual API call to remove.bg
      const response = await axios.post(
        'https://api.remove.bg/v1.0/removebg',
        formData,
        { 
          headers, 
          responseType: 'arraybuffer' 
        }
      );
      
      setLoadingProgress(75);
      
      // Convert the array buffer to a base64 string
      const blob = new Blob([response.data], { type: 'image/png' });
      const bgRemovedImageUrl = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      
      return bgRemovedImageUrl;
      
    } catch (error) {
      console.error('Error removing background:', error);
      
      // If the API call fails, we'll fall back to the original image
      console.log('Using original image as fallback due to background removal failure');
      return previewUrl;
    }
  };

  // New function to detect gender from image
  const detectGender = async (imageUrl) => {
    if (!modelsLoaded) {
      console.log('Models not loaded, skipping gender detection');
      return null;
    }
    
    try {
      // Load the image for face-api.js processing
      const img = await faceapi.fetchImage(imageUrl);
      
      // Detect face with age and gender
      const detections = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withAgeAndGender();
      
      if (!detections) {
        console.log("No face detected in the image.");
        setManualGenderSelection(true);
        return null;
      }
      
      // Get gender from detection results
      const { gender, genderProbability } = detections;
      console.log(`Detected gender: ${gender} with probability: ${genderProbability}`);
      
      // Store the detected gender
      setDetectedGender(gender);
      setManualGenderSelection(false); // We found a gender, no need for manual selection
      return gender;
    } catch (error) {
      console.error('Error detecting gender:', error);
      setManualGenderSelection(true);
      return null;
    }
  };

  const handleNext = async () => {
    if (!file) {
      setError('Please upload an image first.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Detect gender from preview image
      setLoadingProgress(20);
      const gender = await detectGender(previewUrl);
      
      // Process the image - remove background
      setLoadingProgress(30);
      const result = await removeImageBackground(file);
      
      // Add a slight delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 800));
      setLoadingProgress(90);
      
      setProcessedImage(result);
      
      // Instead of navigating immediately, show the preview modal
      setShowPreviewModal(true);
      setIsLoading(false);
      
    } catch (err) {
      console.error('Error processing image:', err);
      setError(err.message || 'Failed to process image. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleConfirmImage = () => {
    // Store processed image in sessionStorage for the next page
    sessionStorage.setItem('processedImage', processedImage);
    
    // Store the detected gender in sessionStorage
    sessionStorage.setItem('userGender', detectedGender || 'unknown');
    
    // Store form data from previous page
    // Get user data from sessionStorage
    const userFormData = {
      name: sessionStorage.getItem('userName') || 'John Doe',
      companyName: sessionStorage.getItem('companyName') || 'ABC Business',
      industry: sessionStorage.getItem('industry') || 'technology',
      tagline: sessionStorage.getItem('tagline') || 'I transform businesses with innovative digital solutions and expertise',
      phoneNumber: sessionStorage.getItem('phoneNumber') || '+91 9876543210',
      gender: detectedGender || 'unknown'
    };
    
    sessionStorage.setItem('userFormData', JSON.stringify(userFormData));
    
    // Close modal and navigate to the poster page
    setShowPreviewModal(false);
    navigate('/share-poster');
  };
  
  const handleRetakePhoto = () => {
    // Close modal and allow user to upload a new photo
    setShowPreviewModal(false);
    setProcessedImage(null);
    setPreviewUrl(null);
    setFile(null);
    setDetectedGender(null);
  };

  // Manual gender selection handler
  const handleGenderSelection = (gender) => {
    setDetectedGender(gender);
    setManualGenderSelection(false);
  };

  return (
    <div className="upload-page">
      <div className="left-section">
        <img 
          src="/images/Upload Photo + Add Details.png" 
          alt="L&T Finance Upload" 
          className="left-section-image"
        />
      </div>
      
      <div className="right-section">
        <div className="right-content">
          <div className="progress-tracker">
            <div className="progress-step completed">
              <div className="step-circle">1</div>
              <div className="step-label">OTP</div>
            </div>
            <div className="progress-line active"></div>
            <div className="progress-step completed">
              <div className="step-circle">2</div>
              <div className="step-label">Add Details</div>
            </div>
            <div className="progress-line active"></div>
            <div className="progress-step active">
              <div className="step-circle">3</div>
              <div className="step-label">Upload</div>
            </div>
          </div>
          
          <div className="upload-container">
            <h1 className="upload-title">Upload Your Photo</h1>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="upload-area-container">
              <p className="upload-subtitle">Upload Your Photo</p>
              
              {isCameraActive ? (
                <div className="camera-container">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    className="camera-video"
                  ></video>
                  <div className="camera-controls">
                    <button className="camera-btn" onClick={takePhoto}>
                      <i className="fas fa-camera"></i>
                    </button>
                    <button className="camera-btn cancel" onClick={stopCamera}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                </div>
              ) : (
                <div 
                  className="upload-area"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {isLoading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <div className="loading-text">
                        {loadingProgress < 30 ? 'Analyzing Image...' :
                         loadingProgress < 50 ? 'Uploading Image...' : 
                         loadingProgress < 80 ? 'Removing Background...' : 
                         'Creating Your Poster...'}
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${loadingProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : previewUrl ? (
                    <div className="preview-container">
                      <img src={previewUrl} alt="Preview" className="preview-image" />
                      <button 
                        className="remove-image-btn"
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl(null);
                          setDetectedGender(null);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="drag-text">Drag your file to start uploading</p>
                      <div className="upload-divider">
                        <span>or</span>
                      </div>
                      <div className="upload-options">
                        <button 
                          className="take-photo-btn"
                          onClick={activateCamera}
                        >
                          <i className="fas fa-camera"></i> Take a Photo
                        </button>
                        <label htmlFor="file-upload" className="browse-btn">
                          <i className="fas fa-folder-open"></i> Browse files
                        </label>
                        <input
                          id="file-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Manual gender selection when needed */}
            {manualGenderSelection && previewUrl && !isLoading && (
              <div className="gender-selection-container">
                <h3 className="gender-selection-title">Please select your gender:</h3>
                <div className="gender-selection-buttons">
                  <button 
                    className={`gender-btn ${detectedGender === 'male' ? 'active' : ''}`}
                    onClick={() => handleGenderSelection('male')}
                  >
                    <i className="fas fa-male"></i> Male
                  </button>
                  <button 
                    className={`gender-btn ${detectedGender === 'female' ? 'active' : ''}`}
                    onClick={() => handleGenderSelection('female')}
                  >
                    <i className="fas fa-female"></i> Female
                  </button>
                </div>
              </div>
            )}
            
            <button 
              className="next-btn"
              onClick={handleNext}
              disabled={isLoading || !previewUrl || isCameraActive}
            >
              {isLoading ? 'Processing...' : 'Create Poster'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="preview-modal-overlay">
          <div className="preview-modal">
            <div className="preview-modal-header">
              <h2>Preview Your Poster</h2>
              <button 
                className="modal-close-btn"
                onClick={handleRetakePhoto}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="preview-modal-content">
              <div className="preview-modal-image">
                <img src={processedImage} alt="Processed" />
              </div>
              <div className="preview-modal-options">
                <p>How does your image look?</p>
                {detectedGender && (
                  <p className="gender-info">Detected gender: {detectedGender === 'male' ? 'Male' : 'Female'}</p>
                )}
                <div className="preview-modal-buttons">
                  <button 
                    className="retake-btn"
                    onClick={handleRetakePhoto}
                  >
                    <i className="fas fa-redo-alt"></i> Take Another Photo
                  </button>
                  <button 
                    className="confirm-btn"
                    onClick={handleConfirmImage}
                  >
                    <i className="fas fa-check"></i> Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPhoto; 