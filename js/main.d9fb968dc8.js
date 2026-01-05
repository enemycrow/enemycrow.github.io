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
        if (!preloader) {
            return;
        }

        preloader.setAttribute('aria-hidden', 'true');
        preloader.setAttribute('aria-live', 'off');

        const hidePreloader = () => {
            if (preloader.classList.contains('preloader--hidden')) {
                return;
            }
            preloader.classList.add('preloader--hidden');
        };

        const handleTransitionEnd = event => {
            if (event.target === preloader && preloader.classList.contains('preloader--hidden')) {
                preloader.style.display = 'none';
                preloader.removeEventListener('transitionend', handleTransitionEnd);
            }
        };

        const handleAnimationEnd = () => {
            hidePreloader();
        };

        preloader.addEventListener('transitionend', handleTransitionEnd);
        preloader.addEventListener('animationend', handleAnimationEnd, { once: true });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', hidePreloader, { once: true });
        } else {
            hidePreloader();
        }
    }

    function setupMobileNavigation() {
        const mobileMenu = document.querySelector('.mobile-menu');
        const navLinks = document.querySelector('.nav-links');

        if (mobileMenu && navLinks) {
            const navId = navLinks.id || 'primary-navigation';
            if (!navLinks.id) {
                navLinks.id = navId;
            }

            mobileMenu.setAttribute('aria-controls', navId);
            mobileMenu.setAttribute('aria-expanded', 'false');

            const closeMobileMenu = () => {
                navLinks.classList.remove('active');
                mobileMenu.setAttribute('aria-expanded', 'false');
            };

            mobileMenu.addEventListener('click', function () {
                const isExpanded = mobileMenu.getAttribute('aria-expanded') === 'true';
                const nextState = !isExpanded;
                mobileMenu.setAttribute('aria-expanded', nextState ? 'true' : 'false');
                navLinks.classList.toggle('active', nextState);

                if (!nextState) {
                    document.dispatchEvent(new CustomEvent('closeNavSubmenus'));
                }
            });

            const navItems = navLinks.querySelectorAll('a');

            if (navItems.length > 0) {
                navItems.forEach(item => {
                    item.addEventListener('click', function () {
                        if (window.innerWidth <= 768) {
                            closeMobileMenu();
                            document.dispatchEvent(new CustomEvent('closeNavSubmenus'));
                        }
                    });
                });
            }

            window.addEventListener('resize', function () {
                if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
                    closeMobileMenu();
                    document.dispatchEvent(new CustomEvent('closeNavSubmenus'));
                }
            });
        }
    }

    function setupNavigationSubmenus() {
        const navItems = document.querySelectorAll('.nav-item--has-submenu');

        if (!navItems.length) {
            return;
        }

        const closeAll = (exception = null) => {
            navItems.forEach(item => {
                if (exception && item === exception) {
                    return;
                }

                const toggle = item.querySelector('.nav-link--toggle');
                const submenu = item.querySelector('.nav-submenu');

                if (!toggle || !submenu) {
                    return;
                }

                toggle.setAttribute('aria-expanded', 'false');
                submenu.setAttribute('aria-hidden', 'true');
                submenu.classList.remove('nav-submenu--open');
            });
        };

        navItems.forEach((item, index) => {
            const toggle = item.querySelector('.nav-link--toggle');
            const submenu = item.querySelector('.nav-submenu');

            if (!toggle || !submenu) {
                return;
            }

            if (!submenu.id) {
                submenu.id = `nav-submenu-${index + 1}`;
            }

            toggle.setAttribute('aria-controls', submenu.id);
            toggle.setAttribute('aria-expanded', toggle.getAttribute('aria-expanded') === 'true' ? 'true' : 'false');
            submenu.setAttribute('aria-hidden', toggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');

            const setSubmenuState = isExpanded => {
                toggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
                submenu.classList.toggle('nav-submenu--open', isExpanded);
                submenu.setAttribute('aria-hidden', isExpanded ? 'false' : 'true');
            };

            toggle.addEventListener('click', () => {
                const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

                if (isExpanded) {
                    setSubmenuState(false);
                } else {
                    closeAll(item);
                    setSubmenuState(true);
                }
            });

            toggle.addEventListener('keydown', event => {
                if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
                    setSubmenuState(false);
                }
            });

            submenu.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    setSubmenuState(false);
                    toggle.focus();
                }
            });

            // Desktop: mejorar la estabilidad del hover usando enter/leave con delay
            // para que el submenu no desaparezca si el puntero tarda en llegar.
            item.addEventListener('mouseenter', () => {
                if (window.innerWidth <= 768) return;
                // cancelar cierre pendiente
                if (item._closeTimer) {
                    clearTimeout(item._closeTimer);
                    item._closeTimer = null;
                }
                // abrir este submenu y cerrar los demás
                closeAll(item);
                setSubmenuState(true);
            });

            item.addEventListener('mouseleave', () => {
                if (window.innerWidth <= 768) return;
                // poner un retraso pequeño antes de cerrar para evitar flicker
                if (item._closeTimer) clearTimeout(item._closeTimer);
                item._closeTimer = setTimeout(() => {
                    setSubmenuState(false);
                    item._closeTimer = null;
                }, 300);
            });
        });

        document.addEventListener('click', event => {
            const target = event.target;
            const clickedInside = Array.from(navItems).some(item => item.contains(target));

            if (!clickedInside) {
                closeAll();
            }
        });

        document.addEventListener('closeNavSubmenus', () => {
            closeAll();
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                closeAll();
            }
        });
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

    function setupThemeToggle() {
        const body = document.body;
        const buttons = Array.from(document.querySelectorAll('.theme-toggle__button'));
        const themes = ['theme-default', 'theme-light', 'theme-dark'];

        const applyTheme = theme => {
            const validTheme = themes.includes(theme) ? theme : 'theme-default';
            themes.forEach(name => body.classList.remove(name));
            body.classList.add(validTheme);
            return validTheme;
        };

        const syncButtons = theme => {
            buttons.forEach(button => {
                const isActive = button.dataset.theme === theme;
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                button.classList.toggle('is-active', isActive);
            });
        };

        let storedTheme = null;

        try {
            storedTheme = localStorage.getItem('pfy-theme');
        } catch (error) {
            storedTheme = null;
        }

        const activeTheme = applyTheme(storedTheme);
        syncButtons(activeTheme);

        if (!buttons.length) {
            return;
        }

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const selectedTheme = applyTheme(button.dataset.theme);
                syncButtons(selectedTheme);

                try {
                    localStorage.setItem('pfy-theme', selectedTheme);
                } catch (error) {}
            });
        });
    }

    function init() {
        setupPreloader();
        setupMobileNavigation();
        setupNavigationSubmenus();
        setupAnimateOnScroll();
        setupFooterNewsletterForm();
        setupSmoothScroll();
        setupThemeToggle();
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
