#!/usr/bin/env npx tsx

import fs from 'fs';
import path from 'path';

// Enhanced patterns for translation detection
const TRANSLATABLE_PATTERNS = [
  // Common UI messages
  { pattern: /"Loading\.\.\."/g, key: 'loading', replacement: '{loadingText}' },
  { pattern: /"Loading [^"]*"/g, key: 'loading', replacement: '{loadingText}' },
  { pattern: /"Access Denied"/g, key: 'accessDenied', replacement: '{accessDeniedText}' },
  { pattern: /"You do not have permission[^"]*"/g, key: 'noPermission', replacement: '{noPermissionText}' },
  { pattern: /"Permission denied[^"]*"/g, key: 'noPermission', replacement: '{noPermissionText}' },
  
  // CRUD operations
  { pattern: /"Create"/g, key: 'create', replacement: '{createText}' },
  { pattern: /"Add"/g, key: 'add', replacement: '{addText}' },
  { pattern: /"Edit"/g, key: 'edit', replacement: '{editText}' },
  { pattern: /"Update"/g, key: 'update', replacement: '{updateText}' },
  { pattern: /"Delete"/g, key: 'delete', replacement: '{deleteText}' },
  { pattern: /"Remove"/g, key: 'remove', replacement: '{removeText}' },
  { pattern: /"Save"/g, key: 'save', replacement: '{saveText}' },
  { pattern: /"Cancel"/g, key: 'cancel', replacement: '{cancelText}' },
  { pattern: /"Submit"/g, key: 'submit', replacement: '{submitText}' },
  { pattern: /"Confirm"/g, key: 'confirm', replacement: '{confirmText}' },
  
  // Common labels and titles
  { pattern: /"Name"/g, key: 'name', replacement: '{nameText}' },
  { pattern: /"Description"/g, key: 'description', replacement: '{descriptionText}' },
  { pattern: /"Email"/g, key: 'email', replacement: '{emailText}' },
  { pattern: /"Phone"/g, key: 'phone', replacement: '{phoneText}' },
  { pattern: /"Address"/g, key: 'address', replacement: '{addressText}' },
  { pattern: /"Date"/g, key: 'date', replacement: '{dateText}' },
  { pattern: /"Time"/g, key: 'time', replacement: '{timeText}' },
  { pattern: /"Status"/g, key: 'status', replacement: '{statusText}' },
  { pattern: /"Price"/g, key: 'price', replacement: '{priceText}' },
  { pattern: /"Total"/g, key: 'total', replacement: '{totalText}' },
  { pattern: /"Quantity"/g, key: 'quantity', replacement: '{quantityText}' },
  { pattern: /"Category"/g, key: 'category', replacement: '{categoryText}' },
  
  // Navigation and actions
  { pattern: /"Back"/g, key: 'back', replacement: '{backText}' },
  { pattern: /"Next"/g, key: 'next', replacement: '{nextText}' },
  { pattern: /"Previous"/g, key: 'previous', replacement: '{previousText}' },
  { pattern: /"Search"/g, key: 'search', replacement: '{searchText}' },
  { pattern: /"Filter"/g, key: 'filter', replacement: '{filterText}' },
  { pattern: /"Sort"/g, key: 'sort', replacement: '{sortText}' },
  { pattern: /"View"/g, key: 'view', replacement: '{viewText}' },
  { pattern: /"Details"/g, key: 'details', replacement: '{detailsText}' },
  { pattern: /"Actions"/g, key: 'actions', replacement: '{actionsText}' },
  { pattern: /"Options"/g, key: 'options', replacement: '{optionsText}' },
  
  // Status messages
  { pattern: /"Success"/g, key: 'success', replacement: '{successText}' },
  { pattern: /"Error"/g, key: 'error', replacement: '{errorText}' },
  { pattern: /"Warning"/g, key: 'warning', replacement: '{warningText}' },
  { pattern: /"Info"/g, key: 'info', replacement: '{infoText}' },
  { pattern: /"Failed to [^"]*"/g, key: 'failed', replacement: '{failedText}' },
  { pattern: /"Successfully [^"]*"/g, key: 'success', replacement: '{successText}' },
  
  // No data states
  { pattern: /"No [^"]* found"/g, key: 'noData', replacement: '{noDataText}' },
  { pattern: /"No data available"/g, key: 'noData', replacement: '{noDataText}' },
  { pattern: /"Empty"/g, key: 'empty', replacement: '{emptyText}' },
  { pattern: /"Nothing to show"/g, key: 'noData', replacement: '{noDataText}' },
  
  // Business-specific terms
  { pattern: /"Equipment"/g, key: 'equipment', replacement: '{equipmentText}' },
  { pattern: /"Client"/g, key: 'client', replacement: '{clientText}' },
  { pattern: /"Clients"/g, key: 'clients', replacement: '{clientsText}' },
  { pattern: /"Event"/g, key: 'event', replacement: '{eventText}' },
  { pattern: /"Events"/g, key: 'events', replacement: '{eventsText}' },
  { pattern: /"Rental"/g, key: 'rental', replacement: '{rentalText}' },
  { pattern: /"Rentals"/g, key: 'rentals', replacement: '{rentalsText}' },
  { pattern: /"Quote"/g, key: 'quote', replacement: '{quoteText}' },
  { pattern: /"Quotes"/g, key: 'quotes', replacement: '{quotesText}' },
  { pattern: /"Invoice"/g, key: 'invoice', replacement: '{invoiceText}' },
  { pattern: /"Invoices"/g, key: 'invoices', replacement: '{invoicesText}' },
  { pattern: /"Maintenance"/g, key: 'maintenance', replacement: '{maintenanceText}' },
  { pattern: /"Dashboard"/g, key: 'dashboard', replacement: '{dashboardText}' },
  { pattern: /"Inventory"/g, key: 'inventory', replacement: '{inventoryText}' },
  { pattern: /"Reports"/g, key: 'reports', replacement: '{reportsText}' },
  { pattern: /"Settings"/g, key: 'settings', replacement: '{settingsText}' },
  { pattern: /"Profile"/g, key: 'profile', replacement: '{profileText}' },
  { pattern: /"Users"/g, key: 'users', replacement: '{usersText}' },
  { pattern: /"Admin"/g, key: 'admin', replacement: '{adminText}' },
  { pattern: /"Logout"/g, key: 'logout', replacement: '{logoutText}' },
  { pattern: /"Login"/g, key: 'login', replacement: '{loginText}' },
];

