class HeaderComponent {
    constructor(options = {}) {
        this.isSubPage = options.isSubPage || false;
        this.basePath = this.isSubPage ? '../' : '';
        this.currentTheme = 'light';
        this.mobileQuery = window.matchMedia('(max-width: 768px)');

        this.handleThemeChange = this.handleThemeChange.bind(this);
        this.handleMenuToggle = this.handleMenuToggle.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleNavigationClick = this.handleNavigationClick.bind(this);
        this.handleViewportChange = this.handleViewportChange.bind(this);
    }

    generateHTML() {
        const homeLink = this.isSubPage ? `${this.basePath}index.html` : '#home';
        const aboutLink = this.isSubPage ? `${this.basePath}index.html#about` : '#about';
        const portfolioLink = this.isSubPage ? `${this.basePath}index.html#portfolio` : '#portfolio';
        const contactLink = this.isSubPage ? `${this.basePath}index.html#contact` : '#contact';

        return `
            <header class="site-header">
                <button class="nav-backdrop" type="button" aria-label="关闭导航菜单" tabindex="-1"></button>
                <nav aria-label="主导航">
                    <a href="${homeLink}" class="logo">East wen</a>
                    <div class="nav-right">
                        <button class="menu-toggle" type="button" aria-label="打开导航菜单" aria-controls="primary-navigation" aria-expanded="false">
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                        <ul class="nav-links" id="primary-navigation">
                            <li class="nav-drawer-header">
                                <span>导航菜单</span>
                                <button class="nav-drawer-close" type="button" data-menu-close aria-label="关闭导航菜单">×</button>
                            </li>
                            <li><a href="${homeLink}">主页</a></li>
                            <li><a href="${aboutLink}">自我介绍</a></li>
                            <li><a href="${portfolioLink}">作品列表</a></li>
                            <li><a href="${contactLink}">联系方式</a></li>
                            <li class="nav-theme-item">
                                <span class="nav-theme-label">主题</span>
                                <div class="theme-toggle">
                                    <input type="checkbox" id="theme-switch" class="theme-switch">
                                    <label for="theme-switch" class="theme-label"></label>
                                </div>
                            </li>
                        </ul>
                    </div>
                </nav>
            </header>
        `;
    }

    saveTheme(theme) {
        try {
            if (typeof Storage !== 'undefined') {
                localStorage.setItem('theme', theme);
            }
        } catch (error) {
            console.warn('Unable to save theme preference:', error);
        }
        this.currentTheme = theme;
    }

    getSavedTheme() {
        try {
            if (typeof Storage !== 'undefined') {
                return localStorage.getItem('theme') || 'light';
            }
        } catch (error) {
            console.warn('Unable to read theme preference:', error);
        }
        return this.currentTheme;
    }

    applyTheme(theme) {
        const body = document.body;
        const html = document.documentElement;

        if (theme === 'dark') {
            body.classList.add('dark-theme');
            html.classList.add('dark-theme');
            html.setAttribute('data-theme', 'dark');
        } else {
            body.classList.remove('dark-theme');
            html.classList.remove('dark-theme');
            html.setAttribute('data-theme', 'light');
        }

        const themeSwitch = document.querySelector('#theme-switch');
        if (themeSwitch) {
            themeSwitch.checked = theme === 'dark';
        }
    }

    applyInitialTheme() {
        this.applyTheme(this.getSavedTheme());
    }

    handleThemeChange(event) {
        const newTheme = event.target.checked ? 'dark' : 'light';
        this.applyTheme(newTheme);
        this.saveTheme(newTheme);
    }

    initThemeToggle() {
        const themeSwitch = document.querySelector('#theme-switch');
        if (!themeSwitch) {
            return;
        }

        themeSwitch.removeEventListener('change', this.handleThemeChange);
        themeSwitch.addEventListener('change', this.handleThemeChange);
    }

