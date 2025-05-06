const axios = require('axios');

const CROP_PHOTO_API_KEY = 'VmEeChTnKgAvW7NVH1bYrQC1';
const CROP_PHOTO_API_URL = 'https://api.crop.photo/v1';

/**
 * Detects if an image is a face/selfie or full body shot
 * @param {string} imageUrl - URL of the image to analyze
 * @returns {Promise<{isFace: boolean, faceCoordinates: Object|null}>}
 */
async function detectImageType(imageUrl) {
  try {
    const response = await axios.post(
      `${CROP_PHOTO_API_URL}/detect`,
      {
        image_url: imageUrl,
        detect_faces: true,
        detect_body: true
      },
      {
        headers: {
          'Authorization': `Bearer ${CROP_PHOTO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const { faces, body } = response.data;
    
    // If faces are detected and no body is detected, it's likely a selfie
    const isFace = faces && faces.length > 0 && (!body || body.length === 0);
    
    return {
      isFace,
      faceCoordinates: faces ? faces[0] : null
    };
  } catch (error) {
    console.error('Error detecting image type:', error);
    throw error;
  }
}

/**
 * Processes an image for poster placement
 * @param {string} imageUrl - URL of the image to process
 * @param {Object} posterDimensions - Dimensions of the poster
 * @returns {Promise<{processedImageUrl: string, placement: Object}>}
 */
async function processImageForPoster(imageUrl, posterDimensions) {
  try {
    // First detect if it's a face or full body shot
    const { isFace, faceCoordinates } = await detectImageType(imageUrl);

    // Calculate optimal placement based on image type
    let placement;
    if (isFace) {
      // For face images, position higher up on the poster
      placement = {
        x: posterDimensions.width / 2, // Center horizontally
        y: posterDimensions.height * 0.7, // Position at 70% of poster height
        scale: 0.3 // Scale down face images
      };
    } else {
      // For full body shots, use original placement
      placement = {
        x: posterDimensions.width / 2,
        y: posterDimensions.height * 0.85, // Position at 85% of poster height
        scale: 0.4
      };
    }

    // Process the image with Crop.photo API
    const response = await axios.post(
      `${CROP_PHOTO_API_URL}/process`,
      {
        image_url: imageUrl,
        operations: [
          {
            type: 'remove_background'
          },
          {
            type: 'resize',
            width: Math.round(posterDimensions.width * placement.scale),
            height: 'auto',
            maintain_aspect_ratio: true
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${CROP_PHOTO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      processedImageUrl: response.data.processed_image_url,
      placement
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

module.exports = {
  detectImageType,
  processImageForPoster
}; 