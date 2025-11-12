#!/usr/bin/env node
// Automated extraction and wrapping of hardcoded strings in JSX/TSX files
// Usage: node scripts/wrap-jsx-strings.cjs

const fs = require('fs');
const path = require('path');

const GLOB_EXTENSIONS = ['.jsx', '.tsx'];
const TRANSLATE_FN = 'useTranslate';

function walk(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, filelist);
    } else if (GLOB_EXTENSIONS.includes(path.extname(file))) {
      filelist.push(filepath);
    }
  });
  return filelist;
}

function wrapStringsInFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  // Simple regex to match hardcoded strings in JSX (not perfect, but a start)
  // Matches: >Some text< or {'Some text'}
  const jsxTextRegex = />([^<>{}\n]+)</g;
  const curlyStringRegex = /\{\s*(['"])([^'"{}\n]+)\1\s*\}/g;

  let changed = false;

  // Wrap >Some text< with >{useTranslate('Some text')}<
  content = content.replace(jsxTextRegex, (match, p1) => {
    if (p1.trim().length === 0) return match;
    changed = true;
    return '>{' + TRANSLATE_FN + "('" + p1.trim() + "')}<";
  });

  // Wrap {'Some text'} with {useTranslate('Some text')}
  content = content.replace(curlyStringRegex, (match, quote, p1) => {
    changed = true;
    return '{' + TRANSLATE_FN + "('" + p1.trim() + "')}";
  });

  if (changed) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log('Updated:', filepath);
  }
}

function main() {
  const srcDir = path.resolve(__dirname, '../src');
  if (!fs.existsSync(srcDir)) {
    console.error('src directory not found');
    process.exit(1);
  }
  const files = walk(srcDir);
  files.forEach(wrapStringsInFile);
  console.log('String wrapping complete. Please review changes before committing.');
}

main();
