/**
 * Script to download and set up face-api.js models
 * Run this script to download the required models for face detection
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Define the models directory
const MODELS_DIR = path.join(__dirname, '../../public/models');

// Define the models to download with CDN URLs
const MODELS = [
  // TinyFaceDetector model
  {
    name: 'tiny_face_detector',
    files: [
      { 
        filename: 'tiny_face_detector_model-shard1', 
        url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/tiny_face_detector_model-shard1'
      },
      { 
        filename: 'tiny_face_detector_model-weights_manifest.json', 
        url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/tiny_face_detector_model-weights_manifest.json'
      }
    ]
  },
  // FaceLandmark68 model
  {
    name: 'face_landmark_68',
    files: [
      { 
        filename: 'face_landmark_68_model-shard1', 
        url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/face_landmark_68_model-shard1'
      },
      { 
        filename: 'face_landmark_68_model-weights_manifest.json', 
        url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/face_landmark_68_model-weights_manifest.json'
      }
    ]
  },
  // FaceRecognition model
  {
    name: 'face_recognition',
    files: [
      { 
        filename: 'face_recognition_model-shard1', 
        url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/face_recognition_model-shard1'
      },
      { 
        filename: 'face_recognition_model-shard2', 
        url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/face_recognition_model-shard2'
      },
      { 
        filename: 'face_recognition_model-weights_manifest.json', 
        url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/face_recognition_model-weights_manifest.json'
      }
    ]
  }
];

// No need for a base URL as we're using full URLs for each file

/**
 * Create directory if it doesn't exist
 * @param {string} dir - Directory path
 */
const createDirIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Download a file from a URL
 * @param {string} url - URL to download from
 * @param {string} dest - Destination file path
 * @returns {Promise<void>} Promise that resolves when the file is downloaded
 */
const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete the file on error
      reject(err);
    });
  });
};

/**
 * Main function to download all models
 */
const downloadModels = async () => {
  try {
    // Create models directory
    createDirIfNotExists(MODELS_DIR);
    
    // Download each model
    for (const model of MODELS) {
      const modelDir = path.join(MODELS_DIR, model.name);
      createDirIfNotExists(modelDir);
      
      for (const file of model.files) {
        const { url, filename } = file;
        const dest = path.join(modelDir, filename);
        
        if (fs.existsSync(dest)) {
          console.log(`File already exists: ${dest}`);
          continue;
        }
        
        console.log(`Downloading ${filename} from ${url}...`);
        await downloadFile(url, dest);
      }
    }
    
    console.log('All models downloaded successfully!');
    console.log(`Models are located in: ${MODELS_DIR}`);
  } catch (error) {
    console.error('Error downloading models:', error);
    process.exit(1);
  }
};

// Run the download function
downloadModels();