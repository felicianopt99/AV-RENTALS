
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, Building, Eye, EyeOff } from 'lucide-react';
import LightRays from '@/components/LightRays';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface CustomizationSettings {
  companyName?: string;
  companyTagline?: string;
  useTextLogo?: boolean;
  logoUrl?: string;
  primaryColor?: string;
  loginBackgroundType?: 'gradient' | 'solid' | 'image' | 'lightrays';
  loginBackgroundColor1?: string;
  loginBackgroundColor2?: string;
  loginBackgroundImage?: string;
  loginCardOpacity?: number;
  loginCardBlur?: boolean;
  loginCardPosition?: 'center' | 'left' | 'right';
  loginCardWidth?: number;
  loginCardBorderRadius?: number;
  loginCardShadow?: string;
  loginLogoUrl?: string;
  loginLogoSize?: number;
  loginWelcomeMessage?: string;
  loginWelcomeSubtitle?: string;
  loginFooterText?: string;
  loginShowCompanyName?: boolean;
  loginFormSpacing?: number;
  loginButtonStyle?: 'default' | 'rounded' | 'pill';
  loginInputStyle?: 'default' | 'rounded' | 'underline';
  loginAnimations?: boolean;
  // LightRays Background Settings
  loginLightRaysOrigin?: 'top-center' | 'top-left' | 'top-right' | 'right' | 'left' | 'bottom-center' | 'bottom-right' | 'bottom-left';
  loginLightRaysColor?: string;
  loginLightRaysSpeed?: number;
  loginLightRaysSpread?: number;
  loginLightRaysLength?: number;
  loginLightRaysPulsating?: boolean;
  loginLightRaysFadeDistance?: number;
  loginLightRaysSaturation?: number;
  loginLightRaysFollowMouse?: boolean;
  loginLightRaysMouseInfluence?: number;
  loginLightRaysNoiseAmount?: number;
  loginLightRaysDistortion?: number;
}

