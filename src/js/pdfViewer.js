function viewPDF(filePath, title) {
    if (!filePath) return;

    const modal = document.getElementById('pdf-modal');
    const iframe = document.getElementById('pdf-frame');
    const titleEl = document.getElementById('modal-title');
    const downloadLink = document.getElementById('download-link');
    const header = document.querySelector(".main-header");

    titleEl.textContent = title || 'Փաստաթուղթ';
    iframe.src = filePath;
    header.classList.add("main-header--hidden");

    const isGoogleDrive = filePath.includes('drive.google.com');
    if (isGoogleDrive) {
        downloadLink.style.display = 'none';
    } else {
        downloadLink.href = filePath;
        downloadLink.style.display = 'inline-block';
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('pdf-modal');
    const iframe = document.getElementById('pdf-frame');
    const header = document.querySelector(".main-header");

    modal.style.display = 'none';
    iframe.src = '';
    document.body.style.overflow = 'auto';
    header.classList.remove("main-header--hidden");
}

document.querySelectorAll('.btn-close').forEach(btn => btn.addEventListener('click', closeModal));
window.addEventListener('click', e => { if (e.target.id === 'pdf-modal') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

document.querySelectorAll('.doc-item').forEach(item => {
    const btn = item.querySelector('button');
    const target = btn || item;

    target.addEventListener('click', event => {
        event.stopPropagation();
        const file = target.dataset.file;
        const title = target.dataset.title;
        if (!file) return;
        viewPDF(file, title);
    });
});

document.querySelectorAll('.doc-download').forEach(link => {
    link.addEventListener('click', event => event.stopPropagation());
});

window.viewPDF = viewPDF;
window.closeModal = closeModal;
