# Theme System Implementation

## Overview
A complete dark/light theme system has been implemented for High5 with system preference detection and persistent user preferences.

## Features

### 1. **System Preference Detection**
- Automatically detects system theme preference on first load
- Uses CSS media query `prefers-color-scheme` to detect dark/light mode
- Default theme: **System** (respects OS settings)

### 2. **Theme Options**
The user can choose from three theme options:
- **🖥️ System**: Follows OS system settings
- **☀️ Light**: Always use light theme
- **🌙 Dark**: Always use dark theme

### 3. **Persistent Storage**
- Theme preference is saved in browser's localStorage
- User preference persists across sessions
- Key: `theme`

### 4. **Interactive Theme Slider**
Located in the navbar with two controls:
- **Slider Toggle**: Quick switch between current light/dark mode
- **Settings Menu**: Full theme option selector with keyboard-friendly design

### 5. **Smooth Transitions**
- All theme transitions are smooth with 0.3s easing
- No jarring color changes between themes

## Architecture

### File Structure
```
frontend/src/
├── context/
│   └── ThemeContext.jsx         # Theme state management
├── components/
│   ├── ThemeToggle.jsx          # Theme slider & menu component
│   ├── ThemeToggle.css          # Theme toggle styling
│   ├── Navbar.jsx               # Updated navbar with theme toggle
│   └── ... other components
├── App.jsx                       # Wrapped with ThemeProvider
├── App.css                       # Theme-aware CSS variables
├── index.css                     # Base theme styles
└── ... other files
```

### Components

#### ThemeContext.jsx
Provides theme management using React Context:
- Manages `theme` (system/light/dark)
- Manages `resolvedTheme` (actual current theme)
- Handles system media queries
- Persists preferences to localStorage

**Hook**: `useTheme()`
```javascript
const { theme, resolvedTheme, toggleTheme, setSystemTheme, isLoading } = useTheme();
```

#### ThemeToggle.jsx
Interactive UI component featuring:
- **Slider Button**: Quick toggle between light/dark
- **Settings Menu**: Three-option selector (System/Light/Dark)
- **Visual Feedback**: Shows current theme with emojis (☀️/🌙)
- **Accessibility**: Proper ARIA labels and keyboard support

#### Navbar.jsx
Updated to include:
- ThemeToggle component
- CSS variable support for theme-aware colors
- Smooth transitions

## CSS Variables

### Light Theme (Default)
```css
--bg-primary: #E2E8F0
--bg-secondary: #FFFFFF
--text-primary: #000000
--text-secondary: #4B5563
--input-bg: #F0F0F0
--input-border: #0078C8
--navbar-bg: #FFFFFF
--card-bg: #FFFFFF
```

### Dark Theme
```css
--bg-primary: #1a1a1a
--bg-secondary: #2d2d2d
--text-primary: #e0e0e0
--text-secondary: #b0b0b0
--input-bg: #3a3a3a
--input-border: #64b5f6
--navbar-bg: #2a2a2a
--card-bg: #2d2d2d
```

## How to Use

### For Users
1. Click the theme slider (☀️/🌙) in the navbar to toggle between light and dark
2. Click the settings icon (⚙️) next to the slider to open theme options
3. Select your preferred theme from the dropdown menu
4. Your preference is automatically saved

### For Developers

#### Adding Theme-Aware Styles
Use CSS variables in your components:

```jsx
// In .css file
.my-component {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
```

#### Accessing Theme in Components
```jsx
import { useTheme } from '../context/ThemeContext';

function MyComponent() {
  const { resolvedTheme } = useTheme();
  
  return (
    <div>
      Current theme: {resolvedTheme}
    </div>
  );
}
```

#### Adding New CSS Variables
1. Add variable to light theme in `App.css`:
```css
[data-theme="light"] {
  --my-color: #value;
}
```

2. Add variable to dark theme in `App.css`:
```css
[data-theme="dark"] {
  --my-color: #value;
}
```

3. Use in component:
```css
.component {
  color: var(--my-color);
}
```

## Technical Details

### System Preference Detection
```javascript
// Uses CSS media query
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

### Theme Application
- Applied via `data-theme` attribute on `html` and `body` elements
- CSS cascade uses this attribute for variable overrides
- Highly performant with minimal repaints

### localStorage Structure
```javascript
localStorage.getItem('theme') // Returns: "system", "light", or "dark"
```

## Browser Support
- ✅ Chrome/Edge 100+
- ✅ Firefox 95+
- ✅ Safari 12.1+
- ✅ Mobile browsers (iOS Safari 12.2+, Chrome Android)

## Accessibility Features
- ✅ Proper ARIA labels on interactive elements
- ✅ Semantic HTML structure
- ✅ Keyboard navigation support
- ✅ High contrast colors in both themes
- ✅ Respects `prefers-reduced-motion` (smooth transitions can be disabled)

## Performance Considerations
- Theme detection happens once on mount
- System preference listener only active when theme is "system"
- CSS custom properties provide excellent performance
- No JavaScript re-renders on every theme change after initial setup

## Troubleshooting

### Theme not persisting?
- Clear browser cache and localStorage
- Check browser localStorage is enabled
- Verify `localStorage.getItem('theme')` returns correct value

### Flash of wrong theme on page load?
- This is expected on first load before JavaScript executes
- Can be mitigated with theme preference in initial HTML

### Colors not updating?
- Ensure component uses CSS variables: `var(--variable-name)`
- Check CSS variable is defined for both themes
- Verify `data-theme` attribute is set on html/body

## Future Enhancements
- [ ] Add system preference detection toggle in settings
- [ ] Custom theme creation UI
- [ ] Auto-schedule theme changes based on time
- [ ] Theme sync across multiple tabs
- [ ] Accessibility contrast adjustment option
