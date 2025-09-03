// 模板配置
const templates = {
    default: {
        fontFamily: 'SimSun',
        fontSize: 12,
        lineSpacing: 1.5,
        h1FontFamily: 'SimHei',
        h1FontSize: 20,
        h2FontFamily: 'SimHei',
        h2FontSize: 18,
        h3FontFamily: 'SimHei',
        h3FontSize: 16,
        h4FontFamily: 'SimHei',
        h4FontSize: 14,
        margins: {
            top: 25.4,
            right: 25.4,
            bottom: 25.4,
            left: 25.4
        },
        table: {
            fontFamily: 'SimSun',
            fontSize: 10.5,
            alignment: 'center',
            lineSpacing: 1.0
        }
    },
    official: {
        fontFamily: 'SimSun',
        fontSize: 12,
        lineSpacing: 1.5,
        h1FontFamily: 'SimHei',
        h1FontSize: 22,
        h2FontFamily: 'SimHei',
        h2FontSize: 20,
        h3FontFamily: 'SimHei',
        h3FontSize: 18,
        h4FontFamily: 'SimHei',
        h4FontSize: 16,
        margins: {
            top: 25.4,
            right: 25.4,
            bottom: 25.4,
            left: 25.4
        },
        table: {
            fontFamily: 'SimSun',
            fontSize: 10.5,
            alignment: 'center',
            lineSpacing: 1.0
        }
    },
    finance: {
        fontFamily: 'Microsoft YaHei',
        fontSize: 12,
        lineSpacing: 1.5,
        h1FontFamily: 'Microsoft YaHei',
        h1FontSize: 20,
        h2FontFamily: 'Microsoft YaHei',
        h2FontSize: 18,
        h3FontFamily: 'Microsoft YaHei',
        h3FontSize: 16,
        h4FontFamily: 'Microsoft YaHei',
        h4FontSize: 14,
        margins: {
            top: 25.4,
            right: 25.4,
            bottom: 25.4,
            left: 25.4
        },
        table: {
            fontFamily: 'Microsoft YaHei',
            fontSize: 10.5,
            alignment: 'center',
            lineSpacing: 1.0
        }
    }
};

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeMarkdownConverter();
});

function initializeMarkdownConverter() {
    // 设置导航活动项
    if (window.navigation) {
        window.navigation.updateActiveNavItem('markdown-to-docx');
    }

    // 初始化标签页切换
    initializeTabs();
    
    // 初始化文件上传
    initializeFileUpload();
    
    // 初始化模板设置
    initializeTemplateSettings();
    
    // 初始化转换按钮
    initializeConvertButton();
    
    // 设置默认模板
    updateFormValues(templates.default);
    updateConfigTextarea(templates.default);
}

// 初始化标签页切换
function initializeTabs() {
    const pasteTab = document.getElementById('paste-tab');
    const uploadTab = document.getElementById('upload-tab');
    const pasteContent = document.getElementById('paste-content');
    const uploadContent = document.getElementById('upload-content');

    pasteTab.addEventListener('click', function(e) {
        e.preventDefault();
        switchTab(pasteTab, uploadTab, pasteContent, uploadContent);
    });

    uploadTab.addEventListener('click', function(e) {
        e.preventDefault();
        switchTab(uploadTab, pasteTab, uploadContent, pasteContent);
    });
}

function switchTab(activeTab, inactiveTab, activeContent, inactiveContent) {
    // 更新标签样式
    activeTab.classList.add('border-b-2', 'border-blue-500', 'text-blue-600');
    activeTab.classList.remove('text-gray-500');
    inactiveTab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-600');
    inactiveTab.classList.add('text-gray-500');
    
    // 切换内容显示
    activeContent.classList.remove('hidden');
    inactiveContent.classList.add('hidden');
}

// 初始化文件上传
function initializeFileUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');

    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // 文件选择
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
}

// 处理上传的文件
function handleFile(file) {
    if (file.type === 'text/markdown' || file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('markdown-input').value = e.target.result;
            document.getElementById('paste-tab').click();
            CommonUtils.showNotification('文件上传成功！', 'success');
        };
        reader.readAsText(file);
    } else {
        CommonUtils.showNotification('请上传Markdown文件（.md, .markdown, .txt）！', 'error');
    }
}

