# Theme System - Quick Start Guide 🎨

## What's New?

A beautiful dark/light theme system has been added to High5 with these features:

### ✨ Features
- **🖥️ System Theme (Default)**: Automatically follows your OS settings
- **☀️ Quick Toggle**: Click the slider in the navbar to instantly switch between light and dark
- **⚙️ Theme Menu**: Access options for System, Light, or Dark mode
- **💾 Persistent**: Your theme preference is saved automatically
- **✨ Smooth Transitions**: All theme changes animate smoothly

## Where to Find It

### Theme Slider Location
In the **top right corner of the navbar** (next to the Logout button):
- **☀️🌙 Slider**: Quick toggle between light and dark
- **⚙️ Settings**: Open theme options menu

## How to Use

### Quick Toggle
1. Click the **☀️🌙 slider** in the navbar
2. Watch as the entire app smoothly transitions to the other theme

### Full Theme Menu
1. Click the **⚙️ settings icon** next to the slider
2. Choose your preferred option:
   - **🖥️ System** - Follow your OS settings
   - **☀️ Light** - Always light theme
   - **🌙 Dark** - Always dark theme
3. Menu closes automatically after selection

### Storage
- Your choice is saved in browser storage
- Same theme persists across sessions
- Works across all High5 pages

## System Preferences

### On First Visit
- App automatically detects your OS theme preference
- If you use dark mode on your computer → dark theme loads
- If you use light mode on your computer → light theme loads

### Changing System Preference
If you switch your OS theme setting:
- **If using "System" mode**: App updates automatically
- **If using "Light" or "Dark" mode**: App stays with your choice

## Technical Implementation

### New Files Created
```
frontend/src/
├── context/
│   └── ThemeContext.jsx          (Theme state management)
├── components/
│   ├── ThemeToggle.jsx           (The slider & menu)
│   └── ThemeToggle.css           (Styling for theme toggle)
├── App.jsx                        (Updated with ThemeProvider)
├── App.css                        (Theme variables added)
└── index.css                      (Base theme styles)
```

### Modified Files
- `App.jsx` - Wrapped with ThemeProvider
- `Navbar.jsx` - ThemeToggle added
- `App.css` - CSS variables added
- `index.css` - Dark theme styles added

## For Developers

### Using Theme in Components

```jsx
import { useTheme } from '../context/ThemeContext';

export function MyComponent() {
  const { resolvedTheme } = useTheme();
  
  return <div>Current theme: {resolvedTheme}</div>;
}
```

### Styling Components

Instead of hardcoding colors:
```css
/* ❌ Don't do this */
.button {
  background-color: #ffffff;
  color: #000000;
}

/* ✅ Do this instead */
.button {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}
```

### Available CSS Variables

**Background & Text:**
- `--bg-primary` - Main background
- `--bg-secondary` - Secondary/card background
- `--text-primary` - Main text
- `--text-secondary` - Secondary text

**UI Elements:**
- `--border-color` - Borders
- `--shadow-color` - Shadows
- `--input-bg` - Input background
- `--input-border` - Input border
- `--card-bg` - Card background
- `--card-shadow` - Card shadow

**Navigation:**
- `--navbar-bg` - Navbar background
- `--navbar-border` - Navbar border
- `--navbar-shadow` - Navbar shadow
- `--nav-link-color` - Navigation link color

## Customization

### Adding New Theme Colors

1. **Update `frontend/src/App.css`**

Add to light theme:
```css
[data-theme="light"] {
  --my-new-color: #value;
}
```

Add to dark theme:
```css
[data-theme="dark"] {
  --my-new-color: #value;
}
```

2. **Use in your component:**
```css
.my-component {
  color: var(--my-new-color);
}
```

## Colors Reference

### Light Theme
| Variable | Color |
|----------|-------|
| `--bg-primary` | #E2E8F0 (light gray) |
| `--bg-secondary` | #FFFFFF (white) |
| `--text-primary` | #000000 (black) |
| `--text-secondary` | #4B5563 (gray) |

### Dark Theme
| Variable | Color |
|----------|-------|
| `--bg-primary` | #1a1a1a (dark gray) |
| `--bg-secondary` | #2d2d2d (darker gray) |
| `--text-primary` | #e0e0e0 (light gray) |
| `--text-secondary` | #b0b0b0 (medium gray) |

## Browser Support

✅ Modern browsers (last 2 versions)
- Chrome/Edge 100+
- Firefox 95+
- Safari 12.1+
- Mobile browsers

## Tips & Tricks

### Check Current Theme Programmatically
```javascript
const theme = document.documentElement.getAttribute('data-theme');
console.log(theme); // 'light' or 'dark'
```

### Force a Specific Theme in Code
```javascript
document.documentElement.setAttribute('data-theme', 'dark');
localStorage.setItem('theme', 'dark');
```

### Test Dark Mode
Open DevTools → click ⋮ → More tools → Rendering → 
Scroll down and toggle "Emulate CSS media feature prefers-color-scheme"

## Known Behavior

- ✅ Theme preference persists across browser sessions
- ✅ System preference changes are detected automatically (when using System mode)
- ✅ All components update smoothly with 0.3s transitions
- ✅ High contrast colors in both themes for accessibility
- ✅ Works on mobile and desktop

## Questions?

Check `THEME_IMPLEMENTATION.md` for detailed technical documentation!
