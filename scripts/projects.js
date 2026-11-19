(() => {
  const filters = document.querySelector('.project-filters');
  const filterButtons = [...filters.querySelectorAll('button')];
  const examples = [...document.querySelectorAll('[data-project]')];
  const status = document.querySelector('.filter-result');

  const motion = matchMedia('(prefers-reduced-motion: no-preference)');

  function selectFilter(active, animate = false) {
    const shown = [];
    for (const project of examples) {
      project.hidden = active.dataset.filter !== 'all' && project.dataset.project !== active.dataset.filter;
      if (!project.hidden) shown.push(project);
    }
    for (const button of filterButtons) {
      button.setAttribute('aria-pressed', String(button === active));
    }
    status.textContent = shown.length === 1 ? '1 project example' : shown.length + ' project examples';

    if (!animate || !motion.matches || typeof Element.prototype.animate !== 'function') return;
    shown.forEach((project, index) => {
      project.animate([
        { opacity: 0, transform: 'translateY(1.75rem) scale(.96)' },
        { opacity: 1, transform: 'none' }
      ], { duration: 650, delay: index * 90, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards' });
    });
  }

  for (const button of filterButtons) {
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-pressed') !== 'true') selectFilter(button, true);
    });
  }
  selectFilter(filters.querySelector('[aria-pressed="true"]'));
  filters.hidden = false;

  const comparison = document.querySelector('[data-comparison]');
  const range = comparison.querySelector('input[type="range"]');

  function updateComparison() {
    const before = Number(range.value);
    comparison.style.setProperty('--reveal', before + '%');
    range.setAttribute('aria-valuetext', before + '% before, ' + (100 - before) + '% after');
  }

  range.addEventListener('input', updateComparison);
  updateComparison();
  comparison.dataset.ready = '';
  comparison.querySelector('.comparison-control').hidden = false;
})();
