// JavaScript para la página de donaciones

document.addEventListener('DOMContentLoaded', function() {
    const stories = [
        'El amanecer pintaba de dorado la ciudad cuando una pluma encontró el viento.',
        'En la esquina del faro, un viejo marinero relataba secretos que sólo el mar conoce.',
        'La llama danzaba silenciosa, guardando en su fuego los sueños de la noche.'
    ];

    const container = document.getElementById('random-story');
    if (container) {
        const story = stories[Math.floor(Math.random() * stories.length)];
        container.innerHTML = `
            <article>
                <p>${story}</p>
                <p class="license">
                    <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" target="_blank" rel="noopener">
                        <img src="assets/cc/cc.svg" alt="Creative Commons" />
                        <img src="assets/cc/by.svg" alt="Atribución" />
                        <img src="assets/cc/nc.svg" alt="No comercial" />
                        <img src="assets/cc/nd.svg" alt="Sin derivadas" />
                        Esta obra está bajo una Licencia Creative Commons Atribución-NoComercial-SinDerivadas 4.0 Internacional
                    </a>
                </p>
            </article>`;
    }
});
