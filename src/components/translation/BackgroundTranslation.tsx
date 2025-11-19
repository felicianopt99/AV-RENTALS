"use client";

import React from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import { shouldTranslateText } from '@/lib/translationRules';

/**
 * Background Translation Service
 * Intelligently scans and translates page content in background
 * without blocking user interactions
 */
class BackgroundTranslationService {
  private isRunning = false;
  private queue: Set<string> = new Set();
  // Attribute translation queue items
  private attrQueue: Array<{ element: Element; attr: string; text: string }> = [];
  private processedElements = new WeakSet<Element>();
  private processedAttributes = new WeakMap<Element, Set<string>>();
  private lastScanTime = 0;
  private scanInterval = 2000; // Scan every 2 seconds
  private tBatch: ((texts: string[], progressive?: boolean) => Promise<string[]>) | null = null;
  private language: string = 'en';
  private readonly allowedAttributes: string[] = ['placeholder', 'aria-label', 'title', 'alt'];

  constructor() {
    // Start background scanning when page is idle
    if (typeof window !== 'undefined') {
      this.scheduleNextScan();
    }
  }

  // Less strict guard for attributes: allow placeholders/titles/aria/alt on inputs and general elements,
  // but still avoid obvious user data or IDs/codes.
  private isTranslatableAttribute(value: string, element: Element, attr: string): boolean {
    if (!value) return false;
    if (value.length > 200) return false;
    // Respect explicit opt-out
    if ((element as HTMLElement).dataset?.noTranslate !== undefined || element.classList.contains('no-translate')) {
      return false;
    }
    const v = value.trim();
    // Skip emails/URLs/phones/mostly numbers
    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(v)) return false;
    if (/^https?:\/\//i.test(v)) return false;
    if (/^[\d\s+().-]{5,}$/.test(v)) return false;
    // Skip short all-caps codes (IDs/SKUs)
    if (/^[A-Z0-9_-]{3,20}$/.test(v) && /[A-Z]/.test(v) && /\d/.test(v)) return false;
    // Common UI attributes are okay to translate
    if (['placeholder','title','aria-label','alt'].includes(attr)) return true;
    // Fallback: reuse shouldTranslateText decision
    return shouldTranslateText(v, element);
  }

  setTranslationFunction(tBatch: (texts: string[], progressive?: boolean) => Promise<string[]>, language: string) {
    this.tBatch = tBatch;
    this.language = language;
  }

