// 下载页面功能实现
document.addEventListener('DOMContentLoaded', function() {
    initializeDownloadsPage();
});

function initializeDownloadsPage() {
    // 设置导航活动项
    if (window.navigation) {
        window.navigation.updateActiveNavItem('downloads');
    }

    // 加载YAML配置并生成页面内容
    loadConfigAndRenderPage();
}

// 加载YAML配置文件并渲染页面
async function loadConfigAndRenderPage() {
    try {
        const response = await fetch('downloads-config.yaml');
        const yamlText = await response.text();
        console.log('YAML文本加载成功，长度:', yamlText.length);
        
        const config = parseYAML(yamlText);
        console.log('YAML解析结果:', config);
        
        // 更新页面标题
        updatePageTitle(config.page_info);
        
        // 渲染所有分类
        renderCategories(config.categories);
        
        // 初始化文件元信息
        initializeFileMeta();
    } catch (error) {
        console.error('加载配置文件失败:', error);
        // 显示错误信息
        const container = document.querySelector('.container.mx-auto.px-4.py-8');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-500">配置文件加载失败: ${error.message}</p>
                    <p class="text-gray-500 mt-2">请检查downloads-config.yaml文件是否存在</p>
                </div>
            `;
        }
    }
}

// 改进的YAML解析器
function parseYAML(yamlText) {
    const lines = yamlText.split('\n');
    const result = {};
    const stack = [{ obj: result, indent: -1 }];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 跳过注释和空行
        if (line.trim().startsWith('#') || line.trim() === '') continue;
        
        const indent = line.length - line.trimStart().length;
        const trimmedLine = line.trim();
        
        // 根据缩进调整栈
        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
            stack.pop();
        }
        
        const currentContext = stack[stack.length - 1];
        
        if (trimmedLine.startsWith('- ')) {
            // 数组项
            const itemContent = trimmedLine.substring(2).trim();
            
            // 确保当前上下文有一个数组
            if (!currentContext.arrayKey) {
                const keys = Object.keys(currentContext.obj);
                currentContext.arrayKey = keys[keys.length - 1];
                if (!Array.isArray(currentContext.obj[currentContext.arrayKey])) {
                    currentContext.obj[currentContext.arrayKey] = [];
                }
            }
            
            if (itemContent === '' || itemContent.includes(':')) {
                // 空的数组项或包含键值对的数组项，准备接收对象
                const newItem = {};
                currentContext.obj[currentContext.arrayKey].push(newItem);
                
                // 如果当前行包含键值对，处理它
                if (itemContent.includes(':')) {
                    const [key, ...valueParts] = itemContent.split(':');
                    const value = valueParts.join(':').trim();
                    newItem[key.trim()] = value || '';
                }
                
                stack.push({ 
                    obj: newItem, 
                    indent: indent,
                    isArrayItem: true 
                });
            } else {
                // 简单的数组项
                currentContext.obj[currentContext.arrayKey].push(itemContent);
            }
        } else if (trimmedLine.includes(':')) {
            // 键值对
            const [key, ...valueParts] = trimmedLine.split(':');
            const value = valueParts.join(':').trim();
            const cleanKey = key.trim();
            
            if (value === '' || value === '{}' || value === '[]') {
                // 容器对象或准备接收items数组
                if (cleanKey === 'items') {
                    currentContext.obj[cleanKey] = [];
                    // 设置数组键，以便后续数组项知道要添加到哪里
                    const newContext = { 
                        obj: currentContext.obj, 
                        indent: indent,
                        arrayKey: cleanKey
                    };
                    stack.push(newContext);
                } else {
                    currentContext.obj[cleanKey] = {};
                    stack.push({ 
                        obj: currentContext.obj[cleanKey], 
                        indent: indent 
                    });
                }
            } else if (value.startsWith('"') && value.endsWith('"')) {
                // 引用字符串
                currentContext.obj[cleanKey] = value.slice(1, -1);
            } else {
                // 普通值
                currentContext.obj[cleanKey] = value;
            }
        }
    }
    
    return result;
}

// 更新页面标题
function updatePageTitle(pageInfo) {
    if (!pageInfo) return;
    
    const titleElement = document.querySelector('.page-title');
    const subtitleElement = document.querySelector('.page-subtitle');
    
    if (titleElement && pageInfo.title) {
        titleElement.textContent = pageInfo.title;
    }
    if (subtitleElement && pageInfo.subtitle) {
        subtitleElement.textContent = pageInfo.subtitle;
    }
}

// 渲染所有分类
function renderCategories(categories) {
    const container = document.querySelector('.container.mx-auto.px-4.py-8');
    if (!container) {
        console.error('找不到容器元素');
        return;
    }
    
    if (!categories) {
        console.error('categories为空');
        return;
    }
    
    console.log('开始渲染分类，分类数量:', Object.keys(categories).length);
    
    // 清空现有内容
    container.innerHTML = '';
    
    // 渲染每个分类
    Object.entries(categories).forEach(([categoryKey, category], index) => {
        console.log(`渲染分类 ${categoryKey}:`, category);
        const sectionElement = createCategorySection(categoryKey, category, index > 0);
        container.appendChild(sectionElement);
    });
}

// 创建分类区域
function createCategorySection(categoryKey, category, addTopMargin = false) {
    const section = document.createElement('div');
    section.id = `${categoryKey}-section`;
    section.className = `download-section${addTopMargin ? ' mt-32 lg:mt-40' : ''}`;
    
    // 创建标题区域
    const titleDiv = document.createElement('div');
    titleDiv.className = 'mb-8 text-center';
    titleDiv.style.marginTop = '2em';
    
    const title = document.createElement('h2');
    title.className = 'text-2xl font-bold text-gray-800 mb-3';
    title.textContent = category.title;
    
    const subtitle = document.createElement('p');
    subtitle.className = 'text-gray-600';
    subtitle.textContent = category.subtitle;
    
    titleDiv.appendChild(title);
    titleDiv.appendChild(subtitle);
    section.appendChild(titleDiv);
    
    // 创建卡片网格
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    
    // 创建每个项目的卡片
    if (category.items && Array.isArray(category.items)) {
        console.log(`分类 ${categoryKey} 有 ${category.items.length} 个项目`);
        category.items.forEach((item, itemIndex) => {
            console.log(`创建卡片 ${itemIndex}:`, item);
            const card = createDownloadCard(item);
            grid.appendChild(card);
        });
    } else {
        console.log(`分类 ${categoryKey} 没有items或items不是数组:`, category.items);
    }
    
    section.appendChild(grid);
    return section;
}

// 创建下载卡片
function createDownloadCard(item) {
    const card = document.createElement('div');
    card.className = 'download-card';
    card.setAttribute('data-file', item.file_path);
    
    // 标题
    const title = document.createElement('h3');
    title.className = 'download-title';
    title.textContent = item.name;
    card.appendChild(title);
    
    // 描述
    const description = document.createElement('p');
    description.className = 'download-description';
    description.textContent = item.description;
    card.appendChild(description);
    
    // 文件信息
    const info = document.createElement('div');
    info.className = 'download-info';
    
    const size = document.createElement('span');
    size.className = 'download-size';
    size.textContent = item.file_size === 'auto' ? '-' : item.file_size;
    
    const format = document.createElement('span');
    format.className = 'download-format';
    format.textContent = `${item.file_format} 格式`;
    
    info.appendChild(size);
    info.appendChild(format);
    card.appendChild(info);
    
    // 字体预览（仅字体类型）
    if (item.preview_text && item.font_family) {
        const preview = document.createElement('div');
        preview.className = 'download-preview';
        preview.style.fontFamily = item.font_family;
        preview.textContent = item.preview_text;
        card.appendChild(preview);
    }
    
    // 下载按钮
    const button = document.createElement('a');
    button.className = 'download-button';
    button.href = item.file_path;
    button.download = '';
    button.innerHTML = `<i class="bi bi-download mr-2"></i>${item.file_format === 'DOCX' ? '下载模板' : '下载字体'}`;
    card.appendChild(button);
    
    return card;
}

// 显示所有内容区域（备用函数）
function showAllSections() {
    const sections = document.querySelectorAll('.download-section');
    sections.forEach(section => {
        section.style.display = 'block';
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
.download-section {
    display: block;
}

.download-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
    border: 1px solid #f1f5f9;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.download-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: #e2e8f0;
}

.download-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.5rem;
}

.download-description {
    color: #64748b;
    line-height: 1.5;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    flex-grow: 1;
}

.download-info {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    font-size: 0.75rem;
}

.download-size, .download-format {
    padding: 0.2rem 0.5rem;
    background: #f8fafc;
    border-radius: 0.25rem;
    color: #64748b;
    border: 1px solid #e2e8f0;
}

.download-preview {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin-bottom: 0.75rem;
    text-align: center;
    font-size: 1rem;
    color: #475569;
}

.download-button {
    width: 100%;
    background: transparent;
    color: #3b82f6;
    padding: 0.625rem 1rem;
    border: 1px solid #3b82f6;
    border-radius: 0.5rem;
    font-weight: 500;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    margin-top: auto;
}

.download-button:hover {
    background: #3b82f6;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.25);
}
</style>
`;

// 将CSS添加到页面头部
document.head.insertAdjacentHTML('beforeend', additionalCSS);
