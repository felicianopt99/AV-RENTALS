#!/bin/bash

# AI Configuration Helper Script

echo "🤖 Setting up AI features for AV Rentals"
echo ""

# Check if API key is already set
if grep -q "^GOOGLE_GENAI_API_KEY=" /home/home/Acrobaticz/AV-RENTALS/.env.local; then
    echo "✅ Google AI API key is configured"
    echo "Current key: $(grep "^GOOGLE_GENAI_API_KEY=" /home/home/Acrobaticz/AV-RENTALS/.env.local | cut -d'"' -f2 | sed 's/\(.\{10\}\).*/\1.../')"
    echo ""
    read -p "Do you want to update it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing key."
        exit 0
    fi
fi

echo ""
echo "📋 To get a Google AI API key:"
echo "1. Go to https://makersuite.google.com/app/apikey"
echo "2. Sign in with your Google account"  
echo "3. Click 'Create API Key'"
echo "4. Copy the key (starts with AIza...)"
echo ""

read -p "Enter your Google AI API key: " api_key

if [[ -z "$api_key" ]]; then
    echo "❌ No API key provided. Exiting."
    exit 1
fi

# Validate key format
if [[ ! "$api_key" =~ ^AIza[A-Za-z0-9_-]{35}$ ]]; then
    echo "⚠️  Warning: API key doesn't match expected Google format"
    echo "Expected format: AIza... (39 characters total)"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled."
        exit 1
    fi
fi

# Update the .env.local file
sed -i "s/GOOGLE_GENAI_API_KEY=.*/GOOGLE_GENAI_API_KEY=\"$api_key\"/" /home/home/Acrobaticz/AV-RENTALS/.env.local

echo "✅ API key configured successfully!"
echo ""

# Test the AI functionality
echo "🧪 Testing AI configuration..."

# Restart the service to load new environment
echo "🔄 Restarting service to load new configuration..."
sudo systemctl restart av-rentals.service

echo "⏳ Waiting for service to start..."
sleep 10

# Test the AI endpoint
echo "🧪 Testing AI endpoint..."
response=$(curl -s -X POST http://localhost:3000/api/ai/analyze-equipment \
  -H "Content-Type: application/json" \
  -d '{"input":"Professional wireless microphone system","type":"description"}')

if echo "$response" | grep -q '"success":true'; then
    echo "✅ AI is working correctly!"
    echo ""
    echo "🎉 AI features are now enabled!"
    echo "You can use AI to:"
    echo "  • Auto-analyze equipment from descriptions"
    echo "  • Extract product info from URLs"
    echo "  • Auto-categorize equipment"
    echo "  • Estimate rental rates"
else
    echo "❌ AI test failed. Response:"
    echo "$response" | jq . 2>/dev/null || echo "$response"
    echo ""
    echo "💡 Try these troubleshooting steps:"
    echo "1. Check if your API key is correct"
    echo "2. Verify your Google AI account has credits"
    echo "3. Check the logs: tail -f /home/home/Acrobaticz/AV-RENTALS/logs/app.log"
fi

echo ""
echo "🌐 Your site: https://acrobaticzrental.duckdns.org"