"use client";

import React from 'react';

interface AutoTranslateProps {
  children: React.ReactNode;
  enabled?: boolean;
  excludeSelectors?: string[];
}

export default function AutoTranslate({ 
  children, 
  enabled = true 
}: AutoTranslateProps) {
  return (
    <div className="auto-translate-container">
      {children}
    </div>
  );
}
