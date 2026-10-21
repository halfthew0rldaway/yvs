---
name: Precision Workshop Ergonomics
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#006242'
  on-tertiary: '#ffffff'
  tertiary-container: '#007d55'
  on-tertiary-container: '#bdffdb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system delivers an ultra-clean, high-density enterprise interface engineered specifically for field and bench hardware technicians. The design ethos balances the meticulous utility of modern engineering tools like Linear, Stripe, and Vercel with rugged operational clarity. 

Key attributes:
- **Tone & Demeanor:** Focused, utilitarian, deterministic, and frictionless.
- **Ergonomic Mandate:** High-speed scanning under workshop bench lighting, gloved or quick-thumb operation, and zero cognitive load.
- **Visual Hygiene:** Strictly light mode. Surfaces rely on pure crisp whites and soft structural slates. Dark or jet-black containers are explicitly forbidden to preserve luminance parity across diagnostic screens.
- **Iconography & Symbols:** Vector line icons exclusively (Lucide/Material design language, 1.5px stroke). Zero emojis, playful illustrations, or skeuomorphic flourishes.

## Colors

The palette employs precise industrial slate neutrals accented with purposeful semantic signaling:

- **Canvas & Structural Surfaces:**
  - Background Canvas: `Slate-50` (`#F8FAFC`)
  - Elevated Cards & Sheets: `Pure White` (`#FFFFFF`)
  - Standard Borders & Dividers: `Slate-200` (`#E2E8F0`)
  - Subtle Inset Borders & Inputs: `Slate-300` (`#CBD5E1`)

- **Typography & Content:**
  - Text Primary: `Slate-900` (`#0F172A`)
  - Text Secondary / Metadata: `Slate-600` (`#475569`)
  - Text Muted / Placeholders: `Slate-400` (`#94A3B8`)

- **Action & Identity:**
  - Primary / Focused Action: `Royal Blue` (`#2563EB`)
  - Primary Subtle Surface: `Blue-50` (`#EFF6FF`)

- **Semantic Workbench States:**
  - In Progress / Bench Repair: `Indigo-500` (`#6366F1`) paired with `Indigo-50` (`#EEF2FF`)
  - Success / Quality Control Passed: `Emerald-500` (`#10B981`) paired with `Emerald-50` (`#ECFDF5`)
  - Warning / Parts Queue / Standby: `Amber-500` (`#F59E0B`) paired with `Amber-50` (`#FFFBEB`)
  - Danger / Critical / Overdue SLA: `Red-500` (`#EF4444`) paired with `Red-50` (`#FEF2F2`)

Never mix dark surface fills into panels, modals, or sheets; visual separation must be maintained purely through borders and deliberate contrast shifts.

## Typography

The type system prioritizes rapid triage and technical legibility.

- **Primary Structure:** Plus Jakarta Sans for titles and headers introduces clear geometric clarity without sacrificing compactness.
- **Reading Hierarchy:** Inter provides high micro-contrast for long ticket notes, component breakdown lists, and customer logs.
- **Hardware Telemetry:** JetBrains Mono is strictly enforced for Ticket IDs (`#SRV-90821`), Part SKUs, MAC addresses, hex codes, and serial numbers. Tabular figures prevent layout shifts during continuous barcode and RFID scanning.

## Layout & Spacing

Designed around mobile workbench constraints:

- **Touch Ergonomics:** All actionable touch points (buttons, segmented triggers, inputs, checklist toggles) enforce a minimum vertical and horizontal interactive bounding target of 48px (`3rem`).
- **Layout Model:** A fluid single-column model on mobile devices with consistent `1rem` outer canvas padding. On workbench docks or foldables, the layout splits into a 2-column or master-detail split (360px triage rail + responsive diagnostic workspace).
- **Rhythm:** Dense, standardized 4px/8px incremental spacing creates immediate vertical alignment and high data throughput on hardware lists.

## Elevation & Depth

This system intentionally eliminates deep dramatic drop shadows in favor of surgical structural clarity:

- **Layering Principle:** Pure White cards sit directly on top of the Slate-50 canvas separated by crisp `1px` borders (`#E2E8F0`).
- **Shadow Scale:** Restricted to ultra-subtle ambient diffusion for floating bars or bottom action sheets:
  - Default Card: `0 1px 2px 0 rgba(15, 23, 42, 0.04)` with a `1px solid #E2E8F0` border.
  - Active / Dragged Card: `0 4px 6px -1px rgba(15, 23, 42, 0.08)`, `0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
  - Floating Bottom Command Bar: `0 10px 15px -3px rgba(15, 23, 42, 0.06)`, `0 -1px 0 0 #E2E8F0`.
- **States:** Hover and press states do not rely on elevation; they activate immediate tinted surface backdrops (`#F1F5F9` or tint washes).

## Shapes

The interface embraces a precise, utilitarian "Soft" border-radius system:

- Base inputs, cards, and interactive rows leverage `0.375rem` to `0.5rem` (6px–8px) corner curvature, ensuring dense visual alignment without wasteful dead space.
- Chips and status badges utilize strict pill containers (`9999px`) to create clear differentiation between actionable container surfaces and static data attributes.

## Components

### Buttons & Action Bars
- **Primary:** Royal Blue fill (`#2563EB`), pure white text, 48px ergonomic height, 8px radius. Active state: `#1D4ED8`.
- **Secondary:** Pure White background, Slate-200 border, Slate-900 text. Active state: Slate-50.
- **Destructive:** Red-50 background, Red-500 text, Red-200 border.
- **Fixed Workbench Action Strip:** Fixed to mobile bottom viewport with safe-area insets, housing primary pass/fail diagnostic confirmation switches.

### Status Badges & Chips
- Status badges feature a subtle tinted background paired with saturated text and an optional 6px solid dot indicator:
  - *Repair/In Progress:* Indigo-50 surface, Indigo-500 text (`#6366F1`).
  - *QC Passed:* Emerald-50 surface, Emerald-500 text (`#10B981`).
  - *Queue/Waiting:* Amber-50 surface, Amber-500 text (`#F59E0B`).
  - *Overdue:* Red-50 surface, Red-500 text (`#EF4444`).
- Serial number chips feature JetBrains Mono typography within a Slate-100 container bordered by Slate-200.

### Diagnostic Checklists & Form Inputs
- **Checkboxes & Radios:** Centered in an explicit 48px hit area. Selected state uses Royal Blue `#2563EB` with high-contrast white ticks.
- **Text Inputs & Barcode Scanners:** 48px height, Slate-50 background, Slate-200 border, turning Royal Blue on focus with a 2px outer halo ring (`rgba(37, 99, 235, 0.15)`). Right accessory slots hold hardware scanner and camera vector icons.

### Hardware Repair Cards
- White background, 1px Slate-200 border, 8px radius, padded with `1rem`.
- Layout strictly separates the header (Monospace ID, status badge, SLA timer) from the body (device model, reported defect) and footer (assigned bench, parts count).