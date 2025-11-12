#!/bin/bash

# Gemini Translation Helper Script
# Quick CLI tool to test translations

BASE_URL="http://localhost:3000"
COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'

# Function to print colored output
print_success() {
    echo -e "${COLOR_GREEN}✓ $1${COLOR_RESET}"
}

print_info() {
    echo -e "${COLOR_BLUE}ℹ $1${COLOR_RESET}"
}

print_warning() {
    echo -e "${COLOR_YELLOW}⚠ $1${COLOR_RESET}"
}

print_error() {
    echo -e "${COLOR_RED}✗ $1${COLOR_RESET}"
}

# Function to test API
test_api() {
    print_info "Testing translation API..."
    response=$(curl -s "$BASE_URL/api/translate/test")
    
    if echo "$response" | grep -q '"status":"success"'; then
        print_success "Translation API is working!"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        print_error "Translation API test failed!"
        echo "$response"
        exit 1
    fi
}

# Function to translate single text
translate() {
    local text="$1"
    local lang="${2:-pt}"
    
    print_info "Translating: '$text' to $lang"
    
    response=$(curl -s -X POST "$BASE_URL/api/translate" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"$text\",\"targetLang\":\"$lang\"}")
    
    if echo "$response" | grep -q '"translated"'; then
        translated=$(echo "$response" | jq -r '.translated' 2>/dev/null)
        print_success "Translation: $translated"
        echo "$response" | jq '.' 2>/dev/null
    else
        print_error "Translation failed!"
        echo "$response"
    fi
}

# Function to batch translate
batch_translate() {
    local texts="$1"
    local lang="${2:-pt}"
    
    print_info "Batch translating to $lang"
    
    response=$(curl -s -X PUT "$BASE_URL/api/translate" \
        -H "Content-Type: application/json" \
        -d "{\"texts\":$texts,\"targetLang\":\"$lang\"}")
    
    if echo "$response" | grep -q '"translations"'; then
        print_success "Batch translation complete!"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        print_error "Batch translation failed!"
        echo "$response"
    fi
}

# Function to show usage
usage() {
    cat << EOF
${COLOR_BLUE}Gemini Translation Helper${COLOR_RESET}

Usage:
    $0 test                          # Test API connection
    $0 translate "text" [lang]       # Translate single text
    $0 batch '["text1","text2"]'     # Batch translate
    $0 demo                          # Run demo translations
    $0 help                          # Show this help

Examples:
    $0 test
    $0 translate "Welcome to AV Rentals" pt
    $0 batch '["Dashboard","Settings","Profile"]'
    
Languages:
    en - English
    pt - Portuguese (European)
EOF
}

# Function to run demo
demo() {
    print_info "Running translation demos..."
    echo ""
    
    echo "═══════════════════════════════════════"
    echo "Demo 1: Test API"
    echo "═══════════════════════════════════════"
    test_api
    echo ""
    
    echo "═══════════════════════════════════════"
    echo "Demo 2: Single Translation"
    echo "═══════════════════════════════════════"
    translate "Welcome to AV Rentals Management System" "pt"
    echo ""
    
    echo "═══════════════════════════════════════"
    echo "Demo 3: Batch Translation"
    echo "═══════════════════════════════════════"
    batch_translate '["Dashboard","Equipment","Rentals","Clients","Reports","Settings"]' "pt"
    echo ""
    
    echo "═══════════════════════════════════════"
    echo "Demo 4: Technical Terms"
    echo "═══════════════════════════════════════"
    translate "QR Code Scanner with Real-time Inventory Tracking" "pt"
    echo ""
    
    print_success "All demos completed!"
}

# Main script logic
case "${1:-help}" in
    test)
        test_api
        ;;
    translate)
        if [ -z "$2" ]; then
            print_error "Text is required!"
            echo "Usage: $0 translate \"text\" [lang]"
            exit 1
        fi
        translate "$2" "${3:-pt}"
        ;;
    batch)
        if [ -z "$2" ]; then
            print_error "Text array is required!"
            echo "Usage: $0 batch '[\"text1\",\"text2\"]' [lang]"
            exit 1
        fi
        batch_translate "$2" "${3:-pt}"
        ;;
    demo)
        demo
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        usage
        exit 1
        ;;
esac
