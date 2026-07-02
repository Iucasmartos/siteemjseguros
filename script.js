/**
 * EMJ Seguros — JavaScript Vanilla
 * Menu, scroll, contadores, carrossel de depoimentos, validação de formulário
 */
(function () {
  'use strict';

  const CONFIG = {
    whatsappNumber: '5511999757778',
    whatsappMessage: 'Olá! Gostaria de solicitar uma cotação.',
    // Cole aqui a URL do seu Google Apps Script após publicar como Web App:
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

  /* ── Testimonial Carousel ── */
  const carousel = document.querySelector('.testimonial-carousel');
  if (carousel) {
    const track  = carousel.querySelector('.testimonial-track');
    const slides = carousel.querySelectorAll('.testimonial-slide');
    const dotsWrap = carousel.querySelector('.testimonial-dots');
    let current = 0, timer;

    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = `testimonial-dot${i === 0 ? ' active' : ''}`;
      d.setAttribute('aria-label', `Depoimento ${i + 1}`);
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
    });

    const dots = dotsWrap.querySelectorAll('.testimonial-dot');

    function goTo(i) {
      current = i;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, j) => d.classList.toggle('active', j === current));
    }

    function startAutoplay() { timer = setInterval(() => goTo((current + 1) % slides.length), 5000); }
    function stopAutoplay()  { clearInterval(timer); }

    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    startAutoplay();
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
      waBtn.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
      waBtn.setAttribute('target', '_blank');
      waBtn.setAttribute('rel', 'noopener noreferrer');
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

  /* ── WhatsApp links ── */
  const wa = `https://wa.me/${CONFIG.whatsappNumber}`;
  document.querySelectorAll('[data-whatsapp]').forEach((el) => {
    const msg = el.getAttribute('data-whatsapp') || CONFIG.whatsappMessage;
    el.href   = `${wa}?text=${encodeURIComponent(msg)}`;
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
  });
  const floatBtn = document.querySelector('.whatsapp-float');
  if (floatBtn) {
    floatBtn.href = `${wa}?text=${encodeURIComponent(CONFIG.whatsappMessage)}`;
    floatBtn.setAttribute('target', '_blank');
    floatBtn.setAttribute('rel', 'noopener noreferrer');
  }

})();
