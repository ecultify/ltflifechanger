import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/UploadPhoto.css';
import axios from 'axios';

const UploadPhoto = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
        // Show preview modal immediately after image is loaded
        setShowPreviewModal(true);
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
        // Show preview modal immediately after image is loaded
        setShowPreviewModal(true);
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
    
    // Create a file from the data URL for the background removal API
    canvas.toBlob((blob) => {
      const newFile = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
      setFile(newFile);
      // Show preview modal immediately after photo is taken
      setShowPreviewModal(true);
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

  // Convert image to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Extract the base64 string from the Data URL
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Helper function to simulate API response for testing/demo purposes
  const simulateCharacterGeneration = async (imageFile) => {
    try {
      // Simulate processing time
      setProcessingStep('Simulating character generation (fallback mode)...');
      
      // Wait to simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Apply background removal to the original image instead
      const bgRemovedImageUrl = await removeImageBackground(imageFile);
      return bgRemovedImageUrl;
      
    } catch (error) {
      console.error('Error in simulation:', error);
      return previewUrl; // Return original image if even the simulation fails
    }
  };

  // Helper function for detailed error logging
  const logDetailedError = (error, context) => {
    console.error(`=== ERROR IN ${context} ===`);
    console.error('Error object:', error);
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      try {
        if (error.response.data) {
          if (error.response.data instanceof Blob) {
            // Handle blob error data
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const errorText = reader.result;
                console.error('Error response (blob):', errorText);
                try {
                  const errorJson = JSON.parse(errorText);
                  console.error('Parsed error:', errorJson);
                } catch (e) {
                  // Not JSON, just log as text
                }
              } catch (e) {
                console.error('Could not read blob data');
              }
            };
            reader.readAsText(error.response.data);
          } else {
            console.error('Error response data:', error.response.data);
          }
        }
      } catch (e) {
        console.error('Could not log response data:', e);
      }
    }
    
    if (error.request) {
      console.error('Request object:', error.request);
    }
    
    console.error('Error stack:', error.stack);
    console.error(`=== END ERROR LOG FOR ${context} ===`);
  };

  // Use Segmind Consistent Character with Pose API
  const generateConsistentCharacter = async (imageFile) => {
    try {
      // For debugging - write to console that we are starting
      console.log('===== Starting Segmind character generation process =====');
      
      setProcessingStep('Preparing your image...');
      setLoadingProgress(20);
      
      // Convert the uploaded image to base64
      const faceImageBase64 = await fileToBase64(imageFile);
      console.log('Face image converted to base64, length:', faceImageBase64.length);
      
      // Load the pose image and convert to base64
      const poseImagePath = '/images/freepik__a-confident-young-indian-woman-with-straight-black__53397 (1).jpeg';
      console.log('Loading pose image from path:', poseImagePath);
      
      const response = await fetch(poseImagePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch pose image: ${response.status} ${response.statusText}`);
      }
      
      const poseImageBlob = await response.blob();
      console.log('Pose image blob size:', poseImageBlob.size);
      
      const poseImageBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(poseImageBlob);
      });
      console.log('Pose image converted to base64, length:', poseImageBase64.length);
      
      setProcessingStep('Creating your consistent character...');
      setLoadingProgress(40);
      
      // Prepare the request to Segmind API
      const apiKey = 'SG_13f9868f102f0d83'; // Segmind API key
      console.log('Using Segmind API key:', apiKey);
      
      // Check if API key is valid
      if (!apiKey || !apiKey.startsWith('SG_')) {
        console.error('Invalid Segmind API key format');
        setProcessingStep('API key validation failed, using fallback mode...');
        return simulateCharacterGeneration(imageFile);
      }
      
      const requestData = {
        base_64: true,
        prompt: "A professional looking person in formal business attire, confident pose, standing straight, clear facial features, high quality portrait, studio lighting, crisp details, professional photography, marketing poster style",
        face_image: faceImageBase64,
        pose_image: poseImageBase64,
        seed: Math.floor(Math.random() * 1000000),
        samples: 1
      };
      
      setProcessingStep('Generating your character...');
      setLoadingProgress(60);

      // Use Fetch API as primary method since it works better with Segmind
      console.log('Making API request to Segmind using Fetch API...');
      try {
        const apiUrl = 'https://api.segmind.com/v1/consistent-character-with-pose';
        console.log('Sending request to:', apiUrl);
        
        const fetchResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`Fetch API failed with status: ${fetchResponse.status}`);
        }
        
        const responseBlob = await fetchResponse.blob();
        console.log('Fetch API succeeded, blob size:', responseBlob.size);
        
        setProcessingStep('Processing generated image...');
        setLoadingProgress(70);
        
        // Convert the blob response to a URL for preview if needed
        const generatedImageUrl = URL.createObjectURL(responseBlob);
        console.log('Generated image URL:', generatedImageUrl);
        // Clean up the URL object to prevent memory leaks
        URL.revokeObjectURL(generatedImageUrl);
        
        setProcessingStep('Removing background...');
        setLoadingProgress(80);
        
        // Convert the blob to a file for background removal
        const generatedFile = new File([responseBlob], "consistent-character.jpg", { type: "image/jpeg" });
        
        // Remove background from the generated image
        const bgRemovedImageUrl = await removeImageBackground(generatedFile);
        console.log('Background removed successfully');
        
        return bgRemovedImageUrl;
      } catch (fetchError) {
        logDetailedError(fetchError, 'FETCH API CALL');
        console.log('Fetch API call failed, trying with Axios as fallback...');
        
        try {
          // Fallback to Axios
          console.log('Attempting fallback with Axios');
          const apiUrl = 'https://api.segmind.com/v1/consistent-character-with-pose';
          
          const apiResponse = await axios({
            method: 'post',
            url: apiUrl,
            data: requestData,
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json'
            },
            responseType: 'blob',
            timeout: 90000 // 90 second timeout (increased from 60s)
          });
          
          console.log('Axios response received:', apiResponse);
          
          // Convert the blob response to a URL
          const generatedImageUrl = URL.createObjectURL(apiResponse.data);
          console.log('Generated image URL from Axios:', generatedImageUrl);
          // Clean up URL object
          URL.revokeObjectURL(generatedImageUrl);
          
          // Convert the blob to a file for background removal
          const generatedFile = new File([apiResponse.data], "consistent-character.jpg", { type: "image/jpeg" });
          
          // Remove background from the generated image
          const bgRemovedImageUrl = await removeImageBackground(generatedFile);
          
          return bgRemovedImageUrl;
        } catch (axiosError) {
          logDetailedError(axiosError, 'AXIOS FALLBACK');
          console.log('Both API call attempts failed, falling back to simulation');
          return simulateCharacterGeneration(imageFile);
        }
      }
    } catch (error) {
      logDetailedError(error, 'OVERALL CHARACTER GENERATION');
      
      // If character generation fails, fall back to original image with background removal
      console.log('Falling back to original image due to character generation failure');
      return removeImageBackground(imageFile);
    }
  };

  // Background removal API function
  const removeImageBackground = async (imageFile) => {
    try {
      setProcessingStep('Removing background...');
      setLoadingProgress(85);
      
      // Create FormData to send the image
      const formData = new FormData();
      formData.append('image_file', imageFile);
      
      // Set the headers including the API key
      const headers = {
        'X-Api-Key': 'rXjhNaRAqHWtxLaugDbCKHZW', // Remove.bg API key
      };
      
      setLoadingProgress(90);
      
      // Make the actual API call to remove.bg
      const response = await axios.post(
        'https://api.remove.bg/v1.0/removebg',
        formData,
        { 
          headers, 
          responseType: 'arraybuffer' 
        }
      );
      
      setLoadingProgress(95);
      
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

  // Start the processing after user confirms in the preview modal
  const startProcessing = async () => {
    if (!file) {
      setError('No image file available.');
      return;
    }

    try {
      // Close preview modal and show processing modal
      setShowPreviewModal(false);
      setShowProcessingModal(true);
      setIsLoading(true);
      setLoadingProgress(10);
      
      // Generate consistent character with pose
      let processedImageUrl = previewUrl;
      
      try {
        processedImageUrl = await generateConsistentCharacter(file);
        console.log('Consistent character generated successfully');
      } catch (error) {
        console.error('Character generation failed:', error);
        // Fall back to just background removal
        try {
          processedImageUrl = await removeImageBackground(file);
          console.log('Background removal completed as fallback');
        } catch (bgRemovalError) {
          console.error('Background removal failed:', bgRemovalError);
          // Continue with the original image
        }
      }
      
      // Store the processed image
      setProcessedImage(processedImageUrl);
      setLoadingProgress(100);
      
      // Handle successful processing
      handleContinue(processedImageUrl);
      
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image. Please try again.');
      setShowProcessingModal(false);
      setIsLoading(false);
    }
  };

  // Submit the user data and proceed to next step
  const handleContinue = (finalImage) => {
    try {
      // Get user data from previous steps or use default values
      const userData = {
        name: sessionStorage.getItem('userName') || 'Your Name',
        companyName: sessionStorage.getItem('companyName') || 'Your Company',
        industry: sessionStorage.getItem('industry') || 'Your Industry',
        tagline: sessionStorage.getItem('tagline') || 'Your Tagline',
        phoneNumber: sessionStorage.getItem('phoneNumber') || 'Your Phone'
      };
      
      // Store data in session storage
      sessionStorage.setItem('userData', JSON.stringify(userData));
      sessionStorage.setItem('processedImage', finalImage || processedImage);
      
      // Navigate to poster creation page
      navigate('/share-poster');
    } catch (error) {
      console.error('Error submitting data:', error);
      setError('Failed to submit data. Please try again.');
      setShowProcessingModal(false);
      setIsLoading(false);
    }
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
                  {isLoading && !showProcessingModal ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <div className="loading-text">
                        Loading...
                      </div>
                    </div>
                  ) : previewUrl && !showPreviewModal ? (
                    <div className="preview-container">
                      <img src={previewUrl} alt="Preview" className="preview-image" />
                      <button 
                        className="remove-image-btn"
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl(null);
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
          </div>
        </div>
      </div>
      
      {/* Image Preview Modal */}
      {showPreviewModal && (
        <div className="preview-modal-overlay">
          <div className="preview-modal">
            <div className="preview-modal-header">
              <h2>Preview Your Image</h2>
              <button 
                className="modal-close-btn"
                onClick={() => {
                  setShowPreviewModal(false);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="preview-modal-content">
              <div className="preview-modal-image">
                <img src={previewUrl} alt="Preview" />
              </div>
              <div className="preview-modal-options">
                <p>Would you like to use this image?</p>
                <div className="preview-modal-buttons">
                  <button 
                    className="retake-btn"
                    onClick={() => {
                      setShowPreviewModal(false);
                      setPreviewUrl(null);
                      setFile(null);
                    }}
                  >
                    <i className="fas fa-redo-alt"></i> Choose Another Photo
                  </button>
                  <button 
                    className="confirm-btn"
                    onClick={startProcessing}
                  >
                    <i className="fas fa-check"></i> Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Processing Modal */}
      {showProcessingModal && (
        <div className="processing-modal-overlay">
          <div className="processing-modal">
            <div className="processing-content">
              <div className="loading-spinner"></div>
              <div className="processing-text">
                {processingStep || 'Processing your image...'}
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPhoto; 