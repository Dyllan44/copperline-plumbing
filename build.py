"""Render the Copperline website with Python's standard library."""

from functools import cache
from hashlib import sha256
from html import escape
from pathlib import Path
from shutil import copytree, rmtree
from string import Template
import sys

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "src"
OUTPUT = ROOT / "dist"

sys.dont_write_bytecode = True
from src.content import HOME_STEPS, PHOTO_INTROS, PROJECTS, SERVICES
from src.service_details import SERVICE_DETAILS

PAGES = {
    "home": ("Home", "Keep your home flowing", "Explore practical plumbing for everyday life, from leaks and fixtures to hot water and drains.", ("home", "enquiry"), ("enquiry",)),
    "services": ("Services", "Plumbing services", "Explore four Copperline Plumbing service areas and see what to share in an enquiry.", ("interior",), ()),
    "projects": ("Projects", "Illustrative plumbing projects", "Explore four project examples and compare two kitchen mixer options in the same space.", ("interior", "projects"), ("projects",)),
    "about": ("About", "About Copperline", "Meet the approach behind Copperline Plumbing, a fictional residential and small business plumbing concept.", ("interior",), ()),
    "contact": ("Contact", "Contact and enquiries", "Try the Copperline Plumbing enquiry flow with sample details, a service selection and optional photos.", ("interior", "enquiry"), ("enquiry",)),
}

STEP_ICONS = (
    "M8 16l-4 4v-5a4 4 0 0 1-1-3V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4zM7 9h10M7 12h7",
    "M8 5H5v16h14V5h-3M9 3h6l1 4H8zM8 11h8M8 15h8",
    "M4 6h16v14H4zM4 10h16M8 3v5m8-5v5m-7 7 2 2 4-4",
)


def render(path, **values):
    return Template((SOURCE / path).read_text(encoding="utf-8")).substitute(values)


def route(page):
    return "/" if page == "home" else f"/{page}/"


def service_route(service):
    return f'/services/{service["slug"]}/'


def current_attribute(href, path):
    if href == path:
        return ' aria-current="page"'
    if href == "/services/" and path.startswith(href):
        return ' aria-current="location"'
    return ""


def services_submenu(path):
    items = "\n".join(
        render(
            "components/nav-service-item.html",
            href=service_route(service), current=current_attribute(service_route(service), path),
            image=service["image"], name=escape(service["name"]), teaser=escape(service["teaser"]),
        )
        for service in SERVICES
    )
    return render("components/nav-services.html", current=current_attribute("/services/", path), items=items)


def navigation(path, submenu=False):
    links = []
    for page, (label, *_) in PAGES.items():
        href = route(page)
        if submenu and page == "services":
            links.append(services_submenu(path))
        else:
            links.append(f'<a href="{href}"{current_attribute(href, path)}>{label}</a>')
    return "\n".join(links)


def list_items(items, reveal=False):
    attribute = " data-reveal" if reveal else ""
    return "\n".join(f"<li{attribute}>{escape(item)}</li>" for item in items)


def process_steps(steps):
    return "\n".join(
        render("components/process-step.html", icon=icon, heading=escape(heading), copy=escape(copy))
        for (heading, copy), icon in zip(steps, STEP_ICONS, strict=True)
    )


def photo_intro(page):
    intro = PHOTO_INTROS[page]
    values = {key: escape(value) for key, value in intro.items() if key != "widths"}
    image = values["image"]
    widths = intro["widths"]
    sources = ", ".join(f"/images/{image}-{width}.jpg {width}w" for width in widths)
    return render(
        "components/photo-intro.html", **values, page=page,
        sources=sources, width=widths[1], height=widths[1] * 2 // 3,
    )


def service_cards(overview):
    cards = []
    for service in SERVICES:
        values = {key: escape(value) for key, value in service.items() if key != "scope"}
        sizes = "(max-width: 599px) 92vw, (max-width: 1300px) 35vw, 400px"
        if not overview:
            sizes = "(max-width: 519px) 92vw, (max-width: 959px) 46vw, (max-width: 1280px) 23vw, 286px"
        cards.append(render(
            "components/service-card.html",
            **values, sizes=sizes,
            modifier=" service-card-wide" if overview else "",
            description=values["overview"] if overview else values["short"],
            details=f'<ul class="service-scope">{list_items(service["scope"])}</ul>' if overview else "",
            destination=service_route(service) if overview else f'/contact/?service={service["key"]}#enquiry',
            link_label=f'Explore {escape(service["name"].lower())}' if overview else values["action"],
        ))
    return "\n".join(cards)


