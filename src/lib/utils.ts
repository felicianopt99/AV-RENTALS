import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Responsive grid utilities
export function responsiveGrid(baseColumns: number, mdColumns?: number, lgColumns?: number) {
  return cn(
    `grid grid-cols-${baseColumns}`,
    mdColumns && `md:grid-cols-${mdColumns}`,
    lgColumns && `lg:grid-cols-${lgColumns}`
  )
}

// Mobile-first responsive height utilities
export function responsiveHeight(mobile: string, desktop?: string) {
  return cn(
    mobile,
    desktop && `md:${desktop}`
  )
}

// Safe area utilities for mobile
export function safeAreaPadding(position: 'top' | 'bottom' | 'all' = 'all') {
  const paddingMap = {
    top: 'pt-[env(safe-area-inset-top)]',
    bottom: 'pb-[env(safe-area-inset-bottom)]',
    all: 'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]'
  }
  return paddingMap[position]
}

// Responsive text sizing
export function responsiveText(size: 'sm' | 'base' | 'lg' | 'xl') {
  const sizeMap = {
    sm: 'text-sm md:text-base',
    base: 'text-base md:text-lg',
    lg: 'text-lg md:text-xl',
    xl: 'text-xl md:text-2xl'
  }
  return sizeMap[size]
}
