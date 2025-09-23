# Theming Guide

## Overview

The Rogue Garms Guide Widget uses CSS custom properties (CSS variables) for theming, allowing complete customization while maintaining the Apple-style glassmorphism aesthetic.

## CSS Variables

### Core Glassmorphism Variables

```css
:root {
  /* Glass Effect */
  --rg-glass-blur: 14px;                    /* Backdrop blur amount */
  --rg-glass-saturate: 1.2;                 /* Color saturation */
  --rg-glass-tint: rgba(12, 14, 18, 0.36);  /* Glass tint color */
  
  /* Strokes */
  --rg-stroke-in: rgba(255, 255, 255, 0.22); /* Inner stroke */
  --rg-stroke-out: rgba(0, 0, 0, 0.12);     /* Outer stroke */
  
  /* Border Radius */
  --rg-radius-xs: 12px;                      /* XS size radius */
  --rg-radius-m: 16px;                       /* M size radius */
  --rg-radius-l: 20px;                       /* L size radius */
}
```

### Typography Variables

```css
:root {
  /* Text Colors */
  --rg-text: #ffffff;                       /* Primary text */
  --rg-text-dim: rgba(255, 255, 255, 0.72); /* Secondary text */
  --rg-text-muted: rgba(255, 255, 255, 0.5); /* Muted text */
  
  /* Accent Colors */
  --rg-accent: #6B86FF;                     /* Primary accent */
  --rg-accent-hover: #5A7AFF;               /* Accent hover state */
}
```

### Animation Variables

```css
:root {
  /* Timing */
  --rg-ease: cubic-bezier(0.2, 0.8, 0.2, 1); /* Easing function */
  --rg-dur-fast: 140ms;                      /* Fast animation */
  --rg-dur-normal: 180ms;                    /* Normal animation */
  
  /* Spacing */
  --rg-space-xs: 4px;                        /* Extra small spacing */
  --rg-space-sm: 8px;                        /* Small spacing */
  --rg-space-md: 12px;                       /* Medium spacing */
  --rg-space-lg: 16px;                       /* Large spacing */
  --rg-space-xl: 24px;                       /* Extra large spacing */
}
```

### Shadow Variables

```css
:root {
  /* Shadows */
  --rg-shadow-ambient: 0 1px 3px rgba(0, 0, 0, 0.1);
  --rg-shadow-elevation: 0 4px 12px rgba(0, 0, 0, 0.15);
  --rg-shadow-strong: 0 8px 24px rgba(0, 0, 0, 0.2);
}
```

## Theme Presets

### Dark Theme (Default)

```css
[data-theme="dark"] {
  --rg-glass-tint: rgba(12, 14, 18, 0.36);
  --rg-text: #ffffff;
  --rg-text-dim: rgba(255, 255, 255, 0.72);
  --rg-text-muted: rgba(255, 255, 255, 0.5);
  --rg-stroke-in: rgba(255, 255, 255, 0.22);
  --rg-stroke-out: rgba(0, 0, 0, 0.12);
}
```

### Light Theme

```css
[data-theme="light"] {
  --rg-glass-tint: rgba(255, 255, 255, 0.25);
  --rg-text: #1a1a1a;
  --rg-text-dim: rgba(26, 26, 26, 0.72);
  --rg-text-muted: rgba(26, 26, 26, 0.5);
  --rg-stroke-in: rgba(255, 255, 255, 0.8);
  --rg-stroke-out: rgba(0, 0, 0, 0.1);
}
```

### Auto Theme (System Preference)

```css
@media (prefers-color-scheme: dark) {
  :root {
    --rg-glass-tint: rgba(12, 14, 18, 0.36);
    --rg-text: #ffffff;
    --rg-text-dim: rgba(255, 255, 255, 0.72);
  }
}

@media (prefers-color-scheme: light) {
  :root {
    --rg-glass-tint: rgba(255, 255, 255, 0.25);
    --rg-text: #1a1a1a;
    --rg-text-dim: rgba(26, 26, 26, 0.72);
  }
}
```

