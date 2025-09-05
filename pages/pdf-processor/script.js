// PDF处理功能实现
let currentFile = null;
let currentPdf = null;
let currentResult = null;
let extractedText = '';
let currentScale = 1.0;
let currentPage = 1;
let totalPages = 0;
let viewMode = 'single'; // 'continuous' 或 'single'
let rotation = 0; // 0, 90, 180, 270
// 叠加文字配置
const overlayConfig = {
    text: '示例文字',
    fontSize: 48, // px, 最大 200
    vOffset: 0 // px，单边控制，另一侧对称
};

// 设置PDF.js worker路径
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', function() {
    initializePdfProcessor();
});

// 初始化叠加文字控制（顶层定义）
function initializeOverlayControls() {
    const textInput = document.getElementById('overlay-text');
    const fontSizeRange = document.getElementById('overlay-font-size');
    const fontSizeVal = document.getElementById('overlay-font-size-val');
    const vOffsetRange = document.getElementById('overlay-v-offset');
    const vOffsetVal = document.getElementById('overlay-v-offset-val');

    if (!textInput || !fontSizeRange || !vOffsetRange) return;

    // 初始化显示
    textInput.value = overlayConfig.text || '';
    fontSizeRange.min = '10';
    fontSizeRange.max = '200';
    fontSizeRange.value = overlayConfig.fontSize;
    if (fontSizeVal) fontSizeVal.textContent = overlayConfig.fontSize + 'px';
    vOffsetRange.value = overlayConfig.vOffset;
    if (vOffsetVal) vOffsetVal.textContent = overlayConfig.vOffset + 'px';

    textInput.addEventListener('input', () => {
        overlayConfig.text = textInput.value;
        updateAllOverlays();
    });

    fontSizeRange.addEventListener('input', () => {
        const raw = parseInt(fontSizeRange.value || '48', 10);
        const val = isNaN(raw) ? 48 : raw;
        overlayConfig.fontSize = Math.min(200, Math.max(10, val));
        if (fontSizeVal) fontSizeVal.textContent = overlayConfig.fontSize + 'px';
        updateAllOverlays();
    });

    vOffsetRange.addEventListener('input', () => {
        const raw = parseInt(vOffsetRange.value || '0', 10);
        overlayConfig.vOffset = isNaN(raw) ? 0 : raw;
        if (vOffsetVal) vOffsetVal.textContent = overlayConfig.vOffset + 'px';
        updateAllOverlays();
    });
}

function initializePdfProcessor() {
    // 设置导航活动项
    if (window.navigation) {
        window.navigation.updateActiveNavItem('pdf-processor');
    }

    // 初始化文件上传
    initializeFileUpload();
    
    // 初始化复制按钮和PDF控制
    initializeCopyButtons();
    
    // 初始化PDF导航控制
    initializePdfNavigation();
    
    // 初始化键盘导航
    initializeKeyboardNavigation();
    
    // 初始化视图模式控制
    initializeViewModeControls();
    
    // 初始化缩放选择器
    initializeZoomSelector();
    
    // 初始化叠加文字控制
    initializeOverlayControls();
    
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
        totalPages = currentPdf.numPages;
        currentPage = 1;
        document.getElementById('page-count').textContent = totalPages;
        document.getElementById('total-pages').textContent = totalPages;
        document.getElementById('current-page-input').value = currentPage;
        document.getElementById('current-page-input').max = totalPages;
        
        // 提取所有页面的文本
        extractedText = '';
        for (let i = 1; i <= totalPages; i++) {
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
    
    showPdfLoading(true);
    
    const pagesContainer = document.getElementById('pdf-pages-container');
    pagesContainer.innerHTML = '';
    
    try {
        if (viewMode === 'continuous') {
            // 连续模式：渲染所有页面
            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                await renderSinglePage(pageNum, pagesContainer);
            }
        } else {
            // 单页模式：只渲染当前页面
            await renderSinglePage(currentPage, pagesContainer);
        }
    } finally {
        showPdfLoading(false);
    }
}

// 显示/隐藏加载指示器
function showPdfLoading(show) {
    const loadingEl = document.getElementById('pdf-loading');
    if (show) {
        loadingEl.classList.remove('hidden');
    } else {
        loadingEl.classList.add('hidden');
    }
}

