// JavaScript para la página "Sobre Mí"
document.addEventListener('DOMContentLoaded', function() {

    const tabBtns = document.querySelectorAll('.voice-tab');
    const sections = document.querySelectorAll('section.voice-view');

    if (tabBtns.length > 0 && sections.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const target = this.getAttribute('data-target');

                // Remover clase active de todos los botones
                tabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                // Ocultar todas las secciones
                sections.forEach(section => {
                    section.classList.add('hidden');
                });

                // Mostrar la sección seleccionada
                const targetSection = document.getElementById(target);
                if (targetSection) {
                    targetSection.classList.remove('hidden');
                }
            });
        });
    }
});

