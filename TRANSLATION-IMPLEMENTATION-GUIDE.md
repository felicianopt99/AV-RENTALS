# Gemini Translation - Full Website Implementation Guide

## ✅ Implementation Status

### Completed Components

1. **✅ Translation Infrastructure**
   - Gemini API integration with gemini-2.5-flash
   - In-memory caching system
   - Batch translation support
   - Error handling with fallbacks

2. **✅ Core Context & Hooks**
   - `TranslationContext` with full API integration
   - `useTranslation()` hook
   - `useTranslate()` hook for component-level translations
   - `tBatch()` for efficient batch translations
   - `preloadTranslations()` for background loading

3. **✅ Translation Components**
   - `<T>` - Simple text wrapper component
   - `<NavLabel>` - Navigation-specific component
   - `<PreloadTranslations>` - Background preloader
   - `<TranslatedText>` - Styled text component

4. **✅ Layout Translation**
   - ✅ AppLayout (Logout button and messages)
   - ✅ AppSidebarNav (All navigation items)
   - ✅ Admin section labels
   - ✅ Sub-menu items
   - Language toggle button (already working)

5. **✅ API Endpoints**
   - `/api/translate` - Single & batch translation
   - `/api/translate/test` - Health check endpoint

## 🎯 How To Use Translations

### Method 1: Using the `<T>` Component (Simplest)

```tsx
import { T } from '@/components/translation/TranslatedComponents';

export function MyComponent() {
  return (
    <div>
      <h1><T>Welcome to AV Rentals</T></h1>
      <p><T>Manage your equipment easily</T></p>
    </div>
  );
}
```

### Method 2: Using the `useTranslate` Hook

```tsx
import { useTranslate } from '@/components/translation/TranslatedComponents';

export function MyComponent() {
  const { translated: title, isLoading } = useTranslate('Dashboard');
  const { translated: subtitle } = useTranslate('Equipment Management');

  return (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {isLoading && <span>Loading...</span>}
    </div>
  );
}
```

### Method 3: Using the Context Directly

```tsx
import { useTranslation } from '@/contexts/TranslationContext';

export function MyComponent() {
  const { t, language, setLanguage } = useTranslation();
  const [text, setText] = useState('');

  useEffect(() => {
    t('Hello World').then(setText);
  }, [t]);

  return <div>{text}</div>;
}
```

### Method 4: Batch Translation (Most Efficient)

```tsx
import { useTranslation } from '@/contexts/TranslationContext';

export function MyComponent() {
  const { tBatch } = useTranslation();
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    const textsToTranslate = ['Dashboard', 'Equipment', 'Rentals', 'Clients'];
    tBatch(textsToTranslate).then(setItems);
  }, [tBatch]);

  return (
    <ul>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}
```

### Method 5: Preload Translations (Best Performance)

```tsx
import { PreloadTranslations } from '@/components/translation/TranslatedComponents';

export function MyPage() {
  // These will be cached in the background
  const commonTexts = [
    'Save', 'Cancel', 'Delete', 'Edit', 'Add', 'Create'
  ];

  return (
    <>
      <PreloadTranslations texts={commonTexts} />
      <YourContent />
    </>
  );
}
```

## 📋 Step-by-Step: Translating a Component

### Example: Equipment Page

**Before:**
```tsx
export function EquipmentPage() {
  return (
    <div>
      <h1>Equipment List</h1>
      <button>Add Equipment</button>
      <p>No equipment found</p>
    </div>
  );
}
```

**After:**
```tsx
import { T, PreloadTranslations } from '@/components/translation/TranslatedComponents';

export function EquipmentPage() {
  return (
    <>
      <PreloadTranslations texts={['Equipment List', 'Add Equipment', 'No equipment found']} />
      <div>
        <h1><T>Equipment List</T></h1>
        <button><T>Add Equipment</T></button>
        <p><T>No equipment found</T></p>
      </div>
    </>
  );
}
```

## 📚 Pre-built Translation Constants

Use these for common UI text:

```tsx
import {
  CommonTranslations,
  NavigationTranslations,
  EquipmentTranslations,
  RentalTranslations,
  ClientTranslations
} from '@/components/translation/TranslatedComponents';

// Example usage
<T>{CommonTranslations.save}</T>  // "Save"
<T>{NavigationTranslations.dashboard}</T>  // "Dashboard"
<T>{EquipmentTranslations.addEquipment}</T>  // "Add Equipment"
```

## 🎨 Components Already Translated

### ✅ Layout Components
- AppLayout (sidebar footer, logout)
- AppSidebarNav (all navigation items)
- Navigation tooltips
- Admin section

### 🔄 Components To Translate Next

#### High Priority (User-facing text):
1. **Dashboard** (`/src/components/dashboard/DashboardContent.tsx`)
   - Stats cards
   - Welcome messages
   - Action buttons

2. **Equipment** (`/src/app/equipment/` and `/src/components/equipment/`)
   - Equipment list headers
   - Form labels
   - Status badges
   - Action buttons

3. **Clients** (`/src/app/clients/` and `/src/components/clients/`)
   - Client list
   - Form fields
   - Contact information labels

