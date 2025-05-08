import React, { useState, useEffect, useMemo } from 'react';
import '../styles/pages/AddDetails.css';
import '../styles/pages/StepColorOverrides.css';
import '../styles/pages/AddDetailsOverrides.css'; // Added for layout adjustments
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { OPENAI_API_KEY } from '../config'; // Import API key from config file

// Add this at the top level to provide an alternative for testing
const testOpenAIAPI = async () => {
  try {
    console.log("Testing OpenAI API connection...");
    console.log("API Key available:", process.env.REACT_APP_OPENAI_API_KEY ? "Yes (length: " + process.env.REACT_APP_OPENAI_API_KEY.length + ")" : "No");
    
    // For debugging only, don't include in production
    console.log("API Key first 10 chars:", process.env.REACT_APP_OPENAI_API_KEY.substring(0, 10) + "...");
    
    // Create headers with more detailed configuration for project API keys
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
    };
    
    // If this is a project API key (starts with sk-proj-), you might need additional configuration
    if (process.env.REACT_APP_OPENAI_API_KEY.startsWith('sk-proj-')) {
      console.log("Using project API key format");
      // Some implementations might require organization ID for project keys
      if (process.env.REACT_APP_OPENAI_ORG_ID) {
        headers['OpenAI-Organization'] = process.env.REACT_APP_OPENAI_ORG_ID;
      }
    }
    
    console.log("Request headers:", headers);
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o",
        messages: [
          { role: "user", content: "Generate a quick test response in 5 words or less." }
        ],
        temperature: 0.7,
        max_tokens: 20
      },
      { headers }
    );
    console.log("Test response:", response.data);
    return "Test successful! API is working correctly.";
  } catch (error) {
    console.error("Test failed:", error);
    console.error("Error details:", error.response ? error.response.data : "No response data");
    
    if (error.response && error.response.status === 401) {
      return `Authentication failed: The API key appears to be invalid or expired. Status: ${error.response.status}`;
    }
    
    return `Test failed: ${error.message}`;
  }
};

