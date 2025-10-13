
"use client";

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { useMobileNav } from '@/contexts/MobileNavContext';

// These would be your actual page components
import { DashboardContent } from '@/components/dashboard/DashboardContent';

// These would be your actual page components
import { CalendarContent } from '@/components/rentals/CalendarContent';

// These would be your actual page components
import { InventoryContent } from '@/components/inventory/InventoryContent';

// These would be your actual page components
import { ClientsContent } from '@/components/clients/ClientsContent';

// These would be your actual page components
import { QuotesContent } from '@/components/quotes/QuotesContent';

const pages = [DashboardContent, CalendarContent, InventoryContent, ClientsContent, QuotesContent];

export default function HomePage() {
  const { activeIndex, setActiveIndex } = useMobileNav();
  const [swiper, setSwiper] = useState<any>(null);

  const handleSlideChange = (swiper: any) => {
    setActiveIndex(swiper.activeIndex);
  };

  if (swiper && swiper.activeIndex !== activeIndex) {
    swiper.slideTo(activeIndex);
  }

  return (
    <div className="relative w-full h-full">
      <Swiper
        onSwiper={setSwiper}
        onSlideChange={handleSlideChange}
        initialSlide={activeIndex}
        spaceBetween={0}
        slidesPerView={1}
        style={{ 
          height: '100%',
          zIndex: 1 // Ensure carousel stays below bottom nav
        }}
        className="relative z-[1]" // Additional z-index control
      >
        {pages.map((Page, index) => (
          <SwiperSlide key={index} className="relative z-[1]">
            <div className="h-full overflow-y-auto pb-24 md:pb-0">
              <Page />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
