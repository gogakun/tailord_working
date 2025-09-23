#!/usr/bin/env node

/**
 * Demo server for Rogue Garms Guide Widget
 * Serves the widget with mock data for testing
 */

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock product data
const mockProducts = [
  {
    id: '1',
    name: 'Vintage Distressed Denim Jacket',
    brand: 'Rogue Garms',
    price: 89,
    image: 'https://images.unsplash.com/photo-1551028719-001c4d5d3e1e?w=400&h=400&fit=crop',
    url: '/products/vintage-denim-jacket',
    tags: ['vintage', 'distressed'],
    description: 'Classic vintage denim with authentic distressing'
  },
  {
    id: '2',
    name: 'Oversized Graphic Tee',
    brand: 'Rogue Garms',
    price: 35,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    url: '/products/oversized-graphic-tee',
    tags: ['graphic', 'oversized'],
    description: 'Bold statement piece with oversized fit'
  },
  {
    id: '3',
    name: 'Black Leather Boots',
    brand: 'Rogue Garms',
    price: 120,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
    url: '/products/black-leather-boots',
    tags: ['leather', 'boots'],
    description: 'Timeless black leather with modern styling'
  },
  {
    id: '4',
    name: 'Vintage Band Tee',
    brand: 'Rogue Garms',
    price: 45,
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&h=400&fit=crop',
    url: '/products/vintage-band-tee',
    tags: ['vintage', 'band'],
    description: 'Authentic vintage band merchandise'
  },
  {
    id: '5',
    name: 'Oversized Hoodie',
    brand: 'Rogue Garms',
    price: 65,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a4?w=400&h=400&fit=crop',
    url: '/products/oversized-hoodie',
    tags: ['hoodie', 'oversized'],
    description: 'Comfortable oversized fit with streetwear vibes'
  },
  {
    id: '6',
    name: 'Distressed Jeans',
    brand: 'Rogue Garms',
    price: 75,
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop',
    url: '/products/distressed-jeans',
    tags: ['jeans', 'distressed'],
    description: 'Classic denim with authentic distressing'
  }
];

// Mock search function
function searchProducts(query) {
  const lowerQuery = query.toLowerCase();
  
  // Simple keyword matching
  const keywords = lowerQuery.split(' ');
  const results = mockProducts.filter(product => {
    const searchText = `${product.name} ${product.brand} ${product.tags.join(' ')} ${product.description}`.toLowerCase();
    return keywords.some(keyword => searchText.includes(keyword));
  });
  
  // Add some randomness for demo purposes
  if (results.length === 0) {
    return mockProducts.slice(0, 3);
  }
  
  return results.slice(0, 6);
}

// Create HTTP server
const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // API endpoints
  if (url.pathname === '/api/fashion-search' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { query, limit = 6 } = JSON.parse(body);
        const products = searchProducts(query);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          products: products.slice(0, limit),
          query,
          total: products.length,
          success: true
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
    });
    return;
  }
  
  if (url.pathname === '/api/analytics' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('📊 Analytics:', data);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
    });
    return;
  }
  
  // Serve static files
  let filePath = url.pathname === '/' ? '/simple-demo.html' : url.pathname;
  if (filePath.startsWith('/')) {
    filePath = filePath.substring(1);
  }
  
  const fullPath = join(__dirname, filePath);
  
  if (existsSync(fullPath)) {
    try {
      const content = readFileSync(fullPath);
      const ext = filePath.split('.').pop();
      
      const mimeTypes = {
        'html': 'text/html',
        'js': 'application/javascript',
        'css': 'text/css',
        'json': 'application/json'
      };
      
      res.writeHead(200, { 
        'Content-Type': mimeTypes[ext] || 'text/plain' 
      });
      res.end(content);
    } catch (error) {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('🚀 Rogue Garms Guide Widget Demo Server');
  console.log(`📱 Local: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
  console.log('');
  console.log('🎯 Demo Features:');
  console.log('  • Apple-style glassmorphism');
  console.log('  • Three size states (XS/M/L)');
  console.log('  • Keyboard navigation');
  console.log('  • Session management');
  console.log('  • Mock search API');
  console.log('');
  console.log('⌨️  Keyboard Shortcuts:');
  console.log('  • Enter: Search');
  console.log('  • Esc: Minimize');
  console.log('  • ←/→: Navigate carousel');
  console.log('  • g: Toggle grid/carousel');
  console.log('');
  console.log('Press Ctrl+C to stop');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down demo server...');
  server.close(() => {
    console.log('✅ Demo server stopped');
    process.exit(0);
  });
});
