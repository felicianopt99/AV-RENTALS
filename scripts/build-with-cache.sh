#!/bin/bash

echo "🚀 Building AV Rentals with optimized caching..."

# Create .next cache directory if it doesn't exist
mkdir -p .next/cache

# Set environment variables for optimal caching
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production

# Clean old build artifacts but preserve cache
echo "🧹 Cleaning old build artifacts..."
rm -rf .next/static
rm -rf .next/server
# Keep .next/cache for faster rebuilds

# Build with caching enabled
echo "🔨 Building application..."
npm run build

# Create production start script
echo "📦 Creating production start script..."
cat > start-prod.sh << 'EOF'
#!/bin/bash
export NODE_ENV=production
export PORT=3000
npm start
EOF

chmod +x start-prod.sh

echo "✅ Build complete! Use ./start-prod.sh to start in production mode"