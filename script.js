// =========================================================
// RUNTIME INITIALIZATION
// Enables progressive enhancements while keeping markup usable.
// =========================================================
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const scrollIndicator = document.querySelector('.scroll-indicator');
const animatedElements = document.querySelectorAll('[data-animate]');
const firstSection = document.querySelector('main section');
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

document.body.classList.add('js-enabled');

// =========================================================
// NAVIGATION
// Handles mobile toggle and closes the menu on link selection.
// =========================================================
const bindNavigation = () => {
  if (!navToggle || !navLinks) return;

  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });
};

// =========================================================
// INTERSECTION OBSERVER ANIMATIONS
// Reveals elements in sequence as they enter the viewport.
// =========================================================
const animateOnScroll = () => {
  if (!animatedElements.length) return;

  if (reduceMotionQuery.matches || !('IntersectionObserver' in window)) {
    animatedElements.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  animatedElements.forEach((el, index) => {
    el.style.transitionDelay = `${index * 60}ms`;
    observer.observe(el);
  });
};

// =========================================================
// SCROLL INDICATOR
// Smooth scrolls to the first content section for quick access.
// =========================================================
const enableScrollIndicator = () => {
  if (!scrollIndicator || !firstSection) return;

  const scrollBehavior = reduceMotionQuery.matches ? 'auto' : 'smooth';

  scrollIndicator.addEventListener('click', () => {
    firstSection.scrollIntoView({ behavior: scrollBehavior });
  });
};

// =========================================================
// BOOTSTRAP
// =========================================================
bindNavigation();
animateOnScroll();
enableScrollIndicator();
