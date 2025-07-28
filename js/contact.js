// JavaScript para la página de Contacto y Newsletter
// Utiliza la instancia global `db` expuesta en firebase-init.js
const { FieldValue } = firebase.firestore;

document.addEventListener('DOMContentLoaded', function() {

    // Formulario de contacto
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (!validateForm(this)) {
                const errorMessage = document.createElement('div');
                errorMessage.className = 'contact-form__message contact-form__message--error';
                errorMessage.textContent = 'Por favor, completa todos los campos requeridos correctamente.';
                this.parentNode.insertBefore(errorMessage, this);
                errorMessage.style.display = 'block';
                setTimeout(() => {
                    errorMessage.style.display = 'none';
                    setTimeout(() => {
                        errorMessage.remove();
                    }, 500);
                }, 5000);
                return;
            }

            const formData = new FormData(this);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject'),
                voice: formData.get('voice'),
                message: formData.get('message'),
                wantsNewsletter: formData.get('newsletter') !== null,
                timestamp: FieldValue.serverTimestamp()
            };

            try {
                await addDoc(collection(db, 'mensajes_contacto'), data);
                if (data.wantsNewsletter) {
                    await addDoc(collection(db, 'suscriptores_newsletter'), {
                        name: data.name,
                        email: data.email,
                        lauren: true,
                        elysia: true,
                        sahir: true,
                        timestamp: FieldValue.serverTimestamp()
                    });
                }

                const successMessage = document.createElement('div');
                successMessage.className = 'contact-form__message contact-form__message--success';
                successMessage.textContent = '¡Mensaje enviado con éxito! Te responderemos lo antes posible.';
                contactForm.parentNode.insertBefore(successMessage, contactForm);
                successMessage.style.display = 'block';
                contactForm.reset();
                setTimeout(() => {
                    successMessage.style.display = 'none';
                    setTimeout(() => {
                        successMessage.remove();
                    }, 500);
                }, 5000);
            } catch (err) {
                console.error('Error al guardar el mensaje', err);
                const errorMessage = document.createElement('div');
                errorMessage.className = 'contact-form__message contact-form__message--error';
                errorMessage.textContent = 'Ha ocurrido un error. Intenta nuevamente más tarde.';
                this.parentNode.insertBefore(errorMessage, this);
                errorMessage.style.display = 'block';
                setTimeout(() => {
                    errorMessage.style.display = 'none';
                    setTimeout(() => {
                        errorMessage.remove();
                    }, 500);
                }, 5000);
            }
        });
    }

    // Formulario de newsletter
    const newsletterForm = document.getElementById('newsletterForm');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (!validateForm(this)) {
                const errorMessage = document.createElement('div');
                errorMessage.className = 'newsletter__message newsletter__message--error';
                errorMessage.textContent = 'Por favor, completa todos los campos requeridos correctamente.';
                this.parentNode.insertBefore(errorMessage, this);
                errorMessage.style.display = 'block';
                setTimeout(() => {
                    errorMessage.style.display = 'none';
                    setTimeout(() => {
                        errorMessage.remove();
                    }, 500);
                }, 5000);
                return;
            }

            const formData = new FormData(this);
            const data = {
                name: formData.get('nl-name'),
                email: formData.get('nl-email'),
                lauren: formData.get('nl-lauren') !== null,
                elysia: formData.get('nl-elysia') !== null,
                sahir: formData.get('nl-sahir') !== null,
                timestamp: FieldValue.serverTimestamp()
            };

            try {
                await addDoc(collection(db, 'suscriptores_newsletter'), data);

                const successMessage = document.createElement('div');
                successMessage.className = 'newsletter__message newsletter__message-success';
                successMessage.textContent = '¡Gracias por suscribirte! Pronto recibirás tu primer newsletter.';
                newsletterForm.parentNode.insertBefore(successMessage, newsletterForm);
                successMessage.style.display = 'block';
                newsletterForm.reset();
                setTimeout(() => {
                    successMessage.style.display = 'none';
                    setTimeout(() => {
                        successMessage.remove();
                    }, 500);
                }, 5000);
            } catch (err) {
                console.error('Error al guardar la suscripción', err);
                const errorMessage = document.createElement('div');
                errorMessage.className = 'newsletter__message newsletter__message--error';
                errorMessage.textContent = 'Ha ocurrido un error. Intenta nuevamente más tarde.';
                this.parentNode.insertBefore(errorMessage, this);
                errorMessage.style.display = 'block';
                setTimeout(() => {
                    errorMessage.style.display = 'none';
                    setTimeout(() => {
                        errorMessage.remove();
                    }, 500);
                }, 5000);
            }
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
