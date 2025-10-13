
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Settings, ArrowLeft, RotateCcw, Palette, Building, Lock, Eye, Upload, Image as ImageIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import LightRays from '@/components/LightRays';

const customizationSchema = z.object({
  // Branding
  companyName: z.string().min(1),
  companyTagline: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  useTextLogo: z.boolean().optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),

  // Theme
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  darkMode: z.boolean().optional(),
  
  // Login Page General
  loginBackgroundType: z.enum(['gradient', 'solid', 'image', 'lightrays']),
  loginBackgroundColor1: z.string().optional(),
  loginBackgroundColor2: z.string().optional(),
  loginBackgroundImage: z.string().optional(),
  loginCardOpacity: z.number().min(0).max(1),
  loginCardBlur: z.boolean(),
  loginCardPosition: z.enum(['center', 'left', 'right']),
  loginCardWidth: z.number().min(300).max(600),
  loginCardBorderRadius: z.number().min(0).max(24),
  loginCardShadow: z.enum(['none', 'small', 'medium', 'large', 'xl']),
  loginLogoUrl: z.string().optional(),
  loginLogoSize: z.number().min(40).max(120),
  loginWelcomeMessage: z.string(),
  loginWelcomeSubtitle: z.string(),
  loginFooterText: z.string().optional(),
  loginShowCompanyName: z.boolean(),
  loginFormSpacing: z.number().min(8).max(32),
  loginButtonStyle: z.enum(['default', 'rounded', 'pill']),
  loginInputStyle: z.enum(['default', 'rounded', 'underline']),
  loginAnimations: z.boolean(),
  
  // LightRays Background Settings
  loginLightRaysOrigin: z.enum(['top-center', 'top-left', 'top-right', 'right', 'left', 'bottom-center', 'bottom-right', 'bottom-left']),
  loginLightRaysColor: z.string(),
  loginLightRaysSpeed: z.number().min(0).max(5),
  loginLightRaysSpread: z.number().min(0).max(2),
  loginLightRaysLength: z.number().min(0).max(3),
  loginLightRaysPulsating: z.boolean(),
  loginLightRaysFadeDistance: z.number().min(0).max(2),
  loginLightRaysSaturation: z.number().min(0).max(2),
  loginLightRaysFollowMouse: z.boolean(),
  loginLightRaysMouseInfluence: z.number().min(0).max(1),
  loginLightRaysNoiseAmount: z.number().min(0).max(1),
  loginLightRaysDistortion: z.number().min(0).max(0.5),

  // Advanced
  customCSS: z.string().optional(),
  footerText: z.string().optional(),
  version: z.number().optional(),
});

type CustomizationSettings = z.infer<typeof customizationSchema>;

type CustomizationFormValues = z.infer<typeof customizationSchema>;

