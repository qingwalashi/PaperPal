// Doc处理功能实现
let currentFile = null;
let currentResult = null;
let currentAction = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeDocProcessor();
});

function initializeDocProcessor() {
    // 设置导航活动项
    if (window.navigation) {
        window.navigation.updateActiveNavItem('doc-processor');
    }

    // 初始化文件上传
    initializeFileUpload();
    
    // 初始化复制按钮
    initializeCopyButtons();
    
    // 初始化时同步预览区域高度
    syncPreviewHeight();
    window.addEventListener('resize', syncPreviewHeight);

    // 初始化标签页切换
    initializeTabSwitching();
    
    // 初始化结果操作按钮
    initializeResultActions();
}

// 初始化文件上传
function initializeFileUpload() {
    const uploadZone = document.getElementById('upload-zone');

    // 创建拖拽上传功能
    window.FileHandler.createDropZone(uploadZone, {
        inputId: 'file-input',
        // Mammoth 仅支持 .docx，这里禁止 .doc
        allowedTypes: ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: false,
        onDrop: handleFileUpload,
        onError: (errors) => {
            errors.forEach(error => CommonUtils.showNotification(error, 'error'));
        }
    });
}

// 处理文件上传
function handleFileUpload(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    const ext = getFileExtension(file.name);
    if (ext !== '.docx') {
        CommonUtils.showNotification('当前仅支持 .docx 文件，请转换后再试。', 'warning');
        return;
    }
    currentFile = file;
    
    // 显示文件信息
    displayFileInfo(file);
    // 同步预览区域高度
    syncPreviewHeight();
    // 自动开始预览
    previewDocument(file).catch(err => {
        console.error(err);
        const msg = (err && err.message) ? err.message : String(err || '未知错误');
        // 针对常见 zip 读取失败的友好提示
        const hint = msg.includes('central directory') || msg.includes('zip')
            ? '文件格式可能不是 .docx（Office Open XML）。请确认后重试。'
            : '';
        CommonUtils.showNotification(`预览失败：${msg}${hint ? '｜' + hint : ''}`, 'error');
    });
}

// 显示文件信息
function displayFileInfo(file) {
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const fileType = document.getElementById('file-type');
    
    fileName.textContent = file.name;
    fileSize.textContent = CommonUtils.formatFileSize(file.size);
    const ext = getFileExtension(file.name);
    fileType.textContent = ext ? ext : '未知类型';
    // 仍保留 MIME 作为悬浮提示
    if (file.type) fileType.title = file.type;
    
    fileInfo.classList.remove('hidden');
}

// 同步预览区域高度与上传区域高度
function syncPreviewHeight() {
    // 等待DOM更新后再计算高度
    setTimeout(() => {
        const uploadCard = document.querySelector('.upload-section .bg-white');
        const previewCard = document.getElementById('preview-card');
        
        if (uploadCard && previewCard) {
            const uploadHeight = uploadCard.offsetHeight;
            previewCard.style.height = uploadHeight + 'px';
        }
    }, 100);
}

// 初始化处理按钮
function initializeProcessButtons() {
    const processButtons = document.querySelectorAll('.process-btn');
    
    processButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!currentFile) {
                CommonUtils.showNotification('请先上传文件！', 'warning');
                return;
            }
            
            const action = btn.getAttribute('data-action');
            currentAction = action;
            
            // 显示加载状态
            CommonUtils.showLoading(btn);
            showProgress(0);
            
            try {
                switch (action) {
                    case 'preview':
                        await previewDocument();
                        break;
                    case 'to-html':
                        await convertToHtml();
                        break;
                    case 'to-markdown':
                        await convertToMarkdown();
                        break;
                }
            } catch (error) {
                console.error('处理文档时出错:', error);
                CommonUtils.showNotification('处理文档时出错，请重试！', 'error');
            } finally {
                CommonUtils.hideLoading(btn);
                hideProgress();
            }
        });
    });
}

