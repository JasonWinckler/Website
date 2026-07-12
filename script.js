const animatedElements = document.querySelectorAll('[data-animate]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
    }
  });
}, { threshold: 0.2 });

animatedElements.forEach((element) => observer.observe(element));

const paypalDialog = document.querySelector('#paypal-dialog');
const paypalFrame = document.querySelector('[data-paypal-frame]');
const openPaypalButton = document.querySelector('[data-paypal-open]');
const closePaypalButton = document.querySelector('[data-paypal-close]');
const paypalDonationUrl = 'https://www.paypal.com/donate/?hosted_button_id=U87BSM6V2TXLC';

const openPaypalPopup = () => {
  if (!paypalDialog || !paypalFrame) return;

  paypalFrame.src = paypalDonationUrl;

  if (typeof paypalDialog.showModal === 'function') {
    paypalDialog.showModal();
  } else {
    window.location.href = paypalDonationUrl;
  }
};

const closePaypalPopup = () => {
  if (!paypalDialog || !paypalFrame) return;

  paypalDialog.close();
  paypalFrame.src = 'about:blank';
};

openPaypalButton?.addEventListener('click', openPaypalPopup);
closePaypalButton?.addEventListener('click', closePaypalPopup);

paypalDialog?.addEventListener('click', (event) => {
  if (event.target === paypalDialog) {
    closePaypalPopup();
  }
});
