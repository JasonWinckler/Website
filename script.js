const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const scrollIndicator = document.querySelector('.scroll-indicator');
const animatedElements = document.querySelectorAll('[data-animate]');

document.body.classList.add('js-enabled');

navToggle?.addEventListener('click', () => {
  const isOpen = navLinks?.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
});

// Close nav on link click (mobile)
navLinks?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    if (navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
});

// Reveal on scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

animatedElements.forEach((el, index) => {
  el.style.transitionDelay = `${index * 60}ms`;
  observer.observe(el);
});

// Scroll indicator behavior
const firstSection = document.querySelector('main section');

scrollIndicator?.addEventListener('click', () => {
  if (firstSection) {
    firstSection.scrollIntoView({ behavior: 'smooth' });
  }
});
