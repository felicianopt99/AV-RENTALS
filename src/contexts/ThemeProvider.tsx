"use client";

import { useEffect } from "react";
import { useCustomizationSettings } from "@/hooks/useCustomizationSettings";

function hexToHSL(hex: string, fallback: string) {
  // Convert hex to HSL string for CSS variable
  if (!hex) return fallback;
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  } else {
    return fallback;
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return `${h} ${s}% ${l}%`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: settings } = useCustomizationSettings();

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.primaryColor) {
      root.style.setProperty('--primary', hexToHSL(settings.primaryColor, '220 100% 65%'));
    }
    if (settings.secondaryColor) {
      root.style.setProperty('--secondary', hexToHSL(settings.secondaryColor, '0 0% 15%'));
    }
    if (settings.accentColor) {
      root.style.setProperty('--accent', hexToHSL(settings.accentColor, '0 0% 16%'));
    }
    if (settings.darkMode !== undefined) {
      if (settings.darkMode) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings]);

  return <>{children}</>;
}
