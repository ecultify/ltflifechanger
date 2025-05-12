/**
 * Face detection utility for dynamic image placement in posters
 * Uses face-api.js to detect faces and calculate optimal positioning
 */

import * as faceapi from 'face-api.js';

// Flag to track if models are loaded
let modelsLoaded = false;

/**
 * Load face detection models
 * @returns {Promise<void>} Promise that resolves when models are loaded
 */
export const loadFaceDetectionModels = async () => {
  if (modelsLoaded) return;
  
  try {
    // First try to load models from local directory
    const LOCAL_MODEL_URL = '/models';
    
    try {
      // Load the required models from local path
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(LOCAL_MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(LOCAL_MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(LOCAL_MODEL_URL)
      ]);
      
      console.log('Face detection models loaded successfully from local directory');
      modelsLoaded = true;
    } catch (localError) {
      console.warn('Could not load models from local directory, trying CDN...', localError);
      
      // Fallback to loading from CDN
      const CDN_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(CDN_MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(CDN_MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(CDN_MODEL_URL)
      ]);
      
      console.log('Face detection models loaded successfully from CDN');
      modelsLoaded = true;
    }
  } catch (error) {
    console.error('Error loading face detection models:', error);
    throw new Error('Failed to load face detection models from both local and CDN sources');
  }
};

/**
 * Detect faces in an image
 * @param {HTMLImageElement} imageElement - The image element to analyze
 * @returns {Promise<Object>} Object containing face detection results and image type classification
 */
export const detectFaces = async (imageElement) => {
  if (!modelsLoaded) {
    try {
      await loadFaceDetectionModels();
    } catch (error) {
      console.error('Could not load face detection models:', error);
      return { success: false, error: 'Face detection models could not be loaded' };
    }
  }
  
  try {
    // Enhanced detection with lower threshold for back camera photos
    // This helps detect faces that are further away or less prominent
    const detections = await faceapi.detectAllFaces(
      imageElement,
      new faceapi.TinyFaceDetectorOptions({ 
        scoreThreshold: 0.4,  // Reduced threshold to detect faces more reliably
        inputSize: 416       // Increased input size for better detection at a distance
      })
    ).withFaceLandmarks();
    
    // If no faces detected with regular approach, try an alternative method
    if (!detections || detections.length === 0) {
      console.log('No faces detected with primary method, trying alternative approach');
      
      // Try with even lower threshold for more sensitive detection
      const backupDetections = await faceapi.detectAllFaces(
        imageElement,
        new faceapi.TinyFaceDetectorOptions({ 
          scoreThreshold: 0.3, 
          inputSize: 608     // Maximum input size for distant face detection
        })
      ).withFaceLandmarks();
      
      // If still no faces, return failure
      if (!backupDetections || backupDetections.length === 0) {
        console.log('No faces detected with alternative method either');
        
        // For photos with no detectable faces, we'll make an educated guess based on image dimensions
        const imgWidth = imageElement.width;
        const imgHeight = imageElement.height;
        const imgAspect = imgWidth / imgHeight;
        
        // For portrait photos with no detected faces, assume it's a full body shot
        if (imgHeight > imgWidth && imgAspect < 0.8) {
          console.log('No face detected but image appears to be portrait, treating as full body shot');
          return { 
            success: true, 
            photoType: 'full_body',
            estimatedPlacement: true,
            face: {
              // Estimate face position at upper portion of image
              x: imgWidth * 0.3,
              y: imgHeight * 0.15,
              width: imgWidth * 0.4,
              height: imgHeight * 0.15,
              centerX: imgWidth * 0.5,
              centerY: imgHeight * 0.15
            },
            imageDimensions: {
              width: imgWidth,
              height: imgHeight
            }
          };
        }
        
        // Standard failure response
        return { 
          success: false, 
          error: 'No faces detected',
          photoType: 'unknown'
        };
      }
      
      // Use the backup detections if they succeeded
      return processDetections(backupDetections, imageElement, true);
    }
    
    // Process the successful detections
    return processDetections(detections, imageElement, false);
  } catch (error) {
    console.error('Error during face detection:', error);
    return { success: false, error: 'Face detection failed' };
  }
};

/**
 * Process face detections to extract useful information
 * @param {Array} detections - Face detections from face-api.js
 * @param {HTMLImageElement} imageElement - The image element analyzed
 * @param {boolean} isBackupMethod - Whether this was processed with the backup method
 * @returns {Object} Processed detection results
 */
