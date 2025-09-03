// 导航组件管理
class Navigation {
    constructor() {
        this.topnav = null;
        this.sidebar = null;
        this.hamburger = null;
        this.overlay = null;
        this.mainContent = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createElements();
        this.bindEvents();
        this.setActiveNavItem();
        this.setupHeaderScrollBehavior();
    }

    createElements() {
        // 创建顶部导航（桌面端显示，移动端仅显示品牌，链接在CSS里隐藏）
        this.topnav = document.createElement('div');
        this.topnav.className = 'topnav';
        this.topnav.innerHTML = this.getTopnavHTML();
        document.body.appendChild(this.topnav);

        // 创建汉堡菜单按钮
        this.hamburger = document.createElement('button');
        this.hamburger.className = 'hamburger';
        this.hamburger.innerHTML = '<i class="bi bi-list"></i>';
        document.body.appendChild(this.hamburger);

        // 创建侧边栏
        this.sidebar = document.createElement('div');
        this.sidebar.className = 'sidebar';
        this.sidebar.innerHTML = this.getSidebarHTML();
        document.body.appendChild(this.sidebar);

        // 创建遮罩层
        this.overlay = document.createElement('div');
        this.overlay.className = 'overlay';
        document.body.appendChild(this.overlay);

        // 获取主内容区域
        this.mainContent = document.querySelector('.main-content') || document.body;
        if (!this.mainContent.classList.contains('main-content')) {
            this.mainContent.classList.add('main-content');
        }
    }

    getTopnavHTML() {
        return `
            <div class="topnav-inner container mx-auto px-4">
                <a class="topnav-brand" href="/index.html">
                    <span class="brand-text">PaperPal</span>
                </a>
                <div class="topnav-links">
                    <a href="/index.html" class="topnav-link" data-page="home"><i class="bi bi-house me-1"></i> 首页</a>
                    <a href="/pages/downloads/index.html" class="topnav-link" data-page="downloads"><i class="bi bi-download me-1"></i> 常用下载</a>
                    <a href="/pages/markdown-to-docx/index.html" class="topnav-link" data-page="markdown-to-docx"><i class="bi bi-file-earmark-word me-1"></i> MD 转 Word</a>
                    <a href="/pages/doc-processor/index.html" class="topnav-link" data-page="doc-processor"><i class="bi bi-file-earmark-richtext me-1"></i> Doc处理</a>
                    <a href="/pages/pdf-processor/index.html" class="topnav-link" data-page="pdf-processor"><i class="bi bi-file-earmark-pdf me-1"></i> PDF处理</a>
                    <a href="/pages/nameplate/index.html" class="topnav-link" data-page="nameplate"><i class="bi bi-card-text me-1"></i> 台签排版</a>
                </div>
            </div>
        `;
    }

    getSidebarHTML() {
        return `
            <div class="sidebar-header">
                <h2 class="sidebar-title">PaperPal</h2>
            </div>
            <nav class="sidebar-nav">
                <div class="nav-item">
                    <a href="/index.html" class="nav-link" data-page="home">
                        <i class="bi bi-house nav-icon"></i>
                        首页
                    </a>
                </div>
                <div class="nav-item">
                    <a href="/pages/downloads/index.html" class="nav-link" data-page="downloads">
                        <i class="bi bi-download nav-icon"></i>
                        常用下载
                    </a>
                </div>
                <div class="nav-item">
                    <a href="/pages/markdown-to-docx/index.html" class="nav-link" data-page="markdown-to-docx">
                        <i class="bi bi-file-earmark-word nav-icon"></i>
                        MD 转 Word
                    </a>
                </div>
                <div class="nav-item">
                    <a href="/pages/doc-processor/index.html" class="nav-link" data-page="doc-processor">
                        <i class="bi bi-file-earmark-richtext nav-icon"></i>
                        Doc处理
                    </a>
                </div>
                <div class="nav-item">
                    <a href="/pages/pdf-processor/index.html" class="nav-link" data-page="pdf-processor">
                        <i class="bi bi-file-earmark-pdf nav-icon"></i>
                        PDF处理
                    </a>
                </div>
                <div class="nav-item">
                    <a href="/pages/nameplate/index.html" class="nav-link" data-page="nameplate">
                        <i class="bi bi-card-text nav-icon"></i>
                        台签排版
                    </a>
                </div>
            </nav>
        `;
    }

