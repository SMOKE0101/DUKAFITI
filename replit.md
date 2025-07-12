# DukaFiti - Modern Shop Management System

## Overview

DukaFiti is a comprehensive shop management system designed specifically for Kenyan businesses. It's a full-stack web application that provides inventory management, sales tracking, customer management, and M-Pesa payment integration. The application is built with modern web technologies and includes Progressive Web App (PWA) capabilities for offline functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration
- **Styling**: TailwindCSS with Shadcn/UI components
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router DOM for client-side routing
- **Theme Management**: next-themes for dark/light mode support

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Supabase Auth
- **API Design**: RESTful API with Express routes

### Key Components

#### Database Layer
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema Location**: `shared/schema.ts` with users table defined
- **Migrations**: Stored in `./migrations` directory
- **Connection**: Neon serverless PostgreSQL via connection pooling

#### Authentication System
- **Provider**: Supabase Auth with custom hooks
- **Implementation**: Context-based authentication with `useAuth` hook
- **Features**: Email/password signup, Google OAuth, session management
- **Protection**: Route-based protection with `ProtectedRoute` component

#### Data Management
- **Products**: Full CRUD operations with stock management
- **Customers**: Customer profiles with debt tracking
- **Sales**: Transaction recording with payment methods
- **Offline Support**: IndexedDB for local data persistence

#### Progressive Web App Features
- **Service Worker**: Custom implementation for offline functionality
- **Caching Strategy**: Network-first with fallback to cache
- **Background Sync**: Queue operations when offline
- **Installable**: Web App Manifest for native app-like experience

## Data Flow

### Client-Side Flow
1. User authentication through Supabase Auth
2. Data fetching via React Query with custom hooks
3. Local state management with React hooks
4. Offline data persistence in IndexedDB
5. Real-time updates through Supabase subscriptions

### Server-Side Flow
1. Express.js handles API routes with `/api` prefix
2. Drizzle ORM manages database operations
3. Neon PostgreSQL provides serverless database
4. Session management through connect-pg-simple
5. Error handling middleware for consistent responses

### Offline Architecture
- **Local Database**: IndexedDB for offline data storage
- **Sync Manager**: Background sync when connection restored
- **Conflict Resolution**: Intelligent merging of local and server data
- **Queue System**: Pending operations stored locally

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Supabase Auth services
- **UI Components**: Radix UI primitives with Shadcn/UI
- **Icons**: Lucide React icon library
- **Validation**: Zod schema validation with Drizzle-Zod

### Development Dependencies
- **Build**: Vite with React plugin
- **TypeScript**: Full TypeScript support
- **ESBuild**: Server-side bundling
- **TSX**: Development server runtime

### Payment Integration
- **M-Pesa**: Planned integration for mobile money payments
- **Cash Payments**: Built-in cash transaction recording
- **Debt Management**: Customer credit and debt tracking

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: ESBuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations applied via `db:push`

### Environment Configuration
- **Development**: Uses `tsx` for hot reloading
- **Production**: Node.js serves built application
- **Database**: Environment variable `DATABASE_URL` required

### Hosting Requirements
- **Node.js**: Runtime environment
- **PostgreSQL**: Database (Neon serverless recommended)
- **Static Files**: Frontend assets served from `dist/public`

### Recent Changes (July 2025)
- **Complete Branding Update**: Implemented dynamic theme-aware logo switching across all components
  - Landing pages with proper light/dark mode logo variants
  - Sidebar components with expanded/collapsed logo states
  - Top bars with professional branding integration
  - Sign-in/Sign-up pages with custom banner assets
- **Fixed Sidebar Issues**: Resolved multiple sidebar component conflicts and logo path errors
- **Enhanced Authentication Pages**: Updated with new DUKAFITI banner assets for better brand consistency

### Features in Development
- **Blocky UI Theme**: Custom design system implementation
- **Enhanced Offline Sync**: Advanced conflict resolution
- **Real-time Updates**: WebSocket connections for live data
- **Mobile Optimization**: Touch-friendly interface design

The application follows a modern full-stack architecture with strong emphasis on offline capabilities, user experience, and business-specific features for Kenyan shop owners.