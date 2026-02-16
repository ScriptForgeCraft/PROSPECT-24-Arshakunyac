class PDFModal {
    constructor() {
        this.modal = document.getElementById('pdf-modal');
        this.iframe = document.getElementById('pdf-frame');
        this.titleEl = document.getElementById('modal-title');
        this.downloadLink = document.getElementById('download-link');
        this.modalBody = document.querySelector('.modal-body');

        this.isOpen = false;
        this.currentFilePath = null;
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

    isAndroid() {
        return /Android/i.test(navigator.userAgent);
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
                e.preventDefault();
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
                event.preventDefault();
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

        this.downloadLink.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.downloadPDF();
        });

        this.iframe.addEventListener('load', () => {
            this.hideLoading();
        });
        
        this.iframe.addEventListener('error', () => {
            console.log('Iframe load error detected');
            this.tryFallbackViewer();
        });
    }

    downloadPDF() {
        if (!this.currentFilePath) {
            console.error('No file to download');
            return;
        }

        const fullUrl = this.getFullUrl(this.currentFilePath);
        const isIOS = this.isIOSDevice();

        // Для iOS - просто открываем в новой вкладке
        // iOS Safari не поддерживает программное скачивание
        if (isIOS) {
            window.open(fullUrl, '_blank', 'noopener,noreferrer');
            return;
        }

        // Для Android и Desktop - используем простой download атрибут
        // Это самый надежный способ
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = this.getFileName();
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // Удаляем ссылку после небольшой задержки
        setTimeout(() => {
            document.body.removeChild(link);
        }, 100);
    }

    getFileName() {
        // Получаем имя файла из title или из пути
        if (this.titleEl && this.titleEl.textContent) {
            return this.titleEl.textContent + '.pdf';
        }
        
        // Пробуем получить из пути
        if (this.currentFilePath) {
            const parts = this.currentFilePath.split('/');
            const fileName = parts[parts.length - 1];
            if (fileName && fileName.endsWith('.pdf')) {
                return fileName;
            }
        }
        
        return 'document.pdf';
    }

    createPDFObject(url) {
        const obj = document.createElement('object');
        obj.data = url;
        obj.type = 'application/pdf';
        obj.style.width = '100%';
        obj.style.height = '100%';
        
        const fallbackText = document.createElement('p');
        fallbackText.style.padding = '20px';
        fallbackText.style.textAlign = 'center';
        fallbackText.innerHTML = `
            Ваш браузер не поддерживает просмотр PDF.<br>
            <a href="${url}" target="_blank" style="color: #007bff; text-decoration: underline;">
                Բացել նոր էջում
            </a>
        `;
        obj.appendChild(fallbackText);
        
        return obj;
    }

    tryFallbackViewer() {
        console.log('Trying fallback viewer method');
        
        if (!this.currentFilePath) return;
        
        const fullUrl = this.getFullUrl(this.currentFilePath);
        
        this.iframe.style.display = 'none';
        
        const oldObject = this.modalBody.querySelector('object, embed');
        if (oldObject) {
            oldObject.remove();
        }
        
        const pdfObject = this.createPDFObject(fullUrl);
        this.modalBody.appendChild(pdfObject);
        
        this.hideLoading();
    }

    open(filePath, title = 'Փաստաթուղթ') {
        if (!filePath) {
            console.error('File path is required');
            return;
        }

        try {
            this.titleEl.textContent = title;
            this.currentFilePath = filePath;
            this.showLoading();

            // Очищаем предыдущие элементы
            const oldElements = this.modalBody.querySelectorAll('object, embed');
            oldElements.forEach(el => el.remove());
            
            this.iframe.style.display = 'block';

            const isGoogleDrive = filePath.includes('drive.google.com');
            const isIOS = this.isIOSDevice();
            const isAndroid = this.isAndroid();

            // Для Google Drive
            if (isGoogleDrive) {
                this.iframe.src = filePath;
                this.downloadLink.style.display = 'none';
                this.showModal();
                return;
            }

            const fullUrl = this.getFullUrl(filePath);

            // Универсальная стратегия - прямая загрузка для всех
            this.iframe.src = fullUrl;

            // Дополнительные атрибуты для iOS
            if (isIOS) {
                this.iframe.setAttribute('allowfullscreen', '');
                this.iframe.setAttribute('webkitallowfullscreen', '');
                this.iframe.setAttribute('allow', 'fullscreen');
            }

            // Настройка кнопки скачивания
            this.setupDownloadButton(isIOS);

            this.showModal();

        } catch (error) {
            console.error('Error opening PDF:', error);
            this.handleLoadError();
        }
    }

    setupDownloadButton(isIOS) {
        const svgIcon = '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>';
        
        if (isIOS) {
            // Для iOS - кнопка "Открыть" (так как скачивание не работает)
            this.downloadLink.innerHTML = svgIcon + ' Բացել';
        } else {
            // Для остальных - кнопка "Скачать"
            this.downloadLink.innerHTML = svgIcon + ' Ներբեռնել';
        }
        
        this.downloadLink.style.display = 'inline-flex';
    }

    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        document.body.classList.remove('modal-open');
        
        setTimeout(() => {
            this.modal.style.display = 'none';
            this.iframe.src = '';
            this.iframe.style.display = 'block';
            this.isOpen = false;
            this.currentFilePath = null;
            this.hideLoading();
            
            const elements = this.modalBody.querySelectorAll('object, embed');
            elements.forEach(el => el.remove());
            
            const errorMsg = this.modalBody.querySelector('.pdf-error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        }, 300);
    }

    showModal() {
        this.modal.style.display = 'block';
        this.modal.offsetHeight;
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
        
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

        const fullUrl = this.getFullUrl(this.currentFilePath);
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'pdf-error-message';
        errorMsg.innerHTML = `
            <p>Փաստաթուղթը չի կարողացել բեռնվել</p>
            <a href="${fullUrl}" target="_blank" class="retry-btn" style="display: inline-block; text-decoration: none; color: white;">
                Բացել նոր էջում
            </a>
        `;
        this.modalBody.appendChild(errorMsg);
    }

    getFullUrl(path) {
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        
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