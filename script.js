/**
 * EMJ Seguros — JavaScript Vanilla
 * Menu, scroll, contadores, validação de formulário
 */
(function () {
  'use strict';

  const CONFIG = {
    whatsappNumber: '5511999757778',
    whatsappMessage: 'Olá! Gostaria de solicitar uma cotação.',
    // URL do Apps Script (google-apps-script/Code.gs) publicado como Web App:
    googleScriptURL: 'https://script.google.com/macros/s/AKfycbzuKdcsY5bvUjbt5OHPcmzsmZURzwDOxTfgRvhtbyyJYmLshN5l11M85tTIQYGIxGQS/exec',
  };

  /* ── Header & Menu ── */
  const header      = document.querySelector('.header');
  const menuToggle  = document.querySelector('.menu-toggle');
  const nav         = document.querySelector('.nav');

  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuToggle.classList.toggle('active', open);
      menuToggle.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    nav.querySelectorAll('.nav-link, .btn-mobile-cta').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Active Nav Link ── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link[href^="#"]');

  function setActiveNav() {
    const scrollY = window.scrollY + 120;
    sections.forEach((section) => {
      const id  = section.getAttribute('id');
      const top = section.offsetTop;
      if (scrollY >= top && scrollY < top + section.offsetHeight) {
        navLinks.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
      }
    });
  }

  if (sections.length) window.addEventListener('scroll', setActiveNav, { passive: true });

  /* ── Smooth Scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

  /* ── Scroll Reveal ── */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => obs.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  /* ── Animated Counters ── */
  const counters = document.querySelectorAll('[data-counter]');
  function animateCounter(el) {
    const target   = parseInt(el.getAttribute('data-counter'), 10);
    const suffix   = el.getAttribute('data-suffix') || '';
    const prefix   = el.getAttribute('data-prefix') || '';
    const duration = 2000;
    const start    = performance.now();
    function update(now) {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = `${prefix}${Math.floor((1 - Math.pow(1 - p, 3)) * target)}${suffix}`;
      if (p < 1) requestAnimationFrame(update);
      else el.textContent = `${prefix}${target}${suffix}`;
    }
    requestAnimationFrame(update);
  }
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { animateCounter(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counters.forEach((c) => co.observe(c));
  }

  /* ── Form Validation ── */
  const form = document.getElementById('cotacao-form');
  if (form) {
    const validators = {
      nome:      (v) => v.trim().length >= 3    || 'Informe seu nome completo.',
      telefone:  (v) => v.replace(/\D/g,'').length >= 10 || 'Informe um telefone válido com DDD.',
      email:     (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Informe um e-mail válido.',
      produto:   (v) => v !== ''                || 'Selecione o produto desejado.',
      mensagem:  ()  => true,
    };

    function showError(field, msg) {
      const err = field.closest('.form-group').querySelector('.form-error');
      field.classList.add('error'); err.textContent = msg; err.classList.add('visible');
    }
    function clearError(field) {
      const err = field.closest('.form-group').querySelector('.form-error');
      field.classList.remove('error'); err.classList.remove('visible');
    }

    form.querySelectorAll('.form-control').forEach((field) => {
      field.addEventListener('input', () => clearError(field));
      field.addEventListener('blur',  () => {
        const r = validators[field.name]?.(field.value);
        if (r !== true && r !== undefined) showError(field, r);
      });
    });

    const telInput = form.querySelector('[name="telefone"]');
    if (telInput) {
      telInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g,'').slice(0,11);
        if (v.length > 6)      v = v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/,'($1) $2-$3');
        else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/,'($1) $2');
        else if (v.length > 0) v = `(${v}`;
        e.target.value = v;
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      Object.keys(validators).forEach((name) => {
        const field = form.querySelector(`[name="${name}"]`);
        if (!field) return;
        const r = validators[name](field.value);
        if (r !== true) { showError(field, r); valid = false; } else clearError(field);
      });
      if (!valid) return;

      const data = Object.fromEntries(new FormData(form));
      data.timestamp = new Date().toLocaleString('pt-BR');

      // Dispara para o Google Sheets em background — não aguarda resposta
      if (CONFIG.googleScriptURL !== 'COLE_AQUI_A_URL_DO_APPS_SCRIPT') {
        fetch(CONFIG.googleScriptURL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(data),
        }).catch(() => {});
      }

      // Mostra o modal imediatamente, sem esperar o Google
      form.reset();
      showSuccessModal(data.nome);
    });
  }

  /* ── WhatsApp conversion tracking (Google Ads + Meta Pixel) ── */
  function bindWhatsAppConversion(el, href) {
    el.href = href;
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
    el.onclick = function () {
      if (typeof fbq === 'function') {
        fbq('track', 'Contact');
      }
      return gtagSendEvent(href);
    };
  }

  const wa = `https://wa.me/${CONFIG.whatsappNumber}`;

  /* ── Modal de Sucesso ── */
  const modal     = document.getElementById('success-modal');
  const modalNome = document.getElementById('modal-nome');

  function showSuccessModal(nome) {
    if (!modal) return;
    if (modalNome) modalNome.textContent = nome ? nome.split(' ')[0] : '';
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    // Reconfigura o botão WhatsApp dentro do modal
    const waBtn = modal.querySelector('.modal-wa');
    if (waBtn) {
      const msg = waBtn.getAttribute('data-whatsapp') || CONFIG.whatsappMessage;
      bindWhatsAppConversion(waBtn, `${wa}?text=${encodeURIComponent(msg)}`);
    }
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  if (modal) {
    modal.querySelector('.modal-close')?.addEventListener('click', closeModal);
    modal.querySelector('.modal-btn-fechar')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  }

  document.querySelectorAll('[data-whatsapp]').forEach((el) => {
    const msg = el.getAttribute('data-whatsapp') || CONFIG.whatsappMessage;
    bindWhatsAppConversion(el, `${wa}?text=${encodeURIComponent(msg)}`);
  });
  const floatBtn = document.querySelector('.whatsapp-float');
  if (floatBtn) {
    bindWhatsAppConversion(floatBtn, `${wa}?text=${encodeURIComponent(CONFIG.whatsappMessage)}`);
  }

  /* ── Links externos Porto (legado; sem uso atual no HTML) ── */
  document.querySelectorAll('a[href*="porto.vc"]').forEach((el) => {
    const href = el.getAttribute('href');
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
    el.onclick = function () {
      return gtagSendEvent(href);
    };
  });

})();
