# Gemini Translation Script Documentation

## Overview

The `gemini_translator.py` script provides efficient, rate-limited translation using Google's Gemini API while integrating seamlessly with your existing AV-RENTALS database. It's designed to respect free tier limits and minimize API usage through smart caching and batching.

## Features

- ✅ **Rate Limiting**: Respects Gemini API free tier (2 requests/minute, 250/day)
- ✅ **Database Integration**: Works with existing PostgreSQL Translation schema
- ✅ **Smart Caching**: Avoids duplicate API calls by checking existing translations
- ✅ **Batch Processing**: Translates multiple texts in single API calls
- ✅ **Multiple API Keys**: Supports key rotation for better throughput
- ✅ **Error Handling**: Robust retry logic and fallback mechanisms
- ✅ **Progress Tracking**: Detailed logging and progress reporting

## Installation

1. **Install Python Dependencies**
   ```bash
   cd /home/feli/AV-RENTALS/scripts
   pip install -r requirements.txt
   ```

2. **Set Environment Variables**
   
   Create or update your `.env` file with:
   ```env
   # Primary API key (required)
   GOOGLE_GENERATIVE_AI_API_KEY="your-primary-gemini-api-key"
   
   # Optional: Additional keys for better throughput
   GOOGLE_GENERATIVE_AI_API_KEY_2="your-second-gemini-api-key"
   GOOGLE_GENERATIVE_AI_API_KEY_3="your-third-gemini-api-key"
   GOOGLE_GENERATIVE_AI_API_KEY_4="your-fourth-gemini-api-key"
   
   # Database connection
   DATABASE_URL="postgresql://user:password@host:port/database"
   ```

## Usage Examples

### 1. Translate a Single Text

```bash
python gemini_translator.py --text "Hello World" --target-lang pt
```

### 2. Translate Missing Database Entries

```bash
# Translate up to 100 missing Portuguese translations
python gemini_translator.py --translate-missing --target-lang pt --limit 100

# Translate all missing Spanish translations  
python gemini_translator.py --translate-missing --target-lang es
```

### 3. Translate from File

```bash
# Create a file with texts to translate
echo -e "Dashboard\nEquipment Management\nUser Settings" > texts.txt

# Translate the file
python gemini_translator.py --file texts.txt --target-lang pt --batch-size 5
```

### 4. Custom Languages

```bash
# Translate from Spanish to English
python gemini_translator.py --text "Hola Mundo" --source-lang es --target-lang en

# Translate to French
python gemini_translator.py --text "Equipment Management" --target-lang fr
```

## Command Line Options

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--text` | Single text to translate | - | `--text "Hello World"` |
| `--target-lang` | Target language code | `pt` | `--target-lang es` |
| `--source-lang` | Source language code | `en` | `--source-lang pt` |
| `--batch-size` | Number of texts per API call | `10` | `--batch-size 5` |
| `--translate-missing` | Translate missing DB entries | `false` | `--translate-missing` |
| `--limit` | Max missing translations to process | `100` | `--limit 50` |
| `--file` | File with texts (one per line) | - | `--file texts.txt` |

## Supported Languages

| Code | Language | Code | Language |
|------|----------|------|----------|
| `en` | English | `es` | Spanish |
| `pt` | Portuguese | `fr` | French |
| `de` | German | `it` | Italian |

## Rate Limiting Details

### Free Tier Limits
- **2 requests per minute** per API key
- **250 requests per day** per API key
- **30 seconds minimum** between requests

### Smart Rate Limiting Features
- Automatic key rotation when quotas are reached
- Daily usage tracking per API key
- Exponential backoff on errors
- Queue management for batch processing

### Multiple API Keys Strategy
With 4 API keys, you can achieve:
- **8 requests per minute** (4 keys × 2 req/min)
- **1000 requests per day** (4 keys × 250 req/day)
- Better reliability through redundancy

## Database Integration

### Schema Compatibility
The script works with your existing `Translation` table:

```sql
CREATE TABLE "Translation" (
  id TEXT PRIMARY KEY,
  "sourceText" TEXT NOT NULL,
  "targetLang" TEXT NOT NULL,
  "translatedText" TEXT NOT NULL,
  model TEXT DEFAULT 'gemini-1.5-flash',
  category TEXT DEFAULT 'general',
  context TEXT,
  "isAutoTranslated" BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'approved',
  "qualityScore" INTEGER DEFAULT 95,
  "usageCount" INTEGER DEFAULT 1,
  version INTEGER DEFAULT 1,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  UNIQUE("sourceText", "targetLang")
);
```

### Conflict Resolution
- **Existing translations**: Uses cached version, increments usage count
- **New translations**: Creates new record with auto-generated ID
- **Quality scoring**: Assigns quality score of 95 for auto-translations

## Integration with Existing System

### 1. Replace Current Translation Service

You can gradually migrate from your current TypeScript translation system:

```javascript
// Before: Using TypeScript translator
const translated = await translateText(text, 'pt');

// After: Using Python translator results from DB
const translation = await prisma.translation.findFirst({
  where: { sourceText: text, targetLang: 'pt' }
});
```

### 2. Batch Preprocessing

Run translations ahead of time:

```bash
# Extract all UI texts needing translation
npm run translate:extract

