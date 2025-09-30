# Enhanced Home Page - Visual Layout Guide

## Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│                       MODERN HEADER                          │
│  [Logo] [Nav] [Search] [Notifications] [Profile] [Theme]   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ✨ Welcome back, John!                 [Explore Communities]│
│  Stay connected with your communities                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│ 📊 Stats Card │ 📊 Stats Card │ 📊 Stats Card│
│              │              │              │
│ Joined       │ Recent       │ Total        │
│ Communities  │ Activities   │ Members      │
│     5        │     23       │    1,247     │
└──────────────┴──────────────┴──────────────┘

┌────────────────────────────────┬──────────────────┐
│  👥 My Communities             │  📈 Recent       │
│                                │     Activity     │
│  ┌─────────────┬─────────────┐│                  │
│  │ 🎨 Community│ 💼 Community││  ┌──────────────┐│
│  │   Card 1    │   Card 2    ││  │ Activity 1   ││
│  │             │             ││  │ 📝 New Post  ││
│  │ [Avatar]    │ [Avatar]    ││  │ in Design    ││
│  │ Design Pro  │ Business    ││  │ Community    ││
│  │             │             ││  │ 💬 5  ❤️ 12  ││
│  │ 👥 234      │ 👥 567      ││  └──────────────┘│
│  │ [Active]    │ [Trial]     ││                  │
│  │                           ││  ┌──────────────┐│
│  │ 🕐 2h ago   │ 🕐 5h ago   ││  │ Activity 2   ││
│  │ [View →]    │ [View →]    ││  │ 📅 Event     ││
│  └─────────────┴─────────────┘│  │ Workshop     ││
│                                │  │ Tomorrow     ││
│  ┌─────────────┬─────────────┐│  └──────────────┘│
│  │ 🎮 Community│ 📚 Community││                  │
│  │   Card 3    │   Card 4    ││  ┌──────────────┐│
│  │             │             ││  │ Activity 3   ││
│  │ [Avatar]    │ [Avatar]    ││  │ 👥 New       ││
│  │ Gaming Hub  │ Book Club   ││  │ Member       ││
│  │             │             ││  │ joined       ││
│  │ 👥 1,234    │ 👥 89       ││  └──────────────┘│
│  │ [Active]    │ [Active]    ││                  │
│  │                           ││  ┌──────────────┐│
│  │ 🕐 1d ago   │ 🕐 3d ago   ││  │ Activity 4   ││
│  │ [View →]    │ [View →]    ││  │ 🎥 Video     ││
│  └─────────────┴─────────────┘│  │ Call Ended   ││
│                                │  └──────────────┘│
└────────────────────────────────┴──────────────────┘
```

## Component Breakdown

### 1. Header Section
```
┌──────────────────────────────────────────────────────┐
│ ✨ Welcome back, John!        [Explore Communities] │
│ Stay connected with your communities                 │
└──────────────────────────────────────────────────────┘
```
- Sparkles icon + personalized greeting (3xl bold)
- Subtitle in muted text
- Gradient CTA button (purple → blue)

### 2. Statistics Dashboard (3 columns)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ ━━━━━━━━━━━━ │ │ ━━━━━━━━━━━━ │ │ ━━━━━━━━━━━━ │
│              │ │              │ │              │
│ Joined       │ │ Recent       │ │ Total        │
│ Communities  │ │ Activities   │ │ Members      │
│              │ │              │ │              │
│     5     👥 │ │    23     📊 │ │  1,247   📈  │
└──────────────┘ └──────────────┘ └──────────────┘
  Purple border    Blue border      Green border
```

### 3. Community Card (Detailed View)
```
┌─────────────────────────────────────────────┐
│ ╭───────╮                                   │
│ │ 🎨    │  Design Professionals             │ ← Bold, hover: primary color
│ │ LOGO  │  A community for designers...     │ ← 2-line description
│ │ 64x64 │                                   │
│ ╰───────╯  [👥 234] [✓ Active]             │ ← Badges
│     ↑                                       │
│   Ring effect                               │
│                                             │
│ ─────────────────────────────────────────── │ ← Border
│ 🕐 2 hours ago                    [View →]  │ ← Footer
└─────────────────────────────────────────────┘
   ↑                                      ↑
Hover: shadow-lg                  Animated arrow
Hover: border-primary
```

