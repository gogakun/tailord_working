#!/usr/bin/env node

/**
 * Build script for Rogue Garms Guide Widget
 * Creates optimized bundles for production
 */

import { build } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const buildConfig = {
  plugins: [svelte()],
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'RGGuide',
      fileName: 'widget',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    },
    target: 'es2015',
    minify: 'terser',
    sourcemap: true
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
};

async function buildWidget() {
  console.log('🏗️  Building Rogue Garms Guide Widget...');

  try {
    // Build main widget
    console.log('📦 Building main widget bundle...');
    const result = await build(buildConfig);
    
    // Create dist directory
    mkdirSync('dist', { recursive: true });
    
    // Copy embed script
    console.log('📋 Copying embed script...');
    const embedScript = `
// Rogue Garms Guide Widget - Production Build
// Generated: ${new Date().toISOString()}

${readFileSync('embed-working.js', 'utf8')}
`;
    
    writeFileSync('dist/guide.js', embedScript);
    
    // Create iframe HTML
    console.log('🖼️  Creating iframe HTML...');
    const iframeHtml = readFileSync('iframe.html', 'utf8');
    writeFileSync('dist/widget.html', iframeHtml);
    
    // Create CDN version
    console.log('🌐 Creating CDN version...');
    const cdnVersion = `
(function() {
  'use strict';
  
  // Load widget from CDN
  const script = document.createElement('script');
  script.src = 'https://cdn.roguegarms.com/guide/latest.js';
  script.async = true;
  script.onload = function() {
    if (window.RGGuide) {
      // Auto-initialize with data attributes
      const siteId = script.getAttribute('data-site-id');
      if (siteId) {
        window.RGGuide.init({
          siteId: siteId,
          theme: script.getAttribute('data-theme') || 'auto',
          position: script.getAttribute('data-position') || 'bottom-right'
        });
      }
    }
  };
  
  document.head.appendChild(script);
})();
`;
    
    writeFileSync('dist/cdn.js', cdnVersion);
    
    console.log('✅ Build completed successfully!');
    console.log('📁 Output files:');
    console.log('   - dist/guide.js (embed script)');
    console.log('   - dist/widget.html (iframe)');
    console.log('   - dist/cdn.js (CDN loader)');
    console.log('   - dist/widget.js (main bundle)');
    console.log('   - dist/widget.umd.js (UMD bundle)');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Helper function to read files
function readFileSync(path, encoding) {
  const fs = await import('fs');
  return fs.readFileSync(path, encoding);
}

// Run build
buildWidget();
