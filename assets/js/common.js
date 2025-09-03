// 通用工具函数和组件
class CommonUtils {
    // 显示加载状态
    static showLoading(element, text = '加载中...') {
        const originalContent = element.innerHTML;
        element.setAttribute('data-original-content', originalContent);
        element.innerHTML = `
            <span class="loading"></span>
            <span class="ml-2">${text}</span>
        `;
        element.disabled = true;
    }

    // 隐藏加载状态
    static hideLoading(element) {
        const originalContent = element.getAttribute('data-original-content');
        if (originalContent) {
            element.innerHTML = originalContent;
            element.removeAttribute('data-original-content');
        }
        element.disabled = false;
    }

    // 显示通知消息
    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${this.getNotificationClass(type)}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="bi ${this.getNotificationIcon(type)} mr-2"></i>
                <span>${message}</span>
                <button class="ml-4 text-lg leading-none" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 自动移除
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
    }

    static getNotificationClass(type) {
        const classes = {
            success: 'bg-green-100 text-green-800 border border-green-200',
            error: 'bg-red-100 text-red-800 border border-red-200',
            warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
            info: 'bg-blue-100 text-blue-800 border border-blue-200'
        };
        return classes[type] || classes.info;
    }

    static getNotificationIcon(type) {
        const icons = {
            success: 'bi-check-circle',
            error: 'bi-exclamation-circle',
            warning: 'bi-exclamation-triangle',
            info: 'bi-info-circle'
        };
        return icons[type] || icons.info;
    }

    // 文件大小格式化
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 时间格式化
    static formatDateTime(date) {
        return new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    }

    // 生成唯一ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 防抖函数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 节流函数
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 深拷贝对象
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    // 验证文件类型
    static validateFileType(file, allowedTypes) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const mimeType = file.type.toLowerCase();
        
        return allowedTypes.some(type => {
            if (type.startsWith('.')) {
                return fileExtension === type.substring(1);
            } else if (type.includes('/')) {
                return mimeType === type || mimeType.startsWith(type.split('/')[0] + '/');
            }
            return false;
        });
    }

    // 创建进度条
    static createProgressBar(container, initialProgress = 0) {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = `
            <div class="progress-fill" style="width: ${initialProgress}%"></div>
        `;
        container.appendChild(progressBar);
        
        return {
            element: progressBar,
            update: (progress) => {
                const fill = progressBar.querySelector('.progress-fill');
                fill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
            },
            remove: () => {
                if (progressBar.parentElement) {
                    progressBar.remove();
                }
            }
        };
    }
}

// 文件处理工具类
class FileHandler {
    constructor() {
        this.supportedTypes = {
            image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
            document: ['.pdf', '.doc', '.docx', '.txt', '.md'],
            archive: ['.zip', '.rar', '.7z']
        };
    }

    // 读取文件内容
    readFile(file, type = 'text') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            
            switch (type) {
                case 'text':
                    reader.readAsText(file);
                    break;
                case 'dataUrl':
                    reader.readAsDataURL(file);
                    break;
                case 'arrayBuffer':
                    reader.readAsArrayBuffer(file);
                    break;
                default:
                    reader.readAsText(file);
            }
        });
    }

    // 下载文件
    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 创建拖拽上传区域
    createDropZone(element, options = {}) {
        const defaultOptions = {
            allowedTypes: [],
            maxSize: 10 * 1024 * 1024, // 10MB
            multiple: false,
            onDrop: () => {},
            onError: () => {}
        };
        
        const config = { ...defaultOptions, ...options };
        
        element.classList.add('upload-zone');
        
        // 拖拽事件
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            element.classList.add('dragover');
        });
        
        element.addEventListener('dragleave', (e) => {
            e.preventDefault();
            element.classList.remove('dragover');
        });
        
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files, config);
        });
        
        // 点击上传
        element.addEventListener('click', () => {
            let input;
            if (config.inputId) {
                input = document.getElementById(config.inputId);
                if (!input) {
                    console.error(`File input with id '${config.inputId}' not found.`);
                    return;
                }
            } else {
                input = document.createElement('input');
                input.type = 'file';
                input.style.display = 'none'; // 隐藏动态创建的input
                document.body.appendChild(input); // 添加到DOM中以确保事件触发
            }

            input.multiple = config.multiple;
            if (config.allowedTypes.length > 0) {
                input.accept = config.allowedTypes.join(',');
            }
            
            const changeHandler = (e) => {
                const files = Array.from(e.target.files);
                this.handleFiles(files, config);
                // 如果是动态创建的，事后移除，并移除事件监听器
                if (!config.inputId) {
                    document.body.removeChild(input);
                }
                // 为防止内存泄漏，一次性事件监听器在触发后应被移除
                input.removeEventListener('change', changeHandler);
            };

            input.addEventListener('change', changeHandler, { once: true });
            // 关键：重置 value，确保连续选择同一文件名也能触发 change
            input.value = '';
            
            input.click();
        });
    }

    handleFiles(files, config) {
        const validFiles = [];
        const errors = [];
        
        files.forEach(file => {
            // 检查文件类型
            if (config.allowedTypes.length > 0 && 
                !CommonUtils.validateFileType(file, config.allowedTypes)) {
                errors.push(`文件 ${file.name} 类型不支持`);
                return;
            }
            
            // 检查文件大小
            if (file.size > config.maxSize) {
                errors.push(`文件 ${file.name} 大小超过限制`);
                return;
            }
            
            validFiles.push(file);
        });
        
        if (errors.length > 0) {
            config.onError(errors);
        }
        
        if (validFiles.length > 0) {
            config.onDrop(validFiles);
        }
    }
}

// 全局实例
window.CommonUtils = CommonUtils;
window.FileHandler = new FileHandler();

// 页面加载完成后的通用初始化
document.addEventListener('DOMContentLoaded', () => {
    // 为所有带有 data-tooltip 属性的元素添加提示
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'fixed bg-gray-800 text-white px-2 py-1 rounded text-sm z-50';
            tooltip.textContent = e.target.getAttribute('data-tooltip');
            tooltip.style.left = e.pageX + 'px';
            tooltip.style.top = (e.pageY - 30) + 'px';
            tooltip.id = 'tooltip';
            document.body.appendChild(tooltip);
        });
        
        element.addEventListener('mouseleave', () => {
            const tooltip = document.getElementById('tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        });
    });
});
