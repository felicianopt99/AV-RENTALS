import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

async function extractUITexts() {
  const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
  
  const srcPath = path.join(process.cwd(), 'src');
  const outputFile = path.join(process.cwd(), 'extracted-texts.json');
  
  // Patterns to match translatable text
  const patterns = [
    // Matches: useTranslate('text'), useTranslate("text"), useTranslate(`text`)
    /useTranslate\(['"`]([^'"`]+)['"`]\)/g,
    
    // Matches: t('text'), t("text"), t(`text`)
    /\bt\(['"`]([^'"`]+)['"`]\)/g,
    
    // Matches: <T text="text" />, <T text='text' />, <T text={`text`} />
    /<T[^>]*\btext=['"`]([^'"`]+)['"`][^>]*\/>/g,
    
    // Matches: placeholder="text", placeholder='text', placeholder={`text`}
    /placeholder=['"`]([^'"`]+)['"`]/g,
    
    // Matches: title="text", title='text', title={`text`}
    /title=['"`]([^'"`]+)['"`]/g,
    
    // Matches: alt="text", alt='text', alt={`text`}
    /alt=['"`]([^'"`]+)['"`]/g,
    
    // Matches: <label>text</label>
    /<label[^>]*>([^<]+)<\/label>/g,
    
    // Matches: <button>text</button>
    /<button[^>]*>([^<]+)<\/button>/gi,
    
    // Matches: toast({ title: "text" }), toast({ title: 'text' }), toast({ title: `text` })
    /toast\(\s*\{[^}]*title:\s*['"`]([^'"`]+)['"`]/g,
    
    // Matches: toast({ description: "text" }), etc.
    /toast\(\s*\{[^}]*description:\s*['"`]([^'"`]+)['"`]/g,
    
    // Matches: <p>text</p>, <div>text</div>, etc.
    /<[a-zA-Z][a-zA-Z0-9]*[^>]*>([^<]+)<\/[a-zA-Z][a-zA-Z0-9]*>/g,
    
    // Matches: <span>text</span>
    /<span[^>]*>([^<]+)<\/span>/g
  ];
  
  // Patterns to skip (common false positives)
  const skipPatterns = [
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Email
    /^\+?[\d\s\-()]+$/, // Phone numbers
    /^[A-Z]{2,10}-\d+$/, // IDs like ABC-123
    /^https?:\/\//, // URLs
    /^\/[a-zA-Z0-9\/_-]*$/, // Paths
    /^\d+(\.\d+)?\s*(px|em|rem|%|vh|vw)$/, // CSS values
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}/, // Dates
    /^#[0-9A-Fa-f]{3,6}$/, // Hex colors
    /^[A-Z_]+$/, // UPPER_CASE
    /^[a-z][a-zA-Z0-9]*$/, // camelCase
    /^[a-z-]+$/, // kebab-case
    /^\d+$/, // Numbers
    /^[.,;:!?()[\]{}'"´`~@#$%^&*+=|\\<>\/\s]*$/, // Punctuation
    /^[\s\n]*$/ // Empty or whitespace only
  ];
  
  const texts = new Set();
  
  // Get all source files
  const files = await glob('**/*.{ts,tsx,js,jsx}', {
    cwd: srcPath,
    ignore: [
      '**/node_modules/**',
      '**/.next/**',
      '**/build/**',
      '**/dist/**',
      '**/*.d.ts',
      '**/*.test.*',
      '**/*.spec.*',
      '**/__tests__/**',
      '**/__mocks__/**'
    ]
  });
  
  console.log(`Found ${files.length} files to scan...`);
  
  // Process each file
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(srcPath, file), 'utf8');
      
      // Apply each pattern
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          // The first capture group contains the text
          const text = match[1] || match[0];
          
          // Clean up the text
          const cleanedText = text
            .replace(/^['"`]|['"`]$/g, '') // Remove surrounding quotes
            .replace(/\n/g, ' ') // Replace newlines with spaces
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          // Skip if text is too short or matches skip patterns
          if (
            cleanedText.length < 2 || 
            !/[a-zA-Z]/.test(cleanedText) ||
            skipPatterns.some(p => p.test(cleanedText))
          ) {
            continue;
          }
          
          // Add to set (automatically deduplicates)
          texts.add(cleanedText);
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
  
  // Convert set to array and sort
  const sortedTexts = Array.from(texts).sort();
  
  // Save to file
  const result = {
    extractedAt: new Date().toISOString(),
    totalTexts: sortedTexts.length,
    texts: sortedTexts
  };
  
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  console.log(`Extracted ${sortedTexts.length} unique texts to ${outputFile}`);
  
  return result;
}

// Run the extraction
extractUITexts().catch(console.error).then(() => {
  console.log('Extraction complete!');
});
