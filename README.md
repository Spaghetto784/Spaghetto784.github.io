# Matthieu Greiner - Portfolio

Personal portfolio website designed to showcase my journey as a Cybersecurity Engineering student at EPITA and SFR Business. This project gathers my skills, professional experiences, and technical projects in a modern interface.

**Live version:** [https://spaghetto784.github.io](matthieugreiner.com)

## Technologies

This project is a static website with no build step and no framework.

- **HTML5**: Semantic structure, one file per page (`index`, `now`, `skills`, `projects`, `intuitem`).
- **`site.css`**: Hand-written design system (tokens, glass materials, components, reduced-motion / transparency / contrast support).
- **`site.js`**: Vanilla JS runtime: spring physics, FR/EN i18n, navigation, scroll effects and the research sheet.
- **Inter + Space Grotesk** (Google Fonts) and **Font Awesome** icons.

### Translations

English lives in the markup; French lives in each page's `Site.i18n.register({...})` dictionary, keyed by `data-i18n`. Shared strings (navigation, footer) are registered in `site.js`. In the browser console, `Site.i18n.missing()` lists any key without a French translation.

## Installation

### Local Development

1. Clone the repository:
   ```bash
   git clone [https://github.com/Spaghetto784/Spaghetto784.github.io.git](https://github.com/Spaghetto784/Spaghetto784.github.io.git)
