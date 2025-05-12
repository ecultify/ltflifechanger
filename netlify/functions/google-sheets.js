const { GoogleSpreadsheet } = require('google-spreadsheet');

/**
 * Netlify serverless function to handle Google Sheets integration
 * This function accepts form data and writes it to a Google Sheet
 */
// Service account email for reference purposes only (will use environment variables in production)
// l-t-529@ai-agent-451213.iam.gserviceaccount.com

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  // Check if the request method is POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the incoming data
    const data = JSON.parse(event.body);
    
    // Access your service account credentials from environment variables
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'l-t-529@ai-agent-451213.iam.gserviceaccount.com';
    const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : ''; // Will be set in Netlify environment
    const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || '1xvw5H_UmvdyDj5vvbxuq_lQ2q0QmM5eQWZi8Vs8XLPM'; // Default sheet ID - change this to your actual sheet ID
    
    // Initialize the Google Sheet
    const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID);
    
    // Authenticate with the Google Sheets API
    await doc.useServiceAccountAuth({
      client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY
    });
    
    // Load the sheet
    await doc.loadInfo();
    
    // Get the first sheet (or you can specify by name if you want)
    // You can also access by title if you prefer: doc.sheetsByTitle['Form Responses']
    const sheet = doc.sheetsByIndex[0];
    
    // Create headers if the sheet is empty
    const rows = await sheet.getRows();
    if (rows.length === 0) {
      // Sheet is empty, add headers
      await sheet.setHeaderRow([
        'Timestamp',
        'Name',
        'Company Name',
        'Industry',
        'Business Vintage',
        'Turnover',
        'Keywords',
        'Tagline',
        'Email',
        'Phone'
      ]);
    }
    
    // Add a new row with the form data
    const newRow = {
      Timestamp: data.timestamp,
      Name: data.name,
      'Company Name': data.companyName,
      Industry: data.industry,
      'Business Vintage': data.businessVintage,
      Turnover: data.turnover,
      Keywords: data.keywords,
      Tagline: data.tagline,
      Email: data.email,
      Phone: data.phone
    };
    
    await sheet.addRow(newRow);
    
    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Data successfully added to Google Sheets' })
    };
  } catch (error) {
    console.error('Error writing to Google Sheets:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to write data to Google Sheets', details: error.message })
    };
  }
};
