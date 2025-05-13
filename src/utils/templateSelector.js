/**
 * Utility function to select a random template based on user's industry
 */

// Cache to store previously selected templates by industry
const templateCache = {};

// Industry to directory mapping
const industryToDirectoryMap = {
    manufacturing: 'Manufacturing',
    retail: 'Retail & Wholesale Trade',
    services: 'Services',
    food: 'Food & Beverage',
    construction: 'Construction & Real Estate',
    healthcare: 'Healthcare',
    agriculture: 'Agriculture & Allied Activities',
    education: 'Education & Training',
    transport: 'Transport & Logistics',
    technology: 'IT & Tech Services',
    tourism: 'Tourism & Hospitality',
    fashion: 'Fashion & Apparel',
    events: 'Event Management',
    ecommerce: 'E-commerce Sellers',
    printing: 'Printing & Packaging',
    beauty: 'Beauty & Wellness',
    automotive: 'Automotive Services',
    media: 'Media & Advertising Agencies',
    cleaning: 'Cleaning & Sanitation Services',
    handicrafts: 'Handicrafts & Artisan Units',
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
    'Manufacturing': ['Frame 15164.png', 'Frame 15165.png', 'Frame 15166.png', 'Frame 15167.png', 'Frame 15168.png'],
    'Retail & Wholesale Trade': ['Frame 15169.png', 'Frame 15170.png', 'Frame 15171.png', 'Frame 15172.png', 'Frame 15173.png'],
    'Services': ['Frame 15174.png', 'Frame 15175.png', 'Frame 15176.png', 'Frame 15177.png', 'Frame 15178.png'],
    'Food & Beverage': ['Frame 15179.png', 'Frame 15180.png', 'Frame 15181.png', 'Frame 15182.png', 'Frame 15183.png'],
    'Construction & Real Estate': ['Frame 15184.png', 'Frame 15185.png', 'Frame 15186.png', 'Frame 15187.png', 'Frame 15188.png'],
    'Healthcare': ['Frame 15189.png', 'Frame 15190.png', 'Frame 15191.png', 'Frame 15192.png', 'Frame 15193.png'],
    'Agriculture & Allied Activities': ['Frame 15194.png', 'Frame 15195.png', 'Frame 15196.png', 'Frame 15197.png', 'Frame 15198.png'],
    'Education & Training': ['Frame 15199.png', 'Frame 15200.png', 'Frame 15201.png', 'Frame 15202.png', 'Frame 15203.png'],
    'Transport & Logistics': ['Frame 15204.png', 'Frame 15205.png', 'Frame 15206.png', 'Frame 15207.png', 'Frame 15208.png'],
    'IT & Tech Services': ['Frame 15209.png', 'Frame 15210.png', 'Frame 15211.png', 'Frame 15212.png', 'Frame 15213.png'],
    'Tourism & Hospitality': ['Frame 15214.png', 'Frame 15215.png', 'Frame 15216.png', 'Frame 15217.png', 'Frame 15218.png'],
    'Fashion & Apparel': ['Frame 15219.png', 'Frame 15220.png', 'Frame 15221.png', 'Frame 15222.png', 'Frame 15223.png'],
    'Event Management': ['Frame 15224.png', 'Frame 15225.png', 'Frame 15226.png', 'Frame 15227.png', 'Frame 15228.png'],
    'E-commerce Sellers': ['Frame 15229.png', 'Frame 15230.png', 'Frame 15231.png', 'Frame 15232.png', 'Frame 15233.png'],
    'Printing & Packaging': ['Frame 15234.png', 'Frame 15235.png', 'Frame 15236.png', 'Frame 15237.png', 'Frame 15238.png'],
    'Beauty & Wellness': ['Frame 15239.png', 'Frame 15240.png', 'Frame 15241.png', 'Frame 15242.png', 'Frame 15243.png'],
    'Automotive Services': ['Frame 15244.png', 'Frame 15245.png', 'Frame 15246.png', 'Frame 15247.png', 'Frame 15248.png'],
    'Media & Advertising Agencies': ['Frame 15249.png', 'Frame 15250.png', 'Frame 15251.png', 'Frame 15252.png', 'Frame 15253.png'],
    'Cleaning & Sanitation Services': ['Frame 15254.png', 'Frame 15255.png', 'Frame 15256.png', 'Frame 15257.png', 'Frame 15258.png'],
    'Handicrafts & Artisan Units': ['Frame 15259.png', 'Frame 15260.png', 'Frame 15261.png', 'Frame 15262.png', 'Frame 15263.png'],
  };
  
  // Add a small delay to simulate network request
  await new Promise(resolve => setTimeout(resolve, 50));
  
  return templateFiles[directory] || [];
};

