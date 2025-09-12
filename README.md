# DUPSJay Appointment System

A full-stack web application for appointment scheduling with user authentication.

## Project Structure

- **dupsjay-frontend**: React/TypeScript frontend with Tailwind CSS
- **dupsjay-backend**: Node.js/Express backend with MongoDB

## Prerequisites

- Node.js (v14+ recommended)
- MongoDB (local installation or MongoDB Atlas)

## Setup Instructions

1. Install dependencies for both frontend and backend:

```powershell
npm run install-all
```

2. Configure environment variables:
   - Make sure the `.env` file in `dupsjay-backend` is properly configured

3. Start both frontend and backend concurrently:

```powershell
npm run dev
```

This will start:
- Frontend at: http://localhost:5173
- Backend at: http://localhost:5000

## Available Scripts

- `npm run install-all` - Install dependencies for both frontend and backend
- `npm run server` - Start the backend server only
- `npm run client` - Start the frontend development server only
- `npm run dev` - Start both frontend and backend concurrently

## Features

- User authentication (sign up, login, logout)
- Protected routes for authenticated users
- User profile management
- Responsive design for mobile and desktop

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
  - Body: `{ "name": "User Name", "email": "user@example.com", "password": "password123" }`

- `POST /api/auth/login` - Log in a user
  - Body: `{ "email": "user@example.com", "password": "password123" }`

- `GET /api/auth/me` - Get current user profile
  - Headers: `Authorization: Bearer {token}`
