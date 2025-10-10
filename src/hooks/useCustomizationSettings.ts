"use client";

import { useQuery } from '@tanstack/react-query';

interface CustomizationSettings {
  companyName?: string;
  logoUrl?: string;
  useTextLogo?: boolean;
  primaryColor?: string;
}

async function fetchCustomizationSettings(): Promise<CustomizationSettings> {
  const response = await fetch('/api/customization');
  if (!response.ok) {
    throw new Error('Failed to fetch customization settings');
  }
  return response.json();
}

export function useCustomizationSettings() {
  return useQuery({
    queryKey: ['customization'],
    queryFn: fetchCustomizationSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}