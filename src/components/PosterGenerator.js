import React, { useEffect, useState } from 'react';

// Main template is the L&T image with Bumrah
const LT_TEMPLATE_IMAGE = '/images/mage.jpg';

// Component for generating the poster
const PosterGenerator = ({ 
  userData = {}, 
  processedImage,
  onPosterGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Generate poster when component mounts or when inputs change
  useEffect(() => {
    if (processedImage && userData) {
      generatePoster();
    }
  }, [processedImage, userData]);

  const generatePoster = async () => {
    if (!processedImage) {
      setError('No photo available to generate poster.');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Create a canvas to combine the frame and user's image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not create canvas context');
      }
      
      // Set canvas size to match template dimensions
      canvas.width = 1040;
      canvas.height = 1200;
      
      // Load the template image (L&T with Bumrah)
      const templateImg = new Image();
      templateImg.crossOrigin = 'anonymous';
      
      // Load the user's processed image
      const userImg = new Image();
      userImg.crossOrigin = 'anonymous';
      
      // Wait for both images to load
      await new Promise((resolve, reject) => {
        templateImg.onload = () => {
          userImg.onload = () => {
            // Draw the template on the canvas
            ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
            
            // Calculate position to place user image to the left of Bumrah
            const userImgWidth = userImg.width;
            const userImgHeight = userImg.height;
            
            // Use fixed dimensions instead of scaling
            const fixedWidth = 200;  // Fixed width in pixels
            const fixedHeight = 250; // Fixed height in pixels
            
            console.log('Original image dimensions:', { width: userImgWidth, height: userImgHeight });
            console.log('Using fixed dimensions:', { width: fixedWidth, height: fixedHeight });
            
            // Fixed position in pixels
            const x = 100; // Fixed position from left
            const y = 1100; // Fixed position from top - pushed down by 100px (was 700)
            
            console.log('Positioning at fixed coordinates:', { x, y });
            
            // Draw the user image with fixed dimensions
            ctx.drawImage(userImg, x, y, fixedWidth, fixedHeight);
            
            // Draw a border around the image to make it more visible (for debugging)
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, fixedWidth, fixedHeight);
            
            // Add tagline at the top
            const tagline = userData.tagline || 'Believed in myself, took the right steps, and success followed';
            
            // Split the tagline into multiple lines if needed
            let taglineLines = [];
            const maxLineLength = 40;
            
            if (tagline.length > 35) {
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

            // Tagline formatting (white, large, bold text)
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'left';
            
            // Calculate vertical spacing for taglines
            const taglineStartY = canvas.height * 0.12;
            const taglineLineHeight = 60;
            
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
            
            // Draw person icon in the first circle
            ctx.fillStyle = 'black';
            ctx.font = 'bold 24px Arial';
            ctx.fillText('👤', 68, adjustedCircleY + 8);
            
            // Draw phone icon in the second circle
            ctx.fillText('📞', 68, adjustedCircleY + 93);
            
            // Draw company info text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(userData.companyName || 'Your Company Name', 130, adjustedCircleY - 15);
            ctx.font = '22px Arial';
            ctx.fillText(userData.businessType || userData.industry || 'Your Business Type', 130, adjustedCircleY + 15);
            
            // Phone number
            ctx.font = 'bold 28px Arial';
            ctx.fillText(userData.phoneNumber || 'Your Phone Number', 130, adjustedCircleY + 95);
            
            // Convert the composite image to data URL
            const compositeImageUrl = canvas.toDataURL('image/png');
            
            // Call the callback with the generated poster
            if (onPosterGenerated) {
              onPosterGenerated(compositeImageUrl);
            }
            
            resolve();
          };
          userImg.onerror = reject;
          userImg.src = processedImage;
        };
        templateImg.onerror = reject;
        templateImg.src = LT_TEMPLATE_IMAGE;
      });
    } catch (err) {
      console.error('Error generating poster:', err);
      setError('Failed to generate poster. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'none' }}>
      {/* This component doesn't render anything visible */}
      {error && <div>{error}</div>}
      {isGenerating && <div>Generating poster...</div>}
    </div>
  );
};

export default PosterGenerator;