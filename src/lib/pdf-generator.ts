// src/lib/pdf-generator.ts
// PDF Generator that fetches company branding from admin customization settings
// Supports dynamic company name, tagline, contact info, and logo options
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { Quote } from '@/types';

export interface PDFGeneratorOptions {
  filename?: string;
  download?: boolean;
}

interface CustomizationSettings {
  companyName?: string;
  companyTagline?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  useTextLogo?: boolean;
}

export class QuotePDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;
  private customizationSettings: CustomizationSettings | null = null;
  
  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  private checkPageSpace(requiredSpace: number): boolean {
    return (this.currentY + requiredSpace) <= (this.pageHeight - this.margin);
  }

  private addPageBreak() {
    this.doc.addPage();
    this.currentY = this.margin;
  }

  private async fetchCustomizationSettings(): Promise<CustomizationSettings> {
    if (this.customizationSettings) {
      return this.customizationSettings;
    }

    try {
      const response = await fetch('/api/customization');
      if (!response.ok) {
        throw new Error('Failed to fetch customization settings');
      }
      this.customizationSettings = await response.json();
      return this.customizationSettings!;
    } catch (error) {
      console.error('Error fetching customization settings:', error);
      // Return fallback settings
      const fallbackSettings: CustomizationSettings = {
        companyName: 'AV RENTALS',
        companyTagline: 'Professional AV Equipment Rental',
        contactEmail: 'info@av-rentals.com',
        contactPhone: '+1 (555) 123-4567',
        useTextLogo: true
      };
      this.customizationSettings = fallbackSettings;
      return fallbackSettings;
    }
  }

  private addText(text: string, x: number, y: number, options: { 
    fontSize?: number; 
    fontWeight?: 'normal' | 'bold'; 
    align?: 'left' | 'center' | 'right';
    maxWidth?: number;
  } = {}) {
    const { fontSize = 10, fontWeight = 'normal', align = 'left', maxWidth } = options;
    
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontWeight);
    
    if (maxWidth) {
      const lines = this.doc.splitTextToSize(text, maxWidth);
      if (align === 'right') {
        this.doc.text(lines, x, y, { align: 'right' });
      } else if (align === 'center') {
        this.doc.text(lines, x, y, { align: 'center' });
      } else {
        this.doc.text(lines, x, y);
      }
      return lines.length * (fontSize * 0.35); // Approximate line height
    } else {
      if (align === 'right') {
        this.doc.text(text, x, y, { align: 'right' });
      } else if (align === 'center') {
        this.doc.text(text, x, y, { align: 'center' });
      } else {
        this.doc.text(text, x, y);
      }
      return fontSize * 0.35; // Approximate line height
    }
  }

  private addLine(x1: number, y1: number, x2: number, y2: number, lineWidth: number = 0.5) {
    this.doc.setLineWidth(lineWidth);
    this.doc.line(x1, y1, x2, y2);
  }

  private async addHeader(quote: Quote) {
    const settings = await this.fetchCustomizationSettings();
    
    this.currentY = 20;
    
    // Company Info (Right side) - Clean typography
    const companyName = settings.companyName || 'AV RENTALS';
    this.addText(companyName, this.pageWidth - this.margin, this.currentY, {
      fontSize: 22,
      fontWeight: 'bold',
      align: 'right'
    });
    
    this.currentY += 8;
    if (settings.companyTagline) {
      this.addText(settings.companyTagline, this.pageWidth - this.margin, this.currentY, {
        fontSize: 10,
        align: 'right'
      });
      this.currentY += 5;
    }
    
    // Contact info - simple and clean
    if (settings.contactEmail) {
      this.addText(settings.contactEmail, this.pageWidth - this.margin, this.currentY, {
        fontSize: 9,
        align: 'right'
      });
      this.currentY += 4;
    }
    
    if (settings.contactPhone) {
      this.addText(settings.contactPhone, this.pageWidth - this.margin, this.currentY, {
        fontSize: 9,
        align: 'right'
      });
      this.currentY += 8;
    }

    // Reset Y position for left side content
    const leftStartY = 20;
    
    // Clean quote title
    this.addText('QUOTE', this.margin, leftStartY, {
      fontSize: 20,
      fontWeight: 'bold'
    });
    
    // Quote number
    const quoteNumberY = leftStartY + 10;
    this.addText(quote.quoteNumber, this.margin, quoteNumberY, {
      fontSize: 14,
      fontWeight: 'bold'
    });
    
    // Date info - clean and simple
    const dateInfoY = quoteNumberY + 8;
    this.addText(`Date: ${format(new Date(), 'MMMM d, yyyy')}`, this.margin, dateInfoY, {
      fontSize: 10
    });
    
    this.addText(`Valid until: ${format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMMM d, yyyy')}`, this.margin, dateInfoY + 4, {
      fontSize: 10
    });

    // Ensure we use the maximum Y position from both sides
    this.currentY = Math.max(this.currentY, dateInfoY + 15);
    
    // Remove the header separator line to reduce noise
    // this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY, 0.5);
    // this.currentY += 10;
  }

  private addQuoteInfo(quote: Quote) {
    // Quote name with light background
    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(this.margin - 2, this.currentY - 1, this.pageWidth - 2 * this.margin + 4, 10, 'F');
    
    this.addText(quote.name, this.margin, this.currentY + 4, {
      fontSize: 16,
      fontWeight: 'bold'
    });
    this.currentY += 14;

    const leftColX = this.margin;
    const rightColX = this.pageWidth / 2;
    const startY = this.currentY;

    // Clean section headers - remove underlines to reduce noise
    this.addText('Client Information', leftColX, this.currentY, {
      fontSize: 12,
      fontWeight: 'bold'
    });
    
    // Remove underline to reduce visual noise
    // this.addLine(leftColX, this.currentY + 2, rightColX - 10, this.currentY + 2, 0.5);
    this.currentY += 8;

    this.addText(`Name: ${quote.clientName}`, leftColX, this.currentY, { fontSize: 10 });
    this.currentY += 5;

    if (quote.clientEmail) {
      this.addText(`Email: ${quote.clientEmail}`, leftColX, this.currentY, { fontSize: 10 });
      this.currentY += 5;
    }

    if (quote.clientPhone) {
      this.addText(`Phone: ${quote.clientPhone}`, leftColX, this.currentY, { fontSize: 10 });
      this.currentY += 5;
    }

    if (quote.clientAddress) {
      this.addText(`Address: ${quote.clientAddress}`, leftColX, this.currentY, { 
        fontSize: 10, 
        maxWidth: rightColX - leftColX - 10 
      });
      this.currentY += 5;
    }

    // Event Information (Right column) - clean styling
    const rightStartY = startY;
    this.addText('Event Details', rightColX, rightStartY, {
      fontSize: 12,
      fontWeight: 'bold'
    });
    
    // Remove underline to reduce visual noise
    const rightCurrentY = rightStartY + 2;
    // this.addLine(rightColX, rightCurrentY, this.pageWidth - this.margin, rightCurrentY, 0.5);
    
    let eventY = rightCurrentY + 6;
    this.addText(`Location: ${quote.location}`, rightColX, eventY, { fontSize: 10 });
    eventY += 5;
    
    this.addText(`Start Date: ${format(new Date(quote.startDate), 'MMMM d, yyyy')}`, rightColX, eventY, { fontSize: 10 });
    eventY += 5;
    
    this.addText(`End Date: ${format(new Date(quote.endDate), 'MMMM d, yyyy')}`, rightColX, eventY, { fontSize: 10 });
    eventY += 5;
    
    const days = Math.ceil((new Date(quote.endDate).getTime() - new Date(quote.startDate).getTime()) / (1000 * 60 * 60 * 24));
    this.addText(`Duration: ${days} day(s)`, rightColX, eventY, { fontSize: 10 });

    // Ensure currentY accounts for both columns
    this.currentY = Math.max(this.currentY, eventY) + 10;
  }

  private addItemsTable(quote: Quote) {
    // Clean section header - remove line to reduce noise
    this.addText('Equipment & Services', this.margin, this.currentY, {
      fontSize: 12,
      fontWeight: 'bold'
    });
    
    this.currentY += 8;
    // Remove section underline to reduce visual clutter
    // this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY, 0.5);
    // this.currentY += 6;

    // Clean table with better spacing
    const colWidths = [80, 20, 25, 20, 25]; // mm
    let colX = this.margin;
    
    // Light gray header background
    this.doc.setFillColor(245, 245, 245);
    this.doc.rect(this.margin, this.currentY - 3, this.pageWidth - 2 * this.margin, 8, 'F');

    this.addText('Item', colX + 2, this.currentY, { fontSize: 9, fontWeight: 'bold' });
    colX += colWidths[0];
    
    this.addText('Qty', colX, this.currentY, { fontSize: 9, fontWeight: 'bold', align: 'center' });
    colX += colWidths[1];
    
    this.addText('Rate/Day', colX, this.currentY, { fontSize: 9, fontWeight: 'bold', align: 'right' });
    colX += colWidths[2];
    
    this.addText('Days', colX, this.currentY, { fontSize: 9, fontWeight: 'bold', align: 'center' });
    colX += colWidths[3];
    
    this.addText('Total', colX + colWidths[4] - 2, this.currentY, { fontSize: 9, fontWeight: 'bold', align: 'right' });

    this.currentY += 6;
    // Keep only the header separator line as it's essential for table structure
    this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY, 0.3);
    this.currentY += 4;

    // Clean table rows with subtle alternating colors
    quote.items.forEach((item, index) => {
      colX = this.margin;
      
      // Light alternating row background
      if (index % 2 === 0) {
        this.doc.setFillColor(250, 250, 250);
        this.doc.rect(this.margin, this.currentY - 2, this.pageWidth - 2 * this.margin, 6, 'F');
      }

      this.addText(item.equipmentName || 'Equipment Item', colX + 2, this.currentY, { 
        fontSize: 9,
        maxWidth: colWidths[0] - 4
      });
      colX += colWidths[0];
      
      this.addText((item.quantity || 1).toString(), colX, this.currentY, { fontSize: 9, align: 'center' });
      colX += colWidths[1];
      
      this.addText(`€${(item.unitPrice || 0).toFixed(2)}`, colX, this.currentY, { fontSize: 9, align: 'right' });
      colX += colWidths[2];
      
      this.addText((item.days || 1).toString(), colX, this.currentY, { fontSize: 9, align: 'center' });
      colX += colWidths[3];
      
      this.addText(`€${item.lineTotal.toFixed(2)}`, colX + colWidths[4] - 2, this.currentY, { fontSize: 9, align: 'right' });

      this.currentY += 6;
    });

    // Remove bottom table line to reduce noise - just add extra space
    // this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY, 0.5);
    this.currentY += 12;
  }

  private addFinancialSummary(quote: Quote) {
    const summaryWidth = 60;
    const summaryX = this.pageWidth - this.margin - summaryWidth;
    
    // Clean summary box with light background - remove border to reduce noise
    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(summaryX, this.currentY - 5, summaryWidth, 35, 'F');
    
    // Remove border to reduce visual clutter
    // this.doc.setDrawColor(200, 200, 200);
    // this.doc.rect(summaryX, this.currentY - 5, summaryWidth, 35);

    const subtotal = quote.subTotal || 0;
    const discountAmount = quote.discountType === 'percentage' 
      ? (subtotal * (quote.discountAmount / 100))
      : quote.discountAmount;
    const discountedSubtotal = subtotal - discountAmount;
    const taxAmount = quote.taxAmount || 0;
    const totalAmount = quote.totalAmount || 0;

    let summaryY = this.currentY;
    
    // Subtotal
    this.addText('Subtotal:', summaryX + 3, summaryY, { fontSize: 10 });
    this.addText(`€${subtotal.toFixed(2)}`, summaryX + summaryWidth - 3, summaryY, { fontSize: 10, align: 'right' });
    summaryY += 5;

    // Discount
    if (quote.discountAmount > 0) {
      const discountLabel = quote.discountType === 'percentage' 
        ? `Discount (${quote.discountAmount}%):`
        : 'Discount:';
      this.addText(discountLabel, summaryX + 3, summaryY, { fontSize: 10 });
      this.addText(`-€${discountAmount.toFixed(2)}`, summaryX + summaryWidth - 3, summaryY, { fontSize: 10, align: 'right' });
      summaryY += 5;
    }

    // Net amount
    this.addText('Net Amount:', summaryX + 3, summaryY, { fontSize: 10 });
    this.addText(`€${discountedSubtotal.toFixed(2)}`, summaryX + summaryWidth - 3, summaryY, { fontSize: 10, align: 'right' });
    summaryY += 5;

    // Tax
    this.addText(`Tax (${((quote.taxRate || 0) * 100).toFixed(1)}%):`, summaryX + 3, summaryY, { fontSize: 10 });
    this.addText(`€${taxAmount.toFixed(2)}`, summaryX + summaryWidth - 3, summaryY, { fontSize: 10, align: 'right' });
    summaryY += 5;

    // Simple separator line
    this.addLine(summaryX + 3, summaryY, summaryX + summaryWidth - 3, summaryY, 0.5);
    summaryY += 3;

    // Total with light background highlight
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(summaryX + 1, summaryY - 1, summaryWidth - 2, 7, 'F');
    
    this.addText('Total Amount:', summaryX + 3, summaryY + 2, { fontSize: 11, fontWeight: 'bold' });
    this.addText(`€${totalAmount.toFixed(2)}`, summaryX + summaryWidth - 3, summaryY + 2, { fontSize: 12, fontWeight: 'bold', align: 'right' });

    this.currentY = summaryY + 15;
  }

  private addNotes(quote: Quote) {
    if (quote.notes) {
      this.addText('Additional Notes', this.margin, this.currentY, {
        fontSize: 12,
        fontWeight: 'bold'
      });
      this.currentY += 8;
      // Remove notes underline to reduce visual noise
      // this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY, 0.5);
      // this.currentY += 5;

      // Notes background
      this.doc.setFillColor(250, 250, 250);
      const notesHeight = 20;
      this.doc.rect(this.margin, this.currentY - 2, this.pageWidth - 2 * this.margin, notesHeight, 'F');
      
      this.addText(quote.notes, this.margin + 3, this.currentY + 2, {
        fontSize: 9,
        maxWidth: this.pageWidth - 2 * this.margin - 6
      });

      this.currentY += notesHeight + 5;
    }
  }

  private addTerms(compact: boolean = false) {
    this.addText('Terms & Conditions', this.margin, this.currentY, {
      fontSize: 12,
      fontWeight: 'bold'
    });
    this.currentY += 8;
    // Remove terms underline to reduce visual noise
    // this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY, 0.5);
    // this.currentY += 5;

    if (compact) {
      // Compact version for short quotes
      const compactTerms = [
        '• Equipment returned in same condition • Payment due within 30 days',
        '• 48hr cancellation notice • Quote valid for 30 days from issue date'
      ];
      compactTerms.forEach(term => {
        this.addText(term, this.margin, this.currentY, { fontSize: 8 });
        this.currentY += 4;
      });
    } else {
      // Full terms for longer quotes
      const terms = [
        '• Equipment must be returned in the same condition as received.',
        '• Client is responsible for any damage or loss during rental period.',
        '• Payment is due within 30 days of invoice date.',
        '• Cancellations must be made 48 hours in advance.',
        '• Setup and breakdown services are available upon request.',
        '• This quote is valid for 30 days from the date issued.'
      ];
      terms.forEach(term => {
        this.addText(term, this.margin, this.currentY, { fontSize: 8 });
        this.currentY += 4;
      });
    }

    this.currentY += 5;
  }

  private addFooter() {
    const footerY = this.pageHeight - 25;
    
    this.addLine(this.margin, footerY, this.pageWidth - this.margin, footerY, 0.5);
    
    const settings = this.customizationSettings || {
      companyName: 'AV Rentals',
      contactEmail: 'info@av-rentals.com',
      contactPhone: '+1 (555) 123-4567'
    };

    this.addText(`Thank you for considering ${settings.companyName || 'AV Rentals'} for your event needs!`, this.pageWidth / 2, footerY + 5, {
      fontSize: 10,
      align: 'center',
      fontWeight: 'bold'
    });
    
    const contactInfo = [];
    if (settings.contactEmail) contactInfo.push(settings.contactEmail);
    if (settings.contactPhone) contactInfo.push(settings.contactPhone);
    
    if (contactInfo.length > 0) {
      this.addText(`For questions about this quote, please contact us at ${contactInfo.join(' or ')}`, this.pageWidth / 2, footerY + 10, {
        fontSize: 8,
        align: 'center'
      });
    }
  }

  private estimateContentHeight(quote: Quote): number {
    let estimatedHeight = 0;
    
    // Header section (optimized ~40mm)
    estimatedHeight += 40;
    
    // Quote info section (optimized ~30mm)  
    estimatedHeight += 30;
    
    // Items table (header + items + padding)
    const itemCount = quote.items?.length || 0;
    estimatedHeight += 18 + (itemCount * 6) + 8; // header + items + spacing
    
    // Financial summary (~35mm)
    estimatedHeight += 35;
    
    // Notes (if present, ~20mm)
    if (quote.notes && quote.notes.trim()) {
      estimatedHeight += 20;
    }
    
    // Terms & conditions (compact ~15mm, full ~25mm - we'll use compact if fits)
    estimatedHeight += 15;
    
    // Footer (~15mm)
    estimatedHeight += 15;
    
    return estimatedHeight;
  }

  public async generatePDF(quote: Quote, options: PDFGeneratorOptions = {}): Promise<Blob> {
    await this.addHeader(quote);
    
    // Smart pagination: estimate if content fits on one page to avoid unnecessary page breaks
    const contentHeight = this.estimateContentHeight(quote);
    const availableHeight = this.pageHeight - this.margin * 2;
    const fitsOnOnePage = contentHeight <= availableHeight;
    
    this.addQuoteInfo(quote);
    
    // Add items table with space check
    if (!fitsOnOnePage && !this.checkPageSpace(40)) {
      this.addPageBreak();
    }
    this.addItemsTable(quote);
    
    // Add financial summary
    if (!fitsOnOnePage && !this.checkPageSpace(40)) {
      this.addPageBreak();
    }
    this.addFinancialSummary(quote);
    
    // Add notes if present
    if (quote.notes && quote.notes.trim()) {
      if (!fitsOnOnePage && !this.checkPageSpace(25)) {
        this.addPageBreak();
      }
      this.addNotes(quote);
    }
    
    // Add terms & conditions
    const termsSpace = fitsOnOnePage ? 15 : 30; // Less space needed for compact terms
    if (!fitsOnOnePage && !this.checkPageSpace(termsSpace)) {
      this.addPageBreak();
    }
    this.addTerms(fitsOnOnePage);
    
    this.addFooter();

    const filename = options.filename || `quote-${quote.quoteNumber}.pdf`;

    if (options.download !== false) {
      this.doc.save(filename);
    }

    // Return blob for preview
    const blob = this.doc.output('blob');
    return blob;
  }

  public static async generateQuotePDF(quote: Quote, options: PDFGeneratorOptions = {}): Promise<Blob> {
    const generator = new QuotePDFGenerator();
    return generator.generatePDF(quote, options);
  }
}