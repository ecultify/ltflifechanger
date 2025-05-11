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
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

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
  // Crop state
  const [crop, setCrop] = useState({ 
    unit: '%', 
    width: 80,
    height: 100,
    x: 10,
    y: 0,
    aspect: undefined // Remove aspect ratio constraint to allow fixed height but variable width
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [cropMode, setCropMode] = useState('center'); // 'center', 'left', 'right'
  const [cropWidth, setCropWidth] = useState('medium'); // 'narrow', 'medium', 'wide'
  // New state variables for flexible cropping
  const [leftCropPercentage, setLeftCropPercentage] = useState(10); // 10% from left
  const [rightCropPercentage, setRightCropPercentage] = useState(10); // 10% from right
  const [topCropPercentage, setTopCropPercentage] = useState(0); // 0% from top
  const [bottomCropPercentage, setBottomCropPercentage] = useState(0); // 0% from bottom
  const [cropWidthPercentage, setCropWidthPercentage] = useState(80); // 80% width initially
  const [cropHeightPercentage, setCropHeightPercentage] = useState(100); // 100% height initially
  const imgRef = useRef(null);
  console.log('Current device width:', window.innerWidth, 'Is Mobile:', window.innerWidth <= 768);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionRef = useRef(null);
  const previewCanvasRef = useRef(null); // For cropping
  const navigate = useNavigate();

  // Add a new cropData state variable to track and store crop metadata
  const [cropData, setCropData] = useState(null);

  // Add new state for the crop modal
  const [showCropModal, setShowCropModal] = useState(false);
  const [isCropComplete, setIsCropComplete] = useState(false);

  // Add drag state variables
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [isDraggingTop, setIsDraggingTop] = useState(false);
  const [isDraggingBottom, setIsDraggingBottom] = useState(false);
  const cropContainerRef = useRef(null);

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

  // Function to check if image is portrait (height > width)
  const isPortraitImage = (imageUrl, callback) => {
    const img = new Image();
    img.onload = () => {
      const isPortrait = img.height > img.width;
      callback(isPortrait, img.width, img.height);
    };
    img.src = imageUrl;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const imageUrl = fileReader.result;
        
        // Check if image is portrait
        isPortraitImage(imageUrl, (isPortrait, width, height) => {
          if (!isPortrait) {
            setError('Only portrait images (height > width) are allowed. Please upload a different image.');
            return;
          }
          
          // Clear any previous errors
          setError(null);
          
          // Set file and continue with upload
          setFile(selectedFile);
          setPreviewUrl(imageUrl);
          
          // Reset crop state
          setCompletedCrop(null);
          setCroppedImageUrl(null);
          setLeftCropPercentage(10);
          setRightCropPercentage(10);
          setTopCropPercentage(0);
          setBottomCropPercentage(0);
          setCropWidthPercentage(80);
          setCropHeightPercentage(100);
          
          // Show crop modal
          setShowCropModal(true);
          setShowPreviewModal(false);
          setIsCropComplete(false);
        });
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
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const imageUrl = fileReader.result;
        
        // Check if image is portrait
        isPortraitImage(imageUrl, (isPortrait, width, height) => {
          if (!isPortrait) {
            setError('Only portrait images (height > width) are allowed. Please upload a different image.');
            return;
          }
          
          // Clear any previous errors
          setError(null);
          
          // Set file and continue with upload
          setFile(droppedFile);
          setPreviewUrl(imageUrl);
          
          // Reset crop state
          setCompletedCrop(null);
          setCroppedImageUrl(null);
          setLeftCropPercentage(10);
          setRightCropPercentage(10);
          setTopCropPercentage(0);
          setBottomCropPercentage(0);
          setCropWidthPercentage(80);
          setCropHeightPercentage(100);
          
          // Show crop modal
          setShowCropModal(true);
          setShowPreviewModal(false);
          setIsCropComplete(false);
        });
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

  // Modify takePhoto to show crop modal instead of preview modal
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

    // Force portrait mode (height > width)
    if (canvasWidth > canvasHeight) {
      // Swap dimensions to ensure portrait orientation
      const temp = canvasWidth;
      canvasWidth = canvasHeight;
      canvasHeight = temp * 1.25; // Make it a bit taller for better composition
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

    // Check if the captured image is portrait
    isPortraitImage(photoDataUrl, (isPortrait, width, height) => {
      if (!isPortrait) {
        setError('Please hold your phone in portrait mode to take a photo.');
        stopCamera();
        return;
      }
      
      // Clear any previous errors
      setError(null);
      
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

        // Reset crop state
        setCompletedCrop(null);
        setCroppedImageUrl(null);
        setLeftCropPercentage(10);
        setRightCropPercentage(10);
        setTopCropPercentage(0);
        setBottomCropPercentage(0);
        setCropWidthPercentage(80);
        setCropHeightPercentage(100);
        
        // Show crop modal instead of preview modal
        setShowCropModal(true);
        setShowPreviewModal(false);
        setIsCropComplete(false);
      }, 'image/jpeg', 0.95); // High quality JPEG

      // Stop camera stream
      stopCamera();
    });
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
  
  // Generate cropped image function - update to work with full-size image and vertical cropping
  const generateCroppedImage = () => {
    if (!imgRef.current) return;
    
    const img = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Calculate crop dimensions based on the actual image dimensions
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    
    // Calculate actual pixels for crop based on percentages
    const leftOffset = Math.floor(imgWidth * (leftCropPercentage / 100));
    const rightOffset = Math.floor(imgWidth * (rightCropPercentage / 100));
    const topOffset = Math.floor(imgHeight * (topCropPercentage / 100));
    const bottomOffset = Math.floor(imgHeight * (bottomCropPercentage / 100));
    
    const croppedWidth = imgWidth - leftOffset - rightOffset;
    const croppedHeight = imgHeight - topOffset - bottomOffset;
    
    // Calculate the aspect ratio of the cropped area
    const croppedAspectRatio = croppedWidth / croppedHeight;
    
    console.log('Generating cropped image with dimensions:', {
      originalWidth: imgWidth,
      originalHeight: imgHeight,
      leftOffset,
      rightOffset,
      topOffset,
      bottomOffset,
      croppedWidth,
      croppedHeight,
      croppedAspectRatio,
      posterAspectRatio,
      percentages: {
        left: leftCropPercentage,
        right: rightCropPercentage,
        top: topCropPercentage,
        bottom: bottomCropPercentage,
        width: cropWidthPercentage,
        height: cropHeightPercentage
      }
    });
    
    // Set canvas dimensions to the cropped size - preserve exact dimensions
    canvas.width = croppedWidth;
    canvas.height = croppedHeight;
    
    // Draw the cropped portion to the canvas - from original image
    ctx.drawImage(
      img,
      leftOffset, topOffset, croppedWidth, croppedHeight,
      0, 0, croppedWidth, croppedHeight
    );
    
    // Store crop data for proper processing later
    const newCropData = {
      leftPercentage: leftCropPercentage,
      rightPercentage: rightCropPercentage,
      topPercentage: topCropPercentage,
      bottomPercentage: bottomCropPercentage,
      widthPercentage: cropWidthPercentage,
      heightPercentage: cropHeightPercentage,
      originalWidth: imgWidth,
      originalHeight: imgHeight,
      croppedWidth: croppedWidth,
      croppedHeight: croppedHeight,
      sourceX: leftOffset,
      sourceY: topOffset,
      aspectRatio: croppedWidth / croppedHeight
    };
    setCropData(newCropData);
    console.log('Stored crop data:', newCropData);
    
    // Convert canvas to blob with high quality
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create blob');
        return;
      }
      
      // Create URL from blob
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl); // Clean up previous URL
      }
      const newCroppedUrl = URL.createObjectURL(blob);
      setCroppedImageUrl(newCroppedUrl);
      
      // Store the crop details for later use
      setCompletedCrop({
        x: leftOffset,
        y: topOffset,
        width: croppedWidth,
        height: croppedHeight,
        unit: 'px'
      });
      
      // Create a proper File object with explicit type for better handling
      const croppedFile = new File([blob], file ? file.name : 'cropped-image.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      console.log('Created cropped file:', croppedFile.name, 'size:', croppedFile.size);
      
      // Set the cropped file as the main file
      setFile(croppedFile);
      
      setIsCropComplete(true);
      
    }, 'image/jpeg', 0.95); // Use high quality JPEG
  };

  // Update the preview modal to show the exact cropped image
  const handleCompleteCrop = () => {
    if (croppedImageUrl) {
      // Generate a final high-quality version
      generateCroppedImage();
      
      // Close crop modal and show preview modal
      setTimeout(() => {
        setShowCropModal(false);
        setShowPreviewModal(true);
      }, 100);
    } else {
      // If no cropped image yet, generate it first
      generateCroppedImage();
      setTimeout(() => {
        setShowCropModal(false);
        setShowPreviewModal(true);
      }, 200);
    }
  };

  // Function to get cropped file for processing
  const getCroppedFile = async () => {
    // With our new approach, the main file is already updated to be the cropped version
    console.log('Using already cropped file:', file ? file.name : 'unknown');
    return file;
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
      console.log('Has cropped image URL:', !!croppedImageUrl);

      // Use cropped image URL directly if it exists, convert to File if needed
      let fileToProcess = imageFile;
      if (croppedImageUrl && typeof croppedImageUrl === 'string' && croppedImageUrl.startsWith('blob:')) {
        try {
          console.log('Using cropped image URL for processing:', croppedImageUrl);
          const response = await fetch(croppedImageUrl);
          const blob = await response.blob();
          fileToProcess = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
          console.log('Created file from cropped image URL:', fileToProcess.name, 'size:', fileToProcess.size);
        } catch (err) {
          console.error('Failed to use cropped image URL:', err);
        }
      }

      // Get API key from environment or use fallback
      const segmindApiKey = process.env.REACT_APP_SEGMIND_API_KEY || 'SG_13f9868f102f0d83';

      // Check if imageFile is valid
      if (!fileToProcess || !(fileToProcess instanceof File)) {
        console.error('Invalid image file for background removal:', fileToProcess);
        throw new Error('Invalid image file');
      }

      // Convert the file to base64 for API
      let base64Image;
      try {
        base64Image = await fileToBase64(fileToProcess);
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
        formData.append('file', fileToProcess);
        
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
      return croppedImageUrl || previewUrl;
      
    } catch (error) {
      console.error('Fatal error in background removal process:', error);
      setLoadingProgress(100);
      return croppedImageUrl || previewUrl; // Return cropped image or original image as last resort
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
      setShowPreviewModal(false);
      setShowProcessingModal(true);
      setIsLoading(true);
      setLoadingProgress(0);

      // Get the cropped file for processing (or original if no crop)
      const fileToProcess = await getCroppedFile();
      console.log('Processing file:', fileToProcess.name, 'size:', fileToProcess.size, 
                 'Original file size:', file.size,
                 'Using cropped image:', fileToProcess.size !== file.size,
                 'Crop mode used:', cropMode);

      // Simulate initial loading progress
      simulateProgressDuringProcessing(0, 10, 1000, setLoadingProgress);

      let processedImageUrl = croppedImageUrl || previewUrl;

      // Normal selfie flow - first remove background
      setProcessingStep('Processing your photo...');
      simulateProgressDuringProcessing(10, 50, 2000, setLoadingProgress);

      try {
        // Remove the background
        console.log('Starting background removal with file:', fileToProcess.name);
        processedImageUrl = await removeImageBackground(fileToProcess);
        console.log('Background removal completed, result URL length:', processedImageUrl?.length);

        // If the result is the same as the original preview URL, it means background removal failed
        if (processedImageUrl === (croppedImageUrl || previewUrl)) {
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
        // Continue with the cropped image or original if no crop
        processedImageUrl = croppedImageUrl || previewUrl;
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
      console.log('Handling continue with final image:', finalImage);
      // Get user data from previous steps or use default values
      const industry = sessionStorage.getItem('industry') || 'other';
      
      const userData = {
        name: sessionStorage.getItem('userName') || 'Your Name',
        companyName: sessionStorage.getItem('companyName') || 'Your Company',
        industry: industry, // Pass industry directly
        tagline: sessionStorage.getItem('tagline') || 'Your Tagline',
        phoneNumber: sessionStorage.getItem('phoneNumber') || 'Your Phone',
        isNormalSelfie: isNormalSelfie, // Add the flag to indicate if this is a normal selfie
        isSelfieMode: isSelfieMode, // Add the flag to indicate if this is a selfie mode
        cropData: cropData // Store crop data for proper image processing on poster
      }

      // Log industry value for debugging
      console.log('Industry value being set:', industry);
      console.log('Final image type:', typeof finalImage);
      console.log('Crop data being stored:', cropData);
      
      // Make sure we have the final image URL (either processed or cropped)
      const finalImageUrl = finalImage || processedImage || croppedImageUrl || previewUrl;
      console.log('Final image URL that will be stored:', finalImageUrl);

      // Store data in session storage
      sessionStorage.setItem('userData', JSON.stringify(userData));
      sessionStorage.setItem('processedImage', finalImageUrl);
      // Store crop data separately for easier access
      sessionStorage.setItem('cropData', JSON.stringify(cropData));
      console.log('Stored processed image and crop data in session storage');

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

  // Add a style tag to forcefully override logo size and add crop styles
  useEffect(() => {
    // Create style element for general styles
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .forced-small-logo {
        max-width: 230px !important;
        width: 230px !important;
      }

      .logo-container-fix {
        top: 45px !important;
      }
      
      /* Custom crop styles */
      .crop-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 10px;
        width: 100%;
        max-width: 100%;
      }
      
      .crop-instructions {
        background-color: rgba(0, 131, 181, 0.1);
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 15px;
        width: 100%;
        text-align: center;
      }
      
      .crop-instruction-text {
        color: #0083B5;
        font-weight: bold;
      }
      
      /* Full-size image cropper */
      .flexible-cropper-container {
        position: relative;
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
        overflow: hidden;
      }
      
      .cropper-img-container {
        position: relative;
        margin: 0 auto;
        overflow: auto; /* Allow scrolling for large images */
        max-height: 65vh; /* Increased from 60vh for more visible area */
        border: 1px solid #ddd;
        touch-action: pan-y; /* Allow vertical scrolling, but handle horizontal touches */
        display: flex;
        justify-content: center; /* Center the image horizontally */
      }
      
      .cropper-img {
        max-width: 100%; /* Make sure image doesn't exceed container width */
        max-height: 65vh; /* Make sure image doesn't exceed container height */
        height: auto;
        display: block;
        object-fit: contain; /* Maintain aspect ratio */
      }
      
      /* For portrait images */
      @media (min-width: 768px) {
        /* On desktop, limit width for portrait images to avoid excessive size */
        .cropper-img-container {
          max-width: 70%;
          margin: 0 auto;
        }
      }
      
      /* For mobile, ensure image doesn't overflow */
      @media (max-width: 767px) {
        .cropper-img-container {
          max-height: 55vh;
        }
        
        .cropper-img {
          max-height: 55vh;
        }
      }
      
      .crop-area {
        position: absolute;
        background-color: rgba(0, 131, 181, 0.2); /* Light blue tint for crop area */
        border-left: 4px dashed #FFC107;
        border-right: 4px dashed #FFC107;
        pointer-events: none; /* Don't interfere with interactions */
        z-index: 8;
      }
      
      .crop-overlay {
        position: absolute;
        background-color: rgba(0, 0, 0, 0.6); /* Darker overlay for better visibility */
        pointer-events: none;
      }
      
      .left-overlay {
        left: 0;
        top: 0;
        bottom: 0;
        width: 10%; /* Default width */
      }
      
      .right-overlay {
        right: 0;
        top: 0;
        bottom: 0;
        width: 10%; /* Default width */
      }
      
      .top-overlay {
        top: 0;
        left: 10%; /* Match left overlay width */
        right: 10%; /* Match right overlay width */
        height: 0%; /* Default height */
        z-index: 7;
      }
      
      .bottom-overlay {
        bottom: 0;
        left: 10%; /* Match left overlay width */
        right: 10%; /* Match right overlay width */
        height: 0%; /* Default height */
        z-index: 7;
      }
      
      .crop-line {
        position: absolute;
        background-color: transparent;
        z-index: 9;
        touch-action: none; /* Prevent default touch actions */
      }
      
      .left-line, .right-line {
        top: 0;
        bottom: 0;
        width: 20px; /* Wider area for touch/mouse interaction */
        cursor: ew-resize;
      }
      
      .top-line, .bottom-line {
        left: 10%; /* Match left overlay width */
        right: 10%; /* Match right overlay width */
        height: 20px; /* Wider area for touch/mouse interaction */
        cursor: ns-resize;
        z-index: 10; /* Higher than side lines */
      }
      
      .left-line {
        left: 10%; /* Match left overlay width */
      }
      
      .right-line {
        right: 10%; /* Match right overlay width */
      }
      
      .top-line {
        top: 0%;
        border-top: 4px dashed #FFC107;
      }
      
      .bottom-line {
        bottom: 0%;
        border-bottom: 4px dashed #FFC107;
      }
      
      .crop-dimensions-display {
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 131, 181, 0.9);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 14px;
        z-index: 11;
        text-align: center;
      }
      
      /* Preview styles */
      .cropper-preview {
        margin-top: 20px;
        background-color: #f8f8f8;
        border-radius: 8px;
        padding: 15px;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .cropper-preview h3 {
        margin-top: 0;
        margin-bottom: 10px;
        color: #0083B5;
      }
      
      .cropper-preview img {
        border: 2px solid #0083B5;
        border-radius: 8px;
        max-width: 100%;
        max-height: 200px;
        object-fit: contain;
      }
      
      /* Fix preview modal size */
      .preview-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        overflow: auto;
        padding: 20px;
      }
      
      .preview-modal {
        background-color: white;
        border-radius: 8px;
        max-width: 600px;
        width: 90%;
        height: auto;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        z-index: 1001;
      }
      
      .preview-modal-header {
        padding: 15px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .preview-modal-header h2 {
        margin: 0;
        font-size: 18px;
        color: #0083B5;
      }
      
      .modal-close-btn {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #666;
      }
      
      .preview-modal-body {
        max-height: 60vh;
        overflow-y: auto;
        padding: 15px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .preview-modal-image {
        width: 100%;
        max-width: 100%;
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .preview-modal-footer {
        padding: 15px;
        border-top: 1px solid #eee;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .preview-question {
        margin: 0 0 15px 0;
        font-size: 16px;
        font-weight: 500;
        color: #333;
        text-align: center;
      }
      
      .preview-modal-buttons {
        display: flex;
        justify-content: center;
        gap: 10px;
        width: 100%;
      }
      
      .retake-btn, .confirm-btn {
        padding: 10px 20px;
        border-radius: 4px;
        border: none;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      .retake-btn {
        background-color: #f5f5f5;
        color: #333;
      }
      
      .confirm-btn {
        background-color: #0083B5;
        color: white;
      }
      
      /* Mobile adjustments */
      @media (max-width: 768px) {
        .preview-modal {
          width: 95%;
          height: auto;
          max-height: 95vh;
        }
        
        .preview-modal-body {
          max-height: 55vh;
          padding: 10px;
        }
        
        .preview-modal-buttons {
          flex-direction: column;
          width: 100%;
        }
        
        .retake-btn, .confirm-btn {
          width: 100%;
          justify-content: center;
        }
      }
      
      /* Portrait note styling */
      .portrait-note {
        color: #0083B5;
        font-size: 13px;
        margin: 5px 0;
        font-weight: 500;
      }
      
      .portrait-note i {
        margin-right: 5px;
      }
    `;
    
    // Add to document head
    document.head.appendChild(styleEl);
    
    // Cleanup on component unmount
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Define the handleMouseDown function in component scope
  const handleMouseDown = (e, side) => {
    e.preventDefault();
    if (side === 'left') {
      setIsDraggingLeft(true);
    } else if (side === 'right') {
      setIsDraggingRight(true);
    } else if (side === 'top') {
      setIsDraggingTop(true);
    } else if (side === 'bottom') {
      setIsDraggingBottom(true);
    }
  };

  // Add mouse and touch event handlers for dragging crop lines
  useEffect(() => {
    // Mouse/touch event handlers for crop lines
    // handleMouseDown moved to component scope
    
    const handleMouseMove = (e) => {
      if (!isDraggingLeft && !isDraggingRight && !isDraggingTop && !isDraggingBottom) return;
      if (!cropContainerRef.current) return;

      const container = cropContainerRef.current;
      const rect = container.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      
      // Get the image dimensions
      const imgWidth = imgRef.current.naturalWidth;
      const imgHeight = imgRef.current.naturalHeight;
      const containerAspectRatio = containerWidth / containerHeight;
      const imageAspectRatio = imgWidth / imgHeight;
      
      // For horizontal handles
      if (isDraggingLeft || isDraggingRight) {
        // Calculate the mouse position relative to the container as a percentage
        // For touch events, use the first touch point
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let positionX = (clientX - rect.left) / containerWidth * 100;
        
        // Clamp position between 0 and 100
        positionX = Math.max(0, Math.min(100, positionX));
        
        if (isDraggingLeft) {
          // Ensure we don't crop too much (keep at least 20% width)
          if (positionX + rightCropPercentage <= 80) {
            setLeftCropPercentage(positionX);
            
            // Adjust top and bottom to maintain aspect ratio
            if (showFixedRatioBox) {
              // Calculate new width percentage
              const newWidthPercentage = 100 - positionX - rightCropPercentage;
              
              // Calculate new height required to maintain the poster aspect ratio
              const newHeightPercentage = (newWidthPercentage / posterAspectRatio) * (imageAspectRatio);
              
              // Calculate how much to crop from top and bottom (evenly)
              const totalHeightToCrop = 100 - newHeightPercentage;
              const topBottomCrop = totalHeightToCrop / 2;
              
              // Update top and bottom crop percentages
              if (topBottomCrop >= 0 && topBottomCrop <= 40) {
                setTopCropPercentage(topBottomCrop);
                setBottomCropPercentage(topBottomCrop);
              }
            }
          }
        } else if (isDraggingRight) {
          // Convert to right crop percentage (from right edge)
          const rightPos = 100 - positionX;
          // Ensure we don't crop too much (keep at least 20% width)
          if (leftCropPercentage + rightPos <= 80) {
            setRightCropPercentage(rightPos);
            
            // Adjust top and bottom to maintain aspect ratio
            if (showFixedRatioBox) {
              // Calculate new width percentage
              const newWidthPercentage = 100 - leftCropPercentage - rightPos;
              
              // Calculate new height required to maintain the poster aspect ratio
              const newHeightPercentage = (newWidthPercentage / posterAspectRatio) * (imageAspectRatio);
              
              // Calculate how much to crop from top and bottom (evenly)
              const totalHeightToCrop = 100 - newHeightPercentage;
              const topBottomCrop = totalHeightToCrop / 2;
              
              // Update top and bottom crop percentages
              if (topBottomCrop >= 0 && topBottomCrop <= 40) {
                setTopCropPercentage(topBottomCrop);
                setBottomCropPercentage(topBottomCrop);
              }
            }
          }
        }
      }
      
      // For vertical handles
      if (isDraggingTop || isDraggingBottom) {
        // Calculate the mouse position relative to the container as a percentage
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        let positionY = (clientY - rect.top) / containerHeight * 100;
        
        // Clamp position between 0 and 100
        positionY = Math.max(0, Math.min(100, positionY));
        
        if (isDraggingTop) {
          // Ensure we don't crop too much (keep at least 20% height)
          if (positionY + bottomCropPercentage <= 80) {
            setTopCropPercentage(positionY);
            
            // Adjust left and right to maintain aspect ratio
            if (showFixedRatioBox) {
              // Calculate new height percentage
              const newHeightPercentage = 100 - positionY - bottomCropPercentage;
              
              // Calculate new width required to maintain the poster aspect ratio
              const newWidthPercentage = (newHeightPercentage * posterAspectRatio) / (imageAspectRatio);
              
              // Calculate how much to crop from left and right (evenly)
              const totalWidthToCrop = 100 - newWidthPercentage;
              const leftRightCrop = totalWidthToCrop / 2;
              
              // Update left and right crop percentages
              if (leftRightCrop >= 0 && leftRightCrop <= 40) {
                setLeftCropPercentage(leftRightCrop);
                setRightCropPercentage(leftRightCrop);
              }
            }
          }
        } else if (isDraggingBottom) {
          // Convert to bottom crop percentage (from bottom edge)
          const bottomPos = 100 - positionY;
          // Ensure we don't crop too much (keep at least 20% height)
          if (topCropPercentage + bottomPos <= 80) {
            setBottomCropPercentage(bottomPos);
            
            // Adjust left and right to maintain aspect ratio
            if (showFixedRatioBox) {
              // Calculate new height percentage
              const newHeightPercentage = 100 - topCropPercentage - bottomPos;
              
              // Calculate new width required to maintain the poster aspect ratio
              const newWidthPercentage = (newHeightPercentage * posterAspectRatio) / (imageAspectRatio);
              
              // Calculate how much to crop from left and right (evenly)
              const totalWidthToCrop = 100 - newWidthPercentage;
              const leftRightCrop = totalWidthToCrop / 2;
              
              // Update left and right crop percentages
              if (leftRightCrop >= 0 && leftRightCrop <= 40) {
                setLeftCropPercentage(leftRightCrop);
                setRightCropPercentage(leftRightCrop);
              }
            }
          }
        }
      }
    };

    const handleMouseUp = () => {
      if (isDraggingLeft || isDraggingRight || isDraggingTop || isDraggingBottom) {
        setIsDraggingLeft(false);
        setIsDraggingRight(false);
        setIsDraggingTop(false);
        setIsDraggingBottom(false);
        // Generate the cropped image when drag ends
        generateCroppedImage();
      }
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);
    document.addEventListener('touchcancel', handleMouseUp);

    return () => {
      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
      document.removeEventListener('touchcancel', handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight, isDraggingTop, isDraggingBottom, leftCropPercentage, rightCropPercentage, topCropPercentage, bottomCropPercentage]);

  // Update crop percentages whenever crop edges change
  useEffect(() => {
    const newWidthPercentage = 100 - leftCropPercentage - rightCropPercentage;
    setCropWidthPercentage(newWidthPercentage);
    
    const newHeightPercentage = 100 - topCropPercentage - bottomCropPercentage;
    setCropHeightPercentage(newHeightPercentage);
    
    // Generate new cropped image whenever crop percentages change
    if (imgRef.current) {
      generateCroppedImage();
    }
  }, [leftCropPercentage, rightCropPercentage, topCropPercentage, bottomCropPercentage]);

  // Add a function to handle initial image loading and set up
  const handleImageLoad = () => {
    if (!imgRef.current) return;
    
    const img = imgRef.current;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    
    // Calculate container dimensions
    const container = cropContainerRef.current;
    if (!container) return;
    
    const containerWidth = container.clientWidth;
    
    // Calculate the image's display size (how it appears in the UI)
    const displayWidth = containerWidth; // Image width is set to 100% of container
    const displayHeight = (imgHeight / imgWidth) * displayWidth;
    
    console.log('Image loaded with dimensions:', imgWidth, 'x', imgHeight, 
               'Display size:', displayWidth, 'x', displayHeight,
               'Aspect ratio:', imgHeight / imgWidth);
    
    // For portrait images, determine optimal crop sides
    // Set initial crop to match poster aspect ratio - this ensures what you see is what you get
    // Poster has width:height ratio of approximately 0.56 (9:16)
    
    // Calculate the crop percentages to match the poster's fixed dimensions
    const targetAspectRatio = posterAspectRatio; // width/height
    const imgAspectRatio = imgWidth / imgHeight;
    
    let leftRightCropPercentage = 10; // Default
    let topBottomCropPercentage = 0; // Default
    
    // If image is more portrait than the poster (narrower)
    if (imgAspectRatio < targetAspectRatio) {
      // Need to crop from top and bottom to match poster ratio
      const targetHeight = imgWidth / targetAspectRatio;
      const heightDiff = imgHeight - targetHeight;
      topBottomCropPercentage = (heightDiff / imgHeight) * 50; // Divide by 2 and convert to percentage
      leftRightCropPercentage = 0; // No need to crop sides
    } 
    // If image is less portrait than the poster (wider)
    else {
      // Need to crop from sides to match poster ratio
      const targetWidth = imgHeight * targetAspectRatio;
      const widthDiff = imgWidth - targetWidth;
      leftRightCropPercentage = (widthDiff / imgWidth) * 50; // Divide by 2 and convert to percentage
      topBottomCropPercentage = 0; // No need to crop top/bottom
    }
    
    // Set initial crop values to match poster dimensions
    setLeftCropPercentage(leftRightCropPercentage);
    setRightCropPercentage(leftRightCropPercentage);
    setTopCropPercentage(topBottomCropPercentage);
    setBottomCropPercentage(topBottomCropPercentage);
    
    // Generate initial crop
    setTimeout(() => {
      generateCroppedImage();
    }, 100);
  };

  // Add new state to track poster aspect ratio
  const [posterAspectRatio, setPosterAspectRatio] = useState(0.56); // 9:16 aspect ratio (width/height)
  const [showFixedRatioBox, setShowFixedRatioBox] = useState(true);

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

            {/* SWAPPED: Form container comes before DOS2 image */}
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
                  <p className="portrait-note"><i className="fas fa-info-circle"></i> Only portrait images (taller than wide) are accepted</p>
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

            {/* DOS2 image now after form container */}
            <div className="left-dos-container">
              <img
                src="/images/uploadphoto/Dos2.png"
                alt="Do's 2"
                className="left-dos-image"
              />
            </div>
            
            {/* NEW: Added DOS1 image after DOS2 */}
            <div className="left-dos1-container">
              <img
                src="/images/uploadphoto/dos1.png"
                alt="Do's 1"
                className="left-dos-image"
              />
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
                        <p className="portrait-note"><i className="fas fa-info-circle"></i> Only portrait images (taller than wide) are accepted</p>
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

      {/* Cropping Modal */}
      {showCropModal && (
        <div className="preview-modal-overlay">
          <div className="preview-modal">
            <div className="preview-modal-header">
              <h2>Crop Your Image</h2>
              <div className="fixed-ratio-toggle">
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={showFixedRatioBox}
                    onChange={() => setShowFixedRatioBox(!showFixedRatioBox)}
                  />
                  <span className="slider round"></span>
                </label>
                <span className="toggle-label">Lock poster proportions</span>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowCropModal(false);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Flexible cropping UI with draggable lines */}
            <div className="preview-modal-body">
              <div className="preview-modal-image crop-container">
                <div className="crop-instructions">
                  <div className="crop-instruction-text">
                    <i className="fas fa-crop-alt"></i> Drag the dotted lines to adjust the crop area
                  </div>
                </div>
                
                <div className="flexible-cropper-container">
                  <div 
                    className="cropper-img-container"
                    ref={cropContainerRef}
                  >
                    <img 
                      ref={imgRef}
                      src={previewUrl} 
                      alt="Upload preview" 
                      className="cropper-img"
                      onLoad={handleImageLoad}
                    />
                    
                    {/* Left dark overlay */}
                    <div 
                      className="crop-overlay left-overlay" 
                      style={{width: `${leftCropPercentage}%`}}
                    ></div>
                    
                    {/* Right dark overlay */}
                    <div 
                      className="crop-overlay right-overlay" 
                      style={{width: `${rightCropPercentage}%`}}
                    ></div>
                    
                    {/* Top dark overlay */}
                    <div 
                      className="crop-overlay top-overlay" 
                      style={{
                        height: `${topCropPercentage}%`, 
                        left: `${leftCropPercentage}%`, 
                        right: `${rightCropPercentage}%`,
                        top: 0
                      }}
                    ></div>
                    
                    {/* Bottom dark overlay */}
                    <div 
                      className="crop-overlay bottom-overlay" 
                      style={{
                        height: `${bottomCropPercentage}%`, 
                        left: `${leftCropPercentage}%`, 
                        right: `${rightCropPercentage}%`,
                        bottom: 0
                      }}
                    ></div>
                    
                    {/* Highlighted crop area */}
                    <div 
                      className="crop-area"
                      style={{
                        left: `${leftCropPercentage}%`,
                        right: `${rightCropPercentage}%`,
                        top: `${topCropPercentage}%`,
                        bottom: `${bottomCropPercentage}%`
                      }}
                    ></div>
                    
                    {/* Poster frame guide overlay - shows the exact dimensions that will be used in final poster */}
                    {showFixedRatioBox && (
                      <div 
                        className="poster-frame-guide"
                        style={{
                          left: `${leftCropPercentage}%`,
                          right: `${rightCropPercentage}%`,
                          top: `${topCropPercentage}%`,
                          bottom: `${bottomCropPercentage}%`
                        }}
                      >
                        <div className="poster-frame-label">
                          <i className="fas fa-info-circle"></i> This is how your image will appear in the poster
                        </div>
                      </div>
                    )}

                    {/* Left draggable line */}
                    <div 
                      className="crop-line left-line"
                      style={{left: `${leftCropPercentage}%`}}
                      onMouseDown={(e) => handleMouseDown(e, 'left')}
                      onTouchStart={(e) => handleMouseDown(e, 'left')}
                    ></div>
                    
                    {/* Right draggable line */}
                    <div 
                      className="crop-line right-line"
                      style={{right: `${rightCropPercentage}%`}}
                      onMouseDown={(e) => handleMouseDown(e, 'right')}
                      onTouchStart={(e) => handleMouseDown(e, 'right')}
                    ></div>
                    
                    {/* Top draggable line */}
                    <div 
                      className="crop-line top-line"
                      style={{
                        top: `${topCropPercentage}%`,
                        left: `${leftCropPercentage}%`,
                        right: `${rightCropPercentage}%`
                      }}
                      onMouseDown={(e) => handleMouseDown(e, 'top')}
                      onTouchStart={(e) => handleMouseDown(e, 'top')}
                    ></div>
                    
                    {/* Bottom draggable line */}
                    <div 
                      className="crop-line bottom-line"
                      style={{
                        bottom: `${bottomCropPercentage}%`,
                        left: `${leftCropPercentage}%`,
                        right: `${rightCropPercentage}%`
                      }}
                      onMouseDown={(e) => handleMouseDown(e, 'bottom')}
                      onTouchStart={(e) => handleMouseDown(e, 'bottom')}
                    ></div>
                    
                    {/* Dimensions display */}
                    <div className="crop-dimensions-display">
                      <div>Width: {cropWidthPercentage.toFixed(1)}%</div>
                      <div>Height: {cropHeightPercentage.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="preview-modal-footer">
              <div className="preview-modal-buttons">
                <button
                  className="retake-btn"
                  onClick={() => {
                    setShowCropModal(false);
                    setPreviewUrl(null);
                    setFile(null);
                    setCroppedImageUrl(null);
                  }}
                >
                  <i className="fas fa-redo-alt"></i> Choose another
                </button>
                <button
                  className="confirm-btn"
                  onClick={handleCompleteCrop}
                >
                  <i className="fas fa-check"></i> Apply Crop
                </button>
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
              <h2>Image Preview</h2>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowPreviewModal(false);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="preview-modal-body">
              <div className="preview-modal-image">
                <div style={{maxWidth: '500px', margin: '0 auto', textAlign: 'center'}}>
                  {/* Display the cropped image preview with exact width preservation */}
                  <img 
                    src={croppedImageUrl || previewUrl} 
                    alt="Preview" 
                    style={{
                      width: 'auto',
                      height: 'auto',
                      maxWidth: '100%',
                      maxHeight: '500px', 
                      border: '2px solid #0083B5',
                      borderRadius: '4px',
                      margin: '10px 0',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                      objectFit: 'contain'
                    }}
                  />
                  
                  <div style={{
                    backgroundColor: 'rgba(0, 131, 181, 0.1)',
                    borderRadius: '8px',
                    padding: '10px',
                    marginTop: '15px',
                    marginBottom: '10px'
                  }}>
                    <p style={{color: '#0083B5', margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '14px'}}>
                      <i className="fas fa-info-circle"></i> Width: {cropWidthPercentage.toFixed(1)}% of original image
                    </p>
                    <p style={{color: '#0083B5', margin: '0', fontWeight: 'bold', fontSize: '14px'}}>
                      <i className="fas fa-info-circle"></i> Height: {cropHeightPercentage.toFixed(1)}% of original image
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="preview-modal-footer">
              <p className="preview-question">Use this image for your poster?</p>
              <div className="preview-modal-buttons">
                <button
                  className="retake-btn"
                  onClick={() => {
                    setShowPreviewModal(false);
                    setShowCropModal(true);
                  }}
                >
                  <i className="fas fa-crop-alt"></i> Adjust Crop
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