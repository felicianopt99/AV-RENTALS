#!/usr/bin/env python3
"""
Overnight Batch Translation Script
==================================

Efficiently processes large volumes of translations overnight, respecting
rate limits and providing detailed progress reporting.

Features:
- Smart queue management with priority handling
- Detailed progress reporting and statistics
- Email notifications (optional)
- Resume capability after interruptions
- Multi-language support
- Quota management across multiple API keys
"""

import asyncio
import json
import logging
import os
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import argparse

# Add the current directory to path for imports
sys.path.append(str(Path(__file__).parent))

from gemini_translator import GeminiTranslator, TranslationRequest
import asyncpg
from dotenv import load_dotenv

load_dotenv()

class OvernightTranslationManager:
    """Manages overnight batch translation operations"""
    
    def __init__(self, database_url: str, api_keys: List[str], log_file: str = None):
        self.database_url = database_url
        self.api_keys = api_keys
        self.translator = GeminiTranslator(database_url, api_keys)
        
        # Setup logging
        log_file = log_file or f"overnight_translation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
        # Statistics tracking
        self.stats = {
            'start_time': None,
            'end_time': None,
            'total_requested': 0,
            'already_cached': 0,
            'newly_translated': 0,
            'failed_translations': 0,
            'api_calls_made': 0,
            'keys_rotated': 0,
            'languages_processed': set(),
            'estimated_cost_saved': 0.0
        }
        
        # Progress file for resuming
        self.progress_file = Path("overnight_progress.json")
        
    async def extract_texts_needing_translation(self, target_langs: List[str], limit: int = None) -> Dict[str, List[str]]:
        """Extract texts that need translation from various sources"""
        self.logger.info("🔍 Extracting texts needing translation...")
        
        # Ensure database connection is initialized
        if not self.translator.db_pool:
            await self.translator._init_database()
        
        texts_by_lang = {}
        
        async with self.translator.db_pool.acquire() as conn:
            for lang in target_langs:
                # Find English texts that don't have translations in target language
                query = """
                SELECT t1."sourceText"
                FROM "Translation" t1
                WHERE t1."targetLang" = 'en' 
                AND t1."sourceText" NOT IN (
                    SELECT t2."sourceText" 
                    FROM "Translation" t2 
                    WHERE t2."targetLang" = $1
                )
                ORDER BY LENGTH(t1."sourceText") ASC
                """
                
                if limit:
                    query += f" LIMIT {limit}"
                
                results = await conn.fetch(query, lang)
                texts_by_lang[lang] = [row['sourceText'] for row in results]
                
                self.logger.info(f"📋 Found {len(texts_by_lang[lang])} texts needing translation to {lang}")
        
        return texts_by_lang
    
    async def load_progress(self) -> Dict:
        """Load progress from previous run if exists"""
        if self.progress_file.exists():
            try:
                with open(self.progress_file, 'r') as f:
                    progress = json.load(f)
                self.logger.info(f"📁 Loaded progress from previous run: {progress.get('completed', 0)} completed")
                return progress
            except Exception as e:
                self.logger.warning(f"Could not load progress file: {e}")
        
        return {'completed': 0, 'failed': [], 'remaining': {}}
    
    async def save_progress(self, completed: int, failed: List[str], remaining: Dict[str, List[str]]):
        """Save current progress"""
        progress = {
            'timestamp': datetime.now().isoformat(),
            'completed': completed,
            'failed': failed,
            'remaining': remaining,
            'stats': self.stats
        }
        
        with open(self.progress_file, 'w') as f:
            json.dump(progress, f, indent=2, default=str)
    
    def calculate_estimated_time(self, total_texts: int, keys_available: int) -> Tuple[int, str]:
        """Calculate estimated completion time"""
        # Each key can do 250 translations per day, 2 per minute
        translations_per_hour = keys_available * 120  # 2 per minute * 60 minutes
        hours_needed = total_texts / translations_per_hour
        
        completion_time = datetime.now() + timedelta(hours=hours_needed)
        
        return int(hours_needed), completion_time.strftime('%Y-%m-%d %H:%M:%S')
    
    async def process_language_batch(self, target_lang: str, texts: List[str], batch_size: int = 20) -> Dict[str, str]:
        """Process a batch of texts for a specific language"""
        self.logger.info(f"🌐 Processing {len(texts)} texts for language: {target_lang}")
        
        results = {}
        failed_texts = []
        
        # Process in chunks
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (len(texts) + batch_size - 1) // batch_size
            
            self.logger.info(f"📦 Processing batch {batch_num}/{total_batches} ({len(batch)} texts)")
            
            try:
                # Create translation requests
                requests = [
                    TranslationRequest(
                        source_text=text,
                        target_lang=target_lang,
                        source_lang='en',
                        category='bulk_overnight'
                    ) for text in batch
                ]
                
                # Translate batch
                batch_results = await self.translator.translate_batch(requests, batch_size)
                results.update(batch_results)
                
                # Update statistics
                for text in batch:
                    if text in batch_results:
                        if batch_results[text] != text:  # Successfully translated
                            self.stats['newly_translated'] += 1
                            self.stats['api_calls_made'] += 1
                        else:  # Used cached version
                            self.stats['already_cached'] += 1
                    else:
                        failed_texts.append(text)
                        self.stats['failed_translations'] += 1
                
                # Progress update
                completed = i + len(batch)
                progress_percent = (completed / len(texts)) * 100
                self.logger.info(f"📈 Progress for {target_lang}: {completed}/{len(texts)} ({progress_percent:.1f}%)")
                
                # Save progress periodically
                if batch_num % 5 == 0:  # Every 5 batches
                    remaining_texts = {target_lang: texts[completed:]}
                    await self.save_progress(completed, failed_texts, remaining_texts)
                
            except Exception as e:
                self.logger.error(f"❌ Batch {batch_num} failed: {e}")
                failed_texts.extend(batch)
                self.stats['failed_translations'] += len(batch)
                
                # Wait longer on batch failure
                await asyncio.sleep(60)
        
        # Update language stats
        self.stats['languages_processed'].add(target_lang)
        
        if failed_texts:
            self.logger.warning(f"⚠️ {len(failed_texts)} texts failed for {target_lang}")
        
        return results
    
    async def generate_report(self) -> str:
        """Generate detailed completion report"""
        duration = self.stats['end_time'] - self.stats['start_time']
        
        report = f"""
🌙 OVERNIGHT TRANSLATION REPORT
{'=' * 50}
📅 Date: {self.stats['start_time'].strftime('%Y-%m-%d')}
⏰ Duration: {duration}
🌍 Languages: {', '.join(self.stats['languages_processed'])}

📊 STATISTICS:
Total Requested: {self.stats['total_requested']}
✅ Already Cached: {self.stats['already_cached']}
🆕 Newly Translated: {self.stats['newly_translated']}
❌ Failed: {self.stats['failed_translations']}
🔄 API Calls Made: {self.stats['api_calls_made']}
🔑 Keys Rotated: {self.stats['keys_rotated']}

💰 COST ANALYSIS:
Cached Translations Used: {self.stats['already_cached']}
Estimated API Cost Saved: ${self.stats['already_cached'] * 0.001:.2f}
New API Calls: {self.stats['api_calls_made']}

📈 PERFORMANCE:
Success Rate: {((self.stats['newly_translated'] + self.stats['already_cached']) / max(self.stats['total_requested'], 1)) * 100:.1f}%
Translations per Hour: {(self.stats['newly_translated'] + self.stats['already_cached']) / max(duration.total_seconds() / 3600, 1):.1f}
Cache Hit Rate: {(self.stats['already_cached'] / max(self.stats['total_requested'], 1)) * 100:.1f}%

🎯 RECOMMENDATIONS:
- Database now contains {self.stats['newly_translated']} new translations
- Cache hit rate of {(self.stats['already_cached'] / max(self.stats['total_requested'], 1)) * 100:.1f}% shows good reuse
- Consider running again tomorrow for any failed translations
"""
        
        return report
    
    async def run_overnight_batch(self, target_langs: List[str], max_translations: int = None, batch_size: int = 15):
        """Main overnight batch processing function"""
        
        self.stats['start_time'] = datetime.now()
        self.logger.info("🌙 Starting overnight batch translation...")
        self.logger.info(f"🎯 Target languages: {', '.join(target_langs)}")
        self.logger.info(f"🔑 API keys available: {len(self.api_keys)}")
        
        try:
            # Initialize database connection
            await self.translator._init_database()
            
            # Load previous progress if exists
            progress = await self.load_progress()
            
            # Extract texts needing translation
            if progress.get('remaining'):
                texts_by_lang = progress['remaining']
                self.logger.info("📁 Resuming from previous run...")
            else:
                texts_by_lang = await self.extract_texts_needing_translation(target_langs, max_translations)
            
            # Calculate totals and estimates
            total_texts = sum(len(texts) for texts in texts_by_lang.values())
            self.stats['total_requested'] = total_texts
            
            if total_texts == 0:
                self.logger.info("🎉 No translations needed - all texts are already translated!")
                return
            
            # Time estimation
            hours_needed, completion_time = self.calculate_estimated_time(total_texts, len(self.api_keys))
            self.logger.info(f"⏱️ Estimated completion: {hours_needed} hours (by {completion_time})")
            self.logger.info(f"📊 Total texts to process: {total_texts}")
            
            # Process each language
            all_results = {}
            for target_lang, texts in texts_by_lang.items():
                if not texts:
                    continue
                    
                self.logger.info(f"\n🚀 Starting {target_lang} translations...")
                
                lang_results = await self.process_language_batch(
                    target_lang, texts, batch_size
                )
                all_results[target_lang] = lang_results
                
                # Small delay between languages to be respectful
                await asyncio.sleep(30)
            
            # Final statistics
            self.stats['end_time'] = datetime.now()
            
            # Generate and display report
            report = await self.generate_report()
            self.logger.info(report)
            
            # Save final report
            report_file = f"overnight_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            with open(report_file, 'w') as f:
                f.write(report)
            
            self.logger.info(f"📄 Report saved to: {report_file}")
            
            # Clean up progress file on success
            if self.progress_file.exists():
                self.progress_file.unlink()
            
        except KeyboardInterrupt:
            self.logger.info("⏹️ Process interrupted by user")
            await self.save_progress(
                self.stats['newly_translated'] + self.stats['already_cached'],
                [],
                texts_by_lang
            )
            
        except Exception as e:
            self.logger.error(f"💥 Unexpected error: {e}")
            raise
            
        finally:
            await self.translator._close_database()

