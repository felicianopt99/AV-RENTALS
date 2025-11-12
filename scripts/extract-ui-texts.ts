#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * UI Text Extraction Script
 * Scans all source files to extract translatable text strings
 */

interface ExtractedText {
  text: string;
  file: string;
  line: number;
  context: string;
  type: 'component' | 'page' | 'hook' | 'lib' | 'api';
}

class UITextExtractor {
  private extractedTexts = new Set<string>();
  private textDetails: ExtractedText[] = [];

  // Patterns to match translatable text
  private patterns = [
    // useTranslate hooks
    /useTranslate\(['"`]([^'"`]+)['"`]\)/g,
    // t() function calls
    /\bt\(['"`]([^'"`]+)['"`]\)/g,
    // Direct text in JSX (between > and <)
    />([^<>{}\n]+)</g,
    // Placeholder attributes
    /placeholder=['"`]([^'"`]+)['"`]/g,
    // Title attributes  
    /title=['"`]([^'"`]+)['"`]/g,
    // Alt attributes
    /alt=['"`]([^'"`]+)['"`]/g,
    // Label text
    /<label[^>]*>([^<]+)</g,
    // Button text
    /<[Bb]utton[^>]*>([^<]+)</g,
    // Toast messages
    /toast\(\s*{[^}]*title:\s*['"`]([^'"`]+)['"`]/g,
    /toast\(\s*{[^}]*description:\s*['"`]([^'"`]+)['"`]/g,
    // Error messages
    /throw new Error\(['"`]([^'"`]+)['"`]\)/g,
    // Console messages
    /console\.(log|error|warn)\(['"`]([^'"`]+)['"`]/g,
  ];

  // Text that should NOT be translated
  private skipPatterns = [
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Email addresses
    /^\+?[\d\s\-()]+$/, // Phone numbers
    /^[A-Z]{2,10}-\d+$/, // Product codes, SKUs
    /^https?:\/\//, // URLs
    /^\/[a-zA-Z0-9\/\-_]*$/, // Paths
    /^\d+(\.\d+)?\s*(px|em|rem|%|vh|vw)$/, // CSS values
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}/, // Dates
    /^\$\d+(\.\d{2})?$/, // Prices
    /^#[0-9A-Fa-f]{3,6}$/, // Hex colors
    /^[A-Z_]+$/, // Constants (all caps)
    /^[a-z][a-zA-Z0-9]*$/, // Variable names (camelCase)
    /^[a-z-]+$/, // CSS classes (kebab-case)
    /^\d+$/, // Pure numbers
    /^[.,;:!?()[\]{}'"´`~@#$%^&*+=|\\<>/\s]*$/, // Only punctuation/symbols
  ];

  // Common UI phrases to ensure we have them
  private commonPhrases = [
    // Actions
    'Save', 'Cancel', 'Delete', 'Edit', 'Add', 'Remove', 'Update', 'Create',
    'Submit', 'Reset', 'Clear', 'Search', 'Filter', 'Sort', 'Export', 'Import',
    'Upload', 'Download', 'Print', 'Share', 'Copy', 'Paste', 'Cut',
    'Undo', 'Redo', 'Refresh', 'Reload', 'Back', 'Next', 'Previous',
    'Close', 'Open', 'Show', 'Hide', 'Expand', 'Collapse',
    
    // Status
    'Available', 'Unavailable', 'Active', 'Inactive', 'Pending', 'Completed',
    'In Progress', 'Cancelled', 'Expired', 'Draft', 'Published', 'Archived',
    'Approved', 'Rejected', 'Processing', 'Failed', 'Success',
    
    // Common Labels
    'Name', 'Email', 'Phone', 'Address', 'City', 'Country', 'Date', 'Time',
    'Description', 'Notes', 'Comments', 'Status', 'Type', 'Category',
    'Price', 'Quantity', 'Total', 'Subtotal', 'Tax', 'Discount',
    'Start Date', 'End Date', 'Due Date', 'Created', 'Modified', 'Updated',
    
    // Messages
    'Please wait...', 'Loading...', 'Saving...', 'Deleting...', 'Uploading...',
    'No results found', 'No data available', 'Something went wrong',
    'Are you sure?', 'This action cannot be undone',
    'Successfully saved', 'Successfully deleted', 'Successfully updated',
    'Error occurred', 'Invalid input', 'Required field', 'Optional field',
    
    // Navigation
    'Dashboard', 'Home', 'Profile', 'Settings', 'Help', 'About', 'Contact',
    'Login', 'Logout', 'Sign In', 'Sign Up', 'Register', 'Forgot Password',
    
    // Equipment/Rental specific
    'Equipment', 'Rental', 'Client', 'Event', 'Quote', 'Invoice', 'Payment',
    'Maintenance', 'Inventory', 'Category', 'Subcategory', 'Brand', 'Model',
    'Serial Number', 'Condition', 'Location', 'Warranty', 'Manual',
    
    // Time/Date
    'Today', 'Yesterday', 'Tomorrow', 'This Week', 'Next Week', 'Last Week',
    'This Month', 'Next Month', 'Last Month', 'This Year', 'Next Year', 'Last Year',
    'Morning', 'Afternoon', 'Evening', 'Night',
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
    
    // Form validation
    'This field is required', 'Invalid email format', 'Password too short',
    'Passwords do not match', 'Invalid phone number', 'Invalid date',
    'File too large', 'Invalid file format', 'Upload failed',
    
    // Permissions/Access
    'Access denied', 'Permission required', 'Not authorized', 'Login required',
    'Admin only', 'Manager only', 'Owner only', 'Public', 'Private',
  ];

  async extractFromDirectory(dirPath: string): Promise<void> {
    console.log(`🔍 Scanning directory: ${dirPath}`);
    
    // Find all TypeScript and JavaScript files
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: dirPath,
      ignore: [
        'node_modules/**',
        '.next/**',
        'build/**',
        'dist/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/*.d.ts',
      ],
    });

    console.log(`📁 Found ${files.length} files to scan`);

    for (const file of files) {
      await this.extractFromFile(path.join(dirPath, file));
    }

    // Add common phrases
    this.addCommonPhrases();

    console.log(`✅ Extraction complete: ${this.extractedTexts.size} unique texts found`);
  }

  private async extractFromFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const fileType = this.getFileType(filePath);

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        
        for (const pattern of this.patterns) {
          pattern.lastIndex = 0; // Reset regex state
          let match;
          
          while ((match = pattern.exec(line)) !== null) {
            const text = match[1] || match[2]; // Get captured group
            if (text && this.isValidText(text)) {
              this.extractedTexts.add(text.trim());
              this.textDetails.push({
                text: text.trim(),
                file: path.relative(process.cwd(), filePath),
                line: lineIndex + 1,
                context: line.trim(),
                type: fileType,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error processing file ${filePath}:`, error);
    }
  }

  private getFileType(filePath: string): ExtractedText['type'] {
    if (filePath.includes('/pages/') || filePath.includes('/app/')) return 'page';
    if (filePath.includes('/components/')) return 'component';
    if (filePath.includes('/hooks/')) return 'hook';
    if (filePath.includes('/lib/')) return 'lib';
    if (filePath.includes('/api/')) return 'api';
    return 'component';
  }

  private isValidText(text: string): boolean {
    const cleanText = text.trim();
    
    // Skip empty or too short
    if (!cleanText || cleanText.length < 2) return false;
    
    // Skip if matches skip patterns
    for (const pattern of this.skipPatterns) {
      if (pattern.test(cleanText)) return false;
    }
    
    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(cleanText)) return false;
    
    // Skip if mostly symbols
    const letterCount = (cleanText.match(/[a-zA-Z]/g) || []).length;
    if (letterCount < cleanText.length * 0.5) return false;
    
    return true;
  }

  private addCommonPhrases(): void {
    for (const phrase of this.commonPhrases) {
      this.extractedTexts.add(phrase);
      this.textDetails.push({
        text: phrase,
        file: 'common-phrases',
        line: 0,
        context: 'Common UI phrase',
        type: 'lib',
      });
    }
  }

  getExtractedTexts(): string[] {
    return Array.from(this.extractedTexts).sort();
  }

  getTextDetails(): ExtractedText[] {
    return this.textDetails;
  }

  saveToFile(outputPath: string): void {
    const data = {
      extractedAt: new Date().toISOString(),
      totalTexts: this.extractedTexts.size,
      texts: this.getExtractedTexts(),
      details: this.textDetails,
      summary: {
        byType: this.groupByType(),
        byFile: this.groupByFile(),
      },
    };

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`💾 Results saved to: ${outputPath}`);
  }

  private groupByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const detail of this.textDetails) {
      counts[detail.type] = (counts[detail.type] || 0) + 1;
    }
    return counts;
  }

  private groupByFile(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const detail of this.textDetails) {
      counts[detail.file] = (counts[detail.file] || 0) + 1;
    }
    return counts;
  }
}

// Main execution
async function main() {
  const extractor = new UITextExtractor();
  const srcPath = path.join(process.cwd(), 'src');
  const outputPath = path.join(process.cwd(), 'extracted-ui-texts.json');

  console.log('🚀 Starting UI text extraction...');
  console.log(`📂 Source directory: ${srcPath}`);
  console.log(`📄 Output file: ${outputPath}`);

  await extractor.extractFromDirectory(srcPath);
  
  const texts = extractor.getExtractedTexts();
  console.log('\n📋 Sample extracted texts:');
  texts.slice(0, 20).forEach((text, i) => {
    console.log(`  ${i + 1}. "${text}"`);
  });
  
  if (texts.length > 20) {
    console.log(`  ... and ${texts.length - 20} more`);
  }

  extractor.saveToFile(outputPath);
  
  console.log('\n✅ Text extraction completed successfully!');
  console.log(`📊 Total unique texts: ${texts.length}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { UITextExtractor };