// 渲染单个页面
async function renderSinglePage(pageNum, container) {
    const page = await currentPdf.getPage(pageNum);
    const viewport = page.getViewport({scale: currentScale || 1.0, rotation: rotation});
    
    const pageContainer = document.createElement('div');
    pageContainer.className = 'pdf-page-container';
    pageContainer.style.cssText = `
        text-align: center;
        margin-bottom: ${viewMode === 'continuous' ? '24px' : '0'};
        position: relative;
    `;
    
    // 页码标签（仅连续模式）
    if (viewMode === 'continuous') {
        const pageLabel = document.createElement('div');
        pageLabel.className = 'page-label';
        pageLabel.textContent = `第 ${pageNum} 页`;
        pageLabel.style.cssText = `
            margin-bottom: 12px;
            color: #6b7280;
            font-size: 13px;
            font-weight: 500;
            background: #f9fafb;
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
        `;
        pageContainer.appendChild(pageLabel);
    }
    
    // 页面外框
    const pageWrapper = document.createElement('div');
    pageWrapper.style.cssText = `
        display: inline-block;
        background: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-radius: 8px;
        padding: 8px;
        margin: 0 auto;
    `;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.className = 'pdf-page';
    canvas.style.cssText = `
        display: block;
        border-radius: 4px;
        max-width: 100%;
        height: auto;
    `;
    canvas.dataset.pageNum = pageNum;
    
    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };
    
    await page.render(renderContext).promise;
    pageWrapper.appendChild(canvas);
    pageContainer.appendChild(pageWrapper);
    container.appendChild(pageContainer);

    // 渲染/更新本页叠加文字层
    createOrUpdateOverlayForPage(pageContainer, canvas);
}

// 为某页创建或更新叠加文字层（上下对称，单滑块控制）
function createOrUpdateOverlayForPage(pageContainer, canvas) {
    if (!pageContainer || !canvas) return;

    // 确保wrapper相对定位
    const wrapper = canvas.parentElement;
    if (wrapper && getComputedStyle(wrapper).position === 'static') {
        wrapper.style.position = 'relative';
    }

    // 获取/创建容器
    let overlay = wrapper.querySelector('.overlay-text-container');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'overlay-text-container';
        overlay.style.cssText = `
            position: absolute;
            inset: 0;
            pointer-events: none;
        `;
        wrapper.appendChild(overlay);
    }

    // 获取/创建上下两块文本
    let topText = overlay.querySelector('.overlay-text-top');
    let bottomText = overlay.querySelector('.overlay-text-bottom');
    if (!topText) {
        topText = document.createElement('div');
        topText.className = 'overlay-text-top';
        overlay.appendChild(topText);
    }
    if (!bottomText) {
        bottomText = document.createElement('div');
        bottomText.className = 'overlay-text-bottom';
        overlay.appendChild(bottomText);
    }

    // 通用样式
    const commonCss = `
        position: absolute;
        left: 50%;
        transform: translate(-50%, -50%);
        white-space: nowrap;
        color: rgba(0,0,0,0.85);
        text-shadow: 0 1px 2px rgba(255,255,255,0.6);
        font-weight: 600;
        line-height: 1;
        user-select: none;
    `;

    // 画布尺寸（已按当前缩放）
    const h = canvas.height;

    // 按要求：仅单边控制纵向位移，另一半对称
    const v = overlayConfig.vOffset || 0; // px
    const topY = h / 2 - v;     // 上半：向下为正值时靠近中心
    const bottomY = h / 2 + v;  // 下半：对称

    // 应用文本与样式
    [topText, bottomText].forEach(el => {
        el.textContent = overlayConfig.text || '';
        el.style.fontSize = (overlayConfig.fontSize || 48) + 'px';
        el.style.cssText = commonCss + el.style.cssText;
    });

    topText.style.top = topY + 'px';
    bottomText.style.top = bottomY + 'px';
}

// 更新所有页面上的叠加层
function updateAllOverlays() {
    const containers = document.querySelectorAll('#pdf-pages-container .pdf-page-container');
    containers.forEach(container => {
        const canvas = container.querySelector('canvas.pdf-page');
        if (canvas) {
            createOrUpdateOverlayForPage(container, canvas);
        }
    });
}

// 显示预览
function displayPreview() {
    hideAllResults();
    
    const previewArea = document.getElementById('preview-area');
    const pdfControls = document.getElementById('pdf-controls');
    
    previewArea.classList.remove('hidden');
    pdfControls.classList.remove('hidden');
    
    updateResultTitle('PDF预览');
    showResultActions();
    
    // 更新页面信息
    updatePageNavigation();
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

// 初始化复制按钮
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
    
    // 缩放按钮（这些按钮在新的工具栏中）
    document.getElementById('zoom-in-btn').addEventListener('click', () => {
        zoomIn();
    });
    
    document.getElementById('zoom-out-btn').addEventListener('click', () => {
        zoomOut();
    });
}

