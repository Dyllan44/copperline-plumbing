(() => {
  const header = document.querySelector('.site-header');
  const toggle = header.querySelector('.menu-toggle');
  const navigation = header.querySelector('.main-nav');
  const mobile = matchMedia('(max-width: 760px)');

  function updateMenu(open = false, restoreFocus = false) {
    toggle.hidden = !mobile.matches;
    toggle.setAttribute('aria-expanded', String(open));
    navigation.hidden = mobile.matches && !open;

    if (restoreFocus) toggle.focus();
  }

  header.dataset.menuReady = '';
  updateMenu();
  mobile.addEventListener('change', () => {
    const focusWasInNavigation = navigation.contains(document.activeElement);
    const focusWasOnToggle = document.activeElement === toggle;
    updateMenu(false, mobile.matches && focusWasInNavigation);
    if (!mobile.matches && focusWasOnToggle) navigation.querySelector('a').focus();
  });

  toggle.addEventListener('click', () => updateMenu(navigation.hidden));
  header.addEventListener('click', (event) => {
    if (mobile.matches && event.target.closest('a')) updateMenu();
  });
  document.addEventListener('click', (event) => {
    if (toggle.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) {
      updateMenu();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      event.preventDefault();
      updateMenu(false, true);
    }
  });
})();

// Services dropdown. The chevron button toggles it (all devices); on desktop, hovering opens it too.
// The Services link itself still goes to the overview page.
(() => {
  const item = document.querySelector('[data-submenu]');
  if (!item) return;
  const button = item.querySelector('.submenu-toggle');
  const panel = item.querySelector('.submenu');
  const hoverable = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 761px)');
  const CLOSE_DELAY = 180;
  let closeTimer = 0;
  let openedByHover = false;
  let warmed = false;

  const isOpen = () => item.hasAttribute('data-open');

  // Thumbnails are lazy; start fetching them as soon as the visitor shows interest.
  function warmImages() {
    if (warmed) return;
    warmed = true;
    for (const image of panel.querySelectorAll('img')) image.loading = 'eager';
  }

  function setOpen(open, restoreFocus = false) {
    clearTimeout(closeTimer);
    if (open) warmImages();
    else openedByHover = false;
    item.toggleAttribute('data-open', open);
    button.setAttribute('aria-expanded', String(open));
    if (restoreFocus) button.focus();
  }

  button.hidden = false;
  button.addEventListener('click', () => {
    // A click after hover-opening pins it open instead of immediately closing it.
    if (isOpen() && openedByHover) {
      openedByHover = false;
      return;
    }
    setOpen(!isOpen());
  });

  item.addEventListener('pointerenter', () => {
    warmImages();
    if (!hoverable.matches) return;
    clearTimeout(closeTimer);
    if (!isOpen()) {
      setOpen(true);
      openedByHover = true;
    }
  });
  item.addEventListener('pointerleave', () => {
    if (hoverable.matches && isOpen()) closeTimer = setTimeout(() => setOpen(false), CLOSE_DELAY);
  });
  item.addEventListener('focusout', (event) => {
    if (isOpen() && !item.contains(event.relatedTarget)) setOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (isOpen() && !item.contains(event.target)) setOpen(false);
  });
  // Escape closes the dropdown first (before the mobile menu) and returns focus to its button.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isOpen()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setOpen(false, item.contains(document.activeElement));
  }, { capture: true });

  // Close before navigating so the page transition doesn't capture an open panel,
  // and when a page is restored from the back/forward cache.
  panel.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  addEventListener('pageshow', () => setOpen(false));
})();

// Page transitions: when a card link leads to a page with a photo banner, morph the card photo into it.
// The receiving half runs in the layout's head script (it must run before first render).
(() => {
  if (!('onpageswap' in window)) return;
  let lastLink = null;

  document.addEventListener('click', (event) => {
    lastLink = event.target.closest?.('a[href]') ?? null;
  }, { capture: true });

  addEventListener('pageswap', (event) => {
    const link = lastLink;
    lastLink = null;
    // A skipped or aborted transition is harmless; mark it handled so it isn't logged as an error.
    for (const key of ['ready', 'finished', 'updateCallbackDone']) event.viewTransition?.[key].catch(() => {});
    const destination = event.activation?.entry?.url;
    if (!event.viewTransition || !link || !destination) return;

    const to = new URL(destination);
    // A hash means the next page scrolls past its banner, so there is nothing visible to morph into.
    if (to.hash || to.origin !== location.origin || to.pathname !== new URL(link.href).pathname) return;
    const photo = link.closest('.service-card, .feature-card, .project-card')?.querySelector('img');
    if (!photo) return;

    try { sessionStorage.setItem('copperline-morph', to.pathname); } catch { return; }
    photo.style.viewTransitionName = 'hero-photo';
    // Clear the name in case this page is restored from the back/forward cache.
    const clear = () => { photo.style.viewTransitionName = ''; };
    event.viewTransition.finished.then(clear, clear);
  });
})();
