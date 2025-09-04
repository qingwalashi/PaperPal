// PDF处理功能实现
let currentFile = null;
let currentPdf = null;
let currentResult = null;
let extractedText = '';
let currentScale = 1.0;

// 设置PDF.js worker路径
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', function() {
    initializePdfProcessor();
});

function initializePdfProcessor() {
    // 设置导航活动项
    if (window.navigation) {
        window.navigation.updateActiveNavItem('pdf-processor');
    }

    // 初始化文件上传
    initializeFileUpload();
    
    // 初始化复制按钮
    initializeCopyButtons();
    
    // 同步预览区域高度
    syncPreviewHeight();
    window.addEventListener('resize', syncPreviewHeight);
}

// 初始化文件上传
function initializeFileUpload() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const uploadButton = uploadZone.querySelector('button');
    
    // 点击上传按钮
    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 文件选择事件
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    // 拖拽上传
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    
    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        const pdfFile = files.find(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
        
        if (pdfFile) {
            handleFileUpload(pdfFile);
        } else {
            showNotification('请上传PDF文件！', 'error');
        }
    });
}

// 处理文件上传
async function handleFileUpload(file) {
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        showNotification('仅支持 PDF 文件！', 'error');
        return;
    }
    
    currentFile = file;
    
    // 显示文件信息
    displayFileInfo(file);
    
    try {
        // 自动预览文档
        await previewDocument();
        
        // 同步预览区域高度
        syncPreviewHeight();
        
        showNotification('PDF文件加载成功！', 'success');
    } catch (error) {
        console.error('处理PDF文件时出错:', error);
        showNotification('PDF文件处理失败：' + error.message, 'error');
    }
}

// 显示文件信息
function displayFileInfo(file) {
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    
    fileName.textContent = file.name;
    fileName.title = file.name;
    fileSize.textContent = formatFileSize(file.size);
    
    fileInfo.classList.remove('hidden');
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 预览PDF文档
async function previewDocument() {
    showProgress(20);
    
    // 验证文件类型
    if (!currentFile.type.includes('pdf') && !currentFile.name.toLowerCase().endsWith('.pdf')) {
        showProgress(0);
        throw new Error('仅支持 PDF 文件');
    }

    const arrayBuffer = await currentFile.arrayBuffer();
    showProgress(40);
    
    try {
        // 加载PDF文档
        const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
        currentPdf = await loadingTask.promise;
        
        showProgress(60);
        
        // 获取页数
        const numPages = currentPdf.numPages;
        document.getElementById('page-count').textContent = numPages;
        
        // 提取所有页面的文本
        extractedText = '';
        for (let i = 1; i <= numPages; i++) {
            const page = await currentPdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            extractedText += pageText + '\n\n';
        }
        
        showProgress(80);
        
        // 初始化缩放级别
        currentScale = 1.0;
        updateZoomLevel();
        
        // 渲染预览
        await renderPdfPreview();
        
        showProgress(100);
        
        currentResult = {
            type: 'preview',
            text: extractedText.trim()
        };
        
        displayPreview();
        
    } catch (error) {
        console.error('PDF处理错误:', error);
        throw new Error('PDF文件损坏或格式不支持');
    }
}

// 渲染PDF预览
async function renderPdfPreview() {
    if (!currentPdf) return;
    
    const previewContainer = document.getElementById('document-preview');
    previewContainer.innerHTML = '';
    
    // 渲染所有页面，支持滚动查看
    for (let pageNum = 1; pageNum <= currentPdf.numPages; pageNum++) {
        const page = await currentPdf.getPage(pageNum);
        const viewport = page.getViewport({scale: currentScale || 1.0});
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.className = 'pdf-page';
        canvas.style.display = 'block';
        canvas.style.margin = '10px auto';
        canvas.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        canvas.style.border = '1px solid #ddd';
        
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        previewContainer.appendChild(canvas);
    }
}

// 显示预览
function displayPreview() {
    hideAllResults();
    
    const previewArea = document.getElementById('preview-area');
    previewArea.classList.remove('hidden');
    
    updateResultTitle('PDF预览');
    showResultActions();
}

// 隐藏所有结果区域
function hideAllResults() {
    document.getElementById('default-state').classList.add('hidden');
    document.getElementById('preview-area').classList.add('hidden');
}

// 更新结果标题
function updateResultTitle(title) {
    document.getElementById('result-title').textContent = title;
}

// 显示结果操作按钮
function showResultActions() {
    document.getElementById('result-actions').classList.remove('hidden');
}

// 隐藏结果操作按钮
function hideResultActions() {
    document.getElementById('result-actions').classList.add('hidden');
}

// 初始化复制按钮和PDF控制按钮
function initializeCopyButtons() {
    // 复制为TXT
    document.getElementById('copy-txt-btn').addEventListener('click', async () => {
        if (!currentResult || !currentResult.text) {
            showNotification('没有可复制的文本内容！', 'warning');
            return;
        }
        
        try {
            await copyToClipboard(currentResult.text);
            showNotification('文本已复制到剪贴板！', 'success');
        } catch (error) {
            console.error('复制失败:', error);
            showNotification('复制失败，请手动选择复制', 'error');
        }
    });
    
    // PDF控制按钮
    document.getElementById('fit-width-btn').addEventListener('click', () => {
        fitToWidth();
    });
    
    document.getElementById('fit-page-btn').addEventListener('click', () => {
        fitToPage();
    });
    
    document.getElementById('zoom-in-btn').addEventListener('click', () => {
        zoomIn();
    });
    
    document.getElementById('zoom-out-btn').addEventListener('click', () => {
        zoomOut();
    });
}

// 复制到剪贴板
async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
    } else {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
    }
}

