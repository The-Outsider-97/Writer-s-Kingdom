(() => {
    const links = document.querySelectorAll('.main-nav a');
    const page = document.body.dataset.page;
    links.forEach((link) => {
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
})();
