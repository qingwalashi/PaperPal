// 台签排版功能脚本
document.addEventListener('DOMContentLoaded', function() {
    initializeNameplate();
});

// 全局变量
let nameplateData = {
    names: [],
    pages: [],
    currentPage: 0,
    selectedFont: 'SimHei',
    fontSize: 24,
    zoomLevel: 1.0,
    panX: 0,
    panY: 0,
    _isDragging: false,
    _dragStartX: 0,
    _dragStartY: 0,
    _panStartX: 0,
    _panStartY: 0,
    _onMouseMove: null,
    _onMouseUp: null
};

function initializeNameplate() {
    // 设置导航活动项
    if (window.navigation) {
        window.navigation.updateActiveNavItem('nameplate');
    }

    // 初始化事件监听器
    initializeEventListeners();
    
    // 初始化字体选择器
    initializeFontSelector();

    // 初始化渲染空状态
    renderCurrentPage();
    updatePaginationControls();

    // 监听窗口尺寸变化，自动适配预览高度
    window.addEventListener('resize', debounce(() => {
        autoFitPreview();
    }, 150));
}

// 初始化事件监听器
function initializeEventListeners() {
    // 名字输入框变化
    const namesInput = document.getElementById('names-input');
    namesInput.addEventListener('input', handleNamesInput);
    
    // 字体大小滑块
    const fontSizeSlider = document.getElementById('font-size-slider');
    fontSizeSlider.addEventListener('input', handleFontSizeChange);
    
    // 按钮事件（去除“生成台签”按钮绑定，输入即生成）
    document.getElementById('download-btn').addEventListener('click', handleDownload);
    
    // 清空名字按钮
    document.getElementById('clear-names').addEventListener('click', clearAllNames);
    
    // 分页按钮
    document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => changePage(1));
    
    // 缩放按钮
    document.getElementById('zoom-in').addEventListener('click', () => zoomPreview(1.1));
    document.getElementById('zoom-out').addEventListener('click', () => zoomPreview(0.9));
    
    // 键盘快捷键
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// 初始化字体选择器
function initializeFontSelector() {
    const fontPreviews = document.querySelectorAll('.font-preview');
    fontPreviews.forEach(preview => {
        preview.addEventListener('click', function() {
            // 移除其他选中状态
            fontPreviews.forEach(p => p.classList.remove('selected'));
            // 添加选中状态
            this.classList.add('selected');
            // 更新选中字体
            nameplateData.selectedFont = this.dataset.font;
            
            // 实时字体预览效果
            if (window.CommonUtils) {
                CommonUtils.showNotification(`已选择字体：${this.querySelector('.font-name').textContent}`, 'info');
            }
            
            // 如果已生成台签，实时重新生成预览
            if (nameplateData.pages.length > 0) {
                generateNameplates(true);
            }
        });
        
        // 添加悬停预览效果
        preview.addEventListener('mouseenter', function() {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'scale(1.02)';
                this.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
            }
        });
        
        preview.addEventListener('mouseleave', function() {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'scale(1)';
                this.style.boxShadow = '';
            }
        });
    });
}

// 处理名字输入
function handleNamesInput() {
    const namesInput = document.getElementById('names-input');
    const rawNames = namesInput.value.split('\n');
    
    // 过滤空行并清理空格，保持原有顺序
    const names = rawNames
        .map(name => name.trim())
        .filter(name => name !== '' && name.length > 0);
    
    // 去重处理，保持第一次出现的顺序
    const uniqueNames = [];
    const seenNames = new Set();
    names.forEach(name => {
        if (!seenNames.has(name)) {
            uniqueNames.push(name);
            seenNames.add(name);
        }
    });
    
    nameplateData.names = uniqueNames;
    updateFontSamples();
    
    // 实时预览：输入即生成/更新
    if (uniqueNames.length > 0) {
        generateNameplates();
    } else {
        // 如果没有名字，清空预览
        nameplateData.pages = [];
        nameplateData.currentPage = 0;
        renderCurrentPage();
        updatePaginationControls();
        // 禁用下载按钮
        document.getElementById('download-btn').disabled = true;
        updateDownloadButtonText();
    }
}

// 处理字体大小变化
function handleFontSizeChange() {
    const fontSizeSlider = document.getElementById('font-size-slider');
    const fontSizeDisplay = document.getElementById('font-size-display');
    nameplateData.fontSize = parseInt(fontSizeSlider.value);
    fontSizeDisplay.textContent = nameplateData.fontSize + 'px';
    
    // 实时更新字体预览样本
    updateFontSamples();
    
    // 如果已生成台签，实时重新生成预览
    if (nameplateData.pages.length > 0) {
        generateNameplates(true);
    }
}

