document.addEventListener('DOMContentLoaded', function() {
    const entry = document.querySelector('.blog-entry');
    if (entry) {
        const author = entry.getAttribute('data-author');
        if (author) {
            entry.classList.add(`blog-entry--${author}`);
        }
    }
});