// 预览文档
async function previewDocument() {
    showProgress(20);
    
    // 双重保护：仅处理 docx
    const ext = getFileExtension(currentFile && currentFile.name);
    if (ext !== '.docx') {
        showProgress(0);
        throw new Error('仅支持 .docx 文件');
    }

    const arrayBuffer = await currentFile.arrayBuffer();
    showProgress(40);
    
    // 配置mammoth转换选项，优化标题、列表、表格识别
    const options = {
        arrayBuffer: arrayBuffer,
        styleMap: [
            // 基于大纲级别的标题映射（更可靠）
            "p:outline-level(1) => h1:fresh",
            "p:outline-level(2) => h2:fresh",
            "p:outline-level(3) => h3:fresh",
            "p:outline-level(4) => h4:fresh",
            "p:outline-level(5) => h5:fresh",
            "p:outline-level(6) => h6:fresh",
            // 英文标题样式映射
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh", 
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Heading 4'] => h4:fresh",
            "p[style-name='Heading 5'] => h5:fresh",
            "p[style-name='Heading 6'] => h6:fresh",
            // 中文标题样式
            "p[style-name='标题 1'] => h1:fresh",
            "p[style-name='标题 2'] => h2:fresh",
            "p[style-name='标题 3'] => h3:fresh",
            "p[style-name='标题 4'] => h4:fresh",
            "p[style-name='标题 5'] => h5:fresh",
            "p[style-name='标题 6'] => h6:fresh",
            // 其他可能的标题样式
            "p[style-name='Title'] => h1:fresh",
            "p[style-name='Subtitle'] => h2:fresh",
            "p[style-name='标题'] => h1:fresh",
            "p[style-name='副标题'] => h2:fresh",
            // 列表样式
            "p[style-name='List Paragraph'] => p:fresh",
            "p[style-name='列表段落'] => p:fresh"
        ],
        convertImage: mammoth.images.imgElement(function(image) {
            return image.read("base64").then(function(imageBuffer) {
                return {
                    src: "data:" + image.contentType + ";base64," + imageBuffer
                };
            });
        })
    };
    
    const result = await mammoth.convertToHtml(options);
    showProgress(80);
    
    currentResult = {
        type: 'preview',
        html: result.value,
        messages: result.messages
    };
    
    // 显示预览
    displayPreview(result.value);
    showProgress(100);
    
    CommonUtils.showNotification('文档预览成功！', 'success');
}

// 转换为HTML
async function convertToHtml() {
    showProgress(20);
    
    const arrayBuffer = await currentFile.arrayBuffer();
    showProgress(40);
    
    // 使用相同的优化配置
    const options = {
        arrayBuffer: arrayBuffer,
        styleMap: [
            // 基于大纲级别的标题映射（更可靠）
            "p:outline-level(1) => h1:fresh",
            "p:outline-level(2) => h2:fresh",
            "p:outline-level(3) => h3:fresh",
            "p:outline-level(4) => h4:fresh",
            "p:outline-level(5) => h5:fresh",
            "p:outline-level(6) => h6:fresh",
            // 英文标题样式映射
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh", 
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Heading 4'] => h4:fresh",
            "p[style-name='Heading 5'] => h5:fresh",
            "p[style-name='Heading 6'] => h6:fresh",
            // 中文标题样式
            "p[style-name='标题 1'] => h1:fresh",
            "p[style-name='标题 2'] => h2:fresh",
            "p[style-name='标题 3'] => h3:fresh",
            "p[style-name='标题 4'] => h4:fresh",
            "p[style-name='标题 5'] => h5:fresh",
            "p[style-name='标题 6'] => h6:fresh",
            // 其他可能的标题样式
            "p[style-name='Title'] => h1:fresh",
            "p[style-name='Subtitle'] => h2:fresh",
            "p[style-name='标题'] => h1:fresh",
            "p[style-name='副标题'] => h2:fresh",
            // 列表样式
            "p[style-name='List Paragraph'] => p:fresh",
            "p[style-name='列表段落'] => p:fresh"
        ],
        convertImage: mammoth.images.imgElement(function(image) {
            return image.read("base64").then(function(imageBuffer) {
                return {
                    src: "data:" + image.contentType + ";base64," + imageBuffer
                };
            });
        })
    };
    
    const result = await mammoth.convertToHtml(options);
    showProgress(80);
    
    currentResult = {
        type: 'html',
        html: result.value,
        messages: result.messages
    };
    
    // 显示HTML结果
    displayHtmlResult(result.value);
    showProgress(100);
    
    CommonUtils.showNotification('HTML转换成功！', 'success');
}

