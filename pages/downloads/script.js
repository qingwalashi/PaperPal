// 下载页面功能实现
document.addEventListener('DOMContentLoaded', function() {
    initializeDownloadsPage();
});

function initializeDownloadsPage() {
    // 设置导航活动项
    if (window.navigation) {
        window.navigation.updateActiveNavItem('downloads');
    }

    // 初始化分类切换
    initializeCategoryTabs();

    // 自动探测本地文件大小与格式
    initializeFileMeta();
}

// 初始化分类标签页
function initializeCategoryTabs() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    const sections = document.querySelectorAll('.download-section');

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            
            // 更新按钮状态
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 切换内容区域
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `${category}-section`) {
                    section.classList.add('active');
                }
            });
        });
    });
}

// 初始化文件元信息（大小/格式）
function initializeFileMeta() {
    const cards = document.querySelectorAll('.download-card[data-file]');
    cards.forEach(card => {
        const relPath = card.getAttribute('data-file');
        const sizeEl = card.querySelector('.download-size');
        const fmtEl = card.querySelector('.download-format');

        // 根据扩展名显示格式
        const ext = (relPath.split('.').pop() || '').toUpperCase();
        if (fmtEl) fmtEl.textContent = ext ? `${ext} 格式` : '未知格式';

        // 通过 HEAD 请求尝试获取文件大小
        try {
            const url = new URL(relPath, window.location.href).toString();
            fetch(url, { method: 'HEAD' }).then(res => {
                const len = res.headers.get('content-length');
                if (len && sizeEl) {
                    sizeEl.textContent = formatBytes(parseInt(len, 10));
                } else if (sizeEl) {
                    sizeEl.textContent = '大小未知';
                }
            }).catch(() => {
                if (sizeEl) sizeEl.textContent = '大小未知';
            });
        } catch (e) {
            if (sizeEl) sizeEl.textContent = '大小未知';
        }
    });
}

function formatBytes(bytes) {
    if (isNaN(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const val = bytes / Math.pow(1024, i);
    return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${units[i]}`;
}

// 添加CSS样式到页面
const additionalCSS = `
<style>
.category-btn {
    padding: 0.75rem 1.5rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
    color: #6b7280;
    font-weight: 500;
    transition: all 0.3s ease;
    cursor: pointer;
}

.category-btn:hover {
    border-color: #3b82f6;
    color: #3b82f6;
}

.category-btn.active {
    border-color: #3b82f6;
    background: #3b82f6;
    color: white;
}

.download-section {
    display: none;
}

.download-section.active {
    display: block;
}

.download-card {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    border: 1px solid #e5e7eb;
}

.download-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.download-icon {
    width: 3rem;
    height: 3rem;
    background: var(--pp-primary-600);
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

.download-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
}

.download-description {
    color: #6b7280;
    line-height: 1.6;
    margin-bottom: 1rem;
    font-size: 0.875rem;
}

.download-info {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    font-size: 0.75rem;
}

.download-size, .download-format {
    padding: 0.25rem 0.5rem;
    background: #f3f4f6;
    border-radius: 0.25rem;
    color: #6b7280;
}

.download-preview {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
    text-align: center;
    font-size: 1.125rem;
    color: #374151;
}

.download-button {
    width: 100%;
    background: var(--pp-primary-600);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    border: none;
    font-weight: 500;
    transition: all 0.3s ease;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
}

.download-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.28);
    background: var(--pp-primary-700);
}
</style>
`;

// 将CSS添加到页面头部
document.head.insertAdjacentHTML('beforeend', additionalCSS);
