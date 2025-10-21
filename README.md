# AV Rentals Management System

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5.4-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-6.17.0-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/Socket.IO-4.8.1-black?style=for-the-badge&logo=socket.io" alt="Socket.IO">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</div>

<br />

A comprehensive, enterprise-grade equipment rental management system designed specifically for audio/video production companies. Built with modern web technologies, featuring real-time collaboration, advanced scheduling, and production-ready deployment capabilities.

## 📋 Table of Contents

- [Features](#-features)
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

### Core Business Logic
- **Equipment Inventory Management**: Comprehensive tracking with categorization, status monitoring, and location management
- **Intelligent Rental Scheduling**: Automated conflict detection with visual calendar integration
- **Client Relationship Management**: Detailed customer profiles with contact history and preferences
- **Professional Quote Generation**: Automated pricing with tax calculations and PDF export capabilities
- **Maintenance & Service Tracking**: Complete equipment lifecycle management with service history

### Advanced Collaboration
- **Real-time Multi-user Sync**: Live updates across all connected users via Socket.IO
- **Optimistic Locking**: Prevents data corruption from concurrent modifications
- **Role-based Access Control**: Granular permissions for Admin, Manager, Technician, Employee, and Viewer roles
- **Comprehensive Audit Trail**: Complete logging of all user actions for compliance and accountability
- **Session Management**: Secure JWT-based authentication with automatic session handling

### Enterprise Features
- **Progressive Web Application**: Full offline capabilities with native app-like experience
- **Responsive Design**: Mobile-first architecture optimized for all devices
- **Dark Mode Interface**: Modern UI following Material Design principles
- **Performance Optimization**: Intelligent caching, pagination, and query optimization
- **Error Recovery**: Automatic retry mechanisms with graceful degradation
- **Backup & Recovery**: Automated database backups with rotation policies

## 🚀 Technology Stack

### Frontend Architecture
- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript 5.0 with strict type checking
- **UI Framework**: React 18.3.1 with modern hooks
- **Styling**: Tailwind CSS 3.4.1 with custom design system
- **Component Library**: Radix UI with shadcn/ui components
- **State Management**: Context API with optimized re-rendering
- **Form Handling**: React Hook Form with Zod validation

### Backend Infrastructure
- **API Layer**: Next.js API Routes with serverless architecture
- **Database ORM**: Prisma 6.17.0 with type-safe queries
- **Database**: SQLite (development), PostgreSQL (production)
- **Real-time Communication**: Socket.IO 4.8.1 for live updates
- **Authentication**: JWT tokens with bcryptjs encryption
- **File Storage**: Local filesystem with cloud migration ready

### Development & Deployment
- **Build System**: Turbopack for fast development builds
- **Code Quality**: ESLint, TypeScript strict mode
- **Testing**: Built-in Next.js testing capabilities
- **Deployment**: Firebase App Hosting with Docker support
- **Monitoring**: Comprehensive logging and error tracking

## 🚀 Quick Start

Get up and running in less than 5 minutes:

```bash
# Clone the repository
git clone https://github.com/felicianopt99/AV-RENTALS.git
cd AV-RENTALS

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Initialize database
npm run db:generate && npm run db:push && npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with:
- **Username**: `admin`
- **Password**: `admin`

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

### Scalability Considerations

| User Count | Performance | Database | Recommendations |
|------------|-------------|----------|-----------------|
| 1-10 users | Excellent | SQLite/PostgreSQL | Single instance |
| 11-50 users | Very Good | PostgreSQL | Load balancing |
| 51-100 users | Good | PostgreSQL + Redis | Horizontal scaling |
| 100+ users | Requires optimization | Clustered PostgreSQL | Microservices architecture |

## 🏗️ Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Load Balancer │    │      CDN        │
│  (Web/Mobile)   │◄──►│     (nginx)     │◄──►│   (Static)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Socket.IO     │
│  (App Router)   │◄──►│   (Real-time)   │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Prisma ORM    │◄──►│   PostgreSQL    │◄──►│   Redis Cache   │
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

### Real-time Architecture

#### Socket.IO Implementation
```typescript
// Server-side event handling
io.on('connection', (socket) => {
  socket.on('equipment:update', (data) => {
    // Broadcast to all connected clients
    socket.broadcast.emit('equipment:updated', data);
  });
});

// Client-side real-time sync
socket.on('equipment:updated', (data) => {
  // Update local state with optimistic locking
  updateEquipmentState(data);
});
```

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