// 初始化模板设置
function initializeTemplateSettings() {
    const templateSelect = document.getElementById('template-select');
    const formModeBtn = document.getElementById('form-mode-btn');
    const yamlModeBtn = document.getElementById('yaml-mode-btn');
    const formSettings = document.getElementById('form-settings');
    const yamlSettings = document.getElementById('yaml-settings');
    const yamlTextarea = document.getElementById('template-config');

    // Initialize CodeMirror Editor
    const yamlEditor = CodeMirror.fromTextArea(yamlTextarea, {
        mode: 'yaml',
        lineNumbers: true,
        theme: 'default',
        gutters: ["CodeMirror-lint-markers"],
        lint: true
    });
    yamlEditor.setSize("100%", "500px");

    // Wrapper for updating YAML editor
    function updateConfigTextarea(config) {
        const yamlText = jsyaml.dump(config);
        yamlEditor.setValue(yamlText);
    }

    let currentMode = 'form'; // 'form' or 'yaml'

    // Function to switch mode
    function switchMode(newMode) {
        if (newMode === 'form') {
            currentMode = 'form';
            formSettings.style.display = 'block';
            yamlSettings.style.display = 'none';
            formModeBtn.classList.add('bg-blue-500', 'text-white');
            formModeBtn.classList.remove('text-gray-700');
            yamlModeBtn.classList.remove('bg-blue-500', 'text-white');
            yamlModeBtn.classList.add('text-gray-700');
            
            // Sync from YAML to Form
            try {
                const config = jsyaml.load(yamlEditor.getValue());
                updateFormValues(config);
            } catch (e) {
                console.error('Invalid YAML:', e);
                // Error is already shown by linter
            }

        } else { // yaml mode
            currentMode = 'yaml';
            formSettings.style.display = 'none';
            yamlSettings.style.display = 'block';
            yamlModeBtn.classList.add('bg-blue-500', 'text-white');
            yamlModeBtn.classList.remove('text-gray-700');
            formModeBtn.classList.remove('bg-blue-500', 'text-white');
            formModeBtn.classList.add('text-gray-700');

            // Sync from Form to YAML
            const newConfig = getConfigFromForm();
            updateConfigTextarea(newConfig);
            // Refresh editor as it was hidden
            setTimeout(() => yamlEditor.refresh(), 1);
        }
    }

    formModeBtn.addEventListener('click', () => switchMode('form'));
    yamlModeBtn.addEventListener('click', () => switchMode('yaml'));

    // Template selection event
    templateSelect.addEventListener('change', (e) => {
        const selectedTemplate = e.target.value;
        if (templates[selectedTemplate]) {
            const template = templates[selectedTemplate];
            updateFormValues(template);
            updateConfigTextarea(template);
        }
    });

    // Form inputs change event to update YAML
    const formInputs = document.querySelectorAll('#form-settings select, #form-settings input');
    formInputs.forEach(input => {
        input.addEventListener('change', () => {
            const newConfig = getConfigFromForm();
            updateConfigTextarea(newConfig);
        });
    });

    // CodeMirror change event to update form
    yamlEditor.on('change', (editor) => {
        try {
            const config = jsyaml.load(editor.getValue());
            if (config) {
                updateFormValues(config);
            }
        } catch (e) {
            // Ignore parsing errors while typing, linter will show them
        }
    });
}

// 初始化转换按钮
function initializeConvertButton() {
    document.getElementById('convert-btn').addEventListener('click', convertToWord);
}

// 切换设置区域显示/隐藏
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const button = section.previousElementSibling;
    const icon = button.querySelector('i.bi-chevron-down, i.bi-chevron-up');
    
    section.classList.toggle('hidden');
    
    if (section.classList.contains('hidden')) {
        icon.classList.remove('bi-chevron-up');
        icon.classList.add('bi-chevron-down');
    } else {
        icon.classList.remove('bi-chevron-down');
        icon.classList.add('bi-chevron-up');
    }
}

// 更新表单值
function updateFormValues(template) {
    document.getElementById('font-family').value = template.fontFamily;
    document.getElementById('font-size').value = template.fontSize;
    document.getElementById('line-spacing').value = template.lineSpacing;
    document.getElementById('h1-font-family').value = template.h1FontFamily;
    document.getElementById('h1-font-size').value = template.h1FontSize;
    document.getElementById('h2-font-family').value = template.h2FontFamily;
    document.getElementById('h2-font-size').value = template.h2FontSize;
    document.getElementById('h3-font-family').value = template.h3FontFamily;
    document.getElementById('h3-font-size').value = template.h3FontSize;
    document.getElementById('h4-font-family').value = template.h4FontFamily;
    document.getElementById('h4-font-size').value = template.h4FontSize;
    document.getElementById('margin-top').value = template.margins.top;
    document.getElementById('margin-right').value = template.margins.right;
    document.getElementById('margin-bottom').value = template.margins.bottom;
    document.getElementById('margin-left').value = template.margins.left;
    
    // 更新表格配置
    document.getElementById('table-font-family').value = template.table.fontFamily;
    document.getElementById('table-font-size').value = template.table.fontSize;
    document.getElementById('table-alignment').value = template.table.alignment;
    document.getElementById('table-line-spacing').value = template.table.lineSpacing;
}

