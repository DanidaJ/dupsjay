# DUPSJay Backend

Node.js backend for the DUPSJay appointment system with authentication.

## Prerequisites

- Node.js (v14+ recommended)
- MongoDB (local installation or MongoDB Atlas)

## Setup

1. Install dependencies:

```
npm install
```

2. Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/dupsjay
JWT_SECRET=your_secret_token
JWT_EXPIRE=30d
```

- Replace `mongodb://localhost:27017/dupsjay` with your MongoDB connection string
- Replace `your_secret_token` with a secure random string

## Running the Server

### Development

```
npm run dev
```

### Production

```
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  - Body: `{ "name": "User Name", "email": "user@example.com", "password": "password123" }`

- `POST /api/auth/login` - Log in a user
  - Body: `{ "email": "user@example.com", "password": "password123" }`

- `GET /api/auth/me` - Get current user profile
  - Headers: `Authorization: Bearer {token}`

## Authentication

Protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
