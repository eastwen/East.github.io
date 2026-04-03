(function () {
  const IMAGE_PLACEHOLDER =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"></svg>');

  const INITIAL_RENDER_COUNT = 24;
  const RENDER_BATCH_SIZE = 18;

  function optimizeOffscreenRendering() {
    const items = document.querySelectorAll('.aigc-grid .aigc-item');
    items.forEach((item) => {
      item.style.contentVisibility = 'auto';
      item.style.containIntrinsicSize = '1200px 675px';
    });
  }

  function setLazyLoadingForImages() {
    const images = document.querySelectorAll('.aigc-grid .aigc-item img');

    images.forEach((img) => {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
      img.setAttribute('fetchpriority', 'low');

      const originalSrc = img.getAttribute('src') || '';
      if (originalSrc && !img.dataset.lazySrc) {
        img.dataset.lazySrc = originalSrc;
      }

      if (!img.getAttribute('src') || img.getAttribute('src') === img.dataset.lazySrc) {
        img.setAttribute('src', IMAGE_PLACEHOLDER);
      }
    });

    if (!('IntersectionObserver' in window)) {
      images.forEach((img) => {
        if (img.dataset.lazySrc) {
          img.setAttribute('src', img.dataset.lazySrc);
        }
      });
      return;
    }

    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const img = entry.target;
          if (img.dataset.lazySrc) {
            img.setAttribute('src', img.dataset.lazySrc);
          }
          observer.unobserve(img);
        });
      },
      {
        rootMargin: '400px 0px',
        threshold: 0.01,
      }
    );

    images.forEach((img) => {
      if (img.dataset.lazyObserved === '1') return;
      imageObserver.observe(img);
      img.dataset.lazyObserved = '1';
    });
  }

  function setLazyLoadingForVideos() {
    const videos = document.querySelectorAll('.aigc-grid .aigc-item video');
    videos.forEach((video) => {
      if (!video.hasAttribute('preload')) {
        video.setAttribute('preload', 'none');
      }
      if (!video.hasAttribute('playsinline')) {
        video.setAttribute('playsinline', '');
      }

      const src = video.getAttribute('src') || '';
      if (src && !video.dataset.lazyVideoSrc) {
        video.dataset.lazyVideoSrc = src;
        video.removeAttribute('src');
      }
    });

    if (!('IntersectionObserver' in window)) {
      videos.forEach((video) => {
        if (!video.getAttribute('src') && video.dataset.lazyVideoSrc) {
          video.setAttribute('src', video.dataset.lazyVideoSrc);
        }
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const video = entry.target;
          if (!video.getAttribute('src') && video.dataset.lazyVideoSrc) {
            video.setAttribute('src', video.dataset.lazyVideoSrc);
            video.load();
          }
          observer.unobserve(video);
        });
      },
      {
        rootMargin: '300px 0px',
        threshold: 0.01,
      }
    );

    videos.forEach((video) => {
      if (video.dataset.lazyObserved === '1') return;
      observer.observe(video);
      video.dataset.lazyObserved = '1';
    });
  }

  function enableProgressiveGalleryRendering() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    const items = Array.from(grid.children).filter((item) =>
      item.classList && item.classList.contains('aigc-item')
    );
    if (items.length <= INITIAL_RENDER_COUNT) return;

    const pendingItems = items.slice(INITIAL_RENDER_COUNT);
    pendingItems.forEach((item) => item.remove());

    if (!('IntersectionObserver' in window)) {
      const fallbackFragment = document.createDocumentFragment();
      pendingItems.forEach((item) => fallbackFragment.appendChild(item));
      grid.appendChild(fallbackFragment);
      return;
    }

    const sentinel = document.createElement('li');
    sentinel.className = 'lazy-load-sentinel';
    sentinel.style.height = '1px';
    sentinel.style.listStyle = 'none';
    grid.appendChild(sentinel);

    const appendBatch = () => {
      const batch = pendingItems.splice(0, RENDER_BATCH_SIZE);
      if (batch.length === 0) {
        sentinel.remove();
        return;
      }

      const fragment = document.createDocumentFragment();
      batch.forEach((item) => fragment.appendChild(item));
      grid.insertBefore(fragment, sentinel);

      optimizeOffscreenRendering();
      setLazyLoadingForImages();
      setLazyLoadingForVideos();
    };

    appendBatch();

    const loadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          appendBatch();
          if (pendingItems.length === 0) {
            loadObserver.disconnect();
          }
        });
      },
      {
        rootMargin: '600px 0px',
        threshold: 0,
      }
    );

    loadObserver.observe(sentinel);
  }

  window.initSubpageLazyLoading = function initSubpageLazyLoading() {
    enableProgressiveGalleryRendering();
    optimizeOffscreenRendering();
    setLazyLoadingForImages();
    setLazyLoadingForVideos();
  };
})();
