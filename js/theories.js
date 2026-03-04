(() => {
    const cards = document.querySelectorAll('.info-card');
    cards.forEach((card) => {
        card.addEventListener('click', () => card.classList.toggle('expanded'));
    });
})();