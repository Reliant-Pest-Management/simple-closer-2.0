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
