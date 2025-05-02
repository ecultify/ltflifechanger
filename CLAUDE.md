# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands
- `npm install` - Install dependencies
- `npm start` - Start React frontend (port 3000)
- `node server.js` - Start backend server (port 5000)
- `npm run build` - Build for production 
- `npm test` - Run all tests
- `npm test -- --testPathPattern=src/components/Header.test.js` - Run a single test
- `npm run test-otp` - Run OTP API tests

## Code Style Guidelines
- **Components**: Use functional components with React hooks
- **Imports**: Group imports by type (React, external libs, internal components, styles)
- **CSS**: Component-specific styles in separate CSS files under src/styles
- **Error Handling**: Use try/catch with specific error messages in console.error()
- **State Management**: Use React hooks (useState, useEffect) with descriptive variable names
- **Naming Conventions**: 
  - PascalCase for components
  - camelCase for variables, functions, methods
  - UPPER_SNAKE_CASE for constants
- **Responsive Design**: Check window width with useEffect and isMobile state