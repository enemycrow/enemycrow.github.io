// JavaScript principal para todas las páginas
(function (window, document) {
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
        const footerNewsletterForm = document.querySelector('.footer .newsletter-form');

        if (footerNewsletterForm) {
            footerNewsletterForm.addEventListener('submit', function (e) {
                e.preventDefault();

                const emailInput = this.querySelector('input[type="email"]');

                if (emailInput && emailInput.value.trim()) {
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
                }
            });
        }
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