// PDF缩放功能
function zoomIn() {
    currentScale = Math.min(currentScale * 1.25, 3.0);
    updateZoomLevel();
    renderPdfPreview();
}

function zoomOut() {
    currentScale = Math.max(currentScale / 1.25, 0.25);
    updateZoomLevel();
    renderPdfPreview();
}

function fitToWidth() {
    if (!currentPdf) return;
    
    const previewContainer = document.getElementById('document-preview');
    const containerWidth = previewContainer.clientWidth - 40; // 减去padding
    
    currentPdf.getPage(1).then(page => {
        const viewport = page.getViewport({scale: 1.0});
        currentScale = containerWidth / viewport.width;
        updateZoomLevel();
        renderPdfPreview();
    });
}

function fitToPage() {
    if (!currentPdf) return;
    
    const previewContainer = document.getElementById('document-preview');
    const containerWidth = previewContainer.clientWidth - 40;
    const containerHeight = previewContainer.clientHeight - 40;
    
    currentPdf.getPage(1).then(page => {
        const viewport = page.getViewport({scale: 1.0});
        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        currentScale = Math.min(scaleX, scaleY);
        updateZoomLevel();
        renderPdfPreview();
    });
}

function updateZoomLevel() {
    const zoomLevel = document.getElementById('zoom-level');
    if (zoomLevel) {
        zoomLevel.textContent = Math.round(currentScale * 100) + '%';
    }
}

