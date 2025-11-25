// src/lib/pdf-generator.ts
// PDF Generator that fetches company branding from admin customization settings
// Supports dynamic company name, tagline, contact info, and logo options
// Includes multi-language support with Gemini translations
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { Quote } from '@/types';
import { Language } from '@/lib/client-translation';
import { clientPDFTranslationService, PDFTranslationOptions } from '@/lib/client-pdf-translation';

export interface PDFGeneratorOptions {
  filename?: string;
  download?: boolean;
  language?: Language; // New: language selection for PDF
  translationOptions?: PDFTranslationOptions; // New: translation customization
}

interface CustomizationSettings {
  companyName?: string;
  companyTagline?: string;
  contactEmail?: string;
  contactPhone?: string;
  pdfCompanyName?: string;
  pdfCompanyTagline?: string;
  pdfContactEmail?: string;
  pdfContactPhone?: string;
  logoUrl?: string;
  useTextLogo?: boolean;
  pdfLogoUrl?: string;
  pdfUseTextLogo?: boolean;
}

export class QuotePDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;
  private customizationSettings: CustomizationSettings | null = null;
  private language: Language = 'en';
  private translatedTexts: any = null;
  
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

  private getTranslatedText(key: string, fallback?: string): string {
    if (this.translatedTexts?.staticLabels?.[key]) {
      return this.translatedTexts.staticLabels[key];
    }
    return fallback || key;
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

  private async loadImageAsBase64(url: string): Promise<{ data: string; width: number; height: number } | null> {
    try {
      let base64Data: string;
      let imgWidth: number;
      let imgHeight: number;

      // If it's already a data URL, extract dimensions
      if (url.startsWith('data:')) {
        base64Data = url;
        // Create an image element to get dimensions
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });
        imgWidth = img.width;
        imgHeight = img.height;
      } else {
        // Fetch the image and convert to base64
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) {
          throw new Error('Failed to fetch image');
        }
        
        const blob = await response.blob();
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        // Get image dimensions
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = base64Data;
        });
        imgWidth = img.width;
        imgHeight = img.height;
      }

      return { data: base64Data, width: imgWidth, height: imgHeight };
    } catch (error) {
      console.error('Error loading image for PDF:', error);
      return null;
    }
  }

  private async addHeader(quote: Quote) {
    const settings = await this.fetchCustomizationSettings();
    
    this.currentY = 20;
    
    // Company Info (Right side) - Clean typography or Logo
    const companyName = settings.pdfCompanyName ?? settings.companyName ?? 'AV RENTALS';
    const effectiveUseTextLogo = settings.pdfUseTextLogo ?? settings.useTextLogo ?? true;
    const effectiveLogoUrl = settings.pdfLogoUrl ?? settings.logoUrl;
    const shouldUseLogo = !effectiveUseTextLogo && !!effectiveLogoUrl;
    
    if (shouldUseLogo) {
      // Render logo image
      try {
        const logoData = await this.loadImageAsBase64(effectiveLogoUrl!);
        if (logoData) {
          // Calculate logo dimensions (max width: 50mm, max height: 20mm, maintain aspect ratio)
          const maxLogoWidth = 50;
          const maxLogoHeight = 20;
          
          // Convert pixels to mm (assuming 96 DPI: 1px = 0.264583mm)
          // For better quality, assume 300 DPI for print: 1px = 0.084667mm
          const pxToMm = 0.264583; // 96 DPI conversion
          let logoWidth = logoData.width * pxToMm;
          let logoHeight = logoData.height * pxToMm;
          
          // Scale down if too large, maintaining aspect ratio
          if (logoWidth > maxLogoWidth || logoHeight > maxLogoHeight) {
            const widthScale = maxLogoWidth / logoWidth;
            const heightScale = maxLogoHeight / logoHeight;
            const scale = Math.min(widthScale, heightScale);
            logoWidth = logoWidth * scale;
            logoHeight = logoHeight * scale;
          }
          
          // Determine image format from base64 data
          let format: 'PNG' | 'JPEG' = 'PNG';
          if (logoData.data.startsWith('data:image/jpeg') || logoData.data.startsWith('data:image/jpg')) {
            format = 'JPEG';
          }
          
          // Add logo to PDF (right-aligned)
          const logoX = this.pageWidth - this.margin - logoWidth;
          this.doc.addImage(logoData.data, format, logoX, this.currentY, logoWidth, logoHeight);
          this.currentY += logoHeight + 5;
        } else {
          // Fallback to text if image loading fails
          this.addText(companyName, this.pageWidth - this.margin, this.currentY, {
            fontSize: 22,
            fontWeight: 'bold',
            align: 'right'
          });
          this.currentY += 8;
        }
      } catch (error) {
        console.error('Error adding logo to PDF, falling back to text:', error);
        // Fallback to text if logo fails
        this.addText(companyName, this.pageWidth - this.margin, this.currentY, {
          fontSize: 22,
          fontWeight: 'bold',
          align: 'right'
        });
        this.currentY += 8;
      }
    } else {
      // Use text logo
      this.addText(companyName, this.pageWidth - this.margin, this.currentY, {
        fontSize: 22,
        fontWeight: 'bold',
        align: 'right'
      });
      this.currentY += 8;
    }
    
    const effectiveTagline = settings.pdfCompanyTagline ?? settings.companyTagline;
    if (effectiveTagline) {
      this.addText(effectiveTagline, this.pageWidth - this.margin, this.currentY, {
        fontSize: 10,
        align: 'right'
      });
      this.currentY += 5;
    }
    
    // Contact info - simple and clean
    const effectiveEmail = settings.pdfContactEmail ?? settings.contactEmail;
    if (effectiveEmail) {
      this.addText(effectiveEmail, this.pageWidth - this.margin, this.currentY, {
        fontSize: 9,
        align: 'right'
      });
      this.currentY += 4;
    }
    
    const effectivePhone = settings.pdfContactPhone ?? settings.contactPhone;
    if (effectivePhone) {
      this.addText(effectivePhone, this.pageWidth - this.margin, this.currentY, {
        fontSize: 9,
        align: 'right'
      });
      this.currentY += 8;
    }

    // Reset Y position for left side content
    const leftStartY = 20;
    
    // Clean quote title
    this.addText(this.getTranslatedText('quote', 'QUOTE'), this.margin, leftStartY, {
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
    const dateLabel = this.getTranslatedText('date', 'Date');
    this.addText(`${dateLabel}: ${format(new Date(), 'MMMM d, yyyy')}`, this.margin, dateInfoY, {
      fontSize: 10
    });
    
    const validUntilLabel = this.getTranslatedText('validUntil', 'Valid until');
    this.addText(`${validUntilLabel}: ${format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMMM d, yyyy')}`, this.margin, dateInfoY + 4, {
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
    this.addText(this.getTranslatedText('clientInformation', 'Client Information'), leftColX, this.currentY, {
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
    this.addText(this.getTranslatedText('eventDetails', 'Event Details'), rightColX, rightStartY, {
      fontSize: 12,
      fontWeight: 'bold'
    });
    
    // Remove underline to reduce visual noise
    const rightCurrentY = rightStartY + 2;
    // this.addLine(rightColX, rightCurrentY, this.pageWidth - this.margin, rightCurrentY, 0.5);
    
    let eventY = rightCurrentY + 6;
    const locationLabel = this.getTranslatedText('location', 'Location');
    this.addText(`${locationLabel}: ${quote.location}`, rightColX, eventY, { fontSize: 10 });
    eventY += 5;
    
    const startDateLabel = this.getTranslatedText('startDate', 'Start Date');
    this.addText(`${startDateLabel}: ${format(new Date(quote.startDate), 'MMMM d, yyyy')}`, rightColX, eventY, { fontSize: 10 });
    eventY += 5;
    
    const endDateLabel = this.getTranslatedText('endDate', 'End Date');
    this.addText(`${endDateLabel}: ${format(new Date(quote.endDate), 'MMMM d, yyyy')}`, rightColX, eventY, { fontSize: 10 });
    eventY += 5;
    
    const days = Math.ceil((new Date(quote.endDate).getTime() - new Date(quote.startDate).getTime()) / (1000 * 60 * 60 * 24));
    const durationLabel = this.getTranslatedText('duration', 'Duration');
    this.addText(`${durationLabel}: ${days} day(s)`, rightColX, eventY, { fontSize: 10 });

    // Ensure currentY accounts for both columns
    this.currentY = Math.max(this.currentY, eventY) + 10;
  }

  private addItemsTable(quote: Quote) {
    // Clean section header - remove line to reduce noise
    this.addText(this.getTranslatedText('equipmentAndServices', 'Equipment & Services'), this.margin, this.currentY, {
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

    this.addText(this.getTranslatedText('item', 'Item'), colX + 2, this.currentY, { fontSize: 9, fontWeight: 'bold' });
    colX += colWidths[0];
    
    this.addText(this.getTranslatedText('quantity', 'Qty'), colX, this.currentY, { fontSize: 9, fontWeight: 'bold', align: 'center' });
    colX += colWidths[1];
    
    this.addText(this.getTranslatedText('rate', 'Rate/Day'), colX, this.currentY, { fontSize: 9, fontWeight: 'bold', align: 'right' });
    colX += colWidths[2];
    
    this.addText(this.getTranslatedText('days', 'Days'), colX, this.currentY, { fontSize: 9, fontWeight: 'bold', align: 'center' });
    colX += colWidths[3];
    
    this.addText(this.getTranslatedText('total', 'Total'), colX + colWidths[4] - 2, this.currentY, { fontSize: 9, fontWeight: 'bold', align: 'right' });

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

      // Get item name based on type - only translate services and fees, NOT equipment
      let itemName = 'Item';
      if (item.type === 'equipment') {
        // Equipment names are NEVER translated - keep original product names
        itemName = item.equipmentName || 'Equipment Item';
      } else if (item.type === 'service') {
        // Services ARE translated
        const translatedNames = this.translatedTexts?.dynamicContent?.serviceNames;
        const serviceIndex = quote.items.filter((i, idx) => idx <= index && i.type === 'service').length - 1;
        itemName = translatedNames?.[serviceIndex] || item.serviceName || 'Service Item';
      } else if (item.type === 'fee') {
        // Fees ARE translated  
        const translatedNames = this.translatedTexts?.dynamicContent?.feeNames;
        const feeIndex = quote.items.filter((i, idx) => idx <= index && i.type === 'fee').length - 1;
        itemName = translatedNames?.[feeIndex] || item.feeName || 'Fee Item';
      }

      this.addText(itemName, colX + 2, this.currentY, { 
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
    const subtotalLabel = this.getTranslatedText('subtotal', 'Subtotal');
    this.addText(`${subtotalLabel}:`, summaryX + 3, summaryY, { fontSize: 10 });
    this.addText(`€${subtotal.toFixed(2)}`, summaryX + summaryWidth - 3, summaryY, { fontSize: 10, align: 'right' });
    summaryY += 5;

    // Discount
    if (quote.discountAmount > 0) {
      const discountLabel = this.getTranslatedText('discount', 'Discount');
      const discountText = quote.discountType === 'percentage' 
        ? `${discountLabel} (${quote.discountAmount}%):`
        : `${discountLabel}:`;
      this.addText(discountText, summaryX + 3, summaryY, { fontSize: 10 });
      this.addText(`-€${discountAmount.toFixed(2)}`, summaryX + summaryWidth - 3, summaryY, { fontSize: 10, align: 'right' });
      summaryY += 5;
    }

    // Net amount
    const netAmountLabel = this.getTranslatedText('netAmount', 'Net Amount');
    this.addText(`${netAmountLabel}:`, summaryX + 3, summaryY, { fontSize: 10 });
    this.addText(`€${discountedSubtotal.toFixed(2)}`, summaryX + summaryWidth - 3, summaryY, { fontSize: 10, align: 'right' });
    summaryY += 5;

    // Tax
    const taxLabel = this.getTranslatedText('tax', 'Tax');
    this.addText(`${taxLabel} (${((quote.taxRate || 0) * 100).toFixed(1)}%):`, summaryX + 3, summaryY, { fontSize: 10 });
    this.addText(`€${taxAmount.toFixed(2)}`, summaryX + summaryWidth - 3, summaryY, { fontSize: 10, align: 'right' });
    summaryY += 5;

    // Simple separator line
    this.addLine(summaryX + 3, summaryY, summaryX + summaryWidth - 3, summaryY, 0.5);
    summaryY += 3;

    // Total with light background highlight
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(summaryX + 1, summaryY - 1, summaryWidth - 2, 7, 'F');
    
    const totalAmountLabel = this.getTranslatedText('totalAmount', 'Total Amount');
    this.addText(`${totalAmountLabel}:`, summaryX + 3, summaryY + 2, { fontSize: 11, fontWeight: 'bold' });
    this.addText(`€${totalAmount.toFixed(2)}`, summaryX + summaryWidth - 3, summaryY + 2, { fontSize: 12, fontWeight: 'bold', align: 'right' });

    this.currentY = summaryY + 15;
  }

  private addNotes(quote: Quote) {
    if (quote.notes) {
      const notesLabel = this.getTranslatedText('additionalNotes', 'Additional Notes');
      this.addText(notesLabel, this.margin, this.currentY, {
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
      
      // Use translated notes if available, preserving client/company names
      const notesToDisplay = this.translatedTexts?.dynamicContent?.notes || quote.notes;
      this.addText(notesToDisplay, this.margin + 3, this.currentY + 2, {
        fontSize: 9,
        maxWidth: this.pageWidth - 2 * this.margin - 6
      });

      this.currentY += notesHeight + 5;
    }
  }

  private addTerms(compact: boolean = false) {
    const termsLabel = this.getTranslatedText('termsAndConditions', 'Terms & Conditions');
    this.addText(termsLabel, this.margin, this.currentY, {
      fontSize: 12,
      fontWeight: 'bold'
    });
    this.currentY += 8;
    // Remove terms underline to reduce visual noise
    // this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY, 0.5);
    // this.currentY += 5;

    // Use translated terms if available
    const termsToDisplay = this.translatedTexts?.terms || [];
    
    if (termsToDisplay.length > 0) {
      // Use translated terms from the translation service
      termsToDisplay.forEach((term: string) => {
        this.addText(term, this.margin, this.currentY, { fontSize: 8 });
        this.currentY += 4;
      });
    } else {
      // Fallback to default English terms
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

    // Use translated thank you message template but preserve company name
    const thankYouTemplate = this.getTranslatedText('thankYouMessage', 'Thank you for considering {companyName} for your event needs!');
    const thankYouMessage = thankYouTemplate.replace('{companyName}', settings.companyName || 'AV Rentals');
    
    this.addText(thankYouMessage, this.pageWidth / 2, footerY + 5, {
      fontSize: 10,
      align: 'center',
      fontWeight: 'bold'
    });
    
    const contactInfo = [];
    if (settings.contactEmail) contactInfo.push(settings.contactEmail);
    if (settings.contactPhone) contactInfo.push(settings.contactPhone);
    
    if (contactInfo.length > 0) {
      // Use translated contact message template but preserve contact info
      const contactTemplate = this.getTranslatedText('contactMessage', 'For questions about this quote, please contact us at {contactInfo}');
      const contactMessage = contactTemplate.replace('{contactInfo}', contactInfo.join(' or '));
      
      this.addText(contactMessage, this.pageWidth / 2, footerY + 10, {
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
    // Set language and prepare translations
    this.language = options.language || 'en';
    
    // Prepare dynamic content for translation
    const dynamicContent = {
      equipmentNames: quote.items?.filter(item => item.type === 'equipment').map(item => item.equipmentName || '') || [],
      serviceNames: quote.items?.filter(item => item.type === 'service').map(item => item.serviceName || '') || [],
      feeNames: quote.items?.filter(item => item.type === 'fee').map(item => item.feeName || '') || [],
      notes: quote.notes
    };

    // Smart pagination: estimate if content fits on one page to avoid unnecessary page breaks
    const contentHeight = this.estimateContentHeight(quote);
    const availableHeight = this.pageHeight - this.margin * 2;
    const fitsOnOnePage = contentHeight <= availableHeight;

    // Get translations if needed
    if (this.language !== 'en') {
      try {
        this.translatedTexts = await clientPDFTranslationService.getTranslatedPDFTexts(
          this.language,
          dynamicContent,
          fitsOnOnePage
        );
        
        // Translate dynamic content
        const translatedDynamicContent = await clientPDFTranslationService.translateDynamicContent(
          dynamicContent,
          this.language
        );
        this.translatedTexts.dynamicContent = translatedDynamicContent;
      } catch (error) {
        console.error('Failed to get PDF translations, falling back to English:', error);
        this.language = 'en';
        this.translatedTexts = null;
      }
    }

    await this.addHeader(quote);
    
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