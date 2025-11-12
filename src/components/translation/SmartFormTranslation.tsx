"use client";

import React from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import { shouldTranslateText } from '@/lib/translationRules';

/**
 * Form Translation Component
 * Intelligently translates form elements while protecting user input data
 */
export function FormTranslator({ children, formType }: { 
  children: React.ReactNode;
  formType?: 'client' | 'equipment' | 'event' | 'rental' | 'maintenance' | 'general';
}) {
  const { t, language } = useTranslation();
  const formRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (language === 'en' || !formRef.current) return;

    const translateFormElements = () => {
      const form = formRef.current!;
      
      // Translate labels
      const labels = form.querySelectorAll('label');
      labels.forEach(async (label) => {
        const text = label.textContent?.trim();
        if (text && shouldTranslateText(text, label)) {
          const translated = await t(text);
          if (translated !== text) {
            label.textContent = translated;
          }
        }
      });

      // Translate placeholder text
      const inputs = form.querySelectorAll('input[placeholder], textarea[placeholder]');
      inputs.forEach(async (input) => {
        const placeholder = input.getAttribute('placeholder')?.trim();
        if (placeholder && shouldTranslateText(placeholder, input)) {
          const translated = await t(placeholder);
          if (translated !== placeholder) {
            input.setAttribute('placeholder', translated);
          }
        }
      });

      // Translate button text (but not user data buttons)
      const buttons = form.querySelectorAll('button');
      buttons.forEach(async (button) => {
        const text = button.textContent?.trim();
        if (text && shouldTranslateText(text, button)) {
          // Common form buttons that should be translated
          const commonButtons = ['Save', 'Cancel', 'Submit', 'Add', 'Edit', 'Delete', 'Update', 'Create', 'Back', 'Next', 'Previous'];
          if (commonButtons.some(btn => text.toLowerCase().includes(btn.toLowerCase()))) {
            const translated = await t(text);
            if (translated !== text) {
              button.textContent = translated;
            }
          }
        }
      });

      // Translate select option labels (but not values)
      const selects = form.querySelectorAll('select option');
      selects.forEach(async (option) => {
        const text = option.textContent?.trim();
        if (text && shouldTranslateText(text, option)) {
          // Don't translate if it looks like user data
          if (!/^[A-Z0-9\-_]+$/i.test(text)) { // Skip IDs/codes
            const translated = await t(text);
            if (translated !== text) {
              option.textContent = translated;
            }
          }
        }
      });

      // Translate help text and descriptions
      const helpTexts = form.querySelectorAll('.help-text, .description, .form-help, [role="description"]');
      helpTexts.forEach(async (helpText) => {
        const text = helpText.textContent?.trim();
        if (text && shouldTranslateText(text, helpText)) {
          const translated = await t(text);
          if (translated !== text) {
            helpText.textContent = translated;
          }
        }
      });

      // Translate fieldset legends
      const legends = form.querySelectorAll('fieldset legend');
      legends.forEach(async (legend) => {
        const text = legend.textContent?.trim();
        if (text && shouldTranslateText(text, legend)) {
          const translated = await t(text);
          if (translated !== text) {
            legend.textContent = translated;
          }
        }
      });
    };

    // Initial translation
    setTimeout(translateFormElements, 100);

    // Watch for dynamic form changes
    const observer = new MutationObserver(() => {
      setTimeout(translateFormElements, 200);
    });

    observer.observe(formRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['placeholder']
    });

    return () => observer.disconnect();
  }, [t, language, formType]);

  return (
    <div ref={formRef} className="form-translator">
      {children}
    </div>
  );
}

/**
 * Table Translation Component
 * Intelligently translates table headers while protecting table data
 */
export function TableTranslator({ children, tableType }: { 
  children: React.ReactNode;
  tableType?: 'client' | 'equipment' | 'event' | 'rental' | 'inventory' | 'general';
}) {
  const { t, language } = useTranslation();
  const tableRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (language === 'en' || !tableRef.current) return;

    const translateTableElements = () => {
      const container = tableRef.current!;
      
      // Translate table headers (th elements)
      const headers = container.querySelectorAll('th');
      headers.forEach(async (header) => {
        const text = header.textContent?.trim();
        if (text && shouldTranslateText(text, header)) {
          const translated = await t(text);
          if (translated !== text) {
            header.textContent = translated;
          }
        }
      });

      // Translate table captions
      const captions = container.querySelectorAll('caption');
      captions.forEach(async (caption) => {
        const text = caption.textContent?.trim();
        if (text && shouldTranslateText(text, caption)) {
          const translated = await t(text);
          if (translated !== text) {
            caption.textContent = translated;
          }
        }
      });

      // Translate action buttons in tables (Edit, Delete, View, etc.)
      const actionButtons = container.querySelectorAll('td button, td a[role="button"]');
      actionButtons.forEach(async (button) => {
        const text = button.textContent?.trim();
        if (text && shouldTranslateText(text, button)) {
          // Common action buttons that should be translated
          const actionWords = ['Edit', 'Delete', 'View', 'Update', 'Remove', 'Select', 'Choose', 'Details', 'Actions'];
          if (actionWords.some(action => text.toLowerCase().includes(action.toLowerCase()))) {
            const translated = await t(text);
            if (translated !== text) {
              button.textContent = translated;
            }
          }
        }
      });

      // Translate empty state messages
      const emptyStates = container.querySelectorAll('.empty-state, .no-data, .no-results');
      emptyStates.forEach(async (emptyState) => {
        const text = emptyState.textContent?.trim();
        if (text && shouldTranslateText(text, emptyState)) {
          const translated = await t(text);
          if (translated !== text) {
            emptyState.textContent = translated;
          }
        }
      });

      // Do NOT translate table data cells (td) - they contain user data
      // This is handled by the smart rules in shouldTranslateText
    };

    // Initial translation
    setTimeout(translateTableElements, 100);

    // Watch for dynamic table changes
    const observer = new MutationObserver(() => {
      setTimeout(translateTableElements, 200);
    });

    observer.observe(tableRef.current, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [t, language, tableType]);

  return (
    <div ref={tableRef} className="table-translator">
      {children}
    </div>
  );
}

/**
 * Smart Component Wrapper
 * Automatically chooses the right translation strategy based on content type
 */
export function SmartTranslator({ children, type }: { 
  children: React.ReactNode;
  type?: 'form' | 'table' | 'auto';
}) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [detectedType, setDetectedType] = React.useState<'form' | 'table' | 'general'>('general');

  React.useEffect(() => {
    if (type !== 'auto' || !contentRef.current) return;

    // Auto-detect content type
    const container = contentRef.current;
    const forms = container.querySelectorAll('form, .form');
    const tables = container.querySelectorAll('table, .table');

    if (forms.length > 0 && forms.length >= tables.length) {
      setDetectedType('form');
    } else if (tables.length > 0) {
      setDetectedType('table');
    } else {
      setDetectedType('general');
    }
  }, [type, children]);

  const finalType = type === 'auto' ? detectedType : type;

  return (
    <div ref={contentRef}>
      {finalType === 'form' && <FormTranslator>{children}</FormTranslator>}
      {finalType === 'table' && <TableTranslator>{children}</TableTranslator>}
      {finalType === 'general' && children}
    </div>
  );
}