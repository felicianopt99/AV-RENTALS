#!/bin/bash
# Overnight Translation Wrapper Script
# Makes it easy to run bulk translations

cd "$(dirname "$0")"

# Activate virtual environment
source venv/bin/activate

# Default parameters
LANGUAGES="pt"
MAX_TRANSLATIONS=""
BATCH_SIZE="15"
DRY_RUN=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --languages)
            LANGUAGES="$2"
            shift 2
            ;;
        --max)
            MAX_TRANSLATIONS="--max-translations $2"
            shift 2
            ;;
        --batch-size)
            BATCH_SIZE="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN="--dry-run"
            shift
            ;;
        --resume)
            RESUME="--resume"
            shift
            ;;
        --help|-h)
            echo "Overnight Translation System"
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --languages LANGS    Target languages (default: pt)"
            echo "  --max NUMBER         Maximum translations to process"
            echo "  --batch-size SIZE    Batch size (default: 15)"
            echo "  --dry-run           Show what would be translated"
            echo "  --resume            Resume from previous run"
            echo "  --help              Show this help"
            echo ""
            echo "Examples:"
            echo "  $0 --dry-run                    # See what would be translated"
            echo "  $0 --languages pt es --max 100 # Translate to Portuguese and Spanish"
            echo "  $0 --resume                     # Resume interrupted run"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "🌙 Starting Overnight Translation System"
echo "========================================"

# Run the translator
python3 overnight_translator.py --languages $LANGUAGES $MAX_TRANSLATIONS --batch-size $BATCH_SIZE $DRY_RUN $RESUME