import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Download, Copy, Trash2, Languages } from 'lucide-react';

export default function PdfTranslationManager() {
  const { toast } = useToast();
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [targetLang, setTargetLang] = useState('pt');

  // Persist state locally so users don't lose work when switching tabs
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('pdf-translation-state') || '{}');
      if (saved.sourceText) setSourceText(saved.sourceText);
      if (saved.translatedText) setTranslatedText(saved.translatedText);
      if (saved.targetLang) setTargetLang(saved.targetLang);
    } catch {}
  }, []);

  useEffect(() => {
    const payload = { sourceText, translatedText, targetLang };
    localStorage.setItem('pdf-translation-state', JSON.stringify(payload));
  }, [sourceText, translatedText, targetLang]);

  const handleTranslate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, targetLang }),
      });
      if (!res.ok) throw new Error('Translation failed');
      const data = await res.json();
      setTranslatedText(data.translated);
      toast({ title: 'Translation Successful', description: `Translated to ${targetLang.toUpperCase()}.` });
    } catch (err) {
      toast({ title: 'Translation Error', description: 'Failed to translate PDF text.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const sourceCount = useMemo(() => sourceText.trim().length, [sourceText]);
  const translatedCount = useMemo(() => translatedText.trim().length, [translatedText]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>PDF Generator Translation Manager</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Source (English)</span>
              <span>{sourceCount} chars</span>
            </div>
            <Textarea
              value={sourceText}
              onChange={e => setSourceText(e.target.value)}
              placeholder="Enter PDF source text (English)"
              rows={10}
            />
          </div>
          <div className="md:w-56 space-y-2">
            <div className="text-xs font-medium">Target Language</div>
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Portuguese</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
                <SelectItem value="nl">Dutch</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-col gap-2">
              <Button onClick={handleTranslate} disabled={loading || !sourceText}>
                <Languages className="h-4 w-4 mr-2" />
                {loading ? 'Translating...' : 'Translate'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(translatedText || '');
                  toast({ title: 'Copied', description: 'Translated text copied to clipboard.' });
                }}
                disabled={!translatedText}
              >
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSourceText('');
                  setTranslatedText('');
                }}
                disabled={!sourceText && !translatedText}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Clear
              </Button>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Translation ({targetLang.toUpperCase()})</span>
              <span>{translatedCount} chars</span>
            </div>
            <Textarea
              value={translatedText}
              readOnly
              placeholder={`Translated PDF text (${targetLang.toUpperCase()})`}
              rows={10}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
