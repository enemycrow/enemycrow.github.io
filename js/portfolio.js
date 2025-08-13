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

                const worksSection = document.querySelector('.featured-works');
                if (worksSection) {
                    worksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
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
                    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
                    const smallPortrait = isPortrait && window.matchMedia('(max-width: 600px)').matches;
                    const smallLandscape = !isPortrait && window.matchMedia('(max-width: 500px)').matches;

                    banners.forEach(banner => {
                        const side = banner.classList.contains('modal-banner-left') ? 'left' : 'right';
                        const dataImg = banner.getAttribute('data-image');
                        const basePath = dataImg ? dataImg.replace(/\.[^/.]+$/, '') :
                            `assets/images/banners/${baseName}-${side}`;
                        const responsiveBase = basePath.replace('/banners/', '/responsive/banners/');
                        const dpr = window.devicePixelRatio || 1;

                        const img400 = `${responsiveBase}-400.webp`;
                        const img800 = `${responsiveBase}-800.webp`;
                        const img1200 = `${responsiveBase}-1200.webp`;
                        const imgOriginal = `${basePath}.webp`;

                        let imgPath = imgOriginal;
                        let imgSet = `image-set(url(${img400}) 1x, url(${img800}) 2x)`;

                        if (smallPortrait) {
                            imgPath = dpr > 1 ? img800 : img400;
                            imgSet = `image-set(url(${img400}) 1x, url(${img800}) 2x)`;
                        } else if (smallLandscape) {
                            imgPath = dpr > 1 ? img1200 : img800;
                            imgSet = `image-set(url(${img800}) 1x, url(${img1200}) 2x)`;
                        } else {
                            imgPath = dpr > 1 ? imgOriginal : img1200;
                            imgSet = `image-set(url(${img1200}) 1x, url(${imgOriginal}) 2x)`;
                        }

                        const testImg = new Image();
                        testImg.src = imgPath;
                        testImg.onload = () => {
                            const supportsImageSet = CSS.supports('background-image', imgSet);
                            banner.style.backgroundImage = supportsImageSet ? imgSet : `url(${imgPath})`;
                        };
                        testImg.onerror = () => {
                            banner.style.backgroundImage = `url(${imgOriginal})`;
                        };
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
