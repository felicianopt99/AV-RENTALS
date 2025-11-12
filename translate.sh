#!/bin/bash
# Convenience script to run the Gemini translator

# Navigate to scripts directory
cd "$(dirname "$0")/scripts"

# Activate virtual environment
source venv/bin/activate

# Run the translator with all arguments
python3 gemini_translator.py "$@"
