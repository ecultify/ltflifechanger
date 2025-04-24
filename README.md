# L&T Finance Web Application

This application includes a React frontend and an Express.js backend proxy server for securely handling OTP operations.

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Install backend dependencies:
```bash
npm install express cors axios body-parser
```

### Environment Variables

1. Create a `.env` file in the root directory using the `.env.example` as a template:
```bash
cp .env.example .env
```

2. Update the `.env` file with your actual API keys:
```
REACT_APP_OPENAI_API_KEY=your_actual_openai_api_key
```

3. When deploying to Netlify, add these environment variables in the Netlify dashboard under Site settings > Environment variables.

## Running the Application

### Start the Backend Server
```bash
node server.js
```
The backend server will run on port 5000 by default.

### Start the Frontend Development Server
```bash
npm start
```
The React application will run on port 3000 by default.

### Using the Application

1. Access the application at http://localhost:3000
2. Navigate to the OTP verification page
3. Enter your mobile number and request an OTP
4. Once you receive the OTP, enter it to proceed to the next step

## Security Notes

- The backend server acts as a proxy between the frontend and the L&T API services
- Sensitive API credentials are stored only on the server-side
- All OTP-related requests are routed through the secure proxy server
- CORS is configured to only allow requests from the frontend application

## Development Notes

- To modify API endpoints, update the server.js file
- The proxy server handles the following operations:
  - Sending OTP to a mobile number
  - Verifying OTP entered by the user

# L&T Finance Business Poster Generator

This application allows users to create personalized business posters by uploading their photos, entering their business details, and generating a shareable poster.

## Gender Detection Feature

The application includes a gender detection feature that automatically detects the user's gender from their uploaded photo. This information is used to customize the generated poster:

1. **Detection Method**: The app uses face-api.js, a JavaScript API for face detection and recognition that runs entirely in the user's browser. This ensures privacy as no images are sent to external servers for gender analysis.

2. **How It Works**:
   - When a user uploads a photo, the app analyzes it to detect faces
   - The gender detection model predicts whether the face is male or female
   - This information is used to customize the poster layout, icon selection, and styling

3. **Fallback Mechanism**: If the app cannot detect a face or determine gender with confidence, it presents a manual selection option where users can specify their gender.

4. **Model Files**: The gender detection models are loaded from the `/public/models/` directory and include:
   - Tiny Face Detector: A lightweight model for face detection
   - Age and Gender Model: For predicting age and gender from facial features

5. **Privacy Considerations**: All processing occurs locally in the browser, ensuring user photos remain private.

## Technical Implementation

The gender detection is implemented in the `UploadPhoto.js` component:

1. The face-api.js models are loaded when the component mounts
2. When a user uploads an image, the app attempts to detect a face and predict gender
3. The gender information is stored in sessionStorage and passed to the poster generation component
4. The `SharePoster.js` component uses this information to customize the generated poster

## Customizations Based on Gender

The poster generation applies different visual treatments based on the detected gender:

1. **Male users**:
   - Uses standard positioning and scaling
   - Uses a male-specific icon in the user info section
   - Standard text coloring

2. **Female users**:
   - Slightly adjusted positioning and scaling
   - Uses a female-specific icon in the user info section
   - Subtle adjustments to text coloring

These differences create a more personalized poster while maintaining the overall branded design.
