import React, { useState } from 'react';
import axios from 'axios';
import '../styles/components/PoseCharacterGenerator.css';

const PoseCharacterGenerator = () => {
  const [faceImage, setFaceImage] = useState(null);
  const [poseImage, setPoseImage] = useState(null);
  const [prompt, setPrompt] = useState('A candid photo of a person, professional portrait');
  const [faceImagePreview, setFaceImagePreview] = useState(null);
  const [poseImagePreview, setPoseImagePreview] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  const API_KEY = "SG_13f9868f102f0d83"; // Segmind API key
  
  // Handle face image upload
  const handleFaceImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFaceImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaceImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle pose image upload
  const handlePoseImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPoseImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPoseImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove data:image/png;base64, part from the result
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };
  
  // Generate image with the Segmind API
  const generateImage = async () => {
    if (!faceImage || !poseImage) {
      setError("Please upload both a face image and a pose image");
      return;
    }
    
    try {
      setIsGenerating(true);
      setError(null);
      
      const faceImageBase64 = await fileToBase64(faceImage);
      const poseImageBase64 = await fileToBase64(poseImage);
      
      const url = "https://api.segmind.com/v1/consistent-character-with-pose";
      
      const data = {
        base_64: false,
        custom_height: 1024,
        custom_width: 1024,
        face_image: faceImageBase64,
        output_format: "png",
        pose_image: poseImageBase64,
        prompt: prompt,
        quality: 95,
        samples: 1,
        seed: Math.floor(Math.random() * 10000000000),
        use_input_img_dimension: false
      };
      
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      };
      
      const response = await axios.post(url, data, {
        headers: headers,
        responseType: 'arraybuffer'
      });
      
      // Convert binary data to base64 for displaying the image
      const blob = new Blob([response.data], { type: 'image/png' });
      const imageUrl = URL.createObjectURL(blob);
      setGeneratedImage(imageUrl);
      
    } catch (err) {
      console.error("Error generating image:", err);
      setError("Failed to generate image. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="pose-character-generator">
      <h2>Generate Consistent Character with Pose</h2>
      
      <div className="input-section">
        <div className="image-upload">
          <h3>Face Image</h3>
          <div className="image-preview-container">
            {faceImagePreview ? (
              <img src={faceImagePreview} alt="Face preview" className="image-preview" />
            ) : (
              <div className="image-placeholder">Upload face image</div>
            )}
          </div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFaceImageUpload} 
            className="file-input"
          />
        </div>
        
        <div className="image-upload">
          <h3>Pose Image</h3>
          <div className="image-preview-container">
            {poseImagePreview ? (
              <img src={poseImagePreview} alt="Pose preview" className="image-preview" />
            ) : (
              <div className="image-placeholder">Upload pose image</div>
            )}
          </div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handlePoseImageUpload} 
            className="file-input"
          />
        </div>
      </div>
      
      <div className="prompt-input">
        <h3>Prompt</h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
          rows={3}
        />
      </div>
      
      <button 
        className="generate-button" 
        onClick={generateImage}
        disabled={isGenerating || !faceImage || !poseImage}
      >
        {isGenerating ? "Generating..." : "Generate Image"}
      </button>
      
      {error && <div className="error-message">{error}</div>}
      
      {generatedImage && (
        <div className="result-section">
          <h3>Generated Image</h3>
          <div className="generated-image-container">
            <img src={generatedImage} alt="Generated character" className="generated-image" />
          </div>
          <a 
            href={generatedImage} 
            download="generated-character.png" 
            className="download-button"
          >
            Download Image
          </a>
        </div>
      )}
    </div>
  );
};

export default PoseCharacterGenerator; 