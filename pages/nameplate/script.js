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
    // 距中轴线的纵向距离（单位 mm），上半与下半对称。
    // 0 表示最靠近中轴线，最大不超过 34mm（由UI限制）。
    yOffsetMm: 0,
    // 边框尺寸（单位 mm），调整上半部分，自动对称应用到底部
    frameWidthMm: 200,   // 水平方向最大接近纸张边（两侧各约5mm留白）
    frameHeightMm: 135,  // 默认值，最大不超过 148.5
    frameBorderPx: 1,
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
    // 初始化一次示例字样
    updateFontSamples();

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
    
    // 纵向位置滑块
    const yPosSlider = document.getElementById('y-position-slider');
    if (yPosSlider) {
        yPosSlider.addEventListener('input', handleYPositionChange);
    }

    // 边框宽高滑块
    const frameW = document.getElementById('frame-width-slider');
    const frameH = document.getElementById('frame-height-slider');
    if (frameW) frameW.addEventListener('input', handleFrameWidthChange);
    if (frameH) frameH.addEventListener('input', handleFrameHeightChange);

    // 初始化控件显示与默认值同步
    syncControlDisplays();
    
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

// 同步右侧控件的显示文本与滑块初始值
function syncControlDisplays() {
    // 字体大小
    const fontSizeSlider = document.getElementById('font-size-slider');
    const fontSizeDisplay = document.getElementById('font-size-display');
    if (fontSizeSlider) fontSizeSlider.value = String(nameplateData.fontSize);
    if (fontSizeDisplay) fontSizeDisplay.textContent = `${nameplateData.fontSize}px`;

    // 纵向位置（距中轴线）
    const ySlider = document.getElementById('y-position-slider');
    const yDisplay = document.getElementById('y-position-display');
    if (ySlider) ySlider.value = String(nameplateData.yOffsetMm);
    if (yDisplay) yDisplay.textContent = `${nameplateData.yOffsetMm}mm`;

    // 边框宽度
    const fwSlider = document.getElementById('frame-width-slider');
    const fwDisplay = document.getElementById('frame-width-display');
    if (fwSlider) fwSlider.value = String(nameplateData.frameWidthMm);
    if (fwDisplay) fwDisplay.textContent = `${nameplateData.frameWidthMm}mm`;

    // 边框高度（半幅）
    const fhSlider = document.getElementById('frame-height-slider');
    const fhDisplay = document.getElementById('frame-height-display');
    if (fhSlider) fhSlider.value = String(nameplateData.frameHeightMm);
    if (fhDisplay) fhDisplay.textContent = `${nameplateData.frameHeightMm}mm`;

    // 下载按钮文本（保持禁用状态由其它流程控制）
    if (document.getElementById('download-btn')) {
        updateDownloadButtonText();
    }
}

// 初始化字体选择器（自定义下拉，方案B）
function initializeFontSelector() {
    const dropdown = document.getElementById('font-dropdown');
    const btn = document.getElementById('font-dropdown-button');
    const list = document.getElementById('font-dropdown-list');
    const label = document.getElementById('font-dropdown-label');
    if (!dropdown || !btn || !list || !label) return;

    // 初始状态
    applyFontLabel(nameplateData.selectedFont);

    const openList = () => { list.classList.remove('hidden'); };
    const closeList = () => { list.classList.add('hidden'); };
    const toggleList = () => { list.classList.toggle('hidden'); };

    btn.addEventListener('click', (e) => {
        toggleList();
        e.stopPropagation();
    });

    // 选项点击
    list.querySelectorAll('.font-option').forEach(item => {
        item.addEventListener('click', (e) => {
            const font = item.getAttribute('data-font');
            nameplateData.selectedFont = font;
            applyFontLabel(font);
            closeList();
            updateFontSamples();
            if (nameplateData.pages.length > 0) {
                generateNameplates(true);
            } else {
                renderCurrentPage();
            }
            e.stopPropagation();
        });
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            closeList();
        }
    });
    // ESC 关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeList();
    });

    function applyFontLabel(fontKey) {
        const map = {
            'SimHei': { label: '黑体 (SimHei)', fam: "SimHei, '黑体', sans-serif" },
            'SimSun': { label: '宋体 (SimSun)', fam: "SimSun, '宋体', serif" },
            'KaiTi': { label: '楷体 (KaiTi)', fam: "KaiTi, '楷体', serif" },
            'FangSong': { label: '仿宋 (FangSong)', fam: "FangSong, '仿宋', serif" },
            'Microsoft YaHei': { label: '微软雅黑 (Microsoft YaHei)', fam: "'Microsoft YaHei', '微软雅黑', sans-serif" },
            'Arial': { label: 'Arial', fam: 'Arial, sans-serif' }
        };
        const conf = map[fontKey] || map['SimHei'];
        label.textContent = conf.label;
        label.style.fontFamily = conf.fam;
    }
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

