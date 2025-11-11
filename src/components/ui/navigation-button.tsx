"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
  label: string;
  showArrow?: boolean;
  variant?: 'primary' | 'navigation' | 'default';
  size?: 'default' | 'sm' | 'lg';
}

export function NavigationButton({ 
  icon: Icon, 
  label, 
  showArrow = true, 
  variant = 'navigation',
  size = 'default',
  className,
  ...props 
}: NavigationButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "group justify-between w-full text-left",
        "transition-all duration-200 ease-out",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon className="h-5 w-5 transition-colors duration-200" />
        )}
        <span className="font-medium">{label}</span>
      </div>
      {showArrow && (
        <ChevronRight className="h-4 w-4 opacity-60 transition-opacity duration-200 group-hover:opacity-100" />
      )}
    </Button>
  );
}

// Preset navigation button variants
export function PrimaryNavigationButton(props: Omit<NavigationButtonProps, 'variant'>) {
  return <NavigationButton {...props} variant="primary" />;
}

export function SecondaryNavigationButton(props: Omit<NavigationButtonProps, 'variant'>) {
  return <NavigationButton {...props} variant="navigation" />;
}