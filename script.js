const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

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