### 4. Activity Card (Sidebar)
```
┌──────────────────────────────┐
│ ┌──┐                         │
│ │📝│ New Post                │ ← Bold title
│ └──┘ Design Community        │ ← Community name
│   ↑                          │
│  Icon                        │
│  bg-blue                     │
│                              │
│ Check out this new design... │ ← 2-line preview
│                              │
│ 🕐 2h ago  💬 5  ❤️ 12      │ ← Engagement
└──────────────────────────────┘
    Hover: shadow-md
    Hover: border-primary
```

## Color Scheme

### Statistics Cards
- **Purple accent** (Joined Communities): `border-l-purple-500`
- **Blue accent** (Recent Activities): `border-l-blue-500`
- **Green accent** (Total Members): `border-l-green-500`

### Activity Types
- **Posts**: Blue background (`bg-blue-100 text-blue-600`)
- **Events**: Green background (`bg-green-100 text-green-600`)
- **Members**: Purple background (`bg-purple-100 text-purple-600`)
- **Video Calls**: Red background (`bg-red-100 text-red-600`)

### Subscription Status
- **Active**: Green badge (`border-green-500 text-green-600`)
- **Trial**: Blue badge (`border-blue-500 text-blue-600`)

### Interactive Elements
- **Primary Gradient**: `from-purple-600 to-blue-600`
- **Hover Effects**: 
  - Shadows: `hover:shadow-lg`
  - Borders: `hover:border-primary/50`
  - Transforms: `hover:translate-x-1` (arrows)

## Responsive Breakpoints

### Desktop (lg: 1024px+)
```
[─────────── Communities (66%) ───────────][── Activity (33%) ──]
     2-column grid                         Sidebar (sticky)
```

### Tablet (md: 768px - 1023px)
```
[─────────── Communities ───────────]
     2-column grid

[────────── Activity ──────────]
     Full width below
```

### Mobile (< 768px)
```
[─── Communities ───]
   1-column stack

[──── Activity ─────]
   1-column stack
```

## Interaction Patterns

### Community Cards
1. **Hover State**
   - Shadow elevation increases
   - Border transitions to primary color
   - Avatar ring glows
   - Title color changes
   - View button background appears
   - Arrow translates right

2. **Click Action**
   - Navigate to `/community/{id}`
   - Maintains scroll position

### Activity Cards
1. **Hover State**
   - Shadow increases
   - Border subtle glow
   - Title color changes

2. **Click Action**
   - Navigate to community
   - Deep link to specific activity (future)

### CTA Buttons
1. **Primary Gradient Button**
   - Gradient: purple → blue
   - Hover: Darker gradient
   - Shadow elevation
   - Scale transform (subtle)

2. **View Buttons**
   - Ghost variant
   - Hover: background + text color
   - Arrow animation

## Typography Hierarchy

```
H1: 3xl bold (Welcome message)          → Most important
H2: xl semibold (Section headers)       → Sections
H3: base/sm font-semibold (Card titles) → Cards
Body: sm (Descriptions)                 → Content
Small: xs (Metadata, timestamps)        → Details
```

## Spacing System

- **Page padding**: `px-4 py-8`
- **Section margins**: `mb-8`
- **Card gaps**: `gap-4` (grid)
- **Internal card spacing**: `p-5`
- **Icon gaps**: `gap-2`

## Accessibility Features

✅ Proper heading hierarchy
✅ Alt text on images/avatars
✅ Touch targets min 44px
✅ Keyboard navigation
✅ Focus indicators
✅ Color contrast ratios
✅ Screen reader labels
✅ Semantic HTML

## Loading States

### Community Cards (Skeleton)
```
┌─────────────────┐
│ ⬜ ▢▢▢▢▢▢▢▢▢▢ │
│    ▢▢▢▢▢▢     │
│    ▢▢▢▢▢      │
└─────────────────┘
```

### Activity Cards (Skeleton)
```
┌──────────────┐
│ ⬜ ▢▢▢▢▢▢▢▢ │
│    ▢▢▢▢▢    │
└──────────────┘
```

## Empty States

### No Communities
```
┌─────────────────────┐
│        🏠          │ ← Large emoji
│                     │
│  No communities yet │ ← Title
│                     │
│  Discover and join  │ ← Description
│  communities...     │
│                     │
│  [Find Communities] │ ← Gradient CTA
└─────────────────────┘
```

### No Activity
```
┌─────────────────┐
│       📱       │
│                 │
│ No activity yet │
│                 │
│ Activity from   │
│ your communities│
│ will appear here│
└─────────────────┘
```

This layout creates a clear visual hierarchy, making communities the primary focus while keeping activity accessible in a clean sidebar format.
