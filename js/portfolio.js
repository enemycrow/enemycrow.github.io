// JavaScript para la página de Obras y Portafolio

function setupModalBanners(modal) {
    const banners = modal.querySelectorAll('.modal-banner');
    const baseName = modal.id.replace('-modal', '');
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
        testImg.onload = () => {
            const supportsImageSet = CSS.supports('background-image', imgSet);
            banner.style.backgroundImage = supportsImageSet ? imgSet : `url(${imgPath})`;
        };
        testImg.onerror = () => {
            banner.style.backgroundImage = `url(${imgOriginal})`;
        };
        testImg.src = imgPath;
    });
}

const MODAL_SLUGS = {
    jesuita: 'el-jesuita-del-vino',
    abismos: 'entre-amores-y-abismos',
    galactique: 'galactique',
    martillo: 'hijas-del-martillo',
    izel: 'izel-itzel',
    huevovolvio: 'el-huevo-que-volvio-a-cantar',
    dilacion: 'efecto-dilacion-temporal',
    fusion: 'el-libro-de-la-fusion',
    cristalito: 'cristalito-el-potrillo-de-cristal',
    tarot: 'tarot-del-cuervo-y-elysia',
    linaje: 'el-linaje-de-los-seis-petalos',
    traverso: 'los-traverso',
    veus: 'el-mundo-de-los-veus',
    divinidades: 'la-reversion-de-las-divinidades',
    circulo: 'circulo-en-la-arena',
    debacle: 'debacle-triangular',
    bribones: 'la-reina-de-los-bribones'
};

async function loadModal(slug, id = slug) {
    try {
        const response = await fetch(`/portfolio/${slug}.html`);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const modal = doc.getElementById(`${id}-modal`) || doc.querySelector('.modal');
        if (!modal) return;

        const existing = document.getElementById(modal.id);
        if (existing) existing.remove();

        document.body.appendChild(modal);
        setupModalBanners(modal);
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        const closeModal = () => {
            modal.remove();
            document.body.style.overflow = 'auto';
            document.removeEventListener('keydown', escHandler);
        };

        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };

        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('.close-modal')) {
                closeModal();
            }
        });

        document.addEventListener('keydown', escHandler);
    } catch (err) {
        console.error('Error loading modal', err);
    }
}

document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.open-modal');
    if (trigger) {
        e.preventDefault();
        const modalId = trigger.getAttribute('href').replace('#', '');
        const id = modalId.replace('-modal', '');
        const slug = MODAL_SLUGS[id] || id;
        loadModal(slug, id);
    }
});

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
