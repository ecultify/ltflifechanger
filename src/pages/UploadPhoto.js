import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/pages/UploadPhoto.css';
import '../styles/pages/StepColorOverrides.css';
import '../styles/components/FixedStepper.css';
import '../styles/pages/UploadPhotoOverrides.css';
import '../styles/pages/UploadStepperFix.css'; // Added for stepper alignment on mobile
import axios from 'axios';
import Loader from '../components/Loader';
import ReactCrop, { centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
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
  const [isSelfieMode, setIsSelfieMode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Add poster aspect ratio first, before any other state references it
  const [posterAspectRatio] = useState(0.56); // 9:16 aspect ratio (width/height)

  // Add state variables for React Crop
  const [crop, setCrop] = useState();
  const [aspect, setAspect] = useState(posterAspectRatio); // Now posterAspectRatio is defined first
  const [completedCrop, setCompletedCrop] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [isCropComplete, setIsCropComplete] = useState(false);
  const [useFixedAspectRatio, setUseFixedAspectRatio] = useState(true);
  const [originalImageDimensions, setOriginalImageDimensions] = useState({ width: 0, height: 0 });
  const [imageOrientation, setImageOrientation] = useState('portrait'); // 'portrait' or 'landscape'
  const [showCropModal, setShowCropModal] = useState(false);
  const [showFixedRatioBox] = useState(true);
  const [cropData, setCropData] = useState(null);

  // Add showCameraModal state
  const [showCameraModal, setShowCameraModal] = useState(false);

  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionRef = useRef(null);
  const navigate = useNavigate();
  
  console.log('Current device width:', window.innerWidth, 'Is Mobile:', window.innerWidth <= 768);

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

  // Function to check if image is portrait or landscape
  const detectImageOrientation = (imageUrl, callback) => {
    const img = new Image();
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const orientation = height > width ? 'portrait' : 'landscape';
      setOriginalImageDimensions({ width, height });
      setImageOrientation(orientation);
      
      // If it's a callback, return the data
      if (callback) callback(orientation, width, height);
    };
    img.src = imageUrl;
  };

  // Helper function for creating the initial crop based on image dimensions
  const centerAspectCrop = (mediaWidth, mediaHeight, aspect) => {
    // If the image is landscape and we want a portrait crop
    if (mediaWidth > mediaHeight && aspect < 1) {
      // Create a square crop centered on the image if image is landscape
      return centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: (mediaHeight / mediaWidth) * 100 * aspect, // Makes the crop width match the aspect ratio
          },
          aspect,
          mediaWidth,
          mediaHeight
        ),
        mediaWidth,
        mediaHeight
      );
    }
    
    // If image is portrait or square, create a centered crop
    return centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90, // Start with a crop that's 90% of the image width
        },
        aspect,
        mediaWidth,
        mediaHeight
      ),
      mediaWidth,
      mediaHeight
    );
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    
    if (!selectedFile) {
      return;
    }
    
    if (!isValidImageFile(selectedFile)) {
      setError('Please upload a valid image file (JPG, JPEG, PNG).');
      return;
    }
    
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      setPreviewUrl(imageUrl);
      
      // Reset crop state
      setCrop(undefined);
      setCompletedCrop(null);
      setCroppedImageUrl(null);
      setIsCropComplete(false);
      
      // Show crop modal
      setShowCropModal(true);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const imageUrl = fileReader.result;
        
        // Detect orientation and set up initial crop
        detectImageOrientation(imageUrl, (orientation) => {
          // Clear any previous errors
          setError(null);
          
          // Set file and continue with upload
          setFile(droppedFile);
          setPreviewUrl(imageUrl);
          
          // Reset crop state
          setCompletedCrop(null);
          setCroppedImageUrl(null);
          
          // Show crop modal
          setShowCropModal(true);
          setShowPreviewModal(false);
          setIsCropComplete(false);
        });
      };
      fileReader.readAsDataURL(droppedFile);
    }
  };

  // Reset crop to center when the aspect ratio changes
  useEffect(() => {
    if (imgRef.current && previewUrl) {
      const { width, height } = imgRef.current;
      const newAspect = useFixedAspectRatio ? 9 / 16 : undefined;
      
      if (width && height) {
        if (newAspect) {
          // Create a centered crop with the new aspect ratio
          const newCrop = centerAspectCrop(width, height, newAspect);
          setCrop(newCrop);
        } else {
          // For free-form cropping, start with a reasonably sized crop
          setCrop({
            unit: '%',
            width: 80,
            height: 80,
            x: 10,
            y: 10
          });
        }
      }
    }
  }, [useFixedAspectRatio, previewUrl]);

  // This is to initialize the crop when an image is loaded
  const onImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    
    // Calculate initial crop based on the aspect ratio
    if (aspect) {
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 80, // Start with 80% of the width
          },
          aspect,
          naturalWidth,
          naturalHeight
        ),
        naturalWidth,
        naturalHeight
      );
      
      setCrop(crop);
      
      // Generate the initial cropped image
      setCompletedCrop(crop);
      generateCroppedImage(crop);
    }
  };

  // Generate cropped image whenever crop changes
  const generateCroppedImage = (crop) => {
    if (!imgRef.current || !crop || !crop.width || !crop.height) return;
    
    const img = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    
    // Use the original dimensions and account for scaling
    const pixelCrop = {
      x: crop.x * scaleX,
      y: crop.y * scaleY,
      width: crop.width * scaleX,
      height: crop.height * scaleY,
    };
    
    // Set canvas dimensions to match the cropped area
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    
    // Draw the cropped portion to the canvas
    ctx.drawImage(
      img,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
    
    // Store crop data for proper processing later
    const newCropData = {
      originalWidth: img.naturalWidth,
      originalHeight: img.naturalHeight,
      croppedWidth: pixelCrop.width,
      croppedHeight: pixelCrop.height,
      sourceX: pixelCrop.x,
      sourceY: pixelCrop.y,
      aspectRatio: pixelCrop.width / pixelCrop.height,
      // Add percentage values for more reliable cropping
      widthPercentage: (pixelCrop.width / img.naturalWidth) * 100,
      heightPercentage: (pixelCrop.height / img.naturalHeight) * 100,
      leftPercentage: (pixelCrop.x / img.naturalWidth) * 100,
      topPercentage: (pixelCrop.y / img.naturalHeight) * 100,
      // Add flag to prevent automatic height scaling
      preserveExactCrop: true,
      // Force display mode to 'contain' to show the entire cropped area
      objectFit: "contain",
      // Set position to ensure image is visible and aligned
      objectPosition: "left bottom",
      // Add clear metadata about the crop for debugging
      cropInfo: {
        originalImageWidth: img.width,
        originalImageHeight: img.height, 
        displayCropX: crop.x,
        displayCropY: crop.y,
        displayCropWidth: crop.width,
        displayCropHeight: crop.height,
        cropUnit: crop.unit || '%',
        // Add additional debug info
        pixelCropX: pixelCrop.x,
        pixelCropY: pixelCrop.y,
        pixelCropWidth: pixelCrop.width,
        pixelCropHeight: pixelCrop.height,
        imageNaturalWidth: img.naturalWidth,
        imageNaturalHeight: img.naturalHeight,
        scaleFactorX: scaleX,
        scaleFactorY: scaleY
      }
    };
    console.log('Generated crop data:', newCropData);
    setCropData(newCropData);
    
    // Convert to high-quality JPEG blob
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create blob');
        return;
      }
      
      // Create URL for preview
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl);
      }
      const newCroppedUrl = URL.createObjectURL(blob);
      setCroppedImageUrl(newCroppedUrl);
      
      // Create a File object for the cropped image
      const croppedFile = new File([blob], file ? file.name : 'cropped-image.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      // Update the file state with the cropped version
      setFile(croppedFile);
      setIsCropComplete(true);
      
    }, 'image/jpeg', 0.95); // High quality JPEG
  };

  // Handle crop changes
  const handleCropChange = (newCrop) => {
    setCrop(newCrop);
    // Update preview in real-time for better visual feedback
    if (newCrop.width && newCrop.height) {
      generateCroppedImage(newCrop);
    }
  };

  // Handle crop complete - when user stops dragging
  const handleCropComplete = (crop, pixelCrop) => {
    setCompletedCrop(pixelCrop);
    generateCroppedImage(pixelCrop);
  };

  // Handle completing the crop and moving to preview
  const handleCompleteCrop = () => {
    if (completedCrop) {
      // Make sure we have the final cropped image
      generateCroppedImage(completedCrop);
      
      // Close crop modal and show preview
      setTimeout(() => {
        setShowCropModal(false);
        setShowPreviewModal(true);
      }, 100);
    } else {
      // If no crop is completed yet, use current crop
      generateCroppedImage(crop);
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

      // Ensure we use the cropped file, not the original
      console.log('Starting processing with cropped image');
      
      // Create a proper file from the cropped image URL if we have one
      let fileToProcess = file;
      if (croppedImageUrl) {
        try {
          console.log('Using cropped image URL:', croppedImageUrl);
          const response = await fetch(croppedImageUrl);
          const blob = await response.blob();
          fileToProcess = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
          console.log('Created file from cropped image URL:', fileToProcess.name, 'size:', fileToProcess.size);
        } catch (err) {
          console.error('Failed to use cropped image URL:', err);
        }
      }

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
      
      // Make sure cropData is set with additional positioning information for proper display
      const currentCropData = cropData || {
        originalWidth: imgRef.current?.naturalWidth || 0,
        originalHeight: imgRef.current?.naturalHeight || 0,
        croppedWidth: completedCrop?.width || 0,
        croppedHeight: completedCrop?.height || 0,
        aspectRatio: completedCrop ? completedCrop.width / completedCrop.height : aspect,
        // Add positioning data to ensure image sits at the bottom of the container
        positionFromBottom: true,
        alignToBottom: true,
        // Add fit settings to ensure proper rendering in the poster
        objectFit: "cover",
        objectPosition: "center bottom"
      };
      
      const userData = {
        name: sessionStorage.getItem('userName') || 'Your Name',
        companyName: sessionStorage.getItem('companyName') || 'Your Company',
        industry: industry, // Pass industry directly
        tagline: sessionStorage.getItem('tagline') || 'Your Tagline',
        phoneNumber: sessionStorage.getItem('phoneNumber') || 'Your Phone',
        isNormalSelfie: isNormalSelfie, // Add the flag to indicate if this is a normal selfie
        isSelfieMode: isSelfieMode, // Add the flag to indicate if this is a selfie mode
        cropData: currentCropData // Store crop data for proper image processing on poster
      }

      // Log industry value for debugging
      console.log('Industry value being set:', industry);
      console.log('Final image type:', typeof finalImage);
      console.log('Crop data being stored:', currentCropData);
      
      // Make sure we have the final image URL (either processed or cropped)
      const finalImageUrl = finalImage || processedImage || croppedImageUrl || previewUrl;
      console.log('Final image URL that will be stored:', finalImageUrl);

      // Store data in session storage using string format to ensure proper persistence
      sessionStorage.setItem('userData', JSON.stringify(userData));
      
      // Store the image URL directly without any conversion
      sessionStorage.setItem('processedImage', finalImageUrl);
      
      // Store crop data separately for easier access
      sessionStorage.setItem('cropData', JSON.stringify(currentCropData));
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

  // Add custom CSS to improve the ReactCrop styling
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      /* General UI styles */
      .forced-small-logo {
        max-width: 230px !important;
        width: 230px !important;
      }

      .logo-container-fix {
        top: 45px !important;
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
      
      /* Make ReactCrop more intuitive */
      .ReactCrop {
        position: relative;
        max-height: 65vh;
        max-width: 100%;
        border: 2px solid #0083B5;
        border-radius: 8px;
        overflow: hidden;
        background-color: #f0f0f0;
      }
      
      .ReactCrop:hover {
        box-shadow: 0 0 15px rgba(0, 131, 181, 0.5);
      }
      
      .ReactCrop__crop-selection {
        border: 3px solid #00a0ff !important;
        box-shadow: 0 0 0 9999em rgba(0, 0, 0, 0.7) !important;
      }
      
      .ReactCrop__handle {
        width: 24px !important;
        height: 24px !important;
        background-color: #00a0ff !important;
        border: 3px solid white !important;
        opacity: 0.95 !important;
      }
      
      .ReactCrop__handle:hover {
        transform: scale(1.2) !important;
      }
      
      .ReactCrop__drag-handle {
        width: 40px !important;
        height: 40px !important;
      }
      
      /* Improved preview layout for desktop */
      @media (min-width: 768px) {
        .crop-modal-content {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }
        
        .crop-area-container {
          flex: 1;
          max-width: 65%;
        }
        
        .crop-preview-container {
          flex: 1;
          max-width: 35%;
          position: sticky;
          top: 20px;
        }
      }
      
      /* Mobile layout adjustments */
      @media (max-width: 767px) {
        .crop-modal-content {
          display: flex;
          flex-direction: column;
        }
        
        .crop-area-container {
          width: 100%;
          margin-bottom: 15px;
        }
        
        .crop-preview-container {
          width: 100%;
        }
      }
      
      /* More prominent preview styles */
      .crop-preview {
        background-color: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        border: 1px solid #e0e0e0;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      
      .preview-title {
        font-size: 16px;
        margin: 0 0 15px 0;
        color: #0083B5;
        font-weight: bold;
        position: relative;
      }
      
      .preview-title:after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 50%;
        transform: translateX(-50%);
        width: 50px;
        height: 2px;
        background-color: #0083B5;
      }
      
      .preview-image-container {
        max-width: 100%;
        margin: 0 auto;
        border: 2px solid #0083B5;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      }
      
      .preview-image {
        width: 100%;
        height: auto;
        display: block;
      }
      
      .crop-instruction-text {
        background-color: rgba(0, 131, 181, 0.1);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 15px;
        width: 100%;
        text-align: center;
        font-weight: 500;
        border-left: 4px solid #0083B5;
        color: #333;
      }
      
      /* Preview modal styles */
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
        max-height: 70vh;
        overflow-y: auto;
        padding: 15px;
      }
      
      .preview-modal-footer {
        padding: 15px;
        border-top: 1px solid #eee;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .preview-modal-buttons {
        display: flex;
        justify-content: center;
        gap: 15px;
        width: 100%;
      }
      
      .retake-btn, .confirm-btn {
        padding: 12px 24px;
        border-radius: 4px;
        border: none;
        font-size: 15px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 160px;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .retake-btn {
        background-color: #f5f5f5;
        color: #333;
      }
      
      .retake-btn:hover {
        background-color: #e5e5e5;
      }
      
      .confirm-btn {
        background-color: #0083B5;
        color: white;
      }
      
      .confirm-btn:hover {
        background-color: #006d99;
      }
      
      .confirm-btn:disabled {
        background-color: #cccccc;
        color: #666666;
        cursor: not-allowed;
      }
      
      /* Silhouette guide styles */
      .person-outline-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        pointer-events: none;
        z-index: 10;
      }
      
      .face-outline {
        width: 90%;
        max-width: 300px;
        height: auto;
        max-height: 80vh; /* Ensure it fits within the viewport height */
        opacity: 0.9;
        filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.5));
        object-fit: contain; /* Maintain aspect ratio */
        margin-top: -5vh; /* Move slightly upward to better center in the camera view */
      }
      
      .camera-instructions {
        color: white;
        text-shadow: 0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.6);
        font-size: 16px;
        font-weight: 500;
        text-align: center;
        background-color: rgba(0, 0, 0, 0.4);
        padding: 8px 12px;
        border-radius: 20px;
        margin-top: 10px;
        max-width: 80%;
      }
      
      /* Camera modal adjustments for the new silhouette */
      .camera-modal {
        background-color: rgba(0, 0, 0, 0.9);
      }
      
      .camera-content {
        background-color: rgba(0, 0, 0, 0.85);
        color: white;
        width: 95%;
        max-width: 500px;
        height: 90vh;
        max-height: 800px;
        display: flex;
        flex-direction: column;
      }
      
      .camera-container {
        position: relative;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        width: 100%;
        height: calc(100% - 60px);
        background-color: #000;
      }
      
      .camera-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .camera-btn {
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        width: 70px;
        height: 70px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.9);
        border: 3px solid white;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 20;
      }
      
      .camera-btn i {
        font-size: 30px;
        color: #0083B5;
      }
      
      .camera-btn:hover {
        background-color: #0083B5;
      }
      
      .camera-btn:hover i {
        color: white;
      }
      
      .camera-mode-btn {
        position: absolute;
        bottom: 30px;
        right: 20px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        border-radius: 20px;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 14px;
        cursor: pointer;
        z-index: 20;
      }
      
      .camera-mode-btn:hover {
        background-color: rgba(0, 0, 0, 0.9);
      }
      
      /* Mobile layout adjustments */
      @media (max-width: 767px) {
        .camera-content {
          width: 100%;
          height: 100vh;
          border-radius: 0;
        }
        
        .face-outline {
          width: 85%;
          max-width: 250px;
        }
        
        .camera-instructions {
          font-size: 14px;
          padding: 6px 10px;
        }
        
        .camera-btn {
          bottom: 20px;
          width: 60px;
          height: 60px;
        }
        
        .camera-btn i {
          font-size: 24px;
        }
        
        .camera-mode-btn {
          bottom: 20px;
          font-size: 12px;
          padding: 6px 10px;
        }
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
    
    // Generate initial crop
    setTimeout(() => {
      generateCroppedImage();
    }, 100);

  // Add missing handleDragOver function
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Activate camera for photo capture
  const activateCamera = async (selfieMode) => {
    setIsSelfieMode(selfieMode);
    setShowCameraModal(true);
    
    try {
      // Request camera access with front or back camera based on mode
      const constraints = {
        video: {
          facingMode: selfieMode ? 'user' : 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      
      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera access denied or not available.');
      setShowCameraModal(false);
    }
  };

  // Take photo from the camera
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not found');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video aspect ratio
    let canvasWidth, canvasHeight;
    
    if (isSelfieMode) {
      // For selfie mode, use portrait ratio to capture face to waist
      canvasHeight = video.videoHeight;
      canvasWidth = canvasHeight * 0.75; // 3:4 aspect ratio for better waist inclusion
    } else {
      // For regular photos, maintain video aspect ratio but ensure portrait orientation
      canvasHeight = video.videoHeight;
      canvasWidth = video.videoWidth;
      
      // If wider than 3:4, crop width to match 3:4 (portrait orientation)
      const aspectRatio = 3/4; // portrait aspect ratio
      const idealWidth = canvasHeight * aspectRatio;
      if (canvasWidth > idealWidth) {
        canvasWidth = idealWidth;
      }
    }
    
    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Get canvas context
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Clear previous contents
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate offset for centered crop
    let offsetX = 0;
    let offsetY = 0;
    
    if (isSelfieMode) {
      // For selfies, center horizontally
      offsetX = (video.videoWidth - canvasWidth) / 2;
      // Position to capture from face to waist - higher positioning to include face with more body
      offsetY = video.videoHeight * 0.1; // Start from higher up (top 10%) to include head and more body
    } else {
      // Center crop for regular photos, biased toward the top to focus on face to waist
      offsetX = (video.videoWidth - canvasWidth) / 2;
      offsetY = video.videoHeight * 0.1; // Start from higher up to ensure proper waist inclusion
    }
    
    // Draw the image with the calculated crop
    ctx.drawImage(
      video,
      offsetX, offsetY, canvasWidth, canvasHeight,
      0, 0, canvasWidth, canvasHeight
    );
    
    // Convert canvas to data URL
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.95); // Higher quality for better details
    
    // Store image dimensions and orientation
    detectImageOrientation(photoDataUrl, (orientation) => {
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

        // Set the file for processing
        setFile(newFile);
        
        // Reset crop state and show crop modal
        setCompletedCrop(null);
        setCroppedImageUrl(null);
        
        // Show crop modal
        setShowCropModal(true);
        setShowPreviewModal(false);
        setIsCropComplete(false);
      }, 'image/jpeg', 0.95);

      // Stop camera stream
      stopCamera();
    });
  };

  // Stop camera stream
  const stopCamera = () => {
    // Cancel any pending animation frames
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
    setShowCameraModal(false);
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

  // Handle applying the crop
  const handleApplyCrop = () => {
    if (!croppedImageUrl) return;
    
    // Store crop data in session storage for use in the poster generation
    if (cropData) {
      sessionStorage.setItem('cropData', JSON.stringify(cropData));
      console.log('Crop data saved to session storage:', cropData);
    }
    
    // Close crop modal and show preview modal
    setShowCropModal(false);
    setShowPreviewModal(true);
  };

  // Handle choosing another image
  const handleChooseAnotherImage = () => {
    setShowCropModal(false);
    setImageSrc(null);
    setFile(null);
    setCroppedImageUrl(null);
    setCropData(null);
    setIsCropComplete(false);
    setCrop(undefined);
    setCompletedCrop(null);
    
    // Clear the file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add missing refs and state variables
  const fileInputRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);

  // Check if file is a valid image
  const isValidImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    return validTypes.includes(file.type);
  };

  // Process uploaded file (simplified version to transition to new implementation)
  const processUploadedFile = (fileToProcess) => {
    // For the new implementation, we're directly using the cropped image
    // This is just a fallback in case cropping fails
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      
      // Store the original image URL in session storage
      sessionStorage.setItem('processedImage', imageUrl);
      
      // Call handleContinue with the image URL
      handleContinue(imageUrl);
    };
    reader.readAsDataURL(fileToProcess);
  };

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
              {/* Mobile stepper inside form - using the exact same structure as AddDetails.js */}
              <div className="mobile-stepper-container form-stepper">
                <div className="mobile-stepper">
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
              
              {/* Title after stepper indicator */}
              <h2 className="form-title">Upload Your Photo</h2>
              
              {/* Camera moved to modal, only showing the regular upload interface */}
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
                {/* Camera moved to modal, only showing the regular upload interface */}
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
                      <img 
                        src={croppedImageUrl} 
                        alt="Preview" 
                        className="preview-image"
                        style={{ 
                          width: "100%", 
                          height: "100%",
                          objectFit: "contain",
                          objectPosition: "center center"
                        }} 
                      />
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cropping Modal */}
      {showCropModal && (
        <div className="modal-overlay">
          <div className="crop-modal">
            <div className="crop-modal-header">
              <h2>Crop Your Image</h2>
              <div className="crop-options">
                <label className="toggle-container">
                  <span>Keep poster ratio</span>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={aspect !== null}
                      onChange={() => setAspect(aspect ? null : posterAspectRatio)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="crop-modal-content">
              <div className="crop-instructions-container">
                <p className="crop-instructions">
                  <i className="fas fa-crop-alt"></i> {isMobile ? 
                    "Drag the corner handles to adjust your crop. Pinch to zoom if needed." : 
                    "Drag to adjust the crop area. Using poster aspect ratio."}
                </p>
              </div>
              
              <div className="flexible-cropper-layout">
                <div className="reactcrop-container">
                  <div className="reactcrop-wrapper">
                    <ReactCrop
                      crop={crop}
                      aspect={useFixedAspectRatio ? aspect : undefined}
                      onChange={(newCrop) => setCrop(newCrop)}
                      onComplete={(c) => {
                        setCompletedCrop(c);
                        generateCroppedImage(c);
                      }}
                      ruleOfThirds={true}
                      circularCrop={false}
                      minWidth={50}
                      minHeight={50}
                      keepSelection={true}
                    >
                      <img
                        ref={imgRef}
                        src={previewUrl}
                        onLoad={onImageLoad}
                        style={{ maxHeight: "70vh", maxWidth: "100%" }}
                        alt="Upload"
                      />
                    </ReactCrop>
                  </div>
                </div>
                
                <div className="preview-container">
                  <h3 className="preview-header">Preview</h3>
                  <div className="preview-image-container">
                    {croppedImageUrl ? (
                      <img 
                        src={croppedImageUrl} 
                        alt="Preview" 
                        className="preview-image"
                        style={{ 
                          width: "100%", 
                          height: "100%",
                          objectFit: "contain",
                          objectPosition: "center center"
                        }} 
                      />
                    ) : (
                      <div className="preview-placeholder">
                        <p>This is how your image will appear in the poster</p>
                      </div>
                    )}
                  </div>
                  <div className="preview-note">
                    <i className="fas fa-info-circle"></i> This is how your image will appear in the poster
                  </div>
                </div>
              </div>
            </div>
            
            <div className="crop-modal-footer">
              <button className="secondary-btn" onClick={() => {
                setShowCropModal(false);
                setImageSrc(null);
                setFile(null);
                setCroppedImageUrl(null);
                setCropData(null);
                setIsCropComplete(false);
                setCrop(undefined);
                setCompletedCrop(null);
                
                // Clear the file input to allow selecting the same file again
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}>
                <i className="fas fa-redo-alt"></i> Choose another
              </button>
              <button 
                className="primary-btn" 
                onClick={() => {
                  if (!croppedImageUrl) return;
                  
                  // Store crop data in session storage for use in the poster generation
                  if (cropData) {
                    sessionStorage.setItem('cropData', JSON.stringify(cropData));
                    console.log('Crop data saved to session storage:', cropData);
                  }
                  
                  // Close crop modal and show preview modal
                  setShowCropModal(false);
                  setShowPreviewModal(true);
                }}
                disabled={!isCropComplete}
              >
                <i className="fas fa-check"></i> Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showPreviewModal && (
        <div className="modal-overlay">
          <div className="preview-modal">
            <div className="preview-modal-header">
              <h2>Preview Your Photo</h2>
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
              <p className="preview-description">
                <i className="fas fa-info-circle"></i> This is how your image will appear in the poster
              </p>
              <div className="preview-image-frame">
                {croppedImageUrl ? (
                  <img src={croppedImageUrl} alt="Preview" className="final-preview-image" />
                ) : (
                  <div className="preview-placeholder">
                    <p>Image not available</p>
                  </div>
                )}
              </div>
            </div>
            <div className="preview-modal-footer">
              <div className="preview-modal-buttons">
                <button
                  className="retake-btn"
                  onClick={() => {
                    setShowPreviewModal(false);
                    setShowCropModal(true);
                  }}
                >
                  <i className="fas fa-crop-alt"></i> Edit Crop
                </button>
                <button
                  className="confirm-btn"
                  onClick={startProcessing}
                >
                  <i className="fas fa-arrow-right"></i> Continue
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

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="modal camera-modal">
          <div className="modal-content camera-content">
            <div className="modal-header">
              <h3>{isSelfieMode ? 'Take a Selfie' : 'Take a Photo'}</h3>
              <button className="close-btn" onClick={stopCamera}>
                &times;
              </button>
            </div>
            <div className="camera-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="camera-video"
                onLoadedMetadata={() => {
                  console.log('Video loaded, ready for capture');
                }}
              ></video>
              
              <div className="person-outline-overlay">
                <img
                  src="/images/face-outline.svg"
                  alt="Person silhouette guide"
                  className="face-outline"
                />
                <p className="camera-instructions">
                  {isSelfieMode ? 
                    "Position yourself in the outline from face to waist" : 
                    "Capture your subject from face to waist within the guide"
                  }
                </p>
              </div>
              
              <button
                onClick={takePhoto}
                className="camera-btn active"
                title="Take Photo"
              >
                <i className="fas fa-camera"></i>
              </button>
              
              <button className="camera-mode-btn" onClick={() => {
                stopCamera();
                setTimeout(() => activateCamera(!isSelfieMode), 300);
              }}>
                <i className={`fas ${isSelfieMode ? 'fa-camera' : 'fa-user'}`}></i>
                {isSelfieMode ? 'Switch to Back Camera' : 'Switch to Selfie Mode'}
              </button>
              
              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPhoto;