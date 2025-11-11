"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, FileText, ArrowLeft, Upload, Image as ImageIcon, Eye, RotateCcw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface PDFBrandingSettings {
  companyName?: string;
  companyTagline?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  useTextLogo?: boolean;
}

export default function PDFBrandingPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // PDF Branding Settings
  const [companyName, setCompanyName] = useState('');
  const [companyTagline, setCompanyTagline] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [useTextLogo, setUseTextLogo] = useState(true);

  // Load current settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/customization');
      
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const data: PDFBrandingSettings = await response.json();
      
      setCompanyName(data.companyName || 'AV RENTALS');
      setCompanyTagline(data.companyTagline || '');
      setContactEmail(data.contactEmail || '');
      setContactPhone(data.contactPhone || '');
      setLogoUrl(data.logoUrl || '');
      setUseTextLogo(data.useTextLogo ?? true);

    } catch (error) {
      console.error('Failed to load PDF branding settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load PDF branding settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const settings: PDFBrandingSettings = {
        companyName,
        companyTagline,
        contactEmail,
        contactPhone,
        logoUrl,
        useTextLogo,
      };

      const response = await fetch('/api/customization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save settings');
      }

      toast({
        title: 'Success',
        description: 'PDF branding settings saved successfully',
      });

    } catch (error) {
      console.error('Failed to save PDF branding settings:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save PDF branding settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setCompanyName('AV RENTALS');
    setCompanyTagline('Professional AV Equipment Rental');
    setContactEmail('info@av-rentals.com');
    setContactPhone('+1 (555) 123-4567');
    setLogoUrl('');
    setUseTextLogo(true);

    toast({
      title: 'Reset',
      description: 'PDF branding settings reset to defaults',
    });
  };

  const handleGeneratePreview = () => {
    setIsGeneratingPreview(true);
    toast({
      title: 'Preview Generation',
      description: 'To preview your PDF branding, go to any quote and click "Download PDF"',
    });
    setTimeout(() => setIsGeneratingPreview(false), 2000);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PNG, JPG, or SVG image',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 2MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploadingLogo(true);

      // Convert to base64 for preview and storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoUrl(base64String);
        toast({
          title: 'Logo Uploaded',
          description: 'Your logo has been uploaded. Don\'t forget to save changes!',
        });
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Failed to upload logo:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload logo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    toast({
      title: 'Logo Removed',
      description: 'Logo has been removed. Don\'t forget to save changes!',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/settings')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              PDF Branding
            </h1>
            <p className="text-muted-foreground mt-1">
              Customize how your company appears on PDF quotes and invoices
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Company Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              This information will appear in the header of all generated PDF documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company Name"
                required
              />
              <p className="text-xs text-muted-foreground">
                Displayed prominently in the PDF header
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyTagline">Company Tagline</Label>
              <Input
                id="companyTagline"
                value={companyTagline}
                onChange={(e) => setCompanyTagline(e.target.value)}
                placeholder="Professional AV Equipment Rental"
              />
              <p className="text-xs text-muted-foreground">
                Optional subtitle that appears below the company name
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Contact details displayed on PDF documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="info@yourcompany.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Logo Settings</CardTitle>
            <CardDescription>
              Configure how your logo appears in PDF documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="useTextLogo">Use Text Logo</Label>
                <p className="text-xs text-muted-foreground">
                  Display company name as text instead of image logo
                </p>
              </div>
              <Switch
                id="useTextLogo"
                checked={useTextLogo}
                onCheckedChange={setUseTextLogo}
              />
            </div>

            {!useTextLogo && (
              <div className="space-y-4">
                {/* Best Resolution Guidelines */}
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Recommended Logo Specifications
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• <strong>Best Resolution:</strong> 300 x 100 pixels (3:1 aspect ratio)</li>
                    <li>• <strong>Maximum Size:</strong> 2MB</li>
                    <li>• <strong>Formats:</strong> PNG (recommended for transparency), JPG, or SVG</li>
                    <li>• <strong>DPI:</strong> 300 DPI for print quality PDFs</li>
                    <li>• <strong>Background:</strong> Transparent PNG works best</li>
                  </ul>
                </div>

                {/* Upload Options */}
                <div className="space-y-3">
                  <Label>Upload Logo</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={isUploadingLogo}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        disabled={isUploadingLogo}
                      >
                        {isUploadingLogo ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Logo Image
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload a high-quality logo image for professional PDF documents
                  </p>
                </div>

                {/* Or URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Or Enter Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={logoUrl && !logoUrl.startsWith('data:') ? logoUrl : ''}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    disabled={logoUrl.startsWith('data:')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alternatively, provide a direct URL to your logo
                  </p>
                </div>

                {/* Logo Preview */}
                {logoUrl && (
                  <div className="space-y-2">
                    <Label>Logo Preview</Label>
                    <div className="relative p-6 border-2 rounded-lg bg-muted/30 flex items-center justify-center">
                      <img
                        src={logoUrl}
                        alt="Logo preview"
                        className="max-h-24 max-w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '';
                          e.currentTarget.alt = 'Failed to load logo';
                        }}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveLogo}
                      >
                        Remove
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This is how your logo will appear in PDF headers
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview and Example Card */}
        <Card>
          <CardHeader>
            <CardTitle>Preview Your Branding</CardTitle>
            <CardDescription>
              See how your branding will appear on PDF documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 border-2 border-dashed rounded-lg bg-muted/30">
              <div className="text-right space-y-1">
                <h2 className="text-2xl font-bold">{companyName || 'Company Name'}</h2>
                {companyTagline && (
                  <p className="text-sm text-muted-foreground">{companyTagline}</p>
                )}
                {contactEmail && (
                  <p className="text-xs text-muted-foreground">{contactEmail}</p>
                )}
                {contactPhone && (
                  <p className="text-xs text-muted-foreground">{contactPhone}</p>
                )}
              </div>
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">QUOTE</h3>
                    <p className="text-sm font-semibold mt-2">Q-2024-001</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Date: November 11, 2025
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">Sample Quote</p>
                    <p className="text-muted-foreground mt-1">For demonstration</p>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGeneratePreview}
              disabled={isGeneratingPreview}
            >
              {isGeneratingPreview ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  How to Preview Full PDF
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isSaving || !companyName}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
