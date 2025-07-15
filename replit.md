# replit.md

## Overview

This is a secure and responsive web-based platform for private group financial management. The application allows members to track their monthly financial contributions in UGX (Ugandan Shillings) and provides separate portals for regular members and administrators. The platform features secure authentication, payment processing capabilities, and comprehensive financial tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon (serverless PostgreSQL)
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store

### Database Schema
- **Users Table**: Stores user profiles, roles, balances, and contribution history
- **Contributions Table**: Tracks individual payment records with status and payment methods
- **Treasury Table**: Manages overall group financial state
- **Treasury Adjustments Table**: Logs administrative changes to treasury
- **Audit Logs Table**: Comprehensive activity tracking
- **Sessions Table**: Secure session storage for authentication

## Key Components

### Authentication System
- **Provider**: Replit Auth integration with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **Role-Based Access**: Member and Admin roles with different permissions
- **Security**: HTTP-only cookies, CSRF protection, and secure session handling

### Payment Processing
- **Supported Methods**: Visa, Mastercard, MTN Mobile Money, Airtel Money
- **Status Tracking**: Pending, confirmed, and failed payment states
- **Mock Implementation**: Simulated payment processing for development
- **Receipt Generation**: Payment confirmation and history tracking

### User Interface
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Theme System**: Custom CSS variables for consistent styling
- **Component Library**: Comprehensive UI components from shadcn/ui
- **Interactive Elements**: Modals, forms, tables, and data visualization

## Data Flow

### Member Portal Flow
1. User authenticates via Replit Auth
2. Dashboard loads personal contribution data and treasury balance
3. Payment form allows contribution submission
4. Payment processing updates contribution status
5. Real-time updates via React Query invalidation

### Admin Portal Flow
1. Admin authentication with role verification
2. Dashboard displays comprehensive financial overview
3. Member management with contribution tracking
4. Treasury adjustment capabilities
5. Audit log monitoring and reporting

### Database Operations
- **Read Operations**: Optimized queries for dashboards and reports
- **Write Operations**: Transactional updates for contributions and treasury
- **Audit Trail**: Comprehensive logging of all financial activities
- **Data Validation**: Zod schemas for type-safe data handling

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit Auth service
- **UI Framework**: Radix UI primitives for accessibility
- **Development**: Vite with React and TypeScript support

### Payment Integration (Future)
- **Stripe**: For international card payments
- **Flutterwave/Paystack**: For African payment methods
- **Mobile Money**: MTN and Airtel integration APIs

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESLint/Prettier**: Code formatting and linting
- **Drizzle Kit**: Database migrations and schema management

## Deployment Strategy

### Production Build
- **Frontend**: Vite production build with optimized assets
- **Backend**: esbuild compilation for Node.js deployment
- **Database**: Automated migrations via Drizzle Kit
- **Environment**: Production configuration with secure secrets

### Development Environment
- **Hot Reloading**: Vite dev server with HMR
- **Database**: Local development with connection pooling
- **Authentication**: Replit Auth development configuration
- **Error Handling**: Runtime error overlay for debugging

### Security Considerations
- **Environment Variables**: Secure configuration management
- **Session Security**: HTTP-only cookies with CSRF protection
- **Database Security**: Connection pooling with credential management
- **Input Validation**: Comprehensive data validation with Zod schemas

### Monitoring and Logging
- **Request Logging**: Comprehensive API request tracking
- **Error Handling**: Centralized error management
- **Audit Trail**: Complete activity logging for financial operations
- **Performance**: Query optimization and caching strategies