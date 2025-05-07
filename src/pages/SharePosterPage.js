import React, { useRef, useEffect, useState } from 'react';
import SharePoster, { downloadPoster, getPosterImage } from '../components/SharePoster';

// EXAMPLE COMPONENT - This shows how to integrate the poster generator 
// without changing your existing page design
const SharePosterPage = () => {
  // Example user data - In your real implementation, get this from your form context or state
  const [userData, setUserData] = useState({
    name: 'John Doe',
    companyName: 'ABC Manufacturing',
    industry: 'Manufacturing',
    tagline: 'I craft precision with innovation and reliability setting new industry standards',
    phoneNumber: '9876543210'
  });
  
  // Example user image - In your real implementation, get this from your form context or state
  const [userImage, setUserImage] = useState(null);
  
  // Reference to the container where the poster should be displayed
  const posterContainerRef = useRef(null);
  
  // Example of loading user image from localStorage or another source
  useEffect(() => {
    // This is just an example - replace with your actual implementation
    const savedImage = localStorage.getItem('userProcessedImage');
    if (savedImage) {
      setUserImage(savedImage);
    }
    
    // Example of getting user data from session or context
    const savedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (savedUserData && Object.keys(savedUserData).length > 0) {
      setUserData(savedUserData);
    }
  }, []);
  
  // Example function to handle download button click
  const handleDownload = () => {
    downloadPoster();
  };
  
  // Example function to handle share button click
  const handleShare = () => {
    const posterUrl = getPosterImage();
    if (posterUrl) {
      // Implement your sharing functionality here
      console.log('Sharing poster:', posterUrl);
      
      // Example: You could open a share dialog
      if (navigator.share) {
        navigator.share({
          title: 'My Business Poster',
          text: 'Check out my business poster!',
          url: posterUrl
        });
      } else {
        // Fallback for browsers that don't support navigator.share
        alert('Share functionality not available in this browser');
      }
    }
  };

  return (
    <div>
      {/* 
        YOUR EXISTING UI GOES HERE 
        This component doesn't change any of your UI design
      */}
      
      {/* Example of where you would place the poster container in your existing UI */}
      <div className="preview-container">
        <div 
          ref={posterContainerRef}
          className="poster-display"
          style={{ 
            width: '100%', 
            aspectRatio: '1040/1200',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            border: '3px solid white',
            overflow: 'hidden'
          }}
        >
          {/* The poster will be injected here by the SharePoster component */}
          <div>Loading your poster...</div>
        </div>
      </div>
      
      {/* Example of action buttons in your existing UI */}
      <div className="action-buttons" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={handleDownload}>Download Poster</button>
        <button onClick={handleShare}>Share Poster</button>
      </div>
      
      {/* This component handles the poster generation without changing your UI */}
      <SharePoster 
        userData={userData}
        userImage={userImage}
        containerRef={posterContainerRef}
      />
    </div>
  );
};

export default SharePosterPage;

/* 
  IMPORTANT NOTE:
  This is just an example implementation showing how to integrate the
  poster generator component with your existing UI design.
  
  In your real implementation:
  1. Replace the example userData with your actual user data
  2. Replace the example userImage with the actual processed image
  3. Add this component to your existing page without changing its design
  4. Make sure to include the mage.jpg in your public/images directory
*/ 