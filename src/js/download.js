document.addEventListener('DOMContentLoaded', () => {
  const downloadLinks = document.querySelectorAll('.smart-download');

  downloadLinks.forEach(link => {
    const clickTarget = link.closest('.doc-row-all') || link;
    clickTarget.style.cursor = 'pointer';

    clickTarget.addEventListener('click', async (event) => {
      event.preventDefault();

      const targetLink = link;
      
      if (targetLink.classList.contains('is-loading')) return;

      const originalUrl = targetLink.href;  
      const fileName = targetLink.getAttribute('data-name') || 'download.zip';
      const originalText = targetLink.innerHTML;

      targetLink.classList.add('is-loading');
      targetLink.style.pointerEvents = 'none';
      targetLink.style.opacity = '0.7';

      let progress = 0;
      targetLink.innerHTML = `Ներբեռնում... ${progress}%`;
      
      const interval = setInterval(() => {
        if (progress < 99) {
          progress += Math.floor(Math.random() * 15) + 5;
          if (progress > 99) progress = 99;
          targetLink.innerHTML = `Ներբեռնում... ${progress}%`;
        }
      }, 150);

      const restoreButton = () => {
        clearInterval(interval);
        targetLink.classList.remove('is-loading');
        targetLink.style.pointerEvents = '';
        targetLink.style.opacity = '';
        targetLink.innerHTML = originalText;
      };

      const urlObject = new URL(originalUrl);
      const fileId = urlObject.searchParams.get('id');

      if (!fileId) {
        console.error('Не удалось найти ID в ссылке', originalUrl);
        window.location.href = originalUrl;
        restoreButton();
        return;
      }

      const workerUrl = `https://download-api.scriptforge.workers.dev/?id=${fileId}&name=${fileName}`;

      try {
        const response = await fetch(workerUrl, { method: 'HEAD' });
        
        if (response.ok) {
          window.location.href = workerUrl;
        } else {
          console.warn('Worker недоступен, используем стандартную ссылку Google');
          window.location.href = originalUrl;
        }
      } catch (error) {
        console.warn('Ошибка сети, используем стандартную ссылку Google');
        window.location.href = originalUrl;
      } finally {
        setTimeout(restoreButton, 1000);
      }
    });
  });
});