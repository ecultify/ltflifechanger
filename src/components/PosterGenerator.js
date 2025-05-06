import React, { useState } from 'react';
import { processImageForPoster } from '../utils/imageProcessor';

const PosterGenerator = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Poster dimensions (you can adjust these as needed)
  const posterDimensions = {
    width: 1080,
    height: 1920
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Create a temporary URL for the uploaded image
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);

      // Process the image
      const result = await processImageForPoster(imageUrl, posterDimensions);
      setProcessedImage(result.processedImageUrl);
    } catch (err) {
      setError('Error processing image: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="poster-generator">
      <h2>Marketing Poster Generator</h2>
      
      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={loading}
        />
        {loading && <p>Processing image...</p>}
        {error && <p className="error">{error}</p>}
      </div>

      <div className="preview-section">
        {uploadedImage && (
          <div className="image-preview">
            <h3>Original Image</h3>
            <img src={uploadedImage} alt="Original" />
          </div>
        )}
        
        {processedImage && (
          <div className="image-preview">
            <h3>Processed Image</h3>
            <img src={processedImage} alt="Processed" />
          </div>
        )}
      </div>

      <style jsx>{`
        .poster-generator {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .upload-section {
          margin: 20px 0;
          padding: 20px;
          border: 2px dashed #ccc;
          border-radius: 8px;
          text-align: center;
        }

        .preview-section {
          display: flex;
          gap: 20px;
          margin-top: 20px;
        }

        .image-preview {
          flex: 1;
          padding: 10px;
          border: 1px solid #eee;
          border-radius: 4px;
        }

        .image-preview img {
          max-width: 100%;
          height: auto;
        }

        .error {
          color: red;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default PosterGenerator;