// 处理纵向位置变化（Y轴）
function handleYPositionChange() {
    const slider = document.getElementById('y-position-slider');
    const display = document.getElementById('y-position-display');
    if (!slider || !display) return;
    // 安全限制到 0-34 范围（距中轴线的距离，半幅最大可移动范围）
    const val = Math.max(0, Math.min(34, parseInt(slider.value)));
    nameplateData.yOffsetMm = val;
    display.textContent = `${val}mm`;
    // 若已生成，实时刷新
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
        
        // 延迟执行位置计算，确保DOM完全渲染
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                autoFitPreview();
                enableCanvasPan();
            });
        });
        return;
    }
    
    const currentPageNames = nameplateData.pages[nameplateData.currentPage];
    
    // 创建A4页面
    const pageHTML = createNameplatePage(currentPageNames, nameplateData.currentPage);
    previewContainer.innerHTML = pageHTML;
    
    // 延迟执行位置计算和拖拽设置，确保DOM完全渲染
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            autoFitPreview();
            enableCanvasPan();
            
            // 渲染后执行文本自适配，避免预览与导出时文字被裁剪
            const pageElement = document.querySelector('.nameplate-page');
            if (pageElement) {
                adjustNameplateTextToFit(pageElement);
            }
        });
    });
}

// 创建台签页面HTML
function createNameplatePage(names, pageIndex, isExport = false) {
    const fontFamily = getFontFamily(nameplateData.selectedFont);
    const fontSize = nameplateData.fontSize;
    
    let nameplateItems = '';
    // 计算显示名：当选择 Arial 且包含中文时，转为英文拼音
    const rawName = names[0] || '';
    const displayName = (nameplateData.selectedFont === 'Arial' && /[\u4e00-\u9fff]/.test(rawName))
        ? convertToEnglish(rawName)
        : rawName;
    
    // 上半部分台签：文字底边距中轴线的距离
    if (rawName) {
        const bottomOffset = isExport 
            ? `calc(${nameplateData.yOffsetMm}mm + 0.5em)`
            : `${nameplateData.yOffsetMm}mm`;
        
        nameplateItems += `
            <div class="nameplate-item" style="
                position: absolute;
                top: 0;
                left: 0;
                width: 210mm;
                height: 148.5mm;
                font-family: ${fontFamily};
                display: block;
                pointer-events: none;
            ">
                <div style="
                    position: absolute;
                    left: 50%;
                    bottom: ${bottomOffset};
                    transform: translateX(-50%);
                    text-align: center;
                    white-space: nowrap;
                    line-height: 1.0;
                    color: #1a1a1a;
                    font-size: ${fontSize}px;
                    font-weight: bold;
                    z-index: 10;
                ">
                    ${escapeHtml(displayName)}
                </div>
            </div>
        `;
    }
    
    // 下半部分台签：文字底边距中轴线的距离（旋转180°后）
    if (rawName) {
        const topOffset = isExport 
            ? `calc(${nameplateData.yOffsetMm}mm + 0.5em)`
            : `${nameplateData.yOffsetMm}mm`;
        
        nameplateItems += `
            <div class="nameplate-item" style="
                position: absolute;
                bottom: 0;
                left: 0;
                width: 210mm;
                height: 148.5mm;
                font-family: ${fontFamily};
                display: block;
                pointer-events: none;
            ">
                <div style="
                    position: absolute;
                    left: 50%;
                    top: ${topOffset};
                    transform: translateX(-50%) rotate(180deg);
                    text-align: center;
                    white-space: nowrap;
                    line-height: 1.0;
                    color: #1a1a1a;
                    font-size: ${fontSize}px;
                    font-weight: bold;
                    z-index: 10;
                ">
                    ${escapeHtml(displayName)}
                </div>
            </div>
        `;
    }

    // 上下半幅边框（无中轴线）。只需调整一侧尺寸，另一侧镜像
    const frameLeft = (210 - nameplateData.frameWidthMm) / 2;
    const borderStyle = `border: ${nameplateData.frameBorderPx}px solid #333; box-sizing: border-box;`;
    const topFrame = `
        <div class="half-frame" style="
            position: absolute;
            left: ${frameLeft}mm;
            top: ${148.5 - nameplateData.frameHeightMm}mm;
            width: ${nameplateData.frameWidthMm}mm;
            height: ${nameplateData.frameHeightMm}mm;
            ${borderStyle}
            border-bottom-width: ${nameplateData.frameBorderPx}px;
        "></div>
    `;
    const bottomFrame = `
        <div class="half-frame" style="
            position: absolute;
            left: ${frameLeft}mm;
            top: 148.5mm;
            width: ${nameplateData.frameWidthMm}mm;
            height: ${nameplateData.frameHeightMm}mm;
            ${borderStyle}
            border-top-width: ${nameplateData.frameBorderPx}px;
        "></div>
    `;
    
    return `
        <div class="nameplate-page print-area" data-page="${pageIndex}" style="
            position: relative;
            width: 210mm;
            height: 297mm;
            background: #fafafa;
            border: 1px solid #e0e0e0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
            ${topFrame}
            ${bottomFrame}
            ${nameplateItems}
        </div>
    `;
}

