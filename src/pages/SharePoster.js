import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/SharePoster.css';
import '../styles/overrides/LogoPositionFix.css'; // Import logo positioning overrides
import Loader from '../components/Loader';
import CTABannerCarousel from '../components/CTABannerCarousel';
import { loadFaceDetectionModels, getOptimalImagePlacement } from '../utils/faceDetection';
import { getRandomTemplateForIndustry } from '../utils/templateSelector'; // Import template selector

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
  const [loadingStatus, setLoadingStatus] = useState('Generating your poster...');
  const [templatePath, setTemplatePath] = useState(null); // Store the selected template path
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
  
  // Note: isMobile state is declared further down in the component

  // Preload images including phone icon when component mounts
  const preloadedPhoneIconRef = useRef(null);

  useEffect(() => {
    // Preload the phone icon to ensure it's available
    const phoneIcon = new Image();
    phoneIcon.src = '/images/PhoneIcon.png';
    phoneIcon.onload = () => {
      console.log('Phone icon preloaded successfully');
      preloadedPhoneIconRef.current = phoneIcon;
    };
    phoneIcon.onerror = (err) => {
      console.error('Failed to preload phone icon:', err);
    };
  }, []);

  // Preload the template image when component mounts and userData is available
  useEffect(() => {
    const preloadTemplateImage = async () => {
      if (!userData || !userData.industry) {
        console.log('No userData or industry available yet:', userData);
        return; // Wait for user data to be available
      }

      try {
        console.log('Selecting template for industry:', userData.industry);
        // Get template path based on industry
        const selectedTemplatePath = await getRandomTemplateForIndustry(userData.industry);
        setTemplatePath(selectedTemplatePath);
        console.log(`Selected template path: ${selectedTemplatePath} for industry: ${userData.industry}`);
        
        // Preload the template image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          console.log(`Template image preloaded successfully from: ${selectedTemplatePath}`);
          preloadedTemplateRef.current = img;
        };
        
        img.onerror = (err) => {
          console.warn(`Failed to preload template image from: ${selectedTemplatePath}`, err);
          // Fall back to mage.jpg if the template fails to load
          const fallbackImage = new Image();
          fallbackImage.crossOrigin = 'anonymous';
          fallbackImage.src = '/images/mage.jpg';
          
          fallbackImage.onload = () => {
            console.log('Fallback template image preloaded successfully');
            preloadedTemplateRef.current = fallbackImage;
          };
          
          fallbackImage.onerror = (fallbackErr) => {
            console.error('Even fallback template failed to load:', fallbackErr);
          };
        };
        
        img.src = selectedTemplatePath;
      } catch (error) {
        console.error('Error preloading template image:', error);
      }
    };
    
    preloadTemplateImage();
  }, [userData]);  // Re-run when userData changes

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
      setLoadingStatus('Generating your poster...');
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
        setLoadingStatus('Generating your poster...');
        const userImg = new Image();
        userImg.crossOrigin = 'anonymous';
        userImg.src = processedImage;
        
        console.log('Loading user processed image from URL:', processedImage);
        
        // Add a logging function to track the image loading process
        const trackImageLoading = async (img, description) => {
          return new Promise((resolve) => {
            const checkLoaded = () => {
              if (img.complete) {
                console.log(`${description} loaded successfully:`, {
                  width: img.width,
                  height: img.height,
                  naturalWidth: img.naturalWidth,
                  naturalHeight: img.naturalHeight
                });
                resolve(true);
              } else {
                console.log(`${description} still loading...`);
                setTimeout(checkLoaded, 200);
              }
            };
            checkLoaded();
          });
        };
        
        // Track user image loading
        await trackImageLoading(userImg, 'User image');
        
        // Load the template image based on user's industry
        // Use the selected template path if available, otherwise fall back to the default
        const templateSrc = templatePath || `${window.location.origin}/images/mage.jpg`;
          
        console.log(`Using template: ${templateSrc} for industry: ${userData.industry || 'unknown'}`);
        
        setLoadingStatus('Generating your poster...');
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
            const srcWithoutOrigin = templateSrc.replace(`${window.location.origin}`, '');
            templateImg.src = srcWithoutOrigin;
            
            // If that also fails, try a relative path
            templateImg.onerror = () => {
              console.error('Still failed to load template image, using default fallback');
              templateImg.src = '/images/mage.jpg';
              
              // If that still fails, try the backup template file
              templateImg.onerror = () => {
                console.error('Default fallback failed, trying final fallback');
                templateImg.src = 'images/template.jpg';
              };
            };
          };
        }
        
        // Wait for all images to load with timeout
        setLoadingStatus('Generating your poster...');
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
        setLoadingStatus('Generating your poster...');
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
            
            // Check if we have crop data from the UploadPhoto page
            let cropData = null;
            try {
              const cropDataStr = sessionStorage.getItem('cropData');
              if (cropDataStr) {
                cropData = JSON.parse(cropDataStr);
                console.log('Retrieved crop data:', cropData);
              }
            } catch (e) {
              console.error('Error parsing crop data:', e);
            }
            
            // Get userData for additional metadata
            const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
            console.log('Retrieved user data:', userData);
            
            // Calculate Bumrah's approximate height in the template
            // Using the full template height (with some small margins)
            const bumrahHeight = canvas.height * 0.75; // Approximate height of Bumrah on the poster
            
            // Initial width and height calculation - but we'll allow height to be fluid
            const heightScale = bumrahHeight / userImgHeight; // Base height scale
            let scaledWidth = userImgWidth * heightScale;
            let scaledHeight = bumrahHeight; // Initial height, but this may change
            
            // If we have crop data, adjust based on the crop settings
            if (cropData) {
              console.log('Applying flexible crop data:', cropData);
              
              // Calculate target width (47.29% of frame width)
              const targetWidth = canvas.width * 0.4729;
              console.log('Target width (47.29% of frame):', targetWidth);
              
              // Set the width to the target
              scaledWidth = targetWidth;
              
              // If we have aspect ratio information, use it to calculate height
              // but keep the top position fixed
              if (cropData.aspectRatio) {
                // Calculate height based on the cropped aspect ratio
                // aspectRatio = width / height, so height = width / aspectRatio
                const newHeight = scaledWidth / cropData.aspectRatio;
                
                // Allow the height to be larger than bumrahHeight
                // This means the image might extend below the poster
                scaledHeight = newHeight;
                
                console.log('Using aspect ratio for flexible height:', {
                  aspectRatio: cropData.aspectRatio,
                  targetWidth,
                  calculatedHeight: newHeight,
                  originalBumrahHeight: bumrahHeight,
                  heightDifference: (newHeight - bumrahHeight)
                });
              }
              
              console.log('Final dimensions with fluid height:', { 
                width: scaledWidth, 
                height: scaledHeight,
                isHeightExtended: scaledHeight > bumrahHeight
              });
            }
            
            // Position to place user on the left side of Bumrah
            // Position is adjusted to account for proper placement
            // Moved 15px more to the right as requested
            const userX = (canvas.width * 0.08) - 95 + 15; // Moved 15px more to the right
            
            // IMPORTANT: Keep the TOP position fixed regardless of height
            // Instead of positioning from the bottom, position from the top
            const userY = (canvas.height - bumrahHeight) + 110 - 18 + 30 + 55 + 5 + 5; // This keeps top position fixed
            
            // Apply the calculated placement
            console.log('Positioning image at:', { x: userX, y: userY, width: scaledWidth, height: scaledHeight });
            
            // Create an offscreen canvas for applying tint and enhancements
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = scaledWidth;
            offscreenCanvas.height = scaledHeight;
            const offCtx = offscreenCanvas.getContext('2d');
            
            // Draw the user's image to the offscreen canvas
            // The image should already be properly cropped, just need to draw it
            try {
              console.log('Drawing user image to offscreen canvas with dimensions:', {
                width: scaledWidth,
                height: scaledHeight
              });
              
              // Clear the offscreen canvas first
              offCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
              
              // Draw the image preserving its aspect ratio
              offCtx.drawImage(userImg, 0, 0, scaledWidth, scaledHeight);
              console.log('Successfully drew user image to offscreen canvas');
              
              // Log the image data for debugging
              try {
                const imageData = offCtx.getImageData(0, 0, 5, 5);
                console.log('Sample of image data (first 5x5 pixels):', imageData.data.slice(0, 100));
              } catch (e) {
                console.warn('Could not access image data for debugging:', e);
              }
            } catch (drawError) {
              console.error('Error drawing user image to offscreen canvas:', drawError);
              
              // Try an alternative drawing approach
              try {
                console.log('Attempting alternative drawing approach with natural dimensions');
                offCtx.drawImage(
                  userImg, 
                  0, 0, userImg.naturalWidth, userImg.naturalHeight,
                  0, 0, scaledWidth, scaledHeight
                );
                console.log('Alternative drawing approach succeeded');
              } catch (altError) {
                console.error('Alternative drawing approach also failed:', altError);
              }
            }
            
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
            try {
              console.log('Drawing final image to main canvas at position:', {
                x: userX,
                y: userY,
                width: scaledWidth,
                height: scaledHeight
              });
              
              // Check if offscreen canvas has content
              try {
                const testData = offCtx.getImageData(0, 0, 1, 1);
                if (testData.data[3] === 0) {
                  console.warn('Offscreen canvas appears to be empty or transparent');
                }
              } catch (e) {
                console.warn('Could not test offscreen canvas data:', e);
              }
              
              ctx.drawImage(offscreenCanvas, userX, userY, scaledWidth, scaledHeight);
              console.log('Successfully drew final image to main canvas');
            } catch (imgPlacementError) {
              console.error('Error placing image on poster:', imgPlacementError);
              
              // Try a direct drawing approach as fallback
              try {
                console.log('Attempting direct drawing approach');
                ctx.drawImage(userImg, userX, userY, scaledWidth, scaledHeight);
                console.log('Direct drawing approach succeeded');
              } catch (directError) {
                console.error('Direct drawing approach failed:', directError);
                
                // Try another fallback with a new image
                try {
                  console.log('Attempting fallback with new image');
                  const fallbackImg = new Image();
                  fallbackImg.crossOrigin = 'anonymous';
                  fallbackImg.src = processedImage;
                  
                  // Wait for the image to load
                  await new Promise(resolve => {
                    fallbackImg.onload = resolve;
                    setTimeout(resolve, 2000); // Timeout after 2 seconds
                  });
                  
                  if (fallbackImg.complete && fallbackImg.naturalHeight !== 0) {
                    ctx.drawImage(fallbackImg, userX, userY, scaledWidth, scaledHeight);
                    console.log('Fallback with new image succeeded');
                  } else {
                    console.error('Fallback image failed to load properly');
                  }
                } catch (fallbackError) {
                  console.error('All drawing approaches failed:', fallbackError);
                }
              }
            }
          } catch (imageDrawError) {
            console.error('Error drawing user image:', imageDrawError);
            // Continue without user image placement
          }
        }
        
        setLoadingStatus('Generating your poster...');
        
        try {
          // Add tagline at the top
          // Remove any leftover asterisks before processing the tagline
          // Ensure tagline is properly retrieved and preserved
          let tagline = '';
          if (userData && userData.tagline) {
            tagline = userData.tagline.trim();
            console.log('Using tagline from userData:', tagline);
          } else {
            tagline = 'I transform businesses with innovation and expertise';
            console.log('Using default tagline');
          }
          // Keep asterisks for highlighting in drawTextWithBoldedWords function
          
          // Split the tagline into multiple lines if needed
          let taglineLines = [];
          const maxLineLength = 31; // Reduced from 36 to 31 to make tagline width smaller
          
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
          
          // Use the preloaded phone icon if available, otherwise create a new one
          if (preloadedPhoneIconRef.current) {
            // Use the preloaded icon which is guaranteed to be loaded
            console.log('Using preloaded phone icon');
            const iconSize = 32; // Size for the icon
            ctx.drawImage(
              preloadedPhoneIconRef.current,
              phoneX - iconSize/2, // Center horizontally
              phoneY - iconSize/2, // Center vertically
              iconSize,
              iconSize
            );
          } else {
            // Fallback if preloaded icon is not available
            console.warn('Preloaded icon not available, drawing fallback');
            // Draw a yellow circle with phone symbol as fallback
            ctx.beginPath();
            ctx.fillStyle = '#FFD700'; // Yellow background
            ctx.arc(phoneX, phoneY, 16, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw phone handset in black
            ctx.fillStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            
            // Earpiece (top circle)
            ctx.beginPath();
            ctx.arc(phoneX - 5, phoneY - 3, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Mouthpiece (bottom circle)
            ctx.beginPath();
            ctx.arc(phoneX + 5, phoneY + 3, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Connect the two parts with a line
            ctx.beginPath();
            ctx.strokeStyle = '#000000';
            ctx.moveTo(phoneX - 5, phoneY - 3);
            ctx.lineTo(phoneX + 5, phoneY + 3);
            ctx.stroke();
          }
          
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
          ctx.font = 'bold 30px Arial'; // Significantly increased font size for better visibility
          ctx.textAlign = 'center';
          ctx.fillText('Visit – ltfgamechangers.in', canvas.width / 2, canvas.height - stripHeight/2 + 8); // Centered vertically in the strip
          
          console.log('Added URL strip to poster');
        } catch (stripError) {
          console.error('Error adding URL strip to poster:', stripError);
        }
        
        // Convert canvas to image
        setLoadingStatus('Generating your poster...');
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
          setLoadingStatus('Generating your poster...');
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
          
          // Draw phone number with icon
          ctx.font = '24px Arial';
          
          // Set up position for phone icon and text
          const iconX = canvas.width / 2 - ctx.measureText(phoneNumber).width / 2 - 30;
          const iconY = 350;
          
          // Draw phone icon using preloaded image if available
          if (preloadedPhoneIconRef.current) {
            console.log('Using preloaded phone icon in fallback poster');
            const iconSize = 24; // Smaller size for fallback poster
            // Draw the icon
            ctx.drawImage(
              preloadedPhoneIconRef.current,
              iconX - iconSize/2,
              iconY - iconSize/2 - 8, // Adjust vertical position to align with text
              iconSize,
              iconSize
            );
            
            // Draw the phone number text next to icon
            ctx.fillText(phoneNumber, canvas.width / 2, iconY);
          } else {
            // Fallback if preloaded icon is not available
            console.warn('Preloaded icon not available in fallback poster, using text only');
            // Just show the phone number without an icon
            ctx.fillText(phoneNumber, canvas.width / 2, iconY);
          }
          
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
            ctx.font = 'bold 40px Arial'; // Further increased font size for better visibility
            ctx.textAlign = 'center';
            ctx.fillText('Visit – ltfgamechangers.in', canvas.width / 2, canvas.height - stripHeight/2 + 8); // Centered vertically in the strip
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
  }, [processedImage, userData, templatePath]);

  useEffect(() => {
    // Load data from sessionStorage when component mounts
    setLoadingStatus('Generating your poster...');
    
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
      
      console.log('Retrieved userData from sessionStorage:', storedUserData);
      
      if (storedUserData && storedImageData) {
        const parsedUserData = JSON.parse(storedUserData);
        console.log('Parsed userData:', parsedUserData);
        console.log('Industry from parsed userData:', parsedUserData.industry);
        
        setUserData(parsedUserData);
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

  // Add enhanced resize listener to update mobile state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      console.log('SharePoster - Window resized, isMobile:', mobile, 'Width:', window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    
    // Call once to ensure state is accurate on initial render
    handleResize();
    
    console.log('SharePoster - Initial isMobile state:', window.innerWidth <= 768, 'Width:', window.innerWidth);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent automatic scrolling - add at the beginning of the component
  useEffect(() => {
    // Prevent scrolling to carousel on page load
    const preventAutoScroll = () => {
      // Store the current scroll position
      const scrollPosition = window.pageYOffset;
      
      // If something tries to scroll the page automatically, restore the position
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
    };
    
    // Execute once on component mount and when window loads
    window.addEventListener('load', preventAutoScroll);
    
    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('load', preventAutoScroll);
    };
  }, []);

  // Allow users to scroll manually by adding passive touch listeners
  useEffect(() => {
    let touchStartY = 0;
    
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e) => {
      const touchY = e.touches[0].clientY;
      const diff = touchStartY - touchY;
      
      // If scrolling up and near the top, allow normal browser behavior
      if (diff < 0 && window.scrollY < 50) {
        e.stopPropagation();
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Add this right after the existing preventAutoScroll effect
  useEffect(() => {
    // Only for mobile view - add additional scroll protection
    if (window.innerWidth <= 768) {
      // Create a more aggressive scroll position lock
      let lastScrollPosition = window.pageYOffset;
      let scrollLock = false;
      
      const lockScrollPosition = () => {
        lastScrollPosition = window.pageYOffset;
        scrollLock = true;
        
        // Release lock after 400ms to allow intentional user scrolling
        setTimeout(() => {
          scrollLock = false;
        }, 400);
      };
      
      const checkAndRestoreScroll = () => {
        if (scrollLock) {
          window.scrollTo(0, lastScrollPosition);
        }
      };
      
      // Initialize scroll position
      lockScrollPosition();
      
      // Add scroll event listener
      window.addEventListener('scroll', checkAndRestoreScroll);
      
      // Add touch events that can trigger scroll position locking
      const handleTouchStart = () => {
        if (!scrollLock) {
          lockScrollPosition();
        }
      };
      
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', checkAndRestoreScroll);
        document.removeEventListener('touchstart', handleTouchStart);
      };
    }
  }, []);

  return (
    <div className="share-poster-page" style={{ backgroundImage: 'url("/images/BG.png")' }}>
      {/* Logo in top left corner with redirect to home */}
      <div className="logo-container">
        <a href="/" title="Go to Home Page">
          <img src="/images/LOGO.png" alt="L&T Finance Logo" className="header-logo" />
        </a>
      </div>
      
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
          <div className="share-poster-content" style={!isMobile ? { marginTop: '40px', marginLeft: '-20px' } : {}}>
            {/* Left side - Poster with base template image */}
            <div className="poster-container" style={!isMobile ? { marginTop: '45px' } : {}}>
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
            <div className="controls-section" style={!isMobile ? { marginLeft: "-25px" } : {}}>
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