# Certificate Backend

A NestJS-based backend API for managing digital certificates, events, and user authentication.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [API Endpoints](#api-endpoints)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development](#development)

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Certificate Management**: Create, read, update, and delete certificates with auto-generated issue dates
- **Event Management**: Full CRUD operations for events
- **User Management**: Admin and regular user roles
- **MongoDB Integration**: Document-based storage with Mongoose ODM
- **API Documentation**: Swagger/OpenAPI documentation
- **Validation**: Class-validator for request validation

## Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **Authentication**: Passport.js with JWT strategy
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Language**: TypeScript

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/certificates
   JWT_SECRET=your-secret-key
   REFRESH_SECRET_KEY=your-refresh-secret-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /auth/login` - User login (returns access_token and refresh_token)
- `POST /auth/logout` - User logout (revokes refresh tokens)
- `POST /auth/refresh` - Refresh access token using refresh_token
- `POST /auth` - Register new user (requires auth)

### Certificates
- `GET /certificates` - Get all certificates
- `POST /certificates` - Create new certificate
- `GET /certificates/:id` - Get certificate by ID
- `PATCH /certificates/:id` - Update certificate
- `DELETE /certificates/:id` - Delete certificate

### Events
- `GET /events` - Get all events
- `POST /events/create` - Create new event
- `GET /events/:id` - Get event by ID
- `PATCH /events/:id` - Update event
- `DELETE /events/:id` - Delete event

### Admin
- `GET /admin` - Get all admins
- `GET /admin/:id` - Get admin by ID
- `DELETE /admin/:id` - Delete admin

## API Documentation

Once the server is running, visit `http://localhost:3000/api` for Swagger documentation.

## Project Structure

```
src/
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── main.ts
└── module/
    ├── admin/
    ├── auth/
    ├── blockchain/
    ├── candidates/
    ├── certificates/
    ├── dashboard/
    ├── events/
    └── metadata/
```

## Testing Refresh Token Flow

1. **Login** to get access_token and refresh_token:
   ```bash
   POST /auth/login
   {
     "email": "user@example.com",
     "password": "password"
   }
   ```

2. **Use access_token** for API calls (expires in 10 minutes)

3. **Refresh token** when access_token expires:
   ```bash
   POST /auth/refresh
   {
     "refresh_token": "your_refresh_token_here"
   }
   ```

4. **Logout** to invalidate refresh token:
   ```bash
   POST /auth/logout
   # Requires valid access_token in Authorization header
   ```

**Security Notes:**
- Access tokens expire quickly (10 minutes) for security
- Refresh tokens are stored securely in user documents
- Logout completely removes refresh tokens from database
- Attempting to refresh with invalid/expired tokens returns 401</content>
<parameter name="filePath">d:\mst\cert-backend\README.md