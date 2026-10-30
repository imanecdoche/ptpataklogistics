# AGENT SKILL & MANDATORY RULE: STRICT 8-POINT GRID SYSTEM ENFORCEMENT

You are an expert Frontend Engineer and UI/UX Designer. When generating any frontend code (React, HTML, JSX, Tailwind CSS, or inline styles), you MUST strictly enforce the **8-Point Grid System** with a **4-Point Baseline Sub-grid**.

## 1. CORE CONSTRAINTS & SPACING SCALE

Never use arbitrary pixel values (e.g., `p-[13px]`, `gap-[18px]`, `h-[37px]`, `m-[22px]`). Every dimension, margin, padding, height, width, and gap must map strictly to the 8pt/4pt mathematical scale.

### Permitted Values & Tailwind Mapping:
- **4px (`0.25rem`)** -> `p-1`, `m-1`, `gap-1`, `w-1`, `h-1` (Micro spacing, inner badge padding)
- **8px (`0.5rem`)** -> `p-2`, `m-2`, `gap-2`, `space-x-2` (Small elements, gap between icon & text)
- **12px (`0.75rem`)** -> `p-3`, `m-3`, `gap-3` (Sub-grid micro: input field vertical padding)
- **16px (`1.0rem`)** -> `p-4`, `m-4`, `gap-4` (Standard card padding, default form gaps)
- **24px (`1.5rem`)** -> `p-6`, `m-6`, `gap-6` (Card inner padding, section sub-gaps)
- **32px (`2.0rem`)** -> `p-8`, `m-8`, `gap-8` (Macro spacing, section margins)
- **40px (`2.5rem`)** -> `p-10`, `h-10` (Standard interactive element height: buttons, small avatars)
- **48px (`3.0rem`)** -> `p-12`, `h-12` (Primary touch target height, large buttons)
- **64px (`4.0rem`)** -> `p-16`, `h-16`, `gap-16` (Page layout macro margins)

## 2. COMPONENT-SPECIFIC GRID RULES

* **Buttons & Inputs Height:** Must always be multiples of 8 (e.g., `h-8` (32px), `h-10` (40px), `h-12` (48px)).
* **Icons & Containers:**
  - Mini icons: `w-4 h-4` (16px) or `w-5 h-5` (20px)
  - Standard icons: `w-6 h-6` (24px)
  - Icon background boxes: `w-8 h-8` (32px), `w-10 h-10` (40px), or `w-12 h-12` (48px)
* **Cards & Panels Padding:** Use exclusively `p-4` (16px), `p-6` (24px), or `p-8` (32px).
* **Typography Line-Height:** Ensure all typography leading snaps to the grid (`leading-4` (16px), `leading-5` (20px), `leading-6` (24px), `leading-8` (32px)).

## 3. STRICT VIOLATION CHECKS (SELF-CORRECTION)

Before outputting code, verify:
1. Did I use any non-standard arbitrary values? (e.g., `mt-[15px]` -> replace with `mt-4` (16px)).
2. Is the horizontal and vertical rhythm consistent across siblings and child components?
3. Are touch targets on mobile at least `40px` or `48px` in height?
