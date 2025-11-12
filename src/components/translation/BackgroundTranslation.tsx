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
  private processedElements = new WeakSet<Element>();
  private lastScanTime = 0;
  private scanInterval = 2000; // Scan every 2 seconds
  private tBatch: ((texts: string[], progressive?: boolean) => Promise<string[]>) | null = null;
  private language: string = 'en';

  constructor() {
    // Start background scanning when page is idle
    if (typeof window !== 'undefined') {
      this.scheduleNextScan();
    }
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
  }

  private async processTranslationQueue() {
    if (this.queue.size === 0 || !this.tBatch) return;

    const textsToTranslate = Array.from(this.queue);
    this.queue.clear();

    console.log(`⚡ Background processing ${textsToTranslate.length} texts`);

    try {
      // Use progressive translation (non-blocking)
      await this.tBatch(textsToTranslate, true);
      console.log(`✅ Background translation completed for ${textsToTranslate.length} texts`);
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