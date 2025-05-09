import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/SharePoster.css';
import Loader from '../components/Loader';
import CTABannerCarousel from '../components/CTABannerCarousel';
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
  const preloadedTemplateRef = useRef(null); // Ref to store preloaded image
  
  // This will be replaced with actual banner data in the future
  const [ctaBanners, setCtaBanners] = useState([
    { id: 'banner1', name: '1copy.png' },
    { id: 'banner2', name: '2copy.png' },
    { id: 'banner3', name: '3copy.png' },
    { id: 'banner4', name: '4copy.png' },
    { id: 'banner5', name: '5copy.png' }
  ]);

  // Preload the template image when component mounts
  useEffect(() => {
    const preloadTemplateImage = async () => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        // Try different paths to preload the template
        const paths = [
          `${window.location.origin}/images/mage.jpg`,
          '/images/mage.jpg',
          'images/mage.jpg',
          `${window.location.origin}/images/template.jpg`,
          '/images/template.jpg',
          'images/template.jpg'
        ];
        
        // Function to try loading with each path
        const tryLoadingWithPath = (index) => {
          if (index >= paths.length) {
            console.error('All template image paths failed to load');
            return;
          }
          
          img.onload = () => {
            console.log(`Template image preloaded successfully from: ${paths[index]}`);
            preloadedTemplateRef.current = img;
          };
          
          img.onerror = () => {
            console.warn(`Failed to preload template image from: ${paths[index]}`);
            // Try next path
            tryLoadingWithPath(index + 1);
          };
          
          img.src = paths[index];
        };
        
        // Start trying with first path
        tryLoadingWithPath(0);
      } catch (error) {
        console.error('Error preloading template image:', error);
      }
    };
    
    preloadTemplateImage();
  }, []);

  // Define generatePoster with useCallback before it's used in useEffect
  const generatePoster = useCallback(async () => {
    console.log('Starting poster generation with following requirements:');
    console.log('- User image should match Bumrah height');
    console.log('- User image should be pushed up by 3px');
    console.log('- Processing flow: tint → enhance → remove bg → place on poster');

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
        // Use absolute URL path to ensure correct loading across all environments
        const templateSrc = `${window.location.origin}/images/mage.jpg`;
          
        console.log(`Using template: ${templateSrc}`);
        
        setLoadingStatus('Loading template image...');
        let templateImg;
        
        // Use preloaded template image if available
        if (preloadedTemplateRef.current && 
            preloadedTemplateRef.current.complete && 
            preloadedTemplateRef.current.naturalHeight !== 0) {
          console.log('Using preloaded template image');
          templateImg = preloadedTemplateRef.current;
        } else {
          // Otherwise load a new image
          templateImg = new Image();
          templateImg.crossOrigin = 'anonymous';
          templateImg.src = templateSrc;
          
          // Add error handling for template image loading
          templateImg.onerror = () => {
            console.error('Failed to load template image, trying alternate path');
            // Try without window.location.origin as a fallback
            templateImg.src = '/images/mage.jpg';
            
            // If that also fails, try a relative path
            templateImg.onerror = () => {
              console.error('Still failed to load template image, using relative path');
              templateImg.src = 'images/mage.jpg';
              
              // If that still fails, try the backup template file
              templateImg.onerror = () => {
                console.error('All mage.jpg paths failed, trying template.jpg');
                templateImg.src = '/images/template.jpg';
                
                // Last attempt with relative path
                templateImg.onerror = () => {
                  console.error('Even template.jpg failed, using final fallback');
                  templateImg.src = 'images/template.jpg';
                };
              };
            };
          };
        }
        
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
            console.log('Template image drawn successfully');
          } catch (e) {
            console.error('Error drawing template:', e);
            // Try to reload the image one more time with a direct approach
            try {
              console.log('Attempting to reload template image directly...');
              // Create a new image object and try again
              const retryImg = new Image();
              retryImg.crossOrigin = 'anonymous';
              retryImg.src = 'images/mage.jpg'; // Try the simple relative path
              
              // Wait briefly for the image to load
              await new Promise((resolve) => {
                retryImg.onload = resolve;
                retryImg.onerror = resolve; // Continue even if error
                setTimeout(resolve, 2000); // Max wait of 2 seconds
              });
              
              if (retryImg.complete && retryImg.naturalHeight !== 0) {
                ctx.drawImage(retryImg, 0, 0, canvas.width, canvas.height);
                console.log('Template image drawn successfully on retry');
              } else {
                throw new Error('Retry failed, using fallback color');
              }
            } catch (retryError) {
              console.error('Retry also failed:', retryError);
              ctx.fillStyle = '#0a1a34'; // Navy blue background as fallback
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
          }
        } else {
          // Fallback: fill with a color
          console.warn('Template image failed to load, using fallback background');
          ctx.fillStyle = '#0a1a34'; // Navy blue background as fallback
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw L&T Finance logo as a fallback
          try {
            const logoImg = new Image();
            logoImg.crossOrigin = 'anonymous';
            logoImg.src = `${window.location.origin}/images/l&tlogo.png`;
            
            // Wait briefly for the logo to load
            await new Promise((resolve) => {
              logoImg.onload = resolve;
              logoImg.onerror = resolve; // Continue even if error
              setTimeout(resolve, 1000); // Max wait of 1 second
            });
            
            if (logoImg.complete && logoImg.naturalHeight !== 0) {
              // Draw logo at the top center
              const logoWidth = canvas.width * 0.3;
              const logoHeight = logoWidth * (logoImg.height / logoImg.width);
              ctx.drawImage(
                logoImg,
                (canvas.width - logoWidth) / 2,
                canvas.height * 0.1,
                logoWidth,
                logoHeight
              );
              console.log('Logo drawn as fallback');
            }
          } catch (logoError) {
            console.error('Error drawing fallback logo:', logoError);
          }
        }
        
        // Now place the user's image to the left of Bumrah with same height as Bumrah
        if (userImg.complete && userImg.naturalHeight !== 0) {
          try {
            // Get original image dimensions
            const userImgWidth = userImg.width;
            const userImgHeight = userImg.height;
            console.log('Original image dimensions:', { width: userImgWidth, height: userImgHeight });
            
            // Calculate Bumrah's approximate height in the template
            // Using the full template height (with some small margins)
            const bumrahHeight = canvas.height * 0.75; // Approximate height of Bumrah on the poster
            
            // Calculate scale to make user image 75% of Bumrah's height, preserving aspect ratio
            const heightScale = (bumrahHeight * 0.75) / userImgHeight; // Make user image 75% of Bumrah's height (reduced from 90%)
            const scaledWidth = userImgWidth * heightScale;
            const scaledHeight = bumrahHeight * 0.75; // 75% of Bumrah's height
            
            console.log('Scaling to match Bumrah height:', { heightScale, scaledWidth, scaledHeight });
            
            // Position to place user on the left side of Bumrah
            // Position is adjusted to push the image further to the left (35px more than before)
            const userX = (canvas.width * 0.08) - 115; // Left position (moved 35px more to the left)
            
            // Position vertically to align with Bumrah with adjusted height
            const userY = (canvas.height - scaledHeight) + 110; // Adjusted position for smaller image
            
            // Apply the calculated placement
            console.log('Positioning image at:', { x: userX, y: userY, width: scaledWidth, height: scaledHeight });
            
            // Create an offscreen canvas for applying tint and enhancements
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = scaledWidth;
            offscreenCanvas.height = scaledHeight;
            const offCtx = offscreenCanvas.getContext('2d');
            
            // 1. Draw the user's image to the offscreen canvas
            offCtx.drawImage(userImg, 0, 0, scaledWidth, scaledHeight);
            
            // Black tint has been removed as requested
            
            // 3. Apply basic image enhancement (contrast and brightness)
            try {
              // Get image data for manipulation
              const imageData = offCtx.getImageData(0, 0, scaledWidth, scaledHeight);
              const data = imageData.data;
              
              // Increase contrast and brightness slightly
              const contrast = 1.1; // Subtle contrast boost
              const brightness = 5;  // Slight brightness boost
              
              for (let i = 0; i < data.length; i += 4) {
                // Apply contrast and brightness
                data[i] = Math.min(255, Math.max(0, ((data[i] - 128) * contrast) + 128 + brightness));          // red
                data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - 128) * contrast) + 128 + brightness));  // green
                data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - 128) * contrast) + 128 + brightness));  // blue
              }
              
              // Put the enhanced image data back
              offCtx.putImageData(imageData, 0, 0);
              console.log('Image enhancement applied');
            } catch (enhanceError) {
              console.error('Error enhancing image:', enhanceError);
              // Continue with unenhanced image if enhancement fails
            }
            
            // 4. Now draw the processed image to the main canvas
            // Note: Background removal is assumed to be already done in the processedImage
            ctx.drawImage(offscreenCanvas, userX, userY, scaledWidth, scaledHeight);
            
            console.log('User image placed successfully with enhancements');
          } catch (imageDrawError) {
            console.error('Error drawing user image:', imageDrawError);
            // Continue without user image placement
          }
        }
        
        setLoadingStatus('Adding text elements...');
        
        try {
          // Add tagline at the top
          // Remove any leftover asterisks before processing the tagline
          let tagline = userData.tagline || 'I transform businesses with innovation and expertise';
          // Keep asterisks for highlighting in drawTextWithBoldedWords function
          
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
          ctx.fillStyle = 'white'; // Always use white color for tagline text
          ctx.font = 'bold 45.5px Poppins, sans-serif'; // Increased from 42px to 45.5px (42 + 3.5)
          ctx.textAlign = 'left';
          
          // Calculate vertical spacing for taglines - moved up by 50px total
          const taglineStartY = canvas.height * 0.10; // Further reduced from 0.12 to move up by another 20px
          const taglineLineHeight = 55;
          
          // Function to handle drawing text with certain words in bold
          const drawTextWithBoldedWords = (line, x, y, keywords) => {
            // Process the text to handle asterisk-highlighted words
            // First, split the line into segments (words and possibly with asterisks)
            const segments = line.split(' ');
            let currentX = x;
            
            segments.forEach((segment, index) => {
              // Check if this segment has asterisks for highlighting
              const hasAsterisks = segment.includes('*');
              
              // Clean up the segment (remove asterisks) for display
              const cleanSegment = segment.replace(/\*/g, '');
              
              // Determine if word should be bold (either contains asterisks or matches keywords)
              const isKeyword = hasAsterisks || keywords.some(keyword => 
                cleanSegment.toLowerCase().includes(keyword.toLowerCase()) ||
                keyword.toLowerCase().includes(cleanSegment.toLowerCase())
              );
              
              // Set appropriate font weight
              if (isKeyword) {
                ctx.font = 'bold 45.5px Poppins, sans-serif';
                ctx.fillStyle = 'white'; // Changed to white for better visibility
              } else {
                ctx.font = '45.5px Poppins, sans-serif';
                ctx.fillStyle = 'white'; // Changed to white for better visibility
              }
              
              // Draw the cleaned word (without asterisks)
              ctx.fillText(cleanSegment, currentX, y);
              
              // Move x position for next word (add space width)
              const wordWidth = ctx.measureText(cleanSegment).width;
              const spaceWidth = ctx.measureText(' ').width;
              currentX += wordWidth + spaceWidth;
            });
          };
          
          // Draw each line with keywords bolded
          taglineLines.forEach((line, index) => {
            drawTextWithBoldedWords(line, 60, taglineStartY + (index * taglineLineHeight), selectedKeywords);
          });
          
          // Position for company info circles - pushed further up to match logo alignment
          const circleY = canvas.height * 0.28; // Further reduced from 0.30 to move up by 10px equivalent
          
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
          ctx.fillStyle = 'black'; // Set icon color to black
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('👤', 80, circleY + 8); // Centered the icon
          
          // Draw phone icon in the second circle - improved drawing for better visibility
          const phoneX = 80;
          const phoneY = circleY + 85;
          
          // Draw a clear phone icon (black fill)
          ctx.fillStyle = '#000000'; // Black color
          
          // Phone receiver base (handle)
          ctx.beginPath();
          ctx.roundRect(phoneX - 8, phoneY - 6, 16, 12, 3);
          ctx.fill();
          
          // Phone receiver top part
          ctx.beginPath();
          ctx.arc(phoneX, phoneY - 9, 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Phone receiver bottom part
          ctx.beginPath();
          ctx.arc(phoneX, phoneY + 9, 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw company info text - properly aligned vertically with icons
          ctx.fillStyle = 'white';
          ctx.font = 'bold 28px Arial';
          ctx.textAlign = 'left';
          
          // Get user name
          const userName = userData.name || 'Your Name';
          
          // Get phone number to calculate maximum available width
          let phoneNumber = userData.phoneNumber || 'Your Phone Number';
          if (phoneNumber.includes('+91')) {
            phoneNumber = phoneNumber.replace('+91', '').trim();
          }
          
          // Calculate maximum width for text elements before the white line
          const maxTextWidth = canvas.width * 0.3; // Maximum 30% of canvas width for text
          
          // Check if name needs to be wrapped
          const nameWidth = ctx.measureText(userName).width;
          
          if (nameWidth > maxTextWidth) {
            // Name is too long, need to split it
            const words = userName.split(' ');
            let line1 = '';
            let line2 = '';
            let currentWidth = 0;
            
            // Distribute words between lines
            for (const word of words) {
              const wordWidth = ctx.measureText(word + ' ').width;
              
              if (currentWidth + wordWidth <= maxTextWidth) {
                line1 += word + ' ';
                currentWidth += wordWidth;
              } else {
                line2 += word + ' ';
              }
            }
            
            // Trim extra spaces
            line1 = line1.trim();
            line2 = line2.trim();
            
            // Draw the name in two lines
            ctx.fillText(line1, 130, circleY - 5); // First line slightly higher
            ctx.fillText(line2, 130, circleY + 25); // Second line below
          } else {
            // Name fits on a single line
            ctx.fillText(userName, 130, circleY + 8); // Properly centered with the user icon
          }
          
          // Phone number display - already processed above
          ctx.font = 'bold 28px Arial';
          ctx.fillText(phoneNumber, 130, circleY + 93); // Kept the same position
          
          // Add vertical white line 190px away from contact details (additional 50px) and 5px higher
          const lineX = 130 + 190 + ctx.measureText(phoneNumber).width; // Position 190px after the longest text (increased by another 50px)
          const lineStartY = circleY - 30; // Start 5px higher than before (from -25 to -30)
          const lineEndY = circleY + 110; // End 5px higher than before (from 115 to 110)
          
          // Draw the white vertical line
          ctx.beginPath();
          ctx.moveTo(lineX, lineStartY);
          ctx.lineTo(lineX, lineEndY);
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'white';
          ctx.stroke();
          
          // Name at bottom removed as requested
        } catch (textError) {
          console.error('Error adding text to poster:', textError);
        }
        
        // Add yellow strip at the bottom with URL as requested by the client
        try {
          // Create yellow strip at bottom with reduced width and rounded corners
          const stripHeight = 40; // Height of the strip in pixels
          const stripMargin = 100; // Margin from each side (increased from 70px to 100px as requested)
          const cornerRadius = 10; // Radius for rounded corners
          
          ctx.fillStyle = '#FFC107'; // Yellow color
          
          // Draw rounded rectangle for the strip
          ctx.beginPath();
          // Start from top-left corner with radius
          ctx.moveTo(stripMargin + cornerRadius, canvas.height - stripHeight);
          // Top edge
          ctx.lineTo(canvas.width - stripMargin - cornerRadius, canvas.height - stripHeight);
          // Top-right corner
          ctx.arcTo(canvas.width - stripMargin, canvas.height - stripHeight, canvas.width - stripMargin, canvas.height - stripHeight + cornerRadius, cornerRadius);
          // Right edge
          ctx.lineTo(canvas.width - stripMargin, canvas.height);
          // Bottom-right corner (no rounding)
          ctx.lineTo(stripMargin, canvas.height);
          // Bottom-left corner (no rounding)
          ctx.lineTo(stripMargin, canvas.height - stripHeight + cornerRadius);
          // Top-left corner
          ctx.arcTo(stripMargin, canvas.height - stripHeight, stripMargin + cornerRadius, canvas.height - stripHeight, cornerRadius);
          ctx.closePath();
          ctx.fill();
          
          // Add URL text to the strip
          ctx.fillStyle = '#000000'; // Black text (changed from white for better contrast on yellow)
          ctx.font = '22px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Visit – www.ltfgamechangers.in', canvas.width / 2, canvas.height - stripHeight/2 + 8); // Centered vertically in the strip
          
          console.log('Added URL strip to poster');
        } catch (stripError) {
          console.error('Error adding URL strip to poster:', stripError);
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
          
          // Add yellow strip at the bottom with URL
          try {
            // Create yellow strip at bottom with reduced width and rounded corners
            const stripHeight = 40; // Height of the strip in pixels
            const stripMargin = 100; // Margin from each side (increased from 70px to 100px as requested)
            const cornerRadius = 10; // Radius for rounded corners
            
            ctx.fillStyle = '#FFC107'; // Yellow color
            
            // Draw rounded rectangle for the strip
            ctx.beginPath();
            // Start from top-left corner with radius
            ctx.moveTo(stripMargin + cornerRadius, canvas.height - stripHeight);
            // Top edge
            ctx.lineTo(canvas.width - stripMargin - cornerRadius, canvas.height - stripHeight);
            // Top-right corner
            ctx.arcTo(canvas.width - stripMargin, canvas.height - stripHeight, canvas.width - stripMargin, canvas.height - stripHeight + cornerRadius, cornerRadius);
            // Right edge
            ctx.lineTo(canvas.width - stripMargin, canvas.height);
            // Bottom-right corner (no rounding)
            ctx.lineTo(stripMargin, canvas.height);
            // Bottom-left corner (no rounding)
            ctx.lineTo(stripMargin, canvas.height - stripHeight + cornerRadius);
            // Top-left corner
            ctx.arcTo(stripMargin, canvas.height - stripHeight, stripMargin + cornerRadius, canvas.height - stripHeight, cornerRadius);
            ctx.closePath();
            ctx.fill();
            
            // Add URL text to the strip
            ctx.fillStyle = '#000000'; // Black text (changed from white for better contrast on yellow)
            ctx.font = '22px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Visit – www.ltfgamechangers.in', canvas.width / 2, canvas.height - stripHeight/2 + 8); // Centered vertically in the strip
          } catch (stripError) {
            console.error('Error adding URL strip to fallback poster:', stripError);
          }
          
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
  
  // Load CTA banner images
  useEffect(() => {
    // Set the actual banners from the CTA folder
    setCtaBanners([
      { id: 'banner1', name: '1copy.png' },
      { id: 'banner2', name: '2copy.png' },
      { id: 'banner3', name: '3copy.png' },
      { id: 'banner4', name: '4copy.png' },
      { id: 'banner5', name: '5copy.png' }
    ]);
  }, []);

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

  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Add resize listener to update mobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        <>
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
          
          {/* Mobile CTA banners without white container */}
          {isMobile && (
            <div className="mobile-cta-section">
              <CTABannerCarousel banners={ctaBanners} />
            </div>
          )}
        </>
      )}
      
      {/* Half-cut white container with CTA banners - only for desktop */}
      {!isMobile && (
        <div className="cta-container">
          <CTABannerCarousel banners={ctaBanners} />
        </div>
      )}
      
      {/* Hidden canvases for poster generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
};

export default SharePoster;