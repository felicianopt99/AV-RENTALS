/**
 * Smart Translation Rules Engine
 * Determines what should and shouldn't be translated based on content analysis
 */

export interface TranslationRule {
  selector: string;
  action: 'translate' | 'skip' | 'analyze';
  reason: string;
  priority: number;
}

// High Priority Rules - Never Translate (User Data)
const NEVER_TRANSLATE_RULES: TranslationRule[] = [
  // Form inputs with user data
  { selector: 'input[value]:not([value=""])', action: 'skip', reason: 'User input values', priority: 1 },
  { selector: 'textarea:not(:empty)', action: 'skip', reason: 'User text content', priority: 1 },
  { selector: 'select option[selected]:not([data-ui-text])', action: 'skip', reason: 'Selected user data', priority: 1 },
  
  // Personal information
  { selector: '[data-user-content]', action: 'skip', reason: 'User-generated content', priority: 1 },
  { selector: '[data-personal-info]', action: 'skip', reason: 'Personal information', priority: 1 },
  { selector: '.email, [type="email"]', action: 'skip', reason: 'Email addresses', priority: 1 },
  { selector: '.phone, [type="tel"]', action: 'skip', reason: 'Phone numbers', priority: 1 },
  
  // Business data
  { selector: '[data-client-data]', action: 'skip', reason: 'Client data', priority: 1 },
  { selector: '[data-equipment-name]', action: 'skip', reason: 'Equipment names', priority: 1 },
  { selector: '.client-name, .customer-name', action: 'skip', reason: 'Client names', priority: 1 },
  { selector: '.equipment-name, .product-name', action: 'skip', reason: 'Product names', priority: 1 },
  { selector: '.company-name, .business-name', action: 'skip', reason: 'Company names', priority: 1 },
  
  // Identifiers and codes
  { selector: '.serial-number, .sku, .product-code', action: 'skip', reason: 'Product identifiers', priority: 1 },
  { selector: '.id-field, .reference-number', action: 'skip', reason: 'System identifiers', priority: 1 },
  { selector: '.invoice-number, .transaction-id', action: 'skip', reason: 'Transaction identifiers', priority: 1 },
  
  // Financial data
  { selector: '.price-amount, .total-amount, .currency', action: 'skip', reason: 'Financial amounts', priority: 1 },
  { selector: '[data-price], [data-amount]', action: 'skip', reason: 'Price data', priority: 1 },
  
  // Technical content
  { selector: 'code, pre, .code', action: 'skip', reason: 'Code content', priority: 1 },
  { selector: '[data-technical]', action: 'skip', reason: 'Technical content', priority: 1 },
  
  // Explicit exclusions
  { selector: '[data-no-translate], .no-translate', action: 'skip', reason: 'Explicitly excluded', priority: 1 },
];

// Medium Priority Rules - Context Analysis Required
const ANALYZE_RULES: TranslationRule[] = [
  // Table content - headers yes, data maybe not
  { selector: 'td', action: 'analyze', reason: 'Table data needs analysis', priority: 2 },
  { selector: 'tbody tr', action: 'analyze', reason: 'Table rows may contain user data', priority: 2 },
  
  // Dropdown content - UI options yes, user selections no
  { selector: '.dropdown-item, option', action: 'analyze', reason: 'May be user data or UI option', priority: 2 },
  
  // Descriptions and notes - depends on context
  { selector: '.description, .note', action: 'analyze', reason: 'May be user content or UI text', priority: 2 },
  
  // List items - depends on content
  { selector: 'li', action: 'analyze', reason: 'List items need content analysis', priority: 2 },
];