// 转换为Markdown
async function convertToMarkdown() {
    showProgress(20);
    
    const arrayBuffer = await currentFile.arrayBuffer();
    showProgress(40);
    
    // 先转换为HTML，使用相同的优化配置
    const options = {
        arrayBuffer: arrayBuffer,
        styleMap: [
            // 基于大纲级别的标题映射（更可靠）
            "p:outline-level(1) => h1:fresh",
            "p:outline-level(2) => h2:fresh",
            "p:outline-level(3) => h3:fresh",
            "p:outline-level(4) => h4:fresh",
            "p:outline-level(5) => h5:fresh",
            "p:outline-level(6) => h6:fresh",
            // 英文标题样式映射
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh", 
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Heading 4'] => h4:fresh",
            "p[style-name='Heading 5'] => h5:fresh",
            "p[style-name='Heading 6'] => h6:fresh",
            // 中文标题样式
            "p[style-name='标题 1'] => h1:fresh",
            "p[style-name='标题 2'] => h2:fresh",
            "p[style-name='标题 3'] => h3:fresh",
            "p[style-name='标题 4'] => h4:fresh",
            "p[style-name='标题 5'] => h5:fresh",
            "p[style-name='标题 6'] => h6:fresh",
            // 其他可能的标题样式
            "p[style-name='Title'] => h1:fresh",
            "p[style-name='Subtitle'] => h2:fresh",
            "p[style-name='标题'] => h1:fresh",
            "p[style-name='副标题'] => h2:fresh",
            // 列表样式
            "p[style-name='List Paragraph'] => p:fresh",
            "p[style-name='列表段落'] => p:fresh"
        ],
        convertImage: mammoth.images.imgElement(function(image) {
            return image.read("base64").then(function(imageBuffer) {
                return {
                    src: "data:" + image.contentType + ";base64," + imageBuffer
                };
            });
        })
    };
    
    const htmlResult = await mammoth.convertToHtml(options);
    showProgress(60);
    
    // 再转换为Markdown，优化转换规则
    const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-'
    });
    
    // 修复表格转换规则
    turndownService.addRule('tables', {
        filter: 'table',
        replacement: function (content, node) {
            const rows = Array.from(node.querySelectorAll('tr'));
            if (rows.length === 0) return '';
            
            let markdown = '\n';
            let hasHeader = false;
            
            rows.forEach((row, index) => {
                const cells = Array.from(row.querySelectorAll('td, th'));
                if (cells.length === 0) return;
                
                const cellContents = cells.map(cell => {
                    let text = cell.textContent || cell.innerText || '';
                    return text.trim().replace(/\|/g, '\\|').replace(/\n/g, ' ');
                });
                
                markdown += '| ' + cellContents.join(' | ') + ' |\n';
                
                // 检查是否有表头
                if (index === 0) {
                    hasHeader = row.querySelector('th') !== null;
                    if (hasHeader || index === 0) {
                        markdown += '|' + cells.map(() => ' --- ').join('|') + '|\n';
                    }
                }
            });
            
            return markdown + '\n';
        }
    });
    
    // 优化列表转换
    turndownService.addRule('lists', {
        filter: ['ul', 'ol'],
        replacement: function (content, node) {
            const isOrdered = node.tagName.toLowerCase() === 'ol';
            const items = Array.from(node.querySelectorAll('li'));
            
            let markdown = '\n';
            items.forEach((item, index) => {
                const marker = isOrdered ? `${index + 1}. ` : '- ';
                const text = item.textContent.trim();
                markdown += marker + text + '\n';
            });
            return markdown + '\n';
        }
    });
    
    // 移除base64图片，只保留图片占位符
    turndownService.addRule('images', {
        filter: 'img',
        replacement: function (content, node) {
            const src = node.getAttribute('src') || '';
            const alt = node.getAttribute('alt') || '图片';
            
            // 如果是base64图片，只返回占位符
            if (src.startsWith('data:')) {
                return `![${alt}](图片已移除)`;
            }
            
            // 保留外部链接图片
            return `![${alt}](${src})`;
        }
    });
    
    const markdown = turndownService.turndown(htmlResult.value);
    showProgress(80);
    
    currentResult = {
        type: 'markdown',
        markdown: markdown,
        html: htmlResult.value,
        messages: htmlResult.messages
    };
    
    // 显示Markdown结果
    displayMarkdownResult(markdown);
    showProgress(100);
    
    CommonUtils.showNotification('Markdown转换成功！', 'success');
}

