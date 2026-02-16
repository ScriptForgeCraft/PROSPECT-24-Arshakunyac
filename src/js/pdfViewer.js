


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
            const btn = item.querySelector('button');
            const target = btn || item;

            target.addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                const file = target.dataset.file;
                const title = target.dataset.title;

                if (!file) {
                    console.warn('No file path provided');
                    return;
                }

                this.open(file, title);
            });
        });

        // iOS: download attribute is not supported, use Web Share API instead
        document.querySelectorAll('.doc-download').forEach(link => {
            link.addEventListener('click', (event) => {
                event.stopPropagation();

                if (this.isIOS()) {
                    event.preventDefault();
                    const filename = link.getAttribute('download') || this.getFilenameFromUrl(link.href);
                    this.downloadFileIOS(link.href, filename);
                }
            });
        });

        // Handle download button inside modal on iOS
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
                    // iOS Safari has a built-in PDF viewer — load directly
                    this.iframe.src = filePath;
                } else {
                    // Android and other mobile — use Mozilla pdf.js
                    const fullUrl = this.getFullUrl(filePath);
                    this.iframe.src = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(fullUrl)}`;
                }
            } else {
                this.iframe.src = filePath;
            }

            if (isGoogleDrive) {
                this.downloadLink.style.display = 'none';
            } else {
                this.downloadLink.href = filePath;
                this.downloadLink.style.display = 'inline-flex';
            }

            this.showModal();

        } catch (error) {
            console.error('Error opening PDF:', error);
            this.handleLoadError();
        }
    }

    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        setTimeout(() => {
            this.modal.style.display = 'none';
            this.iframe.src = '';
            this.isOpen = false;
            this.hideLoading();
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
        p.textContent = '\u0553\u0561\u057d\u057f\u0561\u0569\u0578\u0582\u0572\u0569\u0568 \u0579\u056b \u056f\u0561\u0580\u0578\u0572\u0561\u0581\u0565\u056c \u0562\u0565\u057c\u0576\u057e\u0565\u056c';
        const btn = document.createElement('button');
        btn.className = 'retry-btn';
        btn.textContent = '\u053f\u0580\u056f\u056b\u0576 \u0583\u0578\u0580\u0571\u0565\u056c';
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
                // Fallback if Share API not available
                window.open(url, '_blank');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                // AbortError = user cancelled share sheet, not an error
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