// Low Priority Rules - Usually Translate (UI Elements)
const TRANSLATE_RULES: TranslationRule[] = [
  // Navigation and menus
  { selector: 'nav, .nav, .menu', action: 'translate', reason: 'Navigation elements', priority: 3 },
  { selector: '.breadcrumb', action: 'translate', reason: 'Navigation breadcrumbs', priority: 3 },
  
  // Buttons and controls
  { selector: 'button, .btn', action: 'translate', reason: 'UI buttons', priority: 3 },
  { selector: '[role="button"]', action: 'translate', reason: 'Button elements', priority: 3 },
  
  // Form labels and placeholders
  { selector: 'label', action: 'translate', reason: 'Form labels', priority: 3 },
  { selector: '[placeholder]', action: 'translate', reason: 'Form placeholders', priority: 3 },
  
  // Table headers
  { selector: 'th, thead', action: 'translate', reason: 'Table headers', priority: 3 },
  
  // Status and badges
  { selector: '.badge, .status, .tag', action: 'translate', reason: 'Status indicators', priority: 3 },
  
  // Messages and notifications
  { selector: '.alert, .notification, .message', action: 'translate', reason: 'System messages', priority: 3 },
  { selector: '.error, .warning, .success', action: 'translate', reason: 'Status messages', priority: 3 },
  
  // Headings and titles
  { selector: 'h1, h2, h3, h4, h5, h6', action: 'translate', reason: 'Page headings', priority: 3 },
  { selector: '.title, .heading', action: 'translate', reason: 'UI titles', priority: 3 },
  
  // Help and instructions
  { selector: '.help-text, .hint, .tooltip', action: 'translate', reason: 'Help content', priority: 3 },
  
  // Explicit inclusions
  { selector: '[data-translate="true"], .translate', action: 'translate', reason: 'Explicitly included', priority: 3 },
];

export const ALL_TRANSLATION_RULES = [
  ...NEVER_TRANSLATE_RULES,
  ...ANALYZE_RULES, 
  ...TRANSLATE_RULES
];

/**
 * Content analysis functions for pattern-based detection
 */
export class ContentAnalyzer {
  
  static isPersonalData(text: string): boolean {
    if (!text || text.length === 0) return false;
    
    // Email pattern
    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) return true;
    
    // Phone pattern (various formats)
    if (/[\+]?[1-9]?[\d\s\-\(\)]{7,15}/.test(text) && /\d{3,}/.test(text)) return true;
    
    // Proper names pattern (First Last, First Middle Last)
    if (/^[A-Z][a-z]+(?: [A-Z][a-z]+){1,2}$/.test(text.trim())) return true;
    
    // Address patterns
    if (/^\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln)/i.test(text)) return true;
    
    return false;
  }
  
  static isBusinessData(text: string): boolean {
    if (!text || text.length === 0) return false;
    
    // Company legal suffixes
    if (/(Ltd|LLC|Inc|Corp|Corporation|Company|Co\.|GmbH|S\.A\.|Lda|Ltda)\.?$/i.test(text)) return true;
    
    // Product codes/SKUs (alphanumeric with dashes/underscores)
    if (/^[A-Z0-9\-_]{3,20}$/.test(text.trim()) && /[A-Z]/.test(text) && /\d/.test(text)) return true;
    
    // Currency amounts
    if (/[\$£€¥]\s*\d+(?:[,\.]\d{2,3})*(?:\.\d{2})?/.test(text)) return true;
    if (/\d+(?:[,\.]\d{2,3})*(?:\.\d{2})?\s*[\$£€¥]/.test(text)) return true;
    
    // Brand names with model numbers
    if (/^[A-Z][a-z]+\s+[A-Z0-9\-]+$/.test(text.trim())) return true;
    
    return false;
  }
  
  static isSystemIdentifier(text: string): boolean {
    if (!text || text.length === 0) return false;
    
    // Serial numbers
    if (/^[A-Z]{2,}\d{4,}$/.test(text.trim())) return true;
    if (/^SN[\d\-A-Z]{4,}$/i.test(text.trim())) return true;
    
    // UUIDs
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text.trim())) return true;
    
    // Invoice/Reference numbers
    if (/^(INV|REF|ORD|QUO)[\-\#]?\d+$/i.test(text.trim())) return true;
    
    // ID numbers
    if (/^(ID|NO|NUM)[\:\-\s]?\d+$/i.test(text.trim())) return true;
    
    return false;
  }
  
  static isUIText(text: string, element?: Element): boolean {
    if (!text || text.length === 0) return false;
    
    // Common UI words
    const uiWords = [
      'save', 'cancel', 'delete', 'edit', 'add', 'create', 'update', 'submit',
      'login', 'logout', 'register', 'search', 'filter', 'sort', 'export',
      'import', 'download', 'upload', 'print', 'refresh', 'back', 'next',
      'previous', 'continue', 'finish', 'close', 'open', 'view', 'details',
      'active', 'inactive', 'pending', 'completed', 'cancelled', 'draft',
      'approved', 'rejected', 'available', 'unavailable', 'loading', 'error'
    ];
    
    const lowerText = text.toLowerCase().trim();
    
    // Exact match for common UI words
    if (uiWords.includes(lowerText)) return true;
    
    // Short instructional phrases
    if (text.length < 50 && /^[A-Z][a-z\s]+[.!?]?$/.test(text) && !this.isPersonalData(text)) {
      return true;
    }
    
    // Form validation messages
    if (/^(Please|Enter|Select|Choose|This field|Invalid|Required)/.test(text)) return true;
    
    return false;
  }
  
  static isDateOrTime(text: string): boolean {
    if (!text || text.length === 0) return false;
    
    // ISO date formats
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) return true;
    
    // Common date formats
    if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(text)) return true;
    
    // Time formats
    if (/^\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AaPp][Mm])?$/.test(text)) return true;
    
    return false;
  }
}

