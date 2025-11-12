# 🚀 Translation Quick Reference

## Import Statement
```tsx
import { T, useTranslate, PreloadTranslations } from '@/components/translation/TranslatedComponents';
import { useTranslation } from '@/contexts/TranslationContext';
```

## 5 Ways to Translate

### 1. Wrap Text (Simplest) ⭐
```tsx
<h1><T>Dashboard</T></h1>
<button><T>Save Changes</T></button>
<p><T>Welcome to AV Rentals</T></p>
```

### 2. Hook (For Variables)
```tsx
const { translated: title } = useTranslate('Dashboard');
const { translated: btnText } = useTranslate('Save Changes');

return <h1>{title}</h1>;
```

### 3. Async (With Loading)
```tsx
const { t } = useTranslation();
const [text, setText] = useState('');

useEffect(() => {
  t('Loading...').then(setText);
}, [t]);

return <div>{text}</div>;
```

### 4. Batch (Most Efficient) 🔥
```tsx
const { tBatch } = useTranslation();
const [items, setItems] = useState([]);

useEffect(() => {
  tBatch(['Save', 'Cancel', 'Delete']).then(setItems);
}, [tBatch]);

return items.map(text => <button>{text}</button>);
```

### 5. Preload (Best UX)
```tsx
<PreloadTranslations texts={['Save', 'Cancel', 'Delete']} />
{/* These will be cached before they're needed */}
```

## Common Patterns

### Button with Icon
```tsx
<Button>
  <Save className="mr-2" />
  <T>Save Changes</T>
</Button>
```

### Form Label
```tsx
<Label htmlFor="name">
  <T>Equipment Name</T>
</Label>
```

### Toast Message
```tsx
const { translated } = useTranslate('Item saved successfully!');

toast({
  title: translated,
  description: <T>Your changes have been saved</T>
});
```

### Table Header
```tsx
<TableHead><T>Name</T></TableHead>
<TableHead><T>Status</T></TableHead>
<TableHead><T>Actions</T></TableHead>
```

### Conditional Text
```tsx
<Badge>
  <T>{status === 'active' ? 'Active' : 'Inactive'}</T>
</Badge>
```

## Pre-built Constants

```tsx
import { 
  CommonTranslations,
  NavigationTranslations,
  EquipmentTranslations 
} from '@/components/translation/TranslatedComponents';

// Use like this:
<T>{CommonTranslations.save}</T>  // "Save"
<T>{NavigationTranslations.dashboard}</T>  // "Dashboard"
<T>{EquipmentTranslations.addEquipment}</T>  // "Add Equipment"
```

## Language Control

```tsx
const { language, setLanguage } = useTranslation();

// Get current language
console.log(language); // 'en' or 'pt'

// Change language
setLanguage('pt');  // Switch to Portuguese
setLanguage('en');  // Switch to English
```

## Performance Tips

### ✅ DO:
```tsx
// Preload translations
<PreloadTranslations texts={['Text 1', 'Text 2']} />

// Batch translate lists
const translated = await tBatch(items.map(i => i.name));

// Use constants for common text
<T>{CommonTranslations.save}</T>
```

### ❌ DON'T:
```tsx
// Don't translate in loops without batching
items.map(i => <T>{i.name}</T>)  // Multiple API calls!

// Don't translate technical terms
<T>API</T>  // Keep as "API"
<T>QR Code</T>  // Keep as "QR Code"

// Don't translate empty strings
<T>{''}</T>  // Unnecessary
```

## Testing

```bash
# Test translation
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello World", "targetLang": "pt"}'

# Test batch
curl -X PUT http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"texts": ["Hello", "World"], "targetLang": "pt"}'

# Use helper script
./translate-helper.sh translate "Your text"
./translate-helper.sh batch '["Text 1","Text 2"]'
```

## Cheat Sheet

| Task | Code |
|------|------|
| Simple text | `<T>Text</T>` |
| With hook | `const {translated} = useTranslate('Text')` |
| Get language | `const {language} = useTranslation()` |
| Change language | `setLanguage('pt')` |
| Batch translate | `tBatch(['Text1', 'Text2'])` |
| Preload | `<PreloadTranslations texts={[...]} />` |
| Async | `const text = await t('Text')` |

## Common Translations

| English | Portuguese |
|---------|-----------|
| Save | Guardar |
| Cancel | Cancelar |
| Delete | Eliminar |
| Edit | Editar |
| Add | Adicionar |
| Create | Criar |
| Update | Atualizar |
| Search | Pesquisar |
| Filter | Filtrar |
| Export | Exportar |
| Dashboard | Painel de Controlo |
| Equipment | Equipamento |
| Rentals | Alugueres |
| Clients | Clientes |
| Maintenance | Manutenção |

---

**Need help?** Check `TRANSLATION-IMPLEMENTATION-GUIDE.md` for detailed examples!
