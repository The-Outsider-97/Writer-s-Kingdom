(() => {
    document.querySelectorAll('.structure-item').forEach((item, index) => {
        item.setAttribute('data-structure-index', String(index + 1));
    });
})();
