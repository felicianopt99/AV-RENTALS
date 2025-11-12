# 🌍 Quick Translation Guide

## Where to Find the Language Toggle

```
┌─────────────────────────────────────────────────────┐
│  [👤]        Dashboard              [🌐] [🔔]      │ ← Header
└─────────────────────────────────────────────────────┘
                                        ↑
                                   Click here!
```

The **🌐 Languages** button is in the top-right corner of every page.

## How to Use

### Step 1: Click the Language Button
Click the 🌐 icon in the header (next to notifications bell 🔔)

### Step 2: Choose Your Language
```
┌──────────────────────┐
│ 🇬🇧 English      ✓  │ ← Currently active
│ 🇵🇹 Português (PT)   │ ← Click to switch
└──────────────────────┘
```

### Step 3: Watch the Magic! ✨
Everything translates automatically:
- Buttons
- Labels  
- Descriptions
- Messages
- Everything!

## Developer Quick Reference

### Translate any text:
```tsx
import { useTranslate } from '@/contexts/TranslationContext';

const { translated } = useTranslate('Your text here');
```

### Translate form inputs:
```tsx
import { TranslatedInput, TranslatedLabel, T } from '@/components/TranslatedComponents';

<TranslatedLabel>Equipment Name</TranslatedLabel>
<TranslatedInput placeholder="Enter name" />
<p><T>This translates too!</T></p>
```

### Get current language:
```tsx
import { useTranslation } from '@/contexts/TranslationContext';

const { language } = useTranslation(); // 'en' or 'pt'
```

## That's It!

No configuration needed. No translation files. No complexity.

**Just click, choose Portuguese, and everything translates!** 🚀🇵🇹

---

See **TRANSLATION-GUIDE.md** for full documentation.
