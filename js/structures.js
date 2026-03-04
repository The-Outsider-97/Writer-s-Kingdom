(() => {
    document.querySelectorAll('.structure-item').forEach((item, index) => {
        item.querySelector('.muted').textContent += ` • Reference ${index + 1}`;
    });
})();