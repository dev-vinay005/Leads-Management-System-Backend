# Leads Management System Backend

A TypeScript-based backend for a multi-tenant leads management system, built with Next.js App Router, Prisma, and MongoDB. The project powers authentication, lead lifecycle operations, assignment workflows, notifications, and data import/export capabilities.

## Overview

This repository provides the API layer and database models for managing:

- Users and authentication
- Organizations and companies
- Lead records and lead statuses
- Lead transfer and assignment requests
- Notifications and messaging workflows
- CSV-based import/export for lead data

The application is structured as a Next.js API backend using TypeScript and Prisma ORM.

## Tech Stack

- Next.js 16
- TypeScript
- Prisma ORM
- MongoDB
- Zod validation
- bcrypt / bcryptjs
- JWT
- Nodemailer
- CSV parsing and export utilities

## Project Structure

```bash
.
├── .env.example
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── prisma
│   ├── schema.prisma
│   └── seed.ts
├── public
├── src
│   ├── app
│   │   ├── api
│   │   │   ├── auth
│   │   │   ├── lead-assignment-requests
│   │   │   ├── leads
│   │   │   ├── notification
│   │   │   └── session
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib
│   ├── types
│   ├── utils
│   └── validation
├── tsconfig.json
├── README.md
└── .env
```

## Features

- OTP-based login and email verification
- JWT session creation and authentication flow
- Multi-tenant organization and company model
- Lead creation, retrieval, updates, and status handling
- Lead assignment request workflow
- Notification system for lead and transfer activities
- CSV lead import and export support
- Prisma schema designed for MongoDB-based data modeling

## Authentication

Authentication is implemented as an OTP-based flow:

1. User submits an email
2. If the user does not exist, it is created automatically
3. A one-time password is generated and sent via email
4. User verifies the OTP
5. A session is created on successful validation

Key auth routes:

- `POST /api/auth/login`
- `POST /api/auth/verify-otp`
- `POST /api/auth/logout`

## Leads Management

The leads API supports creating, retrieving, updating, and exporting lead data.

Key routes:

- `GET /api/leads`
- `POST /api/leads`
- `GET /api/leads/[id]`
- `PUT /api/leads/[id]`
- `DELETE /api/leads/[id]`
- `POST /api/leads/import`
- `GET /api/leads/export`
- `GET /api/leads/leadstatus`

## Lead Assignment Requests

The application includes a transfer workflow for lead assignment requests between users or teams.

Key routes:

- `GET /api/lead-assignment-requests`
- `POST /api/lead-assignment-requests`
- `GET /api/lead-assignment-requests/[id]`
- `PATCH /api/lead-assignment-requests/[id]`

## Notifications

The project includes support for notifications related to:

- Lead assignment
- Lead updates
- Status changes
- Transfer request events

## Environment Variables

Copy `.env.example` to `.env` and update the values for your environment:

```env
DATABASE_URL="your_mongodb_connection_string_here"
EMAIL_USER="your_email_address_here"
EMAIL_PASS="your_email_password_here"
JWT_SECRET="your_jwt_secret_here"
```

## Database

This project uses MongoDB with Prisma.

Generate Prisma client and push schema changes:

```bash
npx prisma generate
npx prisma db push
```

If the repo includes a seed script, you can run:

```bash
npx prisma db seed
```

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file using `.env.example`
4. Start the development server:

```bash
npm run dev
```

The application runs on:

```bash
http://localhost:3000
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Notes

- This project is primarily a backend API built using Next.js route handlers.
- The Prisma schema models users, organizations, companies, agents, leads, notifications, and transfer workflows.
- The repo is structured for a multi-tenant SaaS-style leads management system.

## License

This repository does not currently declare a license in the project metadata.

## Contributing

Contributions are welcome. Please open an issue or submit a pull request with a clear description of the change.

## Contact

For questions, updates, or collaboration, use the repository's GitHub contact and issue tracker.