export default function CustomizableLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState<CustomizationSettings>({});
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Load customization settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/customization');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to load customization settings:', error);
      } finally {
        setIsSettingsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    
    console.log('Form data being submitted:', data);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.log('Error response:', error);
        throw new Error(error.error || 'Login failed');
      }

      const result = await response.json();
      
      toast({
        title: 'Login successful',
        description: `Welcome back, ${result.user.name}!`,
      });

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Please check your credentials and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Generate background styles
  const getBackgroundStyle = () => {
    if (!isSettingsLoaded) return {};
    
    switch (settings.loginBackgroundType) {
      case 'solid':
        return {
          backgroundColor: settings.loginBackgroundColor1 || '#0F1419',
        };
      case 'image':
        return {
          backgroundImage: settings.loginBackgroundImage ? `url(${settings.loginBackgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        };
      case 'lightrays':
        return {
          backgroundColor: '#0a0a0a', // Dark base for light rays
        };
      case 'gradient':
      default:
        return {
          background: `linear-gradient(135deg, ${settings.loginBackgroundColor1 || '#0F1419'} 0%, ${settings.loginBackgroundColor2 || '#1E293B'} 100%)`,
        };
    }
  };

  // Generate card styles
  const getCardStyle = () => {
    const opacity = settings.loginCardOpacity ?? 0.95;
    const blur = settings.loginCardBlur ?? true;
    const borderRadius = settings.loginCardBorderRadius ?? 8;
    
    return {
      borderRadius: `${borderRadius}px`,
      backgroundColor: blur 
        ? `rgba(15, 20, 25, ${opacity})` 
        : `rgba(15, 20, 25, ${opacity})`,
      backdropFilter: blur ? 'blur(12px) saturate(180%)' : 'none',
      border: blur ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid hsl(var(--border))',
      padding: `${Math.max(settings.loginFormSpacing || 16, 16)}px`,
    };
  };

  // Generate shadow class
  const getShadowClass = () => {
    const shadow = settings.loginCardShadow || 'large';
    switch (shadow) {
      case 'none': return '';
      case 'small': return 'shadow-sm';
      case 'medium': return 'shadow-md';
      case 'large': return 'shadow-lg';
      case 'xl': return 'shadow-xl';
      default: return 'shadow-lg';
    }
  };

  // Generate button classes
  const getButtonClasses = () => {
    const style = settings.loginButtonStyle || 'default';
    const baseClasses = 'w-full transition-all duration-200 hover:opacity-90';
    const animationClasses = settings.loginAnimations ? 'hover:scale-[1.02]' : '';
    
    switch (style) {
      case 'pill': return `${baseClasses} rounded-full ${animationClasses}`;
      case 'rounded': return `${baseClasses} rounded-lg ${animationClasses}`;
      default: return `${baseClasses} rounded-md ${animationClasses}`;
    }
  };

  // Generate input classes
  const getInputClasses = () => {
    const style = settings.loginInputStyle || 'default';
    const baseClasses = 'transition-colors';
    
    switch (style) {
      case 'rounded': return `${baseClasses} rounded-full px-4`;
      case 'underline': return `${baseClasses} rounded-none border-0 border-b-2 bg-transparent px-0`;
      default: return `${baseClasses} rounded-md px-3`;
    }
  };

  // Generate position classes for the card within the centered container
  const getCardPositionClasses = () => {
    const position = settings.loginCardPosition || 'center';
    switch (position) {
      case 'left': return 'mr-auto';
      case 'right': return 'ml-auto';
      default: return 'mx-auto';
    }
  };
    
  const displayName = settings.companyName || 'AV Rentals';
  const welcomeMessage = settings.loginWelcomeMessage || 'Welcome back';
  const welcomeSubtitle = settings.loginWelcomeSubtitle || 'Sign in to your account';
  const logoSize = settings.loginLogoSize || 80;

  if (!isSettingsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex px-4 relative transition-all duration-300 items-center justify-center overflow-hidden"
      style={getBackgroundStyle()}
    >
      {/* LightRays Background */}
      {settings.loginBackgroundType === 'lightrays' && (
        <div className="absolute inset-0 z-0">
          <LightRays
            raysOrigin={settings.loginLightRaysOrigin || 'top-center'}
            raysColor={settings.loginLightRaysColor || '#00ffff'}
            raysSpeed={settings.loginLightRaysSpeed || 1.5}
            lightSpread={settings.loginLightRaysSpread || 0.8}
            rayLength={settings.loginLightRaysLength || 1.2}
            pulsating={settings.loginLightRaysPulsating || false}
            fadeDistance={settings.loginLightRaysFadeDistance || 1.0}
            saturation={settings.loginLightRaysSaturation || 1.0}
            followMouse={settings.loginLightRaysFollowMouse || true}
            mouseInfluence={settings.loginLightRaysMouseInfluence || 0.1}
            noiseAmount={settings.loginLightRaysNoiseAmount || 0.1}
            distortion={settings.loginLightRaysDistortion || 0.05}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Background overlay for better contrast with image backgrounds */}
      {settings.loginBackgroundType === 'image' && (
        <div className="absolute inset-0 bg-black bg-opacity-40 z-5" />
      )}
      
      <div className={`relative z-10 w-full max-w-md ${getCardPositionClasses()}`}>
        <Card 
          className={`bg-card text-card-foreground border transition-all duration-300 ${
            settings.loginAnimations ? 'hover:scale-105' : ''
          } ${getShadowClass()}`}
          style={getCardStyle()}
        >
          <CardHeader className="text-center">
            {/* Logo Section */}
            <div 
              className="mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-300"
              style={{
                width: `${logoSize}px`,
                height: `${logoSize}px`,
                backgroundColor: settings.primaryColor || 'hsl(var(--primary))',
              }}
            >
              {settings.loginLogoUrl ? (
                <img 
                  src={settings.loginLogoUrl} 
                  alt={displayName}
                  className="object-contain"
                  style={{
                    width: `${logoSize * 0.7}px`,
                    height: `${logoSize * 0.7}px`,
                  }}
                />
              ) : (
                <Building 
                  className="text-white"
                  style={{
                    width: `${logoSize * 0.5}px`,
                    height: `${logoSize * 0.5}px`,
                  }}
                />
              )}
            </div>
            
            {settings.loginShowCompanyName !== false && (
              <CardTitle 
                className="text-2xl font-bold mb-2 text-foreground"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                {displayName}
              </CardTitle>
            )}
            
            <h2 className="text-lg font-semibold text-foreground mb-1">
              {welcomeMessage}
            </h2>
            
            <CardDescription className="text-muted-foreground">
              {welcomeSubtitle}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form 
                onSubmit={form.handleSubmit(onSubmit)} 
                className="space-y-4" 
                style={{ gap: `${settings.loginFormSpacing || 16}px` }}
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Username</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter your username"
                          {...field}
                          disabled={isLoading}
                          className={getInputClasses()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...field}
                            disabled={isLoading}
                            className={getInputClasses() + ' pr-10'}
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className={getButtonClasses()}
                  disabled={isLoading}
                  style={{ backgroundColor: settings.primaryColor || 'hsl(var(--primary))' }}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
                
                <div className="text-center">
                  <a 
                    href="#" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot your password?
                  </a>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Footer Text */}
        {settings.loginFooterText && (
          <div className="text-center mt-6">
            <p className="text-sm text-white/80 drop-shadow-sm px-4">
              {settings.loginFooterText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}