// Default translations mapping
const DEFAULT_TRANSLATIONS: Record<string, string> = {
  loading: 'Loading...',
  accessDenied: 'Access Denied',
  noPermission: 'You do not have permission to view this page.',
  create: 'Create',
  add: 'Add',
  edit: 'Edit',
  update: 'Update',
  delete: 'Delete',
  remove: 'Remove',
  save: 'Save',
  cancel: 'Cancel',
  submit: 'Submit',
  confirm: 'Confirm',
  name: 'Name',
  description: 'Description',
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
  date: 'Date',
  time: 'Time',
  status: 'Status',
  price: 'Price',
  total: 'Total',
  quantity: 'Quantity',
  category: 'Category',
  back: 'Back',
  next: 'Next',
  previous: 'Previous',
  search: 'Search',
  filter: 'Filter',
  sort: 'Sort',
  view: 'View',
  details: 'Details',
  actions: 'Actions',
  options: 'Options',
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
  failed: 'Failed',
  noData: 'No data found',
  empty: 'Empty',
  equipment: 'Equipment',
  client: 'Client',
  clients: 'Clients',
  event: 'Event',
  events: 'Events',
  rental: 'Rental',
  rentals: 'Rentals',
  quote: 'Quote',
  quotes: 'Quotes',
  invoice: 'Invoice',
  invoices: 'Invoices',
  maintenance: 'Maintenance',
  dashboard: 'Dashboard',
  inventory: 'Inventory',
  reports: 'Reports',
  settings: 'Settings',
  profile: 'Profile',
  users: 'Users',
  admin: 'Admin',
  logout: 'Logout',
  login: 'Login'
};

