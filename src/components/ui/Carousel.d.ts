declare module '@/components/ui/Carousel' {
  import React from 'react';

  interface CarouselProps {
    items: Array<{ id: string; image: string; title: string; description: string }>;
  }

  const Carousel: React.FC<CarouselProps>;
  export default Carousel;
}