const processDetections = (detections, imageElement, isBackupMethod) => {
  // Get the most prominent face (usually the largest one)
  const mainFace = detections.sort((a, b) => 
    (b.detection.box.width * b.detection.box.height) - 
    (a.detection.box.width * a.detection.box.height)
  )[0];
  
  // Get image dimensions
  const imgWidth = imageElement.width;
  const imgHeight = imageElement.height;
  
  // Get face dimensions and position
  const faceBox = mainFace.detection.box;
  const faceWidth = faceBox.width;
  const faceHeight = faceBox.height;
  const faceCenterX = faceBox.x + (faceWidth / 2);
  const faceCenterY = faceBox.y + (faceHeight / 2);
  
  // Calculate face size relative to image
  const faceToImageRatio = (faceWidth * faceHeight) / (imgWidth * imgHeight);
  
  // Enhanced photo type classification with better thresholds for mobile photos
  let photoType = 'unknown';
  
  // Log detection quality
  console.log(`Face detection ${isBackupMethod ? '(backup method)' : '(primary method)'}: ratio=${faceToImageRatio}, y-position=${faceBox.y/imgHeight}`);
  
  // More accurate photo type classification based on face size and position
  if (faceToImageRatio > 0.15) {
    photoType = 'selfie'; // Face takes up significant portion of the image
  } else if (faceToImageRatio > 0.04 && faceBox.y < imgHeight * 0.45) {
    // Reduced threshold from 0.05 to 0.04 to better detect upper body shots
    // Extended upper region from 0.4 to 0.45 to include more upper body shots
    photoType = 'upper_body';
  } else if (faceBox.y < imgHeight * 0.35) {
    // If face is in upper third, likely an upper body even if face is small
    photoType = 'upper_body';
  } else {
    photoType = 'full_body'; // Small face or lower in frame, likely a full body shot
  }
  
  // For back camera images that might have small faces due to distance
  // Consider the vertical position more strongly
  if (faceToImageRatio < 0.03 && photoType !== 'full_body') {
    // Very small face could be from distance, check position
    if (faceBox.y > imgHeight * 0.25) {
      // Face is lower in the frame, more likely a full body
      photoType = 'full_body';
    }
  }
    
  // For group photos, we still focus on the main face but note it's a group
  const isGroupPhoto = detections.length > 1;
  
  return {
    success: true,
    face: {
      x: faceBox.x,
      y: faceBox.y,
      width: faceWidth,
      height: faceHeight,
      centerX: faceCenterX,
      centerY: faceCenterY
    },
    photoType,
    isGroupPhoto,
    faceToImageRatio,
    usingBackupDetection: isBackupMethod,
    multipleFaces: detections.length > 1 ? detections.length : 0,
    imageDimensions: {
      width: imgWidth,
      height: imgHeight
    }
  };
};

/**
 * Calculate optimal image placement based on face detection
 * @param {Object} detectionResult - Result from detectFaces function
 * @param {Object} canvasDimensions - Canvas dimensions {width, height}
 * @param {Object} targetArea - Target area for image placement {x, y, width, height}
 * @returns {Object} Optimal image placement parameters
 */
