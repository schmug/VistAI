# Material Design Migration Plan

This document outlines a phased approach for transitioning VistAI's UI components from Radix UI and custom Tailwind classes to [Material Web](https://github.com/material-components/material-web).

## 1. Audit Current Components
- Inspect all components under `client/src/components` to determine their dependencies on Radix UI or custom styling.
- Map each to an equivalent Material Web component (e.g., Button, Dialog, Tabs).

## 2. Set Up Material Theme
- Reuse the color variables already defined in `client/src/index.css` such as `--md-sys-color-primary`.
- Ensure these tokens represent the desired theme or regenerate them using the Material Design color tool.
- Configure Material Web so its components read these CSS variables for theming.

## 3. Gradual Component Migration
- Replace Radix primitives with Material Web counterparts one component at a time.
- Start with commonly used elements like buttons, form inputs and dialogs.
- Remove or refactor custom components once their Material equivalents are in place.

## 4. Tailwind Integration
- Decide if Tailwind should remain for layout utilities.
- If keeping Tailwind, create helper classes or plugins so Material components can use Tailwind’s spacing and typography utilities consistently.

## 5. Update Layouts and Pages
- Migrate higher-level layouts (`Header.tsx`, `Footer.tsx`, page templates) to Material components such as `mwc-top-app-bar` or `mwc-drawer`.
- Verify spacing, typography and interaction states match Material guidelines.

## 6. Remove Deprecated Dependencies
- Once migration is complete, remove Radix UI packages and unused custom components from `package.json`.
- Clean up CSS rules and Tailwind configuration that are no longer required.

## 7. Testing and Accessibility
- Test each updated component for visual consistency and accessibility (keyboard navigation, focus management, ARIA roles).
- Leverage Material Web’s built-in accessibility features wherever possible.

## 8. Documentation and Maintenance
- Update project documentation to reference Material Web as the primary UI toolkit.
- Keep Material Web dependencies up to date to benefit from new components and fixes.

Following these steps allows for a smooth transition while maintaining a consistent design throughout the application.
