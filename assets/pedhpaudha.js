/**
 * PedhPaudha Theme Interactive Engine
 * Handles Navigation, Live Search Filtering, Wishlist, Cart Count,
 * Announcement bar, Modals and Responsive Drawers.
 */

(function () {
  'use strict';

  // Store in LocalStorage for persistence
  const STORAGE_KEYS = {
    CART_COUNT: 'pp_cart_count',
    WISHLIST: 'pp_wishlist_items'
  };

  function getCartCount() {
    return parseInt(localStorage.getItem(STORAGE_KEYS.CART_COUNT) || '0', 10);
  }

  function setCartCount(count) {
    localStorage.setItem(STORAGE_KEYS.CART_COUNT, count.toString());
    updateCartBadges(count);
  }

  function updateCartBadges(count) {
    document.querySelectorAll('.pp-cart-badge').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'flex'; // always display '0' or positive
    });
  }

  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.WISHLIST) || '[]');
    } catch (e) {
      return [];
    }
  }

  function toggleWishlist(productId) {
    let list = getWishlist();
    const index = list.indexOf(productId);
    let added = false;
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(productId);
      added = true;
    }
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(list));
    updateWishlistUI();
    showToast(added ? 'Added to your wishlist' : 'Removed from wishlist');
    return added;
  }

  function updateWishlistUI() {
    const list = getWishlist();
    document.querySelectorAll('.pp-prod-wishlist').forEach(btn => {
      const pid = btn.getAttribute('data-product-id');
      if (list.includes(pid)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.pp-wishlist-badge').forEach(badge => {
      if (list.length > 0) {
        badge.textContent = list.length;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    });
  }

  function showToast(message) {
    let toast = document.getElementById('pp-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pp-toast';
      toast.className = 'pp-toast';
      toast.innerHTML = `<span class="pp-toast-icon">✓</span> <span class="pp-toast-msg"></span>`;
      document.body.appendChild(toast);
    }
    toast.querySelector('.pp-toast-msg').textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  function initializeHeroHeaderScroll() {
    const scrollContainer = document.querySelector('.page-wrapper');

    let frameRequested = false;
    const syncHeaderState = function () {
      const header = document.getElementById('pp-site-header');
      if (!header) return;

      const pageScrollTop = document.scrollingElement?.scrollTop ?? window.scrollY;
      const wrapperScrollTop = scrollContainer?.scrollTop ?? 0;
      const slot = header.closest('.pp-header-slot');
      const slotTop = slot?.getBoundingClientRect().top ?? 0;
      header.classList.toggle('scrolled', Math.max(pageScrollTop, wrapperScrollTop) > 10 && slotTop <= 4);
    };
    const onScroll = function () {
      if (frameRequested) return;
      frameRequested = true;
      window.requestAnimationFrame(function () {
        frameRequested = false;
        syncHeaderState();
      });
    };

    syncHeaderState();
    scrollContainer?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pageshow', syncHeaderState);
    window.addEventListener('resize', syncHeaderState, { passive: true });
    document.addEventListener('shopify:section:load', syncHeaderState);
    document.addEventListener('click', (event) => {
      if (event.target.closest('.pp-announcement-close')) onScroll();
    });
  }

  function initializeMachineryParallax() {
    const sectionSelector = '.pp-sourcing-section';
    if (!document.querySelector(sectionSelector) && !window.Shopify?.designMode) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sectionMotion = new Map();
    let frameRequested = false;
    let previousFrameTime = 0;

    function animateSections(timestamp) {
      frameRequested = false;
      if (reducedMotion.matches) return;

      const elapsed = previousFrameTime ? Math.min(timestamp - previousFrameTime, 32) : 16;
      const smoothing = 1 - Math.exp(-elapsed / 85);
      previousFrameTime = timestamp;
      let stillMoving = false;

      for (const [section, motion] of sectionMotion) {
        if (!section.isConnected) {
          sectionMotion.delete(section);
          continue;
        }

        const difference = motion.target - motion.current;
        if (Math.abs(difference) < 0.12) {
          motion.current = motion.target;
        } else {
          motion.current += difference * smoothing;
          stillMoving = true;
        }

        section.style.setProperty('--pp-sourcing-scroll', `${motion.current.toFixed(2)}px`);
      }

      if (stillMoving) {
        frameRequested = true;
        window.requestAnimationFrame(animateSections);
      } else {
        previousFrameTime = 0;
      }
    }

    function scheduleUpdate() {
      if (reducedMotion.matches) return;

      const viewportHeight = document.documentElement.clientHeight;

      for (const section of document.querySelectorAll(sectionSelector)) {
        const bounds = section.getBoundingClientRect();
        if (bounds.bottom <= 0 || bounds.top >= viewportHeight) continue;
        const target = viewportHeight * 0.1 - bounds.top;
        const motion = sectionMotion.get(section);

        if (motion) {
          motion.target = target;
        } else {
          sectionMotion.set(section, { current: target, target });
          section.style.setProperty('--pp-sourcing-scroll', `${target.toFixed(2)}px`);
        }
      }

      if (!frameRequested) {
        frameRequested = true;
        window.requestAnimationFrame(animateSections);
      }
    }

    window.addEventListener('scroll', scheduleUpdate, { capture: true, passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('pageshow', scheduleUpdate);
    document.addEventListener('shopify:section:load', scheduleUpdate);
    reducedMotion.addEventListener('change', scheduleUpdate);
    scheduleUpdate();
  }

  function initializeHomeScrollAnimations() {
    if (document.body?.dataset.template !== 'index' || !('IntersectionObserver' in window)) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return;

    const revealSelector = [
      '.pp-categories-header', '.pp-cat-card', '.pp-search-box', '#pp-products-container > .pp-product-card',
      '.pp-sourcing-header', '.pp-sourcing-card-wrap', '.pp-goals-header', '.pp-goal-card',
      '.pp-kits-header', '.pp-kit-card', '.pp-why-section .pp-container > div:first-child', '.pp-why-card',
      '.pp-blog-section .pp-container > div:first-child', '.pp-blog-card',
      '.pp-testimonials-section .pp-container > div:first-child', '.pp-testimonial-card',
      '.pp-newsletter-box', '.pp-footer-grid'
    ].join(', ');
    const staggerGroupSelector = [
      '.pp-categories-slider', '#pp-products-container', '.pp-sourcing-grid',
      '.pp-kits-grid', '.pp-why-grid', '.pp-blog-grid', '.pp-testimonials-grid', '.pp-goals-collage'
    ].join(', ');

    function observeHomeContent(root = document) {
      const elements = root.querySelectorAll(revealSelector);
      if (!elements.length) return;

      document.documentElement.classList.add('pp-scroll-reveal-ready');
      const groupIndexes = new Map();

      elements.forEach((element) => {
        if (element.dataset.ppRevealObserved === 'true') return;
        element.dataset.ppRevealObserved = 'true';

        if (element.matches('.pp-cat-card, .pp-product-card, .pp-sourcing-card-wrap, .pp-goal-card, .pp-kit-card, .pp-why-card, .pp-blog-card, .pp-testimonial-card')) {
          const group = element.closest(staggerGroupSelector);
          if (group) {
            const index = groupIndexes.get(group) || 0;
            element.style.setProperty('--pp-reveal-delay', `${Math.min(index * 75, 300)}ms`);
            groupIndexes.set(group, index + 1);
          }
        }

        homeRevealObserver.observe(element);
      });
    }

    const homeRevealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

    observeHomeContent();
    document.addEventListener('shopify:section:load', (event) => observeHomeContent(event.target));
  }

  function initializeScrollEffects() {
    initializeHeroHeaderScroll();
    initializeMachineryParallax();
    initializeHomeScrollAnimations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeScrollEffects, { once: true });
  } else {
    initializeScrollEffects();
  }

  // Initialize DOM event listeners
  document.addEventListener('DOMContentLoaded', function () {
    // 1. Initial State from Storage
    updateCartBadges(getCartCount());
    updateWishlistUI();

    // 2. Announcement Bar Dismiss
    const closeAnnounce = document.querySelector('.pp-announcement-close');
    if (closeAnnounce) {
      closeAnnounce.addEventListener('click', function () {
        const bar = document.querySelector('.pp-announcement');
        if (bar) bar.style.display = 'none';
        document.documentElement.style.setProperty('--pp-announcement-height', '0px');
      });
    }

    // 4. Add to Cart Buttons
    document.addEventListener('click', function (e) {
      const addBtn = e.target.closest('.pp-btn-add-cart');
      if (addBtn) {
        e.preventDefault();
        const productName = addBtn.getAttribute('data-product-name') || 'Product';
        const newCount = getCartCount() + 1;
        setCartCount(newCount);
        showToast(`Added "${productName}" to shopping bag!`);
      }

      // Wishlist toggle
      const wishBtn = e.target.closest('.pp-prod-wishlist');
      if (wishBtn) {
        e.preventDefault();
        const pid = wishBtn.getAttribute('data-product-id');
        toggleWishlist(pid);
      }
    });

    // 5. Live Product Search & Filter
    const searchInput = document.getElementById('pp-live-search');
    const filterPills = document.querySelectorAll('.pp-filter-pill');
    const productCards = document.querySelectorAll('.pp-product-card');

    function filterProducts() {
      const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
      const activePill = document.querySelector('.pp-filter-pill.active');
      const activeCat = activePill ? activePill.getAttribute('data-filter') : 'all';

      productCards.forEach(card => {
        const title = (card.getAttribute('data-title') || '').toLowerCase();
        const category = (card.getAttribute('data-category') || '').toLowerCase();
        const matchesQuery = !query || title.includes(query) || category.includes(query);
        const matchesCat = activeCat === 'all' || category === activeCat.toLowerCase();

        if (matchesQuery && matchesCat) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', filterProducts);
    }

    filterPills.forEach(pill => {
      pill.addEventListener('click', function () {
        filterPills.forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        filterProducts();
      });
    });

    // 5. Category Slider Navigation & Mouse Drag
    const catSlider = document.getElementById('pp-cat-slider');
    const catPrev = document.querySelector('.pp-cat-prev');
    const catNext = document.querySelector('.pp-cat-next');

    if (catSlider) {
      const getScrollDistance = function () {
        const card = catSlider.querySelector('.pp-cat-card');
        return card ? (card.offsetWidth + 20) * 1.5 : 340;
      };

      if (catNext) {
        catNext.addEventListener('click', function () {
          catSlider.scrollBy({ left: getScrollDistance(), behavior: 'smooth' });
        });
      }

      if (catPrev) {
        catPrev.addEventListener('click', function () {
          catSlider.scrollBy({ left: -getScrollDistance(), behavior: 'smooth' });
        });
      }

      // Smooth mouse drag on desktop
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;
      let hasDragged = false;

      catSlider.addEventListener('mousedown', function (e) {
        isDown = true;
        hasDragged = false;
        catSlider.classList.add('is-dragging');
        startX = e.pageX - catSlider.offsetLeft;
        scrollLeft = catSlider.scrollLeft;
      });

      catSlider.addEventListener('mouseleave', function () {
        isDown = false;
        catSlider.classList.remove('is-dragging');
      });

      catSlider.addEventListener('mouseup', function () {
        isDown = false;
        catSlider.classList.remove('is-dragging');
      });

      catSlider.addEventListener('mousemove', function (e) {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - catSlider.offsetLeft;
        const walk = (x - startX) * 1.5;
        if (Math.abs(walk) > 5) hasDragged = true;
        catSlider.scrollLeft = scrollLeft - walk;
      });

      // Prevent accidental link opening while dragging
      catSlider.addEventListener('click', function (e) {
        if (hasDragged) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    }

    // 6. Watch How It Works Video Modal
    const watchButtons = document.querySelectorAll('.pp-btn-watch');
    const modalBackdrop = document.getElementById('pp-video-modal');
    const modalClose = document.querySelector('.pp-modal-close');

    watchButtons.forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (modalBackdrop) modalBackdrop.classList.add('open');
      });
    });

    if (modalClose) {
      modalClose.addEventListener('click', function () {
        if (modalBackdrop) modalBackdrop.classList.remove('open');
      });
    }

    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', function (e) {
        if (e.target === modalBackdrop) {
          modalBackdrop.classList.remove('open');
        }
      });
    }

    // 7. Mobile Drawer Navigation
    const mobileToggle = document.querySelector('.pp-mobile-toggle');
    const mobileDrawer = document.getElementById('pp-mobile-drawer');
    const drawerBackdrop = document.getElementById('pp-drawer-backdrop');
    const drawerClose = document.querySelector('.pp-drawer-close');

    function openMobileDrawer() {
      if (mobileDrawer) mobileDrawer.classList.add('open');
      if (drawerBackdrop) drawerBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeMobileDrawer() {
      if (mobileDrawer) mobileDrawer.classList.remove('open');
      if (drawerBackdrop) drawerBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (mobileToggle) mobileToggle.addEventListener('click', openMobileDrawer);
    if (drawerClose) drawerClose.addEventListener('click', closeMobileDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeMobileDrawer);

    // 8. Newsletter Subscription Handler
    const newsletterForm = document.getElementById('pp-newsletter-form');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const emailInput = document.getElementById('pp-newsletter-email');
        const feedback = document.getElementById('pp-newsletter-feedback');
        const val = emailInput ? emailInput.value.trim() : '';

        if (!val || !val.includes('@') || !val.includes('.')) {
          if (feedback) {
            feedback.style.display = 'block';
            feedback.style.color = '#E53E3E';
            feedback.textContent = 'Please enter a valid email address.';
          }
          return;
        }

        if (feedback) {
          feedback.style.display = 'block';
          feedback.style.color = '#2F461E';
          feedback.textContent = '🌱 Thank you for joining the PedhPaudha community!';
        }
        if (emailInput) emailInput.value = '';
        showToast('Welcome to PedhPaudha Growing Club!');
      });
    }
  });
})();
