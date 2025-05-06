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
    // Detect all faces with landmarks
    const detections = await faceapi.detectAllFaces(
      imageElement,
      new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
    ).withFaceLandmarks();
    
    if (!detections || detections.length === 0) {
      console.log('No faces detected in the image');
      return { 
        success: false, 
        error: 'No faces detected',
        photoType: 'unknown'
      };
    }
    
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
    
    // Classify photo type based on face size and position
    let photoType = 'unknown';
    
    if (faceToImageRatio > 0.15) {
      photoType = 'selfie'; // Face takes up significant portion of the image
    } else if (faceToImageRatio > 0.05 && faceBox.y < imgHeight * 0.4) {
      photoType = 'upper_body'; // Medium-sized face in upper part of image
    } else {
      photoType = 'full_body'; // Small face, likely a full body shot
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
      multipleFaces: detections.length > 1 ? detections.length : 0,
      imageDimensions: {
        width: imgWidth,
        height: imgHeight
      }
    };
  } catch (error) {
    console.error('Error during face detection:', error);
    return { success: false, error: 'Face detection failed' };
  }
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
  
  // Base scale factors for different photo types - adjusted for fixed-top approach
  const scaleFactors = {
    selfie: 1.2,        // Larger scaling for selfies to focus on face
    upper_body: 0.9,    // Balanced scaling for upper body shots
    full_body: 0.7,     // More aggressive scaling for full body shots
    unknown: 0.8        // Default scaling for unknown photo types
  };
  
  // Get the appropriate scale factor
  const scaleFactor = scaleFactors[photoType];
  
  // Calculate the ideal face size in the output image (as % of image height)
  const idealFaceSizePercent = {
    selfie: 0.35,       // Face should be 35% of the image height for selfies
    upper_body: 0.25,   // Face should be 25% of the image height for upper body
    full_body: 0.15,    // Face should be 15% of the image height for full body
    unknown: 0.25       // Default face size for unknown photo types
  };
  
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
  
  // Log the calculations for debugging
  console.log('Face-aware fixed-top placement:', {
    photoType,
    originalFaceHeight: face.height,
    idealFaceHeight,
    faceScaleFactor,
    finalDimensions: { width, height },
    position: { x, fixedY }
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