// 生成台签
function generateNameplates(silent = false) {
    if (nameplateData.names.length === 0) {
        if (window.CommonUtils) {
            CommonUtils.showNotification('请先输入名字！', 'warning');
        } else {
            alert('请先输入名字！');
        }
        return;
    }
    
    // 每页1个名字（上下对称显示同一个名字）
    const namesPerPage = 1;
    nameplateData.pages = [];
    
    // 分页处理
    for (let i = 0; i < nameplateData.names.length; i += namesPerPage) {
        const pageNames = nameplateData.names.slice(i, i + namesPerPage);
        nameplateData.pages.push(pageNames);
    }
    
    // 重置当前页
    nameplateData.currentPage = 0;
    
    // 生成预览
    renderCurrentPage();
    // 自适应预览高度到屏幕
    autoFitPreview();
    
    // 启用按钮并更新文本
    updateDownloadButton();
    
    // 更新分页控件
    updatePaginationControls();
    
    if (!silent && window.CommonUtils) {
        CommonUtils.showNotification(`成功生成 ${nameplateData.pages.length} 页台签！`, 'success');
    }
}

// 渲染当前页
function renderCurrentPage() {
    const previewContainer = document.getElementById('preview-container');
    
    if (nameplateData.pages.length === 0) {
        // 显示空白A4纸
        const emptyPageHTML = createEmptyA4Page();
        previewContainer.innerHTML = emptyPageHTML;
        autoFitPreview();
        enableCanvasPan();
        return;
    }
    
    const currentPageNames = nameplateData.pages[nameplateData.currentPage];
    
    // 创建A4页面
    const pageHTML = createNameplatePage(currentPageNames, nameplateData.currentPage);
    previewContainer.innerHTML = pageHTML;
    // 初次渲染后自适应
    autoFitPreview();
    // 启用画布拖拽
    enableCanvasPan();
}

// 创建台签页面HTML
function createNameplatePage(names, pageIndex) {
    const fontFamily = getFontFamily(nameplateData.selectedFont);
    const fontSize = nameplateData.fontSize;
    
    let nameplateItems = '';
    
    // 上半部分台签（正向）- A4纵向中轴线对称
    if (names[0]) {
        nameplateItems += `
            <div class="nameplate-item" style="
                top: 35mm;
                left: 15mm;
                width: 180mm;
                height: 80mm;
                font-family: ${fontFamily};
                font-size: ${fontSize}px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="
                    text-align: center;
                    word-wrap: break-word;
                    line-height: 1.3;
                    max-width: 90%;
                    overflow: hidden;
                    color: #1a1a1a;
                ">
                    ${escapeHtml(names[0])}
                </div>
            </div>
        `;
    }
    
    // 下半部分台签（倒置）- 与上半部分相同名字
    if (names[0]) {
        nameplateItems += `
            <div class="nameplate-item" style="
                bottom: 35mm;
                left: 15mm;
                width: 180mm;
                height: 80mm;
                font-family: ${fontFamily};
                font-size: ${fontSize}px;
                font-weight: bold;
                transform: rotate(180deg);
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="
                    text-align: center;
                    word-wrap: break-word;
                    line-height: 1.3;
                    max-width: 90%;
                    overflow: hidden;
                    color: #1a1a1a;
                ">
                    ${escapeHtml(names[0])}
                </div>
            </div>
        `;
    }
    
    // 中轴线（仅预览时显示）- 增强视觉效果
    const centerLine = `
        <div class="center-line" style="
            position: absolute;
            top: 50%;
            left: 5mm;
            right: 5mm;
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #ccc 10%, #666 50%, #ccc 90%, transparent 100%);
            border-top: 1px dashed #999;
            opacity: 0.7;
            z-index: 10;
            transform: translateY(-0.5px);
        "></div>
        <div class="fold-indicators" style="
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            z-index: 11;
        ">
            <div class="fold-indicator-left" style="
                position: absolute;
                left: 3mm;
                top: -3px;
                width: 6px;
                height: 6px;
                background: #666;
                border-radius: 50%;
                opacity: 0.8;
            "></div>
            <div class="fold-indicator-right" style="
                position: absolute;
                right: 3mm;
                top: -3px;
                width: 6px;
                height: 6px;
                background: #666;
                border-radius: 50%;
                opacity: 0.8;
            "></div>
        </div>
        <div class="fold-text" style="
            position: absolute;
            top: calc(50% + 10px);
            left: 50%;
            transform: translateX(-50%);
            font-size: 10px;
            color: #666;
            font-family: Arial, sans-serif;
            background: white;
            padding: 2px 6px;
            border-radius: 3px;
            opacity: 0.9;
        ">中轴线对称折叠</div>
    `;
    
    return `
        <div class="nameplate-page print-area" data-page="${pageIndex}" style="
            background: #fafafa;
            border: 1px solid #e0e0e0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
            ${nameplateItems}
            ${centerLine}
        </div>
    `;
}