// 初始化视图模式控制
function initializeViewModeControls() {
    const singlePageBtn = document.getElementById('single-page-mode');
    const continuousBtn = document.getElementById('continuous-mode');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    
    // 单页模式
    singlePageBtn.addEventListener('click', () => {
        setViewMode('single');
    });
    
    // 连续模式
    continuousBtn.addEventListener('click', () => {
        setViewMode('continuous');
    });
    
    // 全屏模式
    fullscreenBtn.addEventListener('click', () => {
        toggleFullscreen();
    });

    // 监听全屏状态变化
    document.addEventListener('fullscreenchange', syncFullscreenUI);
    document.addEventListener('webkitfullscreenchange', syncFullscreenUI);
    document.addEventListener('msfullscreenchange', syncFullscreenUI);
    
    // 初始化UI状态
    syncFullscreenUI();
}

// 初始化缩放选择器
function initializeZoomSelector() {
    const zoomSelect = document.getElementById('zoom-select');
    
    zoomSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        
        if (value === 'fit-width') {
            fitToWidth();
        } else if (value === 'fit-page') {
            fitToPage();
        } else if (value === 'auto') {
            autoFit();
        } else {
            const scale = parseFloat(value);
            setZoom(scale);
        }
    });
}

// 设置视图模式
function setViewMode(mode) {
    viewMode = mode;
    
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
    
    if (currentPdf) {
        renderPdfPreview();
    }
}

// 切换全屏模式
function toggleFullscreen() {
    const previewArea = document.getElementById('preview-area');
    
    // 检查当前是否已处于全屏模式
    const isDocInFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;

    if (!isDocInFullscreen) {
        // 进入全屏
        if (previewArea.requestFullscreen) {
            previewArea.requestFullscreen();
        } else if (previewArea.webkitRequestFullscreen) { /* Safari */
            previewArea.webkitRequestFullscreen();
        } else if (previewArea.msRequestFullscreen) { /* IE11 */
            previewArea.msRequestFullscreen();
        }
    } else {
        // 退出全屏
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
    }
}

// 同步全屏UI状态
function syncFullscreenUI() {
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const icon = fullscreenBtn.querySelector('i');
    const isDocInFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;

    if (isDocInFullscreen) {
        icon.className = 'bi bi-fullscreen-exit text-sm';
    } else {
        icon.className = 'bi bi-fullscreen text-sm';
    }
}

// 设置缩放
function setZoom(scale) {
    currentScale = scale;
    updateZoomSelector();
    renderPdfPreview();
}

// 自动适应
function autoFit() {
    if (!currentPdf) return;
    
    const container = document.getElementById('document-preview');
    const containerWidth = container.clientWidth - 32; // 减去padding
    const containerHeight = container.clientHeight - 32;
    
    currentPdf.getPage(1).then(page => {
        const viewport = page.getViewport({scale: 1.0, rotation: rotation});
        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        const scale = Math.min(scaleX, scaleY, 2.0); // 限制最大缩放
        setZoom(scale);
    });
}

// 更新缩放选择器
function updateZoomSelector() {
    const zoomSelect = document.getElementById('zoom-select');
    const currentValue = currentScale.toString();
    
    // 检查是否有匹配的选项
    const option = zoomSelect.querySelector(`option[value="${currentValue}"]`);
    if (option) {
        zoomSelect.value = currentValue;
    } else {
        // 添加自定义缩放值
        const customOption = document.createElement('option');
        customOption.value = currentValue;
        customOption.textContent = Math.round(currentScale * 100) + '%';
        customOption.selected = true;
        
        // 插入到适当位置
        const options = Array.from(zoomSelect.options);
        let inserted = false;
        for (let i = 0; i < options.length; i++) {
            const optionValue = parseFloat(options[i].value);
            if (!isNaN(optionValue) && currentScale < optionValue) {
                zoomSelect.insertBefore(customOption, options[i]);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            zoomSelect.appendChild(customOption);
        }
    }
}

// 初始化PDF导航控制
function initializePdfNavigation() {
    // 首页按钮
    document.getElementById('first-page-btn').addEventListener('click', () => {
        goToPage(1);
    });
    
    // 上一页按钮
    document.getElementById('prev-page-btn').addEventListener('click', () => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    });
    
    // 下一页按钮
    document.getElementById('next-page-btn').addEventListener('click', () => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    });
    
    // 末页按钮
    document.getElementById('last-page-btn').addEventListener('click', () => {
        goToPage(totalPages);
    });
    
    // 页码输入框
    const pageInput = document.getElementById('current-page-input');
    pageInput.addEventListener('change', () => {
        const pageNum = parseInt(pageInput.value);
        if (pageNum >= 1 && pageNum <= totalPages) {
            goToPage(pageNum);
        } else {
            pageInput.value = currentPage;
            showNotification('请输入有效的页码！', 'warning');
        }
    });
    
    pageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            pageInput.blur();
        }
    });
}

