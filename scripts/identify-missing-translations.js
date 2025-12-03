import fs from 'fs';
import { PrismaClient } from '@prisma/client';

async function identifyMissingTranslations() {
  try {
    // Load extracted texts
    const extractedTexts = JSON.parse(fs.readFileSync('./extracted-texts.json', 'utf8'));
    
    // Initialize Prisma client
    const prisma = new PrismaClient();
    
    // Get existing translations for Portuguese
    const existingTranslations = await prisma.Translation.findMany({
      where: { targetLang: 'pt' },
      select: { sourceText: true }
    });
    
    const existingTexts = new Set(existingTranslations.map(t => t.sourceText));
    
    // Filter out texts that are already translated
    const missingTexts = extractedTexts.texts.filter(text => !existingTexts.has(text));
    
    // Filter out very short texts or those that look like code/placeholders
    const filteredMissingTexts = missingTexts.filter(text => {
      // Skip if text is too short or doesn't contain letters
      if (text.length < 2 || !/[a-zA-Z]/.test(text)) return false;
      
      // Skip if looks like a template literal or code
      if (text.includes('${') || text.includes('{') || text.includes('}')) return false;
      
      // Skip if looks like a URL or path
      if (text.includes('http') || text.includes('www.') || text.includes('/')) return false;
      
      // Skip if it's just a single word in camelCase or PascalCase
      if (/^[a-z]+[A-Z][a-z]+$/.test(text) || /^[A-Z][a-z]+(?:[A-Z][a-z]+)*$/.test(text)) return false;
      
      // Skip if it's all uppercase (likely an acronym or constant)
      if (text === text.toUpperCase()) return false;
      
      return true;
    });
    
    // Sort by length (shorter first, as they're likely more important UI elements)
    filteredMissingTexts.sort((a, b) => a.length - b.length);
    
    // Group by first letter for better organization
    const groupedByFirstLetter = filteredMissingTexts.reduce((acc, text) => {
      const firstLetter = text[0].toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(text);
      return acc;
    }, {});
    
    // Save missing translations to a file
    const result = {
      generatedAt: new Date().toISOString(),
      totalMissing: filteredMissingTexts.length,
      missingByLetter: groupedByFirstLetter,
      allMissing: filteredMissingTexts
    };
    
    fs.writeFileSync('./missing-translations.json', JSON.stringify(result, null, 2));
    
    console.log(`Found ${filteredMissingTexts.length} missing translations out of ${extractedTexts.texts.length} total texts.`);
    console.log('Missing translations have been saved to missing-translations.json');
    
    // Print a sample of missing translations
    console.log('\nSample of missing translations:');
    const sample = filteredMissingTexts.slice(0, 20);
    sample.forEach((text, index) => {
      console.log(`${index + 1}. ${text}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error identifying missing translations:', error);
    process.exit(1);
  }
}

identifyMissingTranslations().catch(console.error);
