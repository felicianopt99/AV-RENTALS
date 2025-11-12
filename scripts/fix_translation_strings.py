#!/usr/bin/env python3
"""
Fix Broken Translation Strings
==============================

This script fixes broken translation strings that are split across multiple lines.
"""

import os
import re
from pathlib import Path

def fix_file(file_path):
    """Fix broken translation strings in a single file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern to match broken translation strings
    # Matches: useTranslate('some text\n    more text');
    pattern = r"useTranslate\('([^']*)\n\s*([^']*?)'\)"
    
    def replace_func(match):
        # Clean up the text by removing newlines and extra spaces
        text1 = match.group(1).strip()
        text2 = match.group(2).strip()
        
        # Combine the text parts
        combined_text = text1
        if text2:
            combined_text += " " + text2 if text1 and not text1.endswith(" ") else text2
        
        return f"useTranslate('{combined_text}')"
    
    # Fix the broken patterns
    content = re.sub(pattern, replace_func, content, flags=re.MULTILINE)
    
    # Also fix patterns like:
    # useTranslate('Text
    # ');
    pattern2 = r"useTranslate\('([^']*)\n\s*'\)"
    content = re.sub(pattern2, r"useTranslate('\1')", content, flags=re.MULTILINE)
    
    # Fix patterns that have extra closing quotes
    pattern3 = r"useTranslate\('([^']*?)'\s*\n\s*\)"
    content = re.sub(pattern3, r"useTranslate('\1')", content, flags=re.MULTILINE)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    
    return False

def main():
    """Main function to fix all files"""
    src_dir = Path('/home/feli/AV-RENTALS/src')
    
    fixed_files = []
    
    # Find all TypeScript/JavaScript files
    for file_path in src_dir.rglob('*.tsx'):
        if fix_file(file_path):
            fixed_files.append(file_path)
            print(f"✅ Fixed: {file_path}")
    
    for file_path in src_dir.rglob('*.ts'):
        if fix_file(file_path):
            fixed_files.append(file_path)
            print(f"✅ Fixed: {file_path}")
    
    print(f"\n🎉 Fixed {len(fixed_files)} files with broken translation strings")
    
    if fixed_files:
        print("\nFixed files:")
        for file_path in fixed_files:
            print(f"  - {file_path}")

if __name__ == '__main__':
    main()