const AddDetails = () => {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [businessVintage, setBusinessVintage] = useState('');
  const [turnover, setTurnover] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [tagline, setTagline] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [isTaglineGenerated, setIsTaglineGenerated] = useState(false);
  const [isGeneratingTagline, setIsGeneratingTagline] = useState(false);
  const [industryKeywords, setIndustryKeywords] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [needCallback, setNeedCallback] = useState(false);
  
  // Add resize listener to update mobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const navigate = useNavigate();

  // Industry keywords mapping
  const industryKeywordsMap = useMemo(() => ({
    manufacturing: ['Precision', 'Innovation', 'Quality', 'Efficiency', 'Reliability', 
      'Engineering', 'Scalability', 'Sustainability', 'Technology', 'Durability', 
      'Craftsmanship', 'Process', 'Customization', 'Performance', 'Industrial'],
    retail: ['Value', 'Selection', 'Savings', 'Trusted', 'Quick', 'Supply', 
      'Accessible', 'Everyday', 'Inventory', 'Price', 'Wholesale', 'Choice', 
      'Convenience', 'Reliable', 'Deals'],
    services: ['Professional', 'Expertise', 'Support', 'Trusted', 'Efficient', 
      'Personalized', 'On-demand', 'Client-first', 'Solutions', 'Seamless', 
      'Affordable', 'Timely', 'Hassle-free', 'Quality', 'Results'],
    food: ['Fresh', 'Flavor', 'Authentic', 'Taste', 'Nourish', 'Handcrafted', 
      'Sourced', 'Delight', 'Organic', 'Savory', 'Experience', 'Indulgent', 
      'Pure', 'Healthy', 'Joy'],
    construction: ['Solid', 'Vision', 'Build', 'Space', 'Modern', 'Reliable', 
      'Landmark', 'Property', 'Secure', 'Smart', 'Design', 'Investment', 
      'Durable', 'Elegant', 'Foundation'],
    healthcare: ['Care', 'Healing', 'Wellness', 'Trust', 'Relief', 'Safe', 
      'Expert', 'Recovery', 'Precision', 'Compassion', 'Advanced', 'Support', 
      'Health', 'Modern', 'Secure'],
    agriculture: ['Organic', 'Growth', 'Sustainable', 'Farm-fresh', 'Pure', 
      'Harvest', 'Natural', 'Soil', 'Season', 'Cultivate', 'Roots', 'Crop', 
      'Rural', 'Nourish', 'Yield'],
    education: ['Learn', 'Grow', 'Future', 'Empower', 'Skill', 'Inspire', 
      'Knowledge', 'Discover', 'Teach', 'Guide', 'Success', 'Bright', 
      'Innovate', 'Mentor', 'Achieve'],
    transport: ['Fast', 'Route', 'Safe', 'On-time', 'Network', 'Global', 
      'Ship', 'Track', 'Fleet', 'Delivery', 'Cargo', 'Efficient', 'Move', 
      'Road', 'Connect'],
    technology: ['Code', 'Digital', 'Secure', 'Scalable', 'Smart', 'Agile', 
      'AI', 'Data', 'Cloud', 'System', 'Future', 'Transform', 'Fast', 
      'Innovation', 'Integrate'],
    tourism: ['Escape', 'Comfort', 'Explore', 'Culture', 'Luxury', 'Stay', 
      'Experience', 'Unwind', 'Journey', 'Local', 'Discover', 'Memorable', 
      'Adventure', 'Delight', 'Warmth'],
    fashion: ['Style', 'Trend', 'Bold', 'Fit', 'Fabric', 'Modern', 'Timeless', 
      'Iconic', 'Look', 'Wear', 'Couture', 'Design', 'Wardrobe', 'Identity', 'Chic'],
    events: ['Celebrate', 'Plan', 'Seamless', 'Wow', 'Custom', 'Create', 
      'Detail', 'Stage', 'Experience', 'Flow', 'Decor', 'Moment', 'Memory', 
      'Design', 'Magic'],
    ecommerce: ['Online', 'Browse', 'Click', 'Fast', 'Value', 'Trusted', 
      'Discover', 'Store', 'Digital', 'Product', 'Global', 'Quick', 'Smart', 
      'Trendy', 'Delivered'],
    printing: ['Print', 'Package', 'Custom', 'Design', 'Bold', 'Finish', 
      'Durable', 'Detail', 'Color', 'Material', 'Shape', 'Label', 'Eco', 
      'Protect', 'Visual'],
    beauty: ['Glow', 'Natural', 'Radiant', 'Balance', 'Pure', 'Skin', 
      'Bliss', 'Revive', 'Youth', 'Ritual', 'Beauty', 'Calm', 'Feel', 
      'Care', 'Inside-out'],
    automotive: ['Drive', 'Smooth', 'Power', 'Safe', 'Tune', 'Reliable', 
      'Garage', 'Speed', 'Engine', 'Ride', 'Mileage', 'Precision', 'Service', 
      'Expert', 'On-road'],
    media: ['Buzz', 'Impact', 'Creative', 'Story', 'Bold', 'Brand', 
      'Viral', 'Message', 'Insight', 'Reach', 'Idea', 'Visual', 'Engage', 
      'Campaign', 'Voice'],
    cleaning: ['Sparkle', 'Fresh', 'Hygienic', 'Deep-clean', 'Safe', 
      'Tidy', 'Reliable', 'Sanitize', 'Shine', 'Spotless', 'Green', 
      'Purify', 'Swift', 'Trust', 'Clean'],
    handicrafts: ['Handmade', 'Craft', 'Authentic', 'Local', 'Unique', 
      'Art', 'Heritage', 'Tradition', 'Detail', 'Natural', 'Skilled', 
      'Touch', 'Inspired', 'Culture', 'Crafted'],
    other: ['Trusted', 'Passion', 'Smart', 'Driven', 'Unique', 'Growth', 
      'Bold', 'Modern', 'Vision', 'Local', 'Global', 'Agile', 'Creative', 
      'Experience', 'Legacy']
  }), []);

  // Update industry keywords when industry changes AND reset selected keywords
  useEffect(() => {
    if (industry) {
      setIndustryKeywords(industryKeywordsMap[industry] || []);
      // Reset keywords when industry changes to fix the issue with keywords not being reset
      setKeywords([]);
      // Reset tagline when industry changes
      setTagline('');
      setIsTaglineGenerated(false);
    } else {
      setIndustryKeywords([]);
    }
  }, [industry, industryKeywordsMap]);

  // List of negative keywords to filter out from name field
  const negativeKeywords = [
    'private', 'limited', 'ltd', 'clinic', 'corporate', 'company',
    // Add more abusive words or unwanted terms here
  ];

  // Function to check and filter name input
  const filterNameInput = (input) => {
    // Convert to lowercase for case-insensitive comparison
    const lowerInput = input.toLowerCase();
    
    // Check if input contains any negative keywords
    const containsNegativeKeyword = negativeKeywords.some(keyword => 
      lowerInput.includes(keyword.toLowerCase())
    );
    
    if (containsNegativeKeyword) {
      // Alert user about invalid input
      alert('Please avoid using business terms like "private", "limited", "ltd", "clinic", "corporate", "company" in the name field.');
      return false;
    }
    
    return true;
  };

  // Handle adding a keyword - limited to max 5 keywords
  const handleAddKeyword = (keyword) => {
    if (keyword && !keywords.includes(keyword)) {
      if (keywords.length < 5) {
        setKeywords([...keywords, keyword]);
        setKeywordInput('');
      } else {
        alert('You can select a maximum of 5 keywords');
      }
    }
  };

  // Handle removing a keyword
  const handleRemoveKeyword = (keywordToRemove) => {
    setKeywords(keywords.filter(keyword => keyword !== keywordToRemove));
  };

  // Handle key press in keyword input
  const handleKeywordKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddKeyword(keywordInput.trim());
    }
  };

  // Add a button to test the API
  const handleTestAPI = async () => {
    try {
      console.log("Testing API with key from config.js");
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      };
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-4o",
          messages: [
            { role: "user", content: "Generate a quick test response in 5 words or less." }
          ],
          temperature: 0.7,
          max_tokens: 20
        },
        { headers }
      );
      
      const result = "Test successful! API response: " + response.data.choices[0].message.content;
      alert(result);
      return result;
    } catch (error) {
      console.error("API test failed:", error);
      alert(`Test failed: ${error.message}`);
      return `Test failed: ${error.message}`;
    }
  };

  // Generate tagline using OpenAI API
  const handleGenerateTagline = async () => {
    if (keywords.length === 0) {
      alert("Please add at least one keyword to generate a tagline");
      return;
    }

    // Limit to max 5 keywords
    if (keywords.length > 5) {
      alert("Please select a maximum of 5 keywords");
      return;
    }

    console.log("Starting tagline generation with imported API key...");
    console.log("API Key available from config.js:", OPENAI_API_KEY ? "Yes (length: " + OPENAI_API_KEY.length + ")" : "No");
    
    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key is not available");
      alert("OpenAI API key is not configured. Using fallback tagline generation instead.");
      generateFallbackTagline();
      return;
    }

    setIsGeneratingTagline(true);

    try {
      console.log("Making API request to OpenAI...");
      
      // Create headers with the imported API key
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      };
      
      // Handle project API key format
      if (OPENAI_API_KEY.startsWith('sk-proj-')) {
        console.log("Using project API key format");
        // Note: You can add an organization ID here if needed
        // headers['OpenAI-Organization'] = 'your-org-id';
      }
      
      // Improved prompt for more meaningful and contextual taglines with highlighted keywords
      const requestData = {
        model: "gpt-4o",
          messages: [
            {
              role: "system",
            content: `You are a world-class marketing expert specializing in creating meaningful and impactful business taglines. Your task is to create a COHERENT and PROFESSIONALLY MEANINGFUL tagline that incorporates the following keywords organically: ${keywords.join(", ")}. 

Follow these strict requirements:
1. Create a first-person tagline (I/my/we/our) between 7-10 words total
2. Include as many of the provided keywords as possible while maintaining NATURAL FLOW
3. Keywords must be integrated MEANINGFULLY - not just forced into the tagline
4. Make the tagline specifically relevant to the "${industry || "business"}" industry 
5. The tagline must convey a SPECIFIC VALUE PROPOSITION that resonates with customers
6. Create something that sounds like a premium brand would use - professional, impactful and meaningful
7. HIGHLIGHT each keyword by placing asterisks around them (e.g., *keyword*)
8. The final tagline should read as a coherent statement even with the highlighted keywords
9. Focus on conveying expertise, transformation, or innovation related to the industry
10. No quotation marks or punctuation (except the asterisks for highlighting) in your response
11. Return ONLY the final tagline with proper spacing and highlighted keywords`
            },
            {
              role: "user",
            content: `Create a powerful, meaningful first-person tagline for my ${industry || "business"} business. The tagline should incorporate these keywords organically: ${keywords.join(", ")}.

The tagline must:
- Feel natural and professionally written with keywords *highlighted using asterisks*
- Have a clear, specific value proposition related to ${industry || "business"}
- Express a concrete benefit that would resonate with my target audience
- Be something a premium business would proudly use in marketing materials
- Highlight transformation, expertise, or innovation in my field
- Be memorable and impactful for use on a poster

Return only the final tagline text with keywords highlighted with asterisks (*keyword*) and no other punctuation or quotation marks.`
            }
          ],
        temperature: 0.75, // Slightly higher temperature for more creative but still controlled output
        max_tokens: 100
      };
      
      console.log("Request data:", requestData);
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        requestData,
        { headers }
      );

      console.log("API response received:", response);

      // Extract the generated tagline from the response
      let generatedTagline = response.data.choices[0].message.content.trim();
      
      // Remove any quotation marks, periods, or other unwanted characters (but preserve asterisks)
      generatedTagline = generatedTagline.replace(/["""'''.]/g, '');
      
      // Fix spacing issues - ensure single space between words
      generatedTagline = generatedTagline.replace(/\s+/g, ' ');
      
      console.log("Generated tagline with highlights:", generatedTagline);
      
      // Store the tagline with the keyword highlights intact
      setTagline(generatedTagline);
      setIsTaglineGenerated(true);
    } catch (error) {
      console.error("Error generating tagline:", error);
      console.error("Error details:", error.response ? error.response.data : "No response data");
      
      // If the error is an authentication error (401), show a more specific message
      if (error.response && error.response.status === 401) {
        alert("Authentication failed with OpenAI: The API key appears to be invalid or expired. Using fallback tagline generation.");
      } else {
        alert(`Failed to generate tagline: ${error.message}. Using fallback tagline generation.`);
      }
      
      generateFallbackTagline();
    } finally {
      setIsGeneratingTagline(false);
    }
  };

  // Fallback tagline generation in case API doesn't work
  const generateFallbackTagline = () => {
    // Enhanced industry-specific tagline templates with placeholders for keywords
    const industryTaglines = {
      manufacturing: {
        templates: [
          "I craft {keyword1} products with {keyword2} and unparalleled expertise",
          "I engineer {keyword1} solutions with {keyword2} and precision manufacturing",
          "I deliver {keyword1} manufacturing with {keyword2} and exceptional quality"
        ]
      },
      retail: {
        templates: [
          "I provide {keyword1} shopping experiences with {keyword2} customer service",
          "I offer {keyword1} products with {keyword2} and personalized attention",
          "I create {keyword1} retail environments with {keyword2} and satisfaction guaranteed"
        ]
      },
      services: {
        templates: [
          "I deliver {keyword1} services with {keyword2} and professional expertise",
          "I provide {keyword1} solutions with {keyword2} and client-focused dedication",
          "I offer {keyword1} support with {keyword2} and customized approaches"
        ]
      },
      finance: {
        templates: [
          "I secure {keyword1} futures with {keyword2} financial strategies",
          "I build {keyword1} portfolios with {keyword2} and expert guidance",
          "I create {keyword1} financial plans with {keyword2} and personalized solutions"
        ]
      },
      technology: {
        templates: [
          "I transform businesses with {keyword1} technology and {keyword2} solutions",
          "I develop {keyword1} systems with {keyword2} and cutting-edge innovation",
          "I deliver {keyword1} digital experiences with {keyword2} technical expertise"
        ]
      },
      // Default templates for other industries
      default: {
        templates: [
          "I deliver {keyword1} results with {keyword2} and professional expertise",
          "I provide {keyword1} solutions with {keyword2} and exceptional quality",
          "I create {keyword1} experiences with {keyword2} and dedicated service"
        ]
      }
    };

    // Function to fill template with actual keywords
    const fillTemplate = (template, keywordsToUse) => {
      let result = template;
      keywordsToUse.forEach((keyword, index) => {
        result = result.replace(`{keyword${index + 1}}`, keyword);
      });
      return result;
    };

    // If no keywords are available, use these generic ones
    const genericKeywords = [
      "innovative", "reliable", "professional", "quality", "trusted",
      "expert", "dedicated", "exceptional", "customized", "comprehensive"
    ];
    
    // Get appropriate templates for the industry or use default
    const templateSet = industryTaglines[industry] || industryTaglines.default;
    const templates = templateSet.templates;
    
    // Choose a random template
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    // Determine how many keywords are needed in this template
    const keywordPlaceholderCount = (selectedTemplate.match(/{keyword\d+}/g) || []).length;
    
    // Prepare keywords to use (either user selected or generics if needed)
    let keywordsToUse = [];
    
    if (keywords.length > 0) {
      // Use all user keywords if possible
      if (keywords.length >= keywordPlaceholderCount) {
        // Shuffle the keywords and pick the needed amount
        const shuffled = [...keywords].sort(() => 0.5 - Math.random());
        keywordsToUse = shuffled.slice(0, keywordPlaceholderCount);
      } else {
        // Use all available user keywords
        keywordsToUse = [...keywords];
        
        // Fill remaining slots with generic keywords
        const remainingSlots = keywordPlaceholderCount - keywords.length;
        const shuffledGeneric = [...genericKeywords].sort(() => 0.5 - Math.random());
        const additionalKeywords = shuffledGeneric.slice(0, remainingSlots);
        keywordsToUse = [...keywordsToUse, ...additionalKeywords];
      }
    } else {
      // No user keywords, use only generic ones
      const shuffled = [...genericKeywords].sort(() => 0.5 - Math.random());
      keywordsToUse = shuffled.slice(0, keywordPlaceholderCount);
    }
    
    // Generate the final tagline
    const generatedTagline = fillTemplate(selectedTemplate, keywordsToUse);
    
    setTagline(generatedTagline);
    setIsTaglineGenerated(true);
  };

  // Reset keywords when industry changes
  useEffect(() => {
    // Clear selected keywords when industry changes
    setKeywords([]);
    setTagline('');
    setIsTaglineGenerated(false);
  }, [industry]);

  // Handle name input with filtering
  const handleNameChange = (e) => {
    const value = e.target.value;
    if (filterNameInput(value)) {
      setName(value);
    }
  };

  // Handle next button click
  const handleNext = () => {
    // Store form data in sessionStorage instead of localStorage
    sessionStorage.setItem('userName', name);
    sessionStorage.setItem('companyName', companyName);
    sessionStorage.setItem('industry', industry);
    sessionStorage.setItem('businessVintage', businessVintage);
    sessionStorage.setItem('turnover', turnover);
    sessionStorage.setItem('needCallback', needCallback.toString());
    sessionStorage.setItem('tagline', tagline);
    
    // Store keywords as JSON string - using selectedKeywords key for consistency with SharePoster.js
    sessionStorage.setItem('selectedKeywords', JSON.stringify(keywords));
    
    // Find which keywords are actually used in the tagline for highlighting in the poster
    const highlightedKeywords = keywords.filter(keyword => {
      // Check if this keyword appears in the tagline (case insensitive)
      return tagline.toLowerCase().includes(keyword.toLowerCase());
    });
    
    // Store the highlighted keywords separately for the poster generation
    sessionStorage.setItem('highlightedKeywords', JSON.stringify(highlightedKeywords));
    
    // Move to the upload photo page
    navigate('/upload-photo');
  };

  // Common input style to ensure Poppins font
  const inputStyle = {
    fontFamily: 'Poppins, sans-serif'
  };

  // Style for yellow button
  const yellowButtonStyle = {
    backgroundColor: '#FFC107',
    color: '#000000',
  };

  return (
    <div className="details-page" style={{
      ...isMobile ? { backgroundColor: '#0a1a34' } : {},
      minHeight: 'calc(100vh - 120px)' // Reduced height as requested
    }}>
      <div className="left-section">
        {/* Desktop view with the new images layout - COMPLETE REDESIGN */}
        {!isMobile && (
          <>
            {/* Background image */}
            <img 
              src="/images/adddetails/UploadPhoto+AddDetails.png" 
              alt="Background" 
              className="left-section-background"
            />
            
            {/* Logo and Group images container */}
            <div style={{
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: '10px' /* Reduced padding to bring elements up */
            }}>
              {/* Logo container */}
              <div className="left-logo-container" style={{ position: 'absolute', top: '20px', left: '20px' }}>
                <img 
                  src="/images/adddetails/LOGO.png" 
                  alt="Logo" 
                  style={{ width: '350px' }} /* Increased size */
                />
              </div>
              
              {/* Group image */}
              <div className="left-group-container" style={{ position: 'absolute', top: '280px', left: '50%', transform: 'translateX(-50%)' }}>
                <img 
                  src="/images/adddetails/Group15183.png" 
                  alt="Group" 
                  style={{ width: '600px' }}
                />
              </div>
            </div>
            
            {/* People image */}
            <div className="left-people-container">
              <img 
                src="/images/adddetails/Layer1.png" 
                alt="People" 
                className="left-people-image"
              />
            </div>
          </>
        )}
        
        {/* Keep the original image for mobile view */}
        {isMobile && (
          <img 
            src="/images/adddetails pageimage.jpg" 
            alt="L&T Finance Add Details" 
            className="left-section-image"
          />
        )}
      </div>
      
      <div className="right-section">
        {isMobile && (
          <div style={{
            position: 'absolute',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '700px',
            height: '600px', // Further increased height to show full image
            backgroundImage: 'url("/images/Group_15198(1).png")',
            marginTop: '10px', // Push down by 10px
            backgroundSize: '100%', // Reduced size to fit better
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0
          }}></div>
        )}
        <div className="right-content" style={isMobile ? { marginTop: '600px' } : {}}>
          <div className="form-container">
            <div className="progress-tracker">
              <div className="progress-step active">
                <div className="step-circle">1</div>
                <div className="step-label">OTP</div>
              </div>
              <div className="progress-line active"></div>
              <div className="progress-step active">
                <div className="step-circle">2</div>
                <div className="step-label">Add Details</div>
              </div>
              <div className="progress-line"></div>
              <div className="progress-step">
                <div className="step-circle">3</div>
                <div className="step-label">Upload</div>
              </div>
            </div>
            
            <h1 className="form-title">Add your Details</h1>
            
            {/* Name field - alone in its row */}
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input 
                type="text" 
                id="name"
                placeholder="Your Name" 
                value={name}
                onChange={handleNameChange}
                className="form-input border-blue"
                style={inputStyle}
              />
            </div>
            
            {/* Company Name field removed as requested */}
            
            <div className="form-group">
              <label htmlFor="industry">Industry</label>
              <div className="select-wrapper border-blue">
                <select 
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="form-select"
                  style={inputStyle}
                >
                  <option value="" disabled>Choose industry</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="retail">Retail & Wholesale Trade</option>
                  <option value="services">Services</option>
                  <option value="food">Food & Beverage</option>
                  <option value="construction">Construction & Real Estate</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="agriculture">Agriculture & Allied Activities</option>
                  <option value="education">Education & Training</option>
                  <option value="transport">Transport & Logistics</option>
                  <option value="technology">IT & Tech Services</option>
                  <option value="tourism">Tourism & Hospitality</option>
                  <option value="fashion">Fashion & Apparel</option>
                  <option value="events">Event Management</option>
                  <option value="ecommerce">E-commerce Sellers</option>
                  <option value="printing">Printing & Packaging</option>
                  <option value="beauty">Beauty & Wellness</option>
                  <option value="automotive">Automotive Services</option>
                  <option value="media">Media & Advertising Agencies</option>
                  <option value="cleaning">Cleaning & Sanitation Services</option>
                  <option value="handicrafts">Handicrafts & Artisan Units</option>
                  <option value="other">Others</option>
                </select>
              </div>
            </div>
            
            {/* Business Vintage dropdown */}
            <div className="form-group">
              <label htmlFor="businessVintage">Business Vintage</label>
              <div className="select-wrapper border-blue">
                <select 
                  id="businessVintage"
                  value={businessVintage}
                  onChange={(e) => setBusinessVintage(e.target.value)}
                  className="form-select"
                  style={inputStyle}
                >
                  <option value="" disabled>Select business vintage</option>
                  <option value="<3">Less than 3 Years</option>
                  <option value="3-5">3-5 Years</option>
                  <option value="5-10">5-10 Years</option>
                  <option value="10+">10+ Years</option>
                </select>
              </div>
            </div>
            
            {/* Turnover dropdown */}
            <div className="form-group">
              <label htmlFor="turnover">Turnover</label>
              <div className="select-wrapper border-blue">
                <select 
                  id="turnover"
                  value={turnover}
                  onChange={(e) => setTurnover(e.target.value)}
                  className="form-select"
                  style={inputStyle}
                >
                  <option value="" disabled>Select annual turnover</option>
                  <option value="<80L">Less than 80 Lakh</option>
                  <option value="80L-3Cr">80 Lakh - 3 Cr</option>
                  <option value="3-10Cr">3 - 10 Cr</option>
                  <option value=">10Cr">More than 10 Cr</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="keywords">Keywords</label>
              <div className="keywords-input-container border-blue">
                <div className="keywords-tags">
                  {keywords.map((keyword, index) => (
                    <div key={index} className="keyword-tag">
                      {keyword}
                      <button 
                        type="button" 
                        className="remove-tag"
                        onClick={() => handleRemoveKeyword(keyword)}
                      >×</button>
                    </div>
                  ))}
                  <div className="keywords-input" style={{ ...inputStyle, fontStyle: 'italic', color: '#999' }}>
                    Select keywords from below
                  </div>
                </div>
              </div>
              <div className="suggested-keywords">
                {industryKeywords.length > 0 && 
                  industryKeywords.slice(0, 10).map((keyword, index) => (
                    <button 
                      key={index} 
                      type="button" 
                      className="suggested-keyword"
                      onClick={() => handleAddKeyword(keyword)}
                      disabled={keywords.includes(keyword)}
                      style={keywords.includes(keyword) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >{keyword}</button>
                  ))
                }
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="tagline">Generate Tagline</label>
              <div className="tagline-input-container">
                {/* First approach: Tagline input/display with buttons below it */}
                <div className="tagline-display-area" style={{ marginBottom: '15px' }}>
                  {tagline ? (
                    <div 
                      className="tagline-display border-blue"
                      style={{
                        ...inputStyle,
                        padding: '12px 15px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '2px',
                        backgroundColor: 'white',
                        width: '100%'
                      }}
                    >
                      {tagline.split(' ').map((word, index) => {
                        // Remove punctuation for comparison
                        const cleanWord = word.replace(/[.,!?;:()\[\]{}'"\-]/g, '').toLowerCase();
                        
                        // Check which keywords match this word
                        const matchingKeyword = keywords.find(keyword => {
                          const keywordLower = keyword.toLowerCase();
                          return cleanWord === keywordLower || cleanWord.includes(keywordLower);
                        });
                        
                        const isKeyword = !!matchingKeyword;
                        
                        // Apply special styling for keywords
                        return (
                          <span 
                            key={index} 
                            style={{
                              fontWeight: isKeyword ? 'bold' : 'normal',
                              color: isKeyword ? '#0083B5' : 'inherit',
                              display: 'inline-block',
                              textDecoration: isKeyword ? 'underline' : 'none',
                              textUnderlineOffset: '3px',
                              textDecorationThickness: '1px'
                            }}
                          >
                            {word}{index < tagline.split(' ').length - 1 ? ' ' : ''}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      id="tagline"
                      placeholder="Your company tagline..." 
                      value={tagline}
                      readOnly={true}
                      className="form-input border-blue"
                      style={inputStyle}
                    />
                  )}
                </div>
                
                {/* Buttons arranged horizontally */}
                <div className="tagline-buttons" style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="generate-btn"
                    onClick={handleGenerateTagline}
                    disabled={isGeneratingTagline || keywords.length === 0}
                    style={{
                      backgroundColor: isTaglineGenerated ? '#FFC107' : '#0083B5',
                      color: isTaglineGenerated ? '#000' : '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '10px 15px',
                      cursor: keywords.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: keywords.length === 0 ? 0.7 : 1,
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {isGeneratingTagline ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Generating...
                      </>
                    ) : isTaglineGenerated ? (
                      <>
                        <i className="fas fa-redo-alt"></i>
                        Regenerate
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic sparkle-icon"></i>
                        Generate
                      </>
                    )}
                  </button>
                  
                  {isTaglineGenerated && (
                    <button 
                      type="button" 
                      className="delete-btn"
                      onClick={() => {
                        setTagline('');
                        setIsTaglineGenerated(false);
                      }}
                      style={{
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '10px 15px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <i className="fas fa-trash"></i>
                      Delete
                    </button>
                  )}
                </div>
              </div>
              
              {/* Callback checkbox */}
              <div className="form-group" style={{ marginTop: '15px' }}>
                <div className="checkbox-container" style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id="needCallback"
                    checked={needCallback}
                    onChange={(e) => setNeedCallback(e.target.checked)}
                    style={{ marginRight: '10px', width: '18px', height: '18px' }}
                  />
                  <label htmlFor="needCallback" style={{ marginBottom: 0, fontWeight: 'normal' }}>
                    Information not correct? Get a call back!
                  </label>
                </div>
              </div>
            </div>
            
            <button className="next-btn" onClick={handleNext} style={yellowButtonStyle}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDetails;

