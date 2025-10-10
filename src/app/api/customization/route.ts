import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Simple in-memory cache for customization settings
let customizationCache: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const customizationSchema = z.object({
  // Branding
  companyName: z.string().optional(),
  companyTagline: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  
  // Logo Options
  useTextLogo: z.boolean().optional(),
  
  // Theme
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  darkMode: z.boolean().optional(),
  
  // Logos (fallback options)
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  
  // Login Page Customization
  loginBackgroundType: z.enum(['gradient', 'solid', 'image']).optional(),
  loginBackgroundColor1: z.string().optional(),
  loginBackgroundColor2: z.string().optional(),
  loginBackgroundImage: z.string().optional(),
  loginCardOpacity: z.number().min(0).max(1).optional(),
  loginCardBlur: z.boolean().optional(),
  loginCardPosition: z.enum(['center', 'left', 'right']).optional(),
  loginCardWidth: z.number().min(300).max(600).optional(),
  loginCardBorderRadius: z.number().min(0).max(24).optional(),
  loginCardShadow: z.enum(['none', 'small', 'medium', 'large', 'xl']).optional(),
  loginLogoUrl: z.string().optional(),
  loginLogoSize: z.number().min(40).max(120).optional(),
  loginWelcomeMessage: z.string().optional(),
  loginWelcomeSubtitle: z.string().optional(),
  loginFooterText: z.string().optional(),
  loginShowCompanyName: z.boolean().optional(),
  loginFormSpacing: z.number().min(8).max(32).optional(),
  loginButtonStyle: z.enum(['default', 'rounded', 'pill']).optional(),
  loginInputStyle: z.enum(['default', 'rounded', 'underline']).optional(),
  loginAnimations: z.boolean().optional(),
  
  // Advanced
  customCSS: z.string().optional(),
  footerText: z.string().optional(),
  
  // System Settings
  systemName: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
  
  // Security
  sessionTimeout: z.number().optional(),
  requireStrongPasswords: z.boolean().optional(),
  enableTwoFactor: z.boolean().optional(),
  maxLoginAttempts: z.number().optional(),
  
  // Email
  emailEnabled: z.boolean().optional(),
  smtpServer: z.string().optional(),
  smtpPort: z.string().optional(),
  smtpUsername: z.string().optional(),
  smtpPassword: z.string().optional(),
  fromEmail: z.string().email().optional().or(z.literal('')),
  
  // Backup
  autoBackup: z.boolean().optional(),
  backupFrequency: z.string().optional(),
  backupRetention: z.number().optional(),
});

// GET /api/customization - Get current customization settings
export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (customizationCache && (now - cacheTimestamp) < CACHE_DURATION) {
      const response = NextResponse.json(customizationCache);
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      return response;
    }

    // Get the first (and should be only) customization record
    let settings = await prisma.customizationSettings.findFirst();
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.customizationSettings.create({
        data: {
          companyName: 'AV Rentals',
          companyTagline: 'Professional Audio Visual Equipment Rental',
          contactEmail: 'info@avrental.com',
          contactPhone: '+1 (555) 123-4567',
          useTextLogo: true,
          primaryColor: '#3B82F6',
          secondaryColor: '#F3F4F6',
          accentColor: '#10B981',
          darkMode: false,
          loginBackgroundType: 'gradient',
          loginBackgroundColor1: '#0F1419',
          loginBackgroundColor2: '#1E293B',
          loginCardOpacity: 0.95,
          loginCardBlur: true,
          loginCardPosition: 'center',
          loginCardWidth: 400,
          loginCardBorderRadius: 8,
          loginCardShadow: 'large',
          loginLogoSize: 80,
          loginWelcomeMessage: 'Welcome back',
          loginWelcomeSubtitle: 'Sign in to your account',
          loginShowCompanyName: true,
          loginFormSpacing: 16,
          loginButtonStyle: 'default',
          loginInputStyle: 'default',
          loginAnimations: true,
          systemName: 'AV Rentals Management System',
          timezone: 'Europe/Madrid',
          dateFormat: 'DD/MM/YYYY',
          currency: 'EUR',
          language: 'en',
          sessionTimeout: 24,
          requireStrongPasswords: true,
          enableTwoFactor: false,
          maxLoginAttempts: 5,
          emailEnabled: true,
          smtpPort: '587',
          fromEmail: 'noreply@avrental.com',
          autoBackup: true,
          backupFrequency: 'daily',
          backupRetention: 30,
        },
      });
    }
    
    // Update cache
    customizationCache = settings;
    cacheTimestamp = Date.now();
    
    const response = NextResponse.json(settings);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('Error fetching customization settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customization settings' },
      { status: 500 }
    );
  }
}

// PUT /api/customization - Update customization settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = customizationSchema.parse(body);
    
    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== undefined)
    );
    
    // Try to find existing settings
    const existingSettings = await prisma.customizationSettings.findFirst();
    
    let updatedSettings;
    if (existingSettings) {
      // Update existing settings
      updatedSettings = await prisma.customizationSettings.update({
        where: { id: existingSettings.id },
        data: cleanData,
      });
    } else {
      // Create new settings
      updatedSettings = await prisma.customizationSettings.create({
        data: cleanData,
      });
    }
    
    // Invalidate cache
    customizationCache = null;
    cacheTimestamp = 0;
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating customization settings:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update customization settings' },
      { status: 500 }
    );
  }
}

// POST /api/customization/reset - Reset to default settings
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'reset') {
      // Delete existing settings and create new defaults
      await prisma.customizationSettings.deleteMany();
      
      const defaultSettings = await prisma.customizationSettings.create({
        data: {
          companyName: 'AV Rentals',
          companyTagline: 'Professional Audio Visual Equipment Rental',
          contactEmail: 'info@avrental.com',
          contactPhone: '+1 (555) 123-4567',
          useTextLogo: true,
          primaryColor: '#3B82F6',
          secondaryColor: '#F3F4F6',
          accentColor: '#10B981',
          darkMode: false,
          systemName: 'AV Rentals Management System',
          timezone: 'Europe/Madrid',
          dateFormat: 'DD/MM/YYYY',
          currency: 'EUR',
          language: 'en',
          sessionTimeout: 24,
          requireStrongPasswords: true,
          enableTwoFactor: false,
          maxLoginAttempts: 5,
          emailEnabled: true,
          smtpPort: '587',
          fromEmail: 'noreply@avrental.com',
          autoBackup: true,
          backupFrequency: 'daily',
          backupRetention: 30,
        },
      });
      
      return NextResponse.json(defaultSettings);
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error resetting customization settings:', error);
    return NextResponse.json(
      { error: 'Failed to reset customization settings' },
      { status: 500 }
    );
  }
}