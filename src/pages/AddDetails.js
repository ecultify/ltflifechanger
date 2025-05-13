import React, { useState, useEffect, useMemo, useRef } from "react";
import "../styles/pages/AddDetails.css";
import "../styles/pages/StepColorOverrides.css";
import "../styles/pages/AddDetailsOverrides.css"; // Added for layout adjustments
import "../styles/components/FixedStepper.css"; // For fixed position stepper
import "../styles/pages/AddDetailsScrollFix.css"; // Added scroll fixes for desktop and mobile
import "../styles/pages/KeywordSuggestionsFix.css"; // Added fix for keyword suggestions display
import "../styles/pages/DirectFontOverride.css"; // Added direct override for font and spacing issues
import "../styles/pages/MobileImageCenter.css"; // Added for centering Group15183 image on mobile
import "../styles/pages/Group15183Fix.css"; // Added for Group15183 desktop positioning
import "../styles/pages/AddDetailsMobileFix.css"; // Added for form container mobile positioning
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { OPENAI_API_KEY } from "../config"; // Import API key from config file
import { saveUserDataToGoogleSheets } from "../utils/googleSheetsService"; // Import Google Sheets service

// Add this at the top level to provide an alternative for testing
const testOpenAIAPI = async () => {
  try {
    console.log("Testing OpenAI API connection...");
    console.log(
      "API Key available:",
      process.env.REACT_APP_OPENAI_API_KEY
        ? "Yes (length: " + process.env.REACT_APP_OPENAI_API_KEY.length + ")"
        : "No"
    );

    // For debugging only, don't include in production
    console.log(
      "API Key first 10 chars:",
      process.env.REACT_APP_OPENAI_API_KEY.substring(0, 10) + "..."
    );

    // Create headers with more detailed configuration for project API keys
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
    };

    // If this is a project API key (starts with sk-proj-), you might need additional configuration
    if (process.env.REACT_APP_OPENAI_API_KEY.startsWith("sk-proj-")) {
      console.log("Using project API key format");
      // Some implementations might require organization ID for project keys
      if (process.env.REACT_APP_OPENAI_ORG_ID) {
        headers["OpenAI-Organization"] = process.env.REACT_APP_OPENAI_ORG_ID;
      }
    }

    console.log("Request headers:", headers);

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: "Generate a quick test response in 5 words or less.",
          },
        ],
        temperature: 0.7,
        max_tokens: 20,
      },
      { headers }
    );
    console.log("Test response:", response.data);
    return "Test successful! API is working correctly.";
  } catch (error) {
    console.error("Test failed:", error);
    console.error(
      "Error details:",
      error.response ? error.response.data : "No response data"
    );

    if (error.response && error.response.status === 401) {
      return `Authentication failed: The API key appears to be invalid or expired. Status: ${error.response.status}`;
    }

    return `Test failed: ${error.message}`;
  }
};

