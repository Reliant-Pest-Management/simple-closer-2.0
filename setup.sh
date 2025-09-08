#!/bin/bash

echo "Creating Simple Closer project files..."

# Create package.json
cat > package.json << 'PACKAGE'
{
  "name": "simple-closer-backend",
  "version": "1.0.0",
  "description": "Simple Closer - Service Business Checkout System",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "nodemon src/server.js",
    "client": "cd client && npm start",
    "seed": "node prisma/seed.js",
    "migrate": "prisma migrate dev",
    "studio": "prisma studio",
    "test": "jest"
  },
  "keywords": [
    "saas",
    "checkout",
    "services",
    "pest-control",
    "pressure-washing",
    "christmas-lights"
  ],
  "author": "Trey Clawson",
  "license": "MIT",
  "dependencies": {
    "@prisma/client": "^5.7.0",
    "axios": "^1.6.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "joi": "^17.11.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "node-cron": "^3.0.3",
    "uuid": "^9.0.1",
    "winston": "^3.11.0",
    "@sendgrid/mail": "^8.1.0",
    "square": "^33.0.0",
    "authorizenet": "^1.0.8"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "jest": "^29.7.0",
    "nodemon": "^3.0.2",
    "prisma": "^5.7.0",
    "supertest": "^6.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
PACKAGE

# Create .env.example
cat > .env.example << 'ENV'
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Server
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Client
CLIENT_URL="http://localhost:3000"

# Email (optional for now)
SENDGRID_API_KEY=""
FROM_EMAIL="noreply@yourdomain.com"

# Payment Processors (sandbox/test keys)
SQUARE_SANDBOX_ACCESS_TOKEN=""
SQUARE_SANDBOX_APPLICATION_ID=""
AUTHORIZE_NET_API_LOGIN_ID=""
AUTHORIZE_NET_TRANSACTION_KEY=""

# Property Data Service
PROPERTY_API_KEY=""

# GHL Integration (when ready)
GHL_API_KEY=""
GHL_LOCATION_ID=""
ENV

# Create .gitignore
cat > .gitignore << 'GITIGNORE'
node_modules/
.env
.env.local
dist/
build/
*.log
.DS_Store
.vscode/
.idea/
*.swp
*.swo
coverage/
.nyc_output/
prisma/migrations/
GITIGNORE

# Create README.md
cat > README.md << 'README'
# Simple Closer 2.0

A modern checkout system for service businesses (pest control, pressure washing, Christmas lights).

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your values
4. Run migrations: `npx prisma migrate dev`
5. Start development server: `npm run dev`

## Tech Stack

- Node.js + Express
- PostgreSQL + Prisma
- React + Next.js
- JWT Authentication
- Railway for deployment

## Project Structure

- `/src` - Backend source code
- `/client` - Frontend React application
- `/prisma` - Database schema and migrations
README

echo "✅ Base files created"
