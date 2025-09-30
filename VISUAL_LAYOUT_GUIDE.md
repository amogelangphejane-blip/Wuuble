# Communities Page - Visual Layout Guide

## 📐 Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        ModernHeader                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ 🌟 Discover Communities      [Create Community Button] ║ │
│  ║ Join vibrant communities...                              ║ │
│  ║ 👥 X Communities | 🌍 Global Network                    ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🔍 Search... │ 🔽 Category │ ⬆️⬇️ Sort │             │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Showing X communities  │  [Category Badge]               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                 │
│  │ ╔═══════╗ │  │ ╔═══════╗ │  │ ╔═══════╗ │                 │
│  │ ║ Cover ║ │  │ ║ Cover ║ │  │ ║ Cover ║ │                 │
│  │ ╚═══╦═══╝ │  │ ╚═══╦═══╝ │  │ ╚═══╦═══╝ │                 │
│  │    (🖼️)    │  │    (🖼️)    │  │    (🖼️)    │                 │
│  │   Name    │  │   Name    │  │   Name    │                 │
│  │ Description│  │ Description│  │ Description│                 │
│  │ 👥 Members │  │ 👥 Members │  │ 👥 Members │                 │
│  │ #tag #tag │  │ #tag #tag │  │ #tag #tag │                 │
│  │  [Join]   │  │  [Join]   │  │  [Join]   │                 │
│  └───────────┘  └───────────┘  └───────────┘                 │
│                                                                 │
│  ⭐ Popular Communities                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🥇 [🖼️] Community Name  👥 X members      [Join]        │ │
│  │ 🥈 [🖼️] Community Name  👥 X members      [Join]        │ │
│  │ 🥉 [🖼️] Community Name  👥 X members      [Join]        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🎴 Community Card Structure

```
┌────────────────────────────────────┐
│ ╔════════════════════════════════╗ │ ← Gradient Cover (h-32)
│ ║  [Private] [Category]          ║ │   Blue→Purple→Pink
│ ║                                ║ │
│ ╚════════════════════════════════╝ │
│        ┌─────────────┐             │
│        │   ┌─────┐   │             │ ← Profile Picture (96px)
│        │   │ 🖼️  │🌍 │             │   Overlapping cover
│        │   └─────┘   │             │   White border + Ring
│        └─────────────┘             │
│                                    │
│   Community Name                   │ ← Title (text-xl)
│   This is the community            │ ← Description (2 lines)
│   description text here...         │
│                                    │
│   ┌─┐ 1,234 members    👁️ Active  │ ← Stats Row
│   └─┘                              │
│                                    │
│   #tag #tag #tag                   │ ← Tags
│                                    │
│   ┌────────────────────────────┐   │
│   │  ❤️  Join Community        │   │ ← CTA Button
│   └────────────────────────────┘   │
└────────────────────────────────────┘
```

## 📏 Detailed Measurements

### Hero Section
```
Height:       auto (responsive to content)
Padding:      p-6 (24px all sides)
Margin:       mb-10 (40px bottom)
Background:   white/80 with backdrop-blur
Border:       rounded-2xl with border
Shadow:       shadow-lg
```

### Search Bar Section
```
Height:       py-6 (48px vertical padding)
Layout:       Horizontal flex (wraps on mobile)
Gap:          gap-4 (16px between elements)
Margin:       mb-8 (32px bottom)
```

### Community Cards
```
Width:        100% (mobile), 50% (tablet), 33.33% (desktop)
Height:       auto (content-based)
Gap:          gap-6 (24px between cards)
Border:       border-2 (transparent → blue-200 on hover)
Shadow:       default → shadow-2xl on hover
```

### Avatar Positioning
```
Position:     absolute
Top:          -3rem (-48px from card top)
Left:         1.5rem (24px from card left)
Size:         96px × 96px (w-24 h-24)
Z-index:      10
```

### Cover Photo
```
Height:       8rem (128px)
Background:   Gradient (blue-500 → purple-500 → pink-500)
Overflow:     hidden
Position:     relative
```

## 🎨 Visual Hierarchy

### Level 1 (Most Prominent)
```
1. Profile Pictures (96px, overlapping, shadowed)
2. Community Names (text-xl font-bold)
3. Join Buttons (gradient, full-width)
```

### Level 2 (Secondary)
```
4. Descriptions (text-base, 2 lines)
5. Member Counts (with icon)
6. Category Badges (on cover)
```

### Level 3 (Tertiary)
```
7. Tags (smaller badges)
8. Status Indicators
9. Active Status
```

