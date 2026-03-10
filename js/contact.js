// JavaScript para la página de Contacto y Newsletter sin Firebase
const getTrustedTypesPolicy = () => {
  if (!window.trustedTypes) return null;
  if (window.__trustedTypesPolicy) return window.__trustedTypesPolicy;
  try {
    window.__trustedTypesPolicy = window.trustedTypes.createPolicy('default', {
      createHTML: (input) => input,
      createScriptURL: (input) => input
    });
  } catch (error) {
    window.__trustedTypesPolicy = null;
  }
  return window.__trustedTypesPolicy;
};

document.documentElement.classList.add('js-ready');
document.addEventListener('DOMContentLoaded', async () => {

  // --- Acordeón de FAQ ---
  const faqQuestions = document.querySelectorAll('.faq__question');
  const faqItems = document.querySelectorAll('.faq__item');

  if (faqQuestions.length > 0) {
    faqQuestions.forEach(question => {
      question.addEventListener('click', function () {
        const faqItem = this.parentElement;
        faqItem.classList.toggle('faq__item--active');
        faqItems.forEach(item => {
          if (item !== faqItem) item.classList.remove('faq__item--active');
        });
      });
    });
  }

  // --- Animación para elementos al hacer scroll ---
  const scrollElements = document.querySelectorAll('.contact-method, .newsletter__feature, .faq__item');

  // Al cargar: elementos ya visibles en viewport se revelan sin animación
  scrollElements.forEach(element => {
    if (element.getBoundingClientRect().top < window.innerHeight) {
      element.style.opacity = '1';
    }
  });

  const animateOnScroll = function () {
    scrollElements.forEach(element => {
      if (element.classList.contains('fade-in') || element.style.opacity === '1') return;
      const elementPosition = element.getBoundingClientRect().top;
      const screenPosition = window.innerHeight / 1.2;
      if (elementPosition < screenPosition) {
        element.classList.add('fade-in');
      }
    });
  };
  const throttledContactScroll = window.SiteUtils
    ? window.SiteUtils.throttle(animateOnScroll, 100)
    : animateOnScroll;
  window.addEventListener('scroll', throttledContactScroll);

  // --- Validación de formularios ---
  const validateForm = (form) => {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    inputs.forEach(input => {
      input.classList.remove('error');
      if (!input.value.trim()) {
        isValid = false;
        input.classList.add('error');
      }
      if (input.type === 'email' && input.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value.trim())) {
          isValid = false;
          input.classList.add('error');
        }
      }
    });
    // Validar checkbox de privacidad
    const privacyCheckbox = form.querySelector('input[type="checkbox"][name$="privacy"]');
    if (privacyCheckbox && !privacyCheckbox.checked) {
        isValid = false;
        // Podrías añadir una clase de error al label del checkbox si quieres
    }
    return isValid;
  };

  // --- Helper para mostrar mensajes ---
  const displayTemporaryMessage = (formElement, text, type, formType = 'contact') => {
      const message = document.createElement('div');
      const baseClass = formType === 'newsletter' ? 'newsletter__message' : 'contact-form__message';
      message.className = `${baseClass} ${baseClass}--${type}`;
      message.textContent = text;

      formElement.parentNode.insertBefore(message, formElement);
      message.style.display = 'block';

      setTimeout(() => {
          message.style.display = 'none';
          setTimeout(() => message.remove(), 500);
      }, 5000);
  };

  let siteKey = '';
  try {
    const resp = await fetch('api/recaptcha-site-key.php');
    const data = await resp.json();
    if (!data.siteKey) throw new Error(data.error || 'Clave reCAPTCHA no recibida');
    siteKey = data.siteKey;

    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const url = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      const policy = getTrustedTypesPolicy();
      script.src = policy ? policy.createScriptURL(url) : url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  } catch (err) {
    console.error('Error loading reCAPTCHA site key', err);
    // Mostrar un error al usuario en la UI si no carga reCAPTCHA
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'contact-form__message contact-form__message--error';
        errorMessage.textContent = 'No se pudo cargar reCAPTCHA. Refresca la página.';
        contactForm.parentNode.insertBefore(errorMessage, contactForm);
        errorMessage.style.display = 'block';
    }
    return;
  }

  grecaptcha.ready(() => {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm(contactForm)) {
          displayTemporaryMessage(contactForm, 'Por favor, completa todos los campos requeridos correctamente.', 'error');
          return;
        }

        try {
          const token = await grecaptcha.execute(siteKey, { action: 'submit' });
          const formData = new FormData(contactForm);
          formData.set('token', token);

          const resp = await fetch('api/submit.php', {
            method: 'POST',
            body: formData
          });
          const data = await resp.json();

          if (data.ok) {
            displayTemporaryMessage(contactForm, '¡Mensaje enviado con éxito! Te responderemos lo antes posible.', 'success');
            contactForm.reset();
          } else {
            console.error('Error del servidor (contacto):', data);
            throw new Error(data.error || 'Error desconocido');
          }
        } catch (err) {
          console.error('Error al enviar el mensaje:', err);
          displayTemporaryMessage(contactForm, 'Ha ocurrido un error. Intenta nuevamente más tarde.', 'error');
        }
      });
    }

    const newsletterForm = document.getElementById('newsletterForm');

    if (newsletterForm) {
      newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm(newsletterForm)) {
          displayTemporaryMessage(newsletterForm, 'Por favor, completa todos los campos requeridos correctamente.', 'error');
          return;
        }

        try {
          const token = await grecaptcha.execute(siteKey, { action: 'newsletter' });
          const formData = new FormData(newsletterForm);
          formData.set('token', token);

          const resp = await fetch('api/newsletter.php', {
            method: 'POST',
            body: formData
          });
          const data = await resp.json();

          if (data.ok) {
            displayTemporaryMessage(newsletterForm, '¡Gracias por suscribirte! Pronto recibirás tu primer newsletter.', 'success', 'newsletter');
            newsletterForm.reset();
          } else {
            console.error('Error del servidor (newsletter):', data);
            throw new Error(data.error || 'Error desconocido');
          }
        } catch (err) {
          console.error('Error al guardar la suscripción:', err);
          displayTemporaryMessage(newsletterForm, 'Ha ocurrido un error. Intenta nuevamente más tarde.', 'error', 'newsletter');
        }
      });
    }
  });

});
