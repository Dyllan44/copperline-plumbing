(() => {
  const form = document.querySelector('#enquiry-form');
  const service = form.elements.namedItem('service');
  const phone = form.elements.namedItem('phone');
  const email = form.elements.namedItem('email');
  const method = form.elements.namedItem('method');
  const photos = form.elements.namedItem('photos');
  const textFields = ['name', 'suburb', 'message'].map((name) => form.elements.namedItem(name));
  const result = document.querySelector('#enquiry-result');
  const requestedService = new URLSearchParams(location.search).get('service');

  if (requestedService && [...service.options].some((option) => option.value === requestedService)) {
    service.value = requestedService;
  }

  function validateDetails() {
    if (method) {
      phone.required = method.value === 'phone';
      email.required = method.value === 'email';
    }
    const digitCount = phone.value.replace(/\D/g, '').length;
    const invalidPhone = phone.value && (digitCount < 7 || digitCount > 15);
    phone.setCustomValidity(invalidPhone ? 'Enter a sample number with 7 to 15 digits.' : '');

    for (const field of textFields) {
      const whitespaceOnly = field.value && !field.value.trim();
      field.setCustomValidity(whitespaceOnly ? 'Please enter a value.' : '');
    }
  }

  if (photos) {
    const list = document.querySelector('#photo-list');
    const feedback = document.querySelector('#photo-feedback');
    const clear = document.querySelector('.clear-photos');
    const validTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

    function showPhotoSelection() {
      const selected = [...photos.files];
      let issue = '';
      if (selected.length > 3) {
        issue = 'Choose up to 3 photos at a time.';
      } else if (selected.some((file) => !/\.(?:jpe?g|png|webp)$/i.test(file.name) || (file.type && !validTypes.has(file.type)))) {
        issue = 'Choose JPG, PNG or WebP photos.';
      } else if (selected.some((file) => file.size > 5_000_000 || file.size === 0)) {
        issue = 'Choose photos that contain data and are 5 MB or smaller.';
      }

      photos.setCustomValidity(issue);
      photos.setAttribute('aria-invalid', String(Boolean(issue)));
      clear.hidden = selected.length === 0;
      list.hidden = Boolean(issue) || selected.length === 0;
      list.replaceChildren();
      if (!list.hidden) {
        for (const file of selected) {
          const item = document.createElement('li');
          item.textContent = file.name;
          list.append(item);
        }
      }
      feedback.toggleAttribute('data-error', Boolean(issue));
      feedback.textContent = issue || (selected.length ? 'Photos selected on this device.' : '');
      result.textContent = '';
    }

    photos.addEventListener('change', showPhotoSelection);
    clear.addEventListener('click', () => {
      photos.value = '';
      photos.focus();
      showPhotoSelection();
      feedback.textContent = 'Photo selection cleared.';
    });
    showPhotoSelection();
  }

  form.addEventListener('input', () => {
    validateDetails();
    result.textContent = '';
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    validateDetails();
    if (!form.reportValidity()) return;

    result.textContent = 'Demo complete. Your sample details passed validation. Nothing was sent or saved.';
    if (photos?.files.length) result.textContent += ' Your photos stayed on this device.';
  });

  validateDetails();
  form.querySelector('fieldset').disabled = false;
})();
