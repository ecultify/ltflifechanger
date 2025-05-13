/**
 * Script to download and set up face-api.js models
 * Run this script to download the required models for face detection
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Base URL for face-api.js models using NPM CDN
const BASE_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

// List of tiny_face_detector model files needed
const MODEL_FILES = [
  'tiny_face_detector_model-shard1',
  'tiny_face_detector_model-weights_manifest.json'
];

// Create models directory if it doesn't exist
const modelsDir = path.join(__dirname, '../../public/models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
  console.log('Created models directory:', modelsDir);
}

// Download each model file
MODEL_FILES.forEach(file => {
  // No extension needed for jsdelivr URLs
  const url = `${BASE_URL}/${file}`;
  const outputPath = path.join(modelsDir, file);

  console.log(`Downloading ${url}...`);

  // Skip if file already exists
  if (fs.existsSync(outputPath)) {
    console.log(`File already exists: ${outputPath}`);
    return;
  }

  // Download the file
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
      console.error(`Failed to download ${url}: ${response.statusCode}`);
        return;
      }
      
    const fileStream = fs.createWriteStream(outputPath);
    response.pipe(fileStream);

    fileStream.on('finish', () => {
      fileStream.close();
      console.log(`Downloaded ${file} to ${outputPath}`);
      });
    }).on('error', (err) => {
    console.error(`Error downloading ${url}:`, err.message);
    });
  });

console.log('Setup script executed. The model files will be downloaded to the public/models directory.');