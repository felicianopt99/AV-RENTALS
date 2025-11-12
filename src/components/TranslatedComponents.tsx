"use client";

import { useTranslate } from '@/contexts/TranslationContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

/**
 * Translated Label component
 * Automatically translates label text
 */
export function TranslatedLabel({ 
  children, 
  ...props 
}: React.ComponentPropsWithoutRef<typeof Label>) {
  const { translated } = useTranslate(children?.toString() || '');
  return <Label {...props}>{translated}</Label>;
}

/**
 * Translated Input with placeholder
 * Automatically translates placeholder text
 */
export function TranslatedInput({ 
  placeholder,
  ...props 
}: React.ComponentPropsWithoutRef<typeof Input>) {
  const { translated } = useTranslate(placeholder || '');
  return <Input {...props} placeholder={translated} />;
}

/**
 * Translated Textarea with placeholder
 * Automatically translates placeholder text
 */
export function TranslatedTextarea({ 
  placeholder,
  ...props 
}: React.ComponentPropsWithoutRef<typeof Textarea>) {
  const { translated } = useTranslate(placeholder || '');
  return <Textarea {...props} placeholder={translated} />;
}

/**
 * Translated Button
 * Automatically translates button text
 */
export function TranslatedButton({ 
  children,
  ...props 
}: React.ComponentPropsWithoutRef<typeof Button>) {
  const { translated } = useTranslate(
    typeof children === 'string' ? children : ''
  );
  
  return (
    <Button {...props}>
      {typeof children === 'string' ? translated : children}
    </Button>
  );
}

/**
 * Translated Text Span
 * Simple wrapper for inline text translation
 */
export function T({ children }: { children: string }) {
  const { translated } = useTranslate(children);
  return <>{translated}</>;
}

/**
 * Example Usage:
 * 
 * import { TranslatedLabel, TranslatedInput, TranslatedButton, T } from '@/components/TranslatedComponents';
 * 
 * <TranslatedLabel>{useTranslate('Equipment Name')}</TranslatedLabel>
 * <TranslatedInput placeholder="Enter equipment name" />
 * <TranslatedButton>{useTranslate('Save Changes')}</TranslatedButton>
 * <p><T>{useTranslate('This text will be translated')}</T></p>
 */
