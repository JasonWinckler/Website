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

const openPaypalButton = document.querySelector('[data-paypal-open]');
const paypalDonateContainer = document.querySelector('#paypal-donate-button-container');
const paypalDonationUrl = 'https://www.paypal.com/donate/?hosted_button_id=6XPT97RRUBEA6';
const paypalHostedButtonId = '6XPT97RRUBEA6';

const renderPaypalHostedButton = () => {
  if (!window.PayPal?.Donation || !paypalDonateContainer) return;

  window.PayPal.Donation.Button({
    env: 'production',
    hosted_button_id: paypalHostedButtonId,
    image: {
      src: 'https://www.paypalobjects.com/en_US/DK/i/btn/btn_donateCC_LG.gif',
      alt: 'Donate with PayPal button',
      title: 'PayPal - The safer, easier way to pay online!',
    },
  }).render('#paypal-donate-button-container');
};

const triggerPaypalHostedButton = () => {
  const sdkButton = paypalDonateContainer?.querySelector('button, input, img, a');

  if (sdkButton) {
    sdkButton.click();
    return;
  }

  window.location.href = paypalDonationUrl;
};

openPaypalButton?.addEventListener('click', triggerPaypalHostedButton);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderPaypalHostedButton);
} else {
  renderPaypalHostedButton();
}
