import React from 'react';

interface CarouselProps {
  items: Array<{ id: string; image: string; title: string; description: string }>;
}

const Carousel: React.FC<CarouselProps> = ({ items }) => {
  return (
    <div className="carousel overflow-hidden relative z-[1]">
      <div className="carousel-track flex transition-transform">
        {items.map((item) => (
          <div key={item.id} className="carousel-item flex-shrink-0 w-full p-4">
            <img src={item.image} alt={item.title} className="w-full h-40 object-cover rounded-lg" />
            <h3 className="mt-2 text-lg font-bold">{item.title}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Carousel;