(() => {
  const syncAnnouncementHeight = () => {
    const announcement = document.querySelector('.pp-announcement');
    const isVisible = announcement && getComputedStyle(announcement).display !== 'none';
    const height = isVisible ? Math.ceil(announcement.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--pp-announcement-height', `${height}px`);
  };

  syncAnnouncementHeight();
  window.addEventListener('resize', syncAnnouncementHeight, { passive: true });

  const initHero = (hero) => {
    const slides = Array.from(hero.querySelectorAll('[data-pp-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-pp-dot]'));
    const current = hero.querySelector('[data-pp-current]');
    const previous = hero.querySelector('[data-pp-prev]');
    const next = hero.querySelector('[data-pp-next]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (slides.length < 2 || !previous || !next) return;

    let activeIndex = slides.findIndex((slide) => slide.classList.contains('is-active'));
    let timer;
    let paused = reducedMotion.matches;

    const showSlide = (index) => {
      activeIndex = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === activeIndex;
        slide.hidden = !isActive;
        slide.setAttribute('aria-hidden', String(!isActive));
        slide.classList.toggle('is-active', isActive);
      });

      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeIndex;
        dot.classList.toggle('is-active', isActive);
        if (isActive) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });

      if (current) current.textContent = String(activeIndex + 1).padStart(2, '0');
    };

    const clearTimer = () => window.clearInterval(timer);
    const startTimer = () => {
      clearTimer();
      if (paused || document.hidden) return;
      timer = window.setInterval(() => showSlide(activeIndex + 1), 6500);
    };

    previous.addEventListener('click', () => { showSlide(activeIndex - 1); startTimer(); });
    next.addEventListener('click', () => { showSlide(activeIndex + 1); startTimer(); });
    dots.forEach((dot) => dot.addEventListener('click', () => {
      showSlide(Number(dot.dataset.ppDot));
      startTimer();
    }));

    hero.addEventListener('mouseenter', () => { paused = true; clearTimer(); });
    hero.addEventListener('mouseleave', () => { paused = reducedMotion.matches; startTimer(); });
    hero.addEventListener('focusin', () => { paused = true; clearTimer(); });
    hero.addEventListener('focusout', (event) => {
      if (!hero.contains(event.relatedTarget)) {
        paused = reducedMotion.matches;
        startTimer();
      }
    });

    document.addEventListener('visibilitychange', startTimer);
    reducedMotion.addEventListener?.('change', (event) => {
      paused = event.matches;
      startTimer();
    });

    showSlide(Math.max(activeIndex, 0));
    startTimer();
  };

  document.querySelectorAll('[data-pp-hero]').forEach(initHero);
})();
