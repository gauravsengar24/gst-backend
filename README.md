# Certificate Backend

A NestJS-based backend API for managing digital certificates, events, user authentication, and IPFS metadata.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Project Features](#project-features)
- [API Documentation](#api-documentation)

## Features

- **Authentication**: JWT-based auth with cookie support.
- **Certificate Management**: 
  - Dynamic generation of certificate images with candidate names.
  - PDF generation for easy downloading.
  - Bulk placeholder generation.
- **IPFS Integration**: 
  - Automatically upload certificate images and metadata JSON to IPFS (via Pinata).
  - NFT-compatible metadata structure.
- **Event Management**: Track events and associate them with certificates.
- **Dashboard Statistics**: Real-time stats for certificates and events.
- **Static Assets**: Automatically served via `/uploads` path.

## Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **Image Processing**: Sharp (for high-performance image overlay)
- **PDF Generation**: PDFKit
- **IPFS Storage**: Pinata API
- **Documentation**: Swagger/OpenAPI

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env` (see below).

4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/cert-backend
PORT=3000
SECRET_KEY=your_jwt_secret_key
REFRESH_SECRET_KEY=your_refresh_secret_key

# IPFS / Pinata Config
PINATA_JWT=your_pinata_jwt_here
```

## API Endpoints

### Authentication
- `POST /auth/login` - Login and get JWT cookie
- `POST /auth/logout` - Logout and clear cookie
- `POST /auth` - Register new user (Auth required)

### Certificates
- `GET /certificates` - List certificates (Search & Pagination)
- `POST /certificates` - Create certificate (Triggers **local image generation** for candidates)
- `POST /certificates/:id/candidates` - Add candidates (Triggers **local image generation**)
- `POST /certificates/:id/upload` - Upload generated images & metadata to **IPFS**
- `GET /certificates/:id/download` - Download certificate as PDF
- `GET /certificates/:id` - Get certificate details

### Metadata & IPFS
- `POST /metadata/upload` - Manual generate + upload to IPFS
- `GET /metadata/test-overlay?name=JohnDoe` - Preview name overlay on template

### Dashboard
- `GET /dashboard?eventId=...&page=1&limit=5` - Get statistics (Recent activity is paginated)

### Events
- `GET /events` - List all events
- `POST /events/create` - Create a new event

## Project Features

### Two-Step Certificate Issuance
1. **Creation**: When you create a certificate or add candidates, the system generates a personalized JPEG image locally using the `certificate.jpeg` template. These are accessible via `/uploads`.
2. **IPFS Upload**: Call the `/upload` endpoint to push those local images and their corresponding metadata to IPFS. This updates the certificate with `ipfsHash` and `metadataUrl`.

## API Documentation

Once the server is running, visit `http://localhost:3000/api` for the full interactive Swagger documentation.