4. **Rentals** (`/src/app/rentals/` and `/src/components/rentals/`)
   - Rental calendar
   - Event details
   - Date labels
   - Status indicators

5. **Maintenance** (`/src/app/maintenance/` and `/src/components/maintenance/`)
   - Maintenance logs
   - Schedule items
   - Priority labels

#### Medium Priority (Forms & Modals):
6. **Dialog Components** (`/src/components/ui/dialog.tsx`)
7. **Form Components** (`/src/components/*/forms/`)
8. **Toast Notifications** (Throughout app)

#### Low Priority (Settings & Admin):
9. **Admin Pages** (`/src/app/admin/`)
10. **Settings Pages**
11. **Profile Pages**

## 🚀 Quick Translation Commands

### Test a translation:
```bash
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Your text here", "targetLang": "pt"}'
```

### Batch translate:
```bash
curl -X PUT http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"texts": ["Text 1", "Text 2", "Text 3"], "targetLang": "pt"}'
```

### Use the helper script:
```bash
chmod +x translate-helper.sh
./translate-helper.sh demo
./translate-helper.sh translate "Your text"
./translate-helper.sh batch '["Text 1","Text 2"]'
```

## 🔍 Finding Text to Translate

### Search for hardcoded strings:
```bash
# Find components with hardcoded text
grep -r "return.*<.*>[A-Z]" src/components/ --include="*.tsx"

# Find button text
grep -r "<Button.*>[A-Z]" src/ --include="*.tsx"

# Find headings
grep -r "<h[1-6].*>[A-Z]" src/ --include="*.tsx"

# Find paragraphs
grep -r "<p.*>[A-Z]" src/ --include="*.tsx"
```

## ⚡ Performance Optimization

### 1. Preload Common Translations
Add this to your main layout or page:

```tsx
import { usePreloadCommonTranslations } from '@/components/translation/TranslatedComponents';

export function MyLayout() {
  usePreloadCommonTranslations(); // Loads all common UI text
  return <>{children}</>;
}
```

### 2. Use Batch Translation for Lists

```tsx
// ❌ Bad - Multiple API calls
items.map(item => <T>{item.name}</T>)

// ✅ Good - Single batch call
const { tBatch } = useTranslation();
const [translatedNames, setTranslatedNames] = useState([]);

useEffect(() => {
  tBatch(items.map(i => i.name)).then(setTranslatedNames);
}, [items, tBatch]);

return translatedNames.map(name => <div>{name}</div>);
```

### 3. Cache is Automatic
- Translations are cached automatically
- Cache persists during the session
- Switching back to English is instant (no API call)

## 🐛 Troubleshooting

### Translation Not Showing
1. Check if server is running: `curl http://localhost:3000/api/translate/test`
2. Check browser console for errors
3. Verify language is set to 'pt' (use language toggle)
4. Clear cache and reload

### Slow First Load
- Normal! First translation requires API call
- Subsequent loads use cache (instant)
- Use `PreloadTranslations` component to load in background

### Mixed Languages
- Clear translation cache: Call `clearTranslationCache()` from context
- Reload the page
- Check if language switching is working properly

## 📊 Translation Coverage Status

| Component | Status | Priority |
|-----------|--------|----------|
| Navigation | ✅ Complete | High |
| Layout | ✅ Complete | High |
| Dashboard | 🔄 Partial | High |
| Equipment | ❌ Not Started | High |
| Clients | ❌ Not Started | High |
| Rentals | ❌ Not Started | High |
| Maintenance | ❌ Not Started | Medium |
| Quotes | ❌ Not Started | Medium |
| Admin | ❌ Not Started | Low |
| Forms | ❌ Not Started | Medium |
| Dialogs | ❌ Not Started | Medium |

## 🎯 Next Steps

1. **Translate high-priority pages** (Dashboard, Equipment, Clients, Rentals)
2. **Add translation to forms** (Use form labels and validation messages)
3. **Translate toast notifications** (Success/error messages)
4. **Add translation to dialogs** (Confirmation messages)
5. **Translate table headers** (Column names)
6. **Add date/time formatting** (Localized dates for Portuguese)

## 💡 Best Practices

1. **Keep strings short and simple** - Better for caching and API costs
2. **Use consistent terminology** - Same English text = same translation
3. **Avoid translating technical terms** - "QR Code", "PDF", "API" stay the same
4. **Test with real users** - Portuguese users should review translations
5. **Monitor API usage** - Check Google AI Studio dashboard for quota
6. **Handle plurals carefully** - Portuguese has different plural rules
7. **Don't translate code** - Variable names, IDs, etc. stay in English

## 🔗 Resources

- Translation Context: `/src/contexts/TranslationContext.tsx`
- Translation Components: `/src/components/translation/TranslatedComponents.tsx`
- Translation API: `/src/app/api/translate/route.ts`
- Translation Library: `/src/lib/translation.ts`
- Gemini Setup Guide: `/GEMINI-TRANSLATION-SETUP.md`

---

**Status:** 🚀 Translation system fully operational and ready for site-wide implementation!
**Model:** gemini-2.5-flash (Google's fastest model)
**Languages:** English ↔ Portuguese (European)
**Cache:** Enabled with in-memory storage
**Performance:** Sub-second after first load