    setMenuOpen(isOpen) {
        const header = document.querySelector('.site-header');
        const menuToggle = document.querySelector('.menu-toggle');
        const navigation = document.querySelector('.nav-links');
        const shouldOpen = this.mobileQuery.matches && isOpen;

        if (!header || !menuToggle || !navigation) {
            return;
        }

        header.classList.toggle('is-menu-open', shouldOpen);
        menuToggle.setAttribute('aria-expanded', String(shouldOpen));
        menuToggle.setAttribute('aria-label', shouldOpen ? '关闭导航菜单' : '打开导航菜单');
        navigation.setAttribute('aria-hidden', String(this.mobileQuery.matches && !shouldOpen));
        document.body.classList.toggle('mobile-menu-open', shouldOpen);
    }

    handleMenuToggle() {
        const header = document.querySelector('.site-header');
        this.setMenuOpen(!header.classList.contains('is-menu-open'));
    }

    handleDocumentClick(event) {
        const header = document.querySelector('.site-header');
        if (this.mobileQuery.matches && header && !header.contains(event.target)) {
            this.setMenuOpen(false);
        }
    }

    handleKeydown(event) {
        if (event.key === 'Escape') {
            this.setMenuOpen(false);
        }
    }

    handleNavigationClick(event) {
        if (event.target.closest('a') || event.target.closest('[data-menu-close]')) {
            this.setMenuOpen(false);
        }
    }

    handleViewportChange() {
        this.setMenuOpen(false);
    }

    initMobileNavigation() {
        const menuToggle = document.querySelector('.menu-toggle');
        const navigation = document.querySelector('.nav-links');
        const backdrop = document.querySelector('.nav-backdrop');

        if (!menuToggle || !navigation || !backdrop) {
            return;
        }

        menuToggle.addEventListener('click', this.handleMenuToggle);
        backdrop.addEventListener('click', this.handleMenuToggle);
        navigation.addEventListener('click', this.handleNavigationClick);
        document.addEventListener('click', this.handleDocumentClick);
        document.addEventListener('keydown', this.handleKeydown);
        if (typeof this.mobileQuery.addEventListener === 'function') {
            this.mobileQuery.addEventListener('change', this.handleViewportChange);
        } else {
            this.mobileQuery.addListener(this.handleViewportChange);
        }
        this.setMenuOpen(false);
    }

    render(targetElement = 'body') {
        const target = typeof targetElement === 'string'
            ? document.querySelector(targetElement)
            : targetElement;

        if (!target) {
            return;
        }

        if (targetElement === 'body') {
            target.insertAdjacentHTML('afterbegin', this.generateHTML());
        } else {
            target.innerHTML = this.generateHTML();
        }

        this.applyInitialTheme();
        this.initThemeToggle();
        this.initMobileNavigation();
    }

    destroy() {
        const themeSwitch = document.querySelector('#theme-switch');
        const menuToggle = document.querySelector('.menu-toggle');
        const navigation = document.querySelector('.nav-links');
        const backdrop = document.querySelector('.nav-backdrop');

        if (themeSwitch) {
            themeSwitch.removeEventListener('change', this.handleThemeChange);
        }
        if (menuToggle) {
            menuToggle.removeEventListener('click', this.handleMenuToggle);
        }
        if (navigation) {
            navigation.removeEventListener('click', this.handleNavigationClick);
        }
        if (backdrop) {
            backdrop.removeEventListener('click', this.handleMenuToggle);
        }

        document.removeEventListener('click', this.handleDocumentClick);
        document.removeEventListener('keydown', this.handleKeydown);
        if (typeof this.mobileQuery.removeEventListener === 'function') {
            this.mobileQuery.removeEventListener('change', this.handleViewportChange);
        } else {
            this.mobileQuery.removeListener(this.handleViewportChange);
        }
        document.body.classList.remove('mobile-menu-open');
    }

    static create(options = {}) {
        const header = new HeaderComponent(options);
        header.render();
        return header;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeaderComponent;
} else {
    window.HeaderComponent = HeaderComponent;
}
