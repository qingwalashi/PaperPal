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
    
    // 处理按钮已移除，上传后自动预览
    
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
        allowedTypes: ['.doc', '.docx', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
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
    currentFile = file;
    
    // 显示文件信息
    displayFileInfo(file);
    // 上传后自动进行文档预览
    previewDocument().catch(err => {
        console.error(err);
        CommonUtils.showNotification('预览失败，请重试！', 'error');
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
    
    const arrayBuffer = await currentFile.arrayBuffer();
    showProgress(40);
    
    const result = await mammoth.convertToHtml({arrayBuffer: arrayBuffer});
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
    
    const result = await mammoth.convertToHtml({arrayBuffer: arrayBuffer});
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
    
    // 先转换为HTML
    const htmlResult = await mammoth.convertToHtml({arrayBuffer: arrayBuffer});
    showProgress(60);
    
    // 再转换为Markdown
    const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
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
    
    documentPreview.innerHTML = html;
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

#document-preview h1,
#html-preview h1,
#md-preview h1 {
    font-size: 1.875rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: #1f2937;
}

#document-preview h2,
#html-preview h2,
#md-preview h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: #374151;
}

#document-preview h3,
#html-preview h3,
#md-preview h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #4b5563;
}

#document-preview p,
#html-preview p,
#md-preview p {
    margin-bottom: 1rem;
    color: #6b7280;
}

#document-preview table,
#html-preview table,
#md-preview table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
}

#document-preview th,
#document-preview td,
#html-preview th,
#html-preview td,
#md-preview th,
#md-preview td {
    border: 1px solid #d1d5db;
    padding: 0.5rem;
    text-align: left;
}

#document-preview th,
#html-preview th,
#md-preview th {
    background-color: #f9fafb;
    font-weight: 600;
}

#document-preview ul,
#document-preview ol,
#html-preview ul,
#html-preview ol,
#md-preview ul,
#md-preview ol {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
}

#document-preview li,
#html-preview li,
#md-preview li {
    margin-bottom: 0.25rem;
}

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