// 初始化键盘导航
function initializeKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (!currentPdf || document.activeElement.tagName === 'INPUT') return;
        
        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
            case 'PageUp':
                e.preventDefault();
                if (currentPage > 1) {
                    goToPage(currentPage - 1);
                }
                break;
            case 'ArrowRight':
            case 'ArrowDown':
            case 'PageDown':
                e.preventDefault();
                if (currentPage < totalPages) {
                    goToPage(currentPage + 1);
                }
                break;
            case 'Home':
                e.preventDefault();
                goToPage(1);
                break;
            case 'End':
                e.preventDefault();
                goToPage(totalPages);
                break;
            case '+':
            case '=':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    zoomIn();
                }
                break;
            case '-':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    zoomOut();
                }
                break;
            case '0':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    currentScale = 1.0;
                    updateZoomLevel();
                    renderPdfPreview();
                }
                break;
        }
    });
    
    // 鼠标滚轮缩放
    document.getElementById('document-preview').addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.deltaY < 0) {
                zoomIn();
            } else {
                zoomOut();
            }
        }
    });
    
    // 滚动位置检测（用于连续模式下更新当前页面）
    let scrollTimeout;
    document.getElementById('document-preview').addEventListener('scroll', () => {
        if (viewMode !== 'continuous') return;
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            updateCurrentPageFromScroll();
        }, 100);
    });
}

// 根据滚动位置更新当前页面
function updateCurrentPageFromScroll() {
    const previewContainer = document.getElementById('document-preview');
    const containerTop = previewContainer.scrollTop;
    const containerHeight = previewContainer.clientHeight;
    const centerY = containerTop + containerHeight / 2;
    
    const pages = previewContainer.querySelectorAll('.pdf-page-container');
    let newCurrentPage = 1;
    
    for (let i = 0; i < pages.length; i++) {
        const pageContainer = pages[i];
        const pageTop = pageContainer.offsetTop;
        const pageBottom = pageTop + pageContainer.offsetHeight;
        
        if (centerY >= pageTop && centerY <= pageBottom) {
            newCurrentPage = i + 1;
            break;
        }
    }
    
    if (newCurrentPage !== currentPage) {
        currentPage = newCurrentPage;
        document.getElementById('current-page-input').value = currentPage;
        updatePageNavigation();
    }
}

// 跳转到指定页面
function goToPage(pageNum) {
    if (pageNum < 1 || pageNum > totalPages || pageNum === currentPage) {
        return;
    }
    
    currentPage = pageNum;
    document.getElementById('current-page-input').value = currentPage;
    
    if (viewMode === 'single') {
        renderPdfPreview();
    } else {
        // 连续模式下滚动到指定页面
        scrollToPage(pageNum);
    }
    
    updatePageNavigation();
}

// 滚动到指定页面
function scrollToPage(pageNum) {
    const previewContainer = document.getElementById('document-preview');
    const targetPage = previewContainer.querySelector(`canvas[data-page-num="${pageNum}"]`);
    
    if (targetPage) {
        const pageContainer = targetPage.parentElement;
        pageContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 更新页面导航状态
function updatePageNavigation() {
    const firstBtn = document.getElementById('first-page-btn');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const lastBtn = document.getElementById('last-page-btn');
    
    // 更新按钮状态
    firstBtn.disabled = currentPage <= 1;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    lastBtn.disabled = currentPage >= totalPages;
    
    // 更新按钮样式
    [firstBtn, prevBtn, nextBtn, lastBtn].forEach(btn => {
        if (btn.disabled) {
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.classList.remove('hover:bg-gray-600');
        } else {
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.classList.add('hover:bg-gray-600');
        }
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
    const newScale = Math.min(currentScale * 1.25, 3.0);
    setZoom(newScale);
}

function zoomOut() {
    const newScale = Math.max(currentScale / 1.25, 0.25);
    setZoom(newScale);
}

function fitToWidth() {
    if (!currentPdf) return;
    
    const previewContainer = document.getElementById('document-preview');
    const containerWidth = previewContainer.clientWidth - 32; // 减去padding
    
    currentPdf.getPage(1).then(page => {
        const viewport = page.getViewport({scale: 1.0, rotation: rotation});
        const scale = (containerWidth - 16) / viewport.width; // 额外减去页面内边距
        setZoom(scale);
    });
}

function fitToPage() {
    if (!currentPdf) return;
    
    const previewContainer = document.getElementById('document-preview');
    const containerWidth = previewContainer.clientWidth - 32;
    const containerHeight = previewContainer.clientHeight - 32;
    
    currentPdf.getPage(1).then(page => {
        const viewport = page.getViewport({scale: 1.0, rotation: rotation});
        const scaleX = (containerWidth - 16) / viewport.width;
        const scaleY = (containerHeight - 16) / viewport.height;
        const scale = Math.min(scaleX, scaleY);
        setZoom(scale);
    });
}

function updateZoomLevel() {
    // 更新缩放选择器显示
    updateZoomSelector();
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

