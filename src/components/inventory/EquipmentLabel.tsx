
"use client";

import React from 'react';
import QRCode from 'react-qr-code';
import type { EquipmentItem } from '@/types';

interface EquipmentLabelProps {
  item: EquipmentItem;
  companyName?: string;
}

const EquipmentLabel = React.forwardRef<HTMLDivElement, EquipmentLabelProps>(({ item, companyName }, ref) => {
  const qrCodeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/equipment/${item.id}/edit`
    : '';

  return (
    <div 
        ref={ref} 
        className="p-4 border border-solid border-border rounded-lg flex flex-col items-center justify-center text-center bg-card"
        style={{ width: 400, height: 300 }}
    >
      {companyName && <p className="text-base font-bold text-foreground uppercase tracking-wider mb-2">{companyName}</p>}
      <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">{item.name}</h3>
      <div className="bg-background p-2 rounded-md w-full flex-grow flex items-center justify-center border border-border/40">
        {qrCodeUrl && (
           <QRCode
            value={qrCodeUrl}
            size={256}
            style={{ height: "auto", maxWidth: "100%", width: "100%", maxHeight: "180px" }}
            viewBox={`0 0 256 256`}
            />
        )}
      </div>
    </div>
  );
});

EquipmentLabel.displayName = 'EquipmentLabel';

export { EquipmentLabel };
