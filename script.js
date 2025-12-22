const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const scrollIndicator = document.querySelector('.scroll-indicator');
const animatedElements = document.querySelectorAll('[data-animate]');
const firstSection = document.querySelector('main section');

document.body.classList.add('js-enabled');

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

const animateOnScroll = () => {
  if (!animatedElements.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  animatedElements.forEach((el, index) => {
    el.style.transitionDelay = `${index * 60}ms`;
    observer.observe(el);
  });
};

const enableScrollIndicator = () => {
  if (!scrollIndicator || !firstSection) return;

  scrollIndicator.addEventListener('click', () => {
    firstSection.scrollIntoView({ behavior: 'smooth' });
  });
};

bindNavigation();
animateOnScroll();
enableScrollIndicator();
