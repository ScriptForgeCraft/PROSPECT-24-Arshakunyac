function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function copyText(text, msg) {
    navigator.clipboard.writeText(text).then(() => showToast(msg));
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = '✓ ' + msg;
    if (t.classList.contains('show')) return;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 800);
}

const contacts = document.querySelectorAll('.contact-value');

contacts.forEach(span => {
    const number = span.dataset.number;
    const text = span.dataset.text || number;

    span.addEventListener('click', () => {
        if (number && isMobileDevice()) {
            window.location.href = `tel:${number}`;
        } else {
            copyText(text, 'Պատճենված');
        }
    });

    span.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (number && isMobileDevice()) {
                window.location.href = `tel:${number}`;
            } else {
                copyText(text, 'Պատճենված');
            }
        }
    });
});