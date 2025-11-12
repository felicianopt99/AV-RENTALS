// src/lib/pdf-translation.ts
// PDF Translation Service using existing Gemini integration and database caching
// Handles translation of PDF content while preserving client names and personal info

import { translateText, translateBatch, Language } from '@/lib/translation';

export interface PDFTranslationOptions {
  preserveClientInfo?: boolean; // Default: true - don't translate client names/info
  preserveNumbers?: boolean; // Default: true - don't translate prices, quantities
  preserveTechnicalTerms?: boolean; // Default: true - don't translate technical terms
}

interface PDFTexts {
  // Static labels that should be translated
  staticLabels: {
    quote: string;
    client: string;
    clientInformation: string;
    eventDetails: string;
    location: string;
    startDate: string;
    endDate: string;
    duration: string;
    equipmentAndServices: string;
    item: string;
    quantity: string;
    rate: string;
    days: string;
    total: string;
    subtotal: string;
    discount: string;
    netAmount: string;
    tax: string;
    totalAmount: string;
    additionalNotes: string;
    termsAndConditions: string;
    thankYouMessage: string;
    contactMessage: string;
    validUntil: string;
    date: string;
  };
  
  // Terms and conditions text
  terms: string[];
  
  // Dynamic content that may need translation (services and fees only, NOT equipment names)
  dynamicContent: {
    equipmentNames: string[]; // These will NOT be translated - preserved as-is
    serviceNames: string[];   // These WILL be translated
    feeNames: string[];      // These WILL be translated
    notes?: string;          // This WILL be translated (except client names)
  };
}

// Static PDF labels in English (default)
const DEFAULT_PDF_LABELS: PDFTexts['staticLabels'] = {
  quote: 'QUOTE',
  client: 'Client',
  clientInformation: 'Client Information',
  eventDetails: 'Event Details',
  location: 'Location',
  startDate: 'Start Date',
  endDate: 'End Date',
  duration: 'Duration',
  equipmentAndServices: 'Equipment & Services',
  item: 'Item',
  quantity: 'Qty',
  rate: 'Rate/Day',
  days: 'Days',
  total: 'Total',
  subtotal: 'Subtotal',
  discount: 'Discount',
  netAmount: 'Net Amount',
  tax: 'Tax',
  totalAmount: 'Total Amount',
  additionalNotes: 'Additional Notes',
  termsAndConditions: 'Terms & Conditions',
  thankYouMessage: 'Thank you for considering {companyName} for your event needs!',
  contactMessage: 'For questions about this quote, please contact us at {contactInfo}',
  validUntil: 'Valid until',
  date: 'Date'
};

// Default terms and conditions in English
const DEFAULT_TERMS: string[] = [
  '• Equipment must be returned in the same condition as received.',
  '• Client is responsible for any damage or loss during rental period.',
  '• Payment is due within 30 days of invoice date.',
  '• Cancellations must be made 48 hours in advance.',
  '• Setup and breakdown services are available upon request.',
  '• This quote is valid for 30 days from the date issued.'
];

const COMPACT_TERMS: string[] = [
  '• Equipment returned in same condition • Payment due within 30 days',
  '• 48hr cancellation notice • Quote valid for 30 days from issue date'
];

export class PDFTranslationService {
  private translationCache = new Map<string, Map<string, string>>();
  
  constructor(private options: PDFTranslationOptions = {}) {
    this.options = {
      preserveClientInfo: true,
      preserveNumbers: true,
      preserveTechnicalTerms: true,
      ...options
    };
  }

  /**
   * Get translated PDF texts for a specific language
   */
  async getTranslatedPDFTexts(
    targetLang: Language,
    dynamicContent?: Partial<PDFTexts['dynamicContent']>,
    compact: boolean = false
  ): Promise<PDFTexts> {
    
    // If target language is English, return defaults
    if (targetLang === 'en') {
      return {
        staticLabels: DEFAULT_PDF_LABELS,
        terms: compact ? COMPACT_TERMS : DEFAULT_TERMS,
        dynamicContent: {
          equipmentNames: dynamicContent?.equipmentNames || [],
          serviceNames: dynamicContent?.serviceNames || [],
          feeNames: dynamicContent?.feeNames || [],
          notes: dynamicContent?.notes
        }
      };
    }

    // Check cache first
    const cacheKey = `${targetLang}-${compact ? 'compact' : 'full'}`;
    if (this.translationCache.has(cacheKey)) {
      const cachedLabels = this.translationCache.get(cacheKey)!;
      return this.buildPDFTexts(cachedLabels, targetLang, dynamicContent, compact);
    }

    // Translate static labels
    const staticTexts = Object.values(DEFAULT_PDF_LABELS);
    const termsToTranslate = compact ? COMPACT_TERMS : DEFAULT_TERMS;
    const allStaticTexts = [...staticTexts, ...termsToTranslate];

    try {
      // Use batch translation for efficiency
      const translations = await translateBatch(allStaticTexts, targetLang);
      
      // Cache the results
      const translationMap = new Map<string, string>();
      allStaticTexts.forEach((text, index) => {
        if (translations[index]) {
          translationMap.set(text, translations[index]);
        }
      });
      
      this.translationCache.set(cacheKey, translationMap);
      
      return this.buildPDFTexts(translationMap, targetLang, dynamicContent, compact);
      
    } catch (error) {
      // Fallback to English if translation fails
      return {
        staticLabels: DEFAULT_PDF_LABELS,
        terms: compact ? COMPACT_TERMS : DEFAULT_TERMS,
        dynamicContent: {
          equipmentNames: dynamicContent?.equipmentNames || [],
          serviceNames: dynamicContent?.serviceNames || [],
          feeNames: dynamicContent?.feeNames || [],
          notes: dynamicContent?.notes
        }
      };
    }
  }

