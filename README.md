# Zabran Intelligence System (ZIS ERP)

ZIS ERP is a monolithic Enterprise Resource Planning system managing Inventory, POS, Cash Management, Service Center, B2B CRM, and Marketing for PT Zabran Internasional Grup.

## Architecture

- **Backend**: Node.js, Express, TypeScript, Prisma (Neon Postgres)
- **Frontend**: Next.js 14, TailwindCSS, TypeScript
- **Database**: PostgreSQL (Neon Tech)

## Prerequisites

- Node.js (v18+)
- npm or yarn

## Setup Instructions

### 1. Database & Environment Variables

Copy the environment templates in both `backend` and `web` directories:

```bash
cp backend/.env.example backend/.env
cp web/.env.example web/.env
```

Fill in the appropriate `DATABASE_URL` and `JWT_SECRET` in `backend/.env`.

### 2. Backend Setup

```bash
cd backend
npm install

# Push database schema to your Postgres instance
npx prisma db push

# (Optional) Run seeders or check-admin script to generate first user
npx ts-node src/scripts/check-admin.ts

# Start backend server
npm run dev
```

### 3. Frontend Setup

```bash
cd web
npm install

# Start Next.js development server
npm run dev
```

The application will be available at `http://localhost:3000`.

## Production Deployment

Ensure all `.env` secrets are generated securely (e.g., `openssl rand -base64 48`). Set `NEXT_PUBLIC_API_URL` to your production backend URL before running `npm run build` in the `web` directory.
