# AI-Powered Translation System

## Overview
This project now includes an **AI-powered translation system** that automatically translates the entire application between English and Portuguese (European) using Google AI/Gemini.

## Features
✅ **Zero translation files needed** - Translations happen on-demand via AI  
✅ **Smart caching** - Translations are cached to minimize API calls  
✅ **Auto-detection** - Detects browser language preference  
✅ **Persistent preference** - Saves language choice in localStorage  
✅ **Seamless integration** - Works with existing Google AI setup  

## How to Use

### For Users
1. Click the **language toggle button** (🌐) in the top-right header
2. Select your preferred language:
   - 🇬🇧 English
   - 🇵🇹 Português (PT)
3. The app will automatically translate all text

### For Developers

#### Basic Usage - Translate Text in Components

```tsx
import { useTranslate } from '@/contexts/TranslationContext';

function MyComponent() {
  const { translated } = useTranslate('Hello, World!');
  
  return <h1>{translated}</h1>;
}
```

#### Multiple Translations

```tsx
function MyComponent() {
  const { translated: title } = useTranslate('Dashboard');
  const { translated: subtitle } = useTranslate('Welcome back!');
  
  return (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}
```

#### Get Current Language & Switch Language

```tsx
import { useTranslation } from '@/contexts/TranslationContext';

function MyComponent() {
  const { language, setLanguage, isTranslating } = useTranslation();
  
  return (
    <div>
      <p>Current language: {language}</p>
      <button onClick={() => setLanguage('pt')}>Switch to Portuguese</button>
      {isTranslating && <p>Translating...</p>}
    </div>
  );
}
```

#### Async Translation (Advanced)

```tsx
import { useTranslation } from '@/contexts/TranslationContext';

function MyComponent() {
  const { t } = useTranslation();
  
  const handleClick = async () => {
    const translated = await t('This will be translated');
    console.log(translated);
  };
  
  return <button onClick={handleClick}>Translate</button>;
}
```

## File Structure

```
src/
├── lib/
│   └── translation.ts              # Core translation logic with AI
├── contexts/
│   └── TranslationContext.tsx      # React context for translation state
├── components/
│   └── LanguageToggle.tsx          # Language switcher component
└── app/
    └── api/
        └── translate/
            └── route.ts            # API endpoint for translations
```

## How It Works

1. **User switches language** → Preference saved to localStorage
2. **Component uses `useTranslate()`** → Checks cache first
3. **Not in cache?** → Calls `/api/translate` endpoint
4. **API calls Google AI** → Translates using Gemini model
5. **Result cached** → Future requests instant from cache
6. **Component re-renders** → Shows translated text

## Configuration

### Change AI Model
Edit `src/lib/translation.ts`:
```typescript
const result = await ai.generate({
  prompt,
  config: {
    temperature: 0.3, // Lower = more consistent
  },
});
```

### Clear Translation Cache
```typescript
import { clearTranslationCache } from '@/lib/translation';

clearTranslationCache(); // Clears server-side cache
```

## Performance Notes

- **First translation**: ~1-2 seconds (AI call)
- **Cached translation**: Instant (< 1ms)
- **Cache is per-language**: Switching back to English is instant
- **Cache persists**: Until server restart or manual clear

## Extending to Other Languages

To add more languages, update:

1. **Type definition** in `src/lib/translation.ts`:
```typescript
export type Language = 'en' | 'pt' | 'es' | 'fr';
```

2. **Language toggle** in `src/components/LanguageToggle.tsx`:
```tsx
<DropdownMenuItem onClick={() => setLanguage('es')}>
  <span className="mr-2">🇪🇸</span>
  Español
</DropdownMenuItem>
```

3. **Update prompt** to specify the correct variant:
```typescript
const prompt = `Translate to Spanish (Spain variant)...`;
```

## Best Practices

✅ **DO**: Use `useTranslate()` for static text  
✅ **DO**: Wrap all user-facing strings  
✅ **DO**: Test translations on first deployment  
❌ **DON'T**: Translate dynamic data (names, IDs, numbers)  
❌ **DON'T**: Translate technical terms (brand names, API keys)  

## Troubleshooting

### Translations not appearing?
- Check browser console for API errors
- Verify Google AI API key is configured
- Check network tab for `/api/translate` calls

### Slow translations?
- First load is slow (AI call), subsequent instant (cached)
- Consider pre-warming cache for common phrases
- Check Google AI quota

### Mixed languages showing?
- Clear cache: `localStorage.removeItem('app-language')`
- Refresh the page
- Language change clears cache automatically

## Future Improvements

- [ ] Pre-translate common phrases at build time
- [ ] Add translation management UI for admins
- [ ] Export/import translation caches
- [ ] Server-side persistent cache (database)
- [ ] Batch translation API for faster initial load
- [ ] Translation quality feedback system

## API Usage & Costs

This system uses **Google AI (Gemini)** which has:
- **Free tier**: 60 requests/minute
- **Caching**: Minimizes API calls
- **Typical usage**: ~50-100 translations per user (first visit)
- **After cache**: Zero API calls

For production, monitor your API usage in Google Cloud Console.