/**
 * Main function to determine if text should be translated
 */
export function shouldTranslateText(text: string, element: Element): boolean {
  if (!text || text.trim().length === 0) return false;
  if (text.length > 500) return false; // Skip very long texts
  
  // 1. Check explicit rules by element selectors
  const matchedRule = getMatchingRule(element);
  if (matchedRule) {
    switch (matchedRule.action) {
      case 'skip':
        return false;
      case 'translate':
        return true;
      case 'analyze':
        break; // Continue to content analysis
    }
  }
  
  // 2. Pattern-based exclusions (high confidence)
  if (ContentAnalyzer.isPersonalData(text)) return false;
  if (ContentAnalyzer.isBusinessData(text)) return false;
  if (ContentAnalyzer.isSystemIdentifier(text)) return false;
  if (ContentAnalyzer.isDateOrTime(text)) return false;
  
  // 3. Context-based decisions
  if (isInUserContentArea(element)) return false;
  if (isFormInputValue(element)) return false;
  if (isTableDataCell(element)) return isTableHeaderLikeContent(text);
  
  // 4. UI text detection (positive indicators)
  if (ContentAnalyzer.isUIText(text, element)) return true;
  
  // 5. Default: be conservative - don't translate if unsure
  return false;
}

/**
 * Helper functions for context analysis
 */
function getMatchingRule(element: Element): TranslationRule | null {
  // Sort rules by priority (1 = highest)
  const sortedRules = ALL_TRANSLATION_RULES.sort((a, b) => a.priority - b.priority);
  
  for (const rule of sortedRules) {
    try {
      if (element.matches(rule.selector)) {
        return rule;
      }
      
      // Check if element is inside a matching parent
      if (element.closest(rule.selector)) {
        return rule;
      }
    } catch (e) {
      // Invalid selector, skip
      continue;
    }
  }
  
  return null;
}

function isInUserContentArea(element: Element): boolean {
  // Check if element is inside areas marked as user content
  const userContentSelectors = [
    '[data-user-content]',
    '.user-content', 
    '.client-info',
    '.equipment-details',
    '.event-info',
    '.user-data'
  ];
  
  return userContentSelectors.some(selector => {
    try {
      return element.closest(selector) !== null;
    } catch {
      return false;
    }
  });
}

function isFormInputValue(element: Element): boolean {
  // Check if this is a form input value or related to one
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    return true;
  }
  
  // Check if element displays form input value
  const parent = element.parentElement;
  if (parent) {
    const input = parent.querySelector('input, textarea, select');
    if (input && input.getAttribute('value') === element.textContent?.trim()) {
      return true;
    }
  }
  
  return false;
}

function isTableDataCell(element: Element): boolean {
  return element.tagName === 'TD' || element.closest('td') !== null;
}

function isTableHeaderLikeContent(text: string): boolean {
  // Short text that looks like a column header
  if (text.length < 30 && /^[A-Z][a-z\s]*$/.test(text.trim())) {
    return true;
  }
  
  // Common table headers
  const headerWords = [
    'name', 'date', 'status', 'type', 'category', 'price', 'quantity', 
    'total', 'actions', 'description', 'created', 'updated', 'id', 'number'
  ];
  
  return headerWords.some(word => text.toLowerCase().includes(word));
}

/**
 * Get translation rules summary for debugging
 */
export function getTranslationRulesSummary() {
  return {
    neverTranslate: NEVER_TRANSLATE_RULES.length,
    analyze: ANALYZE_RULES.length,
    alwaysTranslate: TRANSLATE_RULES.length,
    total: ALL_TRANSLATION_RULES.length
  };
}