document.addEventListener('DOMContentLoaded', () => {
    const settings = document.querySelector('.settings');
    const toggle = settings.querySelector('.settings__toggle');

    const heroSection = document.querySelector('.hero-section');

    toggle.onclick = (e) => {
        e.stopPropagation();
        settings.classList.toggle('is-open');
    };



    document.addEventListener('click', (e) => {
        if (!settings.contains(e.target)) {
            settings.classList.remove('is-open');
        }
    });

    // ─── Theme ───
    const themeBtns = settings.querySelectorAll('[data-theme]');
    themeBtns.forEach(btn => {
        btn.onclick = () => {
            themeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const isDark = btn.dataset.theme === 'dark';
            document.body.classList.toggle('dark-mode', isDark);
            heroSection?.classList.toggle('dark-mode', isDark);
        };
    });

    // ─── Font size ───
    const sizeBtns = settings.querySelectorAll('[data-size]');
    sizeBtns.forEach(btn => {
        btn.onclick = () => {
            sizeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.documentElement.style.setProperty('--font-scale', btn.dataset.size);
        };
    });
});