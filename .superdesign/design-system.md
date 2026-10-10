# Matthieu Greiner portfolio design system

Implemented in `site.css` (tokens, components) and `site.js` (motion, i18n, navigation).

## Brand and mood
- Dark, calm, technical portfolio: `#0f172a` base with diffuse indigo, violet and cyan radial light and a faint dot grid.
- Tone: precise, welcoming, security-minded. Avoid neon overload and generic "hacker" clichés.

## Type
- Display: Space Grotesk 500–700 for headings and labels. Body: Inter (variable, optical sizing on).
- Tracking is size-specific: hero `-0.045em`, section headings `-0.03em`, card titles `-0.02em`, body `0`, small uppercase labels `+0.16em`.
- Leading tightens as size grows: hero 1.0, headings 1.05–1.15, body 1.65.

## Colour tokens
- Background `#0f172a`; text `#e2e8f0`; muted `#94a3b8`; subtle `#64748b`.
- Accent indigo `#6366f1` / `#a5b4fc`; violet `#c084fc`; cyan `#38bdf8`; emerald `#34d399`; amber `#fbbf24`; red `#f87171`.
- Components read their accent from `--c`, set with a `.c-<name>` class on the element or an ancestor.

## Materials
- `.glass`: 1px translucent border, bright top edge, 16px blur + saturation. Bigger surfaces (menu, sheet) use 32px blur and deeper shadows.
- Never stack a light translucent surface on another; nested chips are tinted, not frosted.
- Navigation is a translucent layer with a masked scroll edge instead of a hard divider.

## Motion
- Springs (`Site.Spring`) use damping ratio + response. Default damping `1.0`; bounce (`~0.82`) only after a flick.
- Interruptible: animations retarget from the live value and velocity. The research sheet tracks the pointer 1:1, projects momentum on release, rubber-bands past its top edge, and enters/exits along the same path.
- Press feedback starts on pointer-down. Scroll reveals use a critically damped ease-out and fall back to a cross-fade.
- Respect `prefers-reduced-motion`, `prefers-reduced-transparency` and `prefers-contrast`.

## Layout and interaction
- Content max-width: 72rem, gutter 1.125–2rem.
- Fixed glass navigation with a sliding active pill; below 64rem links move into a menu that materialises from its trigger.
- Language switch (EN | FR) is always visible and remembers the choice; it defaults to the browser language.
- Focus rings: 2px `#a5b4fc`, 4px offset.
