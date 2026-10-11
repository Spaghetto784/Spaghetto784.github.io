# Matthieu Greiner - Portfolio

Personal portfolio website designed to showcase my journey as a Cybersecurity Engineering student at EPITA and SFR Business. This project gathers my skills, professional experiences, and technical projects in a modern interface.

**Live version:** [matthieugreiner.com](https://matthieugreiner.com)

## Technologies

This project is a static website with no build step and no framework.

- **HTML5**: Semantic structure, one file per page (`index`, `now`, `skills`, `projects`, `intuitem`).
- **`site.css`**: Hand-written design system (paper/ink tokens, light + dark themes, components, reduced-motion / transparency / contrast support).
- **`site.js`**: Vanilla JS runtime: spring physics, FR/EN i18n, theme toggle, the index tree, scroll reveals and the research sheet.
- **Instrument Serif + Geist + Geist Mono** (Google Fonts) and **Font Awesome** icons.

### Translations

English lives in the markup; French lives in each page's `Site.i18n.register({...})` dictionary, keyed by `data-i18n`. Shared strings (navigation, footer) are registered in `site.js`. In the browser console, `Site.i18n.missing()` lists any key without a French translation.

### Resume

The resume sources are in `cv/` (`cv_en.tex` on US Letter, `cv_fr.tex` on A4). Build with `pdflatex cv_en.tex` and `pdflatex cv_fr.tex`, then copy the PDFs to `mgr_resume_eng.pdf` and `mgr_resume_fr.pdf`, which the site links to.

## Installation

### Local Development

1. Clone the repository:
   ```bash
   git clone [https://github.com/Spaghetto784/Spaghetto784.github.io.git](https://github.com/Spaghetto784/Spaghetto784.github.io.git)
