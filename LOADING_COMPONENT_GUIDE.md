# Wuuble Loading Component Guide

## Overview

A modern, animated loading page component featuring the Wuuble brand with beautiful gradient backgrounds, smooth animations, and customizable messaging.

## Features

- **Modern Design**: Gradient background with animated floating elements
- **Wuuble Branding**: Large, gradient-colored "Wuuble" text with glowing effects
- **Smooth Animations**: 
  - Pulsing background orbs
  - Dual spinning loading spinners
  - Bouncing loading dots
  - Staggered animation delays
- **Customizable**: Custom loading messages and styling
- **Responsive**: Works on all screen sizes

## Usage

### Basic Usage

```tsx
import LoadingPage from '@/components/LoadingPage';

// Simple usage with default message
<LoadingPage />

// With custom message
<LoadingPage message="Preparing your workspace..." />

// With custom styling
<LoadingPage 
  message="Loading content..." 
  className="bg-opacity-95" 
/>
```

### Using the Loading Hook

The `useLoading` hook provides a convenient way to manage loading states:

```tsx
import { useLoading } from '@/hooks/useLoading';
import LoadingPage from '@/components/LoadingPage';

const MyComponent = () => {
  const { isLoading, message, showLoading, hideLoading } = useLoading();

  const handleAsyncOperation = async () => {
    showLoading("Processing your request...");
    try {
      await someAsyncOperation();
    } finally {
      hideLoading();
    }
  };

  return (
    <div>
      <button onClick={handleAsyncOperation}>
        Start Operation
      </button>
      
      {isLoading && <LoadingPage message={message} />}
    </div>
  );
};
```

## Demo

Visit `/loading-demo` in your application to see the loading component in action with:
- Interactive demo button
- Feature overview
- Auto-hide after 5 seconds

## Component Props

### LoadingPage

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `""` | Additional CSS classes |
| `message` | `string` | `"Loading..."` | Loading message to display |

### useLoading Hook

| Return Value | Type | Description |
|--------------|------|-------------|
| `isLoading` | `boolean` | Current loading state |
| `message` | `string` | Current loading message |
| `showLoading` | `(message?: string) => void` | Show loading with optional message |
| `hideLoading` | `() => void` | Hide loading |
| `setLoadingMessage` | `(message: string) => void` | Update loading message |

## Styling

The component uses Tailwind CSS classes and custom animation delays. The following custom CSS classes are available:

- `.animation-delay-200` - 200ms delay
- `.animation-delay-300` - 300ms delay  
- `.animation-delay-400` - 400ms delay
- `.animation-delay-500` - 500ms delay
- `.animation-delay-1000` - 1000ms delay
- `.animation-delay-2000` - 2000ms delay

## Integration Examples

### App-wide Loading

```tsx
// App.tsx
import { useLoading } from '@/hooks/useLoading';
import LoadingPage from '@/components/LoadingPage';

const App = () => {
  const { isLoading, message } = useLoading();

  return (
    <div>
      {/* Your app content */}
      
      {isLoading && <LoadingPage message={message} />}
    </div>
  );
};
```

### Page-specific Loading

```tsx
// Any page component
import { useEffect } from 'react';
import { useLoading } from '@/hooks/useLoading';
import LoadingPage from '@/components/LoadingPage';

const MyPage = () => {
  const { isLoading, showLoading, hideLoading } = useLoading();

  useEffect(() => {
    const loadData = async () => {
      showLoading("Loading page data...");
      try {
        await fetchPageData();
      } finally {
        hideLoading();
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return <LoadingPage message="Loading page data..." />;
  }

  return <div>Page content</div>;
};
```

## Technical Details

- Built with React and TypeScript
- Uses Tailwind CSS for styling
- Fully responsive design
- Zero external dependencies (beyond existing project stack)
- Optimized animations with GPU acceleration
- Accessible and keyboard-friendly

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

The component gracefully degrades in older browsers by falling back to simpler animations.