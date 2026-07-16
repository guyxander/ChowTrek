const countNodes = document.querySelectorAll('[data-download-count]');

async function refreshDownloadCount() {
  try {
    const response = await fetch('/api/download-count', { cache: 'no-store' });
    const data = await response.json();
    const value = new Intl.NumberFormat().format(data.downloads ?? 0);
    countNodes.forEach((node) => {
      node.textContent = value;
    });
  } catch (error) {
    countNodes.forEach((node) => {
      node.textContent = '0';
    });
  }
}

refreshDownloadCount();
