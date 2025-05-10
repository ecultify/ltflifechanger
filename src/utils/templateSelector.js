/**
 * Utility function to select a random template based on user's industry
 */

// Industry to directory mapping
const industryToDirectoryMap = {
  manufacturing: '1. manufacturing',
  retail: '2.  Retail & Wholesale Trade',
  services: '3.   Services',
  food: '4.   Food & Beverage',
  construction: '5.   Construction & Real Estate',
  healthcare: '6.    Healthcare',
  agriculture: '7.   Agriculture & Allied Activities',
  education: '8.   Education & Training',
  transport: '9.  Transport & Logistics',
  technology: '10.  IT & Tech Services',
  tourism: '11. Tourism & Hospitality',
  fashion: '12. Fashion & Apparel',
  events: '13. Event Management',
  ecommerce: '14.E-commerce Sellers',
  printing: '15.Printing & Packaging',
  beauty: '16.  Beauty & Wellness',
  automotive: '17.  Automotive Services',
  media: '18.   Media & Advertising Agencies',
  cleaning: '19.   Cleaning & Sanitation Services',
  handicrafts: '20.   Handicrafts & Artisan Units',
};

/**
 * Gets a random template path based on the industry
 * 
 * @param {string} industry - The user's selected industry
 * @returns {Promise<string>} Path to the template image
 */
export const getRandomTemplateForIndustry = async (industry) => {
  try {
    let templatePath = '';
    
    // Get the correct directory based on industry, or random if 'other'
    let targetDirectory = '';
    
    if (industry && industry !== 'other' && industryToDirectoryMap[industry]) {
      // Use the specific industry folder
      targetDirectory = industryToDirectoryMap[industry];
    } else {
      // For 'other' or unknown industry, select a random industry folder
      const industryKeys = Object.keys(industryToDirectoryMap);
      const randomIndustry = industryKeys[Math.floor(Math.random() * industryKeys.length)];
      targetDirectory = industryToDirectoryMap[randomIndustry];
    }
    
    // Fetch list of template files from the directory
    try {
      // In a browser environment, we can't directly access the file system
      // So we'll simulate the file structure for the specific industry
      // In a real implementation, you might need to use an API endpoint to get this list
      const templateFiles = await simulateGetTemplateFiles(targetDirectory);
      
      if (templateFiles && templateFiles.length > 0) {
        // Select a random template file
        const randomTemplate = templateFiles[Math.floor(Math.random() * templateFiles.length)];
        templatePath = `/images/templates/${targetDirectory}/${randomTemplate}`;
      } else {
        // Fallback to default template if no templates are found
        console.warn(`No templates found for industry: ${industry}, using default`);
        templatePath = '/images/mage.jpg';
      }
    } catch (error) {
      console.error(`Error fetching templates for directory ${targetDirectory}:`, error);
      templatePath = '/images/mage.jpg';
    }
    
    return templatePath;
  } catch (error) {
    console.error('Error in getRandomTemplateForIndustry:', error);
    return '/images/mage.jpg'; // Fallback to default template
  }
};

/**
 * Simulates fetching template files from the server
 * In a real implementation, this would be replaced with an actual API call
 * 
 * @param {string} directory - The template directory
 * @returns {Promise<string[]>} List of template filenames
 */
const simulateGetTemplateFiles = async (directory) => {
  // Simulate a collection of template files for each industry
  // In a real implementation, this would come from the server
  const templateFiles = {
    '1. manufacturing': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '2.  Retail & Wholesale Trade': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '3.   Services': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '4.   Food & Beverage': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '5.   Construction & Real Estate': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '6.    Healthcare': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '7.   Agriculture & Allied Activities': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '8.   Education & Training': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '9.  Transport & Logistics': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '10.  IT & Tech Services': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '11. Tourism & Hospitality': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '12. Fashion & Apparel': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '13. Event Management': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '14.E-commerce Sellers': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '15.Printing & Packaging': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '16.  Beauty & Wellness': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '17.  Automotive Services': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '18.   Media & Advertising Agencies': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '19.   Cleaning & Sanitation Services': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '20.   Handicrafts & Artisan Units': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
  };
  
  return templateFiles[directory] || [];
}; 