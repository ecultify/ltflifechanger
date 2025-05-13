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
            
            // Now place the user's image to the left of Bumrah with same height as Bumrah
            if (userImg.complete && userImg.naturalHeight !== 0) {
              try {
                // CRITICAL POSITIONING FIX:
                // Ensure the full image is visible without cutoffs
                
                // Position image to cover left side of poster (side by side with template model)
                const containerWidth = canvas.width * 0.55; // Slightly increased width from 0.53 to 0.55
                const containerHeight = canvas.height * 0.70; // Further increased height from 0.67 to 0.70
                
                // Position at bottom left corner for perfect alignment
                const userX = -16; // Keep the same X position
                const userY = canvas.height - containerHeight + 50; // Keep the same offset
                
                // Set up the offscreen canvas with these dimensions
                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = containerWidth;
                offscreenCanvas.height = containerHeight;
                const offCtx = offscreenCanvas.getContext('2d');
                
                console.log('Image container positioning:', {
                  x: userX,
                  y: userY,
                  width: containerWidth,
                  height: containerHeight,
                  canvasWidth: canvas.width,
                  canvasHeight: canvas.height
                });
                
                // Clear canvas
                offCtx.clearRect(0, 0, containerWidth, containerHeight);
                
                try {
                  console.log('Drawing user image directly from processedImage URL');
                  
                  // SIMPLEST SOLUTION: Create a new image directly from processed image URL
                  const directImage = new Image();
                  directImage.crossOrigin = "anonymous";
                  directImage.src = processedImage;
                  
                  // Wait for image to load
                  await new Promise((resolve) => {
                    if (directImage.complete) {
                      resolve();
                    } else {
                      directImage.onload = resolve;
                    }
                  });
                  
                  console.log('Direct image loaded:', {
                    width: directImage.width,
                    height: directImage.height,
                    naturalWidth: directImage.naturalWidth,
                    naturalHeight: directImage.naturalHeight
                  });
                  
                  // Calculate sizing to ensure full image is visible
                  const imgAspectRatio = directImage.width / directImage.height;
                  const containerAspectRatio = containerWidth / containerHeight;
                  
                  let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
                  
                  // Use contain approach to ensure entire image is visible
                  if (imgAspectRatio > containerAspectRatio) {
                    // Image is wider - fit to width and center vertically
                    drawWidth = containerWidth;
                    drawHeight = containerWidth / imgAspectRatio;
                    offsetX = 0;
                    offsetY = (containerHeight - drawHeight) / 2;
                  } else {
                    // Image is taller - fit to height and center horizontally
                    drawHeight = containerHeight;
                    drawWidth = containerHeight * imgAspectRatio;
                    offsetX = (containerWidth - drawWidth) / 2;
                    offsetY = 0;
                  }
                  
                  // Apply 10% margin by scaling down
                  const scaleFactor = 0.9;
                  drawWidth *= scaleFactor;
                  drawHeight *= scaleFactor;
                  
                  // Recenter
                  offsetX = (containerWidth - drawWidth) / 2;
                  offsetY = (containerHeight - drawHeight) / 2;
                  
                  console.log('Drawing direct image:', {
                    offsetX, offsetY,
                    drawWidth, drawHeight
                  });
                  
                  // Draw the direct image to the offscreen canvas
                  offCtx.drawImage(
                    directImage, 
                    0, 0, directImage.width, directImage.height,
                    offsetX, offsetY, drawWidth, drawHeight
                  );
                  
                  // Now draw the offscreen canvas to the main canvas
                  console.log('Drawing final user image to main canvas');
                  ctx.drawImage(offscreenCanvas, userX, userY, containerWidth, containerHeight);
                  
                } catch (error) {
                  console.error('Error processing image:', error);
                }
                
                // Black tint has been removed as requested
                
                // 3. Apply basic image enhancement (contrast and brightness)
                try {
                  // Get image data for manipulation
                  const imageData = offCtx.getImageData(0, 0, containerWidth, containerHeight);
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
                
                // Now draw the finalized offscreen canvas to the main canvas at the correct position
                try {
                  console.log('Drawing final image to main canvas at:', {
                    x: userX,
                    y: userY,
                    width: containerWidth,
                    height: containerHeight
                  });
                  
                  // Draw the offscreen canvas to the main canvas
                  ctx.drawImage(offscreenCanvas, userX, userY, containerWidth, containerHeight);
                  console.log('Successfully drew image at bottom-left corner');
                } catch (drawError) {
                  console.error('Error drawing to main canvas:', drawError);
                  
                  // Try a fallback approach if needed
                  try {
                    console.log('Attempting fallback drawing approach');
                    ctx.drawImage(userImg, userX, userY, containerWidth, containerHeight);
                  } catch (fallbackError) {
                    console.error('Fallback drawing also failed:', fallbackError);
                  }
                }
              } catch (imageDrawError) {
                console.error('Error drawing user image:', imageDrawError);
                // Continue without user image placement
              }
            }
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
        
        setLoadingStatus('Generating your poster...');
        
        try {
          // Add tagline at the top
          // Remove any leftover asterisks before processing the tagline
          // Ensure tagline is properly retrieved and preserved
          let tagline = '';
          if (userData && userData.tagline) {
            // Use the exact tagline from userData without adding extra words
            tagline = userData.tagline.trim();
            console.log('Using tagline from userData:', tagline);
          } else {
            tagline = 'I transform businesses with innovation and expertise';
            console.log('Using default tagline');
          }
          
          // Now draw Group 30a image on the right side with higher z-index
          try {
            const group30aImg = new Image();
            group30aImg.crossOrigin = 'anonymous';
            group30aImg.src = '/images/section1/Group 30a (1).png'; // Correct path with section1 folder
            
            console.log('Loading Group 30a image in final position');
            
            // Wait for image to load
            await new Promise((resolve) => {
              if (group30aImg.complete) {
                console.log('Group 30a image already loaded');
                resolve();
              } else {
                group30aImg.onload = () => {
                  console.log('Group 30a image loaded successfully in final position');
                  resolve();
                };
                group30aImg.onerror = (err) => {
                  console.error('Failed to load Group 30a image in final position:', err);
                  resolve(); // Continue even if image fails
                };
                setTimeout(() => resolve(), 3000); // Safety timeout
              }
            });
            
            if (group30aImg.complete && group30aImg.naturalHeight !== 0) {
              // Position on the right side of the canvas
              const rightImageWidth = canvas.width * 0.46; // Keep same width
              const rightImageHeight = canvas.height * 0.63; // Keep same height
              const rightImageX = canvas.width - rightImageWidth - 25; // Move 15px more to the left (from -10 to -25)
              const rightImageY = canvas.height - rightImageHeight + 50; // Keep same Y position
              
              console.log('Drawing Group 30a image at final position:', {
                x: rightImageX,
                y: rightImageY,
                width: rightImageWidth,
                height: rightImageHeight
              });
              
              // Draw the image on top of everything
              ctx.drawImage(group30aImg, rightImageX, rightImageY, rightImageWidth, rightImageHeight);
              console.log('Group 30a image drawn successfully in final position');
            }
          } catch (rightImageError) {
            console.error('Error drawing Group 30a image in final position:', rightImageError);
          }
          
          // Tagline styling - using Poppins font and increased font size by 3.5
          ctx.fillStyle = 'white'; // Always use white color for tagline text
          ctx.font = 'bold 45.5px Poppins, sans-serif'; // Increased from 42px to 45.5px (42 + 3.5)
          ctx.textAlign = 'left';
          
          // Calculate vertical spacing for taglines - adjusted for better positioning
          const taglineStartY = canvas.height * 0.09; // Moved up slightly from 0.10 to 0.09
          const taglineLineHeight = 50; // Reduced from 55 to 50 for tighter line spacing
          
          // Enhanced function to handle drawing text with certain words in bold
          const drawTextWithBoldedWords = (line, x, y, keywords) => {
            // First check if there are any asterisks in the line to extract immediate highlights
            const asteriskMatches = line.match(/\*(.*?)\*/g);
            if (asteriskMatches) {
              // Extract words from the asterisks
              const immediateHighlights = asteriskMatches.map(match => match.replace(/\*/g, '').trim());
              // Add to keywords array if not already there
              immediateHighlights.forEach(word => {
                if (word && !keywords.includes(word)) {
                  keywords.push(word);
                }
              });
            }
            
            // Remove all asterisks for clean processing
            const cleanLine = line.replace(/\*/g, '');
            // Split on spaces for word-by-word processing
            const segments = cleanLine.split(' ');
            let currentX = x;
            
            segments.forEach((segment, index) => {
              if (!segment || segment.trim().length === 0) return;
              
              // Enhanced keyword detection - check for exact match, partial match, or plurals
              const isKeyword = keywords.some(keyword => {
                // Skip empty keywords
                if (!keyword || keyword.trim().length === 0) return false;
                
                const segmentLower = segment.toLowerCase().trim();
                const keywordLower = keyword.toLowerCase().trim();
                
                // Exact match
                if (segmentLower === keywordLower) return true;
                
                // Word boundary check for better matching
                const segmentWithBoundaries = ` ${segmentLower} `;
                const keywordWithBoundaries = ` ${keywordLower} `;
                
                // Check if segment is part of the keyword (with word boundaries)
                if (` ${segment} `.toLowerCase().includes(` ${keyword} `.toLowerCase())) return true;
                
                // Segment contains keyword (more flexible matching)
                if (segmentLower.includes(keywordLower)) {
                  // Check for word boundaries or if it's at the start/end
                  if (segmentLower === keywordLower || 
                      segmentLower.startsWith(`${keywordLower} `) || 
                      segmentLower.endsWith(` ${keywordLower}`) || 
                      segmentLower.includes(` ${keywordLower} `)) {
                    return true;
                  }
                }
                
                // Keyword contains segment (for multi-word keywords)
                if (keywordLower.includes(segmentLower)) {
                  // Check for word boundaries or if it's at the start/end
                  if (keywordLower === segmentLower || 
                      keywordLower.startsWith(`${segmentLower} `) || 
                      keywordLower.endsWith(` ${segmentLower}`) || 
                      keywordLower.includes(` ${segmentLower} `)) {
                    return true;
                  }
                }
                
                // Improved plural and singular form checks
                if ((segmentLower + 's' === keywordLower) || 
                    (keywordLower + 's' === segmentLower) || 
                    (segmentLower.endsWith('s') && segmentLower.slice(0, -1) === keywordLower) || 
                    (keywordLower.endsWith('s') && keywordLower.slice(0, -1) === segmentLower) ||
                    (segmentLower.endsWith('es') && segmentLower.slice(0, -2) === keywordLower) ||
                    (keywordLower.endsWith('es') && keywordLower.slice(0, -2) === segmentLower)) {
                  return true;
                }
                
                return false;
              });
              
              // Debug information for keywords
              if (process.env.NODE_ENV !== 'production') {
                console.log(`Word: ${segment}, isKeyword: ${isKeyword}, keywords: ${JSON.stringify(keywords)}`);
              }
              
              // Set appropriate font weight and style for better differentiation
              if (isKeyword) {
                ctx.font = 'bold 46px Poppins, sans-serif'; // Slightly larger for bold words
                ctx.fillStyle = '#FFFFFF'; // Pure white for bold words
                // Add text shadow for extra emphasis on keywords
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 3;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;
              } else {
                ctx.font = '45px Poppins, sans-serif';
                ctx.fillStyle = '#F0F0F0'; // Slightly less bright for non-bold words
                // Reset shadow for non-bold words
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
              }
              
              // Draw the word
              ctx.fillText(segment, currentX, y);
              
              // Move x position for next word
              const wordWidth = ctx.measureText(segment).width;
              const spaceWidth = ctx.measureText(' ').width;
              currentX += wordWidth + spaceWidth;
            });
          };
          
          // Split the tagline into multiple lines if needed
          let taglineLines = [];
          const maxLineLength = 34; // Reduced from 38 to 36 to decrease tagline width from the right by 10px
          
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
          let highlightedKeywords = [];
          
          try {
            // Get the explicitly selected keywords
            const storedKeywords = sessionStorage.getItem('selectedKeywords');
            if (storedKeywords) {
              selectedKeywords = JSON.parse(storedKeywords);
              console.log('Loaded selected keywords:', selectedKeywords);
            }
            
            // Also get any highlighted keywords extracted from asterisks
            const storedHighlightedKeywords = sessionStorage.getItem('highlightedKeywords');
            if (storedHighlightedKeywords) {
              highlightedKeywords = JSON.parse(storedHighlightedKeywords);
              console.log('Loaded highlighted keywords:', highlightedKeywords);
            }
            
            // Combine both sources for a comprehensive list of words to bold
            selectedKeywords = [...new Set([...selectedKeywords, ...highlightedKeywords])];
            console.log('Combined keywords to bold:', selectedKeywords);
            
            // Ensure keywords are properly normalized for matching (lowercase, trimmed)
            selectedKeywords = selectedKeywords.map(keyword => keyword.trim()).filter(keyword => keyword.length > 0);
            console.log('Normalized keywords to bold:', selectedKeywords);
          } catch (e) {
            console.error('Error parsing keywords:', e);
          }
          
          // Draw each line with keywords bolded - moved right by 3px and reduced width from right by 3px
          taglineLines.forEach((line, index) => {
            drawTextWithBoldedWords(line, 63, taglineStartY + (index * taglineLineHeight), selectedKeywords);
          });
          
          // Position for company info circles - pushed further up to match logo alignment
          const circleY = canvas.height * 0.28 - 3; // Further reduced by 3px as requested
          
          // Draw user icon circles (yellow background) - moved 3px to the right
          ctx.beginPath();
          ctx.arc(83, circleY, 30, 0, 2 * Math.PI);
          ctx.fillStyle = '#FFC72C'; // L&T Finance gold/yellow color
          ctx.fill();
          
          // Draw phone icon circle - moved 3px to the right
          ctx.beginPath();
          ctx.arc(83, circleY + 85, 30, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw person icon in the first circle - moved 3px to the right
          ctx.fillStyle = 'black'; // Set icon color to black
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('👤', 83, circleY + 8); // Centered the icon
          
          // Draw phone icon in the second circle - moved 3px to the right
          const phoneX = 83;
          const phoneY = circleY + 85;
          
          // Use the preloaded phone icon if available, otherwise create a new one
          if (preloadedPhoneIconRef.current) {
            // Use the preloaded icon which is guaranteed to be loaded
            console.log('Using preloaded phone icon');
            const iconSize = 42; // Increased from 32px to 42px to better fill the circle
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
            
            // Draw the name in two lines - moved 3px to the right
            ctx.fillText(line1, 133, circleY - 5); // First line slightly higher
            ctx.fillText(line2, 133, circleY + 25); // Second line below
          } else {
            // Name fits on a single line - moved 3px to the right
            ctx.fillText(userName, 133, circleY + 8); // Properly centered with the user icon
          }
          
          // Phone number display - moved 3px to the right
          ctx.font = 'bold 28px Arial';
          ctx.fillText(phoneNumber, 133, circleY + 93); // Moved 3px to the right
          
          // Add vertical white line - moved up by 2px
          const lineX = 133 + 190 + ctx.measureText(phoneNumber).width; // Position after phone number with adjusted position
          const lineStartY = circleY - 32; // Start 2px higher than before
          const lineEndY = circleY + 108; // End 2px higher than before
          
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
          ctx.fillText('Visit – LTFGAMECHANGERS.IN', canvas.width / 2, canvas.height - stripHeight/2 + 8); // Centered vertically in the strip
          
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
          // Remove any asterisks from the tagline for cleaner display
          const cleanTagline = tagline.replace(/\*/g, '');
          const words = cleanTagline.split(' ');
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
            ctx.fillText('LTFGAMECHANGERS.IN', canvas.width / 2, canvas.height - stripHeight/2 + 8); // Centered vertically in the strip
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
    // Function to load user data and image
    const loadUserDataAndImage = async () => {
      try {
        // Load the Poppins font
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
        
        // Ensure Poppins font is loaded
        ensurePoppinsFont();
        
        // Retrieve user data from session storage
        const storedUserDataStr = sessionStorage.getItem('userData');
        
        // Check if we have user data
        if (!storedUserDataStr) {
          console.error('No user data found in session storage');
          setError('No user data found. Please go back and add your details.');
          setIsLoading(false);
          
          // Navigate back to upload page after a brief delay
          setTimeout(() => {
            navigate('/upload');
          }, 1500);
          
          return;
        }
        
        // Parse user data
        const storedUserData = JSON.parse(storedUserDataStr);
        console.log('Retrieved user data from session storage:', storedUserData);
        setUserData(storedUserData);
        
        // Retrieve the processed image directly from session storage
        const storedImageUrl = sessionStorage.getItem('processedImage');
        
        // Check if we have an image URL
        if (!storedImageUrl) {
          console.error('No processed image found in session storage');
          setError('No image found. Please go back and upload your photo.');
          setIsLoading(false);
          
          // Navigate back to upload page after a brief delay
          setTimeout(() => {
            navigate('/upload');
          }, 1500);
          
          return;
        }
        
        console.log('Retrieved image URL from session storage:', storedImageUrl);
        
        // Handle both blob URLs and data URLs
        if (storedImageUrl.startsWith('blob:') || storedImageUrl.startsWith('data:')) {
          console.log('Using blob or data URL directly');
          setProcessedImage(storedImageUrl);
        } else {
          // Handle other URL formats if needed
          console.log('Using standard URL format');
          setProcessedImage(storedImageUrl);
        }
        
        // If everything is loaded, we can generate the poster
        setIsLoading(true);
      } catch (error) {
        console.error('Error loading user data or image:', error);
        setError('There was a problem loading your data. Please try again.');
        setIsLoading(false);
      }
    };
    
    // Load user data and image when component mounts
    loadUserDataAndImage();
  }, [navigate]);  // Add navigate to the dependency array

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

  // Better mobile scrolling implementation for SharePoster
  useEffect(() => {
    // Only apply minimal fixes if we're on mobile
    if (window.innerWidth <= 768) {
      console.log('SharePoster - Applying mobile scroll fixes');
      
      // Allow natural scrolling
      document.body.style.overflowX = 'hidden';
      document.body.style.overflowY = 'auto';
      document.body.style.height = 'auto';
      document.body.style.position = 'static';
      
      // Remove any fixed height limitations
      const root = document.getElementById('root');
      if (root) {
        root.style.height = 'auto';
        root.style.minHeight = '100%';
        root.style.overflowY = 'visible';
      }
    }
  }, [isMobile]);

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