// JavaScript para la página de Contacto y Newsletter
document.addEventListener('DOMContentLoaded', function() {

    // Formulario de contacto
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Aquí iría la lógica para enviar el formulario a un servidor
            // Por ahora, simulamos una respuesta exitosa
            
            // Crear mensaje de éxito
            const successMessage = document.createElement('div');
            successMessage.className = 'form-message success';
            successMessage.textContent = '¡Mensaje enviado con éxito! Te responderemos lo antes posible.';
            
            // Insertar mensaje antes del formulario
            contactForm.parentNode.insertBefore(successMessage, contactForm);
            
            // Mostrar mensaje
            successMessage.style.display = 'block';
            
            // Resetear formulario
            contactForm.reset();
            
            // Ocultar mensaje después de 5 segundos
            setTimeout(() => {
                successMessage.style.display = 'none';
                setTimeout(() => {
                    successMessage.remove();
                }, 500);
            }, 5000);
        });
    }

    // Formulario de newsletter
    const newsletterForm = document.getElementById('newsletterForm');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Aquí iría la lógica para enviar el formulario a un servidor
            // Por ahora, simulamos una respuesta exitosa
            
            // Crear mensaje de éxito
            const successMessage = document.createElement('div');
            successMessage.className = 'form-message success';
            successMessage.textContent = '¡Gracias por suscribirte! Pronto recibirás tu primer newsletter.';
            
            // Insertar mensaje antes del formulario
            newsletterForm.parentNode.insertBefore(successMessage, newsletterForm);
            
            // Mostrar mensaje
            successMessage.style.display = 'block';
            
            // Resetear formulario
            newsletterForm.reset();
            
            // Ocultar mensaje después de 5 segundos
            setTimeout(() => {
                successMessage.style.display = 'none';
                setTimeout(() => {
                    successMessage.remove();
                }, 500);
            }, 5000);
        });
    }

    // Acordeón de FAQ
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    if (faqQuestions.length > 0) {
        faqQuestions.forEach(question => {
            question.addEventListener('click', function() {
                const faqItem = this.parentElement;
                
                // Toggle clase active en el item actual
                faqItem.classList.toggle('active');
                
                // Cerrar otros items si están abiertos
                document.querySelectorAll('.faq-item').forEach(item => {
                    if (item !== faqItem && item.classList.contains('active')) {
                        item.classList.remove('active');
                    }
                });
            });
        });
    }

    // Animación para elementos al hacer scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.contact-method, .feature, .faq-item');
        
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
    
    // Aplicar validación a ambos formularios
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
                
                // Crear mensaje de error
                const errorMessage = document.createElement('div');
                errorMessage.className = 'form-message error';
                errorMessage.textContent = 'Por favor, completa todos los campos requeridos correctamente.';
                
                // Insertar mensaje antes del formulario
                this.parentNode.insertBefore(errorMessage, this);
                
                // Mostrar mensaje
                errorMessage.style.display = 'block';
                
                // Ocultar mensaje después de 5 segundos
                setTimeout(() => {
                    errorMessage.style.display = 'none';
                    setTimeout(() => {
                        errorMessage.remove();
                    }, 500);
                }, 5000);
            }
        });
    }
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
                
                // Crear mensaje de error
                const errorMessage = document.createElement('div');
                errorMessage.className = 'form-message error';
                errorMessage.textContent = 'Por favor, completa todos los campos requeridos correctamente.';
                
                // Insertar mensaje antes del formulario
                this.parentNode.insertBefore(errorMessage, this);
                
                // Mostrar mensaje
                errorMessage.style.display = 'block';
                
                // Ocultar mensaje después de 5 segundos
                setTimeout(() => {
                    errorMessage.style.display = 'none';
                    setTimeout(() => {
                        errorMessage.remove();
                    }, 500);
                }, 5000);
            }
        });
    }
});