# Translate them with Python script
python gemini_translator.py --translate-missing --target-lang pt

# Your app now uses pre-translated texts from DB
```

### 3. Background Processing

Set up cron jobs for regular translation updates:

```bash
# Add to crontab
0 2 * * * cd /home/feli/AV-RENTALS/scripts && python gemini_translator.py --translate-missing --target-lang pt --limit 50
```

## Performance Optimization

### Batch Size Guidelines
- **Small texts (< 50 chars)**: Use batch size 15-20
- **Medium texts (50-200 chars)**: Use batch size 10-15  
- **Large texts (> 200 chars)**: Use batch size 5-10

### API Key Management
1. **Get multiple free API keys** from different Google accounts
2. **Monitor daily usage** in the logs
3. **Rotate keys manually** if needed for higher throughput

### Caching Strategy
1. **Check database first** before making API calls
2. **Reuse translations** for identical source texts
3. **Update usage counts** for popular translations

## Error Handling

### Common Issues and Solutions

#### 1. Rate Limit Exceeded
```
ERROR: Translation attempt 1 failed: quota exceeded
```
**Solution**: Script automatically waits and retries. Consider adding more API keys.

#### 2. Database Connection Issues  
```
ERROR: could not connect to server
```
**Solution**: Check `DATABASE_URL` and ensure PostgreSQL is running.

#### 3. Invalid API Key
```
ERROR: API key not valid
```
**Solution**: Verify your `GOOGLE_GENERATIVE_AI_API_KEY` in `.env` file.

### Logging

The script creates detailed logs in `translation.log`:

```
2024-01-15 10:30:15 - INFO - Processing 25 requests for en -> pt
2024-01-15 10:30:16 - INFO - Using cached translation: 'Dashboard' -> 'Painel de Controle'
2024-01-15 10:30:17 - INFO - Translating 3 new texts...
2024-01-15 10:30:45 - INFO - Successfully translated 3 texts
2024-01-15 10:30:46 - INFO - Translated: 'Equipment Management' -> 'Gestão de Equipamentos'
```

## Monitoring and Maintenance

### Daily Usage Tracking
Monitor your API usage:

```bash
# Check translation log for daily counts
grep "Record successful request" translation.log | grep "$(date +%Y-%m-%d)"

# Count translations in database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Translation\" WHERE \"createdAt\"::date = CURRENT_DATE;"
```

### Performance Metrics
```bash
# Check translation success rate
grep -c "Successfully translated" translation.log

# Check error rate  
grep -c "ERROR" translation.log

# Average translations per minute
grep "Successfully translated" translation.log | tail -20
```

## Best Practices

### 1. **Start Small**
Begin with a small batch to test:
```bash
python gemini_translator.py --translate-missing --limit 10
```

### 2. **Monitor Costs**
Even though free tier, monitor your usage:
- Track daily request counts in logs
- Set up alerts for approaching limits
- Use multiple API keys for better throughput

### 3. **Quality Control**
- Review auto-translated content for accuracy
- Update quality scores based on human review
- Use context fields for better translations

### 4. **Backup Strategy**
- Backup translation database regularly
- Export translations before major updates
- Keep logs for troubleshooting

## Integration Examples

### 1. Pre-translate New Features
```bash
# When adding new UI components
echo -e "New Feature\nAdvanced Settings\nExport Data" > new_features.txt
python gemini_translator.py --file new_features.txt --target-lang pt
```

### 2. Bulk Language Addition
```bash
# Add Spanish support
python gemini_translator.py --translate-missing --target-lang es --limit 500

# Add French support  
python gemini_translator.py --translate-missing --target-lang fr --limit 500
```

### 3. Quality Improvement Workflow
```bash
# Re-translate low quality entries
psql $DATABASE_URL -c "UPDATE \"Translation\" SET status='pending' WHERE \"qualityScore\" < 80;"
python gemini_translator.py --translate-missing --target-lang pt
```

## Troubleshooting

### Issue: Slow Performance
**Symptoms**: Taking too long to translate
**Solutions**:
- Reduce batch size: `--batch-size 5`
- Add more API keys for parallel processing
- Check database connection speed

### Issue: Inconsistent Translations
**Symptoms**: Same text getting different translations
**Solutions**:
- Check for duplicate entries in database
- Ensure unique constraints on (sourceText, targetLang)
- Clear translation cache if needed

### Issue: API Quota Exceeded
**Symptoms**: All API keys hitting daily limits
**Solutions**:
- Spread work across multiple days
- Get additional API keys from different accounts
- Reduce daily translation volume

## Future Enhancements

Potential improvements to consider:

1. **Translation Memory**: Learn from human corrections
2. **Context Awareness**: Use UI component context for better translations
3. **Quality Metrics**: Auto-detect translation quality issues
4. **Parallel Processing**: Use multiple API keys simultaneously
5. **Web Interface**: GUI for managing translations
6. **Integration Testing**: Automated tests for translation pipeline

## Support

For issues or questions:

1. **Check logs**: Review `translation.log` for errors
2. **Database queries**: Verify data with SQL queries
3. **API status**: Check Google AI Studio for API issues
4. **Rate limits**: Monitor usage in script output

---

*This script is designed to work efficiently within free tier limits while providing production-ready translation capabilities for your AV-RENTALS application.*