const AddDetails = () => {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessVintage, setBusinessVintage] = useState("");
  const [turnover, setTurnover] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [tagline, setTagline] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [isTaglineGenerated, setIsTaglineGenerated] = useState(false);
  const [isGeneratingTagline, setIsGeneratingTagline] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [industryKeywords, setIndustryKeywords] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  // Callback option removed as requested

  // Check if on mobile device
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Apply mobile form positioning override
  useEffect(() => {
    if (isMobile) {
      // Force proper form container margin on mobile
      setTimeout(() => {
        try {
          const formContainer = document.querySelector('.form-container');
          if (formContainer) {
            formContainer.style.setProperty('margin-top', '-65px', 'important');
            formContainer.style.setProperty('z-index', '100', 'important');
            console.log('Applied form container position override for mobile');
          }
        } catch (err) {
          console.error('Error applying form container position:', err);
        }
      }, 100); // Short delay to ensure DOM is ready
    }
  }, [isMobile]);

  const navigate = useNavigate();

  // Industry keywords mapping
  const industryKeywordsMap = useMemo(
    () => ({
      manufacturing: [
        "Precision",
        "Innovation",
        "Quality",
        "Efficiency",
        "Reliability",
        "Engineering",
        "Scalability",
        "Sustainability",
        "Technology",
        "Durability",
        "Craftsmanship",
        "Process",
        "Customization",
        "Performance",
        "Industrial",
      ],
      retail: [
        "Value",
        "Selection",
        "Savings",
        "Trusted",
        "Quick",
        "Supply",
        "Accessible",
        "Everyday",
        "Inventory",
        "Price",
        "Wholesale",
        "Choice",
        "Convenience",
        "Reliable",
        "Deals",
      ],
      services: [
        "Professional",
        "Expertise",
        "Support",
        "Trusted",
        "Efficient",
        "Personalized",
        "On-demand",
        "Client-first",
        "Solutions",
        "Seamless",
        "Affordable",
        "Timely",
        "Hassle-free",
        "Quality",
        "Results",
      ],
      food: [
        "Fresh",
        "Flavor",
        "Authentic",
        "Taste",
        "Nourish",
        "Handcrafted",
        "Sourced",
        "Delight",
        "Organic",
        "Savory",
        "Experience",
        "Indulgent",
        "Pure",
        "Healthy",
        "Joy",
      ],
      construction: [
        "Solid",
        "Vision",
        "Build",
        "Space",
        "Modern",
        "Reliable",
        "Landmark",
        "Property",
        "Secure",
        "Smart",
        "Design",
        "Investment",
        "Durable",
        "Elegant",
        "Foundation",
      ],
      healthcare: [
        "Care",
        "Healing",
        "Wellness",
        "Trust",
        "Relief",
        "Safe",
        "Expert",
        "Recovery",
        "Precision",
        "Compassion",
        "Advanced",
        "Support",
        "Health",
        "Modern",
        "Secure",
      ],
      agriculture: [
        "Organic",
        "Growth",
        "Sustainable",
        "Farm-fresh",
        "Pure",
        "Harvest",
        "Natural",
        "Soil",
        "Season",
        "Cultivate",
        "Roots",
        "Crop",
        "Rural",
        "Nourish",
        "Yield",
      ],
      education: [
        "Learn",
        "Grow",
        "Future",
        "Empower",
        "Skill",
        "Inspire",
        "Knowledge",
        "Discover",
        "Teach",
        "Guide",
        "Success",
        "Bright",
        "Innovate",
        "Mentor",
        "Achieve",
      ],
      transport: [
        "Fast",
        "Route",
        "Safe",
        "On-time",
        "Network",
        "Global",
        "Ship",
        "Track",
        "Fleet",
        "Delivery",
        "Cargo",
        "Efficient",
        "Move",
        "Road",
        "Connect",
      ],
      technology: [
        "Code",
        "Digital",
        "Secure",
        "Scalable",
        "Smart",
        "Agile",
        "AI",
        "Data",
        "Cloud",
        "System",
        "Future",
        "Transform",
        "Fast",
        "Innovation",
        "Integrate",
      ],
      tourism: [
        "Escape",
        "Comfort",
        "Explore",
        "Culture",
        "Luxury",
        "Stay",
        "Experience",
        "Unwind",
        "Journey",
        "Local",
        "Discover",
        "Memorable",
        "Adventure",
        "Delight",
        "Warmth",
      ],
      fashion: [
        "Style",
        "Trend",
        "Bold",
        "Fit",
        "Fabric",
        "Modern",
        "Timeless",
        "Iconic",
        "Look",
        "Wear",
        "Couture",
        "Design",
        "Wardrobe",
        "Identity",
        "Chic",
      ],
      events: [
        "Celebrate",
        "Plan",
        "Seamless",
        "Wow",
        "Custom",
        "Create",
        "Detail",
        "Stage",
        "Experience",
        "Flow",
        "Decor",
        "Moment",
        "Memory",
        "Design",
        "Magic",
      ],
      ecommerce: [
        "Online",
        "Browse",
        "Click",
        "Fast",
        "Value",
        "Trusted",
        "Discover",
        "Store",
        "Digital",
        "Product",
        "Global",
        "Quick",
        "Smart",
        "Trendy",
        "Delivered",
      ],
      printing: [
        "Print",
        "Package",
        "Custom",
        "Design",
        "Bold",
        "Finish",
        "Durable",
        "Detail",
        "Color",
        "Material",
        "Shape",
        "Label",
        "Eco",
        "Protect",
        "Visual",
      ],
      beauty: [
        "Glow",
        "Natural",
        "Radiant",
        "Balance",
        "Pure",
        "Skin",
        "Bliss",
        "Revive",
        "Youth",
        "Ritual",
        "Beauty",
        "Calm",
        "Feel",
        "Care",
        "Inside-out",
      ],
      automotive: [
        "Drive",
        "Smooth",
        "Power",
        "Safe",
        "Tune",
        "Reliable",
        "Garage",
        "Speed",
        "Engine",
        "Ride",
        "Mileage",
        "Precision",
        "Service",
        "Expert",
        "On-road",
      ],
      media: [
        "Buzz",
        "Impact",
        "Creative",
        "Story",
        "Bold",
        "Brand",
        "Viral",
        "Message",
        "Insight",
        "Reach",
        "Idea",
        "Visual",
        "Engage",
        "Campaign",
        "Voice",
      ],
      cleaning: [
        "Sparkle",
        "Fresh",
        "Hygienic",
        "Deep-clean",
        "Safe",
        "Tidy",
        "Reliable",
        "Sanitize",
        "Shine",
        "Spotless",
        "Green",
        "Purify",
        "Swift",
        "Trust",
        "Clean",
      ],
      handicrafts: [
        "Handmade",
        "Craft",
        "Authentic",
        "Local",
        "Unique",
        "Art",
        "Heritage",
        "Tradition",
        "Detail",
        "Natural",
        "Skilled",
        "Touch",
        "Inspired",
        "Culture",
        "Crafted",
      ],
      other: [
        "Trusted",
        "Passion",
        "Smart",
        "Driven",
        "Unique",
        "Growth",
        "Bold",
        "Modern",
        "Vision",
        "Local",
        "Global",
        "Agile",
        "Creative",
        "Experience",
        "Legacy",
      ],
    }),
    []
  );

  // Update industry keywords when industry changes AND reset selected keywords
  useEffect(() => {
    if (industry) {
      setIndustryKeywords(industryKeywordsMap[industry] || []);
      // Reset keywords when industry changes to fix the issue with keywords not being reset
      setKeywords([]);
      // Reset tagline when industry changes
      setTagline("");
      setIsTaglineGenerated(false);
    } else {
      setIndustryKeywords([]);
    }
  }, [industry, industryKeywordsMap]);

  // List of negative keywords to filter out from name field
  const negativeKeywords = [
    "private",
    "limited",
    "ltd",
    "clinic",
    "corporate",
    "company",
    // Add more abusive words or unwanted terms here
  ];

  // Function to check and filter name input
  const filterNameInput = (input) => {
    // Convert to lowercase for case-insensitive comparison
    const lowerInput = input.toLowerCase();

    // Check if input contains any negative keywords
    const containsNegativeKeyword = negativeKeywords.some((keyword) =>
      lowerInput.includes(keyword.toLowerCase())
    );

    if (containsNegativeKeyword) {
      // Alert user about invalid input
      alert(
        'Please avoid using business terms like "private", "limited", "ltd", "clinic", "corporate", "company" in the name field.'
      );
      return false;
    }

    return true;
  };

  // Handle adding a keyword - limited to max 5 keywords
  const handleAddKeyword = (keyword) => {
    if (keyword && !keywords.includes(keyword)) {
      if (keywords.length < 5) {
        setKeywords([...keywords, keyword]);
        setKeywordInput("");
      } else {
        alert("You can select a maximum of 5 keywords");
      }
    }
  };

  // Handle removing a keyword
  const handleRemoveKeyword = (keywordToRemove) => {
    setKeywords(keywords.filter((keyword) => keyword !== keywordToRemove));
  };

  // Handle key press in keyword input
  const handleKeywordKeyPress = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddKeyword(keywordInput.trim());
    }
  };

  // Add a button to test the API
  const handleTestAPI = async () => {
    try {
      console.log("Testing API with key from config.js");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      };

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: "Generate a quick test response in 5 words or less.",
            },
          ],
          temperature: 0.7,
          max_tokens: 20,
        },
        { headers }
      );

      const result =
        "Test successful! API response: " +
        response.data.choices[0].message.content;
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
    
    // Store the selected keywords in session storage for use in the final poster
    sessionStorage.setItem('selectedKeywords', JSON.stringify(keywords));

    console.log("Starting tagline generation with imported API key...");
    console.log(
      "API Key available from config.js:",
      OPENAI_API_KEY ? "Yes (length: " + OPENAI_API_KEY.length + ")" : "No"
    );

    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key is not available");
      alert(
        "OpenAI API key is not configured. Using fallback tagline generation instead."
      );
      generateFallbackTagline();
      return;
    }

    // Check if we're regenerating
    const isRegeneration = isTaglineGenerated;
    if (isRegeneration) {
      setIsRegenerating(true);
      setRegenerationCount((prevCount) => prevCount + 1);
    }

    setIsGeneratingTagline(true);

    try {
      console.log("Making API request to OpenAI...");
      console.log("Is regenerating:", isRegeneration ? "Yes" : "No");

      // Create headers with the imported API key
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      };

      // Handle project API key format
      if (OPENAI_API_KEY.startsWith("sk-proj-")) {
        console.log("Using project API key format");
        // Note: You can add an organization ID here if needed
        // headers['OpenAI-Organization'] = 'your-org-id';
      }

      // Define system message based on whether this is regeneration or first generation
      const systemMessage = isRegeneration
        ? `You are a world-class marketing expert specializing in creating meaningful and impactful business taglines. 
        
IMPORTANT: This is a REGENERATION request. You must create a COMPLETELY DIFFERENT tagline than previous attempts, with a new structure and approach.

Your task is to create a COHERENT and PROFESSIONALLY MEANINGFUL tagline that incorporates the following keywords organically: ${keywords.join(
            ", "
          )}. 

Follow these strict requirements:
1. Create a first-person tagline (I/my/we/our) between 7-10 words total
2. Include as many of the provided keywords as possible while maintaining NATURAL FLOW
3. Keywords must be integrated MEANINGFULLY - not just forced into the tagline
4. Make the tagline specifically relevant to the "${
            industry || "business"
          }" industry 
5. The tagline must convey a SPECIFIC VALUE PROPOSITION that resonates with customers
6. Create something that sounds like a premium brand would use - professional, impactful and meaningful
7. HIGHLIGHT each keyword by placing asterisks around them (e.g., *keyword*)
8. The final tagline should read as a coherent statement even with the highlighted keywords
9. Focus on conveying expertise, transformation, or innovation related to the industry
10. No quotation marks or punctuation (except the asterisks for highlighting) in your response
11. Return ONLY the final tagline with proper spacing and highlighted keywords`
        : `You are a world-class marketing expert specializing in creating meaningful and impactful business taglines. Your task is to create a COHERENT and PROFESSIONALLY MEANINGFUL tagline that incorporates the following keywords organically: ${keywords.join(
            ", "
          )}. 

Follow these strict requirements:
1. Create a first-person tagline (I/my/we/our) between 7-10 words total
2. Include as many of the provided keywords as possible while maintaining NATURAL FLOW
3. Keywords must be integrated MEANINGFULLY - not just forced into the tagline
4. Make the tagline specifically relevant to the "${
            industry || "business"
          }" industry 
5. The tagline must convey a SPECIFIC VALUE PROPOSITION that resonates with customers
6. Create something that sounds like a premium brand would use - professional, impactful and meaningful
7. HIGHLIGHT each keyword by placing asterisks around them (e.g., *keyword*)
8. The final tagline should read as a coherent statement even with the highlighted keywords
9. Focus on conveying expertise, transformation, or innovation related to the industry
10. No quotation marks or punctuation (except the asterisks for highlighting) in your response
11. Return ONLY the final tagline with proper spacing and highlighted keywords`;

      // Define user message based on whether this is regeneration or first generation
      const userMessage = isRegeneration
        ? `Create a NEW and DIFFERENT powerful, meaningful first-person tagline for my ${
            industry || "business"
          } business. 
        
This is a REGENERATION request - I need a COMPLETELY DIFFERENT tagline than previously generated, using the same keywords: ${keywords.join(
            ", "
          )}.

The tagline must:
- Feel natural and professionally written with keywords *highlighted using asterisks*
- Have a clear, specific value proposition related to ${industry || "business"}
- Express a concrete benefit that would resonate with my target audience
- Be something a premium business would proudly use in marketing materials
- Highlight transformation, expertise, or innovation in my field
- Be memorable and impactful for use on a poster
- Use a DIFFERENT APPROACH than previous generations

Return only the final tagline text with keywords highlighted with asterisks (*keyword*) and no other punctuation or quotation marks.`
        : `Create a powerful, meaningful first-person tagline for my ${
            industry || "business"
          } business. The tagline should incorporate these keywords organically: ${keywords.join(
            ", "
          )}.

The tagline must:
- Feel natural and professionally written with keywords *highlighted using asterisks*
- Have a clear, specific value proposition related to ${industry || "business"}
- Express a concrete benefit that would resonate with my target audience
- Be something a premium business would proudly use in marketing materials
- Highlight transformation, expertise, or innovation in my field
- Be memorable and impactful for use on a poster

Return only the final tagline text with keywords highlighted with asterisks (*keyword*) and no other punctuation or quotation marks.`;

      // Create request data with variables for temperature
      // Increase temperature when regenerating to increase variation
      // Using a higher base temperature (0.95) for regeneration and adding more variation
      // based on the regeneration count to ensure more diverse results
      const temperature = isRegeneration
        ? 0.95 + Math.min(regenerationCount, 4) * 0.07
        : 0.8;

      // Improved prompt for more meaningful and contextual taglines with highlighted keywords
      const requestData = {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `${systemMessage}
            
CRITICAL INSTRUCTION: You MUST include ALL of these keywords in the tagline: ${keywords.join(", ")}. Do not skip any keywords; all ${keywords.length} keywords must be included and properly highlighted with asterisks (*). This is a firm requirement.`,
          },
          {
            role: "user",
            content: `${userMessage}
            
IMPORTANT: Make sure to include ALL of these ${keywords.length} keywords in your tagline: ${keywords.join(", ")}. Don't skip any. Highlight each one with asterisks.`,
          },
        ],
        temperature: isRegeneration ? temperature : 0.7, 
        max_tokens: 150, 
        
        presence_penalty: isRegeneration ? 0.8 : 0.2,
       
        frequency_penalty: isRegeneration ? 0.9 : 0.3,
      };

      console.log("Request data:", requestData);

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        requestData,
        { headers }
      );

      console.log("API response received:", response);

      
      let generatedTagline = response.data.choices[0].message.content.trim();
      
      
      const missingKeywords = keywords.filter(keyword => {
       
        const keywordPattern = new RegExp(`\\*${keyword}\\*|\\*${keyword}s\\*|\\*${keyword.slice(0, -1)}\\*`, 'i');
        return !keywordPattern.test(generatedTagline);
      });
      
      // Log the check results
      console.log("Missing keywords:", missingKeywords);
      
      if (missingKeywords.length > 0) {
        console.warn(`Not all keywords included in the tagline. Missing: ${missingKeywords.join(", ")}`);
        
       
        const secondAttemptData = {
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an expert tagline creator. Your ONLY job is to create a tagline that includes ALL of these keywords: ${keywords.join(", ")}. Each keyword MUST be highlighted with asterisks.`
            },
            {
              role: "user",
              content: `Create a first-person tagline (7-10 words) that MUST include ALL of these keywords: ${keywords.join(", ")}. 
              
These keywords were missing from your previous attempt: ${missingKeywords.join(", ")}. Please make sure each keyword is highlighted with asterisks (*keyword*). The tagline should be professional and related to the ${industry || "business"} industry. Return ONLY the tagline.`
            }
          ],
          temperature: 0.5, // Lower temperature for more precision
          max_tokens: 100
        };
        
        console.log("Making second attempt with more explicit instructions");
        const secondResponse = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          secondAttemptData,
          { headers }
        );
        
        const secondTagline = secondResponse.data.choices[0].message.content.trim();
        
        // Check if the second attempt contains all missing keywords
        const stillMissingKeywords = missingKeywords.filter(keyword => {
          const keywordPattern = new RegExp(`\\*${keyword}\\*|\\*${keyword}s\\*|\\*${keyword.slice(0, -1)}\\*`, 'i');
          return !keywordPattern.test(secondTagline);
        });
        
        if (stillMissingKeywords.length === 0) {
          // Second attempt succeeded in including all missing keywords
          console.log("Second attempt successful, all keywords included");
          generatedTagline = secondTagline;
        } else {
          // If second attempt still failed, use a fallback approach to ensure all keywords
          console.warn("Second attempt also failed to include all keywords. Using manual fallback approach");
          
          // Preserve the generated tagline if it includes at least some of the keywords
          if (missingKeywords.length < keywords.length) {
            console.log("Using best generated tagline and manually incorporating missing keywords");
            // Use whichever tagline has more of the keywords included
            const firstAttemptMissingCount = missingKeywords.length;
            const secondAttemptMissingCount = stillMissingKeywords.length;
            
            // Choose the better attempt
            const betterTagline = firstAttemptMissingCount <= secondAttemptMissingCount 
              ? generatedTagline 
              : secondTagline;
            
            // Add a suffix phrase with the missing keywords
            let finalKeywords = firstAttemptMissingCount <= secondAttemptMissingCount
              ? missingKeywords
              : stillMissingKeywords;
              
            // Create a phrase that incorporates the remaining keywords
            let suffix = " with ";
            finalKeywords.forEach((keyword, index) => {
              suffix += `*${keyword}* `;
              if (index < finalKeywords.length - 2) {
                suffix += "and ";
              }
            });
            suffix += "excellence";
            
            generatedTagline = betterTagline + suffix;
          } else {
            // If no keywords were included, create a complete fallback
            console.warn("Creating complete fallback tagline with all keywords");
            
            // Generate a simple tagline that includes all keywords
            let fallbackTagline = `I deliver ${industry || "business"} success with `;
            
            keywords.forEach((keyword, index) => {
              fallbackTagline += `*${keyword}* `;
              if (index < keywords.length - 2) {
                fallbackTagline += "and ";
              } else if (index === keywords.length - 2) {
                fallbackTagline += "and ";
              }
            });
            
            generatedTagline = fallbackTagline;
          }
        }
      }

      // Remove any quotation marks, periods, or other unwanted characters (but preserve asterisks)
      generatedTagline = generatedTagline.replace(/["""'''.]/g, "");

      // Fix spacing issues - ensure single space between words
      generatedTagline = generatedTagline.replace(/\s+/g, " ");

      console.log("Generated tagline with highlights:", generatedTagline);

      // Store the tagline with the keyword highlights intact
      setTagline(generatedTagline);
      setIsTaglineGenerated(true);

      // Save tagline to session storage for use in the final poster
      sessionStorage.setItem('tagline', generatedTagline);
      
      // Extract and save highlighted keywords for backup in case the asterisks get lost
      // This provides an additional way to identify which words should be bold
      try {
        const highlightedWords = [];
        const regex = /\*(.*?)\*/g;
        let match;
        while ((match = regex.exec(generatedTagline)) !== null) {
          if (match[1] && match[1].trim().length > 0) {
            highlightedWords.push(match[1].trim());
          }
        }
        
        // If we found highlighted words in the tagline, save them
        if (highlightedWords.length > 0) {
          const allBoldWords = [...keywords, ...highlightedWords];
          sessionStorage.setItem('highlightedKeywords', JSON.stringify(allBoldWords));
        }
      } catch (e) {
        console.error('Error extracting highlighted keywords:', e);
      }
    } catch (error) {
      console.error("Error generating tagline:", error);
      console.error(
        "Error details:",
        error.response ? error.response.data : "No response data"
      );

      // If the error is an authentication error (401), show a more specific message
      if (error.response && error.response.status === 401) {
        alert(
          "Authentication failed with OpenAI: The API key appears to be invalid or expired. Using fallback tagline generation."
        );
      } else {
        alert(
          `Failed to generate tagline: ${error.message}. Using fallback tagline generation.`
        );
      }

      generateFallbackTagline();
    } finally {
      setIsGeneratingTagline(false);
      if (isRegeneration) {
        setIsRegenerating(false);
      }
    }
  };

  // Fallback tagline generation in case API doesn't work
  const generateFallbackTagline = () => {
    // Enhanced industry-specific tagline templates with placeholders for up to 5 keywords
    const industryTaglines = {
      manufacturing: {
        templates: [
          "I craft *{keyword1}* products with *{keyword2}* *{keyword3}* and *{keyword4}* *{keyword5}* expertise",
          "I deliver *{keyword1}* *{keyword2}* manufacturing with *{keyword3}* *{keyword4}* and *{keyword5}* quality",
          "I provide *{keyword1}* *{keyword2}* *{keyword3}* solutions with *{keyword4}* and *{keyword5}* precision",
        ],
      },
      retail: {
        templates: [
          "I create *{keyword1}* *{keyword2}* shopping with *{keyword3}* *{keyword4}* and *{keyword5}* service",
          "I offer *{keyword1}* *{keyword2}* products with *{keyword3}* *{keyword4}* and *{keyword5}* care",
          "I deliver *{keyword1}* *{keyword2}* *{keyword3}* retail with *{keyword4}* and *{keyword5}* satisfaction",
        ],
      },
      services: {
        templates: [
          "I provide *{keyword1}* *{keyword2}* services with *{keyword3}* *{keyword4}* and *{keyword5}* expertise",
          "I deliver *{keyword1}* *{keyword2}* *{keyword3}* solutions with *{keyword4}* and *{keyword5}* dedication",
          "I offer *{keyword1}* *{keyword2}* support with *{keyword3}* *{keyword4}* and *{keyword5}* approaches",
        ],
      },
      finance: {
        templates: [
          "I build *{keyword1}* *{keyword2}* futures with *{keyword3}* *{keyword4}* and *{keyword5}* strategies",
          "I create *{keyword1}* *{keyword2}* *{keyword3}* portfolios with *{keyword4}* and *{keyword5}* guidance",
          "I provide *{keyword1}* *{keyword2}* financial plans with *{keyword3}* *{keyword4}* and *{keyword5}* solutions",
        ],
      },
      technology: {
        templates: [
          "I transform *{keyword1}* businesses with *{keyword2}* *{keyword3}* *{keyword4}* and *{keyword5}* solutions",
          "I develop *{keyword1}* *{keyword2}* systems with *{keyword3}* *{keyword4}* and *{keyword5}* innovation",
          "I deliver *{keyword1}* *{keyword2}* *{keyword3}* experiences with *{keyword4}* and *{keyword5}* expertise",
        ],
      },
      // Default templates for other industries
      default: {
        templates: [
          "I deliver *{keyword1}* *{keyword2}* results with *{keyword3}* *{keyword4}* and *{keyword5}* expertise",
          "I provide *{keyword1}* *{keyword2}* *{keyword3}* solutions with *{keyword4}* and *{keyword5}* quality",
          "I create *{keyword1}* *{keyword2}* experiences with *{keyword3}* *{keyword4}* and *{keyword5}* service",
        ],
      },
    };

    // Function to fill template with actual keywords
    const fillTemplate = (template, keywordsToUse) => {
      let result = template;
      keywordsToUse.forEach((keyword, index) => {
        const placeholder = `*{keyword${index + 1}}*`;
        result = result.replace(placeholder, `*${keyword}*`);
      });
      // Remove any remaining placeholders
      result = result.replace(/\*\{keyword\d+\}\*/g, "");
      // Clean up multiple spaces
      result = result.replace(/\s+/g, " ").trim();
      return result;
    };

    // If no keywords are available, use these generic ones
    const genericKeywords = [
      "innovative",
      "reliable",
      "professional",
      "quality",
      "trusted",
      "expert",
      "dedicated",
      "exceptional",
      "customized",
      "comprehensive",
    ];

    // Get appropriate templates for the industry or use default
    const templateSet = industryTaglines[industry] || industryTaglines.default;
    const templates = templateSet.templates;

    // Choose a random template
    const selectedTemplate =
      templates[Math.floor(Math.random() * templates.length)];

    // Prepare keywords to use
    let keywordsToUse = [];

    if (keywords.length > 0) {
      // Use all user keywords
      keywordsToUse = [...keywords];
      
      // If we have less than 5 keywords, we'll fill the rest with generics
      if (keywordsToUse.length < 5) {
        // Get generic keywords that are not already in user keywords
        const availableGenericKeywords = genericKeywords.filter(
          generic => !keywords.includes(generic)
        );
        // Shuffle them
        const shuffledGeneric = [...availableGenericKeywords].sort(() => 0.5 - Math.random());
        // Take what we need to fill up to 5
        const additionalKeywords = shuffledGeneric.slice(0, 5 - keywordsToUse.length);
        // Add to our keywords
        keywordsToUse.push(...additionalKeywords);
      }
    } else {
      // No user keywords, use 5 generic ones
      const shuffled = [...genericKeywords].sort(() => 0.5 - Math.random());
      keywordsToUse = shuffled.slice(0, 5);
    }

    // Generate the final tagline
    const generatedTagline = fillTemplate(selectedTemplate, keywordsToUse);

    // Save the tagline to state
    setTagline(generatedTagline);
    setIsTaglineGenerated(true);
    
    // Save to session storage
    sessionStorage.setItem('tagline', generatedTagline);
    
    // Extract and save highlighted keywords
    try {
      const highlightedWords = [];
      const regex = /\*(.*?)\*/g;
      let match;
      while ((match = regex.exec(generatedTagline)) !== null) {
        if (match[1] && match[1].trim().length > 0) {
          highlightedWords.push(match[1].trim());
        }
      }
      
      // If we found highlighted words in the tagline, save them
      if (highlightedWords.length > 0) {
        sessionStorage.setItem('highlightedKeywords', JSON.stringify(highlightedWords));
      }
    } catch (e) {
      console.error('Error extracting highlighted keywords:', e);
    }
  };

  // Reset keywords when industry changes
  useEffect(() => {
    // Clear selected keywords when industry changes
    setKeywords([]);
    setTagline("");
    setIsTaglineGenerated(false);
  }, [industry]);

  // State for validation errors
  const [errors, setErrors] = useState({});

  // Handle name input with filtering
  const handleNameChange = (e) => {
    const value = e.target.value;
    if (filterNameInput(value)) {
      setName(value);
    }
  };

  // Handle next button click
  const handleNext = async () => {
    // Validate form fields
    const validationErrors = {};
    
    if (!name.trim()) validationErrors.name = "Name is required";
    if (!industry) validationErrors.industry = "Please select an industry";
    if (!businessVintage) validationErrors.businessVintage = "Please select business vintage";
    if (!turnover) validationErrors.turnover = "Please select turnover";
    if (keywords.length === 0) validationErrors.keywords = "Please select at least one keyword";
    if (!tagline) validationErrors.tagline = "Please generate a tagline";
    
    // If there are validation errors, display them and stop form submission
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      alert("Please fill in all required fields");
      return;
    }
    
    // Clear any previous errors
    setErrors({});

    // Store form data in sessionStorage instead of localStorage
    sessionStorage.setItem("userName", name);
    sessionStorage.setItem("companyName", name); // Using name for company name as well
    sessionStorage.setItem("industry", industry);
    sessionStorage.setItem("businessVintage", businessVintage);
    sessionStorage.setItem("turnover", turnover);
    
    // Store the original tagline with asterisks for backend processing
    sessionStorage.setItem("tagline", tagline);

    // Also store a clean version of the tagline without asterisks
    const cleanTagline = tagline.replace(/\*(.*?)\*/g, "$1");
    sessionStorage.setItem("cleanTagline", cleanTagline);

    // Store keywords as JSON string - using selectedKeywords key for consistency with SharePoster.js
    sessionStorage.setItem("selectedKeywords", JSON.stringify(keywords));

    // Identify any highlighted keywords based on tagline content
    const highlightedWords = keywords.filter((keyword) => {
      // Check if this keyword appears in the tagline (case insensitive)
      const keywordRegex = new RegExp(`\\*?${keyword}\\*?`, "i");
      return keywordRegex.test(tagline);
    });
    
    // Store the highlighted keywords separately for the poster generation
    sessionStorage.setItem(
      "highlightedKeywords",
      JSON.stringify(highlightedWords)
    );
    
    // Save the form data to Google Sheets
    try {
      // Prepare the user data object
      const userData = {
        name: name,
        companyName: name, // Using name for company name as well
        industry: industry,
        businessVintage: businessVintage,
        turnover: turnover,
        keywords: keywords,
        tagline: cleanTagline, // Use the clean version without asterisks
        // Email and phone could be added here if they were collected in this form
      };
      
      console.log("Saving form data to Google Sheets...");
      
      // Save to Google Sheets using the service
      // We'll do this asynchronously but not wait for completion to avoid delaying navigation
      saveUserDataToGoogleSheets(userData)
        .then(result => {
          console.log("Data successfully saved to Google Sheets:", result);
        })
        .catch(error => {
          console.error("Error saving data to Google Sheets:", error);
          // Continue with navigation even if Google Sheets save fails
        });
    } catch (error) {
      console.error("Error preparing data for Google Sheets:", error);
      // Don't block navigation if there's an error with Google Sheets
    }

    // Move to the upload photo page
    navigate("/upload-photo");
  };

  // Common input style to ensure Poppins font
  const inputStyle = {
    fontFamily: "Poppins, sans-serif",
  };

  // Style for yellow button
  const yellowButtonStyle = {
    backgroundColor: "#FFC107",
    color: "#000000",
  };

  // Handle tagline selection
  const taglineRef = useRef(null);

  // Log when regenerate button is clicked
  useEffect(() => {
    if (isRegenerating) {
      console.log("Regenerating tagline with count:", regenerationCount);
    }
  }, [isRegenerating, regenerationCount]);

  return (
    <div
      className="details-page"
      style={
        isMobile
          ? {
              backgroundImage: `url('/images/adddetails/UploadPhoto+AddDetails.png')`,
            }
          : {}
      }
    >
      {" "}
      {!isMobile && (
        <div className="left-section">
          <img
            src="/images/adddetails/UploadPhoto+AddDetails.png"
            alt="Background"
            className="left-section-background"
          />
          <div className="left-logo-container">
            <Link to="/">
              <img
                src="/images/adddetails/LOGO.png"
                alt="L&T Finance Logo"
                className="left-logo-image"
                style={{ marginTop: "-15px" }}
              />{" "}
            </Link>{" "}
          </div>{" "}
          <div className="left-group-container">
            <img
              src="/images/adddetails/Group15183.png"
              alt="Group"
              className="left-group-image"
              style={{ marginTop: "-30px", marginLeft: "30px" }}
            />{" "}
          </div>{" "}
          <div className="left-people-container">
            <img
              src="/images/adddetails/Layer1.png"
              alt="Layer"
              className="left-people-image"
              style={{ marginTop: "-25px" }}
            />{" "}
          </div>{" "}
        </div>
      )}
      <div className="right-section">
        {" "}
        {/* Fixed position stepper */}{" "}
        <div className="fixed-stepper-container">
          <div className="fixed-stepper">
            <div className="progress-step completed">
              <div className="step-circle"> 1 </div>{" "}
              <div className="step-label"> OTP </div>{" "}
            </div>{" "}
            <div className="progress-line active"> </div>{" "}
            <div className="progress-step active">
              <div className="step-circle"> 2 </div>{" "}
              <div className="step-label"> Add Details </div>{" "}
            </div>{" "}
            <div className="progress-line active"> </div>{" "}
            <div className="progress-step">
              <div className="step-circle"> 3 </div>{" "}
              <div className="step-label"> Upload </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>
        <div className="right-content">
          {" "}
          {/* Mobile elements container */}{" "}
          {isMobile && (
            <div
              className="mobile-elements-container"
              style={{ marginBottom: "-40px" }}
            >
              <Link to="/">
                <img
                  src="/images/adddetails/LOGO.png"
                  alt="L&T Finance Logo"
                  className="mobile-logo"
                  style={{ marginTop: "-15px", marginLeft: "10px" }}
                />{" "}
              </Link>{" "}
              <img
                src="/images/adddetails/Group15183.png"
                alt="Group"
                className="mobile-group"
                style={{ 
                  marginTop: "-15px",
                  marginLeft: "calc(50% - 135px)", /* Adjusted 30px to the right */
                  transform: "translateX(-50%)", /* Center adjustment */
                  display: "block",
                  width: "80%",
                  maxWidth: "300px"
                }}
              />{" "}
              <img
                src="/images/adddetails/Layer1.png"
                alt="Layer"
                className="mobile-layer"
                style={{
                  position: "relative",
                  zIndex: 1,
                  marginTop: "-15px",
                  marginBottom: "60px",
                }}
              />{" "}
            </div>
          )}
          <div
            className="form-container"
            style={{
              marginBottom: "-20px",
              marginTop: isMobile ? "-80px" : "0px",
              position: "relative",
              zIndex: 10,
              minHeight: isMobile ? "auto" : "700px", /* Reduced from 800px to 700px */
              height: isMobile ? "auto" : "auto", /* Allow expansion beyond minimum on desktop if needed */
              overflow: "visible",
              overflowY: "visible"
            }}
          >
            {" "}
            {/* Mobile stepper inside form */}{" "}
            {isMobile && (
              <div className="mobile-stepper-container form-stepper">
                <div className="mobile-stepper">
                  <div className="progress-step completed">
                    <div className="step-circle"> 1 </div>{" "}
                    <div className="step-label"> OTP </div>{" "}
                  </div>{" "}
                  <div className="progress-line active"> </div>{" "}
                  <div className="progress-step active">
                    <div className="step-circle"> 2 </div>{" "}
                    <div className="step-label"> Add Details </div>{" "}
                  </div>{" "}
                  <div className="progress-line"> </div>{" "}
                  <div className="progress-step">
                    <div className="step-circle"> 3 </div>{" "}
                    <div className="step-label"> Upload </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>
            )}
            <h1 className="form-title"> Add your Details </h1>
            {/* Name and Industry in one row */}{" "}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name"> Name <span style={{ color: "red" }}>*</span> </label>{" "}
                <input
                  type="text"
                  id="name"
                  placeholder="Your Name"
                  value={name}
                  onChange={handleNameChange}
                  className="form-input border-blue"
                  style={inputStyle}
                />{" "}
              </div>
              <div className="form-group">
                <label htmlFor="industry"> Industry <span style={{ color: "red" }}>*</span> </label>{" "}
                <div className="select-wrapper border-blue">
                  <select
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="form-select"
                    style={inputStyle}
                  >
                    <option value="" disabled>
                      {" "}
                      Choose industry{" "}
                    </option>{" "}
                    <option value="manufacturing"> Manufacturing </option>{" "}
                    <option value="retail"> Retail & Wholesale Trade </option>{" "}
                    <option value="services"> Services </option>{" "}
                    <option value="food"> Food & Beverage </option>{" "}
                    <option value="construction">
                      {" "}
                      Construction & Real Estate{" "}
                    </option>{" "}
                    <option value="healthcare"> Healthcare </option>{" "}
                    <option value="agriculture">
                      {" "}
                      Agriculture & Allied Activities{" "}
                    </option>{" "}
                    <option value="education">
                      {" "}
                      Education & Training{" "}
                    </option>{" "}
                    <option value="transport">
                      {" "}
                      Transport & Logistics{" "}
                    </option>{" "}
                    <option value="technology">
                      {" "}
                      IT & Tech Services{" "}
                    </option>{" "}
                    <option value="tourism">
                      {" "}
                      Tourism & Hospitality{" "}
                    </option>{" "}
                    <option value="fashion"> Fashion & Apparel </option>{" "}
                    <option value="events"> Event Management </option>{" "}
                    <option value="ecommerce"> E - commerce Sellers </option>{" "}
                    <option value="printing"> Printing & Packaging </option>{" "}
                    <option value="beauty"> Beauty & Wellness </option>{" "}
                    <option value="automotive"> Automotive Services </option>{" "}
                    <option value="media">
                      {" "}
                      Media & Advertising Agencies{" "}
                    </option>{" "}
                    <option value="cleaning">
                      {" "}
                      Cleaning & Sanitation Services{" "}
                    </option>{" "}
                    <option value="handicrafts">
                      {" "}
                      Handicrafts & Artisan Units{" "}
                    </option>{" "}
                    <option value="other"> Others </option>{" "}
                  </select>{" "}
                </div>{" "}
              </div>{" "}
            </div>
            {/* Business Vintage and Turnover in one row */}{" "}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="businessVintage"> Business Vintage <span style={{ color: "red" }}>*</span> </label>{" "}
                <div className="select-wrapper border-blue">
                  <select
                    id="businessVintage"
                    value={businessVintage}
                    onChange={(e) => setBusinessVintage(e.target.value)}
                    className="form-select"
                    style={inputStyle}
                  >
                    <option value="" disabled>
                      {" "}
                      Select business vintage{" "}
                    </option>{" "}
                    <option value="<3"> Less than 3 Years </option>{" "}
                    <option value="3-5"> 3 - 5 Years </option>{" "}
                    <option value="5-10"> 5 - 10 Years </option>{" "}
                    <option value="10+"> 10 + Years </option>{" "}
                  </select>{" "}
                </div>{" "}
              </div>
              <div className="form-group">
                <label htmlFor="turnover"> Turnover <span style={{ color: "red" }}>*</span> </label>{" "}
                <div className="select-wrapper border-blue">
                  <select
                    id="turnover"
                    value={turnover}
                    onChange={(e) => setTurnover(e.target.value)}
                    className="form-select"
                    style={inputStyle}
                  >
                    <option value="" disabled>
                      {" "}
                      Select annual turnover{" "}
                    </option>{" "}
                    <option value="<80L"> Less than 80 Lakh </option>{" "}
                    <option value="80L-3Cr"> 80 Lakh - 3 Cr </option>{" "}
                    <option value="3-10Cr"> 3 - 10 Cr </option>{" "}
                    <option value=">10Cr"> More than 10 Cr </option>{" "}
                  </select>{" "}
                </div>{" "}
              </div>{" "}
            </div>
            {/* Keywords in one row */}{" "}
            <div className="form-row">
              <div className="form-group" style={{ width: "100%", marginBottom: isMobile ? "10px" : "0px" }}>
                <label htmlFor="keywords"> Select your keyword <span style={{ color: "red" }}>*</span> </label>{" "}
                <div className="keywords-input-container border-blue" style={{
                  minHeight: isMobile ? "auto" : "60px", /* Increased min-height for multiple keyword rows */
                  height: "auto",
                  maxHeight: isMobile ? "auto" : "80px", /* Constrain maximum height */
                  overflow: "auto"  /* Allow scrolling if too many keywords */
                }}>
                  <div className="keywords-tags">
                    {" "}
                    {keywords.map((keyword, index) => (
                      <div key={index} className="keyword-tag">
                        {" "}
                        {keyword}{" "}
                        <button
                          type="button"
                          className="remove-tag"
                          onClick={() => handleRemoveKeyword(keyword)}
                        >
                          ×{" "}
                        </button>{" "}
                      </div>
                    ))}{" "}
                  </div>{" "}
                </div>{" "}
                {/* Fixed height container that will always take up the same vertical space */}
                <div style={{
                  position: "relative",
                  width: "100%",
                  height: isMobile ? "auto" : "70px", /* Increased fixed height on desktop */
                  marginBottom: "0px",
                  maxHeight: isMobile ? "none" : "70px", /* Constrain maximum height */
                  overflow: "visible"
                }}>
                  <div className="suggested-keywords" style={{ 
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100%",
                    marginBottom: "0px", 
                    paddingBottom: "0px"
                  }}>
                    {/* Always render the container even if empty to maintain layout */}
                    {industryKeywords.length > 0 ? (
                      industryKeywords.slice(0, 10).map((keyword, index) => (
                        <button
                          key={index}
                          type="button"
                          className="suggested-keyword"
                          onClick={() => handleAddKeyword(keyword)}
                          disabled={keywords.includes(keyword)}
                          style={
                            keywords.includes(keyword)
                              ? { opacity: 0.5, cursor: "not-allowed" }
                              : {}
                          }
                        >
                          {keyword}{" "}
                        </button>
                      ))
                    ) : (
                      <div style={{ visibility: "hidden" }}>
                        {/* Hidden placeholder buttons to maintain space */}
                        {[1,2,3,4,5].map(i => (
                          <button key={i} className="suggested-keyword" style={{ visibility: "hidden" }}>
                            placeholder
                          </button>
                        ))}
                      </div>
                    )}{" "}
                  </div>
                </div>{" "}
              </div>{" "}
            </div>
            {/* Tagline in one row - pushed up with negative margin */}{" "}
            <div className="form-row" style={{ marginTop: isMobile ? "0px" : "-15px" }}>
              <div
                className="form-group"
                style={{ width: "100%", marginBottom: "5px", marginTop: isMobile ? "0px" : "-3px" }}
              >
                <label
                  htmlFor="tagline"
                  style={{
                    fontSize: isMobile ? "12px" : "16px", // 12px for mobile, 16px for desktop
                    fontWeight: "500",
                    color: "#333",
                    display: "block",
                    marginBottom: isMobile ? "5px" : "2px", // Reduced bottom margin on desktop
                    marginTop: isMobile ? "0px" : "-5px", // Negative top margin on desktop
                    fontFamily: "Poppins, sans-serif",
                    maxHeight: isMobile ? "16px" : "18px", // Slightly reduced max-height
                    lineHeight: "1.2",
                    textTransform: "none"
                  }}
                >
                  Generate Tagline <span style={{ color: "red" }}>*</span>
                </label>{" "}
                <div
                  className="tagline-row"
                  style={{ flexDirection: "column", width: "100%" }}
                >
                  <div className="tagline-field" style={{ width: "100%" }}>
                    {" "}
                    {tagline ? (
                      <textarea
                        ref={taglineRef}
                        className="tagline-display border-blue"
                        // Display tagline without asterisks for cleaner UI
                        value={tagline.replace(/\*(.*?)\*/g, "$1")}
                        readOnly={true}
                        style={{
                          ...inputStyle,
                          height: "60px", // Fixed height, not auto
                          minHeight: "60px",
                          maxHeight: "60px", // Fixed max height equal to height
                          padding: "10px 12px",
                          overflow: "auto", /* Show scrollbar if text exceeds max height */
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          wordWrap: "break-word",
                          cursor: "text",
                          backgroundColor: "#f8f8f8",
                          lineHeight: "1.4",
                          fontSize: "14px",
                          resize: "none",
                          width: "100%",
                          border: "1px solid #ddd",
                        }}
                      />
                    ) : (
                      <input
                        type="text"
                        id="tagline"
                        placeholder="Your company tagline will appear here..."
                        value={tagline}
                        readOnly={true}
                        className="form-input border-blue"
                        style={{
                          ...inputStyle,
                          height: "38px",
                          lineHeight: "38px",
                        }}
                      />
                    )}{" "}
                  </div>{" "}
                  <div
                    className="tagline-actions"
                    style={{
                      marginTop: "10px",
                      display: "flex",
                      justifyContent: "flex-start",
                      width: "100%",
                    }}
                  >
                    <button
                      type="button"
                      className="generate-btn"
                      onClick={handleGenerateTagline}
                      disabled={isGeneratingTagline || keywords.length === 0}
                      style={{
                        backgroundColor: "#0083B5",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        padding: "5px 15px",
                        height: "32px",
                        cursor:
                          keywords.length === 0 ? "not-allowed" : "pointer",
                        opacity: keywords.length === 0 ? 0.7 : 1,
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        marginTop: "5px",
                        width: window.innerWidth > 768 ? "25%" : "100%", // 25% width on desktop, 100% on mobile
                        maxWidth: window.innerWidth > 768 ? "25%" : "100%",
                      }}
                    >
                      {isGeneratingTagline ? (
                        <>
                          <i className="fas fa-spinner fa-spin"> </i>
                          Generating...{" "}
                        </>
                      ) : isTaglineGenerated ? (
                        <>
                          <i className="fas fa-redo-alt"> </i>
                          Regenerate{" "}
                        </>
                      ) : (
                        <>
                          <i className="fas fa-magic sparkle-icon"> </i>
                          Generate{" "}
                        </>
                      )}{" "}
                    </button>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>
            <button
              className="next-btn"
              onClick={handleNext}
              style={{
                ...yellowButtonStyle,
                marginTop: "5px",
                marginBottom: "-20px",
              }}
            >
              Next{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
};

export default AddDetails;
