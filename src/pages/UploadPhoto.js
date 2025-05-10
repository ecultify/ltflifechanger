import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/pages/UploadPhoto.css';
import '../styles/pages/StepColorOverrides.css';
import '../styles/components/FixedStepper.css';
import '../styles/pages/UploadPhotoOverrides.css';
import axios from 'axios';
import Loader from '../components/Loader';
import * as faceapi from 'face-api.js';
import { loadFaceDetectionModels } from '../utils/faceDetection';

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
  const [isNormalSelfie, setIsNormalSelfie] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceInPosition, setFaceInPosition] = useState(false);
  const [faceDetectionEnabled, setFaceDetectionEnabled] = useState(false);
  const [isSelfieMode, setIsSelfieMode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  console.log('Current device width:', window.innerWidth, 'Is Mobile:', window.innerWidth <= 768);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionRef = useRef(null);
  const navigate = useNavigate();

  // Initialize face detection when component mounts
  useEffect(() => {
    // Load face detection models
    loadFaceDetectionModels()
      .then(() => {
        console.log('Face detection models loaded successfully');
        setFaceDetectionEnabled(true);
      })
      .catch(err => {
        console.error('Failed to load face detection models:', err);
        setFaceDetectionEnabled(false);
      });
  }, []);

  // Add resize listener to update mobile state
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      console.log('Resize detected:', window.innerWidth, 'Setting mobile:', newIsMobile);
      setIsMobile(newIsMobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Handle face detection in video stream
  const detectFacesInVideo = async () => {
    if (!videoRef.current || !videoRef.current.srcObject || !faceDetectionEnabled) {
      return;
    }

    try {
      // Get face detections
      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.7 }) // Increased threshold for more accurate detection
      ).withFaceLandmarks();

      // Check if any faces were detected
      if (detections && detections.length > 0) {
        setFaceDetected(true);

        // Get the most prominent face (usually the largest one)
        const mainFace = detections.sort((a, b) =>
          (b.detection.box.width * b.detection.box.height) -
          (a.detection.box.width * a.detection.box.height)
        )[0];

        // Get detection confidence
        const confidence = mainFace.detection.score;

        // Get video dimensions
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;

        // Calculate center of the screen
        const centerX = videoWidth / 2;
        // Adjust centerY based on selfie mode - slightly higher center point for selfies
        const centerY = isSelfieMode ? videoHeight / 2.5 : videoHeight / 2.2;

        // Get face dimensions and position
        const faceBox = mainFace.detection.box;
        const faceCenterX = faceBox.x + (faceBox.width / 2);
        const faceCenterY = faceBox.y + (faceBox.height / 2);

        // Calculate percentage of displacement from center
        const xDisplacementPercent = Math.abs(faceCenterX - centerX) / (videoWidth / 2) * 100;
        const yDisplacementPercent = Math.abs(faceCenterY - centerY) / (videoHeight / 2) * 100;

        // Log face position data for debugging
        if (Math.random() < 0.05) { // Log only occasionally to avoid console spam
          console.log(`Face position: x=${xDisplacementPercent.toFixed(1)}%, y=${yDisplacementPercent.toFixed(1)}%, width=${(faceBox.width / videoWidth * 100).toFixed(1)}%, confidence=${confidence.toFixed(2)}`);
        }

        // Define stricter acceptable distance from center - use percentage of screen size
        // Smaller tolerance for selfie mode (more precise face positioning)
        const xTolerancePercent = isSelfieMode ? 10 : 15; // % of screen width from center
        const yTolerancePercent = isSelfieMode ? 15 : 20; // % of screen height from center

        // Calculate acceptable minimum face size as percentage of screen width
        const minFaceSizePercent = isSelfieMode ? 15 : 15; // Reduced from 25% to 15% for selfie mode to encourage taking photos from a distance

        // Check if face is within acceptable position with different criteria for selfie mode
        let inPosition = false;

        if (isSelfieMode) {
          // For selfie mode: strict positioning requirements
          inPosition =
            confidence > 0.8 && // High confidence required
            xDisplacementPercent < xTolerancePercent &&
            yDisplacementPercent < yTolerancePercent &&
            (faceBox.width / videoWidth) * 100 > minFaceSizePercent;
        } else {
          // For normal photos: also strict but with different parameters
          inPosition =
            confidence > 0.75 && // Good confidence required
            xDisplacementPercent < xTolerancePercent &&
            yDisplacementPercent < yTolerancePercent &&
            (faceBox.width / videoWidth) * 100 > minFaceSizePercent;
        }

        setFaceInPosition(inPosition);
      } else {
        setFaceDetected(false);
        setFaceInPosition(false);
      }
    } catch (error) {
      console.error('Face detection error:', error);
    }

    // Continue detection loop if camera is still active
    if (videoRef.current && videoRef.current.srcObject) {
      detectionRef.current = requestAnimationFrame(detectFacesInVideo);
    }
  };

  // Handle camera activation
  const activateCamera = async (selfieMode = false) => {
    try {
      setIsCameraActive(true);
      setIsSelfieMode(selfieMode);

      // Use the appropriate camera based on mode
      const facingMode = selfieMode ? "user" : "environment"; // "user" for front camera, "environment" for back camera

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });

      // Set the video source to the camera stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          // Start face detection
          detectionRef.current = requestAnimationFrame(detectFacesInVideo);
        };
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

    // Set canvas dimensions to match video dimensions but maintain aspect ratio
    // Use different aspect ratios depending on camera mode
    const videoAspect = video.videoWidth / video.videoHeight;

    let canvasWidth, canvasHeight;
    let offsetX, offsetY;

    if (isSelfieMode) {
      // For selfie mode, use 4:5 aspect ratio focusing on the face
      const targetAspect = 4 / 5;

      if (videoAspect > targetAspect) {
        // Video is wider than target aspect, use full height and calculated width
        canvasHeight = video.videoHeight;
        canvasWidth = video.videoHeight * targetAspect;
      } else {
        // Video is taller than target aspect, use full width and calculated height
        canvasWidth = video.videoWidth;
        canvasHeight = video.videoWidth / targetAspect;
      }

      // For selfies, center the face more precisely
      offsetX = (video.videoWidth - canvasWidth) / 2;
      offsetY = (video.videoHeight - canvasHeight) / 4; // Position higher to focus on face
    } else {
      // For back camera (full body shots), use 3:5 aspect ratio to capture more body
      const targetAspect = 3 / 5;

      if (videoAspect > targetAspect) {
        // Video is wider than target aspect, use full height and calculated width
        canvasHeight = video.videoHeight;
        canvasWidth = video.videoHeight * targetAspect;
      } else {
        // Video is taller than target aspect, use full width and calculated height
        canvasWidth = video.videoWidth;
        canvasHeight = video.videoWidth / targetAspect;
      }

      // Calculate centering offsets to position the image properly
      // Shift the vertical offset up more to better include the body
      offsetX = (video.videoWidth - canvasWidth) / 2;
      offsetY = (video.videoHeight - canvasHeight) / 3; // Position higher to include more body
    }

    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Draw the current video frame to the canvas with the correct positioning
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      video,
      offsetX, offsetY, canvasWidth, canvasHeight,  // Source rectangle
      0, 0, canvasWidth, canvasHeight               // Destination rectangle
    );

    console.log(`Captured photo with dimensions: ${canvasWidth}x${canvasHeight}, mode: ${isSelfieMode ? 'selfie' : 'normal'}`);

    // Convert canvas to data URL with high quality
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.95); // High quality JPEG

    // Set the photo as the preview
    setPreviewUrl(photoDataUrl);

    // Create a file from the data URL for processing
    const fileName = isSelfieMode ? "selfie-photo.jpg" : "camera-photo.jpg";

    // Use toBlob with proper MIME type and quality
    canvas.toBlob((blob) => {
      // Create a proper File object with explicit type
      const newFile = new File([blob], fileName, {
        type: "image/jpeg",
        lastModified: Date.now()
      });

      console.log('Created photo file:', newFile.name, 'size:', newFile.size, 'type:', newFile.type);

      // Set the file for processing
      setFile(newFile);

      // Show preview modal immediately after photo is taken
      setShowPreviewModal(true);
    }, 'image/jpeg', 0.95); // High quality JPEG

    // Stop camera stream
    stopCamera();
  };

  // Stop camera stream and face detection
  const stopCamera = () => {
    // Cancel face detection loop
    if (detectionRef.current) {
      cancelAnimationFrame(detectionRef.current);
      detectionRef.current = null;
    }

    // Stop all camera tracks
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
    setFaceDetected(false);
    setFaceInPosition(false);
  };

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
      setProcessingStep('Generating your poster...');

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

  // Add this function to simulate gradual progress during Segmind processing
  const simulateProgressDuringProcessing = (startProgress, endProgress, duration, callback) => {
    const startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = startProgress + ((elapsed / duration) * (endProgress - startProgress));

      if (elapsed < duration) {
        callback(Math.min(progress, endProgress));
        requestAnimationFrame(updateProgress);
      } else {
        callback(endProgress);
      }
    };

    updateProgress();
  };

  // Use Segmind Consistent Character with Pose API
  const generateConsistentCharacter = async (imageFile) => {
    try {
      // For debugging - write to console that we are starting
      console.log('===== Starting Segmind character generation process =====');

      setProcessingStep('Generating your poster...');
      setLoadingProgress(10);

      // Convert the uploaded image to base64
      const faceImageBase64 = await fileToBase64(imageFile);
      console.log('Face image converted to base64, length:', faceImageBase64.length);

      // Load the pose image and convert to base64
      const poseImagePath = '/images/freepik__a-confident-young-indian-woman-with-straight-black__53397 (1).jpeg';
      console.log('Loading pose image from path:', poseImagePath);

      // Start simulating gradual progress from 10% to 30% while loading pose image
      simulateProgressDuringProcessing(10, 30, 3000, setLoadingProgress);

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

      setProcessingStep('Generating your poster...');
      setLoadingProgress(30);

      // Prepare the request to Segmind API
      const apiKey = 'SG_13f9868f102f0d83'; // Segmind API key
      console.log('Using Segmind API key:', apiKey);

      // Check if API key is valid
      if (!apiKey || !apiKey.startsWith('SG_')) {
        console.error('Invalid Segmind API key format');
        setProcessingStep('Generating your poster...');
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

      setProcessingStep('Generating your poster...');

      // Start simulating gradual progress during the main Segmind processing
      // This will gradually increase from 30% to 65% over 30 seconds
      simulateProgressDuringProcessing(30, 65, 30000, setLoadingProgress);

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

        setProcessingStep('Generating your poster...');
        setLoadingProgress(70);

        // Convert the blob response to a URL for preview if needed
        const generatedImageUrl = URL.createObjectURL(responseBlob);
        console.log('Generated image URL:', generatedImageUrl);
        // Clean up the URL object to prevent memory leaks
        URL.revokeObjectURL(generatedImageUrl);

        setProcessingStep('Generating your poster...');
        setLoadingProgress(75);

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
      console.log('Starting background removal process for file:', imageFile?.name, 'size:', imageFile?.size);

      // Get API key from environment or use fallback
      const segmindApiKey = process.env.REACT_APP_SEGMIND_API_KEY || 'SG_13f9868f102f0d83';
      
      // Check if imageFile is valid
      if (!imageFile || !(imageFile instanceof File)) {
        console.error('Invalid image file for background removal:', imageFile);
        throw new Error('Invalid image file');
      }

      // Convert the file to base64 for API
      let base64Image;
      try {
        base64Image = await fileToBase64(imageFile);
        console.log('Image converted to base64 for background removal, length:', base64Image.length);
        
        // Remove the data URI prefix for API
        base64Image = base64Image.replace(/^data:image\/\w+;base64,/, "");
      } catch (base64Error) {
        console.error('Failed to convert image to base64:', base64Error);
        throw new Error('Failed to process image');
      }

      // Try different background removal approaches
      let result = null;
      
      // First try: Segmind background-eraser API (newer endpoint)
      try {
        console.log('Trying Segmind background-eraser API...');
        setProcessingStep('Removing background (method 1)...');
        
        const response = await fetch('https://api.segmind.com/v1/background-eraser', {
          method: 'POST',
          headers: {
            'x-api-key': segmindApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            image: base64Image,
            return_mask: false,
            invert_mask: false,
            grow_mask: 0,
            base64: false
          })
        });
        
        if (!response.ok) {
          throw new Error(`Background-eraser API responded with status: ${response.status}`);
        }
        
        const blob = await response.blob();
        if (!blob || blob.size === 0) {
          throw new Error('Empty response from background-eraser API');
        }
        
        result = URL.createObjectURL(blob);
        console.log('Background-eraser API successful');
        
        // If we successfully got a result, return it
        if (result) {
          setLoadingProgress(80);
          return result;
        }
      } catch (error) {
        console.error('Background-eraser API failed:', error);
        // Continue to next method
      }
      
      // Second try: Original bg-removal API
      try {
        console.log('Trying Segmind bg-removal API...');
        setProcessingStep('Removing background (method 2)...');
        
        const response = await fetch('https://api.segmind.com/v1/bg-removal', {
          method: 'POST',
          headers: {
            'x-api-key': segmindApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            image: base64Image,
            response_format: 'png',
            method: 'object'
          })
        });
        
        if (!response.ok) {
          throw new Error(`Bg-removal API responded with status: ${response.status}`);
        }
        
        const blob = await response.blob();
        if (!blob || blob.size === 0) {
          throw new Error('Empty response from bg-removal API');
        }
        
        result = URL.createObjectURL(blob);
        console.log('Bg-removal API successful');
        
        // If we successfully got a result, return it
        if (result) {
          setLoadingProgress(80);
          return result;
        }
      } catch (error) {
        console.error('Bg-removal API failed:', error);
        // Continue to next method
      }
      
      // Third try: FormData approach
      try {
        console.log('Trying formData approach...');
        setProcessingStep('Removing background (method 3)...');
        
        const formData = new FormData();
        formData.append('file', imageFile);
        
        const response = await axios({
          method: 'post',
          url: 'https://api.segmind.com/v1/bg-removal',
          data: formData,
          headers: {
            'x-api-key': segmindApiKey,
            'Content-Type': 'multipart/form-data'
          },
          responseType: 'blob'
        });
        
        if (!response.data || response.data.size === 0) {
          throw new Error('Empty response from FormData approach');
        }
        
        result = URL.createObjectURL(response.data);
        console.log('FormData approach successful');
        
        // If we successfully got a result, return it
        if (result) {
          setLoadingProgress(80);
          return result;
        }
      } catch (error) {
        console.error('FormData approach failed:', error);
        // Fall back to original image
      }
      
      // If all methods failed, return original image
      console.log('All background removal methods failed, using original image');
      return previewUrl;
      
    } catch (error) {
      console.error('Fatal error in background removal process:', error);
      setLoadingProgress(100);
      return previewUrl; // Return original image as last resort
    }
  };

  // Function to enhance image using ESRGAN model from Segmind
  const enhanceImageWithESRGAN = async (imageUrl) => {
    try {
      setProcessingStep('Enhancing your selfie...');
      // Start at current progress
      const currentProgress = loadingProgress;

      // Simulate gradual progress during enhancement process
      simulateProgressDuringProcessing(currentProgress, 90, 5000, setLoadingProgress);

      // Convert the URL to a file for processing if needed
      let imageFile = imageUrl;

      // In a real implementation, we would call the Segmind ESRGAN API here
      // For now, we'll simulate the enhancement by just waiting
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Image enhancement simulated (would use ESRGAN in production)');

      // Return the image URL (which would be the enhanced image URL in production)
      return imageUrl;

    } catch (error) {
      console.error('Error enhancing image:', error);
      // If enhancement fails, return the original image
      return imageUrl;
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
      setLoadingProgress(0);

      // Log file details for debugging
      console.log('Processing file:', file.name, 'size:', file.size, 'type:', file.type);

      // Simulate initial loading progress
      simulateProgressDuringProcessing(0, 10, 1000, setLoadingProgress);

      let processedImageUrl = previewUrl;

      // Normal selfie flow - first remove background
      setProcessingStep('Processing your photo...');
      simulateProgressDuringProcessing(10, 50, 2000, setLoadingProgress);

      try {
        // Remove the background
        console.log('Starting background removal with file:', file.name);
        processedImageUrl = await removeImageBackground(file);
        console.log('Background removal completed, result URL length:', processedImageUrl?.length);

        // If the result is the same as the original preview URL, it means background removal failed
        if (processedImageUrl === previewUrl) {
          console.warn('Background removal may have failed as the result URL is the same as the preview URL');
        }

        // Add a small delay to show progress
        setProcessingStep('Finalizing your photo...');
        simulateProgressDuringProcessing(50, 80, 1500, setLoadingProgress);

        // Apply enhancement at the very end
        setProcessingStep('Enhancing your photo...');
        processedImageUrl = await enhanceImageWithESRGAN(processedImageUrl);
        console.log('Image enhancement completed');

      } catch (error) {
        console.error('Photo processing failed:', error);
        // Log detailed error information
        logDetailedError(error, 'PHOTO_PROCESSING');
        // Continue with the original image
        processedImageUrl = previewUrl;
        setLoadingProgress(100);
      }

      // Store the processed image and ensure progress is complete
      setProcessedImage(processedImageUrl);
      setLoadingProgress(100);

      // Add a small delay before proceeding to ensure user sees the completed progress
      setTimeout(() => {
        // Handle successful processing
        handleContinue(processedImageUrl);
      }, 1000);

    } catch (error) {
      console.error('Error processing image:', error);
      logDetailedError(error, 'OVERALL_PROCESSING');
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
        phoneNumber: sessionStorage.getItem('phoneNumber') || 'Your Phone',
        isNormalSelfie: isNormalSelfie, // Add the flag to indicate if this is a normal selfie
        isSelfieMode: isSelfieMode // Add the flag to indicate if this is a selfie mode
      }

      // Store data in session storage
      sessionStorage.setItem('userData', JSON.stringify(userData));
      sessionStorage.setItem('processedImage', finalImage || processedImage);

      // Force scroll to top before navigation
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      
      // Navigate to poster creation page
      navigate('/share-poster');
      
      // Also attempt to scroll after navigation with a slight delay
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
      }, 50);
    } catch (error) {
      console.error('Error submitting data:', error);
      setError('Failed to submit data. Please try again.');
      setShowProcessingModal(false);
      setIsLoading(false);
    }
  };

  // Add a style tag to forcefully override logo size
  useEffect(() => {
    // Create style element
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .forced-small-logo {
        max-width: 230px !important;
        width: 230px !important;
      }

      .logo-container-fix {
        top: 45px !important;
      }
    `;
    document.head.appendChild(styleEl);
    
    // Clean up
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  return (
    <div className="upload-page">
      <div className="left-section">
        {!isMobile ? (
          // Desktop view
          <>
            {/* Background image */}
            <img
              src="/images/uploadphoto/uploadphotobg.png"
              alt="Background"
              className="left-section-background"
            />

            {/* Logo at the top left */}
            <div className="left-logo-container">
              <Link to="/">
                <img
                  src="/images/LOGO.png"
                  alt="Logo"
                  className="left-logo-image forced-small-logo"
                  style={{ width: '230px' }}
                />
              </Link>
            </div>

            {/* Bumrah and You image below logo, center-aligned and positioned */}
            <div className="left-bumrah-container">
              <img
                src="/images/uploadphoto/bumraahandu.png"
                alt="Bumrah and You"
                className="left-bumrah-image"
                style={{ maxWidth: '350px' }}
              />
            </div>

            {/* Two DOS images side by side below Bumrah+YOU */}
            <div className="left-dos-container">
              <img
                src="/images/uploadphoto/dos1.png"
                alt="Do's 1"
                className="left-dos-image"
              />
              <img
                src="/images/uploadphoto/Dos2.png"
                alt="Do's 2"
                className="left-dos-image"
              />
            </div>
          </>
        ) : (
          // Mobile view - restructured as a single vertical column with proper spacing
          <>
            {/* Background image */}
            <img
              src="/images/uploadphoto/uploadphotobg.png"
              alt="Background"
              className="left-section-background"
            />

            {/* Logo at the top */}
            <div className="left-logo-container">
              <Link to="/">
                <img
                  src="/images/LOGO.png"
                  alt="Logo"
                  className="left-logo-image"
                />
              </Link>
            </div>

            {/* Bumrah and You image - 20px below logo */}
            <div className="left-bumrah-container">
              <img
                src="/images/uploadphoto/bumraahandu.png"
                alt="Bumrah and You"
                className="left-bumrah-image"
              />
            </div>

            {/* DOS2 image only - 20px below Bumrah image */}
            <div className="left-dos-container">
              <img
                src="/images/uploadphoto/Dos2.png"
                alt="Do's 2"
                className="left-dos-image"
              />
            </div>

            {/* Form container - 20px below DOS2 image */}
            <div className="form-container">
              {/* Mobile stepper indicator - centered and integrated with form */}
              <div className="fixed-stepper" style={{ boxShadow: 'none', background: 'transparent' }}>
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
              
              {/* Title after stepper indicator */}
              <h2 className="form-title">Upload Your Photo</h2>
              
              {isCameraActive ? (
                /* Camera preview for mobile */
                <div className="mobile-camera-container">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="camera-video"
                  ></video>
                  <div className={`person-outline-overlay ${isSelfieMode ? 'selfie-mode' : ''} ${faceInPosition ? 'face-in-position' : faceDetected ? 'face-detected' : ''}`}>
                    <img
                      src="/images/face-outline.svg"
                      alt="Face outline"
                      className="outline-image"
                    />
                    <div className="positioning-guide">
                      {faceInPosition ?
                        "Perfect! Hold still and take the photo." :
                        faceDetected ?
                          "Move closer and center your face in the outline" :
                          isSelfieMode ?
                            "Position your face within the outline and look at the camera" :
                            "Position your face in the outline, hold camera at eye level"
                      }
                    </div>
                  </div>
                  <div className="camera-controls">
                    <button
                      className={`camera-btn ${faceInPosition ? 'active' : 'disabled'}`}
                      onClick={takePhoto}
                      disabled={!faceInPosition}
                    >
                      <i className="fas fa-camera"></i>
                    </button>
                    <button className="camera-btn cancel" onClick={stopCamera}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                </div>
              ) : (
                /* Normal upload area */
                <div className="upload-area" onDragOver={handleDragOver} onDrop={handleDrop}>
                  <p>Drag your file to start uploading</p>
                  <div className="upload-divider"><span>or</span></div>

                  <div className="upload-buttons">
                    <button
                      className="upload-btn blue-btn"
                      onClick={() => activateCamera(false)}
                    >
                      <i className="fa fa-camera"></i> Take a photo
                    </button>

                    <button
                      className="upload-btn orange-btn"
                      onClick={() => activateCamera(true)}
                    >
                      <i className="fa fa-user"></i> Take a selfie
                    </button>

                    <button
                      className="browse-button"
                      onClick={() => document.getElementById('file-input').click()}
                    >
                      <i className="fa fa-folder-open"></i> Browse for photo
                    </button>
                    <input
                      type="file"
                      id="file-input"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Desktop-only right section */}
      {!isMobile && (
        <div className="right-section">
          {/* Fixed position stepper in right column */}
          <div className="fixed-stepper-container">
            <div className="fixed-stepper">
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
          </div>
          
          <div className="right-content">
            <div className="upload-container">
              <h1 className="upload-title">Upload Your Photo</h1>

              {error && <div className="error-message">{error}</div>}

              <div className="upload-area-container">
                {isCameraActive ? (
                  <div className="camera-container">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="camera-video"
                    ></video>
                    <div className={`person-outline-overlay ${isSelfieMode ? 'selfie-mode' : ''} ${faceInPosition ? 'face-in-position' : faceDetected ? 'face-detected' : ''}`}>
                      <img
                        src="/images/face-outline.svg"
                        alt="Face outline"
                        className="outline-image"
                      />
                      <div className="positioning-guide">
                        {faceInPosition ?
                          "Perfect! Hold still and take the photo." :
                          faceDetected ?
                            "Move closer and center your face in the outline" :
                            isSelfieMode ?
                              "Position your face within the outline and look at the camera" :
                              "Position your face in the outline, hold camera at eye level"
                        }
                      </div>
                    </div>
                    <div className="camera-controls">
                      <button
                        className={`camera-btn ${faceInPosition ? 'active' : 'disabled'}`}
                        onClick={takePhoto}
                        disabled={!faceInPosition}
                      >
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
                        <Loader />
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
                            onClick={() => {
                              setIsNormalSelfie(true);
                              activateCamera(false); // Use back camera
                            }}
                          >
                            <i className="fas fa-camera"></i> Take a photo
                          </button>
                          <button
                            className="take-photo-btn selfie-btn"
                            onClick={() => {
                              setIsNormalSelfie(true);
                              activateCamera(true); // Use front camera (selfie mode)
                            }}
                          >
                            <i className="fas fa-user"></i> Take a selfie
                          </button>
                          <label htmlFor="normal-file-upload" className="browse-btn">
                            <i className="fas fa-folder-open"></i> Browse for photo
                          </label>
                          <input
                            id="normal-file-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              setIsNormalSelfie(true);
                              handleFileChange(e);
                            }}
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
      )}

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

            {/* Updated layout with image scrollable and buttons fixed */}
            <div className="preview-modal-body">
              <div className="preview-modal-image">
                <img src={previewUrl} alt="Preview" />
              </div>
            </div>

            <div className="preview-modal-footer">
              <p className="preview-question">Use this photo?</p>
              <div className="preview-modal-buttons">
                <button
                  className="retake-btn"
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewUrl(null);
                    setFile(null);
                  }}
                >
                  <i className="fas fa-redo-alt"></i> Choose another
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
      )}

      {/* Processing Modal */}
      {showProcessingModal && (
        <div className="processing-modal-overlay">
          <div className="processing-modal">
            <div className="processing-content">
              <Loader fullScreen={false} message={'Generating your poster...'} />
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