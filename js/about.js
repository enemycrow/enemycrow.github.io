// JavaScript para la página "Sobre Mí"
document.addEventListener('DOMContentLoaded', function() {

    // Tabs para cambiar entre vistas
    const tabBtns = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.about-section');
    
    if (tabBtns.length > 0 && sections.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remover clase active de todos los botones
                tabBtns.forEach(b => b.classList.remove('active'));
                
                // Añadir clase active al botón clickeado
                this.classList.add('active');
                
                // Obtener el target
                const target = this.getAttribute('data-target');
                
                // Ocultar todas las secciones
                sections.forEach(section => {
                    section.classList.add('hidden');
                });
                
                // Mostrar la sección correspondiente
                document.getElementById(target).classList.remove('hidden');
            });
        });
    }
});
