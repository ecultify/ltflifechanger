import React, { useState, useEffect, useMemo } from 'react';
import '../styles/pages/AddDetails.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  const [keywords, setKeywords] = useState([]);
  const [tagline, setTagline] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [isTaglineGenerated, setIsTaglineGenerated] = useState(false);
  const [isGeneratingTagline, setIsGeneratingTagline] = useState(false);
  const [industryKeywords, setIndustryKeywords] = useState([]);
  
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

  // Update industry keywords when industry changes
  useEffect(() => {
    if (industry) {
      setIndustryKeywords(industryKeywordsMap[industry] || []);
    } else {
      setIndustryKeywords([]);
    }
  }, [industry, industryKeywordsMap]);

  // Handle adding a keyword
  const handleAddKeyword = (keyword) => {
    if (keyword && !keywords.includes(keyword)) {
      setKeywords([...keywords, keyword]);
      setKeywordInput('');
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
    const result = await testOpenAIAPI();
    alert(result);
  };

  // Generate tagline using OpenAI API
  const handleGenerateTagline = async () => {
    if (keywords.length === 0) {
      alert("Please add at least one keyword to generate a tagline");
      return;
    }

    console.log("Starting tagline generation...");
    console.log("API Key available:", process.env.REACT_APP_OPENAI_API_KEY ? "Yes (length: " + process.env.REACT_APP_OPENAI_API_KEY.length + ")" : "No");
    
    if (!process.env.REACT_APP_OPENAI_API_KEY) {
      console.error("OpenAI API key is not set in environment variables");
      alert("OpenAI API key is not configured. Using fallback tagline generation instead.");
      generateFallbackTagline();
      return;
    }

    setIsGeneratingTagline(true);

    // For debugging only, don't include in production
    console.log("API Key first 10 chars:", process.env.REACT_APP_OPENAI_API_KEY.substring(0, 10) + "...");

    try {
      console.log("Making API request to OpenAI...");
      
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
      
      const requestData = {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a world-class marketing expert specializing in creating memorable, impactful business taglines. Your task is to create a short, catchy, and powerful tagline in first person that captures the essence of the business and incorporates their keywords. The tagline should be 5-8 words maximum, memorable, and have a strong emotional impact. It should sound natural, not generic, and convey the unique value proposition of the business."
          },
          {
            role: "user",
            content: `I need a powerful first-person tagline for my ${industry || "business"} company${companyName ? ` called "${companyName}"` : ""}. The tagline should incorporate these keywords: ${keywords.join(", ")}. Make it engaging, memorable, and under 8 words. It should sound like a confident statement that resonates with customers and stands out from competitors. Please provide just the tagline itself with no explanations or quotation marks.`
          }
        ],
        temperature: 0.8,
        max_tokens: 50
      };
      
      console.log("Request headers:", headers);
      console.log("Request data:", requestData);
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        requestData,
        { headers }
      );

      console.log("API response received:", response);
      
      // Extract the generated tagline from the response
      let generatedTagline = response.data.choices[0].message.content.trim();
      
      // Remove any quotation marks that might be in the response
      generatedTagline = generatedTagline.replace(/["']/g, '');
      
      console.log("Generated tagline:", generatedTagline);
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
    const industryTaglines = {
      manufacturing: "I craft perfection with precision and reliability.",
      retail: "I deliver trusted value and quality every day.",
      services: "I provide seamless solutions with professional expertise.",
      food: "I serve fresh, authentic flavors that nourish souls.",
      construction: "I build durable spaces with vision and reliability.",
      healthcare: "I care for your health with compassion and expertise.",
      agriculture: "I grow sustainable harvests from nature's bounty.",
      education: "I inspire lifelong learning and empower bright futures.",
      transport: "I connect journeys efficiently, on-time, every time.",
      technology: "I transform businesses with innovative digital solutions.",
      tourism: "I create memorable journeys and luxurious experiences.",
      fashion: "I design your unique style with trend-setting pieces.",
      events: "I create magical moments worth remembering forever.",
      ecommerce: "I deliver digital convenience and trusted online value.",
      printing: "I bring your designs to life with vibrant precision.",
      beauty: "I revitalize your natural glow with pure care.",
      automotive: "I keep your engines running with reliable service.",
      media: "I amplify your message with creative, bold campaigns.",
      cleaning: "I restore spotless spaces with safe, green methods.",
      handicrafts: "I preserve cultural heritage through handmade treasures.",
      other: "I deliver excellence through passion and dedication."
    };

    // Get a generic tagline based on industry or use the default
    const generatedTagline = industryTaglines[industry] || "I deliver excellence with passion and quality service.";
    
    // Add one of the keywords if available
    const finalTagline = keywords.length > 0 
      ? `${generatedTagline} ${keywords[0]} is my priority.`
      : generatedTagline;
    
    setTagline(finalTagline);
    setIsTaglineGenerated(true);
  };

  // Handle next button click
  const handleNext = () => {
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
    <div className="details-page">
      <div className="left-section">
        <img 
          src="/images/Upload Photo + Add Details.png" 
          alt="L&T Finance Add Details" 
          className="left-section-image"
        />
      </div>
      
      <div className="right-section">
        <div className="right-content">
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
          
          <div className="form-container">
            <h1 className="form-title">Add your Details</h1>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input 
                  type="text" 
                  id="name"
                  placeholder="Your Name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input border-blue"
                  style={inputStyle}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="companyName">Company Name</label>
                <input 
                  type="text" 
                  id="companyName"
                  placeholder="Company Name" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="form-input border-blue"
                  style={inputStyle}
                />
              </div>
            </div>
            
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
                  <input 
                    type="text" 
                    id="keywords"
                    placeholder="Add keywords..." 
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyPress}
                    className="keywords-input"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div className="suggested-keywords">
                {industryKeywords.length > 0 ? (
                  industryKeywords.slice(0, 10).map((keyword, index) => (
                    <button 
                      key={index} 
                      type="button" 
                      className="suggested-keyword"
                      onClick={() => handleAddKeyword(keyword)}
                    >{keyword}</button>
                  ))
                ) : (
                  <p className="industry-prompt">Select an industry to see suggested keywords</p>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="tagline">Generate Tagline</label>
              <div className="tagline-input-container">
                <input 
                  type="text" 
                  id="tagline"
                  placeholder="Your company tagline..." 
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="form-input border-blue"
                  style={inputStyle}
                />
                <button 
                  type="button" 
                  className="generate-btn"
                  onClick={handleGenerateTagline}
                  disabled={isGeneratingTagline || keywords.length === 0}
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
              </div>
              
              {/* Add test button for debugging */}
              <div style={{ marginTop: '10px', textAlign: 'right' }}>
                <button 
                  type="button" 
                  onClick={handleTestAPI}
                  style={{ 
                    backgroundColor: '#ddd', 
                    color: '#333', 
                    border: 'none', 
                    padding: '5px 10px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Test API Connection
                </button>
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