export default function AdminCustomizationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<CustomizationFormValues | null>(null);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Branding states
  const [companyName, setCompanyName] = useState('AV Rentals');
  const [companyTagline, setCompanyTagline] = useState('Professional Audio Visual Equipment Rental');
  const [contactEmail, setContactEmail] = useState('info@avrental.com');
  const [contactPhone, setContactPhone] = useState('+1 (555) 123-4567');
  const [useTextLogo, setUseTextLogo] = useState(true);

  // Theme states
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#F3F4F6');
  const [accentColor, setAccentColor] = useState('#10B981');
  const [darkMode, setDarkMode] = useState(false);

  // Advanced states
  const [version, setVersion] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Login states
  const [loginBackgroundType, setLoginBackgroundType] = useState<'gradient' | 'solid' | 'image' | 'lightrays'>('gradient');

  const [loginBackgroundColor1, setLoginBackgroundColor1] = useState('#0F1419');
  const [loginBackgroundColor2, setLoginBackgroundColor2] = useState('#1E293B'); // Slate-800
  const [loginBackgroundImage, setLoginBackgroundImage] = useState('');
  const [loginCardOpacity, setLoginCardOpacity] = useState(0.95);
  const [loginCardBlur, setLoginCardBlur] = useState(true); // Enable glassmorphism by default
  const [loginCardPosition, setLoginCardPosition] = useState<'center' | 'left' | 'right'>('center');
  const [loginCardWidth, setLoginCardWidth] = useState(400);
  const [loginCardBorderRadius, setLoginCardBorderRadius] = useState(8);
  const [loginCardShadow, setLoginCardShadow] = useState<'none' | 'small' | 'medium' | 'large' | 'xl'>('large');
  const [loginLogoUrl, setLoginLogoUrl] = useState('');
  const [loginLogoSize, setLoginLogoSize] = useState(80);
  const [loginWelcomeMessage, setLoginWelcomeMessage] = useState('Welcome back');
  const [loginWelcomeSubtitle, setLoginWelcomeSubtitle] = useState('Sign in to your account');
  const [loginFooterText, setLoginFooterText] = useState('');
  const [loginShowCompanyName, setLoginShowCompanyName] = useState(true);
  const [loginFormSpacing, setLoginFormSpacing] = useState(16);
  const [loginButtonStyle, setLoginButtonStyle] = useState<'default' | 'rounded' | 'pill'>('default');
  const [loginInputStyle, setLoginInputStyle] = useState<'default' | 'rounded' | 'underline'>('default');
  const [loginAnimations, setLoginAnimations] = useState(true);
  // LightRays Settings
  const [loginLightRaysOrigin, setLoginLightRaysOrigin] = useState<'top-center' | 'top-left' | 'top-right' | 'right' | 'left' | 'bottom-center' | 'bottom-right' | 'bottom-left'>('top-center');
  const [loginLightRaysColor, setLoginLightRaysColor] = useState('#00ffff');
  const [loginLightRaysSpeed, setLoginLightRaysSpeed] = useState(1.5);
  const [loginLightRaysSpread, setLoginLightRaysSpread] = useState(0.8);
  const [loginLightRaysLength, setLoginLightRaysLength] = useState(1.2);
  const [loginLightRaysPulsating, setLoginLightRaysPulsating] = useState(false);
  const [loginLightRaysFadeDistance, setLoginLightRaysFadeDistance] = useState(1.0);
  const [loginLightRaysSaturation, setLoginLightRaysSaturation] = useState(1.0);
  const [loginLightRaysFollowMouse, setLoginLightRaysFollowMouse] = useState(true);
  const [loginLightRaysMouseInfluence, setLoginLightRaysMouseInfluence] = useState(0.1);
  const [loginLightRaysNoiseAmount, setLoginLightRaysNoiseAmount] = useState(0.1);
  const [loginLightRaysDistortion, setLoginLightRaysDistortion] = useState(0.05);
  
  // Logo Settings
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string>('');

  // Advanced Settings
  const [customCSS, setCustomCSS] = useState('');
  const [footerText, setFooterText] = useState('');

  // Load customization settings from database
  useEffect(() => {
    loadCustomizationSettings();
  }, []);

  const loadCustomizationSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/customization');
      if (!response.ok) {
        throw new Error('Failed to load customization settings');
      }
      
      const settings: CustomizationSettings = await response.json();
      
      // Update state with loaded settings
      if (settings.companyName) setCompanyName(settings.companyName);
      if (settings.companyTagline) setCompanyTagline(settings.companyTagline);
      if (settings.contactEmail) setContactEmail(settings.contactEmail);
      if (settings.contactPhone) setContactPhone(settings.contactPhone);
      if (settings.useTextLogo !== undefined) setUseTextLogo(settings.useTextLogo);
      if (settings.primaryColor) setPrimaryColor(settings.primaryColor);
      if (settings.secondaryColor) setSecondaryColor(settings.secondaryColor);
      if (settings.accentColor) setAccentColor(settings.accentColor);
      if (settings.darkMode !== undefined) setDarkMode(settings.darkMode);
      if (settings.logoUrl) setLogoPreview(settings.logoUrl);
      if (settings.faviconUrl) setFaviconPreview(settings.faviconUrl);
      if (settings.customCSS) setCustomCSS(settings.customCSS);
      if (settings.footerText) setFooterText(settings.footerText);
      if (settings.version) setVersion(settings.version);
      
      // Login page settings
      if (settings.loginBackgroundType) setLoginBackgroundType(settings.loginBackgroundType);
      if (settings.loginBackgroundColor1) setLoginBackgroundColor1(settings.loginBackgroundColor1);
      if (settings.loginBackgroundColor2) setLoginBackgroundColor2(settings.loginBackgroundColor2);
      if (settings.loginBackgroundImage) setLoginBackgroundImage(settings.loginBackgroundImage);
      if (settings.loginCardOpacity !== undefined) setLoginCardOpacity(settings.loginCardOpacity);
      if (settings.loginCardBlur !== undefined) setLoginCardBlur(settings.loginCardBlur);
      if (settings.loginCardPosition) setLoginCardPosition(settings.loginCardPosition);
      if (settings.loginCardWidth !== undefined) setLoginCardWidth(settings.loginCardWidth);
      if (settings.loginCardBorderRadius !== undefined) setLoginCardBorderRadius(settings.loginCardBorderRadius);
      if (settings.loginCardShadow) setLoginCardShadow(settings.loginCardShadow);
      if (settings.loginLogoUrl) setLoginLogoUrl(settings.loginLogoUrl);
      if (settings.loginLogoSize !== undefined) setLoginLogoSize(settings.loginLogoSize);
      if (settings.loginWelcomeMessage) setLoginWelcomeMessage(settings.loginWelcomeMessage);
      if (settings.loginWelcomeSubtitle) setLoginWelcomeSubtitle(settings.loginWelcomeSubtitle);
      if (settings.loginFooterText) setLoginFooterText(settings.loginFooterText);
      if (settings.loginShowCompanyName !== undefined) setLoginShowCompanyName(settings.loginShowCompanyName);
      if (settings.loginFormSpacing !== undefined) setLoginFormSpacing(settings.loginFormSpacing);
      if (settings.loginButtonStyle) setLoginButtonStyle(settings.loginButtonStyle);
      if (settings.loginInputStyle) setLoginInputStyle(settings.loginInputStyle);
      if (settings.loginAnimations !== undefined) setLoginAnimations(settings.loginAnimations);
      if (settings.loginLightRaysOrigin) setLoginLightRaysOrigin(settings.loginLightRaysOrigin);
      if (settings.loginLightRaysColor) setLoginLightRaysColor(settings.loginLightRaysColor);
      if (settings.loginLightRaysSpeed != null) setLoginLightRaysSpeed(settings.loginLightRaysSpeed);
      if (settings.loginLightRaysSpread != null) setLoginLightRaysSpread(settings.loginLightRaysSpread);
      if (settings.loginLightRaysLength != null) setLoginLightRaysLength(settings.loginLightRaysLength);
      if (settings.loginLightRaysPulsating != null) setLoginLightRaysPulsating(settings.loginLightRaysPulsating);
      if (settings.loginLightRaysFadeDistance != null) setLoginLightRaysFadeDistance(settings.loginLightRaysFadeDistance);
      if (settings.loginLightRaysSaturation != null) setLoginLightRaysSaturation(settings.loginLightRaysSaturation);
      if (settings.loginLightRaysFollowMouse != null) setLoginLightRaysFollowMouse(settings.loginLightRaysFollowMouse);
      if (settings.loginLightRaysMouseInfluence != null) setLoginLightRaysMouseInfluence(settings.loginLightRaysMouseInfluence);
      if (settings.loginLightRaysNoiseAmount != null) setLoginLightRaysNoiseAmount(settings.loginLightRaysNoiseAmount);
      if (settings.loginLightRaysDistortion != null) setLoginLightRaysDistortion(settings.loginLightRaysDistortion);
      if (settings.loginWelcomeMessage) setLoginWelcomeMessage(settings.loginWelcomeMessage);
      if (settings.loginFooterText) setLoginFooterText(settings.loginFooterText);
      
    } catch (err) {
      console.error('Error loading customization settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load customization settings',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveCustomizationSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const settings: CustomizationSettings = {
        companyName,
        companyTagline,
        contactEmail,
        contactPhone,
        useTextLogo,
        primaryColor,
        secondaryColor,
        accentColor,
        darkMode,
        logoUrl: logoPreview,
        faviconUrl: faviconPreview,
        customCSS,
        footerText,
        version,
        // Login page settings
        loginBackgroundType,
        loginBackgroundColor1,
        loginBackgroundColor2,
        loginBackgroundImage,
        loginCardOpacity,
        loginCardBlur,
        loginCardPosition,
        loginCardWidth,
        loginCardBorderRadius,
        loginCardShadow,
        loginLogoUrl,
        loginLogoSize,
        loginWelcomeMessage,
        loginWelcomeSubtitle,
        loginFooterText,
        loginShowCompanyName,
        loginFormSpacing,
        loginButtonStyle,
        loginInputStyle,
        loginAnimations,
        loginLightRaysOrigin,
        loginLightRaysColor,
        loginLightRaysSpeed,
        loginLightRaysSpread,
        loginLightRaysLength,
        loginLightRaysPulsating,
        loginLightRaysFadeDistance,
        loginLightRaysSaturation,
        loginLightRaysFollowMouse,
        loginLightRaysMouseInfluence,
        loginLightRaysNoiseAmount,
        loginLightRaysDistortion,
      };
      
      const response = await fetch('/api/customization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }
      
      const updatedSettings = await response.json();
      setVersion(updatedSettings.version);
      
      toast({
        title: 'Success',
        description: 'Customization settings saved successfully!',
      });
      
    } catch (err) {
      console.error('Error saving customization settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save settings',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFaviconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLoginBackgroundImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate background styles
  const getBackgroundStyle = () => {
    switch (loginBackgroundType) {
      case 'solid':
        return {
          background: loginBackgroundColor1 || '#0F1419',
        };
      case 'image':
        return {
          background: loginBackgroundImage ? `url(${loginBackgroundImage}) cover center no-repeat` : undefined,
        };
      case 'lightrays':
        return {
          background: '#0a0a0a', // Dark base for light rays
        };
      case 'gradient':
      default:
        return {
          background: `linear-gradient(135deg, ${loginBackgroundColor1 || '#0F1419'} 0%, ${loginBackgroundColor2 || '#1E293B'} 100%)`,
        };
    }
  };

  const resetToDefaults = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/customization', {
        method: 'POST', // Reset endpoint
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset to defaults');
      }
      
      // Reload settings after reset
      await loadCustomizationSettings();
      
      toast({
        title: "Settings Reset",
        description: "Settings have been reset to default values.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading customization settings...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customization</h1>
          <p className="text-muted-foreground">
            Customize your application's appearance, branding, and settings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults} disabled={isSaving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={saveCustomizationSettings} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="login">Login Page</TabsTrigger>
          <TabsTrigger value="logos">Logos & Icons</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Company Information & Logo
              </CardTitle>
              <CardDescription>
                Configure your company's name, contact details, and logo preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name" className="text-base font-semibold">Company Name (Primary Logo)</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your Company Name"
                    className="text-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be displayed as your primary logo throughout the application.
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 p-4 bg-muted/20 rounded-lg">
                  <Switch
                    id="use-text-logo"
                    checked={useTextLogo}
                    onCheckedChange={setUseTextLogo}
                  />
                  <Label htmlFor="use-text-logo" className="font-medium">Use company name as logo</Label>
                  <span className="text-sm text-muted-foreground ml-2">
                    (Recommended - prioritizes text over image uploads)
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Contact Phone</Label>
                  <Input
                    id="contact-phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company-tagline">Company Tagline</Label>
                <Textarea
                  id="company-tagline"
                  value={companyTagline}
                  onChange={(e) => setCompanyTagline(e.target.value)}
                  placeholder="A brief description of your company"
                  rows={3}
                />
              </div>
              
              {/* Logo Preview */}
              <div className="p-4 border rounded-lg bg-background">
                <p className="text-sm font-medium mb-2">Logo Preview:</p>
                <div className="flex items-center gap-2 p-2 bg-muted/10 rounded">
                  {useTextLogo ? (
                    <>
                      <Building className="h-6 w-6 text-primary" />
                      <h1 
                        className="text-lg font-semibold"
                        style={{ color: primaryColor }}
                      >
                        {companyName || 'Your Company Name'}
                      </h1>
                    </>
                  ) : logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview"
                      className="h-6 w-auto max-w-[120px] object-contain"
                    />
                  ) : (
                    <span className="text-muted-foreground">No logo selected</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Scheme
              </CardTitle>
              <CardDescription>
                Customize the color palette for your application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#F3F4F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent-color"
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      placeholder="#10B981"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
                <Label htmlFor="dark-mode">Enable Dark Mode</Label>
              </div>
              
              <div className="p-4 border rounded-lg bg-muted/20">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <div className="flex gap-2">
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: primaryColor }}
                    title="Primary Color"
                  />
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: secondaryColor }}
                    title="Secondary Color"
                  />
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: accentColor }}
                    title="Accent Color"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="login" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Settings Panel */}
            <div className="space-y-6">
              {/* Background Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Background Settings
                  </CardTitle>
                  <CardDescription>
                    Customize the background appearance of your login page.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label>Background Type</Label>
                    <RadioGroup
                      value={loginBackgroundType}
  onValueChange={(value: 'gradient' | 'solid' | 'image' | 'lightrays') => setLoginBackgroundType(value)}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gradient" id="gradient" />
                        <Label htmlFor="gradient">Gradient</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="solid" id="solid" />
                        <Label htmlFor="solid">Solid Color</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="image" id="image" />
                        <Label htmlFor="image">Background Image</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="lightrays" id="lightrays" />
                        <Label htmlFor="lightrays">LightRays</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {loginBackgroundType === 'gradient' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bg-color1">Start Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="bg-color1"
                            type="color"
                            value={loginBackgroundColor1}
                            onChange={(e) => setLoginBackgroundColor1(e.target.value)}
                            className="w-16 h-10 p-1 border rounded"
                          />
                          <Input
                            value={loginBackgroundColor1}
                            onChange={(e) => setLoginBackgroundColor1(e.target.value)}
                            placeholder="#0F1419"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bg-color2">End Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="bg-color2"
                            type="color"
                            value={loginBackgroundColor2}
                            onChange={(e) => setLoginBackgroundColor2(e.target.value)}
                            className="w-16 h-10 p-1 border rounded"
                          />
                          <Input
                            value={loginBackgroundColor2}
                            onChange={(e) => setLoginBackgroundColor2(e.target.value)}
                            placeholder="#1E293B"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {loginBackgroundType === 'solid' && (
                    <div className="space-y-2">
                      <Label htmlFor="bg-solid">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="bg-solid"
                          type="color"
                          value={loginBackgroundColor1}
                          onChange={(e) => setLoginBackgroundColor1(e.target.value)}
                          className="w-16 h-10 p-1 border rounded"
                        />
                        <Input
                          value={loginBackgroundColor1}
                          onChange={(e) => setLoginBackgroundColor1(e.target.value)}
                          placeholder="#0F1419"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  )}

                  {loginBackgroundType === 'image' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bg-image">Background Image URL</Label>
                        <Input
                          id="bg-image"
                          value={loginBackgroundImage}
                          onChange={(e) => setLoginBackgroundImage(e.target.value)}
                          placeholder="https://example.com/background.jpg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bg-image-upload">Or Upload Image</Label>
                        <Input
                          id="bg-image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleBackgroundImageUpload}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {loginBackgroundType === 'lightrays' && (
                    <div className="space-y-4">
                      <Label>LightRays Settings</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Origin</Label>
                          <Select value={loginLightRaysOrigin} onValueChange={(value: any) => setLoginLightRaysOrigin(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top-center">Top Center</SelectItem>
                              <SelectItem value="top-left">Top Left</SelectItem>
                              <SelectItem value="top-right">Top Right</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="bottom-center">Bottom Center</SelectItem>
                              <SelectItem value="bottom-right">Bottom Right</SelectItem>
                              <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={loginLightRaysColor}
                              onChange={(e) => setLoginLightRaysColor(e.target.value)}
                              className="w-16 h-10 p-1 border rounded"
                            />
                            <Input
                              value={loginLightRaysColor}
                              onChange={(e) => setLoginLightRaysColor(e.target.value)}
                              placeholder="#00ffff"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Speed: {loginLightRaysSpeed}</Label>
                          <Slider
                            value={[loginLightRaysSpeed]}
                            onValueChange={([value]) => setLoginLightRaysSpeed(value)}
                            max={5}
                            min={0}
                            step={0.1}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Spread: {loginLightRaysSpread}</Label>
                          <Slider
                            value={[loginLightRaysSpread]}
                            onValueChange={([value]) => setLoginLightRaysSpread(value)}
                            max={2}
                            min={0}
                            step={0.1}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Length: {loginLightRaysLength}</Label>
                          <Slider
                            value={[loginLightRaysLength]}
                            onValueChange={([value]) => setLoginLightRaysLength(value)}
                            max={3}
                            min={0}
                            step={0.1}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fade Distance: {loginLightRaysFadeDistance}</Label>
                          <Slider
                            value={[loginLightRaysFadeDistance]}
                            onValueChange={([value]) => setLoginLightRaysFadeDistance(value)}
                            max={2}
                            min={0}
                            step={0.1}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Saturation: {loginLightRaysSaturation}</Label>
                          <Slider
                            value={[loginLightRaysSaturation]}
                            onValueChange={([value]) => setLoginLightRaysSaturation(value)}
                            max={2}
                            min={0}
                            step={0.1}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Mouse Influence: {loginLightRaysMouseInfluence}</Label>
                          <Slider
                            value={[loginLightRaysMouseInfluence]}
                            onValueChange={([value]) => setLoginLightRaysMouseInfluence(value)}
                            max={1}
                            min={0}
                            step={0.01}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Noise Amount: {loginLightRaysNoiseAmount}</Label>
                          <Slider
                            value={[loginLightRaysNoiseAmount]}
                            onValueChange={([value]) => setLoginLightRaysNoiseAmount(value)}
                            max={1}
                            min={0}
                            step={0.01}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Distortion: {loginLightRaysDistortion}</Label>
                          <Slider
                            value={[loginLightRaysDistortion]}
                            onValueChange={([value]) => setLoginLightRaysDistortion(value)}
                            max={0.5}
                            min={0}
                            step={0.01}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="pulsating"
                          checked={loginLightRaysPulsating}
                          onCheckedChange={setLoginLightRaysPulsating}
                        />
                        <Label htmlFor="pulsating">Pulsating</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="follow-mouse"
                          checked={loginLightRaysFollowMouse}
                          onCheckedChange={setLoginLightRaysFollowMouse}
                        />
                        <Label htmlFor="follow-mouse">Follow Mouse</Label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Login Card Settings
                  </CardTitle>
                  <CardDescription>
                    Customize the appearance and layout of the login form card.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Card Position</Label>
                      <Select value={loginCardPosition} onValueChange={(value: 'center' | 'left' | 'right') => setLoginCardPosition(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Card Width: {loginCardWidth}px</Label>
                      <Slider
                        value={[loginCardWidth]}
                        onValueChange={([value]) => setLoginCardWidth(value)}
                        max={600}
                        min={300}
                        step={20}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Border Radius: {loginCardBorderRadius}px</Label>
                      <Slider
                        value={[loginCardBorderRadius]}
                        onValueChange={([value]) => setLoginCardBorderRadius(value)}
                        max={24}
                        min={0}
                        step={2}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Shadow Style</Label>
                      <Select value={loginCardShadow} onValueChange={(value) => setLoginCardShadow(value as 'none' | 'small' | 'medium' | 'large' | 'xl')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                          <SelectItem value="xl">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Card Opacity: {loginCardOpacity.toFixed(2)}</Label>
                    <Slider
                      value={[loginCardOpacity]}
                      onValueChange={([value]) => setLoginCardOpacity(value)}
                      max={1}
                      min={0.1}
                      step={0.05}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="card-blur"
                      checked={loginCardBlur}
                      onCheckedChange={setLoginCardBlur}
                    />
                    <Label htmlFor="card-blur">Enable Glassmorphism Effect</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="login-animations"
                      checked={loginAnimations}
                      onCheckedChange={setLoginAnimations}
                    />
                    <Label htmlFor="login-animations">Enable Animations</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Content Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Content & Styling
                  </CardTitle>
                  <CardDescription>
                    Customize the text, logo, and form styling.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-company"
                      checked={loginShowCompanyName}
                      onCheckedChange={setLoginShowCompanyName}
                    />
                    <Label htmlFor="show-company">Show Company Name</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="welcome-msg">Welcome Message</Label>
                      <Input
                        id="welcome-msg"
                        value={loginWelcomeMessage}
                        onChange={(e) => setLoginWelcomeMessage(e.target.value)}
                        placeholder="Welcome back"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="welcome-subtitle">Subtitle</Label>
                      <Input
                        id="welcome-subtitle"
                        value={loginWelcomeSubtitle}
                        onChange={(e) => setLoginWelcomeSubtitle(e.target.value)}
                        placeholder="Sign in to your account"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-logo">Custom Login Logo URL</Label>
                      <Input
                        id="login-logo"
                        value={loginLogoUrl}
                        onChange={(e) => setLoginLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Logo Size: {loginLogoSize}px</Label>
                      <Slider
                        value={[loginLogoSize]}
                        onValueChange={([value]) => setLoginLogoSize(value)}
                        max={120}
                        min={40}
                        step={10}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Button Style</Label>
                      <Select value={loginButtonStyle} onValueChange={(value: 'default' | 'rounded' | 'pill') => setLoginButtonStyle(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="rounded">Rounded</SelectItem>
                          <SelectItem value="pill">Pill</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Input Style</Label>
                      <Select value={loginInputStyle} onValueChange={(value: 'default' | 'rounded' | 'underline') => setLoginInputStyle(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="rounded">Rounded</SelectItem>
                          <SelectItem value="underline">Underline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Form Spacing: {loginFormSpacing}px</Label>
                      <Slider
                        value={[loginFormSpacing]}
                        onValueChange={([value]) => setLoginFormSpacing(value)}
                        max={32}
                        min={8}
                        step={4}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footer-msg">Footer Text</Label>
                    <Input
                      id="footer-msg"
                      value={loginFooterText}
                      onChange={(e) => setLoginFooterText(e.target.value)}
                      placeholder="© 2025 Your Company. All rights reserved."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Live Preview
                  </CardTitle>
                  <CardDescription>
                    See how your login page will look with current settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`relative w-full h-[500px] rounded-lg overflow-hidden border transition-all duration-300 ${
                      loginAnimations ? 'hover:scale-[1.02]' : ''
                    }`}
                    style={getBackgroundStyle()}
                  >
                    {/* Background overlay for image */}
                    {loginBackgroundType === 'image' && (
                      <div className="absolute inset-0 bg-black bg-opacity-40" />
                    )}

                    {/* LightRays background */}
                    {loginBackgroundType === 'lightrays' && (
                      <div className="absolute inset-0 z-0">
                        <LightRays
                          raysOrigin={loginLightRaysOrigin}
                          raysColor={loginLightRaysColor}
                          raysSpeed={loginLightRaysSpeed}
                          lightSpread={loginLightRaysSpread}
                          rayLength={loginLightRaysLength}
                          pulsating={loginLightRaysPulsating}
                          fadeDistance={loginLightRaysFadeDistance}
                          saturation={loginLightRaysSaturation}
                          followMouse={loginLightRaysFollowMouse}
                          mouseInfluence={loginLightRaysMouseInfluence}
                          noiseAmount={loginLightRaysNoiseAmount}
                          distortion={loginLightRaysDistortion}
                          className="w-full h-full"
                        />
                      </div>
                    )}
                    
                    {/* Login Card Preview */}
                    <div
                      className={`absolute inset-0 flex p-4 z-10 ${
                        loginCardPosition === 'left'
                          ? 'justify-start items-center'
                          : loginCardPosition === 'right'
                          ? 'justify-end items-center'
                          : 'justify-center items-center'
                      }`}
                    >
                      <div 
                        className={`bg-card text-card-foreground border transition-all duration-300 ${
                          loginAnimations ? 'hover:scale-105' : ''
                        } ${
                          loginCardShadow === 'none' ? '' :
                          loginCardShadow === 'small' ? 'shadow-sm' :
                          loginCardShadow === 'medium' ? 'shadow-md' :
                          loginCardShadow === 'large' ? 'shadow-lg' :
                          loginCardShadow === 'xl' ? 'shadow-xl' : 'shadow-lg'
                        }`}
                        style={{
                          width: `${Math.min(loginCardWidth, 500)}px`,
                          maxWidth: '90%',
                          borderRadius: `${loginCardBorderRadius}px`,
                          backgroundColor: loginCardBlur 
                            ? `rgba(15, 20, 25, ${loginCardOpacity})` 
                            : `rgba(15, 20, 25, ${loginCardOpacity})`,
                          backdropFilter: loginCardBlur ? 'blur(12px) saturate(180%)' : 'none',
                          border: loginCardBlur ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid hsl(var(--border))',
                          padding: `${Math.max(loginFormSpacing, 16)}px`,
                        }}
                      >
                        {/* Logo Section */}
                        <div className="text-center mb-6">
                          <div 
                            className="mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-300"
                            style={{
                              width: `${loginLogoSize}px`,
                              height: `${loginLogoSize}px`,
                              backgroundColor: primaryColor,
                            }}
                          >
                            {loginLogoUrl ? (
                              <img 
                                src={loginLogoUrl} 
                                alt="Logo"
                                className="object-contain"
                                style={{
                                  width: `${loginLogoSize * 0.7}px`,
                                  height: `${loginLogoSize * 0.7}px`,
                                }}
                              />
                            ) : (
                              <Building 
                                className="text-white"
                                style={{
                                  width: `${loginLogoSize * 0.5}px`,
                                  height: `${loginLogoSize * 0.5}px`,
                                }}
                              />
                            )}
                          </div>
                          
                          {loginShowCompanyName && (
                            <h1 
                              className="text-2xl font-bold mb-2 text-foreground"
                              style={{ color: 'hsl(var(--foreground))' }}
                            >
                              {companyName || 'AV Rentals'}
                            </h1>
                          )}
                          
                          <h2 className="text-lg font-semibold text-foreground mb-1">
                            {loginWelcomeMessage}
                          </h2>
                          
                          <p className="text-sm text-muted-foreground">
                            {loginWelcomeSubtitle}
                          </p>
                        </div>

                        {/* Form Preview */}
                        <div className="space-y-4" style={{ gap: `${loginFormSpacing}px` }}>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Username</label>
                            <div 
                              className={`h-10 bg-input border border-border transition-colors ${
                                loginInputStyle === 'rounded' ? 'rounded-full px-4' :
                                loginInputStyle === 'underline' ? 'rounded-none border-0 border-b-2 bg-transparent' :
                                'rounded-md px-3'
                              }`}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Password</label>
                            <div 
                              className={`h-10 bg-input border border-border transition-colors ${
                                loginInputStyle === 'rounded' ? 'rounded-full px-4' :
                                loginInputStyle === 'underline' ? 'rounded-none border-0 border-b-2 bg-transparent' :
                                'rounded-md px-3'
                              }`}
                            />
                          </div>
                          
                          <button 
                            className={`w-full h-10 text-white font-medium transition-all duration-200 hover:opacity-90 ${
                              loginAnimations ? 'hover:scale-[1.02]' : ''
                            } ${
                              loginButtonStyle === 'pill' ? 'rounded-full' :
                              loginButtonStyle === 'rounded' ? 'rounded-lg' :
                              'rounded-md'
                            }`}
                            style={{ backgroundColor: primaryColor }}
                          >
                            Sign In
                          </button>
                          
                          <div className="text-center">
                            <a 
                              href="#" 
                              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Forgot your password?
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Preview */}
                    {loginFooterText && (
                      <div className="absolute bottom-4 left-0 right-0 text-center">
                        <p className="text-sm text-white/80 drop-shadow-sm px-4">
                          {loginFooterText}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Preview Controls */}
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Preview Resolution:</span>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-background rounded text-xs">Desktop</span>
                        <span className="px-2 py-1 bg-background/50 rounded text-xs opacity-50">Mobile</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Presets</CardTitle>
                  <CardDescription>
                    Apply popular login page styles instantly.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLoginBackgroundType('gradient');
                        setLoginBackgroundColor1('#0F1419');
                        setLoginBackgroundColor2('#1E293B');
                        setLoginCardBlur(true);
                        setLoginCardOpacity(0.95);
                        setLoginAnimations(true);
                      }}
                    >
                      Dark Glass
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLoginBackgroundType('solid');
                        setLoginBackgroundColor1('#ffffff');
                        setLoginCardBlur(false);
                        setLoginCardOpacity(1);
                        setLoginAnimations(false);
                      }}
                    >
                      Clean White
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLoginBackgroundType('gradient');
                        setLoginBackgroundColor1('#667eea');
                        setLoginBackgroundColor2('#764ba2');
                        setLoginCardBlur(true);
                        setLoginCardOpacity(0.9);
                        setLoginButtonStyle('pill');
                      }}
                    >
                      Modern Blue
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLoginBackgroundType('gradient');
                        setLoginBackgroundColor1('#2D1B69');
                        setLoginBackgroundColor2('#11998e');
                        setLoginCardBlur(true);
                        setLoginInputStyle('rounded');
                        setLoginButtonStyle('rounded');
                      }}
                    >
                      Ocean Depths
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logos" className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Logo images are now used as fallback options only. 
              Company name text logo is prioritized and recommended for better accessibility and consistency.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Company Logo (Fallback)
                </CardTitle>
                <CardDescription>
                  Upload your company logo as a fallback when text logo is disabled. Recommended size: 200x60px (PNG or SVG)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  {logoPreview ? (
                    <div className="space-y-4">
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="max-h-16 mx-auto"
                      />
                      <p className="text-sm text-muted-foreground">
                        {logoFile?.name}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="mt-4"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Favicon
                </CardTitle>
                <CardDescription>
                  Upload your favicon. Recommended size: 32x32px (ICO or PNG)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  {faviconPreview ? (
                    <div className="space-y-4">
                      <img
                        src={faviconPreview}
                        alt="Favicon Preview"
                        className="w-8 h-8 mx-auto"
                      />
                      <p className="text-sm text-muted-foreground">
                        {faviconFile?.name}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*,.ico"
                    onChange={handleFaviconUpload}
                    className="mt-4"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Advanced customization options for power users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-css">Custom CSS</Label>
                <Textarea
                  id="custom-css"
                  placeholder="/* Add your custom CSS here */"
                  rows={8}
                  className="font-mono text-sm"
                  value={customCSS}
                  onChange={(e) => setCustomCSS(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Add custom CSS to override default styles. Use with caution.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="footer-text">Custom Footer Text</Label>
                <Input
                  id="footer-text"
                  placeholder="© 2024 Your Company Name. All rights reserved."
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}