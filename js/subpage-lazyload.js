(function () {
  const IMAGE_PLACEHOLDER =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"></svg>');

  const INITIAL_RENDER_COUNT = 24;
  const RENDER_BATCH_SIZE = 18;
  const MOBILE_INITIAL_RENDER_COUNT = 12;
  const MOBILE_RENDER_BATCH_SIZE = 10;

  function isNearViewport(element) {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
    return rect.top < viewportHeight * 1.25 && rect.bottom > -100;
  }

  function getImageRootMargin() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection && (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
      return '250px 0px';
    }
    return '700px 0px';
  }

  function getPreviewSource(source) {
    if (!source || /^(?:data:|https?:)/i.test(source)) {
      return source;
    }

    const match = source.match(/^([^?#]+)([?#].*)?$/);
    const pathname = match ? match[1] : source;
    if (!/\.(?:avif|gif|jpe?g|png|webp)$/i.test(pathname)) {
      return source;
    }

    const lastSlashIndex = pathname.lastIndexOf('/');
    const directory = lastSlashIndex === -1 ? '' : pathname.slice(0, lastSlashIndex + 1);
    const filename = pathname.slice(lastSlashIndex + 1);
    return `${directory}thumbs/${filename}.webp`;
  }

  function loadImage(img) {
    const source = img.dataset.lazySrc;
    const fullSource = img.dataset.fullSrc || source;
    if (!source || img.dataset.lazyLoaded === '1') {
      return;
    }

    img.dataset.lazyLoaded = '1';
    if (source !== fullSource) {
      img.addEventListener(
        'error',
        () => {
          if (img.dataset.lazyFallback === '1') {
            return;
          }
          img.dataset.lazyFallback = '1';
          img.setAttribute('src', fullSource);
        },
        { once: true }
      );
    }

    img.setAttribute('src', source);
  }

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
      const priorityImage = isNearViewport(img);
      img.setAttribute('loading', priorityImage ? 'eager' : 'lazy');
      img.setAttribute('decoding', 'async');
      img.setAttribute('fetchpriority', priorityImage ? 'high' : 'low');

      if (img.dataset.lazyPrepared === '1') {
        return;
      }

      const originalSrc = img.dataset.fullSrc || img.dataset.src || img.getAttribute('src') || '';
      if (originalSrc && !img.dataset.fullSrc) {
        img.dataset.fullSrc = originalSrc;
      }

      if (img.dataset.fullSrc && !img.dataset.lazySrc) {
        img.dataset.lazySrc = getPreviewSource(img.dataset.fullSrc);
      }

      if (img.dataset.lazySrc && img.getAttribute('src') !== IMAGE_PLACEHOLDER) {
        img.setAttribute('src', IMAGE_PLACEHOLDER);
      }

      img.dataset.lazyPrepared = '1';
    });

    if (!('IntersectionObserver' in window)) {
      images.forEach((img) => {
        if (img.dataset.lazySrc) {
          loadImage(img);
        }
      });
      return;
    }

    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const img = entry.target;
          loadImage(img);
          observer.unobserve(img);
        });
      },
      {
        rootMargin: getImageRootMargin(),
        threshold: 0.01,
      }
    );

    images.forEach((img) => {
      if (img.dataset.lazyObserved === '1') return;
      if (isNearViewport(img)) {
        loadImage(img);
        img.dataset.lazyObserved = '1';
        return;
      }
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
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const initialRenderCount = isMobile ? MOBILE_INITIAL_RENDER_COUNT : INITIAL_RENDER_COUNT;
    const renderBatchSize = isMobile ? MOBILE_RENDER_BATCH_SIZE : RENDER_BATCH_SIZE;
    if (items.length <= initialRenderCount) return;

    const pendingItems = items.slice(initialRenderCount);
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
      const batch = pendingItems.splice(0, renderBatchSize);
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
