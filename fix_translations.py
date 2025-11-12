#!/usr/bin/env python3
import os
import re
import glob

def fix_broken_translations(file_path):
    """Fix broken multiline useTranslate calls in a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern to match broken useTranslate calls that span multiple lines
        pattern = r"useTranslate\('([^']*)\n\s*([^']*)'\)"
        
        def replacement(match):
            text1 = match.group(1)
            text2 = match.group(2)
            combined_text = (text1 + text2).strip()
            return f"useTranslate('{combined_text}')"
        
        # Apply the fix
        fixed_content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
        
        if fixed_content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print(f"✅ Fixed: {file_path}")
            return True
        
        return False
        
    except Exception as e:
        print(f"❌ Error fixing {file_path}: {e}")
        return False

def main():
    print("🔧 Fixing broken translation strings...")
    
    # Find all .tsx and .ts files in src directory
    pattern = "src/**/*.tsx"
    files = glob.glob(pattern, recursive=True)
    
    fixed_count = 0
    for file_path in files:
        if fix_broken_translations(file_path):
            fixed_count += 1
    
    print(f"\n✨ Fixed {fixed_count} files with broken translation strings!")
    print("🚀 Build should now work properly!")

if __name__ == "__main__":
    main()