// 从表单获取配置
function getConfigFromForm() {
    return {
        fontFamily: document.getElementById('font-family').value,
        fontSize: parseFloat(document.getElementById('font-size').value),
        lineSpacing: parseFloat(document.getElementById('line-spacing').value),
        h1FontFamily: document.getElementById('h1-font-family').value,
        h1FontSize: parseFloat(document.getElementById('h1-font-size').value),
        h2FontFamily: document.getElementById('h2-font-family').value,
        h2FontSize: parseFloat(document.getElementById('h2-font-size').value),
        h3FontFamily: document.getElementById('h3-font-family').value,
        h3FontSize: parseFloat(document.getElementById('h3-font-size').value),
        h4FontFamily: document.getElementById('h4-font-family').value,
        h4FontSize: parseFloat(document.getElementById('h4-font-size').value),
        margins: {
            top: parseFloat(document.getElementById('margin-top').value),
            right: parseFloat(document.getElementById('margin-right').value),
            bottom: parseFloat(document.getElementById('margin-bottom').value),
            left: parseFloat(document.getElementById('margin-left').value)
        },
        table: {
            fontFamily: document.getElementById('table-font-family').value,
            fontSize: parseFloat(document.getElementById('table-font-size').value),
            alignment: document.getElementById('table-alignment').value,
            lineSpacing: parseFloat(document.getElementById('table-line-spacing').value)
        }
    };
}

// 更新配置文本框
function updateConfigTextarea(template) {
    const yamlText = jsyaml.dump(template, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
    });
    yamlEditor.setValue(yamlText);
}

// 将HTML转换为docx格式
function convertHtmlToDocx(element, template, level = 0, listType = null, olStart = 1) {
    const children = [];
    let olCounter = olStart;

    for (const node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.trim()) {
                children.push(new docx.Paragraph({
                    children: [new docx.TextRun({
                        text: node.textContent,
                        font: template.fontFamily,
                        size: template.fontSize * 2
                    })],
                    spacing: {
                        line: template.lineSpacing * 240
                    }
                }));
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            switch (node.tagName.toLowerCase()) {
                case 'h1':
                case 'h2':
                case 'h3':
                case 'h4': {
                    const headingLevel = parseInt(node.tagName[1]);
                    const headingFontFamily = template[`h${headingLevel}FontFamily`];
                    const headingFontSize = template[`h${headingLevel}FontSize`];
                    children.push(new docx.Paragraph({
                        children: [new docx.TextRun({
                            text: node.textContent,
                            font: headingFontFamily,
                            size: headingFontSize * 2,
                            bold: true
                        })],
                        spacing: {
                            before: 240,
                            after: 240
                        },
                        outlineLevel: headingLevel - 1
                    }));
                    break;
                }
                case 'p':
                    children.push(new docx.Paragraph({
                        children: [new docx.TextRun({
                            text: node.textContent,
                            font: template.fontFamily,
                            size: template.fontSize * 2
                        })],
                        spacing: {
                            line: template.lineSpacing * 240
                        }
                    }));
                    break;
                case 'ul':
                    children.push(...convertHtmlToDocx(node, template, level + 1, 'ul'));
                    break;
                case 'ol':
                    children.push(...convertHtmlToDocx(node, template, level + 1, 'ol', 1));
                    break;
                case 'li': {
                    let prefix = '';
                    if (listType === 'ol') {
                        prefix = olCounter + '. ';
                    } else if (listType === 'ul') {
                        prefix = '• ';
                    }
                    
                    let liText = '';
                    for (const child of node.childNodes) {
                        if (child.nodeType === Node.TEXT_NODE) {
                            liText += child.textContent;
                        } else if (child.nodeType === Node.ELEMENT_NODE && 
                                 !['ul', 'ol'].includes(child.tagName.toLowerCase())) {
                            liText += child.textContent;
                        }
                    }
                    
                    children.push(new docx.Paragraph({
                        children: [new docx.TextRun({
                            text: prefix + liText.trim(),
                            font: template.fontFamily,
                            size: template.fontSize * 2
                        })],
                        spacing: {
                            line: template.lineSpacing * 240
                        },
                        indent: {
                            left: 720 * (level - 1)
                        }
                    }));
                    
                    // 处理嵌套列表
                    for (const child of node.childNodes) {
                        if (child.nodeType === Node.ELEMENT_NODE && 
                            ['ul', 'ol'].includes(child.tagName.toLowerCase())) {
                            children.push(...convertHtmlToDocx(child, template, level + 1, child.tagName.toLowerCase(), 1));
                        }
                    }
                    
                    if (listType === 'ol') olCounter++;
                    break;
                }
                case 'table': {
                    const tableCells = Array.from(node.querySelectorAll('tr')).map(tr => {
                        return Array.from(tr.querySelectorAll('td, th')).map(cell => {
                            return new docx.TableCell({
                                children: [new docx.Paragraph({
                                    children: [new docx.TextRun({
                                        text: cell.textContent,
                                        font: template.table.fontFamily,
                                        size: template.table.fontSize * 2
                                    })],
                                    alignment: template.table.alignment,
                                    spacing: {
                                        line: template.table.lineSpacing * 240
                                    }
                                })],
                                borders: {
                                    top: { style: 'single', size: 1, color: '000000' },
                                    bottom: { style: 'single', size: 1, color: '000000' },
                                    left: { style: 'single', size: 1, color: '000000' },
                                    right: { style: 'single', size: 1, color: '000000' }
                                }
                            });
                        });
                    });
                    
                    children.push(new docx.Table({
                        rows: tableCells.map(cells => new docx.TableRow({
                            children: cells
                        })),
                        width: {
                            size: 100,
                            type: docx.WidthType.PERCENTAGE
                        },
                        alignment: docx.AlignmentType.CENTER
                    }));
                    break;
                }
                default:
                    if (node.textContent.trim()) {
                        children.push(new docx.Paragraph({
                            children: [new docx.TextRun({
                                text: node.textContent,
                                font: template.fontFamily,
                                size: template.fontSize * 2
                            })],
                            spacing: {
                                line: template.lineSpacing * 240
                            }
                        }));
                    }
            }
        }
    }
    return children;
}

