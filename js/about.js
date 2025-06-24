// JavaScript para la página "Sobre Mí"
document.addEventListener('DOMContentLoaded', function() {

    // Tabs para cambiar entre vistas
    const tabBtns = document.querySelectorAll('.voice-tab');
    const sections = document.querySelectorAll('.voice-view');
    
    if (tabBtns.length > 0 && sections.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remover clase active de todos los botones
                tabBtns.forEach(b => b.classList.remove('active'));
                
                // Añadir clase active al botón clickeado
                this.classList.add('active');
                
                // Obtener el target
                const target = this.getAttribute('data-target');
                
                // Ocultar todas las secciones excepto el target
                sections.forEach(section => {
                    if (section.id !== target) {
                        section.classList.add('hidden');
                    }
                });

                // Mostrar la sección correspondiente (solo si estaba oculta)
                const targetSection = document.getElementById(target);
                if (targetSection.classList.contains('hidden')) {
                    targetSection.classList.remove('hidden');
                });
        });
    }
});
