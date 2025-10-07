
"use client";

import QRCode from 'react-qr-code';
import type { EquipmentItem } from '@/types';

interface EquipmentLabelProps {
  item: EquipmentItem;
  companyName?: string;
}

export function EquipmentLabel({ item, companyName }: EquipmentLabelProps) {
  const qrCodeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/equipment/${item.id}/edit`
    : '';

  return (
    <div className="p-2 border border-solid border-black rounded-md break-inside-avoid flex flex-col items-center justify-center text-center bg-white aspect-[4/3]">
      {companyName && <p className="text-[8px] font-semibold text-black uppercase tracking-wider mb-1">{companyName}</p>}
      <h3 className="text-xs font-bold text-black mb-1 line-clamp-2">{item.name}</h3>
      <div className="bg-white p-1 rounded-sm w-full flex-grow flex items-center justify-center">
        {qrCodeUrl && (
           <QRCode
            value={qrCodeUrl}
            size={256} // This will be scaled down by the container
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            viewBox={`0 0 256 256`}
            />
        )}
      </div>
    </div>
  );
}
