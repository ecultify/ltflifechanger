/**
 * Google Sheets integration service
 * This utility handles connecting to and writing data to Google Sheets
 */

// This code will use server-side integration through a serverless function
// Direct client integration with service accounts is not secure for browser environments

/**
 * Prepares user form data to be sent to your serverless function
 * which will then write it to Google Sheets
 * 
 * @param {Object} userData - The user data from the form
 * @returns {Promise} - Result of the API call
 */
export const saveUserDataToGoogleSheets = async (userData) => {
  try {
    // The endpoint for the serverless function
    const endpoint = process.env.REACT_APP_GOOGLE_SHEETS_FUNCTION_URL || 
                    '/.netlify/functions/google-sheets'; // Relative path works when deployed on Netlify
    
    // Prepare the data to be sent
    const formData = {
      timestamp: new Date().toISOString(),
      name: userData.name || '',
      companyName: userData.companyName || '',
      industry: userData.industry || '',
      businessVintage: userData.businessVintage || '',
      turnover: userData.turnover || '',
      keywords: Array.isArray(userData.keywords) ? userData.keywords.join(', ') : '',
      tagline: userData.tagline || '',
      email: userData.email || '',
      phone: userData.phoneNumber || ''
    };
    
    // Make the API call to your serverless function
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Data successfully saved to Google Sheets:', result);
    return result;
  } catch (error) {
    console.error('Failed to save data to Google Sheets:', error);
    throw error;
  }
};
