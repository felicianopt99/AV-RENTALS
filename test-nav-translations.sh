#!/bin/bash

# Test Navigation Translations
# This script tests all the navigation items to ensure they translate correctly

echo "🧪 Testing Navigation Translations..."
echo "===================================="
echo ""

# Array of navigation items to test
nav_items=(
    "Dashboard"
    "Inventory"
    "View Inventory"
    "Categories"
    "Maintenance"
    "Clients"
    "Team"
    "Rentals"
    "Event Calendar"
    "Events"
    "Quotes"
    "Services"
    "Fees"
    "User Management"
    "Customization"
    "PDF Branding"
    "System Settings"
    "Administration"
    "Logout"
)

BASE_URL="http://localhost:3000/api/translate"

# Test each item
for item in "${nav_items[@]}"; do
    echo "Testing: $item"
    result=$(curl -s -X POST "$BASE_URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"$item\",\"targetLang\":\"pt\"}" | jq -r '.translated')
    
    if [ "$result" != "null" ] && [ -n "$result" ]; then
        echo "  ✓ EN: $item"
        echo "  ✓ PT: $result"
    else
        echo "  ✗ Translation failed for: $item"
    fi
    echo ""
done

echo "===================================="
echo "✅ Navigation translation test complete!"
echo ""
echo "Test batch translation of all items:"
echo "------------------------------------"

# Create JSON array of all items
json_array=$(printf '%s\n' "${nav_items[@]}" | jq -R . | jq -s .)

echo "Translating ${#nav_items[@]} items in one batch..."
batch_result=$(curl -s -X PUT "$BASE_URL" \
    -H "Content-Type: application/json" \
    -d "{\"texts\":$json_array,\"targetLang\":\"pt\"}")

echo "$batch_result" | jq '.translations' | jq -r '.[]' | nl

echo ""
echo "✅ All tests complete!"
