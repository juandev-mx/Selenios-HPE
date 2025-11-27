// static/js/notifications.js - VERSIÓN MODIFICADA
class NotificationManager {
    constructor(options = {}) {
        const { enablePendingPOCAlerts = false } = options;
        
        this.container = null;
        this.checkInterval = null;
        this.toastTimers = new WeakMap();
        this.activeUserId = null;
        this.enablePendingPOCAlerts = enablePendingPOCAlerts;
        
        // CONFIGURACIÓN: Cambia este valor para ajustar el intervalo de verificación (en minutos)
        this.checkIntervalMinutes = 2; // ← CAMBIA AQUÍ el intervalo de verificación
        
        // CONFIGURACIÓN: Días después de los cuales mostrar la notificación
        this.daysThreshold = 1; // ← CAMBIA AQUÍ los días de espera (1 = 24 horas)
        
        this.init();
    }

    init() {
        this.ensureStyles();
        this.createContainer();
        
        if (this.enablePendingPOCAlerts) {
            this.startPeriodicCheck();
        }
    }

    ensureStyles() {
        if (document.querySelector('link[data-notifications="true"]')) {
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/static/css/notifications.css';
        link.dataset.notifications = 'true';
        document.head.appendChild(link);
    }

    createContainer() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    startPeriodicCheck() {
        // Convertir minutos a milisegundos
        const intervalMs = this.checkIntervalMinutes * 60 * 1000;
        
        // Verificar inmediatamente al cargar la página
        setTimeout(() => {
            this.checkPendingPOCs();
        }, 3000);

        // Verificar periódicamente
        this.checkInterval = setInterval(() => {
            this.checkPendingPOCs();
        }, intervalMs);

        console.log(`🔔 Notification system initiated. Checking each ${this.checkIntervalMinutes} minutes for POCs with more than ${this.daysThreshold} day(s)`);
    }

    async checkPendingPOCs() {
        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            if (!user || user.role !== 'CLIENT') return;
            
            this.activeUserId = user.id || user.user_id;
            if (this.isNotificationDismissed()) return;

            const response = await fetch(`/api/pocs/pending?user_id=${user.id}`);
            const pendingPOCs = await response.json();

            if (pendingPOCs && pendingPOCs.length > 0) {
                // Filtrar POCs que tienen más de X días
                const oldPOCs = pendingPOCs.filter(poc => this.isPOCOldEnough(poc));
                
                if (oldPOCs.length > 0) {
                    this.showNotification(oldPOCs);
                }
            }

        } catch (error) {
            console.error('Error checking pending POCs:', error);
        }
    }

    isPOCOldEnough(poc) {
        if (!poc.created_date) return false;
        
        try {
            const createdDate = new Date(poc.created_date);
            const now = new Date();
            
            // Calcular diferencia en días
            const diffTime = Math.abs(now - createdDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            console.log(`POC ${poc.poc_id}: created ago ${diffDays} days`);
            
            return diffDays >= this.daysThreshold;
            
        } catch (error) {
            console.error('Error calculating POC age:', error);
            return false;
        }
    }

    showNotification(pendingPOCs) {
        if (this.isNotificationDismissed()) {
            return;
        }

        // Evitar notificaciones duplicadas
        if (this.container.querySelector('.notification')) {
            return;
        }

        const notification = this.createNotificationElement(pendingPOCs);
        this.container.appendChild(notification);

        // Auto-eliminar después de 15 segundos (más tiempo para leer)
        this.setAutoRemove(notification, 15000);
    }

    createNotificationElement(pendingPOCs) {
        const notification = document.createElement('div');
        notification.className = 'notification notification-warning';
        
        // Determinar el nivel de urgencia basado en el tiempo
        const criticalPOCs = pendingPOCs.filter(poc => this.isPOCCritical(poc));
        const notificationClass = criticalPOCs.length > 0 ? 'notification-critical' : 'notification-warning';
        notification.className = `notification ${notificationClass}`;

        const totalPOCs = pendingPOCs.length;
        const timeMessage = this.getTimeMessage(pendingPOCs);

        notification.innerHTML = `
            <div class="notification-progress"></div>
            <div class="notification-header">
                <div class="notification-icon">⏰</div>
                <h3 class="notification-title">POCs Pending Approval</h3>
                <button class="notification-close" type="button">×</button>
            </div>
            <div class="notification-content">
                <p class="notification-message">
                    You have ${totalPOCs} POC${totalPOCs > 1 ? 's' : ''} awaiting${totalPOCs > 1 ? 's' : ''} approval for more than ${this.daysThreshold} day${this.daysThreshold > 1 ? 's' : ''}. 
                    ${timeMessage}
                </p>
                <div class="notification-pocs">
                    ${pendingPOCs.slice(0, 3).map(poc => `
                        <div class="notification-poc-item">
                            <span class="notification-poc-name">${this.truncateText(poc.business_justification, 30)}</span>
                            <span class="notification-poc-time">${this.getTimeAgo(poc.created_date)}</span>
                        </div>
                    `).join('')}
                    ${pendingPOCs.length > 3 ? 
                        `<div class="notification-poc-item">
                            <span class="notification-poc-name">... and ${pendingPOCs.length - 3} more</span>
                        </div>` 
                        : ''}
                </div>
            </div>
            <div class="notification-actions">
                <button class="notification-btn notification-btn-secondary" data-action="remind-later">Remember later</button>
                <button class="notification-btn notification-btn-primary" data-action="view-pocs">Review POCs</button>
            </div>
        `;

        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.removeNotification(notification));
        }

