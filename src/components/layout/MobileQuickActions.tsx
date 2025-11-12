"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, CalendarPlus, UserPlus, FilePlus2, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useToast } from "@/hooks/use-toast";

import { useTranslate } from '@/contexts/TranslationContext';
export function MobileQuickActions() {
  // Translation hooks
  const { translated: textNewClientText } = useTranslate('New Client');
  const { translated: textNewEventText } = useTranslate('New Event');
  const { translated: textNewQuoteText } = useTranslate('New Quote');
  const { translated: textOpeninventorytoscanText } = useTranslate('Open inventory to scan');
  const { translated: textScanText } = useTranslate('Scan');
  const { translated: uiQuickactionsText } = useTranslate('Quick actions');

  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { triggerHaptic } = useHapticFeedback();
  const { toast } = useToast();

  const go = (href: string, message?: string) => () => {
    triggerHaptic("selection");
    setOpen(false);
    if (message) {
      toast({ title: message });
    }
    router.push(href);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        className="fixed left-1/2 -translate-x-1/2 h-14 w-14 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-xl shadow-gray-900/30 dark:shadow-gray-100/30 hover:scale-[1.03] active:scale-95 transition-transform z-[9998]"
        style={{ 
          bottom: `max(calc(72px + env(safe-area-inset-bottom)), 80px)` 
        }}
        onClick={() => setOpen(true)}
        size="icon"
      >
        <Plus className="h-7 w-7" />
      </Button>

      {/* Bottom Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl border-border/40">
          <SheetHeader>
            <SheetTitle>{uiQuickactionsText}</SheetTitle>
          </SheetHeader>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <ActionCard icon={QrCode} label={textScanText} onClick={go("/inventory", textOpeninventorytoscanText)}/>
            <ActionCard icon={FilePlus2} label={textNewQuoteText} onClick={go("/quotes")}/>
            <ActionCard icon={CalendarPlus} label={textNewEventText} onClick={go("/events")}/>
            <ActionCard icon={UserPlus} label={textNewClientText} onClick={go("/clients")}/>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ActionCard({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-2 rounded-2xl p-4 bg-card/70 backdrop-blur border border-border/40 hover:bg-card/90 transition-colors"
    >
      <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 grid place-items-center group-active:scale-95 transition-transform">
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-sm">{label}</span>
    </button>
  );
}
