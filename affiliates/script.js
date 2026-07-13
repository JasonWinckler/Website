const animatedElements = document.querySelectorAll('[data-animate]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
    }
  });
}, { threshold: 0.2 });

animatedElements.forEach((element) => observer.observe(element));

const imagesWithFallbacks = document.querySelectorAll('img[data-fallback-src]');

imagesWithFallbacks.forEach((image) => {
  image.addEventListener('error', () => {
    const fallbackSrc = image.dataset.fallbackSrc;

    if (fallbackSrc && image.src !== fallbackSrc) {
      image.src = fallbackSrc;
    }
  }, { once: true });
});
