// JavaScript para la página de Obras y Portafolio
document.addEventListener('DOMContentLoaded', function() {

    // Filtrado de obras
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item--featured, .portfolio-item--catalog');
    
    if (filterBtns.length > 0 && portfolioItems.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remover clase active de todos los botones
                filterBtns.forEach(b => b.classList.remove('active'));
                
                // Añadir clase active al botón clickeado
                this.classList.add('active');
                
                // Obtener el filtro
                const filter = this.getAttribute('data-filter');
                
                // Filtrar los elementos
                portfolioItems.forEach(item => {
                    if (filter === 'all') {
                        item.style.display = 'block';
                    } else {
                        if (item.classList.contains(filter)) {
                            item.style.display = 'block';
                        } else {
                            item.style.display = 'none';
                        }
                    }
                });
            });
        });
    }

    // Modales
    const modalLinks = document.querySelectorAll('.open-modal');
    
    if (modalLinks.length > 0) {
        modalLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Obtener el ID del modal
                const modalId = this.getAttribute('href').substring(1);

                // Mostrar el modal y configurar banners
                const modal = document.getElementById(modalId);
                if (modal) {
                    const banners = modal.querySelectorAll('.modal-banner');
                    const baseName = modalId.replace('-modal', '');
                    banners.forEach(banner => {
                        const side = banner.classList.contains('modal-banner-left') ? 'left' : 'right';
                        const img = banner.getAttribute('data-image') ||
                            `assets/images/banners/${baseName}-${side}.webp`;
                        banner.style.backgroundImage = `url(${img})`;
                    });

                    modal.style.display = 'block';
                    document.body.style.overflow = 'hidden'; // Prevenir scroll
                }
            });
        });
        
        // Cerrar modales
        const closeButtons = document.querySelectorAll('.close-modal');
        
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto'; // Restaurar scroll
                }
            });
        });
        
        // Cerrar modal al hacer clic fuera del contenido
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.style.display = 'none';
                    document.body.style.overflow = 'auto'; // Restaurar scroll
                }
            });
        });
        
        // Cerrar modal con tecla ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                modals.forEach(modal => {
                    if (modal.style.display === 'block') {
                        modal.style.display = 'none';
                        document.body.style.overflow = 'auto'; // Restaurar scroll
                    }
                });
            }
        });
    }

    // Animación para elementos al hacer scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.portfolio-item--featured, .portfolio-item--catalog, .symbolic-item, .upcoming-project');
        
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
});
