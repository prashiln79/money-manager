# Professional Font System Guide

## Overview
The Money Manager app now uses a professional font system with three carefully selected fonts:

1. **Inter** - Primary body text and UI elements
2. **Poppins** - Headings and display text
3. **JetBrains Mono** - Financial data and numerical displays

## Font Hierarchy

### 1. Inter (Sans-serif)
- **Use for**: Body text, UI elements, buttons, forms, navigation
- **Weights**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **Best for**: Readability and clean interface design

### 2. Poppins (Display)
- **Use for**: Headings, titles, important text elements
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold), 800 (Extrabold)
- **Best for**: Modern, professional appearance with excellent readability

### 3. JetBrains Mono (Monospace)
- **Use for**: Financial amounts, account numbers, dates, any numerical data
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semibold)
- **Best for**: Clear, aligned numerical displays

## Usage Examples

### Tailwind Classes

```html
<!-- Headings -->
<h1 class="font-heading font-bold text-2xl">Main Title</h1>
<h2 class="font-heading font-semibold text-xl">Section Title</h2>

<!-- Body text -->
<p class="font-sans text-base">Regular paragraph text</p>
<p class="font-sans font-medium text-sm">Medium weight text</p>

<!-- Financial data -->
<span class="font-mono font-medium">$1,234.56</span>
<span class="font-mono font-semibold text-lg">$5,678.90</span>

<!-- Professional text utilities -->
<p class="text-professional">Professional body text</p>
<p class="text-professional-medium">Medium weight professional text</p>
<p class="text-professional-semibold">Semibold professional text</p>
```

### Responsive Heading Classes

```html
<h1 class="heading-responsive-h1">Responsive H1</h1>
<h2 class="heading-responsive-h2">Responsive H2</h2>
<h3 class="heading-responsive-h3">Responsive H3</h3>
```

### Financial Data Classes

```html
<!-- Regular financial amounts -->
<span class="financial-amount">$123.45</span>

<!-- Large financial amounts -->
<span class="financial-amount-large">$1,234.56</span>

<!-- Display financial amounts (for main balances) -->
<span class="financial-amount-display">$12,345.67</span>
```

## CSS Custom Properties

You can also use CSS custom properties for consistent font usage:

```css
.your-element {
  font-family: var(--font-sans); /* Inter */
  font-family: var(--font-heading); /* Poppins */
  font-family: var(--font-mono); /* JetBrains Mono */
}
```

## Best Practices

### 1. Financial Data
- Always use JetBrains Mono for amounts, account numbers, and dates
- Use appropriate weights: 400 for regular amounts, 500 for important amounts, 600 for totals
- Include proper letter spacing (0.025em) for better readability

### 2. Headings
- Use Poppins for all headings (h1-h6)
- Apply negative letter spacing (-0.025em) for modern look
- Use responsive heading classes for consistent scaling

### 3. Body Text
- Use Inter for all body text and UI elements
- Maintain good line height (1.6) for readability
- Use appropriate weights: 400 for regular text, 500 for emphasis, 600 for strong emphasis

### 4. Accessibility
- Ensure sufficient contrast ratios
- Use appropriate font sizes for different screen sizes
- Maintain readable line lengths (max 65-75 characters)

## Component Examples

### Transaction Item
```html
<div class="transaction-item">
  <h3 class="font-heading font-semibold text-lg">Grocery Store</h3>
  <p class="font-sans text-sm text-gray-600">Food & Dining</p>
  <span class="font-mono font-medium text-red-600">-$45.67</span>
</div>
```

### Account Balance
```html
<div class="account-balance">
  <h2 class="font-heading font-bold text-2xl">Total Balance</h2>
  <span class="font-mono font-bold text-4xl text-green-600">$12,345.67</span>
</div>
```

### Form Input
```html
<div class="form-group">
  <label class="font-sans font-medium text-sm">Amount</label>
  <input type="text" class="font-mono font-medium" placeholder="$0.00">
</div>
```

## Performance Notes

- Fonts are loaded from Google Fonts with optimized subsets
- Fonts are preloaded for better performance
- Font smoothing is enabled for crisp rendering
- Text rendering is optimized for legibility

## Browser Support

- Modern browsers: Full support
- Older browsers: Graceful fallback to system fonts
- Mobile devices: Optimized for touch interfaces 