// Function to add translation import and hook to a file
function addTranslationToFile(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Skip if already has useTranslate
    if (content.includes('useTranslate') || content.includes('from \'@/contexts/TranslationContext\'')) {
      console.log(`  ⚡ Already has translation: ${path.relative(process.cwd(), filePath)}`);
      return false;
    }
    
    // Skip if it's a simple UI component without translatable content
    if (content.length < 100 || 
        !content.includes('export') || 
        content.includes('.d.ts') ||
        content.includes('interface ') ||
        content.includes('type ') ||
        filePath.includes('/ui/')) {
      return false;
    }
    
    let modified = false;
    // Detect if this is a React component
    const isReactComponent = content.includes('export') && 
                            (content.includes('function') || content.includes('const') || content.includes('=')) &&
                            (content.includes('jsx') || content.includes('tsx') || content.includes('return'));
                            
    if (!isReactComponent) {
      return false;
    }
    
    // Add translation hooks for detected patterns
    const detectedHooks = new Set<string>();
    const replacements: { from: string, to: string }[] = [];
    
    // Apply translation patterns
    for (const { pattern, key, replacement } of TRANSLATABLE_PATTERNS) {
      const matches = content.match(pattern);
      
      if (matches) {
        matches.forEach(match => {
          const hookName = replacement.slice(1, -1); // Remove braces
          
          if (!detectedHooks.has(hookName)) {
            detectedHooks.add(hookName);
            replacements.push({ from: match, to: replacement });
          }
        });
      }
    }
    
    // Additional pattern for custom text detection (standalone quoted strings in JSX)
    const customTextPattern = />\s*"([^"]{2,50})"\s*</g;
    let customMatch;
    while ((customMatch = customTextPattern.exec(content)) !== null) {
      const fullMatch = customMatch[0];
      const text = customMatch[1];
      
      // Skip if it's likely not user-facing text
      if (text.includes('/') || 
          text.includes('\\') ||
          text.includes('@') ||
          text.includes('http') ||
          text.includes('www') ||
          text.includes('.') && text.length < 10 ||
          /^\d+$/.test(text) ||
          text.length < 2) {
        continue;
      }
      
      const hookName = `custom${text.replace(/[^a-zA-Z0-9]/g, '')}Text`;
      if (!detectedHooks.has(hookName)) {
        detectedHooks.add(hookName);
        replacements.push({ 
          from: fullMatch, 
          to: fullMatch.replace(`"${text}"`, `{${hookName}}`) 
        });
      }
    }
    // Skip if no translatable content found
    if (detectedHooks.size === 0) {
      return false;
    }
    
    // Add import if not present
    if (!content.includes('useTranslate') && !content.includes('from \'@/contexts/TranslationContext\'')) {
      // Find the imports section
      const importMatch = content.match(/(import.*?from.*?;[\s\n]*)+/);
      if (importMatch) {
        const importSection = importMatch[0];
        const translationImport = `import { useTranslate } from '@/contexts/TranslationContext';\n`;
        content = content.replace(importSection, importSection + translationImport);
        modified = true;
      } else {
        // Add import at the top if no imports found
        content = `import { useTranslate } from '@/contexts/TranslationContext';\n${content}`;
        modified = true;
      }
    }
    
    // Apply all replacements
    for (const { from, to } of replacements) {
      if (content.includes(from)) {
        content = content.replace(from, to);
        modified = true;
      }
    }
    
    // Add hook declarations inside the component
    if (detectedHooks.size > 0) {
      // Try to find React component function patterns
      const componentPatterns = [
        /(export default function \w+\([^)]*\)\s*\{)/,
        /(export function \w+\([^)]*\)\s*\{)/,
        /(const \w+ = \([^)]*\)\s*=>\s*\{)/,
        /(function \w+\([^)]*\)\s*\{)/
      ];
      
      let componentMatch = null;
      for (const pattern of componentPatterns) {
        componentMatch = content.match(pattern);
        if (componentMatch) break;
      }
      
      if (componentMatch) {
        const componentStart = componentMatch[0];
        let hooksCode = '\n  // Translation hooks\n';
        
        Array.from(detectedHooks).forEach((hookName: string) => {
          const originalText = getTranslationKeyForHook(hookName);
          hooksCode += `  const { translated: ${hookName} } = useTranslate('${originalText}');\n`;
        });
        
        content = content.replace(componentStart, componentStart + hooksCode);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Added translations to: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error);
    return false;
  }
}

function getTranslationKeyForHook(hookName: string): string {
  // Remove 'Text' suffix to get the key
  const key = hookName.replace(/Text$/, '');
  
  // Check if it's in our default translations
  if (DEFAULT_TRANSLATIONS[key]) {
    return DEFAULT_TRANSLATIONS[key];
  }
  
  // Handle custom text hooks
  if (hookName.startsWith('custom') && hookName.endsWith('Text')) {
    // Extract the text from the hook name and convert back
    const textPart = hookName.slice(6, -4); // Remove 'custom' and 'Text'
    // Try to reconstruct readable text from camelCase
    return textPart.replace(/([A-Z])/g, ' $1').trim();
  }
  
  // Fallback to the key itself
  return key;
}

