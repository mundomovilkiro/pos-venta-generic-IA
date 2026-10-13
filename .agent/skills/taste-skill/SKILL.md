---
name: design-taste-frontend
description: Anti-slop frontend skill for high-craft UI, portfolios, redesigns and POS interfaces. Infers the right design direction, enforces typographic discipline, tight visual hierarchy, consistent palette and tactile interactions without generic AI boilerplates.
---

# taste-skill: High-Craft Frontend Design System

> Source: Leonxlnx/taste-skill
> Specialized for crisp, modern, high-density & production-grade POS and web applications.

---

## 0. BRIEF INFERENCE & AUDIT
- Identify page role, audience (cashiers, store owners, business operators), and ergonomic speed requirements.
- Avoid generic AI clichés: no arbitrary purple glow, no inconsistent borders, no bloated padding in data-dense workflows.
- Single accent color lock, unified radius scale, tactile states on `:active`, high-contrast accessible typography.

---

## 1. THE CORE CONFIGURATION DIALS
- `DESIGN_VARIANCE: 5` (Clean, disciplined, functional, modern SaaS/Fintech)
- `MOTION_INTENSITY: 4` (Smooth transitions, crisp instant feedback, zero distracting physics)
- `VISUAL_DENSITY: 6` (Data-dense, scannable, balanced touch & barcode speed)

---

## 2. DESIGN DIRECTIVES
1. **Typography & Hierarchy**:
   - Clean sans-serif hierarchy with crisp numbers (`font-mono` / tabular figures for prices, barcodes, totals).
   - High contrast labels and clear subtitle text.
   - Distinctive weight contrast (semibold/bold for amounts, regular for descriptors).

2. **Color Calibration & Palette Lock**:
   - Neutral base: Slate/Zinc with subtle borders (`border-slate-200` / `border-slate-100`).
   - Primary Accent: Precision Indigo/Sky (`indigo-600` / `sky-600`) or Emerald (`emerald-600`) for POS checkout.
   - Statuses: Clear semantic colors (Emerald for Paid, Amber for Pending/Abonos, Rose for Debt/Delete).

3. **Materiality & Surfaces**:
   - Soft, crisp shadows: `shadow-sm`, subtle border outlines instead of muddy drop shadows.
   - Radius scale lock: consistent `rounded-xl` / `rounded-2xl` for cards, `rounded-lg` for inputs/buttons.
   - Tactile feedback: `active:scale-[0.98] transition-all duration-150` for key POS buttons.

4. **Cashier & POS Usability**:
   - High readability at glance.
   - Clear visual grouping of cart items, customer cards, keypad shortcuts, and summary totals.
