# Matthieu Greiner portfolio design system

## Brand and mood
- Dark, calm, technical portfolio: `#0f172a` base with diffuse indigo, violet and cyan radial light.
- Tone: precise, welcoming, security-minded. Avoid neon overload and generic "hacker" clichés.

## Type
- Display: Space Grotesk, 500/700 for headings and labels.
- Body: Inter, 300/400/600.
- H1: 3rem mobile to 4.5rem desktop. Section headings: 1.875rem mobile to 2.25rem desktop.

## Colour tokens
- Background `#0f172a`; main text `#e2e8f0`; muted text `#94a3b8`.
- Accent indigo `#6366f1`, pale indigo `#a5b4fc`.
- Supporting violet `#a855f7`, cyan `#38bdf8`, positive emerald `#34d399`.
- Glass surface: `rgba(255,255,255,.05)` with border `rgba(255,255,255,.1)` and a 12–18px blur.

## Reusable patterns
- `.glass-card`: 1px translucent border, 12px backdrop blur, 0.3s ease lift on pointer hover.
- `.text-gradient`: left-to-right indigo → violet → cyan text gradient.
- Buttons are rounded-full, with strong contrast for primary actions and subtle glass treatment for secondary actions.
- Use compact, mono-like uppercase chips for category labels and tool levels.

## Layout and interaction
- Content max-width: 72rem (`max-w-6xl`), horizontal gutter 1.125–1.5rem.
- Fixed glass navigation; desktop links are visually centred. Below 1280px use a hamburger menu.
- Cards use 1 column on small phones, 2 at medium widths and 3–4 only when content remains readable.
- Focus rings: 2px `#a5b4fc`, 4px offset. Respect reduced-motion preferences.
