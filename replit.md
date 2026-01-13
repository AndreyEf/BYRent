# RentFlow - Rental Property Management Platform

## Overview

RentFlow is a web application for managing rental properties, serving both tenants and landlords. Users can list properties they own, browse available properties from other users, and manage rental requests. The platform features a dual-section dashboard ("My Rental" / "My Property") allowing users to act as both renters and property owners simultaneously.

The application is built with a React frontend served by Vite, and a Java Spring Boot backend for the REST API. PostgreSQL is used for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.
Backend technology preference: Java (Spring Boot)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration supporting light/dark modes
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Build Tool**: Vite with custom plugins for Replit integration
- **Proxy**: Node.js Express proxy forwards /api requests to Java backend

### Backend Architecture (Java Spring Boot)
- **Framework**: Spring Boot 3.2 with Java 17
- **Authentication**: Spring Security with session-based auth
- **Session Storage**: PostgreSQL-backed sessions via spring-session-jdbc
- **Password Security**: BCrypt password encoding
- **API Design**: RESTful JSON API under `/api` prefix
- **ORM**: JPA/Hibernate
- **Database**: PostgreSQL

### Project Structure
```
client/                    # React frontend
  src/
    components/            # Reusable UI components
    pages/                 # Route page components
    lib/                   # Utilities, auth context, query client
    hooks/                 # Custom React hooks

backend/                   # Java Spring Boot backend
  src/main/java/com/rentflow/
    config/                # Spring configuration classes
    controller/            # REST API controllers
    dto/                   # Data Transfer Objects
    entity/                # JPA entities
    repository/            # JPA repositories
    security/              # Spring Security configuration
    service/               # Business logic services
  src/main/resources/
    application.properties # Spring Boot configuration

server/                    # Node.js proxy server (for Vite integration)
  routes.ts                # API proxy to Java backend
  vite.ts                  # Vite development server setup

shared/                    # Shared TypeScript types (frontend reference)
  schema.ts                # Type definitions
```

### Core Data Models (JPA Entities)
1. **User**: Email/password authentication with visible ID for user search
2. **Property**: Owned by users, contains address, owner name, cadastral number, photos, payment info
3. **RentalRequest**: Links requesters to properties with status (pending/approved/rejected/cancelled)
4. **TenantHistory**: Tracks rental history for properties
5. **Review**: Star ratings and comments between landlords and tenants
6. **SubscriptionPlan**: Tiered pricing plans for landlords
7. **UserSubscription**: User's current subscription status

### Authentication Flow
- Session-based authentication with 30-day cookie expiration
- Spring Security manages authentication and authorization
- Protected routes redirect to `/login` when unauthenticated
- User context provided via React Context API (`AuthProvider`)

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- Session storage uses spring-session-jdbc

### Key Java Dependencies (Maven)
- **spring-boot-starter-web**: REST API
- **spring-boot-starter-data-jpa**: Database ORM
- **spring-boot-starter-security**: Authentication/Authorization
- **spring-session-jdbc**: Session management
- **postgresql**: PostgreSQL driver
- **google-cloud-storage**: Object storage for file uploads
- **lombok**: Boilerplate reduction

### Key NPM Packages (Frontend)
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling
- **zod**: Schema validation
- **Radix UI**: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **http-proxy-middleware**: API proxy to Java backend

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `ADMIN_PASSWORD`: Admin account password
- `SESSION_SECRET`: Secret key for session signing
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID`: GCS bucket for file storage
- `PUBLIC_OBJECT_SEARCH_PATHS`: Public object storage paths
- `PRIVATE_OBJECT_DIR`: Private object storage directory

### Build & Development

**Start Development (both servers):**
```bash
./start-all.sh
```

**Start Java Backend only:**
```bash
cd backend && mvn spring-boot:run
```

**Start Frontend only (requires Java backend running):**
```bash
npm run dev
```

**Build for Production:**
```bash
cd backend && mvn package
npm run build
```

### API Endpoints

#### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

#### Users
- `PATCH /api/users/me` - Update profile
- `POST /api/users/me/password` - Change password
- `GET /api/users/search?visibleId=` - Search user by visible ID

#### Properties
- `GET /api/properties/my` - Get owned properties
- `GET /api/properties/rented` - Get rented properties
- `GET /api/properties/available` - Get available properties
- `POST /api/properties` - Create property
- `PATCH /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `POST /api/properties/:id/remove-tenant` - Remove tenant

#### Rental Requests
- `GET /api/rental-requests/my` - Get my requests
- `GET /api/rental-requests/incoming` - Get incoming requests
- `POST /api/rental-requests` - Create request
- `POST /api/rental-requests/:id/approve` - Approve request
- `POST /api/rental-requests/:id/reject` - Reject request
- `POST /api/rental-requests/:id/cancel` - Cancel request
- `POST /api/rental-requests/:id/resend` - Resend rejected request

#### Reviews
- `GET /api/reviews/user/:userId` - Get reviews for user
- `POST /api/reviews` - Create review
- `DELETE /api/reviews/:id` - Delete review

#### Subscriptions
- `GET /api/subscriptions/plans` - Get all plans
- `GET /api/subscriptions/my` - Get my subscription
- `GET /api/subscriptions/limits` - Get property limits
- `POST /api/subscriptions/activate` - Activate subscription (demo mode)
- `POST /api/subscriptions/cancel` - Cancel subscription

#### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/properties` - Get all properties
- `GET /api/admin/stats` - Get platform statistics
- `DELETE /api/admin/users/:id` - Delete user
- `DELETE /api/admin/reviews/:id` - Delete review

#### Files
- `GET /api/contract-template` - Download contract template
- `POST /api/storage/upload` - Upload file to object storage
