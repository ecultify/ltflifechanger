// Configuration file for API keys and other environment variables

// Use environment variables for sensitive information
// For development, create a .env.local file with your keys
// In production, set these in your hosting environment (Netlify, Vercel, etc.)
export const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || "";

// Example of accessing environment variables in React:
// Remember to prefix React environment variables with REACT_APP_
// For example: REACT_APP_OPENAI_API_KEY