// 确保文本样式与设置一致，不进行自动缩放
function adjustNameplateTextToFit(pageElement) {
    if (!pageElement) return;
    // 选中每个台签项内的文本容器（第二层 div）
    const items = pageElement.querySelectorAll('.nameplate-item');
    items.forEach(item => {
        const textDiv = item && item.querySelector('div');
        if (!textDiv) return;
        
        // 确保文本样式与用户设置完全一致，允许超出容器
        textDiv.style.fontFamily = getFontFamily(nameplateData.selectedFont);
        textDiv.style.fontSize = `${nameplateData.fontSize}px`;
        textDiv.style.fontWeight = 'bold';
        textDiv.style.whiteSpace = 'nowrap';
        textDiv.style.wordBreak = 'normal';
        // 允许文字超出容器边界
        textDiv.style.overflow = 'visible';
    });
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

    // 1) 更新下拉下方的实时预览块
    const live = document.getElementById('font-live-preview');
    if (live) {
        const fam = getFontFamily(nameplateData.selectedFont);
        live.style.fontFamily = fam;
        const hasChinese = /[\u4e00-\u9fff]/.test(firstNameInput);
        if (nameplateData.selectedFont === 'Arial' && hasChinese) {
            const englishName = convertToEnglish(firstNameInput);
            live.textContent = englishName || 'Zhang San';
        } else {
            live.textContent = firstNameInput || '张三';
        }
    }

    // 2) 若仍存在旧的示例样本元素（兼容旧结构），也做一次更新
    const samples = document.querySelectorAll('.font-sample');
    samples.forEach(sample => {
        sample.textContent = firstNameInput;
        sample.style.fontSize = '16px';
    });
}