@cache
def asset_url(path):
    fingerprint = sha256((ROOT / path).read_bytes()).hexdigest()[:12]
    return f"/{path}?v={fingerprint}"


def write_page(path, title, description, body, styles, scripts=(), breadcrumb=""):
    output = OUTPUT / path.strip("/") / "index.html"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(render(
        "layout.html",
        title=escape(title), description=escape(description),
        navigation=navigation(path, submenu=True), footer_navigation=navigation(path),
        breadcrumb=breadcrumb,
        styles="\n".join(
            f'<link rel="stylesheet" href="{asset_url(f"styles/{sheet}.css")}">'
            for sheet in ("base", *styles, "motion")
        ),
        scripts="\n".join(
            f'<script src="{asset_url(f"scripts/{script}.js")}" defer></script>'
            for script in ("navigation", *scripts, "motion")
        ),
        body=body,
    ), encoding="utf-8")
    print(f"Built {path}")


def build_service_page(service):
    details = SERVICE_DETAILS[service["key"]]
    values = {key: escape(value) for key, value in details.items() if isinstance(value, str)}
    small, large = details["detail_widths"]
    detail_sources = ", ".join(
        f'/images/{values["detail_image"]}-{width}.jpg {width}w' for width in (small, large)
    )
    faqs = "\n".join(
        f"<details data-reveal><summary>{escape(question)}</summary><p>{escape(answer)}</p></details>"
        for question, answer in details["faqs"]
    )
    related = "\n".join(
        f'<li data-reveal><a class="button button-secondary" href="{service_route(other)}">{escape(other["name"])}</a></li>'
        for other in SERVICES if other["key"] != service["key"]
    )
    body = render(
        "pages/service-detail.html", **values,
        name=escape(service["name"]), action=escape(service["action"]),
        enquiry=f'/contact/?service={service["key"]}#enquiry',
        detail_sources=detail_sources,
        detail_large=large, detail_height=large * 2 // 3,
        scope=list_items(service["scope"], reveal=True), prep=list_items(details["prep"], reveal=True),
        process=process_steps(details["steps"]), faqs=faqs, related=related,
    )
    breadcrumb = render(
        "components/breadcrumb.html", label=escape(service["name"]),
        parent='<li><a href="/services/">Services</a></li>',
    )
    write_page(service_route(service), service["name"], details["intro"], body,
               ("interior", "service-detail"), breadcrumb=breadcrumb)


def build():
    rmtree(OUTPUT, ignore_errors=True)
    for directory in ("images", "styles", "scripts"):
        copytree(ROOT / directory, OUTPUT / directory, dirs_exist_ok=True)

    options = "\n".join(
        f'<option value="{service["key"]}">{escape(service["name"])}</option>' for service in SERVICES
    )
    page_data = {
        "home": {
            "service_cards": service_cards(overview=False),
            "service_options": options,
            "process": process_steps(HOME_STEPS),
        },
        "services": {"service_cards": service_cards(overview=True)},
        "projects": {
            "intro": photo_intro("projects"),
            "project_cards": "\n".join(
                render("components/project-card.html", **{key: escape(value) for key, value in project.items()})
                for project in PROJECTS
            ),
        },
        "about": {"intro": photo_intro("about")},
        "contact": {"intro": photo_intro("contact"), "service_options": options},
    }

    for page, (label, title, description, styles, scripts) in PAGES.items():
        body = render(f"pages/{page}.html", **page_data[page])
        breadcrumb = "" if page == "home" else render("components/breadcrumb.html", label=label, parent="")
        write_page(route(page), title, description, body, styles, scripts, breadcrumb)

    for service in SERVICES:
        build_service_page(service)


if __name__ == "__main__":
    build()
