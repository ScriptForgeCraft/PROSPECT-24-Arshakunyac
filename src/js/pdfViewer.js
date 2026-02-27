class PDFModal {
    constructor() {
        this.modal = document.getElementById('pdf-modal');
        this.iframe = document.getElementById('pdf-frame');
        this.titleEl = document.getElementById('modal-title');
        this.downloadLink = document.getElementById('download-link');
        this.modalBody = document.querySelector('.modal-body');

        this.isOpen = false;
        this.init();
    }

    init() {
        this.attachEventListeners();
        const row = document.querySelector('.doc-row-all');
        if (row) {
            row.querySelector('svg')?.addEventListener('click', () => {
                row.querySelector('.btn-download-all')?.click();
            });
        }
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    isTabletDevice() {
        return /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent);
    }

    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    attachEventListeners() {
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.close();
            });
        });
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        document.querySelectorAll('.doc-item').forEach(item => {
            item.addEventListener('click', (event) => {
                if (event.target.closest('.doc-download')) return;

                event.stopPropagation();
                event.preventDefault();

                const button = item.querySelector('button[data-file]');

                const dataFiles = button?.dataset.files || item.dataset.files;
                const dataFile = button?.dataset.file || item.dataset.file;
                const dataTitle = button?.dataset.title || item.dataset.title || 'Փաստաթուղթ';

                if (dataFiles) {
                    try {
                        const files = JSON.parse(dataFiles);
                        this.openMultiple(files, dataTitle);
                    } catch (e) {
                        console.error('Error parsing data-files:', e);
                    }
                } else if (dataFile) {
                    this.open(dataFile, dataTitle);
                } else {
                    console.warn('No file path provided');
                }
            });
        });

        document.querySelectorAll('.doc-download').forEach(link => {
            link.addEventListener('click', (event) => {
                event.stopPropagation();
                const loadingSvg = link.querySelector('svg');
                loadingSvg.classList.add('loading');
                setTimeout(() => loadingSvg.classList.remove('loading'), 500);
                if (this.isIOS()) {
                    event.preventDefault();
                    const filename = link.getAttribute('download') || this.getFilenameFromUrl(link.href);
                    this.downloadFileIOS(link.href, filename);
                }
            });
        });

        if (this.downloadLink) {
            this.downloadLink.addEventListener('click', (event) => {
                if (this.isIOS()) {
                    event.preventDefault();
                    event.stopPropagation();
                    const filename = this.getFilenameFromUrl(this.downloadLink.href);
                    this.downloadFileIOS(this.downloadLink.href, filename);
                }
            });
        }

        this.iframe.addEventListener('load', () => {
            this.hideLoading();
        });
        this.iframe.addEventListener('error', () => {
            this.handleLoadError();
        });
    }

    open(filePath, title = 'Փաստաթուղթ') {
        if (!filePath) {
            console.error('File path is required');
            return;
        }

        try {
            this.titleEl.textContent = title;
            this.showLoading();

            const isGoogleDrive = filePath.includes('drive.google.com');
            const isMobile = this.isMobileDevice();
            const isTablet = this.isTabletDevice();

            if ((isMobile || isTablet) && !isGoogleDrive) {
                if (this.isIOS()) {
                    this.iframe.src = encodeURI(filePath);
                } else {
                    const fullUrl = this.getFullUrl(filePath);
                    this.iframe.src = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(fullUrl)}`;
                }
            } else {
                this.iframe.src = encodeURI(filePath);
            }


            if (isGoogleDrive) {
                const previewUrl = filePath;

                const match = previewUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);

                if (match) {
                    const fileId = match[1];
                    const downloadUrl = `https://drive.usercontent.google.com/u/0/uc?id=${fileId}&export=download`;
                    this.downloadLink.href = downloadUrl;

                } else {
                    console.log("Не удалось найти ID файла");
                    return;
                }

            } else {
                this.downloadLink.href = filePath;
            }
            this.downloadLink.style.display = 'inline-flex';

            this.showModal();

        } catch (error) {
            console.error('Error opening PDF:', error);
            this.handleLoadError();
        }
    }

    loadFile(filePath) {
        this.showLoading();

        const existingError = this.modalBody.querySelector('.pdf-error-message');
        if (existingError) existingError.remove();

        const isGoogleDrive = filePath.includes('drive.google.com');
        const isMobile = this.isMobileDevice();
        const isTablet = this.isTabletDevice();

        if ((isMobile || isTablet) && !isGoogleDrive) {
            if (this.isIOS()) {
                this.iframe.src = encodeURI(filePath);
            } else {
                const fullUrl = this.getFullUrl(filePath);
                this.iframe.src = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(fullUrl)}`;
            }
        } else {
            this.iframe.src = encodeURI(filePath);
        }

        if (isGoogleDrive) {
            this.downloadLink.style.display = 'none';
        } else {
            this.downloadLink.href = filePath;
            this.downloadLink.style.display = 'inline-flex';
        }
    }

    openMultiple(files, groupTitle = 'Փաստաթուղթ') {
        if (!files || files.length === 0) return;

        this.titleEl.textContent = groupTitle;

        const tabsEl = document.getElementById('modal-tabs');

        if (files.length > 1 && tabsEl) {
            tabsEl.style.display = 'flex';
            tabsEl.innerHTML = '';

            files.forEach((f, i) => {
                const tab = document.createElement('button');
                tab.className = 'modal-tab' + (i === 0 ? ' active' : '');
                tab.textContent = f.title || `Փաստաթուղթ ${i + 1}`;
                tab.addEventListener('click', () => {
                    tabsEl.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    this.loadFile(f.file);
                });
                tabsEl.appendChild(tab);
            });
        } else if (tabsEl) {
            tabsEl.style.display = 'none';
        }

        this.open(files[0].file, groupTitle);
    }

    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        setTimeout(() => {
            this.modal.style.display = 'none';
            this.iframe.src = '';
            this.isOpen = false;
            this.hideLoading();

            const tabsEl = document.getElementById('modal-tabs');
            if (tabsEl) {
                tabsEl.style.display = 'none';
                tabsEl.innerHTML = '';
            }
        }, 300);
    }

    showModal() {
        this.modal.style.display = 'block';
        this.modal.offsetHeight;
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
            this.modal.classList.add('active');
        });

        this.isOpen = true;
    }

    showLoading() {
        if (this.modalBody) {
            this.modalBody.classList.add('loading');
        }
    }

    hideLoading() {
        if (this.modalBody) {
            this.modalBody.classList.remove('loading');
        }
    }

    handleLoadError() {
        this.hideLoading();

        const existingError = this.modalBody.querySelector('.pdf-error-message');
        if (existingError) return;

        const errorMsg = document.createElement('div');
        errorMsg.className = 'pdf-error-message';
        const p = document.createElement('p');
        p.textContent = "Փաստաթուղթը չհաջողվեց բեռնել։";
        const btn = document.createElement('button');
        btn.className = 'retry-btn';
        btn.textContent = "Խնդրում ենք նորից փորձեք։";
        btn.onclick = () => location.reload();
        errorMsg.appendChild(p);
        errorMsg.appendChild(btn);
        this.modalBody.appendChild(errorMsg);
    }

    async downloadFileIOS(url, filename) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const file = new File([blob], filename, { type: blob.type || 'application/pdf' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file] });
            } else {
                window.open(url, '_blank');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                window.open(url, '_blank');
            }
        }
    }

    getFilenameFromUrl(url) {
        try {
            const path = new URL(url, window.location.origin).pathname;
            return decodeURIComponent(path.split('/').pop()) || 'document.pdf';
        } catch {
            return 'document.pdf';
        }
    }

    getFullUrl(path) {
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        return window.location.origin + path;
    }
}


let pdfModal;

document.addEventListener('DOMContentLoaded', () => {
    pdfModal = new PDFModal();
});

window.viewPDF = (filePath, title) => {
    if (pdfModal) {
        pdfModal.open(filePath, title);
    }
};

window.closeModal = () => {
    if (pdfModal) {
        pdfModal.close();
    }
};


function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

