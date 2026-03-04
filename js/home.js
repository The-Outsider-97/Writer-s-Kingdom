(() => {
    const stat = document.getElementById('todayDate');
    if (stat) {
        stat.textContent = new Date().toLocaleDateString(undefined, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
})();