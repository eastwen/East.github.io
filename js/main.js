// gif-portfolio main.js
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('gif-portfolio-body')) {
        loadGifPortfolioItems('all');
        setupGifFilterButtons();
        setupGifModal();
    }
});

function loadGifPortfolioItems(filter) {
    const gifGrid = document.querySelector('.gif-grid');
    if (!gifGrid) return;

    gifGrid.innerHTML = '';

    const filteredData = filter === 'all'
        ? gifPortfolioData
        : gifPortfolioData.filter(item => item.category === filter);

    if (filteredData.length === 0) {
        gifGrid.innerHTML = '<div class="no-items">没有找到匹配的GIF作品</div>';
        return;
    }

    filteredData.forEach(item => {
        const gifItem = document.createElement('div');
        gifItem.className = 'gif-item';
        gifItem.setAttribute('data-id', item.id);

        const formattedDate = formatDate(item.date);
        const categoryText = getCategoryText(item.category);

        gifItem.innerHTML = `
            <img src="${item.image}" alt="${item.title}">
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <div class="tags">
                <span class="tag">${categoryText}</span>
                <span class="tag">${formattedDate}</span>
            </div>
        `;

        gifGrid.appendChild(gifItem);
    });
}

function setupGifFilterButtons() {
    const filterButtons = document.querySelectorAll('.gif-filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const filter = button.getAttribute('data-filter');
            loadGifPortfolioItems(filter);
        });
    });
}

function setupGifModal() {
    // If there's a modal for the main portfolio, we might need a separate one or adapt this.
    // For now, assuming the main site's modal is not used for GIF portfolio.
}