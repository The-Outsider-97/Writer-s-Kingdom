(() => {
    const storageKey = 'writers-kingdom-theme';
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');

    function resolveTheme() {
        const saved = localStorage.getItem(storageKey);
        if (saved === 'light' || saved === 'dark') return saved;
        return media.matches ? 'dark' : 'light';
    }

    function applyTheme(theme, persist = false) {
        document.body.dataset.theme = theme;
        toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        toggle.innerHTML = theme === 'dark'
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
        if (persist) {
            localStorage.setItem(storageKey, theme);
        }
    }

    applyTheme(resolveTheme());

    toggle.addEventListener('click', () => {
        const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(next, true);
    });

    media.addEventListener('change', (event) => {
        if (!localStorage.getItem(storageKey)) {
            applyTheme(event.matches ? 'dark' : 'light');
        }
    });
})();