## Brand Integration

### Custom Brand Colors

```css
:root {
  /* Replace with your brand colors */
  --rg-accent: #your-brand-color;
  --rg-accent-hover: #your-brand-color-hover;
  
  /* Optional: Custom glass tint */
  --rg-glass-tint: rgba(your-r, your-g, your-b, 0.36);
}
```

### Brand-Specific Glass Effects

```css
/* Subtle brand tint */
:root {
  --rg-glass-tint: rgba(106, 134, 255, 0.15); /* Blue tint */
}

/* Warm brand tint */
:root {
  --rg-glass-tint: rgba(255, 165, 0, 0.15); /* Orange tint */
}

/* Cool brand tint */
:root {
  --rg-glass-tint: rgba(0, 255, 127, 0.15); /* Green tint */
}
```

## Advanced Customization

### Custom Glass Surfaces

```css
/* Frosted glass effect */
.custom-glass {
  background: var(--rg-glass-tint);
  backdrop-filter: blur(var(--rg-glass-blur)) saturate(var(--rg-glass-saturate));
  border: 1px solid var(--rg-stroke-in);
  box-shadow: var(--rg-shadow-ambient);
}

/* Enhanced glass with gradient */
.enhanced-glass {
  background: linear-gradient(135deg, 
    var(--rg-glass-tint) 0%, 
    rgba(255, 255, 255, 0.1) 100%
  );
  backdrop-filter: blur(var(--rg-glass-blur)) saturate(var(--rg-glass-saturate));
  border: 1px solid var(--rg-stroke-in);
}
```

### Custom Animations

```css
/* Custom pulse animation */
@keyframes custom-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
}

.custom-pulse {
  animation: custom-pulse 2s ease-in-out infinite;
}

/* Custom slide animation */
@keyframes custom-slide {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.custom-slide {
  animation: custom-slide var(--rg-dur-normal) var(--rg-ease);
}
```

### Custom Button Styles

```css
/* Primary button customization */
.btn-primary {
  background: var(--rg-accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: var(--rg-space-sm) var(--rg-space-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--rg-dur-fast) var(--rg-ease);
}

.btn-primary:hover {
  background: var(--rg-accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--rg-shadow-elevation);
}

/* Secondary button customization */
.btn-secondary {
  background: transparent;
  color: var(--rg-text);
  border: 1px solid var(--rg-stroke-in);
  border-radius: 8px;
  padding: var(--rg-space-sm) var(--rg-space-md);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--rg-dur-fast) var(--rg-ease);
}

.btn-secondary:hover {
  background: var(--rg-stroke-in);
  border-color: var(--rg-accent);
}
```

## Responsive Theming

### Mobile Adjustments

```css
@media (max-width: 768px) {
  :root {
    /* Reduce blur for better performance */
    --rg-glass-blur: 8px;
    
    /* Adjust spacing for mobile */
    --rg-space-sm: 6px;
    --rg-space-md: 10px;
    --rg-space-lg: 14px;
    
    /* Smaller border radius */
    --rg-radius-xs: 8px;
    --rg-radius-m: 12px;
    --rg-radius-l: 16px;
  }
}
```

### High DPI Displays

```css
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  :root {
    /* Enhanced blur for retina displays */
    --rg-glass-blur: 16px;
    
    /* Sharper strokes */
    --rg-stroke-in: rgba(255, 255, 255, 0.25);
    --rg-stroke-out: rgba(0, 0, 0, 0.15);
  }
}
```

