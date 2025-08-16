# Tailwind CSS Components Used in MediHelper

This document tracks all Tailwind CSS components and classes used throughout the MediHelper application.

## Layout Components

### Container & Spacing
- `container` - Main container wrapper
- `max-w-*` - Max width utilities
- `mx-auto` - Center horizontally
- `px-*`, `py-*` - Padding utilities
- `m-*`, `mt-*`, `mb-*`, `ml-*`, `mr-*` - Margin utilities

### Flexbox & Grid
- `flex`, `flex-col`, `flex-row` - Flexbox utilities
- `items-center`, `justify-center`, `justify-between` - Flex alignment
- `grid`, `grid-cols-*` - Grid utilities
- `gap-*` - Gap utilities

### Positioning
- `relative`, `absolute`, `fixed` - Position utilities
- `top-*`, `bottom-*`, `left-*`, `right-*` - Position coordinates
- `z-*` - Z-index utilities

## Typography

### Text Styling
- `text-*` - Text color utilities
- `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl` - Font sizes
- `font-bold`, `font-semibold`, `font-medium` - Font weights
- `text-center`, `text-left`, `text-right` - Text alignment

### Headings
- `text-3xl`, `text-4xl` - Large headings
- `font-bold` - Bold headings

## Colors & Backgrounds

### Background Colors
- `bg-white`, `bg-gray-50`, `bg-gray-100` - Light backgrounds
- `bg-blue-500`, `bg-blue-600` - Primary blue colors
- `bg-green-500`, `bg-red-500` - Status colors

### Text Colors
- `text-gray-900`, `text-gray-700`, `text-gray-600` - Dark text
- `text-blue-600`, `text-green-600` - Accent colors
- `text-white` - White text

## Interactive Elements

### Buttons
- `bg-blue-500 hover:bg-blue-600` - Primary buttons
- `bg-gray-200 hover:bg-gray-300` - Secondary buttons
- `rounded-lg`, `rounded-full` - Border radius
- `px-4 py-2`, `px-6 py-3` - Button padding
- `transition-colors` - Smooth color transitions

### Cards
- `bg-white` - Card background
- `rounded-xl`, `rounded-2xl` - Card border radius
- `shadow-sm`, `shadow-md`, `shadow-lg` - Card shadows
- `border border-gray-200` - Card borders

### Input Fields
- `border border-gray-300` - Input borders
- `rounded-md` - Input border radius
- `focus:ring-2 focus:ring-blue-500` - Focus states
- `px-3 py-2` - Input padding

## Responsive Design

### Breakpoints
- `sm:*`, `md:*`, `lg:*`, `xl:*` - Responsive prefixes
- `hidden`, `block`, `flex` - Display utilities

## Icons & Graphics

### Icon Styling
- `w-5 h-5`, `w-6 h-6` - Icon sizes
- `text-gray-400`, `text-blue-500` - Icon colors

## Status Indicators

### Pills & Badges
- `bg-green-100 text-green-800` - Success states
- `bg-red-100 text-red-800` - Error states
- `bg-yellow-100 text-yellow-800` - Warning states
- `rounded-full px-2 py-1` - Badge styling

## Animations & Transitions

### Transitions
- `transition-all`, `transition-colors` - Transition utilities
- `duration-200`, `duration-300` - Transition duration
- `ease-in-out` - Transition timing

### Hover Effects
- `hover:scale-105` - Scale on hover
- `hover:shadow-lg` - Shadow on hover
- `hover:bg-gray-50` - Background change on hover

## Custom Components

### Navigation
- `sticky top-0` - Sticky navigation
- `backdrop-blur-sm` - Glass effect
- `border-b border-gray-200` - Bottom border
- `fixed bottom-0` - Fixed bottom navigation
- `z-50` - High z-index for overlays

### Calendar Grid
- `grid grid-cols-7` - 7-column grid for days
- `aspect-square` - Square aspect ratio
- `border border-gray-200` - Grid borders

### Medication Cards
- `bg-gradient-to-r` - Gradient backgrounds
- `border-l-4` - Left border accent
- `hover:shadow-md` - Hover effects

