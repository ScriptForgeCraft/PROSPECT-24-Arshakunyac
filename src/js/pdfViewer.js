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

    isIOSDevice() {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    isTabletDevice() {
        return /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent);
    }

    attachEventListeners() {
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', () => this.close());
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
                const file = target.dataset.file;
                const title = target.dataset.title;

                if (!file) {
                    console.warn('No file path provided');
                    return;
                }

                this.open(file, title);
            });
        });

        document.querySelectorAll('.doc-download').forEach(link => {
            link.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        });

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
            const isIOS = this.isIOSDevice();
            const isMobile = this.isMobileDevice();
            const isTablet = this.isTabletDevice();

            // Для iOS - используем PDF.js
            if (isIOS && !isGoogleDrive) {
                const fullUrl = this.getFullUrl(filePath);
                // Используем PDF.js для iOS
                this.iframe.src = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(fullUrl)}`;
                
                // Для iOS добавляем атрибуты для лучшей совместимости
                this.iframe.setAttribute('allowfullscreen', '');
                this.iframe.setAttribute('webkitallowfullscreen', '');
            } 
            // Для Android и планшетов
            else if ((isMobile || isTablet) && !isGoogleDrive) {
                const fullUrl = this.getFullUrl(filePath);
                this.iframe.src = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(fullUrl)}`;
            } 
            // Для десктопа и Google Drive
            else {
                this.iframe.src = filePath;
            }

            // Настройка кнопки скачивания
            if (isGoogleDrive) {
                this.downloadLink.style.display = 'none';
            } else {
                this.downloadLink.href = filePath;
                this.downloadLink.download = title || 'document.pdf';
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
            
            // Удаляем сообщение об ошибке если есть
            const errorMsg = this.modalBody.querySelector('.pdf-error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        }, 300);
    }

    showModal() {
        this.modal.style.display = 'block';
        this.modal.offsetHeight; // Force reflow
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
        errorMsg.innerHTML = `
            <p>Փաստաթուղթը չի կարողացել բեռնվել</p>
            <button class="retry-btn" onclick="location.reload()">Կրկին փորձել</button>
        `;
        this.modalBody.appendChild(errorMsg);
    }

    getFullUrl(path) {
        // Если уже полный URL
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        
        // Добавляем / в начало если нет
        const normalizedPath = path.startsWith('/') ? path : '/' + path;
        return window.location.origin + normalizedPath;
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