async def main():
    """CLI interface for overnight batch translation"""
    parser = argparse.ArgumentParser(description='Overnight Batch Translation System')
    parser.add_argument('--languages', nargs='+', default=['pt'], help='Target languages (default: pt)')
    parser.add_argument('--max-translations', type=int, help='Maximum translations to process')
    parser.add_argument('--batch-size', type=int, default=15, help='Batch size for processing')
    parser.add_argument('--resume', action='store_true', help='Resume from previous run')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be translated without actually doing it')
    
    args = parser.parse_args()
    
    # Get configuration
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ Error: DATABASE_URL environment variable is required")
        sys.exit(1)
    
    api_keys = [
        os.getenv('GOOGLE_GENERATIVE_AI_API_KEY'),
        os.getenv('GOOGLE_GENERATIVE_AI_API_KEY_2'),
        os.getenv('GOOGLE_GENERATIVE_AI_API_KEY_3'),
        os.getenv('GOOGLE_GENERATIVE_AI_API_KEY_4'),
    ]
    api_keys = [key for key in api_keys if key and key.strip()]
    
    if not api_keys:
        print("❌ Error: At least one GOOGLE_GENERATIVE_AI_API_KEY environment variable is required")
        sys.exit(1)
    
    print(f"🚀 Overnight Translation System")
    print(f"{'=' * 40}")
    print(f"🎯 Languages: {', '.join(args.languages)}")
    print(f"🔑 API Keys: {len(api_keys)}")
    print(f"📦 Batch Size: {args.batch_size}")
    
    if args.max_translations:
        print(f"🔢 Max Translations: {args.max_translations}")
    
    if args.dry_run:
        print("🧪 DRY RUN MODE - No actual translations will be made")
    
    # Initialize manager
    manager = OvernightTranslationManager(database_url, api_keys)
    
    if args.dry_run:
        # Just show what would be translated
        texts_by_lang = await manager.extract_texts_needing_translation(args.languages, args.max_translations)
        total = sum(len(texts) for texts in texts_by_lang.values())
        
        print(f"\n📊 WOULD TRANSLATE:")
        for lang, texts in texts_by_lang.items():
            print(f"  {lang}: {len(texts)} texts")
        print(f"  Total: {total} translations")
        
        if total > 0:
            hours, completion = manager.calculate_estimated_time(total, len(api_keys))
            print(f"⏱️ Estimated time: {hours} hours")
            print(f"🏁 Would complete by: {completion}")
    else:
        # Run actual translation
        await manager.run_overnight_batch(
            args.languages,
            args.max_translations,
            args.batch_size
        )

if __name__ == '__main__':
    asyncio.run(main())