# Design System Strategy: The Sovereign Ledger

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Curator."** 

In the world of high-stakes fintech, "trust" is often mistranslated as "boring." We reject the rigid, boxed-in layouts of traditional banking in favor of a sophisticated, editorial experience. The Sovereign Ledger approach treats financial data as high-value content. We utilize intentional asymmetry, significant breathing room (whitespace), and a "depth-first" hierarchy to create an interface that feels authoritative, secure, and bespoke. By moving away from standard borders and grids, we guide the user’s eye through tonal transitions and typographic dominance, ensuring every transaction feels like a curated event rather than a clerical task.

---

## 2. Colors: Tonal Architecture
The palette is built on a foundation of obsidian neutrals and "Gherkin" greens, punctuated by a regal secondary violet.

### The "No-Line" Rule
**Borders are a failure of hierarchy.** In this design system, 1px solid lines for sectioning are strictly prohibited. Boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a `surface-container-low` card sitting on a `surface` background provides all the definition a user needs without the visual "noise" of a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of frosted glass. 
*   **Base:** `surface` (#121413)
*   **Level 1:** `surface-container-low` (#1a1c1b) for secondary grouping.
*   **Level 2:** `surface-container` (#1e201f) for primary interaction areas.
*   **Level 3:** `surface-container-highest` (#333534) for elevated modals or flyouts.

### The "Glass & Gradient" Rule
To elevate the experience, use Glassmorphism for floating elements (e.g., navigation bars, transaction details). Apply semi-transparent surface colors with a `backdrop-blur` of 20px–40px. 
*   **Signature Textures:** Use a subtle linear gradient (Top-Left to Bottom-Right) transitioning from `primary` (#49fb88) to `primary-container` (#14de6f) for main Action Buttons to provide a metallic, premium "sheen."

---

## 3. Typography: Editorial Authority
The type system creates a rhythmic tension between the technical precision of **Space Grotesk** and the human clarity of **Inter**.

*   **Display & Headlines (Space Grotesk):** Used for high-impact data and section headers. The monospaced-leaning terminals of Space Grotesk suggest technical accuracy—essential for trust in fintech. 
*   **Body & Titles (Inter):** Used for all functional reading and microcopy. It provides a neutral, highly legible contrast to the expressive headlines.
*   **Financial Data:** Always use `headline-sm` or `title-lg` for currency amounts to ensure they are the undisputed focal point of the layout.

---

## 4. Elevation & Depth: Tonal Layering
We do not use shadows to mimic light; we use them to mimic **presence.**

*   **The Layering Principle:** Stack `surface-container-lowest` (#0d0f0e) cards on a `surface-container-low` (#1a1c1b) section to create a soft, natural "recessed" look.
*   **Ambient Shadows:** For floating modals, use a shadow with a 60px blur, 0% spread, and 6% opacity. Use a tint of the `primary` color (#49fb88) in the shadow for "on-brand" light bleed.
*   **The Ghost Border:** If a border is required for accessibility (e.g., input focus), use `outline-variant` (#3c4a3d) at 20% opacity. Never use 100% opaque borders.
*   **Glassmorphism:** Use `surface-bright` (#383a38) at 40% opacity with a blur effect to create "frosted glass" overlays that feel integrated into the dark environment rather than pasted on top.

---

## 5. Components: Functional Elegance

### Buttons (The "Coin" Standard)
*   **Primary:** Gradient of `primary` to `primary-container`. `9999px` (Full) roundedness. No border. Text: `on-primary` (#003917).
*   **Secondary:** `surface-container-high` background. `Ghost Border` (20% opacity `outline`). 
*   **Tertiary:** No background. `primary` text with an underline that appears only on hover.

### Input Fields
*   **Base:** `surface-container-lowest` background. 
*   **Interaction:** On focus, the background shifts to `surface-container-highest` and a `primary` 1px "Ghost Border" (40% opacity) appears.
*   **Errors:** Background shifts to `error-container` (#93000a) at 10% opacity; helper text uses `error` (#ffb4ab).

### Cards & Lists (The "Breath" Method)
*   **Strict Rule:** No dividers. Separate list items using `spacing-4` (1rem) of vertical whitespace. 
*   **Status Indicators:** Use a `0.5rem` (sm) rounded chip. For "Success," use `primary-container` with `on-primary-container` text. For "Warning," use `secondary` with `on-secondary` text.

### Signature Fintech Components
*   **Agreement Scrubber:** A progress indicator using `surface-variant` for the track and a `primary` glow for the progress.
*   **The Trust Badge:** A small, glassmorphic container in the footer or header using `surface-bright` at 10% opacity, housing the security lock icon and "Encrypted" status.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts. Push a headline to the far left and the data to the far right with 80px+ of whitespace between them.
*   **Do** use `on-surface-variant` (#bacbb9) for secondary information to create a sophisticated, low-contrast hierarchy.
*   **Do** apply `lg` (0.5rem) or `xl` (0.75rem) corner radii to all containers to soften the "industrial" feel of fintech.

### Don'ts
*   **Don't** use pure black (#000000) or pure white (#FFFFFF). Use the provided `surface` and `on-surface` tokens to maintain the premium, "ink-and-paper" depth.
*   **Don't** use standard "drop shadows." If an element isn't floating via Tonal Layering or Glassmorphism, it should remain flat.
*   **Don't** use more than one `primary` action per screen. The green is highly luminous; excessive use will fatigue the user and diminish the "Sovereign" feel.