// 简单的中文名转英文名（示例用）
function convertToEnglish(chineseName) {
    if (!chineseName || typeof chineseName !== 'string') return '';
    const name = chineseName.trim();
    // 如果已经是英文/包含拉丁字母，直接返回
    if (/[A-Za-z]/.test(name)) return name;

    // 如果未加载拼音库，回退到简单映射
    const simpleMap = {
        '张三': 'Zhang San',
        '李四': 'Li Si',
        '王五': 'Wang Wu',
        '赵六': 'Zhao Liu',
        '陈七': 'Chen Qi',
        '刘八': 'Liu Ba'
    };
    const p = window.pinyinPro || window.pinyin; // 兼容可能的全局名
    if (!p || !p.pinyin) {
        return simpleMap[name] || 'Zhang San';
    }

    // 常见复姓列表
    const multiSurnames = ['欧阳','太史','端木','上官','司马','东方','独孤','南宫','夏侯','诸葛','闻人','皇甫','公孙','长孙','慕容','司徒','令狐','钟离','宇文','鲜于','闾丘','子车','亓官','司空','第五','公良','澹台','公冶','宗政','濮阳','淳于','单于','太叔','申屠','公孙','仲孙','轩辕','令狐','逢孙','仲长','司寇','巫马','公西','颛孙','壤驷','公良','乐正','宰父','谷梁','拓跋','夹谷','段干','百里','东郭','微生','梁丘','左丘','东门','西门','南门','北堂','呼延','羊舌','乌雅','完颜','纳兰','赫连','耶律'];

    let surname = '';
    let given = '';
    if (name.length >= 2 && multiSurnames.includes(name.slice(0,2))) {
        surname = name.slice(0,2);
        given = name.slice(2);
    } else {
        surname = name.slice(0,1);
        given = name.slice(1);
    }

    // 使用 pinyin-pro 转换，无声调，首字母大写
    const pinyinLib = (typeof window !== 'undefined' && window.pinyinPro) ? window.pinyinPro : null;
    // 若拼音库不可用，回退到简单映射或原名
    if (!pinyinLib || typeof pinyinLib.pinyin !== 'function') {
        return simpleMap[name] || name;
    }
    const opt = { toneType: 'none', type: 'array' };
    const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
    const surnamePyArr = pinyinLib.pinyin(surname, opt);
    const givenPyArr = pinyinLib.pinyin(given, opt);
    const surnameEn = cap((surnamePyArr && surnamePyArr[0]) || '');
    const givenEn = (givenPyArr || []).map(x => cap(x)).join(' ');
    const full = givenEn ? `${surnameEn} ${givenEn}` : surnameEn;
    return full || (simpleMap[name] || 'Zhang San');
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
        
        // 创建一个新的隐藏容器专门用于导出
        const exportContainer = document.createElement('div');
        exportContainer.style.cssText = `
            position: fixed;
            top: -10000px;
            left: -10000px;
            width: 210mm;
            height: 297mm;
            background: #ffffff;
            z-index: -1000;
            font-family: ${getFontFamily(nameplateData.selectedFont)};
        `;
        document.body.appendChild(exportContainer);
        
        // 重新生成当前页面内容，确保与预览一致
        const currentPageNames = nameplateData.pages[nameplateData.currentPage];
        const cleanPageHTML = createNameplatePage(currentPageNames, nameplateData.currentPage, true);
        exportContainer.innerHTML = cleanPageHTML;
        
        // 等待DOM渲染完成
        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => setTimeout(r, 100));
        
        const exportPageElement = exportContainer.querySelector('.nameplate-page');
        if (!exportPageElement) {
            document.body.removeChild(exportContainer);
            return;
        }
        
        // 确保导出页面样式与预览一致
        exportPageElement.style.transform = 'none';
        exportPageElement.style.boxShadow = 'none';
        exportPageElement.style.border = 'none';
        
        // 应用与预览相同的文本自适应缩放
        adjustNameplateTextToFit(exportPageElement);
        
        // 等待文本调整完成
        await new Promise(r => setTimeout(r, 100));
        
        // 使用html2canvas生成图片
        const canvas = await html2canvas(exportPageElement, {
            scale: 3,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            allowTaint: false,
            width: exportPageElement.offsetWidth,
            height: exportPageElement.offsetHeight
        });
        
        // 清理临时容器
        document.body.removeChild(exportContainer);
        
        // 转换为PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgData = canvas.toDataURL('image/png', 0.95);
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

        // 生成文件名
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

