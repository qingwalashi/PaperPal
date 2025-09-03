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
            fontSize: 10.5, // 5号字体
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
            fontSize: 10.5, // 5号字体
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

// 将对象转换为YAML字符串
function objectToYaml(obj) {
    return jsyaml.dump(obj, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
    });
}

// 将YAML字符串转换为对象
function yamlToObject(yaml) {
    try {
        return jsyaml.load(yaml);
    } catch (e) {
        console.error('YAML解析错误:', e);
        return null;
    }
}

// 更新配置文本框
function updateConfigTextarea(template) {
    const configTextarea = document.getElementById('template-config');
    configTextarea.value = objectToYaml(template);
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

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    // 文件上传区域拖放功能
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');

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

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // 模板选择事件
    const templateSelect = document.getElementById('template-select');
    templateSelect.addEventListener('change', (e) => {
        const selectedTemplate = e.target.value;
        const template = templates[selectedTemplate];
        updateFormValues(template);
        updateConfigTextarea(template);
    });

    // 表单值变化时更新YAML配置
    const formInputs = document.querySelectorAll('.template-settings select, .template-settings input');
    formInputs.forEach(input => {
        input.addEventListener('change', () => {
            const newConfig = getConfigFromForm();
            updateConfigTextarea(newConfig);
        });
    });

    // YAML配置变化时更新表单
    const configTextarea = document.getElementById('template-config');
    configTextarea.addEventListener('change', () => {
        const newConfig = yamlToObject(configTextarea.value);
        if (newConfig) {
            updateFormValues(newConfig);
        }
    });

    // 转换按钮事件
    document.getElementById('convert-btn').addEventListener('click', convertToWord);

    // 初始化显示默认模板的配置
    updateFormValues(templates.default);
    updateConfigTextarea(templates.default);
});

// 处理上传的文件
function handleFile(file) {
    if (file.type === 'text/markdown' || file.type === 'text/plain' || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('markdown-input').value = e.target.result;
            document.getElementById('paste-tab').click();
        };
        reader.readAsText(file);
    } else {
        alert('请上传Markdown文件！');
    }
}

// 将HTML转换为docx格式（递归处理列表嵌套和缩进）
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
                        outlineLevel: headingLevel - 1,
                        style: {
                            id: `Heading${headingLevel}`,
                            name: `Heading ${headingLevel}`
                        }
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
                        },
                        style: {
                            id: "Normal",
                            name: "Normal"
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
                    // 处理li下的内容（包括嵌套列表）
                    let liText = '';
                    let hasSubList = false;
                    for (const child of node.childNodes) {
                        if (child.nodeType === Node.TEXT_NODE) {
                            liText += child.textContent;
                        } else if (child.nodeType === Node.ELEMENT_NODE && (child.tagName.toLowerCase() === 'ul' || child.tagName.toLowerCase() === 'ol')) {
                            hasSubList = true;
                        } else if (child.nodeType === Node.ELEMENT_NODE) {
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
                        style: {
                            id: "ListParagraph",
                            name: "List Paragraph"
                        },
                        indent: {
                            left: 720 * (level - 1)
                        }
                    }));
                    // 递归处理嵌套列表
                    for (const child of node.childNodes) {
                        if (child.nodeType === Node.ELEMENT_NODE && (child.tagName.toLowerCase() === 'ul' || child.tagName.toLowerCase() === 'ol')) {
                            children.push(...convertHtmlToDocx(child, template, level + 1, child.tagName.toLowerCase(), 1));
                        }
                    }
                    if (listType === 'ol') olCounter++;
                    break;
                }
                case 'table': {
                    const tableRows = [];
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
                                    right: { style: 'single', size: 1, color: '000000' },
                                    insideHorizontal: { style: 'single', size: 1, color: '000000' },
                                    insideVertical: { style: 'single', size: 1, color: '000000' }
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
                            },
                            style: {
                                id: "Normal",
                                name: "Normal"
                            }
                        }));
                    }
            }
        }
    }
    return children;
}

// 将Markdown转换为Word文档
async function convertToWord() {
    const markdownText = document.getElementById('markdown-input').value;
    if (!markdownText.trim()) {
        alert('请输入或上传Markdown文本！');
        return;
    }

    // 显示进度条
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressText.textContent = '0%';

    try {
    // 获取当前配置
    const templateType = document.getElementById('template-select').value;
    let template;
    
    if (templateType === 'custom') {
        template = getConfigFromForm();
    } else {
        // 尝试从配置文本框获取最新配置
        const configTextarea = document.getElementById('template-config');
        const newConfig = yamlToObject(configTextarea.value);
        template = newConfig || templates[templateType];
    }

        // 更新进度
        progressBar.style.width = '20%';
        progressText.textContent = '20%';

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

        // 更新进度
        progressBar.style.width = '40%';
        progressText.textContent = '40%';

    // 创建Word文档
    const doc = new docx.Document({
        styles: {
            paragraphStyles: [
                {
                    id: "Heading1",
                    name: "Heading 1",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        size: template.h1FontSize * 2,
                        bold: true,
                        font: template.h1FontFamily
                    }
                },
                {
                    id: "Heading2",
                    name: "Heading 2",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        size: template.h2FontSize * 2,
                        bold: true,
                        font: template.h2FontFamily
                    }
                },
                {
                    id: "Heading3",
                    name: "Heading 3",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        size: template.h3FontSize * 2,
                        bold: true,
                        font: template.h3FontFamily
                    }
                },
                {
                    id: "Heading4",
                    name: "Heading 4",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        size: template.h4FontSize * 2,
                        bold: true,
                        font: template.h4FontFamily
                    }
                },
                {
                    id: "Normal",
                    name: "Normal",
                    run: {
                        size: template.fontSize * 2,
                        font: template.fontFamily
                    }
                },
                {
                    id: "ListParagraph",
                    name: "List Paragraph",
                    basedOn: "Normal",
                    run: {
                        size: template.fontSize * 2,
                        font: template.fontFamily
                    }
                }
            ]
        },
        sections: [{
            properties: {
                page: {
                    margin: margins
                }
            },
            children: convertHtmlToDocx(tempDiv, template)
        }]
    });

        // 更新进度
        progressBar.style.width = '60%';
        progressText.textContent = '60%';

        // 生成文档
    const blob = await docx.Packer.toBlob(doc);

        // 更新进度
        progressBar.style.width = '80%';
        progressText.textContent = '80%';

        // 生成带时间戳的文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `md2docx-${timestamp}.docx`;

        // 保存文件
        saveAs(blob, fileName);

        // 完成进度
        progressBar.style.width = '100%';
        progressText.textContent = '100%';

        // 2秒后隐藏进度条
        setTimeout(() => {
            progressContainer.classList.add('hidden');
        }, 2000);

    } catch (error) {
        console.error('转换过程中发生错误:', error);
        alert('转换过程中发生错误，请重试！');
        progressContainer.classList.add('hidden');
    }
} 