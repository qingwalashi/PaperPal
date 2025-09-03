// PDF处理功能实现
let currentPdf = null;
let currentPage = 1;
let totalPages = 0;
let currentScale = 1.0;
let pdfData = null;
let renderTask = null;

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
    
    // 初始化控制按钮
    initializeControls();
    
    // 初始化键盘事件
    initializeKeyboardEvents();
}

// 初始化文件上传
function initializeFileUpload() {
    const uploadZone = document.getElementById('upload-zone');

    // 创建拖拽上传功能
    window.FileHandler.createDropZone(uploadZone, {
        inputId: 'file-input',
        allowedTypes: ['.pdf', 'application/pdf'],
        maxSize: 50 * 1024 * 1024, // 50MB
        multiple: false,
        onDrop: handleFileUpload,
        onError: (errors) => {
            errors.forEach(error => CommonUtils.showNotification(error, 'error'));
        }
    });
}

// 处理文件上传
async function handleFileUpload(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // 显示文件信息
    displayFileInfo(file);
    
    // 显示加载状态
    showLoadingState();
    
    try {
        // 读取PDF文件
        const arrayBuffer = await file.arrayBuffer();
        pdfData = new Uint8Array(arrayBuffer);
        
        // 加载PDF文档
        await loadPdfDocument(pdfData);
        
        CommonUtils.showNotification('PDF文件加载成功！', 'success');
    } catch (error) {
        console.error('加载PDF文件时出错:', error);
        showErrorState('PDF文件加载失败，请检查文件格式是否正确');
        CommonUtils.showNotification('PDF文件加载失败！', 'error');
    }
}

// 显示文件信息
function displayFileInfo(file) {
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    
    fileName.textContent = file.name;
    fileName.title = file.name; // 添加tooltip显示完整文件名
    fileSize.textContent = CommonUtils.formatFileSize(file.size);
    
    fileInfo.classList.remove('hidden');
}

// 加载PDF文档
async function loadPdfDocument(data) {
    showProgress(20);
    
    try {
        // 加载PDF
        const loadingTask = pdfjsLib.getDocument({data: data});
        currentPdf = await loadingTask.promise;
        
        showProgress(50);
        
        // 获取页数
        totalPages = currentPdf.numPages;
        document.getElementById('page-count').textContent = totalPages;
        document.getElementById('total-pages').textContent = totalPages;
        
        // 重置页面状态
        currentPage = 1;
        currentScale = 1.0;
        
        // 更新UI
        updatePageNavigation();
        updateZoomLevel();
        
        showProgress(80);
        
        // 渲染第一页
        await renderPage(currentPage);
        
        showProgress(100);
        
        // 显示控制面板
        showControls();
        
        // 显示PDF容器
        showPdfContainer();
        
        // 隐藏进度条
        hideProgress();
        
    } catch (error) {
        console.error('PDF加载错误:', error);
        showErrorState('PDF文件损坏或格式不支持');
        throw error;
    }
}

// 渲染页面
async function renderPage(pageNum) {
    if (!currentPdf || pageNum < 1 || pageNum > totalPages) {
        return;
    }
    
    try {
        // 取消之前的渲染任务
        if (renderTask) {
            renderTask.cancel();
        }
        
        // 获取页面
        const page = await currentPdf.getPage(pageNum);
        
        // 计算视口
        const viewport = page.getViewport({scale: currentScale});
        
        // 创建canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // 添加样式
        canvas.style.border = '1px solid #e5e7eb';
        canvas.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        canvas.style.marginBottom = '1rem';
        
        // 渲染页面
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        renderTask = page.render(renderContext);
        await renderTask.promise;
        
        // 更新预览区域
        const viewer = document.getElementById('pdf-viewer');
        viewer.innerHTML = '';
        viewer.appendChild(canvas);
        
        // 更新当前页面输入框
        document.getElementById('current-page').value = pageNum;
        
    } catch (error) {
        if (error.name !== 'RenderingCancelledException') {
            console.error('页面渲染错误:', error);
            CommonUtils.showNotification('页面渲染失败！', 'error');
        }
    }
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
