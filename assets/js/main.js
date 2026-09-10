(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Footer year ---------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- Cookie / local-storage notice ---------------- */
  (() => {
    const banner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('cookie-banner-accept');
    if (!banner || !acceptBtn) return;

    const STORAGE_KEY = 'm4u-cookie-notice-ack';
    let acknowledged = false;
    try { acknowledged = localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { /* storage unavailable */ }

    if (!acknowledged) banner.hidden = false;

    acceptBtn.addEventListener('click', () => {
      banner.hidden = true;
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* storage unavailable */ }
    });
  })();

  /* ---------------- Accessibility widget ---------------- */
  (() => {
    const toggle = document.querySelector('.a11y-toggle');
    const panel = document.getElementById('a11y-panel');
    if (!toggle || !panel) return;

    const STORAGE_KEY = 'm4u-a11y';
    const TEXT_STEPS = ['100%', '112.5%', '125%', '137.5%'];
    let state = { textStep: 0, contrast: false, motion: false, underline: false };

    function loadState() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved) state = Object.assign(state, saved);
      } catch (e) { /* ignore malformed/inaccessible storage */ }
    }
    function saveState() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
    }

    function applyState() {
      document.documentElement.style.fontSize = TEXT_STEPS[state.textStep];
      document.documentElement.classList.toggle('a11y-contrast', state.contrast);
      document.documentElement.classList.toggle('a11y-no-motion', state.motion);
      document.documentElement.classList.toggle('a11y-underline-links', state.underline);

      const contrastBtn = panel.querySelector('[data-a11y-action="contrast"]');
      const motionBtn = panel.querySelector('[data-a11y-action="motion"]');
      const underlineBtn = panel.querySelector('[data-a11y-action="underline"]');
      if (contrastBtn) contrastBtn.setAttribute('aria-pressed', String(state.contrast));
      if (motionBtn) motionBtn.setAttribute('aria-pressed', String(state.motion));
      if (underlineBtn) underlineBtn.setAttribute('aria-pressed', String(state.underline));

      document.querySelectorAll('.g-item-video video').forEach((v) => {
        if (state.motion || prefersReducedMotion) v.pause();
        else v.play().catch(() => {});
      });
    }

    loadState();
    applyState();

    function closePanel() {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    }
    function openPanel() {
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
    }

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.hidden ? openPanel() : closePanel();
    });
    document.addEventListener('click', (e) => {
      if (!panel.hidden && !panel.contains(e.target) && e.target !== toggle) closePanel();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) { closePanel(); toggle.focus(); }
    });

    panel.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-a11y-action]');
      if (!btn) return;
      const action = btn.dataset.a11yAction;
      if (action === 'text-inc') state.textStep = Math.min(state.textStep + 1, TEXT_STEPS.length - 1);
      else if (action === 'text-dec') state.textStep = Math.max(state.textStep - 1, 0);
      else if (action === 'contrast') state.contrast = !state.contrast;
      else if (action === 'motion') state.motion = !state.motion;
      else if (action === 'underline') state.underline = !state.underline;
      else if (action === 'reset') state = { textStep: 0, contrast: false, motion: false, underline: false };
      applyState();
      saveState();
    });
  })();

  /* ---------------- Brand logo dropdown (Instagram / WhatsApp) ---------------- */
  document.querySelectorAll('.brand-wrap').forEach((wrap) => {
    const btn = wrap.querySelector('.brand');
    const menu = wrap.querySelector('.brand-menu');
    if (!btn || !menu) return;

    function closeBrandMenu() {
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
    function openBrandMenu() {
      document.querySelectorAll('.brand-menu').forEach((m) => { m.hidden = true; });
      document.querySelectorAll('.brand[aria-expanded]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.hidden ? openBrandMenu() : closeBrandMenu();
    });

    document.addEventListener('click', (e) => {
      if (!menu.hidden && !wrap.contains(e.target)) closeBrandMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) {
        closeBrandMenu();
        btn.focus();
      }
    });
  });

  /* ---------------- Mobile navigation ---------------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navList = document.querySelector('.nav-list');

  function closeNav() {
    if (!navList) return;
    navList.setAttribute('data-open', 'false');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function openNav() {
    if (!navList) return;
    navList.setAttribute('data-open', 'true');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // visibility only flips to "visible" once the browser applies the new
    // style (next frame), so focusing synchronously would silently no-op
    const firstLink = navList.querySelector('a');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { if (firstLink) firstLink.focus(); });
    });
  }

  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      isOpen ? closeNav() : openNav();
    });

    navList.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') closeNav();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        closeNav();
        navToggle.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 960) closeNav();
    });
  }

  /* ---------------- Accordion (FAQ) ---------------- */
  const accordionTriggers = document.querySelectorAll('.accordion-trigger');
  accordionTriggers.forEach((trigger) => {
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!panel) return;
    const inner = panel.querySelector('.accordion-panel-inner');

    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!isOpen));
      panel.hidden = false; // must un-hide before measuring, or offsetHeight reads 0
      panel.style.height = isOpen ? '0px' : inner.offsetHeight + 'px';
      if (isOpen) {
        panel.addEventListener('transitionend', function handler() {
          if (trigger.getAttribute('aria-expanded') === 'false') panel.hidden = true;
          panel.removeEventListener('transitionend', handler);
        });
      }
    });
  });

  /* ---------------- Gallery lightbox ---------------- */
  const galleryItems = Array.from(document.querySelectorAll('.g-item'));
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');
  let currentIndex = 0;
  let lastFocused = null;

  function showImage(index) {
    currentIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentIndex];
    const img = item.querySelector('img');
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = img.alt;
  }

  function openLightbox(index) {
    lastFocused = document.activeElement;
    showImage(index);
    lightbox.hidden = false;
    lightboxClose.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
  });

  if (lightbox) {
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', () => showImage(currentIndex - 1));
    lightboxNext.addEventListener('click', () => showImage(currentIndex + 1));

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    let touchStartX = null;
    const figure = document.querySelector('.lightbox-figure');
    if (figure) {
      figure.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].clientX;
      }, { passive: true });
      figure.addEventListener('touchend', (e) => {
        if (touchStartX === null) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(deltaX) < 40) return;
        showImage(currentIndex + (deltaX < 0 ? 1 : -1));
      }, { passive: true });
    }

    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showImage(currentIndex + (document.dir === 'rtl' ? -1 : 1));
      if (e.key === 'ArrowLeft') showImage(currentIndex + (document.dir === 'rtl' ? 1 : -1));
      if (e.key === 'Tab') {
        const focusables = lightbox.querySelectorAll('button');
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });
  }

  /* ---------------- Contact form -> WhatsApp handoff ---------------- */
  const form = document.getElementById('contact-form');
  if (form) {
    const summary = document.getElementById('form-summary');
    const summaryList = document.getElementById('form-summary-list');
    const successBox = document.getElementById('form-success');
    const WHATSAPP_NUMBER = '972559696120';

    const fields = {
      name: { el: document.getElementById('field-name'), label: 'שם מלא', required: true },
      phone: { el: document.getElementById('field-phone'), label: 'טלפון', required: true },
      eventType: { el: document.getElementById('field-event-type'), label: 'סוג האירוע', required: true },
      eventDate: { el: document.getElementById('field-event-date'), label: 'תאריך האירוע', required: false },
      message: { el: document.getElementById('field-message'), label: 'הודעה', required: false },
      consent: { el: document.getElementById('field-consent'), label: 'אישור מדיניות הפרטיות', required: true },
    };

    function setFieldError(key, message) {
      const field = fields[key];
      const errorEl = document.getElementById('error-' + key);
      if (!field || !errorEl) return;
      if (message) {
        field.el.setAttribute('aria-invalid', 'true');
        errorEl.textContent = message;
        errorEl.classList.add('show');
      } else {
        field.el.removeAttribute('aria-invalid');
        errorEl.textContent = '';
        errorEl.classList.remove('show');
      }
    }

    function validatePhone(value) {
      const digits = value.replace(/[^\d]/g, '');
      return digits.length >= 9 && digits.length <= 10;
    }

    function validate() {
      const errors = [];

      if (!fields.name.el.value.trim()) {
        setFieldError('name', 'נא להזין שם מלא');
        errors.push({ key: 'name', label: fields.name.label });
      } else setFieldError('name', '');

      if (!fields.phone.el.value.trim()) {
        setFieldError('phone', 'נא להזין מספר טלפון');
        errors.push({ key: 'phone', label: fields.phone.label });
      } else if (!validatePhone(fields.phone.el.value)) {
        setFieldError('phone', 'מספר הטלפון אינו תקין');
        errors.push({ key: 'phone', label: fields.phone.label });
      } else setFieldError('phone', '');

      if (!fields.eventType.el.value) {
        setFieldError('eventType', 'נא לבחור סוג אירוע');
        errors.push({ key: 'eventType', label: fields.eventType.label });
      } else setFieldError('eventType', '');

      if (!fields.consent.el.checked) {
        setFieldError('consent', 'יש לאשר את מדיניות הפרטיות כדי לשלוח את הפנייה');
        errors.push({ key: 'consent', label: fields.consent.label });
      } else setFieldError('consent', '');

      return errors;
    }

    function focusOnBlur(key) {
      fields[key].el.addEventListener('blur', () => {
        if (key === 'consent') return;
        validate();
      });
    }
    ['name', 'phone', 'eventType'].forEach(focusOnBlur);

    function showValidationErrors(errors) {
      summaryList.innerHTML = '';
      errors.forEach((err) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#field-' + err.key.replace(/([A-Z])/g, '-$1').toLowerCase();
        a.textContent = err.label;
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          fields[err.key].el.focus();
        });
        li.appendChild(a);
        summaryList.appendChild(li);
      });
      summary.classList.add('show');
      summary.focus();
    }

    function buildMessageLines() {
      const lines = [
        'היי, אשמח לקבל הצעת מחיר לעמדת צילום 📸',
        'שם: ' + fields.name.el.value.trim(),
        'טלפון: ' + fields.phone.el.value.trim(),
        'סוג אירוע: ' + fields.eventType.el.options[fields.eventType.el.selectedIndex].text,
      ];
      if (fields.eventDate.el.value) lines.push('תאריך משוער: ' + fields.eventDate.el.value);
      if (fields.message.el.value.trim()) lines.push('הודעה: ' + fields.message.el.value.trim());
      return lines;
    }

    function showSuccess(message) {
      successBox.querySelector('p').textContent = message;
      successBox.classList.add('show');
      successBox.setAttribute('tabindex', '-1');
      successBox.focus();
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const errors = validate();
      successBox.classList.remove('show');

      if (errors.length > 0) {
        showValidationErrors(errors);
        return;
      }

      summary.classList.remove('show');

      const text = encodeURIComponent(buildMessageLines().join('\n'));
      const url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + text;

      showSuccess('נפתח עבורכם חלון WhatsApp עם ההודעה שמילאתם. פשוט לחצו "שליחה" שם כדי שנקבל אותה.');
      window.open(url, '_blank', 'noopener');
    });

    const emailBtn = document.getElementById('submit-email');
    if (emailBtn) {
      emailBtn.addEventListener('click', () => {
        const errors = validate();
        successBox.classList.remove('show');

        if (errors.length > 0) {
          showValidationErrors(errors);
          return;
        }

        summary.classList.remove('show');

        const subject = encodeURIComponent('בקשה להצעת מחיר, ' + fields.name.el.value.trim());
        const body = encodeURIComponent(buildMessageLines().join('\n'));
        const mailtoUrl = 'mailto:memories4u.photo@gmail.com?subject=' + subject + '&body=' + body;

        showSuccess('נפתח עבורכם חלון Email עם ההודעה שמילאתם. פשוט לחצו "שליחה" שם כדי שנקבל אותה.');
        window.location.href = mailtoUrl;
      });
    }
  }

  /* ---------------- Reveal-on-scroll (respects reduced motion) ---------------- */
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealTargets = document.querySelectorAll('.event-card, .step, .feature-item, .story-badge, .story-copy, .steps-line, .quality-block');
    revealTargets.forEach((el) => el.classList.add('reveal-init'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealTargets.forEach((el) => io.observe(el));
  }
})();
