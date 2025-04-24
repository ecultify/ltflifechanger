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
