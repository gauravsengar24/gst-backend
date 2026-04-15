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

- **Authentication & Authorization**: JWT-based auth with cookie support and role-based access control
- **Certificate Management**: Create, read, update, and delete certificates with auto-generated issue dates
- **Event Management**: Full CRUD operations for events with pagination and search
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
   SECRET_KEY=your-jwt-secret-key
   PORT=3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /auth/login` - User login (sets access_token cookie)
- `POST /auth/logout` - User logout (clears cookie)
- `POST /auth` - Register new user (requires auth)
- `GET /auth` - Get all users (requires auth)
- `GET /auth/:id` - Get user by ID (requires auth)
- `PATCH /auth/:id` - Update user (requires auth)
- `DELETE /auth/:id` - Delete user (requires auth)

### Certificates
- `GET /certificates?page=1&limit=10&search=keyword` - Get all certificates with pagination and search
- `POST /certificates` - Create new certificate
- `GET /certificates/:id` - Get certificate by ID
- `PATCH /certificates/:id` - Update certificate
- `DELETE /certificates/:id` - Delete certificate

### Events
- `GET /events?page=1&limit=10&search=keyword` - Get all events with pagination and search
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

## Authentication

The API uses JWT tokens stored in HTTP-only cookies for authentication.

### Login
Send a POST request to `/auth/login` with email and password. The server will set an `access_token` cookie that expires in 10 minutes.

### Protected Routes
Include the `access_token` cookie in requests to protected endpoints. The JWT strategy automatically extracts the token from either:
- Authorization header: `Bearer <token>`
- Cookie: `access_token=<token>`

### Logout
Send a POST request to `/auth/logout` to clear the authentication cookie.

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

## Development

- Use `npm run dev` for development with hot reload
- All endpoints are protected with JWT authentication except login
- Certificate issue dates are auto-generated if not provided
- Passwords are excluded from user responses for security
- **Access Tokens**: Expire in 10 minutes for security
- Pagination and search available on GET /events and GET /certificates</content>
<parameter name="filePath">d:\mst\cert-backend\README.md