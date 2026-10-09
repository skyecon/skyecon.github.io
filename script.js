// Skyecon Site Enhancements
// Scroll animations, typewriter reveal, smooth scroll, and direct contact helpers

(() => {
  document.documentElement.classList.add('has-js');
  let verifiedTurnstileToken = '';
  let revealedContact = null;

  window.skyeconContactGateVerified = function(token) {
    verifiedTurnstileToken = token || '';
    document.querySelectorAll('[data-skyecon-contact-gate]').forEach(gate => {
      updateGateReady(gate);
      if (verifiedTurnstileToken && !revealedContact && !gate.dataset.revealing) revealContact(gate);
    });
  };

  window.skyeconContactGateExpired = function() {
    verifiedTurnstileToken = '';
    document.querySelectorAll('[data-skyecon-contact-gate]').forEach(gate => {
      const button = gate.querySelector('[data-contact-reveal]');
      const status = gate.querySelector('[data-contact-status]');
      if (button) {
        button.disabled = true;
        button.textContent = 'Complete verification above';
      }
      if (status && !revealedContact) status.textContent = 'Verification expired. Please complete the human check again.';
    });
  };

  function updateGateReady(gate) {
    const button = gate.querySelector('[data-contact-reveal]');
    const status = gate.querySelector('[data-contact-status]');
    if (!button) return;
    if (revealedContact) {
      renderContact(gate, revealedContact);
      return;
    }
    button.disabled = !verifiedTurnstileToken;
    button.textContent = verifiedTurnstileToken ? 'Revealing contact…' : 'Complete verification above';
    if (status && verifiedTurnstileToken) status.textContent = 'Verified. Revealing contact details…';
  }

  function renderContact(gate, contact) {
    const output = gate.querySelector('[data-contact-output]');
    const status = gate.querySelector('[data-contact-status]');
    const button = gate.querySelector('[data-contact-reveal]');
    if (button) button.hidden = true;
    if (status) {
      status.textContent = 'Verified contact details:';
      status.classList.add('contact-gate-success');
    }
    if (!output) return;
    output.hidden = false;
    output.innerHTML = '';

    const phone = document.createElement('a');
    phone.className = 'contact-reveal-link';
    phone.href = contact.phoneHref;
    phone.textContent = contact.phoneDisplay;

    const email = document.createElement('a');
    email.className = 'contact-reveal-link';
    email.href = contact.emailHref;
    email.textContent = contact.emailDisplay;

    output.append(phone, email);
  }

  async function revealContact(gate) {
    const status = gate.querySelector('[data-contact-status]');
    const button = gate.querySelector('[data-contact-reveal]');
    if (!verifiedTurnstileToken) {
      if (status) status.textContent = 'Please complete the human check first.';
      return;
    }
    gate.dataset.revealing = 'true';
    if (button) {
      button.disabled = true;
      button.textContent = 'Revealing contact…';
    }
    if (status) status.textContent = 'Checking verification…';

    try {
      const response = await fetch('/api/reveal-contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: verifiedTurnstileToken })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Could not reveal contact details.');
      revealedContact = data;
      document.querySelectorAll('[data-skyecon-contact-gate]').forEach(otherGate => renderContact(otherGate, data));
    } catch (error) {
      if (status) status.textContent = error.message || 'Verification failed. Please refresh and try again.';
      delete gate.dataset.revealing;
      if (button) {
        button.disabled = !verifiedTurnstileToken;
        button.textContent = verifiedTurnstileToken ? 'Try again' : 'Complete verification above';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const methodExperience = document.querySelector('[data-method-experience]');
    const methodSteps = methodExperience ? Array.from(methodExperience.querySelectorAll('[data-method-step]')) : [];
    const methodNumber = methodExperience ? methodExperience.querySelector('[data-method-number]') : null;
    const methodName = methodExperience ? methodExperience.querySelector('[data-method-name]') : null;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const setMethodStep = (index) => {
      methodSteps.forEach((step, stepIndex) => {
        const active = stepIndex === index;
        step.classList.toggle('is-active', active);
        if (active) step.setAttribute('aria-current', 'step');
        else step.removeAttribute('aria-current');
      });
      const activeStep = methodSteps[index];
      if (!activeStep) return;
      if (methodNumber) methodNumber.textContent = activeStep.querySelector('.method-number').textContent;
      if (methodName) methodName.textContent = activeStep.querySelector('b').textContent;
      methodExperience.style.setProperty('--method-progress', methodSteps.length > 1 ? index / (methodSteps.length - 1) : 0);
    };

    if (methodExperience && methodSteps.length && !reducedMotion.matches) {
      let methodFrame = 0;
      const updateMethodFromScroll = () => {
        methodFrame = 0;
        const rect = methodExperience.getBoundingClientRect();
        const travel = Math.max(1, methodExperience.offsetHeight - window.innerHeight);
        const progress = Math.max(0, Math.min(1, -rect.top / travel));
        setMethodStep(Math.min(methodSteps.length - 1, Math.floor(progress * methodSteps.length)));
      };
      const requestMethodUpdate = () => {
        if (!methodFrame) methodFrame = window.requestAnimationFrame(updateMethodFromScroll);
      };
      window.addEventListener('scroll', requestMethodUpdate, { passive: true });
      window.addEventListener('resize', requestMethodUpdate);
      updateMethodFromScroll();
    }

    document.querySelectorAll('[data-proof-stage]').forEach(stage => {
      const toggle = stage.querySelector('[data-proof-toggle]');
      if (!toggle) return;
      toggle.addEventListener('click', () => {
        const inspecting = !stage.classList.contains('is-inspecting');
        stage.classList.toggle('is-inspecting', inspecting);
        toggle.setAttribute('aria-expanded', inspecting ? 'true' : 'false');
        const label = toggle.querySelector('[data-proof-label]');
        if (label) label.textContent = inspecting ? label.dataset.labelClose : label.dataset.labelOpen;
      });
    });

    // Reveal on scroll + typewriter per section
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.15
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');

        if (entry.target.dataset.typewriter && !entry.target.dataset.typed) {
          typeText(entry.target);
          entry.target.dataset.typed = 'true';
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // Lazy image observer
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          imgObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);
    document.querySelectorAll('.lazy-img').forEach(el => imgObserver.observe(el));

    document.querySelectorAll('[data-skyecon-contact-gate]').forEach(gate => {
      updateGateReady(gate);
      const button = gate.querySelector('[data-contact-reveal]');
      if (button) button.addEventListener('click', () => revealContact(gate));
    });

    // Mobile menu: real navigation, compact header.
    document.querySelectorAll('[data-mobile-menu-toggle]').forEach(toggle => {
      const header = toggle.closest('.site-header, .masthead');
      const menu = header ? header.querySelector('nav') : null;
      if (!header || !menu) return;

      const setOpen = (open) => {
        header.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      };

      toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        setOpen(!header.classList.contains('menu-open'));
      });

      menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
      document.addEventListener('click', (event) => {
        if (!header.contains(event.target)) setOpen(false);
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setOpen(false);
      });
    });

    // Recruiting form handler — opens mail app with candidate details filled in.
    const recruitingForm = document.getElementById('recruiting-form');
    if (recruitingForm) {
      recruitingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const role = this.dataset.recruitingRole || 'Skyecon recruiting roster';
        const get = (name) => this.elements[name] ? this.elements[name].value.trim() : '';
        const body = 'Skyecon recruiting intake\n\nRole/search: ' + role +
          '\nName: ' + get('name') +
          '\nContact: ' + get('contact') +
          '\nLocation/service area: ' + get('location') +
          '\nTrade/skill: ' + (get('trade') || 'Painter') +
          '\nAvailability: ' + get('availability') +
          '\nExpected rate: ' + get('rate') +
          '\nTools/vehicle/insurance/WCB/licence: ' + get('credentials') +
          '\n\nExperience/examples/references:\n' + get('details') +
          '\n\nConsent: Candidate submitted this information so Skyecon can contact them about possible work opportunities. No work was promised by the form.';
        const subject = 'Skyecon recruiting intake — ' + role + ' — ' + (get('name') || get('location') || 'candidate');
        window.location.href = 'mailto:skyecon.projects@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      });
    }

    // Contact form handler — opens mail app only after contact details have been verified
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      const softwareInquiry = new URL(window.location.href).searchParams.get('inquiry') === 'software';
      if (softwareInquiry) {
        contactForm.project.value = 'Software / systems engineering';
        const note = contactForm.querySelector('[data-software-inquiry-note]');
        if (note) note.hidden = false;
        if (contactForm.details) contactForm.details.placeholder = 'Operating problem, current system, users, constraints, evidence available, desired result, and timeline. Do not include sensitive data.';
      }
      contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const status = document.querySelector('[data-contact-status]');
        if (!revealedContact || !revealedContact.emailHref) {
          const gate = document.querySelector('[data-skyecon-contact-gate]');
          if (gate) gate.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (status) status.textContent = 'Please complete the human check and reveal the quote email before sending the form.';
          return;
        }
        const contactForEmail = revealedContact;
        if (status) status.textContent = 'Opening your mail app with the project details filled in.';
        const get = (name) => this.elements[name] ? this.elements[name].value.trim() : '';
        const name = get('name');
        const phone = get('phone');
        const email = get('email');
        const location = get('location');
        const sqft = get('sqft');
        const timeline = get('timeline');
        const material = get('material');
        const project = get('project');
        const details = get('details');
        const technologyInquiryForm = this.dataset.inquiryKind === 'technology' || project === 'Software / systems engineering';
        let body;
        if (technologyInquiryForm) {
          body = 'New SKYECON bounded software inquiry\n\nName: ' + name +
            '\nOrganization: ' + get('organization') +
            '\nEmail: ' + email +
            '\nPhone: ' + phone +
            '\nTiming: ' + timeline +
            '\nPrimary users: ' + get('users') +
            '\n\nOutcome required:\n' + get('objective') +
            '\n\nCurrent system or workflow:\n' + get('currentSystem') +
            '\n\nConstraints and available evidence:\n' + details +
            '\n\nNo credentials or sensitive materials were requested by this form.';
        } else {
          const photoCount = this.photos && this.photos.files ? this.photos.files.length : 0;
          body = 'New Skyecon inquiry\n\nName: ' + name + '\nPhone: ' + phone + '\nEmail: ' + email + '\nCity/address: ' + location + '\nSquare footage: ' + sqft + '\nTimeline: ' + timeline + '\nMaterial purchased?: ' + material + '\nProject type: ' + project + '\nPhotos selected: ' + photoCount + ' (photos optional, but helpful)\n\nDetails:\n' + details;
        }
        const subjectPrefix = technologyInquiryForm ? 'SKYECON bounded software inquiry' : 'Skyecon project inquiry';
        const subject = subjectPrefix + ' — ' + (get('organization') || location || project || 'new lead');
        const separator = contactForEmail.emailHref.includes('?') ? '&' : '?';
        window.location.href = contactForEmail.emailHref + separator + 'subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      });
    }

    // Typewriter effect — one word at a time, fast cadence (~90 wpm)
    function typeText(container) {
      const original = container.dataset.fulltext || container.textContent.trim();
      container.dataset.fulltext = original;

      // Long sales copy should be readable immediately. Keep the small heading
      // flourish, but do not make visitors wait for paragraphs/rates to type out.
      if (original.length > 90) {
        container.textContent = original;
        return;
      }

      const words = original.split(/\s+/).filter(Boolean);
      let i = 0;

      container.innerHTML = '<span class="typewriter-done"></span>';
      const output = container.querySelector('.typewriter-done');

      function typeStep() {
        if (i < words.length) {
          if (i > 0) output.textContent += ' ';
          output.textContent += words[i];
          i++;

          if (i >= words.length) return;

          const wordLen = words[i].length;
          const delay = wordLen < 5 ? 40 + Math.random() * 20 : 55 + Math.random() * 25;
          setTimeout(typeStep, delay);
        }
      }
      setTimeout(typeStep, 60);
    }

    // Header scroll shadow
    window.addEventListener('scroll', () => {
      const header = document.querySelector('.site-header');
      if (!header) return;
      if (window.scrollY > 30) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    });
  });
})();
