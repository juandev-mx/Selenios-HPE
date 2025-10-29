// client-dashboard.js - Lógica del dashboard del cliente

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    // Verificar que sea cliente
    if (user.role !== 'CLIENT') {
        alert('Acceso denegado. Esta página es solo para clientes.');
        window.location.href = '/login.html';
        return;
    }

    // Inicializar dashboard
    initClientDashboard(user);
});

async function initClientDashboard(user) {
    // Mostrar nombre del usuario
    document.getElementById('customer-name').textContent = user.name;

    // Cargar estadísticas de POCs
    await loadPOCStats(user.id);

    // Cargar alertas recientes
    await loadRecentAlerts(user.id);
}

// Cargar estadísticas de POCs del usuario
async function loadPOCStats(userId) {
    try {
        const response = await fetch(`/pocs?client_user_id=${userId}`);
        const pocs = await response.json();

        // Contar por estado
        const pending = pocs.filter(p => !p.is_approved && p.is_approved !== true).length;
        const approved = pocs.filter(p => p.is_approved === true).length;
        const rejected = 0; // Asumiendo que los rechazados se eliminan

        // Actualizar números en el dashboard
        document.getElementById('pending-count').textContent = pending;
        document.getElementById('approved-count').textContent = approved;
        document.getElementById('rejected-count').textContent = rejected;

        // Generar alertas si hay actualizaciones
        if (approved > 0) {
            addAlert('✓', 'POC Approved', `You have ${approved} approved POC${approved > 1 ? 's' : ''}.`, 'success');
        }

    } catch (error) {
        console.error('Error loading POC stats:', error);
    }
}

// Cargar alertas recientes
async function loadRecentAlerts(userId) {
    try {
        const response = await fetch(`/api/pocs?client_user_id=${userId}`);
        const pocs = await response.json();

        // Limpiar contenedor de alertas
        const container = document.getElementById('alerts-container');
        
        if (pocs.length === 0) {
            container.innerHTML = `
                <div class="alert-card">
                    <div class="alert-icon">💡</div>
                    <div class="alert-content">
                        <h3>Welcome to HPE Customer Portal</h3>
                        <p>Create your first POC to get started with our solutions.</p>
                    </div>
                </div>
            `;
            return;
        }

        // Mostrar POCs recientes
        container.innerHTML = '';
        
        // Últimos 3 POCs
        const recentPOCs = pocs.slice(0, 3);
        
        recentPOCs.forEach(poc => {
            const statusIcon = poc.is_approved ? '✓' : '⏳';
            const statusText = poc.is_approved ? 'approved' : 'pending approval';
            
            container.innerHTML += `
                <div class="alert-card">
                    <div class="alert-icon">${statusIcon}</div>
                    <div class="alert-content">
                        <h3>POC #${poc.poc_id} - ${statusText}</h3>
                        <p>${poc.business_justification.substring(0, 80)}...</p>
                        <small style="color: #618975;">Created: ${new Date(poc.created_date).toLocaleDateString()}</small>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

// Función auxiliar para agregar alertas
function addAlert(icon, title, message, type = 'info') {
    const container = document.getElementById('alerts-container');
    
    const alertHTML = `
        <div class="alert-card">
            <div class="alert-icon">${icon}</div>
            <div class="alert-content">
                <h3>${title}</h3>
                <p>${message}</p>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('afterbegin', alertHTML);
}

// Implementar función para ver POCs (placeholder)
function openViewPOCs() {
    // Esta función ya está declarada en pocs.js
    // Puedes expandirla para mostrar un modal con la lista de POCs
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user) return;

    // Por ahora, solo redirige o muestra un mensaje
    alert('This feature will show all your POCs. Coming soon!');
    
    // Opcional: Crear otro modal para mostrar la lista de POCs
    // showPOCsList(user.id);
}

// Función opcional para mostrar lista de POCs en modal
async function showPOCsList(userId) {
    try {
        const response = await fetch(`/api/pocs?client_user_id=${userId}`);
        const pocs = await response.json();

        // Crear y mostrar modal con lista de POCs
        // Implementar según necesidades
        console.log('User POCs:', pocs);
        
    } catch (error) {
        console.error('Error loading POCs list:', error);
    }
}