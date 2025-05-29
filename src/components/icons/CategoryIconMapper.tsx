import {
  Mic,
  Videotape,
  Zap,
  Cuboid,
  Speaker,
  Camera,
  ListTree,
  HelpCircle,
  LucideProps,
  Projector,
  Lightbulb,
  Drum,
  Cable,
  Settings,
  Layers
} from 'lucide-react';
import type { FC } from 'react';

interface CategoryIconMapperProps extends LucideProps {
  iconName?: string;
}

const iconMap: Record<string, FC<LucideProps>> = {
  Mic,
  Videotape,
  Zap,
  Cuboid,
  Speaker,
  Camera,
  ListTree,
  Projector,
  Lightbulb,
  Drum,
  Cable,
  Settings,
  Layers,
  HelpCircle, // Default icon
};

export const CategoryIconMapper: FC<CategoryIconMapperProps> = ({ iconName, ...props }) => {
  const IconComponent = iconName && iconMap[iconName] ? iconMap[iconName] : HelpCircle;
  return <IconComponent {...props} />;
};