// 同步预览区域高度
function syncPreviewHeight() {
    const uploadCard = document.querySelector('.upload-section .bg-white');
    const previewCard = document.getElementById('preview-card');
    
    if (uploadCard && previewCard) {
        const uploadHeight = uploadCard.offsetHeight;
        previewCard.style.height = uploadHeight + 'px';
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 transition-opacity duration-300`;
    
    switch (type) {
        case 'success':
            notification.classList.add('bg-green-500');
            break;
        case 'error':
            notification.classList.add('bg-red-500');
            break;
        case 'warning':
            notification.classList.add('bg-yellow-500');
            break;
        default:
            notification.classList.add('bg-blue-500');
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
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

// 初始化控制按钮
function initializeControls() {
    // 页面导航
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage(currentPage);
            updatePageNavigation();
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderPage(currentPage);
            updatePageNavigation();
        }
    });
    
    document.getElementById('go-to-page').addEventListener('click', () => {
        const pageInput = document.getElementById('current-page');
        const targetPage = parseInt(pageInput.value);
        
        if (targetPage >= 1 && targetPage <= totalPages) {
            currentPage = targetPage;
            renderPage(currentPage);
            updatePageNavigation();
        } else {
            CommonUtils.showNotification('请输入有效的页码！', 'warning');
            pageInput.value = currentPage;
        }
    });
    
    // 页码输入框回车事件
    document.getElementById('current-page').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('go-to-page').click();
        }
    });
    
    // 缩放控制
    document.getElementById('zoom-in').addEventListener('click', () => {
        zoomIn();
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => {
        zoomOut();
    });
    
    document.getElementById('fit-width').addEventListener('click', () => {
        fitToWidth();
    });
    
    // 缩放预设
    document.querySelectorAll('.zoom-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const zoom = parseFloat(btn.getAttribute('data-zoom'));
            setZoom(zoom);
        });
    });
    
    // 工具按钮
    document.getElementById('download-pdf').addEventListener('click', () => {
        downloadPdf();
    });
    
    document.getElementById('print-pdf').addEventListener('click', () => {
        printPdf();
    });
    
    // 重试按钮
    document.getElementById('retry-load').addEventListener('click', () => {
        if (pdfData) {
            loadPdfDocument(pdfData);
        }
    });
    
    // 视图模式切换
    document.getElementById('single-page-mode').addEventListener('click', () => {
        setViewMode('single');
    });
    
    document.getElementById('continuous-mode').addEventListener('click', () => {
        setViewMode('continuous');
    });
}

// 初始化键盘事件
function initializeKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
        if (!currentPdf) return;
        
        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                if (currentPage > 1) {
                    currentPage--;
                    renderPage(currentPage);
                    updatePageNavigation();
                }
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                if (currentPage < totalPages) {
                    currentPage++;
                    renderPage(currentPage);
                    updatePageNavigation();
                }
                break;
            case 'Home':
                e.preventDefault();
                currentPage = 1;
                renderPage(currentPage);
                updatePageNavigation();
                break;
            case 'End':
                e.preventDefault();
                currentPage = totalPages;
                renderPage(currentPage);
                updatePageNavigation();
                break;
            case '+':
            case '=':
                if (e.ctrlKey) {
                    e.preventDefault();
                    zoomIn();
                }
                break;
            case '-':
                if (e.ctrlKey) {
                    e.preventDefault();
                    zoomOut();
                }
                break;
            case '0':
                if (e.ctrlKey) {
                    e.preventDefault();
                    setZoom(1.0);
                }
                break;
        }
    });
    
    // 鼠标滚轮缩放
    document.getElementById('pdf-viewer').addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            if (e.deltaY < 0) {
                zoomIn();
            } else {
                zoomOut();
            }
        }
    });
}

// 缩放功能
function zoomIn() {
    const newScale = Math.min(currentScale * 1.25, 3.0);
    setZoom(newScale);
}

function zoomOut() {
    const newScale = Math.max(currentScale / 1.25, 0.25);
    setZoom(newScale);
}

function setZoom(scale) {
    currentScale = scale;
    updateZoomLevel();
    renderPage(currentPage);
}

function fitToWidth() {
    const viewer = document.getElementById('pdf-viewer');
    const viewerWidth = viewer.clientWidth - 40; // 减去padding
    
    if (currentPdf) {
        currentPdf.getPage(currentPage).then(page => {
            const viewport = page.getViewport({scale: 1.0});
            const scale = viewerWidth / viewport.width;
            setZoom(scale);
        });
    }
}

// 更新页面导航状态
function updatePageNavigation() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

// 更新缩放级别显示
function updateZoomLevel() {
    const zoomLevel = document.getElementById('zoom-level');
    zoomLevel.textContent = Math.round(currentScale * 100) + '%';
}

// 下载PDF
function downloadPdf() {
    if (!pdfData) {
        CommonUtils.showNotification('没有可下载的PDF文件！', 'warning');
        return;
    }
    
    const blob = new Blob([pdfData], {type: 'application/pdf'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    CommonUtils.showNotification('PDF文件下载成功！', 'success');
}

// 打印PDF
function printPdf() {
    if (!pdfData) {
        CommonUtils.showNotification('没有可打印的PDF文件！', 'warning');
        return;
    }
    
    const blob = new Blob([pdfData], {type: 'application/pdf'});
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url);
    
    printWindow.addEventListener('load', () => {
        printWindow.print();
    });
    
    CommonUtils.showNotification('正在准备打印...', 'info');
}

// 设置视图模式
function setViewMode(mode) {
    const singleBtn = document.getElementById('single-page-mode');
    const continuousBtn = document.getElementById('continuous-mode');
    
    if (mode === 'single') {
        singleBtn.classList.add('bg-white', 'text-gray-700', 'shadow-sm');
        singleBtn.classList.remove('text-gray-500');
        continuousBtn.classList.remove('bg-white', 'text-gray-700', 'shadow-sm');
        continuousBtn.classList.add('text-gray-500');
    } else {
        continuousBtn.classList.add('bg-white', 'text-gray-700', 'shadow-sm');
        continuousBtn.classList.remove('text-gray-500');
        singleBtn.classList.remove('bg-white', 'text-gray-700', 'shadow-sm');
        singleBtn.classList.add('text-gray-500');
    }
    
    // TODO: 实现连续模式渲染
    if (mode === 'continuous') {
        CommonUtils.showNotification('连续模式功能开发中...', 'info');
    }
}

// 显示控制面板
function showControls() {
    document.getElementById('page-navigation').classList.remove('hidden');
    document.getElementById('zoom-controls').classList.remove('hidden');
    document.getElementById('pdf-tools').classList.remove('hidden');
    document.getElementById('view-mode-toggle').classList.remove('hidden');
}

// 显示PDF容器
function showPdfContainer() {
    document.getElementById('default-state').classList.add('hidden');
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('error-state').classList.add('hidden');
    document.getElementById('pdf-container').classList.remove('hidden');
}

// 显示加载状态
function showLoadingState() {
    document.getElementById('default-state').classList.add('hidden');
    document.getElementById('pdf-container').classList.add('hidden');
    document.getElementById('error-state').classList.add('hidden');
    document.getElementById('loading-state').classList.remove('hidden');
    
    showProgress(0);
}

// 显示错误状态
function showErrorState(message) {
    document.getElementById('default-state').classList.add('hidden');
    document.getElementById('pdf-container').classList.add('hidden');
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('error-state').classList.remove('hidden');
    
    document.getElementById('error-message').textContent = message;
    hideProgress();
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

// 添加样式
const additionalCSS = `
<style>
#pdf-viewer {
    min-height: 400px;
    background: #f8fafc;
    border-radius: 0.5rem;
    padding: 1rem;
}

#pdf-viewer canvas {
    display: block;
    margin: 0 auto;
    max-width: 100%;
    height: auto;
}

.zoom-preset.active {
    background: #3b82f6 !important;
    color: white !important;
}

/* 滚动条样式 */
#pdf-viewer::-webkit-scrollbar {
    width: 8px;
}

#pdf-viewer::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

#pdf-viewer::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
}

#pdf-viewer::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* 页面输入框样式 */
#current-page {
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
}

#current-page:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
}

/* 按钮禁用状态 */
button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

button:disabled:hover {
    transform: none !important;
    box-shadow: none !important;
}

/* 加载动画 */
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading {
    display: inline-block;
    width: 2rem;
    height: 2rem;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', additionalCSS);
