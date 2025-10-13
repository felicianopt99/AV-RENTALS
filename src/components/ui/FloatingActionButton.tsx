"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useIsMobile } from '@/hooks/use-mobile';

interface FloatingActionButtonProps {
  icon?: LucideIcon;
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  label?: string;
  disabled?: boolean;
  variant?: 'default' | 'secondary' | 'destructive';
}

export function FloatingActionButton({
  icon: Icon = Plus,
  onClick,
  className,
  size = 'md',
  position = 'bottom-right',
  label,
  disabled = false,
  variant = 'default'
}: FloatingActionButtonProps) {
  const { triggerHaptic } = useHapticFeedback();
  const isMobile = useIsMobile();

  const handleClick = () => {
    if (disabled) return;
    triggerHaptic('light');
    onClick();
  };

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-14 w-14',
    lg: 'h-16 w-16'
  };

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7'
  };

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4 md:bottom-6 md:right-6',
    'bottom-left': 'bottom-20 left-4 md:bottom-6 md:left-6',
    'bottom-center': 'bottom-20 left-1/2 transform -translate-x-1/2 md:bottom-6'
  };

  const variantClasses = {
    default: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
    destructive: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
  };

  if (!isMobile) return null;

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'fixed z-40 rounded-full shadow-lg',
        'transition-all duration-200 ease-in-out',
        'hover:scale-105 active:scale-95',
        'border-2 border-background/20',
        sizeClasses[size],
        positionClasses[position],
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      size="icon"
      aria-label={label}
    >
      <Icon className={iconSizes[size]} />
    </Button>
  );
}

// Predefined FAB variants for common actions
export function AddEquipmentFAB({ onClick }: { onClick: () => void }) {
  return (
    <FloatingActionButton
      icon={Plus}
      onClick={onClick}
      label="Add Equipment"
      variant="secondary"
    />
  );
}