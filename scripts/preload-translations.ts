#!/usr/bin/env tsx
/**
 * Background Translation Pre-loader
 * 
 * This script runs in the background and slowly translates all common UI text.
 * It respects rate limits and saves translations to the database permanently.
 * 
 * Usage:
 *   npm run translate:preload
 *   Or: tsx scripts/preload-translations.ts
 */

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

// Rate limiting: Stay well under 10 requests/minute
const REQUESTS_PER_MINUTE = 6; // Safe limit
const DELAY_BETWEEN_REQUESTS = (60 / REQUESTS_PER_MINUTE) * 1000; // ~10 seconds

// Common UI text to translate
const commonTexts = [
  // Navigation
  'Dashboard', 'Inventory', 'View Inventory', 'Categories', 'Maintenance',
  'Clients', 'Team', 'Rentals', 'Event Calendar', 'Events', 'Quotes',
  'Services', 'Fees', 'User Management', 'Customization', 'PDF Branding',
  'System Settings', 'Administration',
  
  // Actions
  'Save', 'Cancel', 'Delete', 'Edit', 'Add', 'Create', 'Update', 'Submit',
  'Confirm', 'Back', 'Next', 'Finish', 'Close', 'Search', 'Filter',
  'Export', 'Import', 'Download', 'Upload', 'Print', 'Refresh', 'Clear',
  'Apply', 'Reset', 'Logout', 'Login',
  
  // Status
  'Active', 'Inactive', 'Pending', 'Completed', 'Cancelled', 'Draft',
  'Approved', 'Rejected', 'Available', 'Rented', 'In Maintenance',
  
  // Common Labels
  'Name', 'Description', 'Status', 'Date', 'Time', 'Price', 'Total',
  'Quantity', 'Notes', 'Email', 'Phone', 'Address', 'Category',
  
  // Messages
  'Loading...', 'Saving...', 'Success!', 'Error', 'No data available',
  'Search...', 'Select...', 'Choose file', 'Upload file',
  
  // Confirmations
  'Are you sure you want to delete this?',
  'Are you sure you want to cancel?',
  'You have unsaved changes',
  'This action cannot be undone',
  
  // Validation
  'This field is required',
  'Invalid email address',
  'Invalid phone number',
  'Please enter a valid date',
  
  // Equipment
  'Equipment List', 'Add Equipment', 'Edit Equipment', 'Equipment Details',
  'Equipment Name', 'Serial Number', 'Purchase Date', 'Purchase Price',
  'Daily Rate', 'Condition', 'Excellent', 'Good', 'Fair', 'Poor',
  
  // Clients
  'Client List', 'Add Client', 'Edit Client', 'Client Details',
  'Client Name', 'Company Name', 'Contact Person', 'Tax ID',
  'Billing Address', 'Shipping Address',
  
  // Rentals
  'Rental List', 'New Rental', 'Rental Details', 'Start Date', 'End Date',
  'Total Amount', 'Deposit', 'Returned', 'Overdue', 'Pickup Location',
  'Return Location',
  
  // Dashboard
  'Total Equipment', 'Total Clients', 'Upcoming Events', 'In next 7 days',
  'Needs Maintenance', 'Monthly Revenue', 'Top Clients by Revenue',
  'Most Rented Equipment', 'Quick Actions', 'Your Events This Week',
  
  // Common Phrases
  'Welcome', 'Good morning', 'Good afternoon', 'Good evening',
  'Ready to manage your team?', 'Get started', 'Learn more',
  'View all', 'Show more', 'Show less', 'Load more',
  
  // Error Messages
  'Something went wrong', 'Please try again', 'Failed to load data',
  'Failed to save', 'Failed to delete', 'Network error',
  'Logged out', 'You have been successfully logged out.',
  'Failed to log out. Please try again.',
  
  // Success Messages
  'Successfully saved', 'Successfully deleted', 'Successfully updated',
  'Changes saved', 'Item added', 'Item updated', 'Item deleted',
];

