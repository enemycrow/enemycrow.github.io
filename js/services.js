// JavaScript para la página de Servicios Creativos
document.addEventListener('DOMContentLoaded', function() {

    // Toggle detalles de servicios
    const toggleButtons = document.querySelectorAll('.toggle-details');
    
    if (toggleButtons.length > 0) {
        toggleButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const serviceItem = this.closest('.service-item');
                const serviceDetails = serviceItem.querySelector('.service-item__details');
                
                if (serviceDetails.style.display === 'block') {
                    serviceDetails.style.display = 'none';
                    this.textContent = 'Ver Detalles';
                } else {
                    serviceDetails.style.display = 'block';
                    this.textContent = 'Ocultar Detalles';
                }
            });
        });
    }

    // Slider de testimonios
    const testimonialItems = document.querySelectorAll('.testimonial-item');
    const indicators = document.querySelectorAll('.indicator');
    const prevButton = document.querySelector('.control-prev');
    const nextButton = document.querySelector('.control-next');
    
    if (testimonialItems.length > 0 && indicators.length > 0) {
        let currentIndex = 0;
        
        // Función para mostrar un testimonio específico
        const showTestimonial = (index) => {
            // Ocultar todos los testimonios
            testimonialItems.forEach(item => {
                item.style.display = 'none';
            });
            
            // Remover clase active de todos los indicadores
            indicators.forEach(indicator => {
                indicator.classList.remove('active');
            });
            
            // Mostrar el testimonio actual
            testimonialItems[index].style.display = 'block';
            
            // Activar el indicador correspondiente
            indicators[index].classList.add('active');
        };
        
        // Mostrar el primer testimonio
        showTestimonial(currentIndex);
        
        // Event listeners para los botones de navegación
        if (prevButton && nextButton) {
            prevButton.addEventListener('click', () => {
                currentIndex = (currentIndex === 0) ? testimonialItems.length - 1 : currentIndex - 1;
                showTestimonial(currentIndex);
            });
            
            nextButton.addEventListener('click', () => {
                currentIndex = (currentIndex === testimonialItems.length - 1) ? 0 : currentIndex + 1;
                showTestimonial(currentIndex);
            });
        }
        
        // Event listeners para los indicadores
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentIndex = index;
                showTestimonial(currentIndex);
            });
        });
    }

    // Acordeón de FAQ
    const faqQuestions = document.querySelectorAll('.faq__question');
    
    if (faqQuestions.length > 0) {
        faqQuestions.forEach(question => {
            question.addEventListener('click', function() {
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
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.service-item, .timeline-item, .testimonial-item, .faq__item');
        
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

    // Smooth scroll para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.getAttribute('href') !== '#' && !this.classList.contains('toggle-details')) {
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
