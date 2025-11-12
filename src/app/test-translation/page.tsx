"use client";

import { useTranslation, useTranslate } from '@/contexts/TranslationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestTranslationPage() {
  const { language, setLanguage, isTranslating } = useTranslation();
  const { translated: hello } = useTranslate('Hello, World!');
  const { translated: welcome } = useTranslate('Welcome to the translation test');
  const { translated: equipment } = useTranslate('Equipment');
  const { translated: clients } = useTranslate('Clients');
  
  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Translation Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Current Language: <strong>{language}</strong></p>
            <p className="text-sm text-muted-foreground mb-4">Translating: <strong>{isTranslating ? 'Yes' : 'No'}</strong></p>
            
            <div className="flex gap-2 mb-6">
              <Button onClick={() => setLanguage('en')} variant={language === 'en' ? 'default' : 'outline'}>
                English
              </Button>
              <Button onClick={() => setLanguage('pt')} variant={language === 'pt' ? 'default' : 'outline'}>
                Português
              </Button>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Translated Text:</h3>
            <ul className="space-y-2">
              <li className="p-2 bg-muted rounded">
                <span className="font-mono text-sm">{hello}</span>
              </li>
              <li className="p-2 bg-muted rounded">
                <span className="font-mono text-sm">{welcome}</span>
              </li>
              <li className="p-2 bg-muted rounded">
                <span className="font-mono text-sm">{equipment}</span>
              </li>
              <li className="p-2 bg-muted rounded">
                <span className="font-mono text-sm">{clients}</span>
              </li>
            </ul>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Open the browser console (F12) to see translation logs
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
