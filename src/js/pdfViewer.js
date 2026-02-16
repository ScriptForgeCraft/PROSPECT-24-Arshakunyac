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

        const isIOS = this.isIOSDevice();
        const fullUrl = this.getFullUrl(this.currentFilePath);

        if (isIOS) {
            const link = document.createElement('a');
            link.href = fullUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.download = this.titleEl.textContent || 'document.pdf';
            
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
            }, 100);
        } else {
            const link = document.createElement('a');
            link.href = fullUrl;
            link.download = this.titleEl.textContent || 'document.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    createPDFObject(url) {
        // Создаем object элемент для отображения PDF
        const obj = document.createElement('object');
        obj.data = url;
        obj.type = 'application/pdf';
        obj.style.width = '100%';
        obj.style.height = '100%';
        
        // Fallback для браузеров без поддержки встроенного просмотра PDF
        const fallbackText = document.createElement('p');
        fallbackText.style.padding = '20px';
        fallbackText.style.textAlign = 'center';
        fallbackText.innerHTML = `
            Ваш браузер не поддерживает просмотр PDF.<br>
            <a href="${url}" download style="color: #007bff; text-decoration: underline;">
                Нажмите здесь, чтобы скачать файл
            </a>
        `;
        obj.appendChild(fallbackText);
        
        return obj;
    }

    createEmbedElement(url) {
        // Альтернативный метод через embed
        const embed = document.createElement('embed');
        embed.src = url;
        embed.type = 'application/pdf';
        embed.style.width = '100%';
        embed.style.height = '100%';
        return embed;
    }

    tryFallbackViewer() {
        console.log('Trying fallback viewer method');
        
        if (!this.currentFilePath) return;
        
        const fullUrl = this.getFullUrl(this.currentFilePath);
        
        // Очищаем iframe
        this.iframe.style.display = 'none';
        
        // Удаляем старый object/embed если есть
        const oldObject = this.modalBody.querySelector('object, embed');
        if (oldObject) {
            oldObject.remove();
        }
        
        // Пробуем object элемент
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

            // Очищаем предыдущие object/embed элементы
            const oldElements = this.modalBody.querySelectorAll('object, embed');
            oldElements.forEach(el => el.remove());
            
            // Показываем iframe обратно
            this.iframe.style.display = 'block';

            const isGoogleDrive = filePath.includes('drive.google.com');
            const isIOS = this.isIOSDevice();
            const isAndroid = this.isAndroid();
            const isMobile = this.isMobileDevice();

            // Для Google Drive
            if (isGoogleDrive) {
                this.iframe.src = filePath;
                this.downloadLink.style.display = 'none';
                this.showModal();
                return;
            }

            const fullUrl = this.getFullUrl(filePath);

            // Стратегия для iOS
            if (isIOS) {
                // iOS отлично работает с прямой загрузкой PDF в iframe
                this.iframe.src = fullUrl;
                this.iframe.setAttribute('allowfullscreen', '');
                this.iframe.setAttribute('webkitallowfullscreen', '');
                this.iframe.setAttribute('allow', 'fullscreen');
            }
            // Стратегия для Android
            else if (isAndroid) {
                // Android Chrome тоже хорошо работает с прямой загрузкой
                this.iframe.src = fullUrl;
            }
            // Стратегия для Desktop
            else {
                // Для десктопа используем iframe с PDF
                // Большинство современных браузеров поддерживают это нативно
                this.iframe.src = fullUrl;
            }

            // Настройка кнопки скачивания
            if (isIOS) {
                this.downloadLink.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg> Բացել';
            } else {
                this.downloadLink.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg> Ներբեռնել';
            }
            this.downloadLink.style.display = 'inline-flex';

            this.showModal();

        } catch (error) {
            console.error('Error opening PDF:', error);
            this.handleLoadError();
        }
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
            
            // Удаляем object/embed элементы
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