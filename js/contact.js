// JavaScript para la página de Contacto y Newsletter sin Firebase
document.addEventListener('DOMContentLoaded', async () => {

  let siteKey = '';
  try {
    const resp = await fetch('api/recaptcha-site-key.php');
    const data = await resp.json();
    siteKey = data.siteKey;

    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  } catch (err) {
    console.error('Error loading reCAPTCHA site key', err);
    return;
  }

  grecaptcha.ready(() => {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm(contactForm)) {
          const errorMessage = document.createElement('div');
          errorMessage.className = 'contact-form__message contact-form__message--error';
          errorMessage.textContent = 'Por favor, completa todos los campos requeridos correctamente.';
          contactForm.parentNode.insertBefore(errorMessage, contactForm);
          errorMessage.style.display = 'block';
          setTimeout(() => {
            errorMessage.style.display = 'none';
            setTimeout(() => errorMessage.remove(), 500);
          }, 5000);
          return;
        }

        try {
          const token = await grecaptcha.execute(siteKey, { action: 'submit' });
          const tokenField = document.getElementById('g-recaptcha-token-contact');
          if (tokenField) {
            tokenField.value = token;
          }

          const formData = new FormData(contactForm);

          const resp = await fetch('api/submit.php', {
            method: 'POST',
            body: formData
          });
          const data = await resp.json();

          if (data.ok) {
            const successMessage = document.createElement('div');
            successMessage.className = 'contact-form__message contact-form__message--success';
            successMessage.textContent = '¡Mensaje enviado con éxito! Te responderemos lo antes posible.';
            contactForm.parentNode.insertBefore(successMessage, contactForm);
            successMessage.style.display = 'block';
            contactForm.reset();
            setTimeout(() => {
              successMessage.style.display = 'none';
              setTimeout(() => successMessage.remove(), 500);
            }, 5000);
          } else {
            throw new Error(data.error || 'Error desconocido');
          }
        } catch (err) {
          console.error('Error al enviar el mensaje', err);
          const errorMessage = document.createElement('div');
          errorMessage.className = 'contact-form__message contact-form__message--error';
          errorMessage.textContent = 'Ha ocurrido un error. Intenta nuevamente más tarde.';
          contactForm.parentNode.insertBefore(errorMessage, contactForm);
          errorMessage.style.display = 'block';
          setTimeout(() => {
            errorMessage.style.display = 'none';
            setTimeout(() => errorMessage.remove(), 500);
          }, 5000);
        }
      });
    }

    const newsletterForm = document.getElementById('newsletterForm');

    if (newsletterForm) {
      newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm(newsletterForm)) {
          const errorMessage = document.createElement('div');
          errorMessage.className = 'newsletter__message newsletter__message--error';
          errorMessage.textContent = 'Por favor, completa todos los campos requeridos correctamente.';
          newsletterForm.parentNode.insertBefore(errorMessage, newsletterForm);
          errorMessage.style.display = 'block';
          setTimeout(() => {
            errorMessage.style.display = 'none';
            setTimeout(() => errorMessage.remove(), 500);
          }, 5000);
          return;
        }

        try {
          const token = await grecaptcha.execute(siteKey, { action: 'submit' });
          const tokenField = document.getElementById('g-recaptcha-token-newsletter');
          if (tokenField) {
            tokenField.value = token;
          }

          const formData = new FormData(newsletterForm);

      // Ejecutar reCAPTCHA también para newsletter (el backend lo exige)
      grecaptcha.ready(async () => {
        try {
          const token = await grecaptcha.execute(siteKey, { action: 'newsletter' });
          formData.append('token', token);

          const resp = await fetch('api/newsletter.php', {
            method: 'POST',
            body: formData
          });
          const data = await resp.json();

          if (data.ok) {
            const successMessage = document.createElement('div');
            successMessage.className = 'newsletter__message newsletter__message-success';
            successMessage.textContent = '¡Gracias por suscribirte! Pronto recibirás tu primer newsletter.';
            newsletterForm.parentNode.insertBefore(successMessage, newsletterForm);
            successMessage.style.display = 'block';
            newsletterForm.reset();
            setTimeout(() => {
              successMessage.style.display = 'none';
              setTimeout(() => successMessage.remove(), 500);
            }, 5000);
          } else {
            throw new Error(data.error || 'Error desconocido');
          }
        } catch (err) {
          console.error('Error al guardar la suscripción', err);
          const errorMessage = document.createElement('div');
          errorMessage.className = 'newsletter__message newsletter__message--error';
          errorMessage.textContent = 'Ha ocurrido un error. Intenta nuevamente más tarde.';
          newsletterForm.parentNode.insertBefore(errorMessage, newsletterForm);
          errorMessage.style.display = 'block';
          setTimeout(() => {
            errorMessage.style.display = 'none';
            setTimeout(() => errorMessage.remove(), 500);
          }, 5000);
        }
      });
    });
  }

  // Acordeón de FAQ
  const faqQuestions = document.querySelectorAll('.faq__question');

  if (faqQuestions.length > 0) {
    faqQuestions.forEach(question => {
      question.addEventListener('click', function () {
        const faqItem = this.parentElement;

        // Toggle clase active en el item actual
        faqItem.classList.toggle('faq__item--active');

        // Cerrar otros items si están abiertos
        document.querySelectorAll('.faq__item').forEach(item => {
          if (item !== faqItem && item.classList.contains('faq__item--active')) {
            item.classList.remove('faq__item--active');
          }
        });
      });
    });
  }

  // Animación para elementos al hacer scroll
  const animateOnScroll = function () {
    const elements = document.querySelectorAll('.contact-method, .newsletter__feature, .faq__item');

    elements.forEach(element => {
      const elementPosition = element.getBoundingClientRect().top;
      const screenPosition = window.innerHeight / 1.2;

      if (elementPosition < screenPosition) {
        element.classList.add('fade-in');
      }
    });
  };

  // Ejecutar animación al cargar la página
  animateOnScroll();

  // Ejecutar animación al hacer scroll
  window.addEventListener('scroll', animateOnScroll);

  // Validación de formularios
  const validateForm = (form) => {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');

    inputs.forEach(input => {
      if (!input.value.trim()) {
        isValid = false;
        input.classList.add('error');
      } else {
        input.classList.remove('error');
      }

      // Validación específica para email
      if (input.type === 'email' && input.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value.trim())) {
          isValid = false;
          input.classList.add('error');
        }
      }
    });

    return isValid;
  };

});

