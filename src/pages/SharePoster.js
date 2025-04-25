import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/SharePoster.css';
import * as faceapi from 'face-api.js';

const SharePoster = () => {
  const navigate = useNavigate();
  const [processedImage, setProcessedImage] = useState(null);
  const [userData, setUserData] = useState({});
  const [generatedPoster, setGeneratedPoster] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userGender, setUserGender] = useState('unknown');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const canvasRef = useRef(null);
  const faceCanvasRef = useRef(null);

  useEffect(() => {
    // Load face-api.js models
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        
        // Check if models are already loaded
        if (!modelsLoaded) {
          try {
            await Promise.all([
              faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
              faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            ]);
            
            console.log('Face detection models loaded successfully');
            setModelsLoaded(true);
          } catch (modelError) {
            console.error('Error loading face detection models:', modelError);
            // Continue without face detection if models fail to load
            setModelsLoaded(false);
            // Proceed anyway with poster generation
            console.log('Proceeding without face detection');
          }
        }
      } catch (error) {
        console.error('Error in model loading process:', error);
        setModelsLoaded(false);
      }
    };
    
    loadModels();
    
    // Load data from sessionStorage when component mounts
    try {
      const savedImage = sessionStorage.getItem('processedImage');
      const savedUserData = sessionStorage.getItem('userFormData');
      const savedGender = sessionStorage.getItem('userGender');
      
      if (savedImage) {
        setProcessedImage(savedImage);
      } else {
        setError('No processed image found. Please upload an image first.');
        setIsLoading(false);
        return;
      }
      
      if (savedGender) {
        setUserGender(savedGender);
        console.log(`Using detected gender: ${savedGender}`);
      }
      
      if (savedUserData) {
        const parsedUserData = JSON.parse(savedUserData);
        setUserData(parsedUserData);
        
        // If gender is in the user data, use it (this takes priority)
        if (parsedUserData.gender && parsedUserData.gender !== 'unknown') {
          setUserGender(parsedUserData.gender);
          console.log(`Using gender from user data: ${parsedUserData.gender}`);
        }
      } else {
        // Use default data for testing
        setUserData({
          name: 'John Doe',
          companyName: 'ABC Business Solutions',
          industry: 'Technology',
          tagline: 'I transform businesses with innovative digital solutions and expertise',
          phoneNumber: '+91 9876543210',
          gender: 'unknown'
        });
      }
    } catch (err) {
      console.error('Error loading saved data:', err);
      setError('Failed to load poster data.');
      setIsLoading(false);
    }
  }, []);

  // Generate the poster once data is loaded
  useEffect(() => {
    if (processedImage && userData && Object.keys(userData).length > 0) {
      generatePoster();
    }
  }, [processedImage, userData, userGender]);

  // Function to detect and extract face from user image
  const extractFace = async (userImg) => {
    try {
      // If models not loaded, skip face extraction
      if (!modelsLoaded) {
        console.log("Face detection models not loaded, skipping face extraction");
        return { 
          faceImage: userImg,
          hasFace: false 
        };
      }

      // Create a temporary canvas for face detection and extraction
      const faceCanvas = faceCanvasRef.current;
      const faceCtx = faceCanvas.getContext('2d');
      
      // Set canvas to match image dimensions
      faceCanvas.width = userImg.width;
      faceCanvas.height = userImg.height;
      
      // Draw user image to the canvas for face detection
      faceCtx.drawImage(userImg, 0, 0, userImg.width, userImg.height);
      
      // Use face-api to detect the face
      const detections = await faceapi
        .detectSingleFace(faceCanvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();
      
      if (!detections) {
        console.log("No face detected in the image. Using full image instead.");
        return { 
          faceImage: userImg,
          hasFace: false 
        };
      }
      
      // Get face bounding box with some padding
      const { box } = detections.detection;
      const padding = {
        top: box.height * 0.4,
        bottom: box.height * 0.1,
        left: box.width * 0.2,
        right: box.width * 0.2
      };
      
      // Calculate extended face area with padding
      const faceArea = {
        x: Math.max(0, box.x - padding.left),
        y: Math.max(0, box.y - padding.top),
        width: Math.min(userImg.width - (box.x - padding.left), box.width + padding.left + padding.right),
        height: Math.min(userImg.height - (box.y - padding.top), box.height + padding.top + padding.bottom)
      };
      
      // Create a new canvas for the extracted face
      const extractedFaceCanvas = document.createElement('canvas');
      extractedFaceCanvas.width = faceArea.width;
      extractedFaceCanvas.height = faceArea.height;
      const extractCtx = extractedFaceCanvas.getContext('2d');
      
      // Draw only the face region to the new canvas
      extractCtx.drawImage(
        userImg, 
        faceArea.x, faceArea.y, faceArea.width, faceArea.height,
        0, 0, faceArea.width, faceArea.height
      );
      
      // Create an image from the canvas
      const faceImage = new Image();
      faceImage.src = extractedFaceCanvas.toDataURL('image/png');
      
      return new Promise((resolve) => {
        faceImage.onload = () => {
          resolve({ 
            faceImage,
            faceBounds: {
              x: faceArea.x,
              y: faceArea.y,
              width: faceArea.width,
              height: faceArea.height
            },
            hasFace: true
          });
        };
        
        // Add error handling for face image loading
        faceImage.onerror = () => {
          console.error('Error loading extracted face image');
          resolve({
            faceImage: userImg,
            hasFace: false
          });
        };
      });
    } catch (error) {
      console.error('Error extracting face:', error);
      return { 
        faceImage: userImg,
        hasFace: false 
      };
    }
  };

  const generatePoster = async () => {
    try {
      // Create a canvas to combine the template and user's image
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not create canvas context');
      }
      
      // Set canvas size - using a 3:4 aspect ratio to match the frame
      canvas.width = 900;
      canvas.height = 1200;
      
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.log('Poster generation timeout - proceeding with fallback method');
          setIsLoading(false);
          setGeneratedPoster('/images/fallback-poster.png'); // Use a fallback image if possible
        }
      }, 15000); // 15 seconds timeout
      
      try {
        // Load user's processed image (to extract face)
        const userImg = new Image();
        userImg.crossOrigin = 'anonymous';
        userImg.src = processedImage;
        
        // Load the body template image based on gender
        const templateSrc = userGender === 'female' 
          ? '/images/freepik__a-confident-young-indian-woman-with-straight-black__53397 (1).jpeg'
          : '/images/freepik__a-confident-young-indian-man-with-black-hair-weari__53396 (1).jpeg';
          
        console.log(`Using ${userGender} template: ${templateSrc}`);
        
        const templateImg = new Image();
        templateImg.crossOrigin = 'anonymous';
        templateImg.src = templateSrc;
        
        // Load background image
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.src = '/images/BG.png';
        
        // Wait for all images to load with timeout
        await Promise.race([
          Promise.all([
            new Promise(resolve => {
              userImg.onload = resolve;
              userImg.onerror = () => {
                console.error('Failed to load user image');
                resolve(); // Continue even if image fails
              };
            }),
            new Promise(resolve => {
              templateImg.onload = resolve;
              templateImg.onerror = () => {
                console.error('Failed to load template image');
                resolve(); // Continue even if image fails
              };
            }),
            new Promise(resolve => {
              bgImg.onload = resolve;
              bgImg.onerror = () => {
                console.warn('Failed to load background image');
                resolve(); // Continue even if image fails
              };
            })
          ]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Image loading timeout')), 10000))
        ]).catch(error => {
          console.warn('Image loading error or timeout:', error);
          // Keep going despite timeout
        });
        
        // Clear the timeout since images are loaded or timed out
        clearTimeout(timeoutId);
        
        // Extract face from user image
        const { faceImage, hasFace } = await extractFace(userImg);
        
        // Draw the background first (if loaded)
        if (bgImg.complete && bgImg.naturalHeight !== 0) {
          ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        } else {
          // Fallback: fill with a color
          ctx.fillStyle = '#333333';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Calculate position to place the template image in the center
        // Depending on gender, we might need different positioning
        let templateX, templateY, templateWidth, templateHeight;
        
        // Check if template image was loaded successfully
        if (templateImg.complete && templateImg.naturalHeight !== 0) {
          // Position and size for the template (adjust based on gender)
          if (userGender === 'female') {
            // Female template positioning
            templateWidth = canvas.width * 0.9;
            templateHeight = (templateWidth / templateImg.width) * templateImg.height;
            templateX = (canvas.width - templateWidth) / 2;
            templateY = (canvas.height - templateHeight) * 0.55; // Move it down slightly
          } else {
            // Male template positioning
            templateWidth = canvas.width * 0.9;
            templateHeight = (templateWidth / templateImg.width) * templateImg.height;
            templateX = (canvas.width - templateWidth) / 2;
            templateY = (canvas.height - templateHeight) * 0.45;
          }
          
          // Draw the template body on canvas
          ctx.drawImage(templateImg, templateX, templateY, templateWidth, templateHeight);
          
          // If we successfully extracted a face, replace the template face with the user's face
          if (hasFace && faceImage.complete && faceImage.naturalHeight !== 0) {
            // Based on gender, define where the face should be placed on the template
            let faceTargetX, faceTargetY, faceTargetWidth, faceTargetHeight;
            
            if (userGender === 'female') {
              // Position for female face on template
              faceTargetWidth = templateWidth * 0.26;
              faceTargetHeight = faceTargetWidth * (faceImage.height / faceImage.width);
              faceTargetX = templateX + templateWidth * 0.38; // Center the face horizontally
              faceTargetY = templateY + templateHeight * 0.11; // Position at the appropriate height
            } else {
              // Position for male face on template
              faceTargetWidth = templateWidth * 0.25;
              faceTargetHeight = faceTargetWidth * (faceImage.height / faceImage.width);
              faceTargetX = templateX + templateWidth * 0.38; // Center the face horizontally
              faceTargetY = templateY + templateHeight * 0.1; // Position at the appropriate height
            }
            
            try {
              // Draw the user's face in position
              ctx.drawImage(
                faceImage,
                faceTargetX,
                faceTargetY,
                faceTargetWidth,
                faceTargetHeight
              );
              console.log('Face replaced successfully');
            } catch (faceDrawError) {
              console.error('Error drawing face on template:', faceDrawError);
              // Continue without face replacement
            }
          } else {
            console.log('No face detected or face image not loaded, using body template without face replacement');
          }
        } else {
          // If template failed to load, use user image directly
          console.log('Template image failed to load, using user image directly');
          const userWidth = canvas.width * 0.6;
          const userHeight = (userWidth / userImg.width) * userImg.height;
          const userX = (canvas.width - userWidth) / 2;
          const userY = (canvas.height - userHeight) / 2;
          
          // Draw user image in the center of the canvas
          try {
            ctx.drawImage(userImg, userX, userY, userWidth, userHeight);
          } catch (userDrawError) {
            console.error('Error drawing user image:', userDrawError);
            // Continue without user image
          }
        }
        
        // Add tagline at the top
        const tagline = userData.tagline || 'I transform businesses with innovation and expertise';
        
        // Split the tagline into multiple lines if needed
        let taglineLines = [];
        const maxLineLength = 32;
        
        if (tagline.length > maxLineLength) {
          // Break into multiple lines
          const words = tagline.split(' ');
          let currentLine = '';
          
          words.forEach((word) => {
            if ((currentLine + word).length < maxLineLength) {
              currentLine += (currentLine ? ' ' : '') + word;
            } else {
              taglineLines.push(currentLine);
              currentLine = word;
            }
          });
          
          if (currentLine) {
            taglineLines.push(currentLine);
          }
        } else {
          taglineLines = [tagline];
        }
        
        // Tagline styling
        ctx.fillStyle = 'white';
        ctx.font = 'bold 42px Arial';
        ctx.textAlign = 'left';
        
        // Calculate vertical spacing for taglines
        const taglineStartY = canvas.height * 0.15;
        const taglineLineHeight = 55;
        
        taglineLines.forEach((line, index) => {
          ctx.fillText(line, 60, taglineStartY + (index * taglineLineHeight));
        });
        
        // Position for company info circles
        const circleY = canvas.height * 0.38;
        
        // Draw user icon circles (yellow background)
        ctx.beginPath();
        ctx.arc(80, circleY, 30, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFC72C'; // L&T Finance gold/yellow color
        ctx.fill();
        
        // Draw phone icon circle
        ctx.beginPath();
        ctx.arc(80, circleY + 85, 30, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw person icon in the first circle - change based on gender
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px Arial';
        
        // Use different icon based on gender
        if (userGender === 'female') {
          ctx.fillText('👩', 68, circleY + 8); // Female icon
        } else if (userGender === 'male') {
          ctx.fillText('👨', 68, circleY + 8); // Male icon
        } else {
          ctx.fillText('👤', 68, circleY + 8); // Generic person icon
        }
        
        // Draw phone icon in the second circle
        ctx.fillText('📞', 68, circleY + 93);
        
        // Draw company info text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(userData.companyName || 'Your Company Name', 130, circleY - 15);
        ctx.font = '22px Arial';
        ctx.fillText(userData.industry || 'Your Business Type', 130, circleY + 15);
        
        // Phone number
        ctx.font = 'bold 28px Arial';
        ctx.fillText(userData.phoneNumber || 'Your Phone Number', 130, circleY + 95);
        
        // Name at the bottom
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(userData.name || 'Your Name', canvas.width / 2, canvas.height - 50);
        
        // Convert canvas to image
        const posterUrl = canvas.toDataURL('image/png');
        setGeneratedPoster(posterUrl);
        
      } catch (renderError) {
        console.error('Error rendering poster:', renderError);
        // Fallback to simpler layout if rendering fails
        
        try {
          // Clear canvas and start with a plain background
          ctx.fillStyle = '#333333';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add text details
          ctx.fillStyle = 'white';
          ctx.font = 'bold 36px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(userData.name || 'Your Name', canvas.width / 2, 200);
          
          ctx.font = 'bold 28px Arial';
          ctx.fillText(userData.companyName || 'Your Company Name', canvas.width / 2, 300);
          
          ctx.font = '24px Arial';
          ctx.fillText(userData.industry || 'Your Industry', canvas.width / 2, 350);
          
          ctx.font = '24px Arial';
          ctx.fillText(userData.phoneNumber || 'Your Phone Number', canvas.width / 2, 450);
          
          // Add tagline
          ctx.font = 'italic 28px Arial';
          const tagline = userData.tagline || 'Your Tagline';
          const words = tagline.split(' ');
          let line = '';
          let y = 550;
          
          words.forEach(word => {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > canvas.width - 100 && line !== '') {
              ctx.fillText(line, canvas.width / 2, y);
              line = word + ' ';
              y += 40;
            } else {
              line = testLine;
            }
          });
          ctx.fillText(line, canvas.width / 2, y);
          
          // Add L&T branding
          ctx.font = 'bold 36px Arial';
          ctx.fillText('L&T Finance', canvas.width / 2, canvas.height - 100);
          
          // Convert canvas to image
          const posterUrl = canvas.toDataURL('image/png');
          setGeneratedPoster(posterUrl);
          
        } catch (fallbackError) {
          console.error('Error with fallback rendering:', fallbackError);
          // Set an error message as the final fallback
          setError('Failed to generate poster. Please try again.');
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error in poster generation main process:', err);
      setError('Failed to generate poster. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedPoster) return;
    
    // Create a temporary link for downloading
    const link = document.createElement('a');
    link.href = generatedPoster;
    link.download = 'lt-finance-poster.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMakeAnother = () => {
    navigate('/add-details');
  };

  return (
    <div className="share-poster-page" style={{ backgroundImage: 'url("/images/BG.png")' }}>
      {isLoading ? (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Generating your poster...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button 
            className="make-another-btn" 
            onClick={handleMakeAnother}
          >
            <i className="fas fa-redo-alt"></i> Try Again
          </button>
        </div>
      ) : (
        <div className="share-poster-content">
          {/* Left side - Poster with base template image */}
          <div className="poster-container">
            <div className="poster-frame">
              <div className="content-area">
                {generatedPoster ? (
                  <img 
                    src={generatedPoster} 
                    alt="Your Poster" 
                    className="generated-poster"
                  />
                ) : (
                  <div className="poster-placeholder">
                    <p>Creating your poster...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right side - Controls section */}
          <div className="controls-section">
            <h1 className="section-title">Here's Your Gamechanger Moment!</h1>
            <p className="section-subtitle">
              Your poster featuring your image is ready to share, print, flex, and go viral.
            </p>
            
            <button className="download-btn" onClick={handleDownload}>
              <i className="fas fa-download"></i> Download
            </button>
            
            <div className="another-shot">
              <p className="another-shot-text">Wanna give it another shot?</p>
              <button className="make-another-btn" onClick={handleMakeAnother}>
                <i className="fas fa-redo-alt"></i> Make Another One
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden canvases for poster generation and face extraction */}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      <canvas ref={faceCanvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
};

export default SharePoster; 