// 转换为Word文档
async function convertToWord() {
    const markdownText = document.getElementById('markdown-input').value;
    if (!markdownText.trim()) {
        CommonUtils.showNotification('请输入或上传Markdown文本！', 'warning');
        return;
    }

    const convertBtn = document.getElementById('convert-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    try {
        // 显示加载状态
        CommonUtils.showLoading(convertBtn, '转换中...');
        progressContainer.classList.remove('hidden');
        updateProgress(0);

        // 获取当前配置
        const templateType = document.getElementById('template-select').value;
        let template;
        
        if (templateType === 'custom') {
            template = getConfigFromForm();
        } else {
            template = templates[templateType] || templates.default;
        }

        updateProgress(20);

        // 将毫米转换为twips (1mm = 56.7twips)
        const margins = {
            top: Math.round(template.margins.top * 56.7),
            right: Math.round(template.margins.right * 56.7),
            bottom: Math.round(template.margins.bottom * 56.7),
            left: Math.round(template.margins.left * 56.7)
        };

        // 解析Markdown
        const htmlContent = marked.parse(markdownText);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        updateProgress(40);

        // 创建Word文档
        const doc = new docx.Document({
            sections: [{
                properties: {
                    page: {
                        margin: margins
                    }
                },
                children: convertHtmlToDocx(tempDiv, template)
            }]
        });

        updateProgress(60);

        // 生成文档
        const blob = await docx.Packer.toBlob(doc);
        updateProgress(80);

        // 生成文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const fileName = `markdown-to-word-${timestamp}.docx`;

        // 保存文件
        saveAs(blob, fileName);
        updateProgress(100);

        CommonUtils.showNotification('Word文档生成成功！', 'success');

        // 2秒后隐藏进度条
        setTimeout(() => {
            progressContainer.classList.add('hidden');
            CommonUtils.hideLoading(convertBtn);
        }, 2000);

    } catch (error) {
        console.error('转换过程中发生错误:', error);
        CommonUtils.showNotification('转换过程中发生错误，请重试！', 'error');
        progressContainer.classList.add('hidden');
        CommonUtils.hideLoading(convertBtn);
    }

    function updateProgress(percent) {
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `${percent}%`;
    }
}
