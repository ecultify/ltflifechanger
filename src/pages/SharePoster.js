import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/SharePoster.css';
import Loader from '../components/Loader';
import { loadFaceDetectionModels, getOptimalImagePlacement } from '../utils/faceDetection';

// Try to load face detection models early
loadFaceDetectionModels().catch(err => {
  console.warn('Face detection models could not be preloaded in SharePoster:', err);
});

const SharePoster = () => {
  const navigate = useNavigate();
  const [processedImage, setProcessedImage] = useState(null);
  const [userData, setUserData] = useState({});
  const [generatedPoster, setGeneratedPoster] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('Loading data...');
  const canvasRef = useRef(null);

  // Define generatePoster with useCallback before it's used in useEffect
  const generatePoster = useCallback(async () => {
    // Track if we're still processing to avoid duplicate states
    let isProcessing = true;
    
    // Create a timeout that will force completion if the process takes too long
    const timeoutId = setTimeout(() => {
      if (isProcessing) {
        console.log('Poster generation timeout - completing with available data');
        setGeneratedPoster('/images/fallback-poster.png');
        setIsLoading(false);
        isProcessing = false;
      }
    }, 15000); // 15 seconds timeout
    
    try {
      setLoadingStatus('Setting up poster...');
      // Create a canvas to combine the template and user's image
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error('Canvas ref is null');
        clearTimeout(timeoutId);
        setError('Could not create poster canvas.');
        setIsLoading(false);
        isProcessing = false;
        return;
      }
      
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Could not create canvas context');
        clearTimeout(timeoutId);
        setError('Could not create poster canvas context.');
        setIsLoading(false);
        isProcessing = false;
        return;
      }
      
      // Set canvas size - using a 3:4 aspect ratio to match the frame
      canvas.width = 900;
      canvas.height = 1200;
      
      try {
        // Load user's image
        setLoadingStatus('Loading your image...');
        const userImg = new Image();
        userImg.crossOrigin = 'anonymous';
        userImg.src = processedImage;
        
        // Load the template image with Bumrah
        const templateSrc = '/images/mage.jpg';
          
        console.log(`Using template: ${templateSrc}`);
        
        setLoadingStatus('Loading template image...');
        const templateImg = new Image();
        templateImg.crossOrigin = 'anonymous';
        templateImg.src = templateSrc;
        
        // Wait for all images to load with timeout
        setLoadingStatus('Processing images...');
        try {
          await Promise.race([
            Promise.all([
              new Promise((resolve, reject) => {
                userImg.onload = resolve;
                userImg.onerror = () => {
                  console.error('Failed to load user image');
                  resolve(); // Continue even if image fails
                };
                // Set safety timeout
                setTimeout(() => {
                  if (!userImg.complete) resolve();
                }, 5000);
              }),
              new Promise((resolve, reject) => {
                templateImg.onload = resolve;
                templateImg.onerror = () => {
                  console.error('Failed to load template image');
                  resolve(); // Continue even if image fails
                };
                // Set safety timeout
                setTimeout(() => {
                  if (!templateImg.complete) resolve();
                }, 5000);
              })
            ]),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Image loading timeout')), 10000))
          ]).catch(error => {
            console.warn('Image loading error or timeout:', error);
            // Keep going despite timeout
          });
        } catch (imageError) {
          console.error('Error loading images:', imageError);
          // Continue with what we have
        }
        
        // Draw the template (Bumrah image) as background
        setLoadingStatus('Creating your poster...');
        if (templateImg.complete && templateImg.naturalHeight !== 0) {
          try {
            // Draw the template on the full canvas
            ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
          } catch (e) {
            console.error('Error drawing template:', e);
            ctx.fillStyle = '#333333';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        } else {
          // Fallback: fill with a color
          ctx.fillStyle = '#333333';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Now place the user's image to the left of Bumrah using face detection
        if (userImg.complete && userImg.naturalHeight !== 0) {
          try {
            // Define the target area for user image placement with fixed top position
            const targetArea = {
              x: (canvas.width * 0.08) - 40, // Left position
              y: canvas.height * 0.6,        // Fixed top position (60% down the canvas)
              width: canvas.width * 0.4,      // 40% of canvas width
              height: canvas.height * 0.4     // 40% of canvas height
            };
            
            console.log('Using fixed-top target area:', targetArea);
            
            // Get original image dimensions
            const userImgWidth = userImg.width;
            const userImgHeight = userImg.height;
            console.log('Original image dimensions:', { width: userImgWidth, height: userImgHeight });
            
            // Use direct placement with the improved sizing and positioning
            // Make the user image bigger
            const scale = Math.min(
              (canvas.width * 0.55) / userImgWidth, // Increased width from 0.5 to 0.55
              (canvas.height * 0.98) / userImgHeight // Increased height from 0.95 to 0.98
            );
            
            const scaledWidth = userImgWidth * scale;
            const scaledHeight = userImgHeight * scale;
            
            // Position to place user on the left side of Bumrah
            // Position is adjusted to push the image to the left and lower on the canvas
            const userX = (canvas.width * 0.08) - 80; // Moved 80px to the left (40px more than before)
            // Position vertically (adjust to move down further)
            const userY = (canvas.height - scaledHeight) + 90; // Push down by 90px from neutral position
            
            // Apply the calculated placement
            console.log('Positioning image using direct placement at:', { x: userX, y: userY, width: scaledWidth, height: scaledHeight });
            
            // Create an offscreen canvas for applying tint
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = scaledWidth;
            offscreenCanvas.height = scaledHeight;
            const offCtx = offscreenCanvas.getContext('2d');
            
            // Draw the user's image to the offscreen canvas
            offCtx.drawImage(userImg, 0, 0, scaledWidth, scaledHeight);
            
            // Apply a subtle black tint (adjust alpha for intensity)
            offCtx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // Black with 15% opacity
            offCtx.fillRect(0, 0, scaledWidth, scaledHeight);
            
            // Draw the tinted image to the main canvas
            ctx.drawImage(offscreenCanvas, userX, userY, scaledWidth, scaledHeight);
            
            console.log('User image placed successfully with tint overlay');
          } catch (imageDrawError) {
            console.error('Error drawing user image:', imageDrawError);
            // Continue without user image placement
          }
        }
        
        setLoadingStatus('Adding text elements...');
        
        try {
          // Add tagline at the top
          const tagline = userData.tagline || 'I transform businesses with innovation and expertise';
          
          // Split the tagline into multiple lines if needed
          let taglineLines = [];
          const maxLineLength = 29; // Reduced slightly to accommodate larger font
          
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
          
          // Get selected keywords from session storage (or default to empty array)
          let selectedKeywords = [];
          try {
            const storedKeywords = sessionStorage.getItem('selectedKeywords');
            if (storedKeywords) {
              selectedKeywords = JSON.parse(storedKeywords);
            }
          } catch (e) {
            console.error('Error parsing selected keywords:', e);
          }
          
          // Tagline styling - using Poppins font and increased font size by 3.5
          ctx.fillStyle = 'white';
          ctx.font = 'bold 45.5px Poppins, sans-serif'; // Increased from 42px to 45.5px (42 + 3.5)
          ctx.textAlign = 'left';
          
          // Calculate vertical spacing for taglines
          const taglineStartY = canvas.height * 0.15;
          const taglineLineHeight = 55;
          
          // Function to handle drawing text with certain words in bold
          const drawTextWithBoldedWords = (line, x, y, keywords) => {
            // Measure total width for proper spacing calculations
            const words = line.split(' ');
            let currentX = x;
            
            words.forEach((word, index) => {
              // Check if this word is a keyword that should be bold
              const isKeyword = keywords.some(keyword => 
                word.toLowerCase().includes(keyword.toLowerCase()) ||
                keyword.toLowerCase().includes(word.toLowerCase())
              );
              
              // Set appropriate font weight
              if (isKeyword) {
                ctx.font = 'bold 45.5px Poppins, sans-serif';
              } else {
                ctx.font = '45.5px Poppins, sans-serif';
              }
              
              // Draw the word
              ctx.fillText(word, currentX, y);
              
              // Move x position for next word (add space width)
              const wordWidth = ctx.measureText(word).width;
              const spaceWidth = ctx.measureText(' ').width;
              currentX += wordWidth + spaceWidth;
            });
          };
          
          // Draw each line with keywords bolded
          taglineLines.forEach((line, index) => {
            drawTextWithBoldedWords(line, 60, taglineStartY + (index * taglineLineHeight), selectedKeywords);
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
          
          // Draw person icon in the first circle
          ctx.fillStyle = 'black';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('👤', 80, circleY + 8); // Centered the icon
          
          // Draw phone icon in the second circle
          ctx.fillText('📞', 80, circleY + 93); // Centered the icon
          
          // Draw company info text - properly aligned vertically with icons
          ctx.fillStyle = 'white';
          ctx.font = 'bold 28px Arial';
          ctx.textAlign = 'left';
          
          // Company name - moved up but still aligned with its icon
          ctx.fillText(userData.companyName || 'Your Company Name', 130, circleY - 5); // Moved up from circleY + 8
          
          // Industry - moved up along with company name
          ctx.font = '22px Arial';
          ctx.fillText(userData.industry || 'Your Business Type', 130, circleY + 25); // Moved up from circleY + 40
          
          // Phone number - vertically centered with its icon
          // Format phone number to remove +91 if present
          let phoneNumber = userData.phoneNumber || 'Your Phone Number';
          if (phoneNumber.includes('+91')) {
            phoneNumber = phoneNumber.replace('+91', '').trim();
          }
          
          ctx.font = 'bold 28px Arial';
          ctx.fillText(phoneNumber, 130, circleY + 93); // Kept the same position
          
          // Name at bottom removed as requested
        } catch (textError) {
          console.error('Error adding text to poster:', textError);
        }
        
        // Convert canvas to image
        setLoadingStatus('Finalizing your poster...');
        try {
          const posterUrl = canvas.toDataURL('image/png');
          if (posterUrl) {
            setGeneratedPoster(posterUrl);
          } else {
            throw new Error('Failed to generate poster image');
          }
        } catch (dataUrlError) {
          console.error('Error creating data URL:', dataUrlError);
          throw dataUrlError;
        }
        
      } catch (renderError) {
        console.error('Error rendering poster:', renderError);
        // Fallback to simpler layout if rendering fails
        
        try {
          setLoadingStatus('Creating simplified poster...');
          // Clear canvas and start with a plain background
          ctx.fillStyle = '#333333';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add text details
          ctx.fillStyle = 'white';
          ctx.font = 'bold 36px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(userData.companyName || 'Your Company Name', canvas.width / 2, 200);
          
          ctx.font = '24px Arial';
          ctx.fillText(userData.industry || 'Your Industry', canvas.width / 2, 250);
          
          // Format phone number to remove +91 if present
          let phoneNumber = userData.phoneNumber || 'Your Phone Number';
          if (phoneNumber.includes('+91')) {
            phoneNumber = phoneNumber.replace('+91', '').trim();
          }
          
          ctx.font = '24px Arial';
          ctx.fillText(phoneNumber, canvas.width / 2, 350);
          
          // Add tagline with Poppins font
          ctx.font = 'italic 31.5px Poppins, sans-serif'; // Increased from 28px to 31.5px (28 + 3.5)
          const tagline = userData.tagline || 'Your Tagline';
          const words = tagline.split(' ');
          let line = '';
          let y = 450;
          
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
          try {
            const posterUrl = canvas.toDataURL('image/png');
            setGeneratedPoster(posterUrl);
          } catch (fallbackUrlError) {
            console.error('Error creating fallback data URL:', fallbackUrlError);
            throw fallbackUrlError;
          }
          
        } catch (fallbackError) {
          console.error('Error with fallback rendering:', fallbackError);
          throw fallbackError;
        }
      }
      
      clearTimeout(timeoutId);
      isProcessing = false;
      setIsLoading(false);
    } catch (err) {
      console.error('Error in poster generation main process:', err);
      setError('Failed to generate poster. Please try again.');
      clearTimeout(timeoutId);
      isProcessing = false;
      setIsLoading(false);
    }
  }, [processedImage, userData]);

  useEffect(() => {
    // Load data from sessionStorage when component mounts
    setLoadingStatus('Loading your data...');
    
    // Ensure Poppins font is loaded
    const ensurePoppinsFont = () => {
      // Check if the font is already added to the document
      const existingLink = document.querySelector('link[href*="fonts.googleapis.com/css2?family=Poppins"]');
      
      if (!existingLink) {
        // Create link element for Poppins font
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
        document.head.appendChild(fontLink);
        
        // Create a span element to trigger font loading
        const span = document.createElement('span');
        span.style.fontFamily = 'Poppins, sans-serif';
        span.style.visibility = 'hidden';
        span.textContent = 'Font loader';
        document.body.appendChild(span);
        
        // Remove the span after a short delay
        setTimeout(() => {
          if (span && document.body.contains(span)) {
            document.body.removeChild(span);
          }
        }, 500);
      }
    };
    
    ensurePoppinsFont();
    
    try {
      const storedUserData = sessionStorage.getItem('userData');
      const storedImageData = sessionStorage.getItem('processedImage');
      
      if (storedUserData && storedImageData) {
        setUserData(JSON.parse(storedUserData));
        setProcessedImage(storedImageData);
      } else {
        setError('No data found. Please upload a photo first.');
        navigate('/upload');
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load your data. Please try again.');
      navigate('/upload');
    }
  }, [navigate]);

  useEffect(() => {
    if (processedImage && userData) {
      generatePoster();
    }
  }, [processedImage, userData, generatePoster]);

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
          <Loader message={loadingStatus} />
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
      
      {/* Hidden canvases for poster generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
};

export default SharePoster;