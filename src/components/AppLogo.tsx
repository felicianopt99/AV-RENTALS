import { Building } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { useCustomizationSettings } from '@/hooks/useCustomizationSettings';

export function AppLogo() {
  const { data: settings, isLoading } = useCustomizationSettings();

  const displayName = settings?.companyName || APP_NAME;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Building className="h-6 w-6 text-primary" />
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2">
      {settings?.useTextLogo !== false ? (
        // Prioritize text-based logo
        <>
          <Building className="h-6 w-6 text-primary" />
          <h1 
            className="text-lg font-semibold text-foreground"
            style={{ 
              color: settings?.primaryColor ? settings.primaryColor : undefined 
            }}
          >
            {displayName}
          </h1>
        </>
      ) : settings?.logoUrl ? (
        // Fallback to image logo only if text logo is explicitly disabled
        <img 
          src={settings.logoUrl} 
          alt={displayName}
          className="h-6 w-auto max-w-[120px] object-contain"
        />
      ) : (
        // Final fallback
        <>
          <Building className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">
            {displayName}
          </h1>
        </>
      )}
    </div>
  );
}