async function addTranslationsToAllPages() {
  console.log('🔧 COMPREHENSIVE TRANSLATION INTEGRATION');
  console.log('=====================================');
  
  // Define paths to scan with priorities
  const pathsToScan = [
    { path: 'src/app', priority: 'high', description: 'Page components' },
    { path: 'src/components', priority: 'high', description: 'UI components' },
  ];
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  let skippedFiles = 0;
  let errorFiles = 0;
  const processedFiles: string[] = [];
  
  function scanDirectory(dirPath: string, description: string): void {
    if (!fs.existsSync(dirPath)) {
      console.log(`  ⚠️  Path does not exist: ${dirPath}`);
      return;
    }
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip certain directories
        const skipDirs = ['.next', 'node_modules', '.git', 'dist', 'build', '__tests__', 'test'];
        if (!item.startsWith('.') && !skipDirs.includes(item)) {
          scanDirectory(fullPath, description);
        }
      } else if (item.endsWith('.tsx') || (item.endsWith('.ts') && !item.endsWith('.d.ts'))) {
        // Skip test files and specific patterns
        const skipPatterns = ['.test.', '.spec.', '.d.ts', '.config.', '.types.'];
        if (!skipPatterns.some(pattern => item.includes(pattern))) {
          totalFiles++;
          
          try {
            const result = addTranslationToFile(fullPath);
            if (result) {
              modifiedFiles++;
              processedFiles.push(path.relative(process.cwd(), fullPath));
            } else {
              skippedFiles++;
            }
          } catch (error) {
            console.error(`  ❌ Error processing ${fullPath}:`, error);
            errorFiles++;
          }
        }
      }
    }
  }
  
  console.log('📁 Scanning directories for React components...\n');
  
  for (const { path: scanPath, description } of pathsToScan) {
    const fullScanPath = path.join(process.cwd(), scanPath);
    if (fs.existsSync(fullScanPath)) {
      console.log(`📂 Scanning: ${scanPath} (${description})`);
      scanDirectory(fullScanPath, description);
    } else {
      console.log(`⚠️  Directory not found: ${scanPath}`);
    }
  }
  
  console.log('\n📊 COMPREHENSIVE SUMMARY:');
  console.log('========================');
  console.log(`📁 Total files scanned: ${totalFiles}`);
  console.log(`✅ Files successfully modified: ${modifiedFiles}`);
  console.log(`⏭️  Files skipped (already translated/no content): ${skippedFiles}`);
  console.log(`❌ Files with errors: ${errorFiles}`);
  console.log(`📈 Success rate: ${totalFiles > 0 ? Math.round((modifiedFiles/totalFiles)*100) : 0}%`);
  
  if (processedFiles.length > 0) {
    console.log('\n🔄 MODIFIED FILES:');
    processedFiles.forEach(file => console.log(`  ✓ ${file}`));
  }
  
  if (modifiedFiles > 0) {
    console.log('\n🎯 RECOMMENDED NEXT STEPS:');
    console.log('1. 📝 Review modified files for correctness');
    console.log('2. 🧪 Test components to ensure translations work');
    console.log('3. 🔍 Check for any missed translatable text');
    console.log('4. 🗂️  Add component-specific translations if needed');
    console.log('5. 🚀 Run the translation extraction script');
    console.log('6. 📋 Update translation files with new keys');
  }
  
  console.log('\n✨ Translation integration complete!');
}

// Additional validation function to check current translation coverage
async function validateTranslationCoverage() {
  console.log('\n🔍 VALIDATING CURRENT TRANSLATION COVERAGE');
  console.log('=========================================');
  
  const pathsToCheck = ['src/app', 'src/components'];
  const filesWithoutTranslations: string[] = [];
  const filesWithPartialTranslations: string[] = [];
  
  function checkFile(filePath: string): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const hasUseTranslate = content.includes('useTranslate');
      const hasQuotedStrings = content.match(/"[a-zA-Z\s]{2,}"/g);
      
      if (!hasUseTranslate && hasQuotedStrings && hasQuotedStrings.length > 0) {
        filesWithoutTranslations.push(path.relative(process.cwd(), filePath));
      } else if (hasUseTranslate && hasQuotedStrings && hasQuotedStrings.length > 3) {
        filesWithPartialTranslations.push(path.relative(process.cwd(), filePath));
      }
    } catch (error) {
      // Ignore file read errors
    }
  }
  
  function scanForValidation(dirPath: string): void {
    if (!fs.existsSync(dirPath)) return;
    
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.')) {
        scanForValidation(fullPath);
      } else if (item.endsWith('.tsx') && !item.includes('.test.') && !item.includes('.spec.')) {
        checkFile(fullPath);
      }
    }
  }
  
  pathsToCheck.forEach(pathToCheck => {
    const fullPath = path.join(process.cwd(), pathToCheck);
    if (fs.existsSync(fullPath)) {
      scanForValidation(fullPath);
    }
  });
  
  if (filesWithoutTranslations.length > 0) {
    console.log(`\n📄 Files without translations (${filesWithoutTranslations.length}):`);
    filesWithoutTranslations.forEach(file => console.log(`  • ${file}`));
  }
  
  if (filesWithPartialTranslations.length > 0) {
    console.log(`\n⚠️  Files with potential missed translations (${filesWithPartialTranslations.length}):`);
    filesWithPartialTranslations.forEach(file => console.log(`  • ${file}`));
  }
  
  if (filesWithoutTranslations.length === 0 && filesWithPartialTranslations.length === 0) {
    console.log('\n🎉 All files appear to have proper translation coverage!');
  }
}

// Run both functions
async function main() {
  await addTranslationsToAllPages();
  await validateTranslationCoverage();
}

main();