    bindEvents() {
        // 顶部导航链接点击：移动端不需要特殊处理，桌面端直接跳转
        const topLinks = this.topnav.querySelectorAll('.topnav-link');
        topLinks.forEach(link => {
            link.addEventListener('click', () => {
                // 同步高亮由 setActiveNavItem 控制
            });
        });

        // 汉堡菜单点击事件
        this.hamburger.addEventListener('click', () => {
            this.toggle();
        });

        // 遮罩层点击事件
        this.overlay.addEventListener('click', () => {
            this.close();
        });

        // 导航链接点击事件
        this.sidebar.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-link')) {
                // 在移动端点击导航后关闭侧边栏
                if (window.innerWidth <= 768) {
                    this.close();
                }
            }
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // 窗口大小变化事件
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isOpen) {
                this.mainContent.classList.add('sidebar-open');
            } else if (window.innerWidth <= 768) {
                this.mainContent.classList.remove('sidebar-open');
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.sidebar.classList.add('active');
        this.overlay.classList.add('active');
        this.hamburger.classList.add('active');
        
        if (window.innerWidth > 768) {
            this.mainContent.classList.add('sidebar-open');
        }
        
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.isOpen = false;
        this.sidebar.classList.remove('active');
        this.overlay.classList.remove('active');
        this.hamburger.classList.remove('active');
        this.mainContent.classList.remove('sidebar-open');
        document.body.style.overflow = '';
    }

    // 滚动时：逐步隐藏页面头部；完全隐藏后，用页面标题替换导航栏品牌文案
    setupHeaderScrollBehavior() {
        const headerEl = document.querySelector('.page-header');
        const titleEl = document.querySelector('.page-title');
        const brandTextEl = this.topnav.querySelector('.brand-text');
        if (!headerEl || !titleEl || !brandTextEl) return;

        const navHeight = 64; // 与 CSS 中保持一致
        const defaultBrand = 'PaperPal';
        const pageTitle = (titleEl.textContent || '').trim() || defaultBrand;

        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                const rect = headerEl.getBoundingClientRect();
                const height = Math.max(rect.height, 1);
                const bottom = rect.bottom; // header 底部到视口顶部的距离
                // 当 header 底部 <= 导航底部，视为完全隐藏
                const ratio = Math.min(Math.max((bottom - navHeight) / height, 0), 1);
                // 渐隐与上移
                headerEl.style.opacity = String(ratio);
                const translate = (1 - ratio) * 12; // 最多上移 12px，细微
                headerEl.style.transform = `translateY(-${translate}px)`;

                // 标题切换
                if (ratio <= 0.01) {
                    // 完全隐藏后显示页面标题
                    if (brandTextEl.textContent !== pageTitle) brandTextEl.textContent = pageTitle;
                } else {
                    if (brandTextEl.textContent !== defaultBrand) brandTextEl.textContent = defaultBrand;
                }

                ticking = false;
            });
        };

        // 初始执行一次，处理刷新后位置
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    setActiveNavItem() {
        // 根据当前页面URL设置活动导航项
        const currentPath = window.location.pathname;
        const sideLinks = this.sidebar.querySelectorAll('.nav-link');
        const topLinks = this.topnav.querySelectorAll('.topnav-link');
        
        const applyActive = (link) => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            if (href === currentPath || 
                (currentPath === '/' && href === '/index.html') ||
                (currentPath.includes(href) && href !== '/index.html')) {
                link.classList.add('active');
            }
        };

        sideLinks.forEach(applyActive);
        topLinks.forEach(applyActive);
    }

    // 更新活动导航项（供外部调用）
    updateActiveNavItem(pageName) {
        const sideLinks = this.sidebar.querySelectorAll('.nav-link');
        const topLinks = this.topnav.querySelectorAll('.topnav-link');
        const apply = (link) => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageName) {
                link.classList.add('active');
            }
        };
        sideLinks.forEach(apply);
        topLinks.forEach(apply);
    }
}

// 页面加载完成后初始化导航
document.addEventListener('DOMContentLoaded', () => {
    window.navigation = new Navigation();
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Navigation;
}
