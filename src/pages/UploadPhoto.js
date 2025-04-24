import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/UploadPhoto.css';

const UploadPhoto = () => {
  // eslint-disable-next-line no-unused-vars
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
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
      };
      fileReader.readAsDataURL(droppedFile);
    }
  };

  const handleNext = () => {
    // Proceed to the next step
    navigate('/share-poster');
  };

  return (
    <div className="upload-page">
      <div className="left-section">
        <img 
          src="/images/Upload Photo + Add Details.png" 
          alt="L&T Finance Upload" 
          className="left-section-image"
        />
      </div>
      
      <div className="right-section">
        <div className="right-content">
          <div className="progress-tracker">
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
          
          <div className="upload-container">
            <h1 className="upload-title">Upload Your Photo</h1>
            
            <div className="upload-area-container">
              <p className="upload-subtitle">Upload Your Photo</p>
              
              <div 
                className="upload-area"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {previewUrl ? (
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
                    <label htmlFor="file-upload" className="browse-btn">
                      Browse files
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </>
                )}
              </div>
            </div>
            
            <button 
              className="next-btn"
              onClick={handleNext}
            >
              Create Poster
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPhoto; 