function copyText(text, msg) {
    navigator.clipboard.writeText(text).then(() => showToast(msg));
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = '✓ ' + msg;
    if (t.classList.contains('show')) {
        return;
    }
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 800);
}

window.copyText = copyText;
window.showToast = showToast;