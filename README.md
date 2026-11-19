# 031 — Copperline Plumbing website

A nine-page static website concept for a fictional residential plumbing business: Home, Services, Projects, About, Contact and a dedicated page for each of the four services. It is built with Python's standard library, with no frameworks or dependencies.

## Build and preview locally

Use Python 3.10 or newer. Run these commands in this folder:

```powershell
python build.py
python -m http.server 8311 --bind 127.0.0.1 --directory dist
```

Then open http://127.0.0.1:8311/. `build.py` clears and regenerates `dist/` on every run, so re-run it after editing source files. Generated pages reference CSS and JavaScript with content hashes (`?v=…`), so browsers always load the matching assets.

Syntax-check the scripts with Node.js:

```powershell
node --check scripts/navigation.js
node --check scripts/enquiry.js
node --check scripts/projects.js
node --check scripts/motion.js
```

## Deploy on Vercel

[vercel.json](vercel.json) configures the deployment. Vercel runs `python3 build.py`, publishes `dist/` and serves the pages at trailing-slash URLs such as `/services/`. No install step or environment variables are needed. Import this repository into a Vercel project, keep the framework preset as **Other**, and deploy. Every push to `main` then deploys automatically.

## How the code is organised

- [build.py](build.py) generates the nine routes from the [shared layout](src/layout.html), [page templates](src/pages/), [components](src/components/), [service and project data](src/content.py) and [service page content](src/service_details.py). The four service pages share one [detail template](src/pages/service-detail.html).
- [styles/](styles/) holds the CSS. [base.css](styles/base.css) defines the design tokens, typography, buttons, header, navigation and cards. The other files cover Home, interior pages, Projects, service pages, enquiry forms and motion.
- [scripts/](scripts/) holds the JavaScript. [navigation.js](scripts/navigation.js) runs the mobile menu, the Services dropdown and the outgoing half of page transitions. [projects.js](scripts/projects.js) runs the project filters and the before/after slider. [enquiry.js](scripts/enquiry.js) runs service preselection, form validation and local photo selection. [motion.js](scripts/motion.js) runs the scroll effects.
- [images/](images/) contains the responsive JPEGs and the brand mark.

## Navigation

The Services link opens the overview page. The chevron button next to it, or hovering on desktop, opens a dropdown with the four service pages, each with a thumbnail and a short teaser from [content.py](src/content.py). Escape, clicking outside or tabbing away closes it. On mobile it expands inside the menu. The footer keeps plain links.

## Motion

Motion is built around the copper line in the brand name:

- A scroll-progress line along the bottom of the header.
- A hero load sequence: the photo zooms in, the headline rises line by line, and the copper pipe draws itself. The hero photo moves with a parallax effect as you scroll.
- A service marquee that rotates on its own, speeds up while scrolling and pauses on hover.
- Staggered scroll reveals, set with `data-reveal` (`up`, `left`, `right`, `zoom`, `wipe`, `line`). Section heading rules draw in.
- A process pipeline that fills and lights each step as you scroll (`data-flow`).
- Copper lines on call-to-action bands, card tilt with a pointer spotlight, a button shine, and a one-time guided sweep of the Projects comparison slider.
- Page transitions using cross-document View Transitions. The old page lifts away, the new one rises in and the header holds still. On Services, a card's photo morphs into the service page banner.

Motion is progressive. A head script adds `.motion` only when the visitor hasn't asked for reduced motion and the browser supports IntersectionObserver. If motion.js doesn't start within 3 seconds, the class is removed. Without it, every element renders static and visible. Keyboard focus reveals hidden content immediately, and anything already scrolled past is always shown. Browsers without View Transitions navigate normally.

## Status and limitations

- The enquiry forms are demos. They validate sample details in the browser, and nothing is sent or stored. A live version needs an enquiry endpoint, email delivery, photo upload and storage, confirmed contact and coverage details, and approved privacy and consent copy.
- Copperline is a fictional concept. The project examples are illustrative, not completed client work. Replace them with authorised client material before presenting them as real projects.
