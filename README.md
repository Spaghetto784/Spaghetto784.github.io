# Matthieu Greiner - Portfolio

Personal portfolio website designed to showcase my work as a security engineering student at EPITA: DevSecOps at intuitem, malware research at the EPITA Research Lab, and a year at SFR Business. This project gathers my skills, professional experiences, and technical projects in a modern interface.

**Live version:** [matthieugreiner.com](https://matthieugreiner.com)

## Technologies

This project is a static website with no build step and no framework.

- **HTML5**: Semantic structure, one file per page (`index`, `now`, `skills`, `intuitem`, `projects` for SFR Business, `epita` for school projects).
- **`site.css`**: Hand-written design system: paper and ink, one orange accent, serif / sans / mono, hairlines, a file-tree rail (`~/matthieu-greiner`), plus black and orange blocks (the pull-request receipt, the experience rows, the footer). Light and dark themes, reduced-motion support.
- **`site.js`**: Vanilla JS runtime: spring physics, FR/EN i18n, theme toggle, the index tree, scroll reveals, the research sheet and the binary/governance switch.
- **Instrument Serif + Geist + Geist Mono** (Google Fonts). Icons are inline SVG.
- **`assets/`**: pictures used on the site. Open-licence pictures are listed with their source and licence in `assets/credits.json` and credited in the footer.
- **SEO**: Open Graph and Twitter tags on every page, `og-image.png` (1200×630) for link previews, JSON-LD `Person` on the homepage, `robots.txt` and `sitemap.xml`.

### Translations

English lives in the markup; French lives in each page's `Site.i18n.register({...})` dictionary, keyed by `data-i18n`. Shared strings (navigation, footer) are registered in `site.js`. In the browser console, `Site.i18n.missing()` lists any key without a French translation.

### Resume

The resume sources are in `cv/` (`cv_en.tex` on US Letter, `cv_fr.tex` on A4). Build with `pdflatex cv_en.tex` and `pdflatex cv_fr.tex`, then copy the PDFs to `Matthieu_Greiner_Resume.pdf` and `Matthieu_Greiner_CV.pdf`, which the site links to.

## Installation

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/Spaghetto784/Spaghetto784.github.io.git
   ```
2. Serve the folder locally, then open `http://localhost:8000`:
   ```bash
   cd Spaghetto784.github.io
   python3 -m http.server 8000
   ```
