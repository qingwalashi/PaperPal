// 台签排版功能脚本
document.addEventListener('DOMContentLoaded', function() {
    initializeNameplate();
});

function initializeNameplate() {
    // 设置导航活动项
    if (window.navigation) {
        window.navigation.updateActiveNavItem('nameplate');
    }

    // 初始化订阅功能
    initializeSubscription();
    
    // 初始化反馈功能
    initializeFeedback();
    
    // 添加页面交互效果
    addInteractiveEffects();
}

// 初始化订阅功能
function initializeSubscription() {
    const emailInput = document.getElementById('notification-email');
    const subscribeBtn = document.getElementById('subscribe-btn');
    
    if (!emailInput || !subscribeBtn) return;
    
    subscribeBtn.addEventListener('click', handleSubscription);
    
    emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSubscription();
        }
    });
    
    // 邮箱格式验证
    emailInput.addEventListener('input', (e) => {
        const email = e.target.value;
        const isValid = validateEmail(email);
        
        if (email && !isValid) {
            emailInput.classList.add('border-red-300');
            emailInput.classList.remove('border-gray-300');
        } else {
            emailInput.classList.remove('border-red-300');
            emailInput.classList.add('border-gray-300');
        }
    });
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
