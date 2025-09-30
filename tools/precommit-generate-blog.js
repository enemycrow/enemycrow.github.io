#!/usr/bin/env node
// Helper for pre-commit: generate only changed posts (incremental)
const { execSync } = require('child_process');
const path = require('path');
try {
  const repoRoot = process.cwd();
  const script = path.join(repoRoot, 'tools', 'generate-blog-pages.js');
  // Run in staged mode so the generator can detect minimal changes if implemented
  execSync(`node "${script}" --incremental`, { stdio: 'inherit' });
  process.exit(0);
} catch (err) {
  console.error('Error al ejecutar el generador de blog previo al commit:', err.message || err);
  process.exit(1);
}