let requestCount = 0;
let startTime = Date.now();

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - startTime;
  
  // Reset counter every minute
  if (elapsed >= 60000) {
    console.log(`✓ Rate limit window passed. Translated ${requestCount} items in the last minute.`);
    requestCount = 0;
    startTime = now;
  }
  
  // Wait if we've hit our safe limit
  if (requestCount >= REQUESTS_PER_MINUTE) {
    const waitTime = 60000 - elapsed + 1000; // Wait until next minute + 1 second buffer
    console.log(`⏸  Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`);
    await sleep(waitTime);
    requestCount = 0;
    startTime = Date.now();
  }
}

async function translateText(text: string, targetLang: string = 'pt'): Promise<string | null> {
  try {
    // Check if already exists in database
    const existing = await prisma.translation.findUnique({
      where: {
        sourceText_targetLang: {
          sourceText: text,
          targetLang: targetLang,
        },
      },
    });

    if (existing) {
      console.log(`  ✓ Already cached: "${text}" → "${existing.translatedText}"`);
      return existing.translatedText;
    }

    // Check rate limit before API call
    await checkRateLimit();

    // Translate with Gemini
    console.log(`  🤖 Translating: "${text}"`);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      }
    });

    const prompt = `Translate the following text to Portuguese (European Portugal variant, not Brazilian).
Keep any technical terms, brand names, and formatting intact.
Only return the translated text, nothing else.

Text to translate: "${text}"`;

    const result = await model.generateContent(prompt);
    const translated = result.response.text().trim();

    // Save to database
    await prisma.translation.create({
      data: {
        sourceText: text,
        targetLang: targetLang,
        translatedText: translated,
        model: "gemini-2.5-flash",
      },
    });

    requestCount++;
    console.log(`  ✓ Saved: "${text}" → "${translated}"`);

    // Wait between requests to stay under rate limit
    await sleep(DELAY_BETWEEN_REQUESTS);

    return translated;
  } catch (error: any) {
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      console.log(`  ⚠️  Rate limit hit for "${text}". Waiting 60 seconds...`);
      await sleep(60000);
      return null; // Will retry on next run
    }
    console.error(`  ✗ Error translating "${text}":`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting background translation preloader...\n');
  console.log(`📊 Total texts to translate: ${commonTexts.length}`);
  console.log(`⏱️  Rate limit: ${REQUESTS_PER_MINUTE} requests/minute (~${Math.ceil(DELAY_BETWEEN_REQUESTS / 1000)}s between requests)`);
  console.log(`⏳ Estimated time: ~${Math.ceil((commonTexts.length / REQUESTS_PER_MINUTE))} minutes\n`);

  // Check database connection
  try {
    await prisma.$connect();
    console.log('✓ Database connected\n');
  } catch (error) {
    console.error('✗ Failed to connect to database:', error);
    process.exit(1);
  }

  // Check how many are already translated
  const existing = await prisma.translation.count({
    where: { targetLang: 'pt' }
  });
  console.log(`📦 Already in database: ${existing} translations\n`);

  let translated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < commonTexts.length; i++) {
    const text = commonTexts[i];
    console.log(`[${i + 1}/${commonTexts.length}] Processing: "${text}"`);

    const result = await translateText(text);

    if (result === null) {
      failed++;
    } else if (result) {
      // Check if it was newly translated or already cached
      const wasNew = !await prisma.translation.findUnique({
        where: {
          sourceText_targetLang: {
            sourceText: text,
            targetLang: 'pt',
          },
        },
      });
      if (wasNew) translated++;
      else skipped++;
    }

    console.log(''); // Empty line for readability
  }

  console.log('\n═══════════════════════════════════════');
  console.log('🎉 Translation preloading complete!\n');
  console.log(`✓ Successfully translated: ${translated}`);
  console.log(`⊙ Already cached: ${skipped}`);
  console.log(`✗ Failed/Skipped: ${failed}`);
  console.log(`📦 Total in database: ${existing + translated}`);
  console.log('═══════════════════════════════════════\n');

  await prisma.$disconnect();
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Interrupted by user. Disconnecting...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Terminated. Disconnecting...');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the script
main().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