// 显示预览
function displayPreview(html) {
    hideAllResults();
    
    const previewArea = document.getElementById('preview-area');
    const documentPreview = document.getElementById('document-preview');
    
    // 包裹一层“页面容器”，让内容在固定宽度内居中展示，模拟Word页面
    const wrapped = `
        <div class="docx-view">
            <div class="docx-page prose-docx">${html}</div>
        </div>
    `;
    documentPreview.innerHTML = wrapped;
    previewArea.classList.remove('hidden');
    
    updateResultTitle('文档预览');
    showResultActions();
}

// 显示HTML结果
function displayHtmlResult(html) {
    hideAllResults();
    
    const htmlResult = document.getElementById('html-result');
    const htmlPreview = document.getElementById('html-preview');
    const htmlTextarea = document.getElementById('html-textarea');
    
    htmlPreview.innerHTML = html;
    htmlTextarea.value = formatHtml(html);
    htmlResult.classList.remove('hidden');
    
    updateResultTitle('HTML转换结果');
    showResultActions();
}

// 显示Markdown结果
function displayMarkdownResult(markdown) {
    hideAllResults();
    
    const markdownResult = document.getElementById('markdown-result');
    const mdPreview = document.getElementById('md-preview');
    const mdTextarea = document.getElementById('markdown-textarea');
    
    // 使用marked渲染Markdown预览
    mdPreview.innerHTML = marked.parse(markdown);
    mdTextarea.value = markdown;
    markdownResult.classList.remove('hidden');
    
    updateResultTitle('Markdown转换结果');
    showResultActions();
}

// 隐藏所有结果区域
function hideAllResults() {
    document.getElementById('default-state').classList.add('hidden');
    document.getElementById('preview-area').classList.add('hidden');
    document.getElementById('html-result').classList.add('hidden');
    document.getElementById('markdown-result').classList.add('hidden');
}

// 更新结果标题
function updateResultTitle(title) {
    document.getElementById('result-title').textContent = title;
}

// 显示结果操作按钮
function showResultActions() {
    document.getElementById('result-actions').classList.remove('hidden');
}

// 初始化标签页切换
function initializeTabSwitching() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
            const tabId = e.target.getAttribute('data-tab');
            const container = e.target.closest('[id$="-result"]');
            
            if (container) {
                // 更新按钮状态
                container.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // 切换内容
                container.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.add('hidden');
                    content.classList.remove('active');
                });
                
                const targetContent = document.getElementById(tabId);
                if (targetContent) {
                    targetContent.classList.remove('hidden');
                    targetContent.classList.add('active');
                }
            }
        }
    });
}

// 初始化结果操作按钮
function initializeResultActions() {
    const copyTxtBtn = document.getElementById('copy-txt-btn');
    const copyMdBtn = document.getElementById('copy-md-btn');
    const copyHtmlBtn = document.getElementById('copy-html-btn');

    if (copyTxtBtn) {
        copyTxtBtn.addEventListener('click', () => {
            if (!currentResult || !currentResult.html) {
                CommonUtils.showNotification('没有可复制的内容！', 'warning');
                return;
            }
            const text = htmlToPlainText(currentResult.html);
            navigator.clipboard.writeText(text).then(() => {
                CommonUtils.showNotification('已复制为 TXT！', 'success');
            }).catch(() => {
                CommonUtils.showNotification('复制失败，请手动复制！', 'error');
            });
        });
    }

    if (copyMdBtn) {
        copyMdBtn.addEventListener('click', () => {
            if (!currentResult || !currentResult.html) {
                CommonUtils.showNotification('没有可复制的内容！', 'warning');
                return;
            }
            try {
                const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
                const md = turndownService.turndown(currentResult.html);
                navigator.clipboard.writeText(md).then(() => {
                    CommonUtils.showNotification('已复制为 Markdown！', 'success');
                }).catch(() => {
                    CommonUtils.showNotification('复制失败，请手动复制！', 'error');
                });
            } catch (e) {
                console.error(e);
                CommonUtils.showNotification('转换为 Markdown 失败！', 'error');
            }
        });
    }

    if (copyHtmlBtn) {
        copyHtmlBtn.addEventListener('click', () => {
            if (!currentResult || !currentResult.html) {
                CommonUtils.showNotification('没有可复制的内容！', 'warning');
                return;
            }
            const html = formatHtml(currentResult.html);
            navigator.clipboard.writeText(html).then(() => {
                CommonUtils.showNotification('已复制为 HTML！', 'success');
            }).catch(() => {
                CommonUtils.showNotification('复制失败，请手动复制！', 'error');
            });
        });
    }
}

