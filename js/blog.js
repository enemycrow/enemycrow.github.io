// JavaScript para la página de Blog y Diario de Creación
document.addEventListener('DOMContentLoaded', function() {

    // Filtrado de entradas de blog
    const filterBtns = document.querySelectorAll('.blog-filter__button');
    const blogPosts = document.querySelectorAll('.blog-post');
    
    if (filterBtns.length > 0 && blogPosts.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remover clase active de todos los botones
                filterBtns.forEach(b => b.classList.remove('active'));
                
                // Añadir clase active al botón clickeado
                this.classList.add('active');
                
                // Obtener el filtro
                const filter = this.getAttribute('data-filter');
                
                // Filtrar los elementos
                blogPosts.forEach(post => {
                    if (filter === 'all') {
                        post.style.display = 'flex';
                    } else {
                        if (post.classList.contains(`blog-post--${filter}`)) {
                            post.style.display = 'flex';
                        } else {
                            post.style.display = 'none';
                        }
                    }
                });
            });
        });
    }

    // Animación para elementos al hacer scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.blog-post, .topic-item');
        
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

    // Formulario de suscripción
    const subscribeForm = document.querySelector('.subscribe-form');
    if (subscribeForm) {
        subscribeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            
            if (email) {
                // Aquí iría la lógica para procesar la suscripción
                alert('¡Gracias por suscribirte! Pronto recibirás noticias sobre nuevas entradas en el diario de creación.');
                this.reset();
            }
        });
    }

    // Paginación
    const pageLinks = document.querySelectorAll('.page-link, .page-next');
    if (pageLinks.length > 0) {
        pageLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remover clase active de todos los enlaces
                document.querySelectorAll('.page-link').forEach(l => {
                    l.classList.remove('active');
                });
                
                // Si es un número de página, añadir clase active
                if (this.classList.contains('page-link')) {
                    this.classList.add('active');
                }
                
                // Aquí iría la lógica para cargar más entradas
                // Por ahora solo es visual
            });
        });
    }
});
