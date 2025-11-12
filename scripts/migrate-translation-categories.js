#!/usr/bin/env node

/**
 * Migration script to update translation categories from generic ones to platform-specific ones
 * Run with: node scripts/migrate-translation-categories.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categoryMappings = [
  // Navigation & Menu items
  {
    keywords: ['Dashboard', 'Inventory', 'Categories', 'Clients', 'Events', 'Rentals', 'Quotes', 'Maintenance', 'User Management', 'Translation Management', 'Customization', 'System Settings', 'Team'],
    category: 'navigation',
    priority: 10
  },
  
  // Dashboard specific
  {
    keywords: ['Monthly Revenue', 'Top Clients', 'Most Rented', 'Revenue from accepted', 'Your most valuable', 'The most popular', 'Upcoming Events', 'Total Equipment', 'Total Clients', 'Needs Maintenance', 'In next 7 days'],
    category: 'dashboard',
    priority: 9
  },
  
  // Inventory & Equipment
  {
    keywords: ['Equipment', 'Inventory', 'Add New Equipment', 'Equipment not found', 'equipment'],
    category: 'inventory',
    priority: 8
  },
  
  // Categories & Subcategories
  {
    keywords: ['Category', 'Categories', 'Subcategory', 'Subcategories'],
    category: 'categories',
    priority: 8
  },
  
  // Client Management
  {
    keywords: ['Client', 'Clients', 'Add New Client', 'Client Management'],
    category: 'clients',
    priority: 8
  },
  
  // Events & Calendar
  {
    keywords: ['Events', 'Event', 'Calendar', 'Manage Events', 'Events assigned'],
    category: 'events',
    priority: 8
  },
  
  // Rentals & Bookings
  {
    keywords: ['Rental', 'Rentals', 'Booking', 'Bookings'],
    category: 'rentals',
    priority: 8
  },
  
  // Quotes & Services
  {
    keywords: ['Quote', 'Quotes', 'Create New Quote', 'Your quote has been sent', 'Service', 'Services'],
    category: 'quotes',
    priority: 8
  },
  
  // Maintenance
  {
    keywords: ['Maintenance', 'Repair', 'Repairs', 'Needs Maintenance'],
    category: 'maintenance',
    priority: 8
  },
  
  // User Management
  {
    keywords: ['User Management', 'Users', 'User', 'Team', 'manage your team'],
    category: 'users',
    priority: 8
  },
  
  // Admin & Settings
  {
    keywords: ['Admin', 'Settings', 'System Settings', 'Translation Management', 'Customization'],
    category: 'admin',
    priority: 7
  },
  
  // Forms & Input
  {
    keywords: ['Enter', 'Input', 'Form', 'Field', 'Required', 'Optional'],
    category: 'forms',
    priority: 5
  },
  
  // Buttons & Actions
  {
    keywords: ['Save Changes', 'Cancel', 'Add', 'Create', 'Delete', 'Edit', 'Update', 'Submit', 'Quick Actions', 'Get started'],
    category: 'buttons',
    priority: 6
  },
  
  // Messages & Notifications
  {
    keywords: ['Success', 'Successfully', 'Welcome', 'Good morning', 'Good afternoon', 'Good evening', 'Ready to', 'How can we'],
    category: 'messages',
    priority: 4
  },
  
  // Error Messages
  {
    keywords: ['Error', 'Failed', 'not found', 'Invalid', 'Required'],
    category: 'errors',
    priority: 7
  },
  
  // Email Templates
  {
    keywords: ['Your quote has been sent', 'Email', 'sent successfully'],
    category: 'email',
    priority: 9
  },
  
  // Reports & Analytics
  {
    keywords: ['Revenue', 'Analytics', 'Report', 'Statistics', 'Chart'],
    category: 'reports',
    priority: 6
  }
];

function categorizeTranslation(sourceText, context) {
  const textToAnalyze = `${sourceText} ${context || ''}`.toLowerCase();
  
  let bestMatch = { category: 'general', priority: 0 };
  
  for (const mapping of categoryMappings) {
    for (const keyword of mapping.keywords) {
      if (textToAnalyze.includes(keyword.toLowerCase())) {
        if (mapping.priority > bestMatch.priority) {
          bestMatch = { category: mapping.category, priority: mapping.priority };
        }
      }
    }
  }
  
  return bestMatch.category;
}

async function main() {
  try {
    console.log('🔄 Starting translation category migration...');
    
    // Get all translations
    const translations = await prisma.translation.findMany();
    
    console.log(`📊 Found ${translations.length} translations to process`);
    
    let updated = 0;
    let unchanged = 0;
    
    for (const translation of translations) {
      const newCategory = categorizeTranslation(translation.sourceText, translation.context);
      
      if (newCategory !== translation.category) {
        await prisma.translation.update({
          where: { id: translation.id },
          data: { 
            category: newCategory,
            updatedAt: new Date(),
            version: translation.version + 1
          }
        });
        
        console.log(`✅ Updated: "${translation.sourceText}" | ${translation.category} -> ${newCategory}`);
        updated++;
      } else {
        unchanged++;
      }
    }
    
    console.log(`\n📋 Migration Summary:`);
    console.log(`   ✅ Updated: ${updated} translations`);
    console.log(`   ➡️  Unchanged: ${unchanged} translations`);
    console.log(`   📊 Total processed: ${translations.length} translations`);
    
    // Show category distribution after migration
    const categoryStats = await prisma.translation.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });
    
    console.log(`\n📈 New category distribution:`);
    for (const stat of categoryStats) {
      console.log(`   ${stat.category}: ${stat._count.id} translations`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();