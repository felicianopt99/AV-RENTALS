#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

async function findCriticalMissingTranslations() {
  const prisma = new PrismaClient();
  
  try {
    // Essential UI terms that users see every day
    const essentialTerms = [
      // Navigation & Actions
      'Home', 'Back', 'Next', 'Previous', 'Close', 'Open', 'Menu',
      'Search', 'Filter', 'Sort', 'View', 'Edit', 'Delete', 'Save', 'Cancel',
      'Submit', 'Reset', 'Clear', 'Refresh', 'Update', 'Create', 'Add', 'Remove',
      
      // Core App Sections
      'Dashboard', 'Equipment', 'Clients', 'Events', 'Rentals', 'Quotes',
      'Inventory', 'Categories', 'Reports', 'Settings', 'Profile', 'Admin',
      
      // Forms & Fields
      'Name', 'Email', 'Phone', 'Address', 'City', 'Country', 'Date', 'Time',
      'Description', 'Notes', 'Price', 'Quantity', 'Total', 'Status', 'Type',
      
      // Status & States
      'Active', 'Inactive', 'Available', 'Unavailable', 'Pending', 'Completed',
      'Cancelled', 'Draft', 'Confirmed', 'Processing', 'Failed', 'Success',
      
      // Messages
      'Loading', 'Saving', 'Error', 'Success', 'Warning', 'Info',
      'Please wait', 'Try again', 'Are you sure', 'Confirm', 'Yes', 'No',
      
      // Equipment specific
      'Check In', 'Check Out', 'Maintenance', 'Available', 'Rented', 'Damaged',
      'Serial Number', 'Model', 'Brand', 'Condition', 'Location'
    ];
    
    console.log('🎯 CHECKING ESSENTIAL UI TRANSLATIONS');
    console.log('====================================');
    
    const missing = [];
    const found = [];
    
    for (const term of essentialTerms) {
      const translation = await prisma.translation.findFirst({
        where: {
          sourceText: {
            contains: term,
            mode: 'insensitive'
          },
          targetLang: 'pt'
        }
      });
      
      if (translation) {
        found.push(`✅ "${term}" → "${translation.translatedText}"`);
      } else {
        missing.push(term);
        console.log(`❌ Missing: "${term}"`);
      }
    }
    
    console.log(`\n📊 ESSENTIAL TERMS STATUS:`);
    console.log(`✅ Found: ${found.length}/${essentialTerms.length}`);
    console.log(`❌ Missing: ${missing.length}/${essentialTerms.length}`);
    console.log(`📈 Coverage: ${Math.round((found.length / essentialTerms.length) * 100)}%`);
    
    if (missing.length > 0) {
      console.log('\n🚨 HIGH PRIORITY MISSING TERMS:');
      missing.forEach((term, i) => {
        console.log(`  ${i + 1}. "${term}"`);
      });
      
      // Save for batch translation
      fs.writeFileSync(
        path.join(process.cwd(), 'critical-missing.json'),
        JSON.stringify({ criticalTerms: missing }, null, 2)
      );
      console.log('\n💾 Saved critical missing terms to: critical-missing.json');
    } else {
      console.log('\n🎉 ALL ESSENTIAL TERMS ARE TRANSLATED!');
    }
    
    // Check some sample found translations
    console.log('\n📋 Sample found translations:');
    found.slice(0, 10).forEach(item => console.log(`  ${item}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findCriticalMissingTranslations();