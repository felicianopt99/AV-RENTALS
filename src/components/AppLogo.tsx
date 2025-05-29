import { Building } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export function AppLogo() {
  return (
    <div className="flex items-center gap-2 p-2">
      <Building className="h-6 w-6 text-primary" />
      <h1 className="text-lg font-semibold text-foreground">
        {APP_NAME}
      </h1>
    </div>
  );
}
