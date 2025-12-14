const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

// Intersection observer for reveal animations
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));

// Parallax-ish effect for hero portrait
const portrait = document.querySelector('.portrait');
const hero = document.querySelector('.hero');
let rafId = null;

if (portrait && hero && !prefersReducedMotion) {
  hero.addEventListener(
    'pointermove',
    (e) => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        portrait.style.transform = `translate(${x * 12}px, ${y * 8}px)`;
        rafId = null;
      });
    },
    { passive: true }
  );

  hero.addEventListener('pointerleave', () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    portrait.style.transform = 'translate(0, 0)';
  });
}
