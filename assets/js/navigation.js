// 导航组件管理
class Navigation {
    constructor() {
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
    }

    createElements() {
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

    getSidebarHTML() {
        return `
            <div class="sidebar-header">
                <h2 class="sidebar-title">
                    <i class="bi bi-file-earmark-text"></i>
                    PaperPal
                </h2>
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
                        Markdown转Word
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

    setActiveNavItem() {
        // 根据当前页面URL设置活动导航项
        const currentPath = window.location.pathname;
        const navLinks = this.sidebar.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            if (href === currentPath || 
                (currentPath === '/' && href === '/index.html') ||
                (currentPath.includes(href) && href !== '/index.html')) {
                link.classList.add('active');
            }
        });
    }

    // 更新活动导航项（供外部调用）
    updateActiveNavItem(pageName) {
        const navLinks = this.sidebar.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageName) {
                link.classList.add('active');
            }
        });
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
