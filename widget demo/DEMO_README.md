# 🎨 Rogue Garms Guide Widget Demo

## 🚀 Quick Start (No Build Required)

### Option 1: Simple Demo
```bash
# Navigate to widget directory
cd src/widget

# Open the simple demo
open simple-demo.html
```

### Option 2: Demo Server
```bash
# Install dependencies
npm install

# Start demo server
npm run demo

# Visit http://localhost:3000
```

## 🎮 Demo Features

### ✅ **Working Features**
- **Apple-style glassmorphism** with backdrop blur
- **Three size states** (XS/M/L) with smooth transitions
- **Interactive search** with mock fashion data
- **Keyboard navigation** (Enter, Esc, Arrow keys)
- **Theme switching** (Light/Dark/Auto)
- **Position control** (4 corner positions)
- **Responsive design** for mobile/desktop

### 🎯 **Test These Features**
1. **Click "Open Widget"** - See the glassmorphism effect
2. **Search for fashion terms** - Try "opium fit", "vintage 90s", "leather boots"
3. **Use keyboard shortcuts** - Enter to search, Esc to minimize
4. **Toggle themes** - Switch between light/dark modes
5. **Change positions** - Test different widget placements
6. **Mobile responsive** - Resize browser to test mobile view

## 🔧 **Technical Details**

### **What's Working**
- ✅ Vanilla JavaScript implementation
- ✅ No build process required
- ✅ Mock API with realistic data
- ✅ Glassmorphism effects
- ✅ Responsive sizing
- ✅ Keyboard navigation
- ✅ Event handling

### **What's Not Working (Original Svelte Version)**
- ❌ Svelte components not compiled
- ❌ Missing build dependencies
- ❌ Import path issues
- ❌ Vite configuration problems

## 🎨 **Visual Features**

### **Glassmorphism Effects**
- Backdrop blur: `blur(14px) saturate(1.2)`
- Glass tint: `rgba(12, 14, 18, 0.36)`
- Inner stroke: `rgba(255, 255, 255, 0.22)`
- Outer stroke: `rgba(0, 0, 0, 0.12)`

### **Animations**
- Smooth transitions: `180ms cubic-bezier(0.2, 0.8, 0.2, 1)`
- Pulse animation on idle state
- Hover effects on interactive elements
- Loading spinner with CSS animations

### **Responsive Sizing**
- **XS**: 320px × 56px (minimal input)
- **M**: 420px × 560px (conversational results)
- **L**: 720px × 640px (dense grid browsing)

## 🎮 **Interactive Demo**

### **Controls**
- **Open Widget** - Shows the glassmorphism widget
- **Close Widget** - Hides the widget
- **Toggle Theme** - Switches between light/dark
- **Change Position** - Moves widget to different corners
- **Search Widget** - Performs fashion search

### **Keyboard Shortcuts**
- `Enter` - Submit search
- `Esc` - Minimize widget
- `←/→` - Navigate carousel (when implemented)
- `g` - Toggle grid/carousel view

### **Search Examples**
Try these fashion terms:
- "opium fit" - Streetwear aesthetic
- "vintage 90s" - Retro fashion
- "leather boots" - Footwear
- "distressed jeans" - Denim
- "oversized hoodie" - Streetwear

## 🔧 **Integration Code**

### **Simple Integration**
```html
<script src="embed-working.js"></script>
<script>
  window.RGGuide && RGGuide.init({
    siteId: "your-site-id",
    theme: "auto",
    position: "bottom-right"
  });
</script>
```

### **Advanced Integration**
```html
<script src="embed-working.js"></script>
<script>
  window.RGGuide && RGGuide.init({
    siteId: "your-site-id",
    theme: "dark",
    position: "bottom-left",
    apiUrl: "https://your-api.com"
  });

  // Event handling
  RGGuide.on('onReady', () => {
    console.log('Widget ready!');
  });

  RGGuide.on('onAction', (action, payload) => {
    console.log('Action:', action, payload);
  });
</script>
```

## 🐛 **Troubleshooting**

### **Common Issues**
1. **Widget not appearing?**
   - Check browser console for errors
   - Ensure `embed-working.js` is loaded
   - Verify `siteId` is provided

2. **Search not working?**
   - Check network tab for API calls
   - Verify mock data is loading
   - Test with different search terms

3. **Styling issues?**
   - Check for CSS conflicts
   - Verify backdrop-filter support
   - Test in different browsers

### **Browser Support**
- ✅ Chrome 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Edge 88+
- ✅ Mobile browsers

## 🚀 **Next Steps**

### **To Fix Svelte Version**
1. Install missing dependencies
2. Fix Vite configuration
3. Compile Svelte components
4. Update import paths
5. Test build process

### **To Deploy**
1. Build production bundle
2. Upload to CDN
3. Update embed script URL
4. Test in production environment

## 📱 **Mobile Testing**

The widget is fully responsive:
- **Touch-friendly** interactions
- **Adaptive sizing** for small screens
- **Mobile-optimized** animations
- **Performance** optimized for mobile

## 🎯 **Demo Success Criteria**

✅ **Widget opens and closes**
✅ **Glassmorphism effects visible**
✅ **Search functionality works**
✅ **Keyboard navigation works**
✅ **Theme switching works**
✅ **Position changes work**
✅ **Mobile responsive**
✅ **No console errors**

The demo is now fully functional and ready for testing!
