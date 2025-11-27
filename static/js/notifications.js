// static/js/notifications.js - VERSIÓN MODIFICADA
class NotificationManager {
    constructor() {
        this.container = null;
        this.checkInterval = null;
        this.notificationTimeout = null;
        
        // CONFIGURACIÓN: Cambia este valor para ajustar el intervalo de verificación (en minutos)
        this.checkIntervalMinutes = 2; // ← CAMBIA AQUÍ el intervalo de verificación
        
        // CONFIGURACIÓN: Días después de los cuales mostrar la notificación
        this.daysThreshold = 1; // ← CAMBIA AQUÍ los días de espera (1 = 24 horas)
        
        this.init();
    }

    init() {
        this.createContainer();
        this.startPeriodicCheck();
    }

    createContainer() {
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
        // Evitar notificaciones duplicadas
        if (this.container.querySelector('.notification')) {
            return;
        }

        const notification = this.createNotificationElement(pendingPOCs);
        this.container.appendChild(notification);

        // Auto-eliminar después de 15 segundos (más tiempo para leer)
        this.notificationTimeout = setTimeout(() => {
            this.removeNotification(notification);
        }, 15000);
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
                <button class="notification-close" onclick="notificationManager.removeNotification(this.parentElement.parentElement)">×</button>
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
                <button class="notification-btn notification-btn-secondary" onclick="notificationManager.remindLater(this.parentElement.parentElement)">
                    Remember later
                </button>
                <button class="notification-btn notification-btn-primary" onclick="notificationManager.viewPOCs()">
                    Review POCs
                </button>
            </div>
        `;

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
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
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
        
        // Reprogramar la siguiente verificación en 30 minutos
        setTimeout(() => {
            this.checkPendingPOCs();
        }, 30 * 60 * 1000);
    }

    viewPOCs() {
        window.location.href = '/pocs_clientes.html';
    }

    truncateText(text, maxLength) {
        if (!text) return 'No description';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
        if (this.container && this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }
    }
}

// Inicializar el manager de notificaciones
let notificationManager;

document.addEventListener('DOMContentLoaded', () => {
    notificationManager = new NotificationManager();
});

// Para desarrollo: exponer el manager globalmente
window.notificationManager = notificationManager;