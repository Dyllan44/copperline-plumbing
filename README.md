# 031 — Copperline Plumbing website

Phase 3 implements the nine-page Full House. Home, Services, Projects, About and Contact share a layout with four service detail pages. The Services overview links to each detail page. The header and breadcrumbs show the visitor’s location, and each service page passes its service into Contact.

## Preview and build

The current local review preview is [Copperline Plumbing](http://127.0.0.1:8311/). To rebuild and serve it, open a terminal in this folder and run these commands with Python 3.10 or newer.

```powershell
python build.py
python -m http.server 8311 --bind 127.0.0.1 --directory dist
```

Open the same preview address. Python builds the deployable static files in `dist/` using its standard library. Re-run the build after editing source files. The generated pages reference versioned CSS and JavaScript so browser reloads use the matching assets. Run these syntax checks with Node.js.

```powershell
node --check scripts/navigation.js
node --check scripts/enquiry.js
node --check scripts/projects.js
node --check scripts/motion.js
```

## Source and images

- [build.py](build.py) generates the nine routes from the [shared layout](src/layout.html), [page templates](src/pages/), [components](src/components/), [service and project data](src/content.py) and [dedicated service content](src/service_details.py). The service pages share one [detail template](src/pages/service-detail.html).
- Projects, About and Contact share a [photo header component](src/components/photo-intro.html) with page-specific copy, crop and imagery. New photographic originals and prompts are in the [review asset record](../assets/review-header-image-prompts.md).
- [base.css](styles/base.css) defines the shared palette, typography, buttons, navigation and service-card styles. The [styles folder](styles/) also contains Home, interior-page, Projects and enquiry styles.
- [navigation.js](scripts/navigation.js) handles the responsive menu. [projects.js](scripts/projects.js) handles filters and the comparison slider. [enquiry.js](scripts/enquiry.js) handles service preselection, form validation and local photo selection.
- Motion is built around the copper line. [motion.css](styles/motion.css) and [motion.js](scripts/motion.js) provide a header scroll-progress line, hero load choreography with line-by-line headline rise and photo parallax, a scroll-driven service marquee, staggered reveals (`data-reveal` = up, `left`, `right`, `zoom`, `wipe`, `line`), drawn heading rules, a process pipeline that fills and lights each step as you scroll (`data-flow`), copper lines on CTA bands, card tilt with a pointer spotlight, button shine, and a one-time guided sweep of the Projects comparison slider. [projects.js](scripts/projects.js) animates filtered cards.
- The main navigation has a Services dropdown built from the [nav-services](src/components/nav-services.html) and [nav-service-item](src/components/nav-service-item.html) components, using each service's `teaser` in [content.py](src/content.py). The Services link still opens the overview page. A chevron button (or hover on desktop) opens the four service pages with thumbnails. Escape, clicking outside or tabbing away closes it. On mobile it expands inside the menu. The footer keeps the plain links. Thumbnails load lazily and start downloading when the visitor's pointer first enters the Services item.
- Page transitions use cross-document View Transitions (`@view-transition` in motion.css). The old page lifts away while the new one slides up, and the header holds still. Clicking a card on Services morphs its photo into the service page banner: [navigation.js](scripts/navigation.js) names the card photo on `pageswap`, and the layout's head script names the receiving banner on `pagereveal`. Links with a `#hash` skip the morph because the banner would be off screen. Browsers without support, and visitors with reduced motion, navigate normally.
- Motion is progressive. A head script adds `.motion` only when reduced motion is off and IntersectionObserver exists; if motion.js does not start within 3 seconds the class is removed. Without it, or with reduced motion, every element renders static and visible. Focusing into an unrevealed element reveals it immediately. The marquee only moves with scrolling, never on its own.
- [images/](images/) contains responsive JPEGs and the brand mark. Reusable PNG originals and the [Home prompts](../assets/home-image-prompts.md), [Full Site prompts](../assets/full-site-image-prompts.md) and [Full House prompts](../assets/full-house-image-prompts.md) are in the concept’s [assets folder](../assets/).

## Verification

The Phase 3 build and three JavaScript syntax checks passed. All nine routes returned HTTP 200. The generated HTML resolved 406 local resources, fragments and accessibility references, including four overview links, 12 related-service routes and eight contextual enquiry links.

In Chromium, checked the four service pages at 320, 390, 768 and 1440 CSS pixels. Tested direct routes, active Services navigation, breadcrumbs, related-service navigation, keyboard FAQ disclosure and mobile menu focus. Both enquiry buttons on every new page selected the correct service in Contact. Both photos on each service page loaded, and the browser console showed no warnings or errors. See the [Drains desktop capture](../031-full-house-phase-3-drains-desktop.jpg) and [Fixtures mobile capture](../031-full-house-phase-3-fixtures-mobile.jpg).

During Phase 3 review, the four service pages adopted Home’s shared process cards and the six photo-led pages received a lighter mobile fade. Compared the original and revised mobile heroes at 390 CSS pixels, checked all six pages at 320, and verified the service card styles against Home at 1440. The Drains enquiry still preselected the correct service. See the [revised mobile hero](../031-full-house-revision-drains-mobile.jpg) and [shared process cards](../031-full-house-revision-process-cards.jpg).

The second review introduced softly squared secondary buttons and integrated photo headers on Projects, About and Contact. Verified the header images and mobile crops at 320, 390, 768 and 1440 CSS pixels. The secondary buttons retain 44-pixel targets and visible keyboard focus. Confirmed Contact preselection and the Projects filter. Static checks resolved 414 local references across all nine routes.

The third review applied Home’s navy photo treatment to Projects, About and Contact and matched the Projects filter corners to the secondary buttons. Verified the existing hero photos and copy, all five filter controls and their colours, keyboard focus and selection, and the navy headers at 320, 390 and 1440 CSS pixels. See the [current Projects capture](../031-full-house-review-navy-projects.jpg).

The [Phase 2 handoff](../README.md#phase-2-handoff) records the earlier Projects and Contact interaction checks. The [Phase 1 handoff](../README.md#phase-1-handoff) records the accepted mobile Home hero.

The Phase 4 motion pass was checked in Chromium on desktop and across the nine mobile routes at 390 CSS pixels. Verified the hero and copper-line entrance, live scroll reveals, menu focus and dismissal, FAQ feedback, immediate Projects filtering and Contact preselection. Script checks covered reduced-motion changes, focus interruption, anchor targets and browsers without the animation APIs.

## Pending

The demo validates sample details in the browser and lets visitors select up to three JPG, PNG or WebP files, up to 5 MB each. Nothing is transmitted or stored by the site. Live handling requires an enquiry endpoint, email delivery, photo upload and storage integration, confirmed business contact and coverage details, and approved privacy and consent copy. Replace illustrative projects with authorised client material before presenting them as completed work.

Phase 4 motion is ready for review. The wider experience audit and release-readiness work remain pending. Publication requires a separate request.