// Preload template list upon module initialization
const industryTemplates = {};
Object.keys(industryToDirectoryMap).forEach(industry => {
  const directory = industryToDirectoryMap[industry];
  simulateGetTemplateFiles(directory)
    .then(templates => {
      industryTemplates[industry] = templates;
      console.log(`Preloaded ${templates.length} templates for ${industry}`);
    })
    .catch(err => {
      console.warn(`Failed to preload templates for ${industry}`, err);
      // Set a default empty array for this industry
      industryTemplates[industry] = [];
    });
});

/**
 * Preloads an image to ensure it's cached in the browser
 * 
 * @param {string} src - The image source URL to preload
 * @returns {Promise<HTMLImageElement>} - The preloaded image element
 */
const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};

/**
 * Gets a random template path based on the industry
 * 
 * @param {string} industry - The user's selected industry
 * @returns {Promise<string>} Path to the template image
 */
export const getRandomTemplateForIndustry = async (industry) => {
  try {
    // Check if we have a cached template for this industry
    if (templateCache[industry]) {
      console.log(`Using cached template for ${industry}: ${templateCache[industry]}`);
      return templateCache[industry];
    }
    
    let templatePath = '';
    
    // Get the correct directory based on industry, or random if 'other'
    let targetDirectory = '';
    let targetIndustry = industry;
    
    if (industry && industry !== 'other' && industryToDirectoryMap[industry]) {
      // Use the specific industry folder
      targetDirectory = industryToDirectoryMap[industry];
    } else {
      // For 'other' or unknown industry, select a random industry
      const industryKeys = Object.keys(industryToDirectoryMap);
      targetIndustry = industryKeys[Math.floor(Math.random() * industryKeys.length)];
      targetDirectory = industryToDirectoryMap[targetIndustry];
    }
    
    // Check if we've already loaded template files for this industry
    let templateFiles = industryTemplates[targetIndustry] || [];
    
    // If not loaded yet, try to fetch them now
    if (!templateFiles || templateFiles.length === 0) {
      try {
        console.log(`No preloaded templates found for ${targetIndustry}, fetching now...`);
        templateFiles = await simulateGetTemplateFiles(targetDirectory);
        
        // Store for future use
        industryTemplates[targetIndustry] = templateFiles;
      } catch (error) {
        console.error(`Error fetching templates for ${targetDirectory}:`, error);
        // Use Manufacturing as a fallback industry
        targetIndustry = 'manufacturing';
        targetDirectory = 'Manufacturing';
        templateFiles = await simulateGetTemplateFiles(targetDirectory);
      }
    }
    
    if (templateFiles && templateFiles.length > 0) {
      // Select a random template file from the available ones
      const randomTemplate = templateFiles[Math.floor(Math.random() * templateFiles.length)];
      templatePath = `/images/templates/${targetDirectory}/${randomTemplate}`;
      
      // Try to preload the image
      try {
        await preloadImage(templatePath);
        console.log(`Successfully preloaded template: ${templatePath}`);
      } catch (preloadErr) {
        console.warn(`Failed to preload image ${templatePath}, but continuing to use it:`, preloadErr);
      }
    } else {
      // Fallback to a reliable template from Manufacturing
      templatePath = '/images/templates/Manufacturing/Frame 15164.png';
      console.warn(`No templates found for industry: ${targetIndustry}, using default from Manufacturing`);
    }
    
    // Cache the result for this industry for subsequent calls
    templateCache[industry] = templatePath;
    
    return templatePath;
  } catch (error) {
    console.error('Error in getRandomTemplateForIndustry:', error);
    // Return a guaranteed valid path as final fallback
    return '/images/templates/Manufacturing/Frame 15164.png';
  }
};