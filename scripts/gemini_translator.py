#!/usr/bin/env python3
"""
Gemini Translation Script for AV-RENTALS
=========================================

A Python script that translates text using Google's Gemini API while:
- Respecting free tier rate limits (2 requests/minute, 250/day per API key)
- Integrating with the existing PostgreSQL database
- Using smart batching and caching to minimize API calls
- Supporting multiple API keys for better throughput
- Providing detailed progress reporting and error handling

Usage:
    python gemini_translator.py --target-lang pt --batch-size 10 --source-lang en
    python gemini_translator.py --translate-missing --target-lang pt
    python gemini_translator.py --text "Hello World" --target-lang pt
"""

import asyncio
import asyncpg
import json
import logging
import os
import re
import sys
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import argparse
from dataclasses import dataclass
from pathlib import Path

# Third-party imports
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@dataclass
class RateLimitConfig:
    """Rate limiting configuration for Gemini API free tier"""
    requests_per_minute: int = 2
    requests_per_day: int = 250
    min_delay_between_requests: float = 30.0  # 30 seconds between requests
    retry_delay_multiplier: float = 2.0
    max_retries: int = 3

@dataclass
class TranslationRequest:
    """Represents a single translation request"""
    source_text: str
    target_lang: str
    source_lang: str = 'en'
    category: str = 'general'
    context: Optional[str] = None

class RateLimiter:
    """Smart rate limiter for Gemini API that respects free tier limits"""
    
    def __init__(self, config: RateLimitConfig):
        self.config = config
        self.request_times: List[float] = []
        self.daily_counts: Dict[str, int] = {}  # Track daily usage per API key
        self.last_request_time: float = 0
        
    async def wait_if_needed(self, api_key_hash: str) -> None:
        """Wait if necessary to respect rate limits"""
        current_time = time.time()
        
        # Check daily limit
        today = datetime.now().strftime('%Y-%m-%d')
        daily_key = f"{api_key_hash}:{today}"
        
        if self.daily_counts.get(daily_key, 0) >= self.config.requests_per_day:
            logging.warning(f"Daily limit reached for API key. Waiting until tomorrow...")
            # Calculate seconds until midnight
            tomorrow = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
            wait_time = (tomorrow - datetime.now()).total_seconds()
            await asyncio.sleep(wait_time)
            return
        
        # Check per-minute limit
        one_minute_ago = current_time - 60
        self.request_times = [t for t in self.request_times if t > one_minute_ago]
        
        if len(self.request_times) >= self.config.requests_per_minute:
            wait_time = self.config.min_delay_between_requests
            logging.info(f"Rate limit reached. Waiting {wait_time}s...")
            await asyncio.sleep(wait_time)
            return
        
        # Minimum delay between requests
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.config.min_delay_between_requests:
            wait_time = self.config.min_delay_between_requests - time_since_last
            logging.info(f"Enforcing minimum delay: {wait_time:.1f}s")
            await asyncio.sleep(wait_time)
    
    def record_request(self, api_key_hash: str) -> None:
        """Record a successful request"""
        current_time = time.time()
        self.request_times.append(current_time)
        self.last_request_time = current_time
        
        today = datetime.now().strftime('%Y-%m-%d')
        daily_key = f"{api_key_hash}:{today}"
        self.daily_counts[daily_key] = self.daily_counts.get(daily_key, 0) + 1

