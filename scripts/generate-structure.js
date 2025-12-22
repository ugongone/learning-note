#!/usr/bin/env node
/**
 * generate-structure.js
 * HTMLファイルの構造をスキャンしてJSONを生成するスクリプト
 *
 * 使用方法: node scripts/generate-structure.js
 * 出力: notes-structure.json
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'notes-structure.json');

// 除外するディレクトリ
const EXCLUDED_DIRS = ['.git', 'node_modules', 'scripts', '.vscode'];

// 除外するファイル
const EXCLUDED_FILES = ['index.html'];


function scanDirectory(dir, relativePath = '') {
  const items = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const itemRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.includes(entry.name)) continue;

      const children = scanDirectory(fullPath, itemRelativePath);
      if (children.length > 0) {
        items.push({
          type: 'folder',
          name: entry.name,
          path: itemRelativePath,
          children: children
        });
      }
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      // 除外ファイルをスキップ
      if (EXCLUDED_FILES.includes(entry.name)) continue;

      // .html を除いたファイル名を使用
      const displayName = entry.name.replace('.html', '');

      items.push({
        type: 'file',
        name: displayName,
        path: itemRelativePath
      });
    }
  }

  // フォルダを先に、ファイルを後に、それぞれ名前順でソート
  items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name, 'ja');
  });

  return items;
}

// 実行
console.log('Scanning HTML files...');
const structure = scanDirectory(ROOT_DIR);

const output = {
  generated: new Date().toISOString(),
  notes: structure
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
console.log(`Generated: ${OUTPUT_FILE}`);
console.log(`Found ${countFiles(structure)} HTML files in ${countFolders(structure)} folders`);

function countFiles(items) {
  return items.reduce((count, item) => {
    if (item.type === 'file') return count + 1;
    if (item.children) return count + countFiles(item.children);
    return count;
  }, 0);
}

function countFolders(items) {
  return items.reduce((count, item) => {
    if (item.type === 'folder') {
      return count + 1 + (item.children ? countFolders(item.children) : 0);
    }
    return count;
  }, 0);
}