## Accessibility Theming

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  :root {
    /* Enhanced contrast */
    --rg-glass-tint: rgba(0, 0, 0, 0.8);
    --rg-text: #ffffff;
    --rg-text-dim: #ffffff;
    --rg-stroke-in: #ffffff;
    --rg-stroke-out: #000000;
  }
  
  [data-theme="light"] {
    --rg-glass-tint: rgba(255, 255, 255, 0.9);
    --rg-text: #000000;
    --rg-text-dim: #000000;
    --rg-stroke-in: #000000;
    --rg-stroke-out: #ffffff;
  }
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    /* Disable animations */
    --rg-dur-fast: 0.01ms;
    --rg-dur-normal: 0.01ms;
  }
  
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Implementation Examples

### Basic Brand Integration

```html
<style>
  :root {
    /* Your brand colors */
    --rg-accent: #ff6b6b;
    --rg-accent-hover: #ff5252;
    
    /* Optional: Custom glass tint */
    --rg-glass-tint: rgba(255, 107, 107, 0.15);
  }
</style>
```

### Advanced Customization

```html
<style>
  :root {
    /* Brand colors */
    --rg-accent: #your-brand-color;
    --rg-accent-hover: #your-brand-color-hover;
    
    /* Custom glass effect */
    --rg-glass-blur: 20px;
    --rg-glass-saturate: 1.5;
    --rg-glass-tint: rgba(your-r, your-g, your-b, 0.2);
    
    /* Custom spacing */
    --rg-space-md: 16px;
    --rg-space-lg: 24px;
    
    /* Custom animations */
    --rg-dur-fast: 200ms;
    --rg-dur-normal: 300ms;
  }
  
  /* Custom glass surface */
  .rg-widget {
    background: linear-gradient(135deg, 
      var(--rg-glass-tint) 0%, 
      rgba(255, 255, 255, 0.1) 100%
    );
    backdrop-filter: blur(var(--rg-glass-blur)) saturate(var(--rg-glass-saturate));
    border: 2px solid var(--rg-stroke-in);
    box-shadow: var(--rg-shadow-strong);
  }
</style>
```

### Dynamic Theming

```javascript
// Change theme based on time of day
function updateTheme() {
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;
  
  document.documentElement.setAttribute('data-theme', isDay ? 'light' : 'dark');
}

// Update theme every minute
setInterval(updateTheme, 60000);
updateTheme(); // Initial call
```

## Testing Your Theme

### Theme Preview

```html
<!-- Test your theme with this preview -->
<div class="glass-surface" style="
  width: 300px;
  height: 200px;
  padding: var(--rg-space-lg);
  margin: 20px;
">
  <h3 class="text-primary">Theme Preview</h3>
  <p class="text-secondary">This shows how your theme will look</p>
  <button class="btn-primary">Test Button</button>
</div>
```

### Color Contrast Testing

```javascript
// Test color contrast ratios
function testContrast(foreground, background) {
  // Implementation for contrast testing
  // Should return ratio >= 4.5 for AA compliance
}
```

## Best Practices

### Performance
- Keep blur values reasonable (8-20px)
- Use hardware acceleration for animations
- Test on low-end devices

### Accessibility
- Maintain 4.5:1 contrast ratio minimum
- Test with high contrast mode
- Ensure keyboard navigation works

### Brand Consistency
- Use your brand colors consistently
- Test across different backgrounds
- Consider both light and dark themes

### Browser Support
- Test in all target browsers
- Provide fallbacks for older browsers
- Use progressive enhancement

## Troubleshooting

### Common Issues

**Theme not applying?**
- Check CSS variable syntax
- Ensure proper CSS specificity
- Verify theme attribute is set

**Performance issues?**
- Reduce blur values
- Limit backdrop-filter usage
- Test on target devices

**Accessibility problems?**
- Check contrast ratios
- Test with screen readers
- Verify keyboard navigation

### Debug Mode

```css
/* Add borders to debug layout */
.debug * {
  border: 1px solid red !important;
}

/* Show CSS variables */
.debug::before {
  content: "Glass blur: " var(--rg-glass-blur);
  position: fixed;
  top: 0;
  left: 0;
  background: black;
  color: white;
  padding: 4px;
  z-index: 9999;
}
```