// 批量下载所有页面（合并为一个多页PDF）
async function downloadAllPages() {
    if (nameplateData.pages.length === 0) {
        if (window.CommonUtils) {
            CommonUtils.showNotification('请先生成台签！', 'warning');
        }
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const originalPage = nameplateData.currentPage;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // 显示进度提示
        if (window.CommonUtils) {
            CommonUtils.showNotification(`正在合并生成 ${nameplateData.pages.length} 页PDF，请稍候...`, 'info');
        }
        
        // 创建隐藏容器用于导出
        const exportContainer = document.createElement('div');
        exportContainer.style.cssText = `
            position: fixed;
            top: -10000px;
            left: -10000px;
            width: 210mm;
            height: 297mm;
            background: #ffffff;
            z-index: -1000;
            font-family: ${getFontFamily(nameplateData.selectedFont)};
        `;
        document.body.appendChild(exportContainer);
        
        // 为每页生成PDF
        for (let i = 0; i < nameplateData.pages.length; i++) {
            // 更新进度
            if (window.CommonUtils && i > 0) {
                CommonUtils.showNotification(`正在处理第 ${i + 1}/${nameplateData.pages.length} 页...`, 'info');
            }
            
            // 重新生成页面内容
            const pageNames = nameplateData.pages[i];
            const cleanPageHTML = createNameplatePage(pageNames, i, true);
            exportContainer.innerHTML = cleanPageHTML;
            
            // 等待DOM渲染完成
            await new Promise(r => requestAnimationFrame(r));
            await new Promise(r => setTimeout(r, 50));
            
            const exportPageElement = exportContainer.querySelector('.nameplate-page');
            if (!exportPageElement) continue;
            
            // 确保导出页面样式干净
            exportPageElement.style.transform = 'none';
            exportPageElement.style.boxShadow = 'none';
            exportPageElement.style.border = 'none';
            
            // 应用与预览相同的文本自适应缩放
            adjustNameplateTextToFit(exportPageElement);
            
            // 等待文本调整完成
            await new Promise(r => setTimeout(r, 100));

            // 生成canvas
            const canvas = await html2canvas(exportPageElement, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                allowTaint: false,
                width: exportPageElement.offsetWidth,
                height: exportPageElement.offsetHeight
            });
            
            const imgData = canvas.toDataURL('image/png', 0.95);
            // 添加到合并PDF
            if (i > 0) {
                pdf.addPage();
            }
            pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        }
        
        // 清理临时容器
        document.body.removeChild(exportContainer);
        
        // 下载合并PDF
        const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-');
        const mergedName = `台签_合并_${nameplateData.pages.length}页_${timestamp}.pdf`;
        pdf.save(mergedName);
        
        // 恢复到原始页面
        nameplateData.currentPage = originalPage;
        renderCurrentPage();
        updatePaginationControls();
        
        if (window.CommonUtils) {
            CommonUtils.showNotification(`合并下载成功！共 ${nameplateData.pages.length} 页`, 'success');
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
    if (!pageEl || !previewContainer) return;
    
    // 等待容器完全渲染，如果尺寸为0则延迟执行
    const containerHeight = previewContainer.clientHeight;
    const containerWidth = previewContainer.clientWidth;
    
    if (containerHeight === 0 || containerWidth === 0) {
        // 容器尺寸还未确定，延迟执行
        setTimeout(() => autoFitPreview(), 50);
        return;
    }
    
    const paddingV = 40; // 上下预留，增加一些空间
    const paddingH = 40; // 左右预留，增加一些空间
    
    const availableHeight = Math.max(200, containerHeight - paddingV);
    const availableWidth = Math.max(200, containerWidth - paddingH);

    // 实际页面渲染尺寸（像素）
    const pageHeight = pageEl.offsetHeight || 1;
    const pageWidth = pageEl.offsetWidth || 1;
    
    // 如果页面尺寸还未确定，延迟执行
    if (pageHeight <= 1 || pageWidth <= 1) {
        setTimeout(() => autoFitPreview(), 50);
        return;
    }

    // 等比缩放，取宽高最小比值
    let scaleH = availableHeight / pageHeight;
    let scaleW = availableWidth / pageWidth;
    let scale = Math.min(scaleH, scaleW);
    // 限制缩放范围，允许更小的缩放以适应容器
    scale = Math.max(0.2, Math.min(scale, 1.0));

    nameplateData.zoomLevel = scale;
    
    // 重新计算居中位置，确保页面在容器中心
    const scaledWidth = pageWidth * scale;
    const scaledHeight = pageHeight * scale;
    
    // 水平居中：容器宽度减去缩放后页面宽度，除以2
    nameplateData.panX = Math.floor((containerWidth - scaledWidth) / 2);
    // 垂直居中：容器高度减去缩放后页面高度，除以2
    nameplateData.panY = Math.floor((containerHeight - scaledHeight) / 2);
    
    applyPreviewTransform();

    // 确保容器样式正确
    previewContainer.style.overflow = 'hidden';
    previewContainer.style.position = 'relative';
}

// 统一应用缩放与平移
function applyPreviewTransform() {
    const previewContainer = document.getElementById('preview-container');
    const pageEl = previewContainer.querySelector('.nameplate-page');
    if (!pageEl) return;
    
    // 设置页面的绝对定位，从左上角开始
    pageEl.style.position = 'absolute';
    pageEl.style.left = '0';
    pageEl.style.top = '0';
    
    // 应用变换：先平移到正确位置，再缩放
    pageEl.style.transform = `translate(${nameplateData.panX}px, ${nameplateData.panY}px) scale(${nameplateData.zoomLevel})`;
    pageEl.style.transformOrigin = 'top left';
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
        
        // 允许无限平移：不做边界限制
        nameplateData.panX = newPanX;
        nameplateData.panY = newPanY;
        
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
        downloadBtnText.textContent = '合并下载';
        downloadBtn.querySelector('i').className = 'bi bi-archive mr-1';
    }
}

