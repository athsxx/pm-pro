# Design System Document: Modern Precision

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Architectural Lens."** 

This system rejects the cluttered, "dashboard-heavy" tropes of traditional project management tools in favor of a high-end, editorial precision found in premium fintech and developer environments. We treat the interface not as a collection of boxes, but as a series of intentional, layered planes. 

By utilizing generous whitespace, sophisticated glassmorphism, and a strict adherence to tonal depth over structural lines, we create an environment of "Pure Utility." The goal is to make the user feel like they are operating a high-performance instrument where every pixel serves a purpose and every interaction feels weighted and significant.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a foundation of pristine white tones, complemented by a singular, vibrant 'Action Violet.' We move away from flat UI by embracing a hierarchy of "White Tiers."

### Surface Hierarchy & Nesting
Depth is achieved through a stack of tonal values rather than drop shadows.
*   **Base Layer:** `surface` (#FFFFFF) – The foundation for the entire application.
*   **The "Nesting" Rule:** Use `surface_container_low` (#F5F5F5) for sidebar areas and `surface_container_highest` (#E0E0E0) for active interactive elements. To create depth, place a `surface_container_lowest` (#F8F8F8) card inside a `surface_container_high` (#EDEDED) section. This "inverted lift" creates a sophisticated, recessed look typical of high-end hardware interfaces.

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined by background color shifts or the **Ghost Border** fallback.
*   **Ghost Borders:** When a container requires definition, use `outline_variant` (#BDBDBD) at 10%–20% opacity. It should feel like a suggestion of an edge, not a cage.

### The Glass & Gradient Rule
Floating elements (Modals, Popovers, Hover Cards) must utilize **Glassmorphism**. Use a semi-transparent `surface_container` with a `backdrop-filter: blur(20px)`. This allows the Action Violet accents to bleed through the UI, creating "visual soul." For primary CTAs, use a subtle linear gradient from `primary` (#6750A4) to `primary_container` (#4C3F8B) to add dimension.

---

## 3. Typography
The typographic system balances the technical precision of **Manrope** with the invisible legibility of **Inter**.

*   **Display & Headlines (Manrope):** High-contrast, tech-focused headings. Use `display-lg` (3.5rem) for high-impact data overviews. Manrope’s geometric nature conveys authority and modernism.
*   **Title & Body (Inter):** Used for all functional content. Inter’s tall x-height ensures that complex project data remains readable even at `body-sm` (0.75rem).
*   **Label (Inter):** Specifically for metadata and small utility text. Always use `label-md` or `label-sm` with increased letter-spacing (tracking) to mimic high-end editorial labels.

---

## 4. Elevation & Depth
We eschew traditional Material Design shadows in favor of **Tonal Layering** and **Ambient Glows.**

*   **The Layering Principle:** A card should never sit "on top" of a background with a shadow. It should sit "within" the background through a shift to `surface_container_low` or `surface_container_high`.
*   **Ambient Shadows:** If a floating state is required (e.g., a dragged task card), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1)`. The shadow should feel like a soft occlusion of light, not a dark smudge.
*   **Glassmorphism Depth:** Layering a glass element over a `primary` (#6750A4) accent creates a sophisticated violet "glow" that serves as a non-intrusive way to guide the eye.

---

## 5. Components

### Buttons
*   **Primary:** A gradient-filled container (`primary` to `primary_container`) with `on_primary` (#FFFFFF) text. Border-radius: `md` (0.375rem).
*   **Secondary:** `surface_container_high` background with a `Ghost Border` (outline-variant at 20%).
*   **Tertiary:** Transparent background, `primary` text. Use for low-emphasis actions like "Cancel."

### Input Fields
*   **State:** Default fields use `surface_container_lowest` with a `px` width Ghost Border. 
*   **Focus:** The border transitions to `primary` (#6750A4) and a 1px "outer glow" using `primary` at 15% opacity.
*   **Precision Detail:** Use `label-sm` text placed exactly `1.5` (0.5rem) units above the input.

### Cards & Lists
*   **No-Divider Rule:** Forbid horizontal lines between list items. Use vertical whitespace (`spacing: 2` or `0.7rem`) and subtle background hover states (`surface_bright`) to separate content.
*   **Task Cards:** Use Glassmorphism for cards that are "Active" or "In-Progress," making them appear to float above the project grid.

### Project Timeline (Gantt/Sprint)
*   **The Precision Bar:** Task bars should use `primary_container` (#4C3F8B). Progress within a bar should use `primary` (#6750A4). 
*   **Milestones:** Use `tertiary` (#FFB869) for milestones to provide a warm, sophisticated contrast to the violet/white base.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use the Spacing Scale strictly. Gaps should be generous; when in doubt, use `spacing: 6` (2rem).
*   **Do** use `9999px` (full) roundedness for status chips and tags, but keep containers to `md` (0.375rem) or `lg` (0.5rem).
*   **Do** use `on_surface_variant` (#757575) for secondary text to maintain a low-contrast, premium feel.

### Don't
*   **Don't** use 100% opaque black (#000000) for body text. Use `on_surface` (#1E1E1E) to reduce eye strain on the light background.
*   **Don't** use heavy drop shadows. If a component feels "flat," adjust its `surface_container` tier instead.
*   **Don't** use standard 1px solid dividers. Use whitespace to imply structure.
*   **Don't** use bright red for errors unless critical. Use `error` (#BA1A1A) sparingly to maintain the professional "Modern Precision" vibe.