### Homepage Components
- `rounded-2xl` - Large border radius for cards
- `shadow-sm` - Subtle shadows
- `bg-primary-50` - Light primary background
- `text-primary-600` - Primary text color
- `space-y-3` - Vertical spacing between elements
- `inline-flex items-center px-2 py-1 rounded-full` - Status badges
- `bg-green-100 text-green-800` - Success status
- `bg-yellow-100 text-yellow-800` - Pending status
- `bg-orange-100 text-orange-600` - Morning icon background
- `bg-purple-100 text-purple-600` - Evening icon background

### Add Medication Components
- `border-b-2` - Bottom border for tabs
- `border-dashed` - Dashed border for upload areas
- `hover:border-primary-400` - Hover state for upload areas
- `object-cover` - Image object fit
- `animate-spin` - Loading spinner animation
- `fixed inset-0` - Full screen overlay
- `bg-opacity-50` - Semi-transparent background
- `focus:ring-2 focus:ring-primary-500` - Focus states for inputs
- `disabled:opacity-50 disabled:cursor-not-allowed` - Disabled button states
- `transition-colors` - Smooth color transitions
- `whitespace-nowrap` - Prevent text wrapping in tabs

### Schedule Components
- `bg-gradient-to-r` - Gradient backgrounds for time sections
- `from-orange-50 to-yellow-50` - Morning gradient colors
- `from-blue-50 to-indigo-50` - Afternoon gradient colors
- `from-purple-50 to-pink-50` - Evening gradient colors
- `rounded-full` - Circular icons and buttons
- `last:mb-0` - Remove margin from last child
- `space-y-1` - Small vertical spacing
- `inline-flex items-center px-2 py-1 rounded-full` - Status badges
- `bg-green-100 text-green-800` - Success status colors
- `bg-yellow-100 text-yellow-800` - Pending status colors
- `opacity-50 cursor-not-allowed` - Disabled state styling

### History Components
- `grid grid-cols-1 md:grid-cols-3` - Responsive grid layout
- `divide-y divide-gray-200` - Dividers between list items
- `space-y-3` - Vertical spacing between elements
- `bg-gray-50` - Light gray background for history items
- `text-2xl font-bold` - Large bold text for stats
- `text-xs text-gray-500` - Small muted text
- `flex items-start justify-between` - Layout for medication items
- `flex items-center space-x-3` - Horizontal layout with spacing
- `px-6 py-4` - Consistent padding for sections
- `border-b border-gray-200` - Bottom borders for sections

### Dropdown Components
- `relative` - Positioning context for dropdown
- `absolute right-0 mt-2` - Position dropdown below button
- `w-48` - Fixed width for dropdown menu
- `shadow-lg` - Large shadow for dropdown elevation
- `z-50` - High z-index to appear above other elements
- `py-1` - Vertical padding for dropdown items
- `hover:bg-gray-100` - Hover state for dropdown items
- `w-full text-left` - Full width left-aligned text
- `flex items-center space-x-2` - Icon and text layout
- `my-1 border-gray-200` - Divider styling

### Verification Components
- `bg-red-50` - Warning background for "do not take" state
- `bg-green-50` - Success background for "take medication" state
- `text-red-900` - Dark red text for warnings
- `text-green-900` - Dark green text for success states
- `inline-flex items-center px-4 py-2 rounded-full` - Status indicator badges
- `bg-red-100 text-red-800` - Warning status colors
- `bg-green-100 text-green-800` - Success status colors
- `bg-gray-100 text-gray-800` - Neutral status colors
- `w-24 h-24` - Large circular icons
- `max-w-md mx-4` - Modal sizing and centering

### Photo Verification Components
- `border-2 border-dashed border-gray-300` - Dashed border for upload area
- `object-cover` - Image fitting for captured photos
- `disabled:opacity-50 disabled:cursor-not-allowed` - Disabled button states
- `space-x-2` - Horizontal spacing between buttons
- `w-6 h-6 bg-green-100 rounded-full` - Status indicator circles
- `text-green-600` - Success text color for completed steps
- `text-gray-400` - Inactive text color for pending steps
- `hover:bg-gray-100 transition-colors` - Hover effects for medication selection
- `cursor-pointer` - Pointer cursor for clickable elements

---

*This document will be updated as new components are added to the application.* 