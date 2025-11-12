// src/lib/client-pdf-translation.ts
// Client-side PDF Translation Service that uses API calls instead of direct database access
// This avoids Prisma client-side issues while providing the same translation functionality

import { translateText, translateBatch, Language } from '@/lib/client-translation';

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
  };
}

// Default PDF labels in English
const DEFAULT_PDF_LABELS = {
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
  quantity: 'Quantity',
  rate: 'Rate',
  days: 'Days',
  total: 'Total',
  subtotal: 'Subtotal',
  discount: 'Discount',
  netAmount: 'Net Amount',
  tax: 'Tax',
  totalAmount: 'Total Amount',
  additionalNotes: 'Additional Notes',
  termsAndConditions: 'Terms and Conditions',
  thankYouMessage: 'Thank you for your business!',
  contactMessage: 'For any questions, please contact us.',
  validUntil: 'Valid Until',
  date: 'Date',
};

// Default terms and conditions
const DEFAULT_TERMS = [
  '1. Payment is due within 30 days of invoice date.',
  '2. Equipment must be returned in the same condition as received.',
  '3. Client is responsible for any damage to equipment during rental period.',
  '4. Cancellations must be made at least 48 hours in advance.',
  '5. Delivery and setup fees are non-refundable.',
  '6. Additional charges may apply for overtime or additional services.',
];

// Compact terms for smaller PDFs
const COMPACT_TERMS = [
  '1. Payment due within 30 days.',
  '2. Equipment returned in same condition.',
  '3. Client responsible for damage during rental.',
  '4. 48-hour cancellation notice required.',
];

class ClientPDFTranslationService {
  private translationCache = new Map<string, Map<string, string>>();

  /**
   * Get all PDF texts translated for the specified language
   */
  async getTranslatedPDFTexts(
    targetLang: Language,
    dynamicContent: PDFTexts['dynamicContent'],
    compact: boolean = false,
    options: PDFTranslationOptions = {}
  ): Promise<PDFTexts> {
    if (targetLang === 'en') {
      return this.buildEnglishPDFTexts(dynamicContent, compact);
    }

    const cacheKey = `${targetLang}_${compact ? 'compact' : 'full'}`;
    if (this.translationCache.has(cacheKey)) {
      const cached = this.translationCache.get(cacheKey)!;
      return this.buildPDFTexts(cached, targetLang, dynamicContent, compact);
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
      console.error('PDF translation error:', error);
      // Fallback to English
      return this.buildEnglishPDFTexts(dynamicContent, compact);
    }
  }

  /**
   * Translate only the dynamic content (service names and fee names)
   */
  async translateDynamicContent(
    dynamicContent: PDFTexts['dynamicContent'],
    targetLang: Language,
    options: PDFTranslationOptions = {}
  ): Promise<PDFTexts['dynamicContent']> {
    if (targetLang === 'en') {
      return dynamicContent;
    }

    try {
      // Only translate service names and fee names, NOT equipment names
      const servicesToTranslate = dynamicContent.serviceNames || [];
      const feesToTranslate = dynamicContent.feeNames || [];
      
      const [translatedServices, translatedFees] = await Promise.all([
        translateBatch(servicesToTranslate, targetLang),
        translateBatch(feesToTranslate, targetLang),
      ]);

      return {
        equipmentNames: dynamicContent.equipmentNames, // Keep original equipment names
        serviceNames: translatedServices,
        feeNames: translatedFees,
      };
    } catch (error) {
      console.error('Dynamic content translation error:', error);
      return dynamicContent; // Fallback to original
    }
  }

  /**
   * Build English PDF texts (no translation needed)
   */
  private buildEnglishPDFTexts(
    dynamicContent: PDFTexts['dynamicContent'],
    compact: boolean
  ): PDFTexts {
    return {
      staticLabels: { ...DEFAULT_PDF_LABELS },
      terms: compact ? [...COMPACT_TERMS] : [...DEFAULT_TERMS],
      dynamicContent: { ...dynamicContent },
    };
  }

  /**
   * Build PDF texts using translation map
   */
  private buildPDFTexts(
    translationMap: Map<string, string>,
    targetLang: Language,
    dynamicContent: PDFTexts['dynamicContent'],
    compact: boolean
  ): PDFTexts {
    // Build translated static labels
    const staticLabels = {} as PDFTexts['staticLabels'];
    Object.entries(DEFAULT_PDF_LABELS).forEach(([key, value]) => {
      staticLabels[key as keyof typeof staticLabels] = 
        translationMap.get(value) || value;
    });

    // Build translated terms
    const termsToUse = compact ? COMPACT_TERMS : DEFAULT_TERMS;
    const terms = termsToUse.map(term => translationMap.get(term) || term);

    return {
      staticLabels,
      terms,
      dynamicContent: { ...dynamicContent },
    };
  }

  /**
   * Clear translation cache
   */
  clearCache() {
    this.translationCache.clear();
  }
}

// Export singleton instance
export const clientPDFTranslationService = new ClientPDFTranslationService();