// 下载结果
function downloadResult() {
    if (!currentResult) {
        CommonUtils.showNotification('没有可下载的内容！', 'warning');
        return;
    }
    
    let content, filename, mimeType;
    
    switch (currentResult.type) {
        case 'preview':
        case 'html':
            content = formatHtml(currentResult.html);
            filename = `${getFileNameWithoutExt(currentFile.name)}.html`;
            mimeType = 'text/html';
            break;
        case 'markdown':
            content = currentResult.markdown;
            filename = `${getFileNameWithoutExt(currentFile.name)}.md`;
            mimeType = 'text/markdown';
            break;
        default:
            CommonUtils.showNotification('未知的结果类型！', 'error');
            return;
    }
    
    window.FileHandler.downloadFile(content, filename, mimeType);
    CommonUtils.showNotification('文件下载成功！', 'success');
}

// 复制结果
function copyResult() {
    if (!currentResult) {
        CommonUtils.showNotification('没有可复制的内容！', 'warning');
        return;
    }
    
    let content;
    
    switch (currentResult.type) {
        case 'preview':
        case 'html':
            content = formatHtml(currentResult.html);
            break;
        case 'markdown':
            content = currentResult.markdown;
            break;
        default:
            CommonUtils.showNotification('未知的结果类型！', 'error');
            return;
    }
    
    navigator.clipboard.writeText(content).then(() => {
        CommonUtils.showNotification('内容已复制到剪贴板！', 'success');
    }).catch(() => {
        CommonUtils.showNotification('复制失败，请手动复制！', 'error');
    });
}

// 显示进度
function showProgress(percent) {
    const container = document.getElementById('progress-container');
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    
    container.classList.remove('hidden');
    fill.style.width = `${percent}%`;
    text.textContent = `${percent}%`;
}

// 隐藏进度
function hideProgress() {
    setTimeout(() => {
        document.getElementById('progress-container').classList.add('hidden');
    }, 1000);
}

// 格式化HTML
function formatHtml(html) {
    // 简单的HTML格式化
    return html
        .replace(/></g, '>\n<')
        .replace(/^\s+|\s+$/g, '')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
}

// 将 HTML 转为纯文本（用于复制为 TXT）
function htmlToPlainText(html) {
    try {
        const div = document.createElement('div');
        div.innerHTML = html;
        // 处理 <br> 和块级元素的换行
        const brToNewline = (node) => {
            node.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
            node.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, table, tr').forEach(el => {
                if (!el.textContent.endsWith('\n')) el.appendChild(document.createTextNode('\n'));
            });
        };
        brToNewline(div);
        const text = div.textContent || '';
        return text.replace(/\n{3,}/g, '\n\n').trim();
    } catch (e) {
        return html;
    }
}

// 获取不带扩展名的文件名
function getFileNameWithoutExt(filename) {
    return filename.replace(/\.[^/.]+$/, '');
}

// 获取文件后缀（包含点），如 .docx；若无扩展名返回空字符串
function getFileExtension(filename) {
    if (!filename) return '';
    const match = filename.match(/(\.[^.]+)$/);
    return match ? match[1].toLowerCase() : '';
}

