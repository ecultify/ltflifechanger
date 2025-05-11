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
  // Actual template files for each industry based on directory structure
  const templateFiles = {
    '1. manufacturing': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    '2.  Retail & Wholesale Trade': ['Frame 15169.png', 'Frame 15170.png', 'Frame 15171.png', 'Frame 15172.png', 'Frame 15173.png'],
    '3.   Services': ['Frame 15174.png', 'Frame 15178.png'],
    '4.   Food & Beverage': ['Frame 15179.png', 'Frame 15180.png', 'Frame 15181.png', 'Frame 15182.png', 'Frame 15183.png'],
    '5.   Construction & Real Estate': ['Frame 15184.png', 'Frame 15185.png', 'Frame 15186.png', 'Frame 15187.png', 'Frame 15188.png'],
    '6.    Healthcare': ['Frame 15189.png', 'Frame 15190.png', 'Frame 15191.png', 'Frame 15192.png', 'Frame 15193.png'],
    '7.   Agriculture & Allied Activities': ['Frame 15194.png', 'Frame 15195.png', 'Frame 15196.png', 'Frame 15197.png', 'Frame 15198.png'],
    '8.   Education & Training': ['Frame 15199.png', 'Frame 15200.png', 'Frame 15201.png', 'Frame 15202.png', 'Frame 15203.png'],
    '9.  Transport & Logistics': ['Frame 15204.png', 'Frame 15205.png', 'Frame 15206.png', 'Frame 15207.png', 'Frame 15208.png'],
    '10.  IT & Tech Services': ['Frame 15209.png', 'Frame 15210.png', 'Frame 15211.png', 'Frame 15212.png', 'Frame 15213.png'],
    '11. Tourism & Hospitality': ['Frame 15214.png', 'Frame 15215.png', 'Frame 15216.png', 'Frame 15217.png', 'Frame 15218.png'],
    '12. Fashion & Apparel': ['Frame 15219.png', 'Frame 15220.png', 'Frame 15221.png', 'Frame 15222.png', 'Frame 15223.png'],
    '13. Event Management': ['Frame 15224.png', 'Frame 15225.png', 'Frame 15226.png', 'Frame 15227.png', 'Frame 15228.png'],
    '14.E-commerce Sellers': ['Frame 15229.png', 'Frame 15230.png', 'Frame 15231.png', 'Frame 15232.png', 'Frame 15233.png'],
    '15.Printing & Packaging': ['Frame 15234.png', 'Frame 15235.png', 'Frame 15236.png', 'Frame 15237.png', 'Frame 15238.png'],
    '16.  Beauty & Wellness': ['Frame 15239.png', 'Frame 15240.png', 'Frame 15241.png', 'Frame 15242.png', 'Frame 15243.png'],
    '17.  Automotive Services': ['Frame 15244.png', 'Frame 15245.png', 'Frame 15246.png', 'Frame 15247.png', 'Frame 15248.png'],
    '18.   Media & Advertising Agencies': ['Frame 15249.png', 'Frame 15250.png', 'Frame 15251.png', 'Frame 15252.png', 'Frame 15253.png'],
    '19.   Cleaning & Sanitation Services': ['Frame 15254.png', 'Frame 15255.png', 'Frame 15256.png', 'Frame 15257.png', 'Frame 15258.png'],
    '20.   Handicrafts & Artisan Units': ['Frame 15259.png', 'Frame 15260.png', 'Frame 15261.png', 'Frame 15262.png', 'Frame 15263.png'],
  };
  
  return templateFiles[directory] || [];
};