// 获取字体族
function getFontFamily(fontName) {
    const fontMap = {
        'SimHei': "SimHei, '黑体', sans-serif",
        'SimSun': "SimSun, '宋体', serif",
        'KaiTi': "KaiTi, '楷体', serif",
        'FangSong': "FangSong, '仿宋', serif",
        'Microsoft YaHei': "'Microsoft YaHei', '微软雅黑', sans-serif",
        'Arial': "Arial, sans-serif"
    };
    return fontMap[fontName] || fontMap['SimHei'];
}

// HTML转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 更新字体预览样本
function updateFontSamples() {
    const firstNameInput = nameplateData.names.length > 0 ? nameplateData.names[0] : '张三';

    // 更新所有字体预览样本
    const samples = document.querySelectorAll('.font-sample');
    samples.forEach(sample => {
        // 对于Arial字体，显示英文
        if (sample.id === 'sample-Arial') {
            sample.textContent = firstNameInput.replace(/[\u4e00-\u9fff]/g, 'Zhang San');
        } else {
            sample.textContent = firstNameInput;
        }

        // 字体选择区的文字大小保持固定为16px，不受滑块影响
        sample.style.fontSize = '16px';

        // 确保字体样式正确应用
        const fontData = sample.parentElement.dataset.font;
        if (fontData) {
            sample.style.fontFamily = getFontFamily(fontData);
        }
    });
}

// 简单的中文名转英文名（示例用）
function convertToEnglish(chineseName) {
    const nameMap = {
        '张三': 'Zhang San',
        '李四': 'Li Si',
        '王五': 'Wang Wu',
        '赵六': 'Zhao Liu',
        '陈七': 'Chen Qi',
        '刘八': 'Liu Ba'
    };
    return nameMap[chineseName] || chineseName;
}

// 统计信息模块已移除，无需更新

// 更新分页控件
function updatePaginationControls() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    
    if (nameplateData.pages.length === 0) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        pageInfo.textContent = '第 0 页，共 0 页';
        return;
    }
    
    prevBtn.disabled = nameplateData.currentPage === 0;
    nextBtn.disabled = nameplateData.currentPage === nameplateData.pages.length - 1;
    pageInfo.textContent = `第 ${nameplateData.currentPage + 1} 页，共 ${nameplateData.pages.length} 页`;
}

// 切换页面
function changePage(direction) {
    const newPage = nameplateData.currentPage + direction;
    if (newPage >= 0 && newPage < nameplateData.pages.length) {
        nameplateData.currentPage = newPage;
        renderCurrentPage();
        updatePaginationControls();
        autoFitPreview();
    }
}

// 切换预览模式
function togglePreview() {
    const previewBtn = document.getElementById('preview-btn');
    const previewContainer = document.getElementById('preview-container');
    
    if (previewBtn.textContent.includes('预览效果')) {
        // 进入全屏预览模式
        previewContainer.style.position = 'fixed';
        previewContainer.style.top = '0';
        previewContainer.style.left = '0';
        previewContainer.style.width = '100vw';
        previewContainer.style.height = '100vh';
        previewContainer.style.backgroundColor = 'white';
        previewContainer.style.zIndex = '9999';
        previewContainer.style.overflow = 'auto';
        
        previewBtn.innerHTML = '<i class="bi bi-x-lg mr-2"></i>退出预览';
        previewBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
        previewBtn.classList.add('bg-red-500', 'hover:bg-red-600');
    } else {
        // 退出全屏预览模式
        previewContainer.style.position = '';
        previewContainer.style.top = '';
        previewContainer.style.left = '';
        previewContainer.style.width = '';
        previewContainer.style.height = '';
        previewContainer.style.backgroundColor = '';
        previewContainer.style.zIndex = '';
        previewContainer.style.overflow = '';
        
        previewBtn.innerHTML = '<i class="bi bi-eye mr-2"></i>预览效果';
        previewBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
        previewBtn.classList.add('bg-green-500', 'hover:bg-green-600');
    }
}
// 预览按钮已移除

