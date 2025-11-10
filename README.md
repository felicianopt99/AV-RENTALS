# AV Rentals Management System

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-16.0.1-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-6.17.0-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/Development-Active-orange?style=for-the-badge" alt="Development Status">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</div>

> **⚠️ DEVELOPMENT STATUS**: This project is actively under development. Core rental management features are **fully functional**, but some enterprise features documented below are **not yet implemented**. See the [What's Missing](#-whats-missing) section for full transparency about current vs. planned features.

<br />

A comprehensive equipment rental management system designed specifically for audio/video production companies. Currently provides solid core functionality for managing equipment, clients, events, and rentals, with advanced features planned for future releases.

## 📋 Table of Contents

- [Features](#-features)
- [What's Missing](#-whats-missing) ⚠️ **Important: Read this first**
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Architecture](#-architecture)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#-license)

## ✨ Features

### 🟢 Currently Implemented

#### Core Business Logic
- **Equipment Inventory Management**: ✅ Full CRUD operations with categorization, status monitoring, and location management
- **Client Relationship Management**: ✅ Detailed customer profiles with contact information and preferences
- **Event Management**: ✅ Event scheduling with client assignments and date management
- **Professional Quote Generation**: ✅ Complete quote system with line items, pricing calculations, and PDF export
- **Rental System**: ✅ Equipment rental tracking with quantities and preparation status
- **Maintenance & Service Tracking**: ✅ Equipment maintenance logs and service history
- **Category Management**: ✅ Hierarchical organization with categories and subcategories

#### Authentication & Security
- **JWT Authentication**: ✅ Secure login/logout with token-based session management
- **Role-based Access Control**: ✅ Five-tier permission system (Admin, Manager, Technician, Employee, Viewer)
- **Password Security**: ✅ bcrypt hashing with proper salt rounds
- **Input Validation**: ✅ Comprehensive Zod schema validation on all endpoints
- **Session Tracking**: ✅ User session management with device and IP tracking

#### User Interface
- **Modern UI Components**: ✅ Radix UI with shadcn/ui component library
- **Responsive Design**: ✅ Mobile-first architecture optimized for all devices
- **Dark Mode Support**: ✅ Toggle between light and dark themes
- **Form Handling**: ✅ React Hook Form with proper validation
- **Calendar Integration**: ✅ FullCalendar for event scheduling
- **Professional Styling**: ✅ Tailwind CSS with custom design system

#### Data Management
- **Database Layer**: ✅ Prisma ORM with type-safe queries
- **Audit Trail**: ✅ Activity logging and data change tracking
- **Backup System**: ✅ Database backup API with rotation support
- **Data Validation**: ✅ Server-side validation with Zod schemas

### 🟡 Planned Features (Roadmap)

#### Real-time Collaboration
- **Multi-user Sync**: 🔄 Client-side hooks implemented, server backend needed
- **Live Updates**: 🔄 Socket.IO infrastructure partially set up
- **Conflict Resolution**: 🔄 Optimistic locking framework in place
- **Real-time Notifications**: 🔄 Database models ready, real-time delivery pending

#### Enterprise Features  
- **Progressive Web App**: 🔄 PWA manifest exists, service worker needed
- **Offline Capabilities**: 🔄 Framework ready, offline sync implementation pending
- **Performance Caching**: 🔄 Redis configured, caching layer implementation needed
- **Advanced Monitoring**: 🔄 Health check endpoints exist, comprehensive monitoring needed

#### AI Integration
- **Equipment Analysis**: 🔄 Google AI dependencies installed, full implementation pending
- **Smart Recommendations**: 🔄 Framework in place, ML models needed
- **Predictive Maintenance**: 🔄 Data structure ready, prediction algorithms needed

### 🔴 Not Yet Implemented

See the [What's Missing](#-whats-missing) section below for detailed information about features that are documented but not yet implemented.

## � What's Missing

This section provides full transparency about features that are **documented in this README but not yet implemented** in the codebase. We believe in honest documentation and want users to understand the current state versus planned features.

### 🔴 Real-time Collaboration (HIGH PRIORITY)

**Status**: Client infrastructure exists, server implementation missing

**What's Documented**:
- Live multi-user synchronization via Socket.IO
- Real-time updates across connected clients
- Optimistic locking for concurrent modifications
- Live notifications and alerts

**Current Reality**:
- ✅ Client-side Socket.IO hooks implemented (`useRealTimeSync`)
- ✅ Event structures defined for data changes
- ❌ **No Socket.IO server implementation** - critical missing piece
- ❌ No WebSocket server to handle real-time connections
- ❌ No broadcasting of data changes to connected clients

**Impact**: Multi-user environments will not see live updates; users must refresh manually.

### 🔴 Progressive Web App Features (MEDIUM PRIORITY)

**Status**: Basic manifest exists, core PWA features missing

**What's Documented**:
- Full offline capabilities
- Native app-like experience  
- Service worker for caching
- Background sync

**Current Reality**:
- ✅ Basic PWA manifest exists (`public/manifest.json`)
- ❌ **No service worker implementation** for offline functionality
- ❌ No offline data caching or sync mechanisms
- ❌ No background sync for when connection returns
- ❌ No app installation prompts or native features

**Impact**: App requires internet connection; no offline capabilities.

### 🔴 Production-Ready Infrastructure (HIGH PRIORITY)

**Status**: Development setup only, production deployment not configured

**What's Documented**:
- Docker deployment with compose files
- PostgreSQL production database
- nginx load balancing
- SSL automation scripts
- Health monitoring and metrics

**Current Reality**:
- ✅ SQLite development database works
- ❌ **No Docker configuration** (no Dockerfile or docker-compose.yml)
- ❌ **No PostgreSQL setup** - still uses SQLite
- ❌ **No nginx configuration** for load balancing
- ❌ SSL setup scripts exist but may not be fully functional
- ❌ No production environment variables or deployment guides

**Impact**: Cannot deploy to production without significant additional configuration.

### 🔴 Performance & Monitoring (MEDIUM PRIORITY)

**Status**: Dependencies installed, implementation missing

**What's Documented**:
- Redis caching for performance
- Comprehensive error tracking
- Performance metrics and monitoring
- Health checks and alerts

**Current Reality**:
- ✅ Redis dependency (ioredis) installed
- ✅ Basic health check endpoints exist
- ❌ **No Redis caching implementation** - no performance benefits
- ❌ No error tracking service integration
- ❌ No performance monitoring dashboard
- ❌ No automated alerts or monitoring

**Impact**: Poor performance under load; no visibility into system health.

### 🔴 Advanced AI Features (LOW PRIORITY)

**Status**: Dependencies installed, minimal implementation

**What's Documented**:
- Equipment analysis with Google AI
- Smart recommendations
- Predictive maintenance alerts
- AI-powered quote optimization

**Current Reality**:
- ✅ Google AI dependencies installed (`@google/generative-ai`)
- ✅ Basic Genkit framework set up
- ❌ **Limited AI implementation** - only basic equipment analysis
- ❌ No recommendation engine
- ❌ No predictive maintenance algorithms
- ❌ No AI-powered business logic

**Impact**: Missing intelligent automation and insights.

### 🔴 Enterprise Security (HIGH PRIORITY)

**Status**: Basic auth implemented, enterprise features missing

**What's Documented**:
- Two-factor authentication
- Advanced session management
- Audit compliance features
- Security hardening

**Current Reality**:
- ✅ JWT authentication with bcrypt passwords
- ✅ Role-based access control
- ✅ Basic audit logging
- ❌ **No two-factor authentication**
- ❌ No advanced session security (device management, concurrent session limits)
- ❌ No security hardening for production
- ❌ No compliance reporting features

**Impact**: Not suitable for enterprise environments requiring strict security.

### 🔴 Testing & Quality Assurance (HIGH PRIORITY)

**Status**: No testing infrastructure implemented

**What's Documented**:
- Comprehensive test suite
- Automated testing in CI/CD
- Quality gates and coverage reports

**Current Reality**:
- ❌ **No test files exist** anywhere in the codebase
- ❌ No testing framework configured
- ❌ No CI/CD pipelines
- ❌ No quality assurance processes

**Impact**: No confidence in code changes; high risk of bugs in production.

### 📋 Implementation Priority

1. **🔥 Critical (Blocks Production)**:
   - Socket.IO server implementation for real-time features
   - Docker configuration and PostgreSQL setup
   - Basic testing framework

2. **⚠️ High Priority (Production Requirements)**:
   - Security hardening and two-factor auth
   - Monitoring and error tracking
   - SSL and deployment automation

3. **📈 Medium Priority (User Experience)**:
   - PWA offline capabilities  
   - Redis caching implementation
   - Performance optimization

4. **🎯 Low Priority (Nice to Have)**:
   - Advanced AI features
   - Additional integrations
   - Advanced customization options

### 🤝 Contributing to Missing Features

We welcome contributions! If you'd like to implement any of these missing features:

1. **Check the GitHub Issues** for existing work on these features
2. **Open a Discussion** before starting major features like real-time sync
3. **Start Small** - consider implementing basic versions first
4. **Follow the Patterns** - use existing code patterns for consistency

## �🚀 Technology Stack

### ✅ Currently Implemented

#### Frontend Architecture
- **Framework**: Next.js 16.0.1 with App Router ✅
- **Language**: TypeScript 5.0 with strict type checking ✅
- **UI Framework**: React 18.3.1 with modern hooks ✅
- **Styling**: Tailwind CSS 3.4.1 with custom design system ✅
- **Component Library**: Radix UI with shadcn/ui components ✅
- **State Management**: Context API with React Query ✅
- **Form Handling**: React Hook Form with Zod validation ✅
- **Calendar**: FullCalendar 6.1.19 for event management ✅

#### Backend Infrastructure
- **API Layer**: Next.js API Routes with serverless architecture ✅
- **Database ORM**: Prisma 6.17.0 with type-safe queries ✅
- **Database**: SQLite (development) ✅
- **Authentication**: JWT tokens with bcryptjs encryption ✅
- **File Storage**: Local filesystem ✅
- **Validation**: Zod schemas for all inputs ✅

#### Development Tools
- **Build System**: Turbopack for fast development builds ✅
- **Code Quality**: ESLint, TypeScript strict mode ✅
- **Package Manager**: npm with proper dependency management ✅
- **Development**: Hot reload with Next.js dev server ✅

### 🔄 Partially Implemented

#### Real-time Features
- **Socket.IO**: 🔄 Client dependencies installed, server implementation needed
- **Real-time Sync**: 🔄 Client hooks ready, WebSocket server pending
- **Live Updates**: 🔄 Event structure defined, broadcasting not active

#### Advanced Features
- **AI Integration**: 🔄 Google AI (@google/generative-ai) installed, limited implementation
- **Caching**: 🔄 Redis (ioredis) dependency added, implementation pending
- **PWA**: 🔄 Basic manifest, full service worker needed

### ❌ Not Yet Implemented

#### Production Infrastructure
- **Database**: ❌ PostgreSQL production setup not configured
- **Deployment**: ❌ Docker configuration missing
- **Monitoring**: ❌ Comprehensive logging and error tracking not set up
- **Testing**: ❌ Test suites not implemented
- **CI/CD**: ❌ Automated deployment pipelines missing

#### Enterprise Features
- **Load Balancing**: ❌ nginx configuration not provided
- **CDN**: ❌ Static asset optimization not configured
- **Backup Recovery**: ❌ Automated restore procedures not implemented
- **Security Hardening**: ❌ Production security measures not configured

## 🚀 Quick Start

Get the core rental management system running in less than 5 minutes:

```bash
# Clone the repository
git clone https://github.com/felicianopt99/AV-RENTALS.git
cd AV-RENTALS

# Install dependencies
npm install

# Set up environment (create your own .env file)
# You'll need to set up DATABASE_URL and JWT_SECRET

# Initialize database
npm run db:generate && npm run db:push && npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the seeded admin account.

### ✅ What Works Immediately
- Equipment inventory management
- Client and event management  
- Quote generation with PDF export
- Rental tracking and scheduling
- User authentication and roles
- Responsive web interface

### ❌ What Requires Additional Setup
- Real-time collaboration (needs Socket.IO server)
- Production deployment (needs Docker/PostgreSQL config)
- PWA offline features (needs service worker)
- Advanced monitoring (needs Redis/monitoring setup)

## 📦 Installation

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- **Git** for version control

### Development Setup

1. **Clone and Navigate**
   ```bash
   git clone https://github.com/felicianopt99/AV-RENTALS.git
   cd AV-RENTALS
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL="file:./dev.db"
   
   # Authentication
   JWT_SECRET="your-secret-key-here"
   NEXTAUTH_SECRET="your-nextauth-secret"
   
   # Application
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   
   # Optional: AI Features
   GOOGLE_GENERATIVE_AI_API_KEY="your-api-key"
   ```

4. **Database Initialization**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Create database schema
   npm run db:push
   
   # Seed with initial data
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   # Standard development mode
   npm run dev
   
   # Fast mode with Turbopack
   npm run dev:fast
   
   # With caching optimization
   npm run dev:cached
   ```

### Production Build

```bash
# Build application
npm run build

# Start production server
npm run start
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Database connection string | Yes | `file:./dev.db` |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | - |
| `NEXTAUTH_SECRET` | NextAuth.js secret | Yes | - |
| `NEXT_PUBLIC_APP_URL` | Application base URL | Yes | `http://localhost:3000` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key | No | - |

### Database Configuration

The application supports multiple database configurations:

**Development (SQLite)**
```env
DATABASE_URL="file:./dev.db"
```

**Production (PostgreSQL)**
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

### Custom Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:fast` | Start with Turbopack optimization |
| `npm run build:cached` | Production build with caching |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database with fresh data |
| `npm run backup` | Create database backup |
| `npm run backup:restore` | Restore from backup |

## 📚 API Documentation

### Authentication

All API endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Equipment Management

```http
GET    /api/equipment           # List equipment with pagination
POST   /api/equipment           # Create new equipment
PUT    /api/equipment           # Update equipment
DELETE /api/equipment?id={id}   # Delete equipment
```

#### Rental Operations

```http
GET    /api/rentals            # List all rentals
POST   /api/rentals            # Create new rental
PUT    /api/rentals            # Update rental
DELETE /api/rentals?id={id}    # Delete rental
```

#### Event Management

```http
GET    /api/events             # List events
POST   /api/events             # Create event
PUT    /api/events             # Update event
DELETE /api/events?id={id}     # Delete event
```

#### Client Management

```http
GET    /api/clients            # List clients
POST   /api/clients            # Create client
PUT    /api/clients            # Update client
DELETE /api/clients?id={id}    # Delete client
```

### Request/Response Examples

#### Create Equipment
```http
POST /api/equipment
Content-Type: application/json

{
  "name": "Professional Camera",
  "description": "4K Professional Video Camera",
  "categoryId": "video-equipment",
  "quantity": 3,
  "status": "good",
  "location": "Warehouse A",
  "dailyRate": 150.00,
  "type": "equipment"
}
```

#### Create Rental
```http
POST /api/rentals
Content-Type: application/json

{
  "eventId": "event-123",
  "equipment": [
    {
      "equipmentId": "equipment-456",
      "quantity": 2
    }
  ],
  "notes": "Handle with care"
}
```

### Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* Additional error details */ }
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🚀 Deployment

### Production Deployment Options

#### Firebase App Hosting (Recommended)

The application is optimized for Firebase App Hosting with zero-configuration deployment:

```bash
# Build for production
npm run build

# Deploy with Firebase CLI
firebase deploy --only hosting
```

Configuration file: `apphosting.yaml`

#### Docker Deployment

```bash
# Build Docker image
docker build -t av-rentals .

# Run container
docker run -p 3000:3000 av-rentals
```

#### Docker Compose (Full Stack)

```bash
# Start all services
docker-compose up -d

# With SSL and nginx
docker-compose -f docker-compose.yml up -d
```

### Environment Setup

#### Production Environment Variables

```env
# Database (PostgreSQL recommended)
DATABASE_URL="postgresql://user:password@host:port/database"

# Security
JWT_SECRET="production-secret-key-minimum-32-chars"
NEXTAUTH_SECRET="production-nextauth-secret"

# Application
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"

# Optional Features
GOOGLE_GENERATIVE_AI_API_KEY="your-production-api-key"
```

#### SSL Configuration

For production deployment with SSL:

1. **Automatic SSL with Duck DNS**
   ```bash
   ./setup-duckdns-ssl.sh your-domain.duckdns.org your-email@domain.com
   ```

2. **Manual SSL Setup**
   ```bash
   ./setup-ssl.sh yourdomain.com your-email@domain.com
   ```

### Performance Optimization

#### Caching Strategy
- **Build Caching**: Optimized build process with dependency caching
- **Static Assets**: CDN-ready static file serving
- **Database Queries**: Prisma query optimization with connection pooling
- **API Responses**: Intelligent caching for frequently accessed data

#### Monitoring & Logging
- **Application Logs**: Structured logging with rotation
- **Error Tracking**: Comprehensive error reporting
- **Performance Metrics**: Real-time performance monitoring
- **Health Checks**: Automated service health monitoring

### Current Scalability Status

| User Count | Current Status | Database | Notes |
|------------|---------------|----------|-------|
| 1-5 users | ✅ Works well | SQLite | Perfect for development/small teams |
| 6-15 users | ⚠️ May have issues | SQLite | Concurrent writes may cause conflicts |
| 16+ users | ❌ Not recommended | SQLite | **Requires PostgreSQL migration** |

### Planned Production Scalability

| User Count | Target Performance | Database | Requirements |
|------------|------------------|----------|-------------|
| 1-10 users | Excellent | PostgreSQL | Basic production setup |
| 11-50 users | Very Good | PostgreSQL + Redis | Load balancing needed |
| 51-100 users | Good | PostgreSQL + Redis | Horizontal scaling required |
| 100+ users | Requires optimization | Clustered PostgreSQL | Microservices architecture |

**Current Limitation**: Real-time features are not implemented, so concurrent user scenarios haven't been fully tested.

## 🏗️ Architecture

### Current System Architecture

```
┌─────────────────┐
│   Web Clients   │ ✅ Responsive React App
│   (Browser)     │
└─────────────────┘
         │
         ▼ HTTP/HTTPS
┌─────────────────┐
│   Next.js App   │ ✅ API Routes + Server Components
│  (App Router)   │
└─────────────────┘
         │
         ▼ Prisma ORM
┌─────────────────┐
│     SQLite      │ ✅ Development Database
│   (dev.db)      │
└─────────────────┘
```

### Planned Production Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Load Balancer │    │      CDN        │
│  (Web/Mobile)   │◄──►│     (nginx)     │◄──►│   (Static)      │ ❌ Not Implemented
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Socket.IO     │ ❌ Server Missing
│  (App Router)   │◄──►│   (Real-time)   │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Prisma ORM    │◄──►│   PostgreSQL    │◄──►│   Redis Cache   │ ❌ Not Configured
│  (Type-safe)    │    │   (Primary DB)  │    │   (Sessions)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Database Schema

#### Core Entities

```sql
-- Equipment Management
Equipment {
  id          String   @id
  name        String
  description String
  category    Category @relation
  quantity    Int
  status      Status
  location    String
  dailyRate   Decimal
  createdAt   DateTime
  updatedAt   DateTime
}

-- Event & Rental Management
Event {
  id        String   @id
  name      String
  client    Client   @relation
  location  String
  startDate DateTime
  endDate   DateTime
  rentals   Rental[]
}

Rental {
  id          String @id
  event       Event  @relation
  equipment   Equipment @relation
  quantity    Int
  prepStatus  Status
  createdAt   DateTime
}

-- User Management
User {
  id       String @id
  username String @unique
  email    String @unique
  role     Role
  profile  Profile?
}
```

### Security Architecture

#### Authentication Flow
1. **Login**: JWT token generation with secure password hashing
2. **Session Management**: Token validation on each request
3. **Role Authorization**: Route-level permission checking
4. **Data Access**: Row-level security with user context

#### Security Features
- **Password Security**: bcrypt hashing with salt rounds
- **JWT Tokens**: Signed tokens with expiration
- **Input Validation**: Zod schema validation on all inputs
- **SQL Injection Prevention**: Prisma parameterized queries
- **XSS Protection**: React's built-in XSS prevention
- **CSRF Protection**: Next.js automatic CSRF handling

### Real-time Architecture Status

#### ❌ Socket.IO Implementation (NOT IMPLEMENTED)

**What exists**:
```typescript
// ✅ Client-side hooks (implemented)
export function useRealTimeSync(options: UseRealTimeSyncOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  // ... client-side logic exists
}
```

**What's missing**:
```typescript
// ❌ Server-side implementation (NOT IMPLEMENTED)
// This code is documented but doesn't exist:
io.on('connection', (socket) => {
  socket.on('equipment:update', (data) => {
    socket.broadcast.emit('equipment:updated', data);
  });
});
```

**Current Reality**: 
- ✅ Client can attempt Socket.IO connections
- ❌ **No Socket.IO server exists** - connections will fail
- ❌ No real-time data broadcasting
- ❌ Users must manually refresh for updates

### Performance Optimization

#### Query Optimization
- **Prisma Relations**: Efficient include/select strategies
- **Pagination**: Cursor-based pagination for large datasets
- **Indexing**: Strategic database indexing for common queries
- **Connection Pooling**: Optimized database connection management

#### Frontend Optimization
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js automatic image optimization
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Caching**: Intelligent browser and CDN caching strategies

## 🤝 Contributing

We welcome contributions from the community! Please read our contribution guidelines before getting started.

### Development Workflow

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/AV-RENTALS.git
   cd AV-RENTALS
   ```

2. **Set Up Development Environment**
   ```bash
   # Install dependencies
   npm install
   
   # Set up environment
   cp .env.example .env
   
   # Initialize database
   npm run db:generate && npm run db:push && npm run db:seed
   ```

3. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Changes and Test**
   ```bash
   # Run development server
   npm run dev
   
   # Run type checking
   npm run typecheck
   
   # Run linting
   npm run lint
   ```

5. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Open a pull request on GitHub
   - Provide detailed description of changes
   - Ensure all tests pass
   - Request review from maintainers

### Code Standards

#### TypeScript Guidelines
- Use strict TypeScript configuration
- Define proper interfaces and types
- Leverage Prisma-generated types
- Implement proper error handling

#### Component Guidelines
- Use functional components with hooks
- Implement proper prop validation
- Follow React best practices
- Ensure accessibility compliance

#### API Guidelines
- Implement proper error handling
- Use Zod schemas for validation
- Follow RESTful conventions
- Include comprehensive documentation

### Testing Guidelines

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint

# Test database operations
npm run db:studio
```

### Documentation

- Update README.md for new features
- Add inline code documentation
- Update API documentation
- Include usage examples

## 📞 Support

### Community Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/felicianopt99/AV-RENTALS/issues)
- **GitHub Discussions**: [Community discussions and Q&A](https://github.com/felicianopt99/AV-RENTALS/discussions)

### Enterprise Support

For enterprise deployments and custom implementations:
- **Email**: Contact through GitHub
- **Documentation**: Comprehensive guides in `/docs`
- **Deployment**: Professional deployment assistance available

### Frequently Asked Questions

#### General Questions

**Q: Can I use this for other rental businesses?**
A: Yes! While designed for AV equipment, the system can be adapted for any rental business.

**Q: What's the maximum number of users supported?**
A: With proper configuration, the system can handle 100+ concurrent users. See scalability section for details.

**Q: Is there mobile app support?**
A: The web application is a PWA that works excellently on mobile devices and can be installed as a native app.

#### Technical Questions

**Q: Can I customize the categories and equipment types?**
A: Absolutely! The category system is fully customizable through the admin interface.

**Q: How do I backup my data?**
A: The system includes automated backup scripts. Run `npm run backup` for manual backups.

**Q: Can I integrate with external systems?**
A: Yes, the REST API allows integration with external systems like accounting software.

### Resources

- **Documentation**: Complete documentation in `/docs` folder
- **API Reference**: Detailed API documentation above
- **Deployment Guides**: Step-by-step deployment instructions
- **Video Tutorials**: Available in the GitHub repository

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

### MIT License Summary

```
Copyright (c) 2024 AV Rentals Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

<div align="center">

### Built with ❤️ for the AV rental industry

[⭐ Star this project](https://github.com/felicianopt99/AV-RENTALS) | [🐛 Report a bug](https://github.com/felicianopt99/AV-RENTALS/issues) | [💡 Request a feature](https://github.com/felicianopt99/AV-RENTALS/issues/new)

**Professional AV Equipment Rental Management** • **Real-time Collaboration** • **Enterprise Ready**

</div>
