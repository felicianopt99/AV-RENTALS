#!/bin/bash

# Quick script to check translation progress

echo "========================================="
echo "Translation Database Status"
echo "========================================="
echo ""

# Count total translations
TOTAL=$(psql "postgresql://avrentals_user:avrentals_pass@localhost:5432/avrentals_db" -t -c 'SELECT COUNT(*) FROM "Translation";')
echo "📦 Total translations in database: $TOTAL"
echo ""

# Show recent translations
echo "🕒 Most recent 10 translations:"
echo "-------------------------------------------"
psql "postgresql://avrentals_user:avrentals_pass@localhost:5432/avrentals_db" -c \
  'SELECT 
    LEFT("sourceText", 30) as "Source", 
    LEFT("translatedText", 30) as "Translated",
    "createdAt"::date as "Date"
  FROM "Translation" 
  ORDER BY "createdAt" DESC 
  LIMIT 10;'

echo ""
echo "========================================="
