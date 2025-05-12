import React, { useEffect } from 'react';
import html2canvas from 'html2canvas';

// Global variable to store the generated poster image
let generatedPosterImage = null;

/**
 * Get the poster image URL
 * @returns {string|null} The poster image URL or null if not generated
 */
export const getPosterImage = () => {
  return generatedPosterImage;
};

/**
 * Download the poster as an image
 */
export const downloadPoster = () => {
  const container = document.querySelector('.poster-container');
  if (!container) return;

  html2canvas(container, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'my-business-poster.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
};

/**
 * SharePoster component - renders a shareable business poster
 * 
 * @param {Object} props
 * @param {Object} props.userData - User data for the poster
 * @param {string} props.userData.name - User's name
 * @param {string} props.userData.companyName - Company name
 * @param {string} props.userData.industry - Business industry
 * @param {string} props.userData.tagline - Business tagline
 * @param {string} props.userData.phoneNumber - Contact phone number
 * @param {string|null} props.userImage - User's profile image (data URL)
 * @param {React.RefObject} props.containerRef - Reference to the container element
 */
const SharePoster = ({ userData, userImage, containerRef }) => {
  useEffect(() => {
    if (!containerRef?.current) return;
    
    // Create the poster element
    const posterElement = document.createElement('div');
    posterElement.className = 'poster-container';
    posterElement.style.width = '100%';
    posterElement.style.height = '100%';
    posterElement.style.position = 'relative';
    posterElement.style.backgroundColor = '#ffffff';
    posterElement.style.color = '#000000';
    posterElement.style.fontFamily = '"Poppins", sans-serif';
    
    // Set the poster content
    posterElement.innerHTML = `
      <div style="position: relative; width: 100%; height: 100%; display: flex; flex-direction: column;">
        <!-- Background Image -->
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;">
          <img 
            src="/images/mage.jpg" 
            style="width: 100%; height: 100%; object-fit: cover; opacity: 0.2;" 
            alt="Background" 
          />
        </div>
        
        <!-- Content Container -->
        <div style="position: relative; z-index: 2; padding: 30px; display: flex; flex-direction: column; height: 100%; justify-content: space-between;">
          <!-- Header with Logo -->
          <div style="text-align: center; margin-bottom: 20px;">
            <img 
              src="/logo.png" 
              style="max-width: 150px; height: auto;" 
              alt="Logo" 
            />
          </div>
          
          <!-- Main Content -->
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
            <!-- Profile Image -->
            ${userImage ? `
              <div style="width: 150px; height: 150px; border-radius: 50%; overflow: hidden; margin-bottom: 20px; border: 3px solid #000;">
                <img 
                  src="${userImage}" 
                  style="width: 100%; height: 100%; object-fit: cover; position: relative; left: 3px; right: -3px; top: -8px;" 
                  alt="Profile" 
                />
              </div>
            ` : `
              <div style="width: 150px; height: 150px; border-radius: 50%; background-color: #e0e0e0; margin-bottom: 20px; display: flex; justify-content: center; align-items: center; border: 3px solid #000;">
                <span style="font-size: 50px; color: #888;">?</span>
              </div>
            `}
            
            <!-- Name and Company -->
            <h1 style="font-size: 36px; margin: 0 0 5px 0;">${userData.name}</h1>
            <h2 style="font-size: 24px; margin: 0 0 20px 0;">${userData.companyName}</h2>
            
            <!-- Industry Badge -->
            <div style="background-color: #000; color: #fff; padding: 8px 16px; border-radius: 20px; font-size: 16px; margin-bottom: 20px;">
              ${userData.industry}
            </div>
            
            <!-- Tagline -->
            <p style="font-size: 18px; max-width: 80%; width: calc(80% + 2px); margin: 0 auto 30px auto; line-height: 1.4;">
              "${userData.tagline}"
            </p>
          </div>
          
          <!-- Contact Info -->
          <div style="background-color: #000; color: #fff; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 20px;">Contact: ${userData.phoneNumber}</p>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 30px; text-align: center; font-size: 14px; color: #666;">
            <p>Created with Landt.AI - Empowering Business Owners</p>
          </div>
        </div>
      </div>
    `;
    
    // Clear the container and append the poster
    if (containerRef.current.firstChild) {
      containerRef.current.innerHTML = '';
    }
    containerRef.current.appendChild(posterElement);
    
    // Generate the poster image for later use
    setTimeout(() => {
      html2canvas(posterElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
      }).then(canvas => {
        generatedPosterImage = canvas.toDataURL('image/png');
      });
    }, 500);
    
    // Cleanup
    return () => {
      generatedPosterImage = null;
    };
  }, [userData, userImage, containerRef]);
  
  // This component doesn't render anything directly
  return null;
};

export default SharePoster; 