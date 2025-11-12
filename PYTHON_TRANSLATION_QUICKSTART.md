# 🚀 Quick Start: Python Gemini Translation System

## What You Get

I've created a complete Python translation system that:

✅ **Respects Free Tier Limits**: 2 requests/minute, 250/day per API key  
✅ **Smart Rate Limiting**: Automatic delays and API key rotation  
✅ **Database Integration**: Works with your existing PostgreSQL schema  
✅ **Batch Processing**: Translates multiple texts efficiently  
✅ **Caching**: Avoids duplicate API calls by checking database first  
✅ **Multiple Languages**: Supports pt, es, fr, de, it, etc.  

## 🎯 Quick Setup (5 minutes)

1. **Run Setup Script**
   ```bash
   cd /home/feli/AV-RENTALS/scripts
   ./setup_translation.sh
   ```

2. **Add Your API Key**
   ```bash
   # Edit the .env file that was created
   nano ../.env
   
   # Add your Gemini API key:
   GOOGLE_GENERATIVE_AI_API_KEY="your-api-key-here"
   ```

3. **Test Translation**
   ```bash
   # From project root
   ./translate.sh --text "Hello World" --target-lang pt
   ```

## 📁 Files Created

```
scripts/
├── gemini_translator.py          # Main translation script
├── quick_translate.py            # Simple integration script  
├── requirements.txt              # Python dependencies
├── setup_translation.sh          # Setup script
├── sample_texts.txt              # Test data
└── TRANSLATION_SCRIPT_GUIDE.md   # Detailed documentation
```

## 💡 Common Use Cases

### 1. **Translate Missing Database Entries**
```bash
./translate.sh --translate-missing --target-lang pt --limit 50
```

### 2. **Batch Translate from File**
```bash
./translate.sh --file scripts/sample_texts.txt --target-lang pt
```

### 3. **Single Text Translation**
```bash
./translate.sh --text "Equipment Management" --target-lang pt
# Output: Gestão de Equipamentos
```

### 4. **Integration with Node.js**
```javascript
// Call from your Node.js code
const { exec } = require('child_process');

exec('./translate.sh --text "Dashboard" --target-lang pt', (err, stdout) => {
  const translation = stdout.trim();
  console.log(translation); // "Painel de Controle"
});
```

## 🔧 Integration Strategy

### Option 1: **Pre-translate Everything** (Recommended)
```bash
# Extract all UI texts (your existing script)
npm run translate:extract

# Translate them with Python (new)
./translate.sh --translate-missing --target-lang pt

# Your app uses pre-translated texts from database (no changes needed)
```

### Option 2: **Replace Translation Service**
Replace calls to your TypeScript `translateText()` with database lookups.

### Option 3: **Hybrid Approach**
Use Python for bulk translation, keep TypeScript for real-time fallbacks.

## 🚦 Rate Limiting Benefits

**With 1 API Key:**
- 2 translations/minute
- 250 translations/day
- Perfect for maintenance tasks

**With 4 API Keys:**
- 8 translations/minute  
- 1,000 translations/day
- Suitable for bulk operations

## 📊 Cost Savings

**Current Issue:** Your integrated Gemini calls are slow and may hit limits  
**New Solution:** 
- Bulk translate during off-hours
- Cache everything in database
- Real-time app uses cached translations
- Zero API calls during user interactions

## 🎯 Next Steps

1. **Run the setup script**
2. **Test with sample data**
3. **Translate your missing entries**
4. **Gradually migrate from TypeScript translator**

## 🆘 Need Help?

- Check `scripts/TRANSLATION_SCRIPT_GUIDE.md` for detailed docs
- Look at `translation.log` for debugging
- Test with small batches first (`--limit 10`)

---

**Result:** Fast, reliable translations that respect API limits and integrate seamlessly with your existing system! 🎉