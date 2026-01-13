# RentFlow - Rental Property Management Platform

## Overview

RentFlow is a web application for managing rental properties, serving both tenants and landlords. Users can list properties they own, browse available properties from other users, and manage rental requests. The platform features a dual-section dashboard ("My Rental" / "My Property") allowing users to act as both renters and property owners simultaneously.

The application is built as a full-stack TypeScript project with a React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration supporting light/dark modes
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy, session-based auth using express-session
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Password Security**: Scrypt hashing with timing-safe comparison
- **API Design**: RESTful JSON API under `/api` prefix

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema Location**: `shared/schema.ts` - contains table definitions, relations, and Zod schemas
- **Migrations**: Drizzle Kit with push-based schema management (`npm run db:push`)

### Core Data Models
1. **Users**: Email/password authentication with visible ID for user search
2. **Properties**: Owned by users, contains address, owner name, cadastral number
3. **Rental Requests**: Links requesters to properties with status (pending/approved/rejected)

### Authentication Flow
- Session-based authentication with 30-day cookie expiration
- Protected routes redirect to `/login` when unauthenticated
- User context provided via React Context API (`AuthProvider`)

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Route page components
    lib/          # Utilities, auth context, query client
    hooks/        # Custom React hooks
server/           # Express backend
  auth.ts         # Authentication setup
  routes.ts       # API route handlers
  storage.ts      # Database access layer
  db.ts           # Database connection
shared/           # Shared code between client/server
  schema.ts       # Drizzle schema and Zod validators
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- Session storage uses the same PostgreSQL instance

### Key NPM Packages
- **drizzle-orm / drizzle-kit**: Database ORM and migration tooling
- **@tanstack/react-query**: Server state management
- **passport / passport-local**: Authentication framework
- **express-session / connect-pg-simple**: Session management
- **zod / drizzle-zod**: Schema validation
- **Radix UI**: Accessible UI primitives (dialog, dropdown, tabs, etc.)
- **tailwindcss**: Utility-first CSS framework

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session signing (defaults to development value)

### Build & Development
- `npm run dev`: Development server with hot reload
- `npm run build`: Production build (Vite for client, esbuild for server)
- `npm run db:push`: Push schema changes to database