        const remindBtn = notification.querySelector('[data-action="remind-later"]');
        if (remindBtn) {
            remindBtn.addEventListener('click', () => this.remindLater(notification));
        }

        const viewBtn = notification.querySelector('[data-action="view-pocs"]');
        if (viewBtn) {
            viewBtn.addEventListener('click', () => this.viewPOCs());
        }

        return notification;
    }

    isPOCCritical(poc) {
        if (!poc.created_date) return false;
        
        try {
            const createdDate = new Date(poc.created_date);
            const now = new Date();
            
            // Calcular diferencia en días
            const diffTime = Math.abs(now - createdDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // CONFIGURACIÓN: Días para considerar crítico (más de 2 días)
            return diffDays > (this.daysThreshold + 1); // ← CAMBIA AQUÍ para ajustar crítico
        } catch (error) {
            return false;
        }
    }

    getTimeMessage(pendingPOCs) {
        const oldestPOC = pendingPOCs.reduce((oldest, poc) => {
            try {
                const pocDate = new Date(poc.created_date);
                return !oldest || pocDate < oldest ? pocDate : oldest;
            } catch {
                return oldest;
            }
        }, null);

        if (oldestPOC) {
            const now = new Date();
            const diffTime = Math.abs(now - oldestPOC);
            const daysOld = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (daysOld > this.daysThreshold) {
                return `The oldest one is ${daysOld} days old.`;
            }
        }
        
        return "Don't forget to check them soon.";
    }

    getTimeAgo(createdDate) {
        try {
            const now = new Date();
            const created = new Date(createdDate);
            const diffMs = now - created;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            if (diffDays > 0) {
                return `${diffDays} day${diffDays > 1 ? 's' : ''} old`;
            } else if (diffHours > 0) {
                return `${diffHours} hour${diffHours > 1 ? 's' : ''} old`;
            } else {
                return 'Today';
            }
        } catch (error) {
            return 'Date unknown';
        }
    }

    removeNotification(notification) {
        const timer = this.toastTimers.get(notification);
        if (timer) {
            clearTimeout(timer);
            this.toastTimers.delete(notification);
        }

        notification.classList.add('notification-fade-out');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 300);
    }

    remindLater(notification) {
        this.removeNotification(notification);
        this.markNotificationDismissed();
    }

    viewPOCs() {
        window.location.href = '/pocs_clientes.html';
    }

    truncateText(text, maxLength) {
        if (!text) return 'No description';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    setAutoRemove(notification, duration = 5000) {
        if (duration === Infinity) return;
        const timer = setTimeout(() => this.removeNotification(notification), duration);
        this.toastTimers.set(notification, timer);
    }

    showToast({
        title = 'Aviso',
        message = '',
        type = 'info',
        duration = 5000,
        actions = [],
        dismissible = true
    } = {}) {
        if (!this.container) {
            this.createContainer();
        }

        const typeClass = this.getTypeClass(type);
        const notification = document.createElement('div');
        notification.className = `notification ${typeClass}`;

        const progress = document.createElement('div');
        progress.className = 'notification-progress';
        progress.style.animationDuration = `${duration}ms`;
        if (duration === Infinity) {
            progress.style.display = 'none';
        }

        const header = document.createElement('div');
        header.className = 'notification-header';

        const icon = document.createElement('div');
        icon.className = 'notification-icon';
        icon.textContent = this.getIconForType(type);

        const titleEl = document.createElement('h3');
        titleEl.className = 'notification-title';
        titleEl.textContent = title;

        header.appendChild(icon);
        header.appendChild(titleEl);

        if (dismissible) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'notification-close';
            closeBtn.type = 'button';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.removeNotification(notification));
            header.appendChild(closeBtn);
        }

        const content = document.createElement('div');
        content.className = 'notification-content';

        const messageEl = document.createElement('p');
        messageEl.className = 'notification-message';
        messageEl.textContent = message;
        content.appendChild(messageEl);

        notification.appendChild(progress);
        notification.appendChild(header);
        notification.appendChild(content);

        if (actions && actions.length > 0) {
            const actionsWrapper = document.createElement('div');
            actionsWrapper.className = 'notification-actions';

            actions.forEach(action => {
                const btn = document.createElement('button');
                btn.className = `notification-btn ${action.variant === 'secondary' ? 'notification-btn-secondary' : 'notification-btn-primary'}`;
                btn.textContent = action.label || 'Action';
                btn.addEventListener('click', () => {
                    if (typeof action.onClick === 'function') {
                        action.onClick();
                    }
                    if (action.autoClose !== false) {
                        this.removeNotification(notification);
                    }
                });
                actionsWrapper.appendChild(btn);
            });

            notification.appendChild(actionsWrapper);
        }

        this.container.appendChild(notification);
        this.setAutoRemove(notification, duration);

        return notification;
    }

    getTypeClass(type = 'info') {
        switch (type) {
            case 'success':
                return 'notification-success';
            case 'warning':
                return 'notification-warning';
            case 'error':
                return 'notification-error';
            case 'critical':
                return 'notification-critical';
            default:
                return 'notification-info';
        }
    }

    getIconForType(type = 'info') {
        switch (type) {
            case 'success':
                return '✓';
            case 'warning':
                return '!';
            case 'error':
            case 'critical':
                return '⚠';
            default:
                return 'ℹ';
        }
    }

    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        if (this.container && this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }
        this.toastTimers = new WeakMap();
    }

    getDismissKey() {
        return this.activeUserId ? `pocNotificationDismissed_${this.activeUserId}` : null;
    }

    isNotificationDismissed() {
        const key = this.getDismissKey();
        if (!key) return false;
        return localStorage.getItem(key) === 'true';
    }

    markNotificationDismissed() {
        const key = this.getDismissKey();
        if (key) {
            localStorage.setItem(key, 'true');
        }
    }
}

