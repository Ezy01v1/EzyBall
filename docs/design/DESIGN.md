---
name: Pro-Level Velocity
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e2bfb0'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a98a7d'
  outline-variant: '#5a4136'
  surface-tint: '#ffb693'
  primary: '#ffb693'
  on-primary: '#561f00'
  primary-container: '#ff6b00'
  on-primary-container: '#572000'
  inverse-primary: '#a04100'
  secondary: '#ffb4aa'
  on-secondary: '#690003'
  secondary-container: '#c5020b'
  on-secondary-container: '#ffd2cc'
  tertiary: '#acc7ff'
  on-tertiary: '#002f67'
  tertiary-container: '#5a98ff'
  on-tertiary-container: '#003068'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb693'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7a3000'
  secondary-fixed: '#ffdad5'
  secondary-fixed-dim: '#ffb4aa'
  on-secondary-fixed: '#410001'
  on-secondary-fixed-variant: '#930005'
  tertiary-fixed: '#d7e2ff'
  tertiary-fixed-dim: '#acc7ff'
  on-tertiary-fixed: '#001a40'
  on-tertiary-fixed-variant: '#004591'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Anybody
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Anybody
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Anybody
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Anybody
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
  stats-num:
    fontFamily: Anybody
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  margin-mobile: 20px
  gutter-mobile: 12px
---

## Brand & Style

The design system is engineered for "EzyBall," a high-performance mobile basketball training environment. The brand personality is aggressive, disciplined, and hyper-modern, designed to evoke the intensity of a pre-game tunnel walk. It caters to athletes who value data-driven improvement and technical mastery.

The visual style is **High-Contrast / Bold** with elements of **Minimalism**. By utilizing a deep dark-mode foundation, the UI minimizes ocular strain during outdoor training sessions while allowing primary action colors to pop with maximum vibrance. The aesthetic prioritizes speed and legibility, using "stadium-scale" typography and sharp, intentional layouts that feel more like a performance tool than a social app.

## Colors

This design system uses a high-performance dark palette optimized for readability under bright sunlight and gym lighting.

*   **Primary (Basketball Orange):** Used for core actions, progress indicators, and active states. It represents energy and the ball itself.
*   **Secondary (Heatmap Hot):** Reserved for high-intensity data points, "hot zones" on the court, and critical alerts.
*   **Tertiary (Improvement Blue):** Used for cold zones, baseline metrics, and educational tips that require focus rather than intensity.
*   **Neutral Stack:** The background is near-black to provide infinite depth, while surfaces use a lifted charcoal to create clear containment for training modules and stats cards.

## Typography

The typography system is built for immediate recognition during physical activity.

*   **Headlines:** Using **Anybody**, a variable font that feels athletic and expansive. Massive weights and tight letter-spacing are used for "stadium-sized" motivation.
*   **Body:** **Manrope** provides a modern, clean, and highly legible counter-balance for instructional text and workout descriptions.
*   **Data/Labels:** **JetBrains Mono** is utilized for technical data, shooting percentages, and stopwatch timers, providing a "precision-engineered" feel to the athlete's statistics.

## Layout & Spacing

The design system follows a strict **4px baseline grid** to ensure mathematical precision in the UI. 

For mobile layouts, we use a **fluid grid** with a 20px safe-area margin. Content is organized into cards that span the full width or 2-column grids for stats summaries. High-velocity screens (like live-tracking) use increased padding (24px+) to prevent accidental touches and ensure that the "Stop" or "Record" buttons are isolated and easy to hit while the user is moving.

## Elevation & Depth

This design system avoids traditional shadows in favor of **Tonal Layers** and **Low-contrast Outlines**. 

Depth is communicated through brightness:
1.  **Level 0 (Background):** #121212 - The base canvas.
2.  **Level 1 (Surface):** #1E1E1E - Standard cards and containers.
3.  **Level 2 (Active/Lifted):** #2A2A2A - Pressed states or overlays.

To emphasize the athletic feel, surfaces are often defined by a 1px solid border (#333333) rather than a blur. This creates a "hard-surface" aesthetic reminiscent of professional gym equipment.

## Shapes

The shape language is **Soft (0.25rem)**. While the brand is aggressive, slightly rounded corners prevent the UI from feeling dated or overly "industrial." 

*   **Buttons:** Use a 4px corner radius for a sturdy, blocky feel.
*   **Data Visualization:** Bars in charts use 2px radii to maintain a crisp, technical look.
*   **Avatars/Badges:** These are the only elements allowed to be fully circular to distinguish "Human" elements from "Technical" elements.

## Components

*   **Primary Buttons:** High-saturation #FF6B00 background with black #000000 text. Buttons are large (min height 56px) to ensure they are "thumb-ready" during workouts.
*   **Stats Cards:** Use #1E1E1E background with a subtle top-border color-coded to the metric (Hot/Cool). Use JetBrains Mono for the primary metric value.
*   **Training Chips:** Small, pill-shaped indicators using secondary text colors and 1px borders to categorize drills (e.g., "Shooting", "Dribbling").
*   **Inputs:** Minimalist bottom-border only or fully enclosed charcoal boxes. Focused states should use a 2px Orange bottom-border.
*   **Progress Rings:** Thick 8px stroke widths. Use the Primary Orange for "Goal Completion" and a muted #333333 for the remaining track.
*   **Iconography:** 24px grid, 2px stroke width. Icons must be "Open Path" to feel airy and modern against the dark background.