// js/main.js
// Activar el latido de Sylvora entre las 00:00 y 03:00
const activarLatidoDeSylvora = () => {
  const ahora = new Date();
  const hora = ahora.getHours();
  if (hora >= 0 && hora <= 3) { // Solo entre 00:00 y 03:00
    document.querySelectorAll('[data-sylvora-latido="true"]').forEach(el => {
      el.classList.add('latido-activo');
    });
  }
};

activarLatidoDeSylvora();

// JavaScript principal para todas las páginas
(function (window, document) {
    const getFirebaseServices = (() => {
        let loadPromise = null;

        return () => {
            if (!loadPromise) {
                loadPromise = import('/js/firebase-init.js')
                    .then(module => module.initializeFirebase())
                    .catch(error => {
                        loadPromise = null;
                        throw error;
                    });
            }

            return loadPromise;
        };
    })();

    function setupPreloader() {
        const preloader = document.querySelector('.preloader');
        if (preloader) {
            setTimeout(() => {
                preloader.style.opacity = '0';
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 500);
            }, 1500);
        }
    }

    function setupMobileNavigation() {
        const mobileMenu = document.querySelector('.mobile-menu');
        const navLinks = document.querySelector('.nav-links');

        if (mobileMenu && navLinks) {
            mobileMenu.addEventListener('click', function () {
                navLinks.classList.toggle('active');
            });

            const navItems = navLinks.querySelectorAll('a');

            if (navItems.length > 0) {
                navItems.forEach(item => {
                    item.addEventListener('click', function () {
                        if (window.innerWidth <= 768) {
                            navLinks.classList.remove('active');
                        }
                    });
                });
            }

            window.addEventListener('resize', function () {
                if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                }
            });
        }
    }

    function setupAnimateOnScroll() {
        const animateOnScroll = function () {
            const elements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');

            elements.forEach(element => {
                const elementPosition = element.getBoundingClientRect().top;
                const screenPosition = window.innerHeight / 1.2;

                if (elementPosition < screenPosition) {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }
            });
        };

        animateOnScroll();
        window.addEventListener('scroll', animateOnScroll);
    }

    function setupFooterNewsletterForm() {
        const footerNewsletterForms = document.querySelectorAll('.footer .newsletter-form');

        if (!footerNewsletterForms.length) {
            return;
        }

        footerNewsletterForms.forEach(form => {
            form.addEventListener('submit', async function (e) {
                e.preventDefault();

                const emailInput = this.querySelector('input[type="email"]');
                const email = emailInput && emailInput.value.trim();

                if (!email) {
                    return;
                }

                try {
                    const { firebase, db } = await getFirebaseServices();
                    const data = {
                        email,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    await db.collection('newsletter_subscribers').add(data);

                    const successMessage = document.createElement('div');
                    successMessage.className = 'newsletter-success';
                    successMessage.textContent = '¡Gracias por suscribirte!';
                    successMessage.style.color = '#2ecc71';
                    successMessage.style.marginTop = '0.5rem';

                    this.appendChild(successMessage);
                    this.reset();

                    setTimeout(() => {
                        successMessage.remove();
                    }, 3000);
                } catch (err) {
                    console.error('Error al guardar la suscripción', err);
                    const errorMessage = document.createElement('div');
                    errorMessage.className = 'newsletter-error';
                    errorMessage.textContent = 'Hubo un problema. Intenta más tarde.';
                    errorMessage.style.color = '#e74c3c';
                    errorMessage.style.marginTop = '0.5rem';
                    this.appendChild(errorMessage);
                    setTimeout(() => {
                        errorMessage.remove();
                    }, 3000);
                }
            });
        });
    }

    function setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');

                if (href !== '#' && !this.classList.contains('toggle-details') && !this.classList.contains('open-modal')) {
                    e.preventDefault();

                    const targetElement = document.querySelector(href);

                    if (targetElement) {
                        window.scrollTo({
                            top: targetElement.offsetTop - 100,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    }

    function init() {
        setupPreloader();
        setupMobileNavigation();
        setupAnimateOnScroll();
        setupFooterNewsletterForm();
        setupSmoothScroll();
    }

    document.addEventListener('DOMContentLoaded', init);

    window.Main = {
        init,
        setupPreloader,
        setupMobileNavigation,
        setupAnimateOnScroll,
        setupFooterNewsletterForm,
        setupSmoothScroll
    };
})(window, document);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .catch(function(){});
  });
}
