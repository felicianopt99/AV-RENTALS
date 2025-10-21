# 🗄️ Clean Database Setup for AV-RENTALS

## Overview

Your AV-RENTALS application is now configured with a **completely clean database** setup that includes only the essential data for production use.

## What Gets Created on First Deployment

### ✅ **Single Admin User**
- **Username**: `admin`
- **Password**: `admin`
- **Role**: `Admin`
- **Full Access**: Complete system administration

### ✅ **Equipment Categories Only**
The system will create these basic categories for organizing your equipment:
- **Audio** (Microphones, Speakers, etc.)
- **Video** (Projectors, Cameras, etc.)  
- **Lighting** (LED Pars, Stage Lights, etc.)
- **Staging** (Platforms, Stands, etc.)

### ✅ **Subcategories**
Each category includes relevant subcategories:
- Audio: Microphones, Speakers
- Video: Projectors
- Lighting: LED Pars
- Staging: Platforms

### ❌ **NO Sample Data**
- **No sample equipment** - completely empty inventory
- **No sample clients** - clean client database
- **No sample events** - no test events
- **No sample rentals** - no test rental history
- **No sample quotes** - clean quotes system

## Database Commands

### Initial Setup (First Deployment)
```bash
# This will create tables and seed with admin user + categories
docker-compose exec av-rentals npm run db:reset
```

### Reset to Clean State (If Needed)
```bash
# Reset database to clean state with only admin and categories
docker-compose exec av-rentals npm run db:reset
```

### Manual Database Operations
```bash
# Just push schema (no seeding)
docker-compose exec av-rentals npx prisma db push

# Seed only (admin + categories)
docker-compose exec av-rentals npm run db:seed

# Open database studio
docker-compose exec av-rentals npx prisma studio
```

## What You'll See After First Login

1. **Dashboard**: Empty with welcome message
2. **Equipment**: No equipment items (ready for you to add)
3. **Clients**: Empty client list
4. **Events**: No scheduled events
5. **Rentals**: No active rentals
6. **Categories**: Pre-configured with Audio, Video, Lighting, Staging

## Adding Your First Equipment

After logging in as admin, you can:

1. Go to **Equipment** → **Add Equipment**
2. Select from pre-configured categories
3. Add your actual inventory items
4. Set pricing, locations, and quantities

## Production Ready

This setup ensures:
- ✅ **Clean start** for production
- ✅ **Secure admin access** with admin/admin credentials  
- ✅ **Organized structure** with categories ready
- ✅ **No test data** cluttering your system
- ✅ **Ready to use** immediately after deployment

## Security Note

**Important**: Change the admin password after first login!

1. Login with `admin`/`admin`
2. Go to Profile settings
3. Update password to something secure
4. Update admin user details as needed

Your database is now **production-ready** and completely clean! 🎉