## 🎭 Interactive States

### Default State
```
Card:
- Border: 2px transparent
- Shadow: sm
- Background: white/90

Avatar:
- Ring: 2px blue-200
- Shadow: xl
```

### Hover State
```
Card:
- Border: 2px blue-200
- Shadow: 2xl
- Transform: none (no scale on card itself)

Avatar:
- Ring: 4px blue-300 (doubled thickness)
- Shadow: xl (maintained)

Button:
- Transform: scale(1.02)
- Shadow: lg → xl
```

### Active/Click State
```
Button:
- Pressed effect (browser default)
- Ripple effect (if implemented)
```

## 📊 Grid Breakpoints

```css
/* Mobile (< 768px) */
.grid {
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
}

/* Tablet (≥ 768px) */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop (≥ 1024px) */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## 🏆 Popular Section Layout

```
┌──────────────────────────────────────────────────────────┐
│  ⭐ Popular Communities                                  │
│  Most active and engaging communities                   │
├──────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐ │
│  │  🥇  [Avatar]  Community Name  👥 X  [Join]      │ │
│  │  12    64px    Bold Text      Stats  Button      │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  🥈  [Avatar]  Community Name  👥 X  [Join]      │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  🥉  [Avatar]  Community Name  👥 X  [Join]      │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  4   [Avatar]  Community Name  👥 X  [Join]      │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  5   [Avatar]  Community Name  👥 X  [Join]      │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## 🎯 Avatar Specifications

### Main Cards Avatar
```
Dimensions:   96px × 96px
Border:       4px white
Ring:         2px blue-200 (4px blue-300 on hover)
Shadow:       shadow-xl
Position:     Absolute, overlapping cover
Fallback:     Gradient background + Initials (2 letters)
```

### Popular Section Avatar
```
Dimensions:   64px × 64px
Border:       3px white
Ring:         2px orange-200 (4px orange-300 on hover)
Shadow:       shadow-lg
Position:     Inline with content
Fallback:     Orange-pink gradient + Initials
```

### Status Badge (on Avatar)
```
Size:         24px × 24px
Position:     Top-right of avatar (-top-1 -right-1)
Background:   Green-500 (for public)
Border:       2px white
Icon:         Globe (12px)
```

## 🔤 Typography Scale

```
Hero Title:           text-4xl (36px)   font-bold
Section Headers:      text-3xl (30px)   font-bold
Card Titles:          text-xl  (20px)   font-bold
Body/Description:     text-base (16px)  regular
Small Text:           text-sm  (14px)   regular
Tiny Text:            text-xs  (12px)   regular

Line Heights:
- Headings:  leading-tight
- Body:      leading-normal
- Small:     leading-relaxed
```

## 🌈 Color Palette Visualization

```
Primary Gradient (Buttons, Titles):
  ████████ Blue-600 (#2563eb)
  ████████ Purple-600 (#9333ea)

Secondary Gradient (Popular Section):
  ████████ Orange-500 (#f97316)
  ████████ Pink-500 (#ec4899)

Accent Gradient (Stars, Rankings):
  ████████ Yellow-400 (#fbbf24)
  ████████ Orange-500 (#f97316)

Cover Gradient:
  ████████ Blue-500 (#3b82f6)
  ████████ Purple-500 (#a855f7)
  ████████ Pink-500 (#ec4899)

Background:
  ░░░░░░░░ Gray-50 (#f9fafb)
  ░░░░░░░░ Blue-50/30 (semi-transparent)
  ░░░░░░░░ Purple-50/30 (semi-transparent)
```

## 📐 Spacing System

```
Container:        max-w-7xl  (1280px max width)
Padding:          px-4       (16px horizontal)
Section Gaps:     gap-6      (24px)
Card Padding:     p-4, p-6   (16-24px)
Element Margins:  mb-2 to mb-16 (8px to 64px)
```

## ✨ Animation Timing

```
Fast:       200ms  (subtle interactions)
Standard:   300ms  (most transitions)
Slow:       500ms  (major state changes)

Easing:
- Default:    ease
- Standard:   cubic-bezier(0.4, 0, 0.2, 1)
- Sharp:      cubic-bezier(0.4, 0, 0.6, 1)
```

---

**Layout Version**: 2.0  
**Responsive**: Mobile-first design  
**Grid System**: Tailwind CSS  
**Browser Support**: Modern browsers (Chrome 88+, Firefox 103+, Safari 15.4+)  
