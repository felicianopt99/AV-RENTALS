#!/bin/bash
# Setup script for Gemini Translation System
# Run this script to set up the Python translation environment

set -e

echo "🚀 Setting up Gemini Translation System for AV-RENTALS"
echo "=================================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3.8 or later and try again."
    exit 1
fi

echo "✅ Python 3 detected: $(python3 --version)"

# Navigate to scripts directory
cd "$(dirname "$0")"
SCRIPT_DIR="$(pwd)"
echo "📁 Working directory: $SCRIPT_DIR"

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt not found in $SCRIPT_DIR"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "🔧 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Dependencies installed successfully"

# Make the script executable
chmod +x gemini_translator.py

# Check if .env file exists in parent directory
ENV_FILE="../.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️ .env file not found at $ENV_FILE"
    echo "Creating example .env file..."
    
    cat > "$ENV_FILE" << EOF
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/av_rentals"

# Gemini API Keys (get from https://makersuite.google.com/app/apikey)
GOOGLE_GENERATIVE_AI_API_KEY="your-primary-gemini-api-key-here"

# Optional: Additional API keys for better throughput
# GOOGLE_GENERATIVE_AI_API_KEY_2="your-second-api-key"
# GOOGLE_GENERATIVE_AI_API_KEY_3="your-third-api-key"  
# GOOGLE_GENERATIVE_AI_API_KEY_4="your-fourth-api-key"
EOF

    echo "📝 Example .env file created at $ENV_FILE"
    echo "Please edit it with your actual API keys and database URL"
else
    echo "✅ .env file found"
fi

# Test the installation
echo "🧪 Testing installation..."
if python3 gemini_translator.py --help >/dev/null 2>&1; then
    echo "✅ Installation successful!"
else
    echo "❌ Installation test failed"
    exit 1
fi

# Create alias script for easy access
ALIAS_SCRIPT="../translate.sh"
cat > "$ALIAS_SCRIPT" << 'EOF'
#!/bin/bash
# Convenience script to run the Gemini translator

# Navigate to scripts directory
cd "$(dirname "$0")/scripts"

# Activate virtual environment
source venv/bin/activate

# Run the translator with all arguments
python3 gemini_translator.py "$@"
EOF

chmod +x "$ALIAS_SCRIPT"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your Gemini API key(s)"
echo "2. Update DATABASE_URL in .env if needed"
echo ""
echo "💡 Usage examples:"
echo "   # From project root:"
echo "   ./translate.sh --text \"Hello World\" --target-lang pt"
echo "   ./translate.sh --translate-missing --limit 50"
echo ""
echo "   # From scripts directory:"
echo "   source venv/bin/activate"
echo "   python3 gemini_translator.py --help"
echo ""
echo "📖 See TRANSLATION_SCRIPT_GUIDE.md for detailed documentation"