// 创建空白A4页面
function createEmptyA4Page() {
    // 仅显示上下半幅边框，不显示中轴线
    const frameLeft = (210 - nameplateData.frameWidthMm) / 2;
    const borderStyle = `border: ${nameplateData.frameBorderPx}px solid #333; box-sizing: border-box;`;
    const frames = `
        <div class="half-frame" style="position:absolute; left:${frameLeft}mm; top:${148.5 - nameplateData.frameHeightMm}mm; width:${nameplateData.frameWidthMm}mm; height:${nameplateData.frameHeightMm}mm; ${borderStyle}"></div>
        <div class="half-frame" style="position:absolute; left:${frameLeft}mm; top:148.5mm; width:${nameplateData.frameWidthMm}mm; height:${nameplateData.frameHeightMm}mm; ${borderStyle}"></div>
    `;
    
    return `
        <div class="nameplate-page print-area" data-page="empty" style="
            position: relative;
            width: 210mm;
            height: 297mm;
            background: #fafafa;
            border: 1px solid #e0e0e0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
            ${frames}
        </div>
    `;
}

// 处理边框宽度调整（mm）
function handleFrameWidthChange() {
    const slider = document.getElementById('frame-width-slider');
    const display = document.getElementById('frame-width-display');
    if (!slider || !display) return;
    // 允许范围 60–200mm
    const val = Math.max(60, Math.min(200, parseInt(slider.value)));
    nameplateData.frameWidthMm = val;
    display.textContent = `${val}mm`;
    if (nameplateData.pages.length > 0) {
        generateNameplates(true);
    } else {
        // 无名字时也需要刷新空白A4预览以反映边框变化
        renderCurrentPage();
        autoFitPreview();
    }
}

// 处理边框高度调整（mm）
function handleFrameHeightChange() {
    const slider = document.getElementById('frame-height-slider');
    const display = document.getElementById('frame-height-display');
    if (!slider || !display) return;
    // 允许范围 60–148mm（不超过半幅高）
    const val = Math.max(60, Math.min(148, parseInt(slider.value)));
    nameplateData.frameHeightMm = val;
    display.textContent = `${val}mm`;
    if (nameplateData.pages.length > 0) {
        generateNameplates(true);
    } else {
        renderCurrentPage();
        autoFitPreview();
    }
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