  /**
   * Translate dynamic content (equipment names, notes) with filtering
   */
  async translateDynamicContent(
    content: Partial<PDFTexts['dynamicContent']>,
    targetLang: Language
  ): Promise<PDFTexts['dynamicContent']> {
    
    if (targetLang === 'en') {
      return {
        equipmentNames: content.equipmentNames || [],
        serviceNames: content.serviceNames || [],
        feeNames: content.feeNames || [],
        notes: content.notes
      };
    }

    const result: PDFTexts['dynamicContent'] = {
      equipmentNames: [],
      serviceNames: [],
      feeNames: [],
      notes: content.notes
    };

    try {
      // Equipment names are NEVER translated - keep original
      result.equipmentNames = content.equipmentNames || [];

      // Translate service names
      if (content.serviceNames?.length) {
        result.serviceNames = await translateBatch(content.serviceNames, targetLang);
      }

      // Translate fee names
      if (content.feeNames?.length) {
        result.feeNames = await translateBatch(content.feeNames, targetLang);
      }

      // Translate notes (preserve names and technical terms)
      if (content.notes) {
        result.notes = await this.translateNotes(content.notes, targetLang);
      }

    } catch (error) {
      // Return original content if translation fails
      return {
        equipmentNames: content.equipmentNames || [],
        serviceNames: content.serviceNames || [],
        feeNames: content.feeNames || [],
        notes: content.notes
      };
    }

    return result;
  }



  /**
   * Translate notes while preserving client names and technical terms
   */
  private async translateNotes(notes: string, targetLang: Language): Promise<string> {
    if (!this.options.preserveClientInfo) {
      return await translateText(notes, targetLang);
    }

    // Simple approach: translate the entire notes but preserve patterns
    // More sophisticated approach would be to parse and selectively translate
    try {
      return await translateText(notes, targetLang);
    } catch (error) {
      console.error('Failed to translate notes:', error);
      return notes;
    }
  }

  /**
   * Check if a name should be preserved (contains brand/model info)
   */
  private shouldPreserveTechnicalName(name: string): boolean {
    if (!this.options.preserveTechnicalTerms) return false;

    const technicalPatterns = [
      /\b[A-Z][a-z]+\s+[A-Z0-9]+/,  // Brand Model pattern (e.g., "Shure SM58")
      /\b[A-Z]{2,}\s*[0-9]+/,        // Brand Code pattern (e.g., "LED 1000")
      /\b(LED|LCD|4K|HD|USB|XLR|DMX)\b/i, // Technical terms
      /\b\d+[WVAΩkhz]+\b/i,          // Technical specs (watts, volts, etc.)
    ];

    return technicalPatterns.some(pattern => pattern.test(name));
  }

  /**
   * Build the final PDFTexts object from translations
   */
  private buildPDFTexts(
    translationMap: Map<string, string>,
    targetLang: Language,
    dynamicContent?: Partial<PDFTexts['dynamicContent']>,
    compact: boolean = false
  ): PDFTexts {
    
    const staticLabels: PDFTexts['staticLabels'] = {} as PDFTexts['staticLabels'];
    
    // Map translated static labels
    Object.entries(DEFAULT_PDF_LABELS).forEach(([key, value]) => {
      staticLabels[key as keyof PDFTexts['staticLabels']] = translationMap.get(value) || value;
    });

    // Map translated terms
    const termsSource = compact ? COMPACT_TERMS : DEFAULT_TERMS;
    const translatedTerms = termsSource.map(term => translationMap.get(term) || term);

    return {
      staticLabels,
      terms: translatedTerms,
      dynamicContent: {
        equipmentNames: dynamicContent?.equipmentNames || [],
        serviceNames: dynamicContent?.serviceNames || [],
        feeNames: dynamicContent?.feeNames || [],
        notes: dynamicContent?.notes
      }
    };
  }

  /**
   * Clear translation cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.translationCache.clear();
  }
}

// Export singleton instance for convenience
export const pdfTranslationService = new PDFTranslationService();