export const calculateOptimalPlacement = (detectionResult, canvasDimensions, targetArea) => {
  // If face detection failed, use default placement
  if (!detectionResult.success) {
    console.log('Using default placement due to face detection failure');
    return {
      x: targetArea.x,
      y: targetArea.y,
      width: targetArea.width,
      height: targetArea.height,
      usingFallback: true
    };
  }
  
  const { face, photoType, imageDimensions } = detectionResult;
  
  // Fixed Y position - always use the targetArea's Y coordinate
  const fixedY = targetArea.y;
  
  // Calculate aspect ratio
  const aspectRatio = imageDimensions.width / imageDimensions.height;
  
  // Enhanced scale factors for better height matching with Bumrah's image
  const scaleFactors = {
    selfie: 1.3,        // Increased from 1.2 to 1.3 for better face prominence
    upper_body: 1.05,   // Increased from 0.9 to 1.05 to match Bumrah's upper body better
    full_body: 0.8,     // Increased from 0.7 to 0.8 to ensure full height match
    unknown: 0.9        // Increased from 0.8 to 0.9 as default
  };
  
  // Special case for photos where we estimated placement (no face detected)
  if (detectionResult.estimatedPlacement) {
    scaleFactors.full_body = 0.9; // Use higher scale factor for estimated placements
  }
  
  // Get the appropriate scale factor
  const scaleFactor = scaleFactors[photoType];
  
  // Enhanced ideal face size percentages for better composition
  const idealFaceSizePercent = {
    selfie: 0.38,       // Increased from 0.35 to 0.38 for more prominent face in selfies
    upper_body: 0.28,   // Increased from 0.25 to 0.28 for better proportions
    full_body: 0.18,    // Increased from 0.15 to 0.18 to make face more visible
    unknown: 0.28       // Increased from 0.25 to 0.28 as default
  };
  
  // For images using backup detection or estimated placement, adjust ideal sizes
  if (detectionResult.usingBackupDetection || detectionResult.estimatedPlacement) {
    idealFaceSizePercent.upper_body = 0.30; // Increase face prominence for less confident detections
    idealFaceSizePercent.full_body = 0.20;  // Increase face prominence for less confident detections
  }
  
  // Calculate the ideal face height in pixels
  const idealFaceHeight = targetArea.height * idealFaceSizePercent[photoType];
  
  // Calculate the scale needed to achieve the ideal face size
  const faceScaleFactor = idealFaceHeight / face.height;
  
  // Calculate dimensions based on face scaling while maintaining aspect ratio
  let width = imageDimensions.width * faceScaleFactor * scaleFactor;
  let height = imageDimensions.height * faceScaleFactor * scaleFactor;
  
  // Ensure width doesn't exceed target area width
  if (width > targetArea.width) {
    width = targetArea.width;
    height = width / aspectRatio;
  }
  
  // Calculate X position to center horizontally in target area
  let x = targetArea.x + (targetArea.width - width) / 2;
  
  // Adjust X position to ensure face is centered horizontally
  const scaledFaceCenterX = face.centerX * (width / imageDimensions.width);
  const targetFaceCenterX = targetArea.x + (targetArea.width * 0.5);
  x = targetFaceCenterX - scaledFaceCenterX;
  
  // Ensure the image stays within canvas boundaries horizontally
  if (x + width > canvasDimensions.width) {
    x = canvasDimensions.width - width;
  }
  if (x < 0) {
    x = 0;
  }
  
  // Adjust height if it exceeds canvas boundaries
  if (fixedY + height > canvasDimensions.height) {
    height = canvasDimensions.height - fixedY;
  }
  
  // Enhanced logging with more information about the placement decision
  console.log('Enhanced face-aware fixed-top placement:', {
    photoType,
    originalFaceHeight: face.height,
    idealFaceHeight,
    faceScaleFactor,
    finalDimensions: { width, height },
    position: { x, fixedY },
    usingBackupDetection: detectionResult.usingBackupDetection || false,
    estimatedPlacement: detectionResult.estimatedPlacement || false,
    // Key height requirement: Ensure user image is same height as Bumrah
    targetHeight: targetArea.height,
    heightMatch: (height / targetArea.height * 100).toFixed(1) + '%'
  });
  
  return {
    x,
    y: fixedY,
    width,
    height,
    photoType,
    usingFallback: false
  };
};

/**
 * Create a temporary image element from a URL
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<HTMLImageElement>} Promise that resolves with the image element
 */
export const createImageElement = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    img.src = imageUrl;
  });
};

/**
 * Main function to analyze an image and get optimal placement
 * @param {string} imageUrl - URL of the image to analyze
 * @param {Object} canvasDimensions - Canvas dimensions {width, height}
 * @param {Object} targetArea - Target area for image placement {x, y, width, height}
 * @returns {Promise<Object>} Promise that resolves with placement parameters
 */
export const getOptimalImagePlacement = async (imageUrl, canvasDimensions, targetArea) => {
  try {
    // Create image element
    const imageElement = await createImageElement(imageUrl);
    
    // Detect faces
    const detectionResult = await detectFaces(imageElement);
    
    // Calculate optimal placement
    return calculateOptimalPlacement(detectionResult, canvasDimensions, targetArea);
  } catch (error) {
    console.error('Error getting optimal image placement:', error);
    // Return default placement as fallback
    return {
      x: targetArea.x,
      y: targetArea.y,
      width: targetArea.width,
      height: targetArea.height,
      usingFallback: true,
      error: error.message
    };
  }
};