class GeminiTranslator:
    """Main translator class that handles Gemini API interactions and database operations"""
    
    def __init__(self, database_url: str, api_keys: List[str]):
        self.database_url = database_url
        self.api_keys = [key for key in api_keys if key and key.strip()]
        self.current_key_index = 0
        self.rate_limiter = RateLimiter(RateLimitConfig())
        self.db_pool: Optional[asyncpg.Pool] = None
        
        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('translation.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
        if not self.api_keys:
            raise ValueError("No valid API keys provided")
            
        # Configure Gemini
        self._setup_gemini()
    
    def _setup_gemini(self) -> None:
        """Setup Gemini AI with the first available API key"""
        genai.configure(api_key=self.api_keys[self.current_key_index])
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def _get_api_key_hash(self) -> str:
        """Get a hash of the current API key for rate limiting"""
        return str(hash(self.api_keys[self.current_key_index]))
    
    def _rotate_api_key(self) -> bool:
        """Rotate to next API key if available"""
        if len(self.api_keys) <= 1:
            return False
            
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        self._setup_gemini()
        self.logger.info(f"Rotated to API key #{self.current_key_index + 1}")
        return True
    
    async def _init_database(self) -> None:
        """Initialize database connection pool"""
        if self.db_pool is None:
            self.db_pool = await asyncpg.create_pool(
                self.database_url,
                min_size=1,
                max_size=5,
                command_timeout=60
            )
    
    async def _close_database(self) -> None:
        """Close database connection pool"""
        if self.db_pool:
            await self.db_pool.close()
            self.db_pool = None
    
    async def _translation_exists(self, source_text: str, target_lang: str) -> Optional[str]:
        """Check if translation already exists in database"""
        if not self.db_pool:
            await self._init_database()
            
        async with self.db_pool.acquire() as conn:
            result = await conn.fetchrow(
                """
                SELECT "translatedText" FROM "Translation" 
                WHERE "sourceText" = $1 AND "targetLang" = $2 
                AND "status" = 'approved'
                ORDER BY "qualityScore" DESC, "updatedAt" DESC 
                LIMIT 1
                """,
                source_text, target_lang
            )
            return result['translatedText'] if result else None
    
    async def _save_translation(self, request: TranslationRequest, translated_text: str) -> str:
        """Save translation to database"""
        if not self.db_pool:
            await self._init_database()
            
        translation_id = f"tl_{int(time.time() * 1000000)}"  # Simple unique ID
        
        async with self.db_pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO "Translation" (
                    id, "sourceText", "targetLang", "translatedText", model, 
                    category, context, "isAutoTranslated", status, "qualityScore",
                    "usageCount", version, "createdAt", "updatedAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT ("sourceText", "targetLang") 
                DO UPDATE SET 
                    "translatedText" = $4,
                    "updatedAt" = $14,
                    "usageCount" = "Translation"."usageCount" + 1
                """,
                translation_id, request.source_text, request.target_lang, translated_text,
                'gemini-2.5-flash', request.category, request.context, True, 'approved', 95,
                1, 1, datetime.now(), datetime.now()
            )
        
        return translation_id
    
    async def _translate_with_gemini(self, texts: List[str], target_lang: str, source_lang: str = 'en') -> Dict[str, str]:
        """Translate texts using Gemini API with smart batching"""
        # Wait for rate limits
        await self.rate_limiter.wait_if_needed(self._get_api_key_hash())
        
        # Create translation prompt
        language_names = {
            'pt': 'European Portuguese (Portugal)',
            'es': 'Spanish', 
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'en': 'English'
        }
        
        target_language = language_names.get(target_lang, target_lang)
        source_language = language_names.get(source_lang, source_lang)
        
        # Batch texts for efficient translation
        text_list = '\n'.join([f"{i+1}. {text}" for i, text in enumerate(texts)])
        
        prompt = f"""
        Translate the following {source_language} texts to {target_language}. 
        
        IMPORTANT: If translating to Portuguese, use European Portuguese (Portugal) variant, NOT Brazilian Portuguese.
        Use formal European Portuguese vocabulary and expressions.
        
        Maintain the same order and provide only the translations, one per line.
        Keep technical terms, proper nouns, and formatting intact.
        For UI elements, use appropriate localized terms for Portugal.
        
        Texts to translate:
        {text_list}
        
        Provide translations in the same order, one per line:
        """
        
        max_retries = self.rate_limiter.config.max_retries
        retry_delay = 1.0
        
        for attempt in range(max_retries + 1):
            try:
                response = await asyncio.to_thread(
                    self.model.generate_content, 
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.1,  # Low temperature for consistent translations
                        max_output_tokens=8000,
                        candidate_count=1
                    )
                )
                
                if response.text:
                    # Record successful request
                    self.rate_limiter.record_request(self._get_api_key_hash())
                    
                    # Parse response
                    translations = self._parse_translation_response(response.text, texts)
                    
                    self.logger.info(f"Successfully translated {len(translations)} texts")
                    return translations
                else:
                    self.logger.warning("Empty response from Gemini API")
                    
            except Exception as e:
                self.logger.error(f"Translation attempt {attempt + 1} failed: {e}")
                
                if attempt < max_retries:
                    if "quota" in str(e).lower() or "limit" in str(e).lower():
                        # Try rotating API key
                        if self._rotate_api_key():
                            self.logger.info("Rotated API key due to quota limit")
                            continue
                    
                    await asyncio.sleep(retry_delay)
                    retry_delay *= self.rate_limiter.config.retry_delay_multiplier
                else:
                    raise e
        
        return {}
    
    def _parse_translation_response(self, response: str, original_texts: List[str]) -> Dict[str, str]:
        """Parse Gemini's translation response"""
        lines = [line.strip() for line in response.strip().split('\n') if line.strip()]
        translations = {}
        
        for i, line in enumerate(lines):
            if i < len(original_texts):
                # Remove numbering if present
                clean_translation = re.sub(r'^\d+\.\s*', '', line)
                translations[original_texts[i]] = clean_translation
        
        return translations
    
    async def translate_batch(self, requests: List[TranslationRequest], batch_size: int = 10) -> Dict[str, str]:
        """Translate a batch of requests efficiently"""
        results = {}
        
        # Group requests by target language for efficient batching
        by_language = {}
        for req in requests:
            key = f"{req.target_lang}:{req.source_lang}"
            if key not in by_language:
                by_language[key] = []
            by_language[key].append(req)
        
        for lang_key, lang_requests in by_language.items():
            target_lang, source_lang = lang_key.split(':')
            
            self.logger.info(f"Processing {len(lang_requests)} requests for {source_lang} -> {target_lang}")
            
            # Process in batches
            for i in range(0, len(lang_requests), batch_size):
                batch = lang_requests[i:i + batch_size]
                
                # Check for existing translations
                texts_to_translate = []
                batch_requests_map = {}
                
                for req in batch:
                    existing = await self._translation_exists(req.source_text, target_lang)
                    if existing:
                        results[req.source_text] = existing
                        self.logger.info(f"Using cached translation: '{req.source_text}' -> '{existing}'")
                    else:
                        texts_to_translate.append(req.source_text)
                        batch_requests_map[req.source_text] = req
                
                # Translate new texts
                if texts_to_translate:
                    self.logger.info(f"Translating {len(texts_to_translate)} new texts...")
                    
                    try:
                        translations = await self._translate_with_gemini(
                            texts_to_translate, target_lang, source_lang
                        )
                        
                        # Save and record results
                        for source_text, translated_text in translations.items():
                            if source_text in batch_requests_map:
                                req = batch_requests_map[source_text]
                                await self._save_translation(req, translated_text)
                                results[source_text] = translated_text
                                self.logger.info(f"Translated: '{source_text}' -> '{translated_text}'")
                    
                    except Exception as e:
                        self.logger.error(f"Batch translation failed: {e}")
                        for text in texts_to_translate:
                            results[text] = text  # Fallback to original text
        
        return results
    
    async def translate_missing_from_db(self, target_lang: str = 'pt', limit: int = 100) -> int:
        """Find and translate missing translations from database"""
        if not self.db_pool:
            await self._init_database()
        
        # Find texts that need translation
        async with self.db_pool.acquire() as conn:
            # This would need to be adapted based on your specific needs
            # For now, let's get a list of source texts that don't have translations
            results = await conn.fetch(
                """
                SELECT DISTINCT "sourceText" 
                FROM "Translation" 
                WHERE "targetLang" = 'en' 
                AND "sourceText" NOT IN (
                    SELECT "sourceText" 
                    FROM "Translation" 
                    WHERE "targetLang" = $1
                )
                LIMIT $2
                """,
                target_lang, limit
            )
        
        if not results:
            self.logger.info("No missing translations found")
            return 0
        
        # Create translation requests
        requests = []
        for row in results:
            requests.append(TranslationRequest(
                source_text=row['sourceText'],
                target_lang=target_lang,
                source_lang='en'
            ))
        
        self.logger.info(f"Found {len(requests)} texts needing translation to {target_lang}")
        
        # Translate in batches
        await self.translate_batch(requests)
        
        return len(requests)
    
    async def translate_single(self, text: str, target_lang: str, source_lang: str = 'en') -> str:
        """Translate a single text"""
        request = TranslationRequest(
            source_text=text,
            target_lang=target_lang,
            source_lang=source_lang
        )
        
        results = await self.translate_batch([request])
        return results.get(text, text)

async def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(description='Gemini Translation Script for AV-RENTALS')
    parser.add_argument('--text', help='Single text to translate')
    parser.add_argument('--target-lang', default='pt', help='Target language (default: pt)')
    parser.add_argument('--source-lang', default='en', help='Source language (default: en)')
    parser.add_argument('--batch-size', type=int, default=10, help='Batch size for translations')
    parser.add_argument('--translate-missing', action='store_true', help='Translate missing entries from database')
    parser.add_argument('--limit', type=int, default=100, help='Limit for missing translations')
    parser.add_argument('--file', help='File containing texts to translate (one per line)')
    
    args = parser.parse_args()
    
    # Get configuration
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("Error: DATABASE_URL environment variable is required")
        sys.exit(1)
    
    api_keys = [
        os.getenv('GOOGLE_GENERATIVE_AI_API_KEY'),
        os.getenv('GOOGLE_GENERATIVE_AI_API_KEY_2'),
        os.getenv('GOOGLE_GENERATIVE_AI_API_KEY_3'),
        os.getenv('GOOGLE_GENERATIVE_AI_API_KEY_4'),
    ]
    api_keys = [key for key in api_keys if key and key.strip()]
    
    if not api_keys:
        print("Error: At least one GOOGLE_GENERATIVE_AI_API_KEY environment variable is required")
        sys.exit(1)
    
    # Initialize translator
    translator = GeminiTranslator(database_url, api_keys)
    
    try:
        if args.text:
            # Single text translation
            result = await translator.translate_single(args.text, args.target_lang, args.source_lang)
            print(f"Translation: {result}")
            
        elif args.file:
            # File translation
            if not Path(args.file).exists():
                print(f"Error: File {args.file} not found")
                sys.exit(1)
            
            with open(args.file, 'r', encoding='utf-8') as f:
                texts = [line.strip() for line in f if line.strip()]
            
            requests = [
                TranslationRequest(text, args.target_lang, args.source_lang)
                for text in texts
            ]
            
            results = await translator.translate_batch(requests, args.batch_size)
            
            # Output results
            output_file = f"{Path(args.file).stem}_translated.txt"
            with open(output_file, 'w', encoding='utf-8') as f:
                for text in texts:
                    f.write(f"{results.get(text, text)}\n")
            
            print(f"Translated {len(results)} texts. Output saved to {output_file}")
            
        elif args.translate_missing:
            # Translate missing from database
            count = await translator.translate_missing_from_db(args.target_lang, args.limit)
            print(f"Translated {count} missing texts")
            
        else:
            print("Error: Please specify --text, --file, or --translate-missing")
            parser.print_help()
    
    finally:
        await translator._close_database()

if __name__ == '__main__':
    asyncio.run(main())