// 添加样式
const additionalCSS = `
<style>
.process-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1rem;
    background: var(--pp-primary-600);
    color: #fff;
    border: 1px solid rgba(37, 99, 235, 0.25);
    border-radius: 0.5rem;
    font-weight: 500;
    transition: all 0.3s ease;
    cursor: pointer;
    box-shadow: var(--pp-shadow);
}

.process-btn:hover {
    background: var(--pp-primary-700);
    transform: translateY(-1px);
}

.process-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.tab-btn {
    padding: 0.75rem 1.5rem;
    border-bottom: 2px solid transparent;
    color: #6b7280;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

.tab-btn:hover {
    color: #3b82f6;
}

.tab-btn.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
}

.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
}

#document-preview,
#html-preview,
#md-preview {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
}

/* ====== 更贴近 Word 的预览样式 ====== */
/* 外层容器：负责水平居中并填充高度 */
.docx-view {
    display: flex;
    justify-content: center;
    height: 100%;
    overflow-y: auto;
    padding: 1rem 0;
}

/* 页面容器：固定页面宽度，白色背景与阴影，内边距模拟页边距 */
.docx-page {
    background: #ffffff;
    color: #111827;
    width: 816px; /* 约等于 A4 可用内容宽度（96dpi 下 ~8.5in - 页边距）*/
    max-width: 100%;
    box-shadow: 0 10px 25px rgba(0,0,0,0.08);
    border-radius: 6px;
    padding: 2.5rem; /* 页边距 */
    box-sizing: border-box; /* 确保 padding 不会撑大宽度 */
    min-height: fit-content; /* 允许内容自然展开 */
    margin-bottom: 1rem; /* 底部留白 */
}

/* 小屏时减少内边距，避免左右被挤压 */
@media (max-width: 640px) {
    .docx-page { padding: 1rem; }
}

/* 段落与文本排版 */
.prose-docx p { margin: 0 0 0.9rem; color: #1f2937; }
.prose-docx strong { font-weight: 700; }
.prose-docx em { font-style: italic; }

/* 标题层级（适度接近 Word 默认）*/
.prose-docx h1 { font-size: 1.875rem; font-weight: 700; margin: 1.2rem 0 0.8rem; color: #111827; }
.prose-docx h2 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.7rem; color: #111827; }
.prose-docx h3 { font-size: 1.25rem; font-weight: 600; margin: 0.9rem 0 0.6rem; color: #111827; }

/* 列表样式 */
.prose-docx ul { list-style: disc; padding-left: 1.5rem; margin: 0 0 0.9rem; }
.prose-docx ol { list-style: decimal; padding-left: 1.5rem; margin: 0 0 0.9rem; }
.prose-docx li { margin: 0.25rem 0; }

/* 表格样式 */
.prose-docx table { width: 100%; border-collapse: collapse; margin: 0.8rem 0; }
.prose-docx th, .prose-docx td { border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; text-align: left; }
.prose-docx th { background: #f9fafb; font-weight: 600; }

/* 图片自动适配页面宽度 */
.prose-docx img { max-width: 100%; height: auto; }

/* 代码块与行内代码 */
.prose-docx pre { background: #f3f4f6; padding: 0.75rem 1rem; border-radius: 6px; overflow: auto; }
.prose-docx code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }

/* 引用块 */
.prose-docx blockquote { border-left: 4px solid #e5e7eb; padding-left: 0.9rem; color: #6b7280; margin: 0.9rem 0; }

/* 页内分隔线 */
.prose-docx hr { border: 0; border-top: 1px solid #e5e7eb; margin: 1rem 0; }

.prose {
    max-width: none;
}

.prose h1 {
    font-size: 1.875rem;
    font-weight: 700;
    margin-bottom: 1rem;
}

.prose h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
}

.prose h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.prose p {
    margin-bottom: 1rem;
}

.prose ul,
.prose ol {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
}

.prose li {
    margin-bottom: 0.25rem;
}

.prose table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
}

.prose th,
.prose td {
    border: 1px solid #d1d5db;
    padding: 0.5rem;
    text-align: left;
}

.prose th {
    background-color: #f9fafb;
    font-weight: 600;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', additionalCSS);
