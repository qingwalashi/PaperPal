// 下载页面功能实现
document.addEventListener('DOMContentLoaded', function() {
    initializeDownloadsPage();
});

function initializeDownloadsPage() {
    // 设置导航活动项
    if (window.navigation) {
        window.navigation.updateActiveNavItem('downloads');
    }

    // 初始化分类切换
    initializeCategoryTabs();
    
    // 添加下载统计
    initializeDownloadStats();
}

// 初始化分类标签页
function initializeCategoryTabs() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    const sections = document.querySelectorAll('.download-section');

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            
            // 更新按钮状态
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 切换内容区域
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `${category}-section`) {
                    section.classList.add('active');
                }
            });
        });
    });
}

// 字体下载数据
const fontDownloads = {
    'source-han-sans': {
        name: '思源黑体',
        url: 'https://github.com/adobe-fonts/source-han-sans/releases/download/2.004R/SourceHanSansSC.zip',
        size: '15MB',
        description: 'Adobe与Google合作开发的开源黑体字族'
    },
    'source-han-serif': {
        name: '思源宋体',
        url: 'https://github.com/adobe-fonts/source-han-serif/releases/download/2.001R/09_SourceHanSerifSC.zip',
        size: '18MB',
        description: '开源宋体字族，适合正文排版'
    },
    'alibaba-puhuiti': {
        name: '阿里巴巴普惠体',
        url: 'https://puhuiti.alibaba.com/download',
        size: '12MB',
        description: '阿里巴巴集团推出的免费商用字体'
    },
    'zcool-gaoduan': {
        name: '站酷高端黑',
        url: 'https://www.zcool.com.cn/special/zcoolfonts/',
        size: '8MB',
        description: '站酷网推出的免费字体'
    },
    'fangzheng-kaiti': {
        name: '方正楷体',
        url: '#',
        size: '6MB',
        description: '经典楷体字型'
    },
    'wenquanyi-microhei': {
        name: '文泉驿微米黑',
        url: 'http://wenq.org/wqy2/index.cgi?MicroHei',
        size: '4MB',
        description: '开源中文字体项目'
    }
};

// 模板下载数据
const templateDownloads = {
    'work-report': {
        name: '工作报告模板',
        content: generateWorkReportTemplate(),
        filename: 'work-report-template.md'
    },
    'business-plan': {
        name: '商业计划书模板',
        content: generateBusinessPlanTemplate(),
        filename: 'business-plan-template.md'
    },
    'meeting-minutes': {
        name: '会议纪要模板',
        content: generateMeetingMinutesTemplate(),
        filename: 'meeting-minutes-template.md'
    }
};

// 下载字体
function downloadFont(fontId) {
    const font = fontDownloads[fontId];
    if (!font) {
        CommonUtils.showNotification('字体信息未找到！', 'error');
        return;
    }

    // 显示下载提示
    CommonUtils.showNotification(`正在准备下载 ${font.name}...`, 'info');
    
    // 记录下载统计
    recordDownload('font', fontId);

    if (font.url === '#' || !font.url) {
        // 模拟字体文件生成（实际项目中应该是真实的字体文件）
        CommonUtils.showNotification('此字体暂未提供直接下载，请访问官方网站获取。', 'warning');
        return;
    }

    // 对于外部链接，打开新窗口
    if (font.url.startsWith('http')) {
        window.open(font.url, '_blank');
        CommonUtils.showNotification(`已打开 ${font.name} 下载页面`, 'success');
    }
}

