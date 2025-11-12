// src/components/quotes/QuotePDFPreview.tsx
// PDF Preview Modal - Updated with larger viewport sizing (95% width/height)
// Uses dynamic company branding from admin customization settings
// Future improvements: Add zoom controls, fullscreen mode, print option
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QuotePDFGenerator } from '@/lib/pdf-generator';
import { Download, FileText, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Quote } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Language } from '@/lib/translation';

import { useTranslate } from '@/contexts/TranslationContext';
interface QuotePDFPreviewProps {
  quote: Quote | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuotePDFPreview({ quote, isOpen, onClose }: QuotePDFPreviewProps) {
  // Translation hooks
  const { translated: toastTherewasanerrordownlDescText } = useTranslate('There was an error downloading the PDF.');
  const { translated: toastDownloadFailedTitleText } = useTranslate('Download Failed');
  const { translated: toastPDFDownloadedTitleText } = useTranslate('PDF Downloaded');
  const { translated: toastTherewasanerrorgenerDescText } = useTranslate('There was an error generating the PDF preview.');
  const { translated: toastPDFGenerationFailedTitleText } = useTranslate('PDF Generation Failed');

  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');

  // Generate PDF blob when quote changes or language changes
  useEffect(() => {
    if (quote && isOpen) {
      generatePDFBlob();
    }
    return () => {
      // Cleanup URL when component unmounts or quote changes
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [quote, isOpen, selectedLanguage]);

  const generatePDFBlob = async () => {
    if (!quote) return;

    try {
      setIsGenerating(true);
      const blob = await QuotePDFGenerator.generateQuotePDF(quote, { 
        download: false,
        language: selectedLanguage
      });
      setPdfBlob(blob);
      
      // Create URL for PDF preview
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: toastPDFGenerationFailedTitleText,
        description: toastTherewasanerrorgenerDescText
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    if (!quote) return;

    try {
      setIsGenerating(true);
      const languageSuffix = selectedLanguage === 'pt' ? '_pt' : '';
      await QuotePDFGenerator.generateQuotePDF(quote, {
        filename: `quote-${quote.quoteNumber}${languageSuffix}.pdf`,
        download: true,
        language: selectedLanguage
      });
      
      toast({
        title: toastPDFDownloadedTitleText,
        description: `Quote ${quote.quoteNumber} has been downloaded successfully.`
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        variant: "destructive",
        title: toastDownloadFailedTitleText,
        description: toastTherewasanerrordownlDescText
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setPdfBlob(null);
    onClose();
  };

  if (!quote) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                PDF Preview - {quote.quoteNumber}
              </DialogTitle>
              <DialogDescription>
                Preview and download the professional quote PDF
              </DialogDescription>
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-2 mr-2">
                <Languages className="h-4 w-4" />
                <Select value={selectedLanguage} onValueChange={(value: Language) => setSelectedLanguage(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPDF}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-hidden">
          <div className="p-4 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PDF Preview
            </h3>
            
            <div className="flex-1 border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center min-h-[70vh]">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Generating PDF...</p>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0 min-h-[70vh]"
                  title="PDF Preview"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>PDF preview not available</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={generatePDFBlob}
                  >
                    Retry Preview
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Quote: {quote.name} • Status: {quote.status} • Total: €{quote.totalAmount?.toFixed(2)}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button 
                onClick={downloadPDF}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}