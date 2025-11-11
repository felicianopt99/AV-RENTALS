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
    default: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm border border-blue-600/20',
    secondary: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/60 dark:border-slate-600/60',
    destructive: 'bg-red-600 hover:bg-red-700 text-white shadow-sm border border-red-600/20'
  };

  if (!isMobile) return null;

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'fixed z-40 rounded-full',
        'transition-all duration-200 ease-out',
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