// 下载模板
function downloadTemplate(templateId) {
    const template = templateDownloads[templateId];
    if (!template) {
        CommonUtils.showNotification('模板信息未找到！', 'error');
        return;
    }

    try {
        // 创建并下载文件
        const blob = new Blob([template.content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = template.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        CommonUtils.showNotification(`${template.name} 下载成功！`, 'success');
        
        // 记录下载统计
        recordDownload('template', templateId);
    } catch (error) {
        console.error('下载模板时出错:', error);
        CommonUtils.showNotification('下载失败，请重试！', 'error');
    }
}

// 打开外部链接
function openExternalLink(url) {
    window.open(url, '_blank');
    CommonUtils.showNotification('已在新窗口打开链接', 'info');
}

// 记录下载统计
function recordDownload(type, id) {
    const stats = JSON.parse(localStorage.getItem('downloadStats') || '{}');
    const key = `${type}_${id}`;
    stats[key] = (stats[key] || 0) + 1;
    localStorage.setItem('downloadStats', JSON.stringify(stats));
}

// 初始化下载统计
function initializeDownloadStats() {
    const stats = JSON.parse(localStorage.getItem('downloadStats') || '{}');
    console.log('下载统计:', stats);
}

// 生成工作报告模板
function generateWorkReportTemplate() {
    return `# 工作报告

## 基本信息
- **报告人：** [姓名]
- **部门：** [部门名称]
- **报告期间：** [开始日期] - [结束日期]
- **报告日期：** [报告日期]

## 工作概述
[简要描述本期工作的整体情况和主要成果]

## 主要工作内容

### 1. [工作项目一]
- **目标：** [项目目标]
- **进展：** [具体进展情况]
- **成果：** [取得的成果]
- **问题：** [遇到的问题及解决方案]

### 2. [工作项目二]
- **目标：** [项目目标]
- **进展：** [具体进展情况]
- **成果：** [取得的成果]
- **问题：** [遇到的问题及解决方案]

### 3. [工作项目三]
- **目标：** [项目目标]
- **进展：** [具体进展情况]
- **成果：** [取得的成果]
- **问题：** [遇到的问题及解决方案]

## 数据统计

| 指标名称 | 目标值 | 实际值 | 完成率 | 备注 |
|---------|-------|-------|-------|------|
| [指标1] | [目标] | [实际] | [百分比] | [说明] |
| [指标2] | [目标] | [实际] | [百分比] | [说明] |
| [指标3] | [目标] | [实际] | [百分比] | [说明] |

## 经验总结
### 成功经验
1. [经验一]
2. [经验二]
3. [经验三]

### 存在问题
1. [问题一及改进措施]
2. [问题二及改进措施]
3. [问题三及改进措施]

## 下期工作计划
### 主要目标
1. [目标一]
2. [目标二]
3. [目标三]

### 具体措施
1. [措施一]
2. [措施二]
3. [措施三]

### 预期成果
[描述预期达到的成果和效果]

## 需要支持
[列出需要上级或其他部门支持的事项]

---
*报告人签名：[签名]*  
*日期：[日期]*`;
}

// 生成商业计划书模板
function generateBusinessPlanTemplate() {
    return `# 商业计划书

## 执行摘要
[简要概述项目的核心内容、市场机会、竞争优势和预期收益]

## 公司概述
### 公司简介
- **公司名称：** [公司名称]
- **成立时间：** [成立时间]
- **注册地址：** [注册地址]
- **法人代表：** [法人代表]

### 使命愿景
- **使命：** [公司使命]
- **愿景：** [公司愿景]
- **价值观：** [核心价值观]

## 产品/服务介绍
### 产品概述
[详细描述产品或服务的功能、特点和优势]

### 技术优势
[说明技术创新点和竞争优势]

### 知识产权
[列出相关专利、商标等知识产权情况]

## 市场分析
### 市场规模
- **总体市场规模：** [数据]
- **目标市场规模：** [数据]
- **市场增长率：** [百分比]

### 目标客户
[描述目标客户群体的特征和需求]

### 竞争分析
| 竞争对手 | 优势 | 劣势 | 市场份额 |
|---------|------|------|---------|
| [竞争对手1] | [优势] | [劣势] | [份额] |
| [竞争对手2] | [优势] | [劣势] | [份额] |

## 营销策略
### 市场定位
[明确产品在市场中的定位]

### 营销渠道
1. [渠道一]
2. [渠道二]
3. [渠道三]

### 推广策略
[详细的市场推广和营销策略]

## 运营计划
### 组织架构
[公司组织架构图和人员配置]

### 运营流程
[核心业务流程说明]

### 质量控制
[质量管理体系和控制措施]

## 财务预测
### 收入预测
| 年份 | 第1年 | 第2年 | 第3年 | 第4年 | 第5年 |
|------|-------|-------|-------|-------|-------|
| 收入 | [金额] | [金额] | [金额] | [金额] | [金额] |
| 成本 | [金额] | [金额] | [金额] | [金额] | [金额] |
| 利润 | [金额] | [金额] | [金额] | [金额] | [金额] |

### 资金需求
- **总资金需求：** [金额]
- **资金用途：** [详细说明]
- **融资方式：** [股权/债权等]

## 风险分析
### 主要风险
1. **市场风险：** [风险描述及应对措施]
2. **技术风险：** [风险描述及应对措施]
3. **财务风险：** [风险描述及应对措施]
4. **运营风险：** [风险描述及应对措施]

## 投资回报
### 退出策略
[IPO、并购等退出方式说明]

### 投资回报预期
[详细的投资回报分析]

---
*计划制定人：[姓名]*  
*日期：[日期]*`;
}

// 生成会议纪要模板
function generateMeetingMinutesTemplate() {
    return `# 会议纪要

## 会议基本信息
- **会议主题：** [会议主题]
- **会议时间：** [日期] [开始时间] - [结束时间]
- **会议地点：** [会议地点/在线会议平台]
- **会议主持：** [主持人姓名]
- **记录人：** [记录人姓名]

## 参会人员
### 必须参加
- [姓名] - [职位] - [部门]
- [姓名] - [职位] - [部门]

### 邀请参加
- [姓名] - [职位] - [部门]
- [姓名] - [职位] - [部门]

### 实际出席
- ✅ [姓名] - [职位] - [部门]
- ✅ [姓名] - [职位] - [部门]
- ❌ [姓名] - [职位] - [部门] (请假)

## 会议议程
1. [议题一] - [负责人] - [预计时间]
2. [议题二] - [负责人] - [预计时间]
3. [议题三] - [负责人] - [预计时间]

## 会议内容

### 议题一：[议题标题]
**汇报人：** [汇报人姓名]

**主要内容：**
[详细记录讨论的主要内容和观点]

**讨论要点：**
- [要点一]
- [要点二]
- [要点三]

### 议题二：[议题标题]
**汇报人：** [汇报人姓名]

**主要内容：**
[详细记录讨论的主要内容和观点]

**讨论要点：**
- [要点一]
- [要点二]
- [要点三]

### 议题三：[议题标题]
**汇报人：** [汇报人姓名]

**主要内容：**
[详细记录讨论的主要内容和观点]

**讨论要点：**
- [要点一]
- [要点二]
- [要点三]

## 会议决议

| 序号 | 决议内容 | 负责人 | 完成时间 | 备注 |
|------|---------|-------|---------|------|
| 1 | [决议内容] | [负责人] | [时间] | [备注] |
| 2 | [决议内容] | [负责人] | [时间] | [备注] |
| 3 | [决议内容] | [负责人] | [时间] | [备注] |

## 行动计划

### 近期行动（本周内）
- [ ] [行动项目] - 负责人：[姓名] - 截止：[日期]
- [ ] [行动项目] - 负责人：[姓名] - 截止：[日期]

### 中期行动（本月内）
- [ ] [行动项目] - 负责人：[姓名] - 截止：[日期]
- [ ] [行动项目] - 负责人：[姓名] - 截止：[日期]

### 长期行动（季度内）
- [ ] [行动项目] - 负责人：[姓名] - 截止：[日期]
- [ ] [行动项目] - 负责人：[姓名] - 截止：[日期]

## 下次会议
- **时间：** [日期] [时间]
- **地点：** [地点]
- **主要议题：** [议题预告]

## 附件
1. [附件名称] - [文件链接或说明]
2. [附件名称] - [文件链接或说明]

---
*记录人：[姓名]*  
*审核人：[姓名]*  
*日期：[日期]*`;
}

// 添加CSS样式到页面
const additionalCSS = `
<style>
.category-btn {
    padding: 0.75rem 1.5rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
    color: #6b7280;
    font-weight: 500;
    transition: all 0.3s ease;
    cursor: pointer;
}

.category-btn:hover {
    border-color: #3b82f6;
    color: #3b82f6;
}

.category-btn.active {
    border-color: #3b82f6;
    background: #3b82f6;
    color: white;
}

.download-section {
    display: none;
}

.download-section.active {
    display: block;
}

.download-card {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    border: 1px solid #e5e7eb;
}

.download-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.download-icon {
    width: 3rem;
    height: 3rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

.download-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
}

.download-description {
    color: #6b7280;
    line-height: 1.6;
    margin-bottom: 1rem;
    font-size: 0.875rem;
}

.download-info {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    font-size: 0.75rem;
}

.download-size, .download-format {
    padding: 0.25rem 0.5rem;
    background: #f3f4f6;
    border-radius: 0.25rem;
    color: #6b7280;
}

.download-preview {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
    text-align: center;
    font-size: 1.125rem;
    color: #374151;
}

.download-button {
    width: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    border: none;
    font-weight: 500;
    transition: all 0.3s ease;
    cursor: pointer;
}

.download-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(102, 126, 234, 0.3);
}
</style>
`;

// 将CSS添加到页面头部
document.head.insertAdjacentHTML('beforeend', additionalCSS);
