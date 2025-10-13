# AV Rentals

A comprehensive equipment rental management system for audio/video production companies. Built with Next.js, TypeScript, and Prisma, featuring multi-user real-time collaboration, conflict resolution, and production-ready deployment.

## 🚀 Features

### Core Functionality
- **Equipment Inventory**: Track audio/video equipment with categories, subcategories, status, and location
- **Rental Management**: Create and manage equipment rentals with automatic conflict detection
- **Calendar Integration**: Visual scheduling with FullCalendar showing all rentals and availability
- **Client Management**: Maintain detailed client information and contact history
- **Quote System**: Generate professional quotes with automatic tax calculations and PDF export
- **Maintenance Tracking**: Log equipment maintenance, repairs, and service history

### Multi-User Collaboration
- **Real-time Sync**: Live updates across all connected users using Socket.IO
- **Conflict Resolution**: Optimistic locking prevents data corruption from concurrent edits
- **User Management**: Role-based access control with admin and user roles
- **Activity Logging**: Complete audit trail of all user actions for compliance
- **Session Management**: Secure authentication with JWT tokens and session tracking

### Technical Features
- **Progressive Web App**: Offline capabilities and installable on mobile devices
- **Responsive Design**: Mobile-first design optimized for all screen sizes
- **Dark Theme**: Modern dark UI following Material Design principles
- **Performance**: Optimized queries with pagination and caching
- **Error Recovery**: Automatic retry logic and graceful error handling

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production)
- **Real-time**: Socket.IO for live updates
- **Authentication**: JWT with bcryptjs password hashing
- **Deployment**: Firebase App Hosting
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AV-RENTALS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Seed with sample data
   npm run db:seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🚀 Deployment

### Production Build
```bash
# Build with caching optimization
npm run build:cached

# Or standard build
npm run build

# Start production server
npm run start:prod
```

### Firebase App Hosting
The application is configured for Firebase App Hosting. Use the provided `apphosting.yaml` configuration for deployment.

## 📊 Multi-User Capacity

| User Count | Read Operations | Write Operations | Performance |
|------------|----------------|------------------|-------------|
| 1-10 users | ✅ Excellent | ✅ Excellent | Very Fast |
| 11-25 users | ✅ Very Good | ✅ Good | Fast |
| 26-50 users | ✅ Good | ⚠️ Moderate | Acceptable |
| 51+ users | ⚠️ Depends on usage | ⚠️ Needs monitoring | Variable |

## 🔒 Security

- JWT-based authentication with secure session management
- Database-level optimistic locking for data integrity
- Input validation using Zod schemas
- Password hashing with bcryptjs
- Comprehensive audit logging
- Role-based access control

## 📱 Progressive Web App

The application can be installed as a PWA on mobile devices and desktops, providing:
- Offline access to cached data
- Push notifications for important updates
- Native app-like experience
- Automatic updates

## 🗂️ Project Structure

```
AV-RENTALS/
├── docs/                          # Documentation
│   ├── blueprint.md              # Project specifications
│   └── MULTI_USER_IMPROVEMENTS.md # Multi-user features
├── prisma/                        # Database
│   ├── schema.prisma             # Database schema
│   ├── seed.ts                   # Sample data
│   ├── reset.ts                  # Database reset
│   └── dev.db                    # Development database
├── scripts/                       # Build scripts
│   └── build-with-cache.sh       # Production build
├── src/
│   ├── app/                      # Next.js app router
│   │   ├── api/                  # API routes
│   │   ├── (auth)/               # Authentication pages
│   │   ├── equipment/            # Equipment management
│   │   ├── clients/              # Client management
│   │   ├── rentals/              # Rental scheduling
│   │   └── ...
│   ├── components/               # React components
│   │   ├── ui/                   # Reusable UI components
│   │   ├── layout/               # Layout components
│   │   ├── equipment/            # Equipment components
│   │   └── ...
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities and configurations
│   │   ├── db-enhanced.ts        # Enhanced database client
│   │   ├── realtime-sync.ts      # Real-time sync utilities
│   │   └── utils.ts              # General utilities
│   └── ...
├── TODO.md                        # Development tasks
├── TODO-cleanup.md               # Cleanup documentation
├── apphosting.yaml               # Firebase deployment
├── package.json                  # Dependencies
└── README.md                     # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions, please open an issue on the GitHub repository.

---

**Built with ❤️ for the AV rental industry**