// 下载单页
async function downloadSinglePage() {
    if (nameplateData.pages.length === 0) {
        if (window.CommonUtils) {
            CommonUtils.showNotification('请先生成台签！', 'warning');
        }
        return;
    }
    
    try {
        // 显示下载进度
        if (window.CommonUtils) {
            CommonUtils.showNotification('正在生成PDF，请稍候...', 'info');
        }
        
        const pageElement = document.querySelector('.nameplate-page');
        if (!pageElement) return;
        
        // 临时隐藏中轴线和折叠指示器（仅用于预览）
        const centerLine = pageElement.querySelector('.center-line');
        const foldIndicators = pageElement.querySelector('.fold-indicators');
        const foldText = pageElement.querySelector('.fold-text');
        
        if (centerLine) centerLine.style.display = 'none';
        if (foldIndicators) foldIndicators.style.display = 'none';
        if (foldText) foldText.style.display = 'none';
        
        // 使用html2canvas生成图片
        const canvas = await html2canvas(pageElement, {
            scale: 3, // 提高分辨率
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            allowTaint: false
        });
        
        // 恢复中轴线显示
        if (centerLine) centerLine.style.display = '';
        if (foldIndicators) foldIndicators.style.display = '';
        if (foldText) foldText.style.display = '';
        
        // 转换为PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgData = canvas.toDataURL('image/png', 0.95);
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        
        // 生成文件名
        const currentPageNames = nameplateData.pages[nameplateData.currentPage];
        const namesPart = (currentPageNames[0] || '').substring(0, 20);
        const fileName = `台签_${namesPart}_第${nameplateData.currentPage + 1}页.pdf`;
        
        pdf.save(fileName);
        
        if (window.CommonUtils) {
            CommonUtils.showNotification('单页下载成功！', 'success');
        }
    } catch (error) {
        console.error('下载失败:', error);
        if (window.CommonUtils) {
            CommonUtils.showNotification('下载失败，请重试！', 'error');
        }
    }
}