  private scheduleNextScan() {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.scanAndTranslate(), { timeout: 5000 });
    } else {
      setTimeout(() => this.scanAndTranslate(), this.scanInterval);
    }
  }

  private async scanAndTranslate() {
    if (this.isRunning || this.language === 'en' || !this.tBatch) {
      this.scheduleNextScan();
      return;
    }

    const now = Date.now();
    if (now - this.lastScanTime < this.scanInterval) {
      this.scheduleNextScan();
      return;
    }

    this.isRunning = true;
    this.lastScanTime = now;

    try {
      await this.scanPageForNewContent();
      await this.processTranslationQueue();
    } catch (error) {
      console.error('Background translation error:', error);
    } finally {
      this.isRunning = false;
      this.scheduleNextScan();
    }
  }

  private scanPageForNewContent() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node: Node) => {
          const element = node.parentElement;
          if (!element) return NodeFilter.FILTER_REJECT;

          // Skip already processed elements
          if (this.processedElements.has(element)) return NodeFilter.FILTER_REJECT;

          const text = node.textContent?.trim() || '';
          if (!text) return NodeFilter.FILTER_REJECT;

          // Use smart translation rules
          return shouldTranslateText(text, element) 
            ? NodeFilter.FILTER_ACCEPT 
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    let processedCount = 0;
    let node: Text | null;
    
    while ((node = walker.nextNode() as Text) && processedCount < 50) {
      const text = node.textContent?.trim();
      const element = node.parentElement;

      if (text && element && !this.processedElements.has(element)) {
        this.queue.add(text);
        this.processedElements.add(element);
        processedCount++;
      }
    }

    if (processedCount > 0) {
      console.log(`🔍 Background scan found ${processedCount} new texts to translate`);
    }

    // Attribute scan: translate safe allowlist of attributes
    try {
      const selector = this.allowedAttributes.map(a => `[${a}]`).join(',');
      const elements = document.body.querySelectorAll(selector);

      let attrProcessed = 0;
      for (const el of Array.from(elements)) {
        if (attrProcessed >= 80) break; // conservative per-scan cap for attributes

        for (const attr of this.allowedAttributes) {
          const raw = el.getAttribute(attr);
          const value = raw?.trim() || '';
          if (!value) continue;

          // Avoid reprocessing same attribute on same element
          const doneSet = this.processedAttributes.get(el) || new Set<string>();
          if (doneSet.has(attr)) continue;

          if (this.isTranslatableAttribute(value, el, attr)) {
            // Queue attribute for translation and mark as processed (to avoid duplicates)
            this.attrQueue.push({ element: el, attr, text: value });
            doneSet.add(attr);
            this.processedAttributes.set(el, doneSet);
            attrProcessed++;
            // Also enqueue the text for batch deduplication
            this.queue.add(value);
          }
        }
      }

      if (attrProcessed > 0) {
        console.log(`🧩 Background scan queued ${attrProcessed} attribute(s) for translation`);
      }
    } catch (e) {
      // Fail-safe: attribute scanning is optional
      console.debug('Attribute scan skipped due to error:', e);
    }
  }

  private async processTranslationQueue() {
    if ((this.queue.size === 0 && this.attrQueue.length === 0) || !this.tBatch) return;

    // Combine text and attribute values, dedupe
    const textsArray = Array.from(this.queue);
    const attrTexts = this.attrQueue.map(i => i.text);
    const allTexts = [...textsArray, ...attrTexts];
    const uniqueTexts = Array.from(new Set(allTexts));

    // Clear queues before processing to avoid duplication on retries
    this.queue.clear();
    const currentAttrQueue = this.attrQueue.splice(0, this.attrQueue.length);

    console.log(`⚡ Background processing ${uniqueTexts.length} texts (including ${currentAttrQueue.length} attribute(s))`);

    try {
      // Progressive/async-friendly translation; fills client cache
      const translated = await this.tBatch(uniqueTexts, true);

      // Build map: original -> translated
      const map = new Map<string, string>();
      uniqueTexts.forEach((txt, idx) => {
        map.set(txt, translated[idx] ?? txt);
      });

      // Apply translations to attributes immediately
      let applied = 0;
      for (const item of currentAttrQueue) {
        const newVal = map.get(item.text) ?? item.text;
        if (newVal && newVal !== item.text) {
          try {
            item.element.setAttribute(item.attr, newVal);
            applied++;
          } catch (e) {
            // ignore DOM write errors
          }
        }
      }

      console.log(`✅ Background translation completed. Attributes updated: ${applied}`);
    } catch (error) {
      console.error('Background translation queue processing error:', error);
    }
  }

  // Public method to trigger immediate scan
  triggerScan() {
    if (!this.isRunning) {
      setTimeout(() => this.scanAndTranslate(), 100);
    }
  }

  // Public method to add specific texts to queue
  queueTexts(texts: string[]) {
    texts.forEach(text => this.queue.add(text));
  }

  // Get stats for debugging
  getStats() {
    return {
      isRunning: this.isRunning,
      queueSize: this.queue.size,
      processedElements: this.processedElements,
      lastScanTime: this.lastScanTime,
    };
  }
}

// Global instance
let backgroundService: BackgroundTranslationService | null = null;

/**
 * Hook to use background translation service
 */
export function useBackgroundTranslation() {
  const { tBatch, language, isPreloading } = useTranslation();

  // Initialize service
  if (!backgroundService && typeof window !== 'undefined') {
    backgroundService = new BackgroundTranslationService();
  }

  // Update service when translation function or language changes
  React.useEffect(() => {
    if (backgroundService && !isPreloading) {
      backgroundService.setTranslationFunction(tBatch, language);
    }
  }, [tBatch, language, isPreloading]);

  return {
    triggerScan: () => backgroundService?.triggerScan(),
    queueTexts: (texts: string[]) => backgroundService?.queueTexts(texts),
    getStats: () => backgroundService?.getStats(),
  };
}

/**
 * React component to enable background translation
 */
export default function BackgroundTranslationProvider({ children }: { children: React.ReactNode }) {
  const { triggerScan } = useBackgroundTranslation();

  // Trigger scan when new content might be added
  React.useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if added nodes contain text
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE || 
                (node.nodeType === Node.ELEMENT_NODE && (node as Element).textContent?.trim())) {
              shouldScan = true;
            }
          });
        }
      });

      if (shouldScan) {
        setTimeout(triggerScan, 500); // Debounce multiple rapid changes
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [triggerScan]);

  return <>{children}</>;
}