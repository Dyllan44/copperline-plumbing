(() => {
  const root = document.documentElement;
  const motionQuery = matchMedia('(prefers-reduced-motion: no-preference)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const header = document.querySelector('.site-header');
  const revealables = [...document.querySelectorAll('[data-reveal]')];
  const heroes = [...document.querySelectorAll('.hero, .interior-banner, .photo-intro')];
  const flows = [...document.querySelectorAll('[data-flow]')];
  const strip = document.querySelector('[data-marquee]');
  const comparison = document.querySelector('[data-comparison]');
  const cards = document.querySelectorAll('.service-card, .feature-card, .project-card');

  const STAGGER = 110;
  const MAX_STAGGER_STEPS = 5;
  const SETTLE_TIME = 1700;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const motionOn = () => motionQuery.matches && root.classList.contains('motion');

  // Tell the head script that motion started, so it keeps the hidden-until-revealed state.
  root.dataset.motionReady = '';

  /* ---------- Scroll reveals ---------- */

  function reveal(element, delay = 0) {
    if (element.classList.contains('is-revealed')) return;
    element.style.setProperty('--reveal-delay', delay + 'ms');
    element.classList.add('is-revealed');
    setTimeout(() => {
      element.classList.add('reveal-done');
      element.style.removeProperty('--reveal-delay');
    }, delay + SETTLE_TIME);
    if (element === comparison) sweepComparison(delay + 500);
  }

  function revealNow(element) {
    element.classList.add('is-revealed', 'reveal-done');
  }

  // A wiping image starts clipped to zero width, so the observer would never see it (and a lazy
  // image would never load). Watch its container instead and reveal the image from there.
  const watched = new Map();
  const watchTarget = (element) => (element.dataset.reveal === 'wipe' ? element.parentElement : element);

  const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries
      .filter((entry) => entry.isIntersecting)
      .flatMap((entry) => {
        observer.unobserve(entry.target);
        const elements = watched.get(entry.target) ?? [];
        watched.delete(entry.target);
        return elements;
      })
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
      .forEach((element, index) => reveal(element, Math.min(index, MAX_STAGGER_STEPS) * STAGGER));
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 }) : null;

  function watch(element) {
    const target = watchTarget(element);
    if (!watched.has(target)) {
      watched.set(target, []);
      observer.observe(target);
    }
    watched.get(target).push(element);
  }

  function disableMotion() {
    observer?.disconnect();
    root.classList.remove('motion');
    revealables.forEach(revealNow);
    for (const element of [...heroes, ...flows]) {
      element.style.removeProperty('--shift');
      element.style.removeProperty('--flow');
    }
    teardownMarquee();
  }

  if (motionOn() && observer) {
    revealables.forEach(watch);
  } else {
    disableMotion();
  }

  // Keyboard users must never land on invisible content.
  document.addEventListener('focusin', (event) => {
    const hidden = event.target.closest?.('[data-reveal]:not(.is-revealed)');
    if (hidden) revealNow(hidden);
  });

  /* ---------- Marquee strip: rotates continuously, speeds up while scrolling, pauses on hover ---------- */

  const MARQUEE_SPEED = 45; // px per second
  const MARQUEE_SCROLL_BOOST = .35; // extra px per px scrolled
  let marqueeTrack = null;
  let marqueeWidth = 0;
  let marqueeOffset = 0;
  let marqueeFrame = 0;
  let marqueeLastTime = 0;
  let marqueeLastScroll = scrollY;
  let marqueeVisible = false;
  let marqueePaused = false;

  function runMarquee(now) {
    marqueeFrame = 0;
    if (!marqueeTrack || !motionOn()) return;
    const elapsed = marqueeLastTime ? Math.min(now - marqueeLastTime, 100) / 1000 : 0;
    marqueeLastTime = now;
    const scrolled = Math.abs(scrollY - marqueeLastScroll);
    marqueeLastScroll = scrollY;
    if (!marqueePaused) marqueeOffset += MARQUEE_SPEED * elapsed;
    marqueeOffset += scrolled * MARQUEE_SCROLL_BOOST;
    if (marqueeWidth) marqueeOffset %= marqueeWidth;
    marqueeTrack.style.setProperty('--strip-shift', -marqueeOffset.toFixed(2) + 'px');
    startMarquee();
  }

  function startMarquee() {
    if (marqueeFrame || !marqueeVisible || document.hidden) return;
    if (!marqueeLastTime) marqueeLastScroll = scrollY;
    marqueeFrame = requestAnimationFrame(runMarquee);
  }

  function stopMarquee() {
    cancelAnimationFrame(marqueeFrame);
    marqueeFrame = 0;
    marqueeLastTime = 0;
  }

  if (strip && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      marqueeVisible = entry.isIntersecting;
      if (marqueeVisible) startMarquee();
      else stopMarquee();
    }).observe(strip);
    strip.addEventListener('pointerenter', () => { marqueePaused = true; });
    strip.addEventListener('pointerleave', () => { marqueePaused = false; });
    document.addEventListener('visibilitychange', () => (document.hidden ? stopMarquee() : startMarquee()));
  }

  function buildMarquee() {
    if (!strip || marqueeTrack) return;
    const words = [...strip.querySelectorAll('li')].map((item) => item.textContent.trim());
    marqueeTrack = document.createElement('div');
    marqueeTrack.className = 'marquee-track';
    marqueeTrack.setAttribute('aria-hidden', 'true');
    for (let copy = 0; copy < 8; copy += 1) {
      const group = document.createElement('div');
      group.className = 'marquee-group';
      for (const word of words) {
        const label = document.createElement('span');
        label.textContent = word;
        group.append(label);
      }
      marqueeTrack.append(group);
    }
    strip.append(marqueeTrack);
    strip.classList.add('has-marquee');
    measureMarquee();
  }

  function measureMarquee() {
    marqueeWidth = marqueeTrack?.firstElementChild.getBoundingClientRect().width ?? 0;
  }

  function teardownMarquee() {
    stopMarquee();
    marqueeTrack?.remove();
    marqueeTrack = null;
    strip?.classList.remove('has-marquee');
  }

  /* ---------- Scroll-linked effects, batched into one frame ---------- */

  let frame = 0;
  const requestUpdate = () => { frame ||= requestAnimationFrame(update); };

  function update() {
    frame = 0;
    const viewport = innerHeight;
    const scrollable = root.scrollHeight - viewport;
    root.style.setProperty('--scroll-progress', scrollable > 0 ? (scrollY / scrollable).toFixed(4) : '0');
    header?.toggleAttribute('data-scrolled', scrollY > 8);

    if (!motionOn()) return;

    // Safety net: a fast flick can skip past an element before the observer catches it.
    // Anything already above the viewport is shown immediately.
    for (const [target, elements] of watched) {
      if (target.getBoundingClientRect().bottom >= 0) continue;
      observer.unobserve(target);
      watched.delete(target);
      elements.forEach((element) => reveal(element));
    }

    for (const hero of heroes) {
      const box = hero.getBoundingClientRect();
      if (box.bottom < 0 || box.top > viewport) continue;
      hero.style.setProperty('--shift', clamp(-box.top / box.height).toFixed(4));
    }

    for (const flow of flows) {
      const box = flow.getBoundingClientRect();
      if (box.bottom < -viewport || box.top > viewport * 2) continue;
      // Starts filling as the list enters, completes as it passes the upper third of the screen.
      const progress = clamp((viewport * .85 - box.top) / (box.height + viewport * .35));
      flow.style.setProperty('--flow', progress.toFixed(4));
      const steps = flow.children;
      for (let index = 0; index < steps.length; index += 1) {
        steps[index].classList.toggle('is-lit', progress >= (index + .35) / steps.length);
      }
    }
  }

  if (motionOn()) buildMarquee();
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', () => { measureMarquee(); requestUpdate(); }, { passive: true });
  update();

  motionQuery.addEventListener('change', () => {
    if (!motionQuery.matches) disableMotion();
    requestUpdate();
  });

  /* ---------- Cards: pointer tilt + spotlight ---------- */

  function trackPointer(event) {
    if (!finePointer.matches || !motionOn()) return;
    const card = event.currentTarget;
    const box = card.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
    card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    // Wide cards tilt less so their far edges stay put.
    const strength = clamp(380 / box.width, .25, 1) * 7;
    card.style.setProperty('--tilt-x', ((.5 - y) * strength).toFixed(2) + 'deg');
    card.style.setProperty('--tilt-y', ((x - .5) * strength).toFixed(2) + 'deg');
  }

  function resetPointer(event) {
    for (const property of ['--mx', '--my', '--tilt-x', '--tilt-y']) {
      event.currentTarget.style.removeProperty(property);
    }
  }

  for (const card of cards) {
    card.addEventListener('pointermove', trackPointer);
    card.addEventListener('pointerleave', resetPointer);
  }

  /* ---------- Projects comparison: one guided sweep when it first appears ---------- */

  function sweepComparison(delay) {
    if (!comparison || !motionOn()) return;
    const range = comparison.querySelector('input[type="range"]');
    if (!range) return;
    const start = Number(range.value);
    const keyframes = [start, 82, 18, start];
    const duration = 2600;
    let startTime = 0;
    let cancelled = false;
    const cancel = () => { cancelled = true; };
    range.addEventListener('pointerdown', cancel, { once: true });
    range.addEventListener('keydown', cancel, { once: true });
    range.addEventListener('focus', cancel, { once: true });

    const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

    function step(now) {
      if (cancelled || !motionOn()) {
        comparison.style.setProperty('--reveal', range.value + '%');
        return;
      }
      startTime ||= now;
      const progress = clamp((now - startTime) / duration);
      const segment = Math.min(Math.floor(progress * 3), 2);
      const local = ease(progress * 3 - segment);
      const value = keyframes[segment] + (keyframes[segment + 1] - keyframes[segment]) * local;
      comparison.style.setProperty('--reveal', value.toFixed(2) + '%');
      if (progress < 1) requestAnimationFrame(step);
      else comparison.style.setProperty('--reveal', range.value + '%');
    }

    setTimeout(() => requestAnimationFrame(step), delay);
  }
})();
