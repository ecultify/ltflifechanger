import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/SharePoster.css';

const SharePoster = () => {
  const navigate = useNavigate();
  const [processedImage, setProcessedImage] = useState(null);
  const [userData, setUserData] = useState({});
  const [generatedPoster, setGeneratedPoster] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userGender, setUserGender] = useState('unknown');
  const canvasRef = useRef(null);

  useEffect(() => {
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
      
      // Load the template image (base image)
      // We could use different templates based on gender, but for now we'll use the same template
      const templateImg = new Image();
      templateImg.crossOrigin = 'anonymous';
      templateImg.src = '/images/mage.jpg';
      
      // Load the user's processed image
      const userImg = new Image();
      userImg.crossOrigin = 'anonymous';
      userImg.src = processedImage;
      
      // Wait for both images to load
      await Promise.all([
        new Promise(resolve => {
          templateImg.onload = resolve;
          templateImg.onerror = () => {
            setError('Failed to load template image.');
            resolve();
          };
        }),
        new Promise(resolve => {
          userImg.onload = resolve;
          userImg.onerror = () => {
            setError('Failed to load user image.');
            resolve();
          };
        })
      ]);
      
      // Draw the template image to fill the entire canvas
      ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
      
      // Calculate position to place user image (to the left side)
      const userImgWidth = userImg.width;
      const userImgHeight = userImg.height;
      
      // Adjust scale based on gender - we could make women slightly smaller or men slightly larger
      // This is just an example of how gender information could be used
      let scaleFactorWidth = 0.65;  // Default for male or unknown
      let scaleFactorHeight = 0.85; // Default for male or unknown
      
      // If user is female, adjust the scale/position slightly
      if (userGender === 'female') {
        scaleFactorWidth = 0.62;  // Slightly smaller width for women
        scaleFactorHeight = 0.82; // Slightly smaller height for women
        console.log('Applying female-specific poster adjustments');
      } else {
        console.log('Applying male/default poster adjustments');
      }
      
      // Apply the gender-specific scale factors
      const scale = Math.min(
        (canvas.width * scaleFactorWidth) / userImgWidth,
        (canvas.height * scaleFactorHeight) / userImgHeight
      );
      
      const scaledWidth = userImgWidth * scale;
      const scaledHeight = userImgHeight * scale;
      
      // Position image on the left side
      // We can also adjust position based on gender
      const x = canvas.width * 0.06 - 40; // Push the image 40px to the left
      
      // Adjust y position based on gender - this is just an example
      let y;
      if (userGender === 'female') {
        // For women, position slightly higher
        y = canvas.height - scaledHeight + 20;
      } else {
        // For men or unknown, position at the bottom
        y = canvas.height - scaledHeight;
      }
      
      // Draw the user image
      ctx.drawImage(userImg, x, y, scaledWidth, scaledHeight);
      
      // Add tagline at the top
      const tagline = userData.tagline || 'I transform businesses with innovation and expertise';
      
      // Split the tagline into multiple lines if needed
      let taglineLines = [];
      // Reduce max line length to ensure tagline doesn't overflow
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
        // Short enough for one line
        taglineLines = [tagline];
      }
      
      // Tagline formatting - adjust color slightly based on gender
      if (userGender === 'female') {
        // Slightly softer white for women
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      } else {
        // Standard white for men
        ctx.fillStyle = 'white';
      }
      
      ctx.font = 'bold 42px Arial'; // Slightly smaller font to prevent overflow
      ctx.textAlign = 'left';
      
      // Calculate vertical spacing for taglines
      const taglineStartY = canvas.height * 0.12;
      const taglineLineHeight = 55; // Reduce line height slightly
      
      taglineLines.forEach((line, index) => {
        ctx.fillText(line, 60, taglineStartY + (index * taglineLineHeight));
      });
      
      // Position for company info circles
      const circleY = canvas.height * 0.42 - 45;
      
      // Calculate space between tagline and company info
      const taglineEndY = taglineStartY + (taglineLines.length * taglineLineHeight);
      const minSpacing = 50;
      
      // Adjust company info position if needed
      const adjustedCircleY = Math.max(circleY, taglineEndY + minSpacing);
      
      // Draw user icon circles (yellow background)
      ctx.beginPath();
      ctx.arc(80, adjustedCircleY, 30, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFC72C'; // L&T Finance gold/yellow color
      ctx.fill();
      
      // Draw phone icon circle
      ctx.beginPath();
      ctx.arc(80, adjustedCircleY + 85, 30, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw person icon in the first circle - change based on gender
      ctx.fillStyle = 'black';
      ctx.font = 'bold 24px Arial';
      
      // Use different icon based on gender
      if (userGender === 'female') {
        ctx.fillText('👩', 68, adjustedCircleY + 8); // Female icon
      } else if (userGender === 'male') {
        ctx.fillText('👨', 68, adjustedCircleY + 8); // Male icon
      } else {
        ctx.fillText('👤', 68, adjustedCircleY + 8); // Generic person icon
      }
      
      // Draw phone icon in the second circle
      ctx.fillText('📞', 68, adjustedCircleY + 93);
      
      // Draw company info text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(userData.companyName || 'Your Company Name', 130, adjustedCircleY - 15);
      ctx.font = '22px Arial';
      ctx.fillText(userData.industry || 'Your Business Type', 130, adjustedCircleY + 15);
      
      // Phone number
      ctx.font = 'bold 28px Arial';
      ctx.fillText(userData.phoneNumber || 'Your Phone Number', 130, adjustedCircleY + 95);
      
      // Convert canvas to image
      const posterUrl = canvas.toDataURL('image/png');
      setGeneratedPoster(posterUrl);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error generating poster:', err);
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
      
      {/* Hidden canvas for poster generation */}
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
      ></canvas>
    </div>
  );
};

export default SharePoster; 