#!/usr/bin/env python3
"""
Quick Translation Integration Script
====================================

A lightweight script to integrate the Python translator with your existing system.
This can be called from your Node.js application or used in batch jobs.
"""

import asyncio
import json
import sys
import os
from pathlib import Path

# Add the parent directory to path to import our translator
sys.path.append(str(Path(__file__).parent))

from gemini_translator import GeminiTranslator, TranslationRequest

async def quick_translate(texts, target_lang='pt', source_lang='en'):
    """
    Quick translation function for integration
    
    Args:
        texts: List of texts to translate or single text string
        target_lang: Target language code (default: 'pt')
        source_lang: Source language code (default: 'en')
    
    Returns:
        Dictionary with original texts as keys and translations as values
    """
    
    # Handle single text input
    if isinstance(texts, str):
        texts = [texts]
    
    # Get configuration
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")
    
    api_keys = [
        os.getenv('GOOGLE_GENERATIVE_AI_API_KEY'),
        os.getenv('GOOGLE_GENERATIVE_AI_API_KEY_2'),
        os.getenv('GOOGLE_GENERATIVE_AI_API_KEY_3'),
        os.getenv('GOOGLE_GENERATIVE_AI_API_KEY_4'),
    ]
    api_keys = [key for key in api_keys if key and key.strip()]
    
    if not api_keys:
        raise ValueError("At least one GOOGLE_GENERATIVE_AI_API_KEY is required")
    
    # Initialize translator
    translator = GeminiTranslator(database_url, api_keys)
    
    try:
        # Create translation requests
        requests = [
            TranslationRequest(text, target_lang, source_lang)
            for text in texts
        ]
        
        # Translate
        results = await translator.translate_batch(requests, batch_size=10)
        
        return results
        
    finally:
        await translator._close_database()

def main():
    """CLI interface for quick translations"""
    if len(sys.argv) < 2:
        print("Usage: python3 quick_translate.py <text> [target_lang] [source_lang]")
        print("       python3 quick_translate.py --json '{\"texts\": [\"Hello\", \"World\"], \"target_lang\": \"pt\"}'")
        sys.exit(1)
    
    if sys.argv[1] == '--json':
        # JSON input mode
        if len(sys.argv) < 3:
            print("Error: JSON data required with --json flag")
            sys.exit(1)
        
        try:
            data = json.loads(sys.argv[2])
            texts = data.get('texts', [])
            target_lang = data.get('target_lang', 'pt')
            source_lang = data.get('source_lang', 'en')
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            sys.exit(1)
    else:
        # Simple text mode
        texts = [sys.argv[1]]
        target_lang = sys.argv[2] if len(sys.argv) > 2 else 'pt'
        source_lang = sys.argv[3] if len(sys.argv) > 3 else 'en'
    
    # Run translation
    results = asyncio.run(quick_translate(texts, target_lang, source_lang))
    
    # Output results
    if len(texts) == 1:
        # Single text - just output the translation
        print(results.get(texts[0], texts[0]))
    else:
        # Multiple texts - output JSON
        print(json.dumps(results, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()