// 批量下载所有页面
async function downloadAllPages() {
    if (nameplateData.pages.length === 0) {
        if (window.CommonUtils) {
            CommonUtils.showNotification('请先生成台签！', 'warning');
        }
        return;
    }
    
    try {
        const zip = new JSZip();
        const { jsPDF } = window.jspdf;
        const originalPage = nameplateData.currentPage;
        
        // 显示进度提示
        if (window.CommonUtils) {
            CommonUtils.showNotification(`正在生成 ${nameplateData.pages.length} 个PDF文件，请稍候...`, 'info');
        }
        
        // 为每页生成PDF
        for (let i = 0; i < nameplateData.pages.length; i++) {
            // 更新进度
            if (window.CommonUtils && i > 0) {
                CommonUtils.showNotification(`正在处理第 ${i + 1}/${nameplateData.pages.length} 页...`, 'info');
            }
            
            // 切换到当前页
            nameplateData.currentPage = i;
            renderCurrentPage();
            
            // 等待渲染完成
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const pageElement = document.querySelector('.nameplate-page');
            if (!pageElement) continue;
            
            // 临时隐藏预览元素
            const centerLine = pageElement.querySelector('.center-line');
            const foldIndicators = pageElement.querySelector('.fold-indicators');
            const foldText = pageElement.querySelector('.fold-text');
            
            if (centerLine) centerLine.style.display = 'none';
            if (foldIndicators) foldIndicators.style.display = 'none';
            if (foldText) foldText.style.display = 'none';
            
            // 生成canvas
            const canvas = await html2canvas(pageElement, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                allowTaint: false
            });
            
            // 恢复预览元素
            if (centerLine) centerLine.style.display = '';
            if (foldIndicators) foldIndicators.style.display = '';
            if (foldText) foldText.style.display = '';
            
            // 转换为PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png', 0.95);
            pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
            
            // 生成文件名
            const pageNames = nameplateData.pages[i];
            const namesPart = (pageNames[0] || '').substring(0, 20);
            const fileName = `台签_${namesPart}_第${i + 1}页.pdf`;
            
            // 添加到ZIP
            const pdfBlob = pdf.output('blob');
            zip.file(fileName, pdfBlob);
        }
        
        // 生成ZIP文件
        if (window.CommonUtils) {
            CommonUtils.showNotification('正在打包文件...', 'info');
        }
        
        const zipBlob = await zip.generateAsync({ 
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
        
        // 下载ZIP
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-');
        link.download = `台签批量下载_${timestamp}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 恢复到原始页面
        nameplateData.currentPage = originalPage;
        renderCurrentPage();
        updatePaginationControls();
        
        if (window.CommonUtils) {
            CommonUtils.showNotification(`批量下载成功！共 ${nameplateData.pages.length} 个文件`, 'success');
        }
    } catch (error) {
        console.error('批量下载失败:', error);
        if (window.CommonUtils) {
            CommonUtils.showNotification('批量下载失败，请重试！', 'error');
        }
        
        // 恢复到原始页面
        nameplateData.currentPage = originalPage || 0;
        renderCurrentPage();
        updatePaginationControls();
    }
}

// 处理订阅
function handleSubscription() {
    const emailInput = document.getElementById('notification-email');
    const subscribeBtn = document.getElementById('subscribe-btn');
    const email = emailInput.value.trim();
    
    if (!email) {
        CommonUtils.showNotification('请输入邮箱地址！', 'warning');
        emailInput.focus();
        return;
    }
    
    if (!validateEmail(email)) {
        CommonUtils.showNotification('请输入有效的邮箱地址！', 'error');
        emailInput.focus();
        return;
    }
    
    // 检查是否已经订阅过
    const subscribers = getSubscribers();
    if (subscribers.includes(email)) {
        CommonUtils.showNotification('该邮箱已经订阅过了！', 'info');
        return;
    }
    
    // 保存订阅信息
    saveSubscription(email);
    
    // 更新UI
    subscribeBtn.disabled = true;
    subscribeBtn.textContent = '已订阅';
    subscribeBtn.classList.remove('bg-white', 'text-purple-600', 'hover:bg-gray-100');
    subscribeBtn.classList.add('bg-green-500', 'text-white');
    
    emailInput.disabled = true;
    emailInput.value = '';
    emailInput.placeholder = '订阅成功！';
    
    CommonUtils.showNotification('订阅成功！我们会在功能上线时通知您', 'success');
    
    // 3秒后恢复按钮状态
    setTimeout(() => {
        subscribeBtn.disabled = false;
        subscribeBtn.textContent = '订阅';
        subscribeBtn.classList.add('bg-white', 'text-purple-600', 'hover:bg-gray-100');
        subscribeBtn.classList.remove('bg-green-500', 'text-white');
        
        emailInput.disabled = false;
        emailInput.placeholder = '请输入您的邮箱地址';
    }, 3000);
}

// 邮箱格式验证
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 获取订阅者列表
function getSubscribers() {
    const subscribers = localStorage.getItem('nameplate_subscribers');
    return subscribers ? JSON.parse(subscribers) : [];
}

// 保存订阅信息
function saveSubscription(email) {
    const subscribers = getSubscribers();
    subscribers.push(email);
    localStorage.setItem('nameplate_subscribers', JSON.stringify(subscribers));
    
    // 保存订阅时间
    const subscriptionData = {
        email: email,
        timestamp: new Date().toISOString(),
        feature: 'nameplate'
    };
    
    const allSubscriptions = JSON.parse(localStorage.getItem('feature_subscriptions') || '[]');
    allSubscriptions.push(subscriptionData);
    localStorage.setItem('feature_subscriptions', JSON.stringify(allSubscriptions));
}

// 初始化反馈功能
function initializeFeedback() {
    const emailBtn = document.querySelector('button[onclick*="envelope"]') || 
                     document.querySelector('button:has(.bi-envelope)');
    const chatBtn = document.querySelector('button[onclick*="chat"]') || 
                    document.querySelector('button:has(.bi-chat-dots)');
    
    // 查找包含邮件和聊天图标的按钮
    const buttons = document.querySelectorAll('button');
    let emailButton = null;
    let chatButton = null;
    
    buttons.forEach(btn => {
        const icon = btn.querySelector('i');
        if (icon) {
            if (icon.classList.contains('bi-envelope')) {
                emailButton = btn;
            } else if (icon.classList.contains('bi-chat-dots')) {
                chatButton = btn;
            }
        }
    });
    
    if (emailButton) {
        emailButton.addEventListener('click', () => {
            handleEmailFeedback();
        });
    }
    
    if (chatButton) {
        chatButton.addEventListener('click', () => {
            handleChatFeedback();
        });
    }
}

// 处理邮件反馈
function handleEmailFeedback() {
    const subject = encodeURIComponent('PaperPal台签排版功能建议');
    const body = encodeURIComponent(`
您好！

我对PaperPal的台签排版功能有以下建议：

[请在此处描述您的建议或需求]

期待功能上线！

此致
敬礼
    `);
    
    const mailtoLink = `mailto:support@paperpal.com?subject=${subject}&body=${body}`;
    
    try {
        window.open(mailtoLink);
        CommonUtils.showNotification('正在打开邮件客户端...', 'info');
    } catch (error) {
        // 如果无法打开邮件客户端，显示邮箱地址
        const email = 'support@paperpal.com';
        navigator.clipboard.writeText(email).then(() => {
            CommonUtils.showNotification(`邮箱地址已复制: ${email}`, 'success');
        }).catch(() => {
            CommonUtils.showNotification(`请发送邮件至: ${email}`, 'info');
        });
    }
}

// 处理在线反馈
function handleChatFeedback() {
    // 创建反馈弹窗
    createFeedbackModal();
}

// 创建反馈弹窗
function createFeedbackModal() {
    // 检查是否已存在弹窗
    if (document.getElementById('feedback-modal')) {
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'feedback-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="bi bi-chat-dots mr-2"></i>
                    功能建议反馈
                </h3>
                <button id="close-modal" class="text-gray-500 hover:text-gray-700">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
            
            <form id="feedback-form">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        您的建议或需求
                    </label>
                    <textarea 
                        id="feedback-content" 
                        rows="4" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请详细描述您对台签排版功能的建议或需求..."
                        required
                    ></textarea>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        联系方式（可选）
                    </label>
                    <input 
                        type="text" 
                        id="feedback-contact" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="邮箱或微信，方便我们与您联系"
                    >
                </div>
                
                <div class="flex space-x-3">
                    <button 
                        type="submit" 
                        class="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        提交反馈
                    </button>
                    <button 
                        type="button" 
                        id="cancel-feedback" 
                        class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                        取消
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定事件
    document.getElementById('close-modal').addEventListener('click', closeFeedbackModal);
    document.getElementById('cancel-feedback').addEventListener('click', closeFeedbackModal);
    document.getElementById('feedback-form').addEventListener('submit', handleFeedbackSubmit);
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeFeedbackModal();
        }
    });
    
    // 聚焦到文本框
    setTimeout(() => {
        document.getElementById('feedback-content').focus();
    }, 100);
}

// 关闭反馈弹窗
function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    if (modal) {
        modal.remove();
    }
}

// 处理反馈提交
function handleFeedbackSubmit(e) {
    e.preventDefault();
    
    const content = document.getElementById('feedback-content').value.trim();
    const contact = document.getElementById('feedback-contact').value.trim();
    
    if (!content) {
        CommonUtils.showNotification('请输入您的建议或需求！', 'warning');
        return;
    }
    
    // 保存反馈到本地存储
    const feedback = {
        id: Date.now(),
        content: content,
        contact: contact,
        feature: 'nameplate',
        timestamp: new Date().toISOString()
    };
    
    const feedbacks = JSON.parse(localStorage.getItem('user_feedbacks') || '[]');
    feedbacks.push(feedback);
    localStorage.setItem('user_feedbacks', JSON.stringify(feedbacks));
    
    // 关闭弹窗
    closeFeedbackModal();
    
    // 显示成功消息
    CommonUtils.showNotification('反馈提交成功！感谢您的建议', 'success');
    
    // 模拟发送到服务器（实际项目中应该发送到后端API）
    console.log('用户反馈:', feedback);
}

// 添加页面交互效果
function addInteractiveEffects() {
    // 为功能卡片添加悬停效果
    const cards = document.querySelectorAll('.bg-white.rounded-lg.shadow-lg');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-2px)';
            card.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1)';
            card.style.transition = 'all 0.3s ease';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        });
    });
    
    // 为进度条添加动画效果
    const progressBars = document.querySelectorAll('[style*="width:"]');
    progressBars.forEach((bar, index) => {
        const width = bar.style.width;
        bar.style.width = '0%';
        bar.style.transition = 'width 1s ease-in-out';
        
        setTimeout(() => {
            bar.style.width = width;
        }, index * 200 + 500);
    });
    
    // 为按钮添加点击效果
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // 创建波纹效果
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// 添加波纹动画CSS
const rippleCSS = `
<style>
@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}

.progress-bar-animated {
    background: linear-gradient(90deg, 
        rgba(59, 130, 246, 0.8) 0%, 
        rgba(59, 130, 246, 1) 50%, 
        rgba(59, 130, 246, 0.8) 100%);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
}

@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

.feature-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.template-preview {
    transition: transform 0.3s ease;
}

.template-preview:hover {
    transform: scale(1.05);
}

/* 自定义滚动条 */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* 响应式设计优化 */
@media (max-width: 768px) {
    .feature-card:hover {
        transform: none;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', rippleCSS);

// 清空所有名字
function clearAllNames() {
    const namesInput = document.getElementById('names-input');
    namesInput.value = '';
    nameplateData.names = [];
    nameplateData.pages = [];
    nameplateData.currentPage = 0;
    
    // 更新界面
    updateFontSamples();
    renderCurrentPage();
    updatePaginationControls();
    
    // 禁用按钮
    document.getElementById('download-btn').disabled = true;
    updateDownloadButtonText();
    
    if (window.CommonUtils) {
        CommonUtils.showNotification('已清空所有名字', 'info');
    }
    
    // 聚焦到输入框
    namesInput.focus();
}

// 缩放预览
function zoomPreview(factor) {
    nameplateData.zoomLevel *= factor;
    
    // 限制缩放范围
    if (nameplateData.zoomLevel < 0.3) {
        nameplateData.zoomLevel = 0.3;
        return;
    }
    if (nameplateData.zoomLevel > 2.0) {
        nameplateData.zoomLevel = 2.0;
        return;
    }
    
    applyPreviewTransform();
}

// 根据可用屏幕高度自适配预览缩放
function autoFitPreview() {
    const previewContainer = document.getElementById('preview-container');
    const pageEl = previewContainer.querySelector('.nameplate-page');
    if (!pageEl) return;
    
    // 计算预览容器可用空间（宽高）
    const rect = previewContainer.getBoundingClientRect();
    const paddingV = 24; // 上下预留
    const paddingH = 24; // 左右预留
    const availableHeight = Math.max(200, window.innerHeight - rect.top - paddingV);
    const availableWidth = Math.max(200, rect.width - paddingH);

    // 实际页面渲染尺寸（像素）
    const pageHeight = pageEl.offsetHeight || 1;
    const pageWidth = pageEl.offsetWidth || 1;

    // 等比缩放，取宽高最小比值
    let scaleH = availableHeight / pageHeight;
    let scaleW = availableWidth / pageWidth;
    let scale = Math.min(scaleH, scaleW);
    // 限制缩放范围
    scale = Math.max(0.3, Math.min(scale, 1.0));

    nameplateData.zoomLevel = scale;
    // 重置平移，默认在容器中水平/垂直居中显示
    const containerWidth = rect.width;
    const scaledWidth = pageWidth * scale;
    const scaledHeight = pageHeight * scale;
    nameplateData.panX = Math.floor((containerWidth - scaledWidth) / 2);
    nameplateData.panY = Math.floor((availableHeight - scaledHeight) / 2);
    applyPreviewTransform();

    // 固定容器高度并隐藏滚动条，保证无滚轮一屏显示
    previewContainer.style.height = `${Math.floor(availableHeight)}px`;
    previewContainer.style.overflow = 'hidden';
}

// 统一应用缩放与平移
function applyPreviewTransform() {
    const previewContainer = document.getElementById('preview-container');
    const pageEl = previewContainer.querySelector('.nameplate-page');
    if (!pageEl) return;
    
    pageEl.style.transform = `translate(${nameplateData.panX}px, ${nameplateData.panY}px) scale(${nameplateData.zoomLevel})`;
    pageEl.style.transformOrigin = 'center center';
    pageEl.style.transition = nameplateData._isDragging ? 'none' : 'transform 0.2s ease-out';
    
    // 拖拽时的视觉反馈
    pageEl.style.cursor = nameplateData._isDragging ? 'grabbing' : 'grab';
    // 禁止选择文本，避免拖拽时选中文本
    pageEl.style.userSelect = 'none';
    
    // 拖拽时添加阴影效果
    if (nameplateData._isDragging) {
        pageEl.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
    } else {
        pageEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    }
}

// 启用画布拖拽（平移）
function enableCanvasPan() {
    const previewContainer = document.getElementById('preview-container');
    const pageEl = previewContainer.querySelector('.nameplate-page');
    if (!pageEl) return;

    // 确保指针样式
    pageEl.style.cursor = 'grab';

    const onMouseDown = (e) => {
        nameplateData._isDragging = true;
        nameplateData._dragStartX = e.clientX;
        nameplateData._dragStartY = e.clientY;
        nameplateData._panStartX = nameplateData.panX;
        nameplateData._panStartY = nameplateData.panY;
        applyPreviewTransform();
        e.preventDefault();
    };

    const onMouseMove = (e) => {
        if (!nameplateData._isDragging) return;
        const dx = e.clientX - nameplateData._dragStartX;
        const dy = e.clientY - nameplateData._dragStartY;
        
        // 计算新的平移位置
        const newPanX = nameplateData._panStartX + dx;
        const newPanY = nameplateData._panStartY + dy;
        
        // 获取容器和页面尺寸
        const previewContainer = document.getElementById('preview-container');
        const pageEl = previewContainer.querySelector('.nameplate-page');
        if (!pageEl) return;
        
        const containerRect = previewContainer.getBoundingClientRect();
        const pageWidth = pageEl.offsetWidth * nameplateData.zoomLevel;
        const pageHeight = pageEl.offsetHeight * nameplateData.zoomLevel;
        
        // 计算边界限制
        const minPanX = Math.min(0, containerRect.width - pageWidth);
        const maxPanX = Math.max(0, containerRect.width - pageWidth);
        const minPanY = Math.min(0, containerRect.height - pageHeight);
        const maxPanY = Math.max(0, containerRect.height - pageHeight);
        
        // 限制平移范围
        nameplateData.panX = Math.max(minPanX, Math.min(maxPanX, newPanX));
        nameplateData.panY = Math.max(minPanY, Math.min(maxPanY, newPanY));
        
        applyPreviewTransform();
    };

    const onMouseUp = () => {
        if (!nameplateData._isDragging) return;
        nameplateData._isDragging = false;
        applyPreviewTransform();
    };

    // 先清理旧的全局监听，避免重复绑定
    if (nameplateData._onMouseMove) {
        window.removeEventListener('mousemove', nameplateData._onMouseMove);
    }
    if (nameplateData._onMouseUp) {
        window.removeEventListener('mouseup', nameplateData._onMouseUp);
    }

    // 绑定到容器而非document，避免影响其他区域
    pageEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    nameplateData._onMouseMove = onMouseMove;
    nameplateData._onMouseUp = onMouseUp;

    // 清理旧监听，防止重复绑定（通过替换节点已清理，但保险处理）
    pageEl.addEventListener('mouseleave', () => {
        if (nameplateData._isDragging) {
            nameplateData._isDragging = false;
            applyPreviewTransform();
        }
    });
}

// 简单防抖函数
function debounce(fn, delay) {
    let timer = null;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// 处理下载按钮点击
function handleDownload() {
    if (nameplateData.names.length === 1) {
        // 单个名字，下载单张
        downloadSinglePage();
    } else {
        // 多个名字，批量下载
        downloadAllPages();
    }
}

// 更新下载按钮状态和文本
function updateDownloadButton() {
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.disabled = false;
    updateDownloadButtonText();
}

// 更新下载按钮文本
function updateDownloadButtonText() {
    const downloadBtnText = document.getElementById('download-btn-text');
    const downloadBtn = document.getElementById('download-btn');
    
    if (nameplateData.names.length === 0) {
        downloadBtnText.textContent = '下载';
        downloadBtn.querySelector('i').className = 'bi bi-download mr-1';
    } else if (nameplateData.names.length === 1) {
        downloadBtnText.textContent = '单张下载';
        downloadBtn.querySelector('i').className = 'bi bi-download mr-1';
    } else {
        downloadBtnText.textContent = '批量下载';
        downloadBtn.querySelector('i').className = 'bi bi-archive mr-1';
    }
}

// 创建空白A4页面
function createEmptyA4Page() {
    // 优化的中轴线（仅预览时显示）
    const centerLine = `
        <div class="center-line" style="
            position: absolute;
            top: 50%;
            left: 5mm;
            right: 5mm;
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #ddd 10%, #999 50%, #ddd 90%, transparent 100%);
            transform: translateY(-0.5px);
            z-index: 10;
            opacity: 0.8;
        "></div>
        <div class="fold-indicators" style="
            position: absolute;
            top: 50%;
            left: 10mm;
            right: 10mm;
            height: 0;
            border-top: 1px dashed #bbb;
            transform: translateY(-0.5px);
            z-index: 5;
            opacity: 0.6;
        "></div>
        <div class="fold-text" style="
            position: absolute;
            top: calc(50% + 12px);
            left: 50%;
            transform: translateX(-50%);
            font-size: 11px;
            color: #888;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: rgba(255, 255, 255, 0.95);
            padding: 3px 8px;
            border-radius: 4px;
            opacity: 0.8;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        ">中轴线对称折叠</div>
    `;
    
    return `
        <div class="nameplate-page print-area" data-page="empty" style="
            background: #fafafa;
            border: 1px solid #e0e0e0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
            ${centerLine}
        </div>
    `;
}

// 键盘快捷键处理
function handleKeyboardShortcuts(e) {
    // 只在非输入框焦点时处理快捷键
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch(e.key) {
        case 'ArrowLeft':
            if (nameplateData.pages.length > 0) {
                changePage(-1);
                e.preventDefault();
            }
            break;
        case 'ArrowRight':
            if (nameplateData.pages.length > 0) {
                changePage(1);
                e.preventDefault();
            }
            break;
        case '=':
        case '+':
            if (e.ctrlKey || e.metaKey) {
                zoomPreview(1.1);
                e.preventDefault();
            }
            break;
        case '-':
            if (e.ctrlKey || e.metaKey) {
                zoomPreview(0.9);
                e.preventDefault();
            }
            break;
        case 'Enter':
            if (e.ctrlKey || e.metaKey) {
                generateNameplates();
                e.preventDefault();
            }
            break;
    }
}
