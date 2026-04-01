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

    // ─── Restore Settings from LocalStorage ───
    const savedTheme = localStorage.getItem('prospect24_theme') || 'light';
    const savedSize = localStorage.getItem('prospect24_fontSize') || '1';

    // ─── Theme ───
    const themeBtns = settings.querySelectorAll('[data-theme]');
    const applyTheme = (themeValue, btnElement = null) => {
        themeBtns.forEach(b => b.classList.remove('active'));
        const activeBtn = btnElement || Array.from(themeBtns).find(b => b.dataset.theme === themeValue);
        if (activeBtn) activeBtn.classList.add('active');

        const isDark = themeValue === 'dark';
        document.body.classList.toggle('dark-mode', isDark);
        heroSection?.classList.toggle('dark-mode', isDark);

        localStorage.setItem('prospect24_theme', themeValue);
    };

    applyTheme(savedTheme);

    themeBtns.forEach(btn => {
        btn.onclick = () => {
            applyTheme(btn.dataset.theme, btn);
        };
    });

    // ─── Font size ───
    const sizeBtns = settings.querySelectorAll('[data-size]');
    const applySize = (sizeValue, btnElement = null) => {
        sizeBtns.forEach(b => b.classList.remove('active'));
        const activeBtn = btnElement || Array.from(sizeBtns).find(b => String(b.dataset.size) === String(sizeValue));
        if (activeBtn) activeBtn.classList.add('active');

        document.documentElement.style.setProperty('--font-scale', sizeValue);
        
        localStorage.setItem('prospect24_fontSize', sizeValue);
    };

    applySize(savedSize);

    sizeBtns.forEach(btn => {
        btn.onclick = () => {
            applySize(btn.dataset.size, btn);
        };
    });
});