// M310 Renovations — minimal vanilla JS
(function () {
  // Mobile nav toggle
  var burger = document.getElementById('navToggle');
  var menu = document.getElementById('mobileMenu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('hidden') === false;
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Header shadow on scroll
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 8) header.classList.add('shadow-lg');
      else header.classList.remove('shadow-lg');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Capture UTM params into hidden lead-form fields (Meta Ads tracking)
  try {
    var params = new URLSearchParams(window.location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      var v = params.get(k) || '';
      document.querySelectorAll('input[name="' + k + '"]').forEach(function (el) { el.value = v; });
    });
  } catch (e) {}

  // Lead form submit — POST actual lead data to /api/lead and show success UI.
  document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
    // Stamp when the form became available. The API compares this against
    // arrival time; sub-two-second fills get flagged as likely bots.
    var stamp = form.querySelector('input[name="form_render_ts"]');
    if (stamp) { stamp.value = String(Date.now()); }

    var sending = false;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;

      var success = form.parentElement.querySelector('[data-form-success]');
      var errorBox = form.querySelector('[data-form-error]');
      var submitButton = form.querySelector('[type="submit"]');
      var originalLabel = submitButton ? submitButton.textContent : '';

      sending = true;
      if (errorBox) { errorBox.classList.add('hidden'); }
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending…';
      }

      var payload = { page: window.location.pathname };
      var formData = new FormData(form);
      formData.forEach(function (value, key) {
        payload[key] = value;
      });

      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (!res.ok) throw new Error(data.error || 'Submission failed.');
            return data;
          });
        })
        .then(function () {
          if (typeof fbq === 'function') { fbq('track', 'Lead'); }
          form.classList.add('hidden');
          if (success) {
            success.classList.remove('hidden');
            success.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        })
        .catch(function (err) {
          console.error('Lead submit error:', err);
          // Turnstile tokens are single-use, so any retry needs a fresh one.
          var widget = form.querySelector('.cf-turnstile');
          if (widget && window.turnstile) {
            try { window.turnstile.reset(widget); } catch (e) {}
          }
          if (errorBox) {
            errorBox.textContent = err.message + ' You can also call (803) 634-1616.';
            errorBox.classList.remove('hidden');
          } else {
            alert('Sorry, there was a problem sending your request. Please try again or call us directly.');
          }
        })
        .finally(function () {
          sending = false;
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalLabel;
          }
        });
    });
  });

  // "Get Quote" scroll-to-form buttons
  document.querySelectorAll('[data-scroll-to]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var target = document.querySelector(btn.getAttribute('data-scroll-to'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  // Phone click tracking — fires Meta Pixel "Contact" event on tel: link taps.
  // Critical for local businesses: most leads call instead of filling forms.
  document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (typeof fbq === 'function') {
        fbq('track', 'Contact', {
          content_name: 'Phone Call',
          content_category: 'Click-to-Call'
        });
      }
      // Also push to dataLayer if GA/GTM is added later
      if (window.dataLayer) {
        window.dataLayer.push({ event: 'phone_click', phone_number: link.getAttribute('href') });
      }
    });
  });

  // ---------------------------------------------------------------- LIGHTBOX
  // Vanilla, dependency-free. Any .pf-gallery on the page feeds it.
  (function () {
    var box = document.getElementById('lightbox');
    var galleries = Array.prototype.slice.call(document.querySelectorAll('.pf-gallery'));
    if (!box || !galleries.length) return;

    var imgEl = document.getElementById('lbImg');
    var capEl = document.getElementById('lbCap');
    var countEl = document.getElementById('lbCount');
    var titleEl = document.getElementById('lbTitle');
    var closeBtn = document.getElementById('lbClose');
    var prevBtn = document.getElementById('lbPrev');
    var nextBtn = document.getElementById('lbNext');
    var items = [];
    var idx = 0;
    var lastFocus = null;

    function render() {
      var it = items[idx];
      if (!it) return;
      imgEl.src = it.src;
      imgEl.alt = it.alt;
      capEl.textContent = it.alt;
      countEl.textContent = (idx + 1) + ' of ' + items.length;
      prevBtn.style.visibility = items.length > 1 ? 'visible' : 'hidden';
      nextBtn.style.visibility = items.length > 1 ? 'visible' : 'hidden';
    }

    function open(gallery, start) {
      items = Array.prototype.map.call(gallery.querySelectorAll('.pf-thumb img'), function (im) {
        return { src: im.getAttribute('src'), alt: im.getAttribute('alt') || '' };
      });
      if (!items.length) return;
      idx = Math.max(0, Math.min(start, items.length - 1));
      titleEl.textContent = gallery.getAttribute('data-gallery-title') || 'Project photos';
      lastFocus = document.activeElement;
      box.hidden = false;
      document.body.classList.add('lb-open');
      render();
      closeBtn.focus();
    }

    function close() {
      box.hidden = true;
      document.body.classList.remove('lb-open');
      imgEl.removeAttribute('src');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function step(n) {
      if (!items.length) return;
      idx = (idx + n + items.length) % items.length;
      render();
    }

    galleries.forEach(function (g) {
      g.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('.pf-thumb') : null;
        if (!btn) return;
        e.preventDefault();
        open(g, parseInt(btn.getAttribute('data-lb-index'), 10) || 0);
      });
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { step(-1); });
    nextBtn.addEventListener('click', function () { step(1); });
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.classList.contains('lb-figure')) close();
    });

    // Keyboard: Escape closes, arrows navigate, Tab is trapped inside the dialog.
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); return; }
      if (e.key === 'Tab') {
        var focusables = [closeBtn, prevBtn, nextBtn];
        var i = focusables.indexOf(document.activeElement);
        e.preventDefault();
        var next = e.shiftKey ? i - 1 : i + 1;
        if (i === -1) next = 0;
        if (next < 0) next = focusables.length - 1;
        if (next >= focusables.length) next = 0;
        focusables[next].focus();
      }
    });

    // Swipe on touch devices
    var x0 = null;
    box.addEventListener('touchstart', function (e) { x0 = e.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
      x0 = null;
    }, { passive: true });
  })();
})();
