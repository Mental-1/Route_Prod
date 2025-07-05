
# Styling Fixes and Suggestions

This document outlines the proposed styling changes to improve the visual appearance and user experience of the application.

## Color Palette

The current color palette is functional but could be improved to better reflect the brand identity and enhance visual appeal. The following changes are proposed to the HSL color values in `app/globals.css`:

### Light Mode

-   **--primary**: `221 65% 54%` -> `210 70% 55%` (A slightly desaturated and lighter blue for a more modern and approachable feel)
-   **--secondary**: `30 58% 92%` -> `210 30% 95%` (A cooler, more subtle secondary color that complements the new primary color)
-   **--accent**: `12 88% 61%` -> `30 90% 65%` (A vibrant, warm accent color to draw attention to key actions)
-   **--card**: `0 0% 100%` -> `0 0% 98%` (A slightly off-white background for cards to create a subtle separation from the main background)
-   **--border**: `210 15% 85%` -> `210 20% 90%` (A lighter border color to reduce visual noise)

### Dark Mode

-   **--primary**: `221 65% 64%` -> `210 70% 65%` (A slightly desaturated and lighter blue for a more modern and approachable feel)
-   **--secondary**: `30 20% 20%` -> `210 15% 20%` (A cooler, more subtle secondary color that complements the new primary color)
-   **--accent**: `12 88% 61%` -> `30 90% 65%` (A vibrant, warm accent color to draw attention to key actions)
-   **--card**: `220 18% 12%` -> `220 15% 15%` (A slightly lighter card background to create a subtle separation from the main background)
-   **--border**: `210 10% 25%` -> `210 15% 30%` (A lighter border color to reduce visual noise)

## Card Component

To improve the visual hierarchy and make the cards stand out, the following changes are proposed to the `components/ui/card.tsx` file:

-   Add a subtle box shadow to the card component to give it a sense of depth.
-   Add a slight border to the card component to create a clear separation from the background.

```tsx
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className,
    )}
    {...props}
  />
));
```

to

```tsx
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-md",
      className,
    )}
    {...props}
  />
));
```

## Map Page

To fix the z-index issue on the map page, the following changes are proposed to the `app/globals.css` file:

-   Uncomment the z-index fix for the Leaflet map.
-   Set the z-index of the `.leaflet-container` to 0 to ensure it does not overlap with other elements.
-   Set the z-index of the `.dropdown-menu-content` to 1000 to ensure it appears above the map.

```css
/* Fix for Leaflet map */
.leaflet-container {
    z-index: 0;
}

.leaflet-control,
.leaflet-pane {
    z-index: 0 !important;
}

/* Ensure dropdowns appear above map */
.dropdown-menu-content {
    z-index: 1000 !important;
}
```