let notificationManager = null;
const notificationQueue = [];
let confirmDialogInstance = null;

const enqueueNotification = (payload) => {
    if (notificationManager) {
        notificationManager.showToast(payload);
    } else {
        notificationQueue.push(payload);
    }
};

window.notify = {
    success: (message, options = {}) => enqueueNotification({ ...options, type: 'success', message, title: options.title || 'Success' }),
    info: (message, options = {}) => enqueueNotification({ ...options, type: 'info', message, title: options.title || 'Notice' }),
    warning: (message, options = {}) => enqueueNotification({ ...options, type: 'warning', message, title: options.title || 'Heads up' }),
    error: (message, options = {}) => enqueueNotification({ ...options, type: 'error', message, title: options.title || 'Error' })
};

class ConfirmDialog {
    constructor() {
        this.overlay = null;
        this.resolve = null;
        this.build();
    }

    build() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'confirm-modal-overlay';
        this.overlay.innerHTML = `
            <div class="confirm-modal">
                <div class="confirm-modal__icon">⚡</div>
                <h3 class="confirm-modal__title"></h3>
                <p class="confirm-modal__message"></p>
                <div class="confirm-modal__actions">
                    <button class="confirm-btn confirm-btn-secondary" data-action="cancel">Cancel</button>
                    <button class="confirm-btn confirm-btn-primary" data-action="confirm">Confirm</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        this.overlay.addEventListener('click', (event) => {
            if (event.target === this.overlay) {
                this.handleAction(false);
            }
        });

        this.overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => this.handleAction(false));
        this.overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => this.handleAction(true));
    }

    show({ title = 'Are you sure?', message = '', confirmText = 'Confirm', cancelText = 'Cancel', icon = '⚡' } = {}) {
        return new Promise((resolve) => {
            this.resolve = resolve;
            this.overlay.querySelector('.confirm-modal__title').textContent = title;
            this.overlay.querySelector('.confirm-modal__message').textContent = message;
            this.overlay.querySelector('.confirm-modal__icon').textContent = icon;
            this.overlay.querySelector('[data-action="confirm"]').textContent = confirmText;
            this.overlay.querySelector('[data-action="cancel"]').textContent = cancelText;

            this.overlay.classList.add('active');
        });
    }

    handleAction(accepted) {
        if (this.resolve) {
            this.resolve(accepted);
        }
        this.overlay.classList.remove('active');
        this.resolve = null;
    }
}

function getConfirmDialog() {
    if (!confirmDialogInstance) {
        confirmDialogInstance = new ConfirmDialog();
    }
    return confirmDialogInstance;
}

window.showConfirmDialog = (options) => getConfirmDialog().show(options);

document.addEventListener('DOMContentLoaded', () => {
    const enablePending = document.body?.dataset?.enablePocNotifications === 'true';
    notificationManager = new NotificationManager({ enablePendingPOCAlerts: enablePending });
    window.notificationManager = notificationManager;

    while (notificationQueue.length) {
        const payload = notificationQueue.shift();
        notificationManager.showToast(payload);
    }
});
window.notificationManager = notificationManager;