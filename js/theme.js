/**
 * 主题切换功能
 * 处理浅色/深色模式的切换
 */

class ThemeManager {
    constructor() {
        this.themeSwitch = document.getElementById('theme-switch');
        this.init();
    }

    init() {
        // 从localStorage获取保存的主题
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 设置初始主题
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        this.setTheme(initialTheme);
        
        // 绑定事件监听器
        this.bindEvents();
    }

    bindEvents() {
        // 主题切换开关事件
        this.themeSwitch.addEventListener('change', (e) => {
            const theme = e.target.checked ? 'dark' : 'light';
            this.setTheme(theme);
        });

        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    setTheme(theme) {
        const html = document.documentElement;
        
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
            this.themeSwitch.checked = true;
        } else {
            html.removeAttribute('data-theme');
            this.themeSwitch.checked = false;
        }
        
        // 保存到localStorage
        localStorage.setItem('theme', theme);
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme }
        }));
    }

    getCurrentTheme() {
        return document.documentElement.hasAttribute('data-theme') ? 'dark' : 'light';
    }

    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
}

// 页面加载完成后初始化主题管理器
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}