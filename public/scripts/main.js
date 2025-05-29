// JavaScript principal para todas las páginas
document.addEventListener('DOMContentLoaded', function() {
    // Preloader
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 1500);
    }

    // Navegación móvil
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Cerrar menú móvil al hacer clic en un enlace
    const navItems = document.querySelectorAll('.nav-links a');
    
    if (navItems.length > 0 && navLinks) {
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    navLinks.classList.remove('active');
                }
            });
        });
    }

    // Animación para elementos al hacer scroll
    const animateOnScroll = function() {
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
    
    // Ejecutar animación al cargar la página
    animateOnScroll();
    
    // Ejecutar animación al hacer scroll
    window.addEventListener('scroll', animateOnScroll);

    // Formulario de newsletter en el footer
    const footerNewsletterForm = document.querySelector('.footer .newsletter-form');
    
    if (footerNewsletterForm) {
        footerNewsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            
            if (emailInput && emailInput.value.trim()) {
                // Aquí iría la lógica para enviar el formulario a un servidor
                // Por ahora, simulamos una respuesta exitosa
                
                // Crear mensaje de éxito
                const successMessage = document.createElement('div');
                successMessage.className = 'newsletter-success';
                successMessage.textContent = '¡Gracias por suscribirte!';
                successMessage.style.color = '#2ecc71';
                successMessage.style.marginTop = '0.5rem';
                
                // Insertar mensaje después del formulario
                this.appendChild(successMessage);
                
                // Resetear formulario
                this.reset();
                
                // Ocultar mensaje después de 3 segundos
                setTimeout(() => {
                    successMessage.remove();
                }, 3000);
            }
        });
    }

    // Detectar cambios en el tamaño de la ventana para ajustes responsivos
    window.addEventListener('resize', function() {
        // Cerrar menú móvil si la ventana se hace más grande
        if (window.innerWidth > 768 && navLinks && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
        }
    });

    // Smooth scroll para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            if (href !== '#' && !this.classList.contains('toggle-details') && !this.classList.contains('open-modal')) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});
