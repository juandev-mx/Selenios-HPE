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

    // Obtener información de la compañía si no está en el objeto user
    if (user.client_company_id) {
        try {
            const response = await fetch(`/client_company/${user.client_company_id}`);
            if (response.ok) {
                const company = await response.json();
                user.client_company_name = company.name;
            }
        } catch (error) {
            console.error('Error loading company info:', error);
        }
    }

    // Crear menú de avatar
    createAvatarMenu(user);

    // Cargar estadísticas de POCs
    await loadPOCStats(user.id);

    // Cargar alertas recientes
    await loadRecentAlerts(user.id);
}

function createAvatarMenu(user) {
    const headerNav = document.querySelector('.header-nav');
    const avatar = headerNav.querySelector('.avatar');
    
    if (!avatar) return;
    
    // Crear contenedor para el avatar y el menú
    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'user-info-header';
    avatarContainer.style.position = 'relative';
    
    // Reemplazar el avatar con el contenedor
    avatar.parentNode.insertBefore(avatarContainer, avatar);
    avatarContainer.appendChild(avatar);
    
    // Hacer el avatar clickeable
    avatar.style.cursor = 'pointer';
    
    // Determinar la compañía
    const company = user.client_company_name || 'N/aaaA';
    
    // Crear el menú desplegable
    const menu = document.createElement('div');
    menu.id = 'avatar-menu';
    menu.className = 'avatar-menu';
    menu.style.display = 'none';
    menu.innerHTML = `
        <div class="avatar-menu-header">
            <img src="${avatar.src}" alt="User Avatar" class="avatar-menu-img">
            <div class="avatar-menu-info">
                <div class="avatar-menu-name">${user.name || 'User'}</div>
                <div class="avatar-menu-role">${user.role || 'N/A'}</div>
            </div>
        </div>
        <div class="avatar-menu-divider"></div>
        <div class="avatar-menu-details">
            <div class="avatar-menu-item">
                <span class="avatar-menu-label">Company:</span>
                <span class="avatar-menu-value">${company}</span>
            </div>
            <div class="avatar-menu-item">
                <span class="avatar-menu-label">Email:</span>
                <span class="avatar-menu-value">${user.mail || 'N/A'}</span>
            </div>
        </div>
        <div class="avatar-menu-divider"></div>
        <button class="avatar-menu-logout" id="avatarLogoutBtn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10.6667 11.3333L14 8L10.6667 4.66667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Log Out
        </button>
    `;
    
    // Insertar después del avatar
    avatarContainer.appendChild(menu);
    
    // Agregar estilos
    addAvatarMenuStyles();
    
    // Toggle del menú al hacer clic en el avatar
    avatar.addEventListener('click', function(e) {
        e.stopPropagation();
        const isVisible = menu.style.display === 'block';
        
        if (isVisible) {
            menu.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                menu.style.display = 'none';
            }, 250);
        } else {
            menu.style.display = 'block';
            menu.style.animation = 'slideDown 0.3s ease';
        }
    });
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!avatarContainer.contains(e.target)) {
            if (menu.style.display === 'block') {
                menu.style.animation = 'slideUp 0.3s ease';
                setTimeout(() => {
                    menu.style.display = 'none';
                }, 250);
            }
        }
    });
    
    // Logout desde el menú
    const logoutBtn = menu.querySelector('#avatarLogoutBtn');
    logoutBtn.addEventListener('click', async function() {
        try {
            // Cerrar sesión en Supabase (si está disponible)
            if (typeof supabase !== 'undefined') {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error('Error cerrando sesión en Supabase:', error.message);
                } else {
                    console.log('Sesión de Supabase cerrada correctamente');
                }
            }
        } catch (err) {
            console.error('Error en logout:', err);
        } finally {
            // Limpiar sesión local
            sessionStorage.removeItem('user');

            // Redirigir al login
            window.location.href = '/login.html';
        }
    });
}

function addAvatarMenuStyles() {
    if (document.getElementById('avatar-menu-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'avatar-menu-styles';
    styles.textContent = `
        .user-info-header {
            position: relative;
        }
        
        .avatar-menu {
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            min-width: 280px;
            z-index: 1000;
            overflow: hidden;
        }
        
        .avatar-menu-header {
            padding: 1.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            background: linear-gradient(135deg, #01a982 0%, #00875a 100%);
        }
        
        .avatar-menu-img {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .avatar-menu-info {
            flex: 1;
            color: white;
        }
        
        .avatar-menu-name {
            font-size: 1rem;
            font-weight: 700;
            margin-bottom: 0.25rem;
        }
        
        .avatar-menu-role {
            font-size: 0.75rem;
            opacity: 0.9;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .avatar-menu-divider {
            height: 1px;
            background: #e5e7e6;
            margin: 0;
        }
        
        .avatar-menu-details {
            padding: 1rem 1.5rem;
        }
        
        .avatar-menu-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
        }
        
        .avatar-menu-item:last-child {
            margin-bottom: 0;
        }
        
        .avatar-menu-label {
            font-size: 0.75rem;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .avatar-menu-value {
            font-size: 0.875rem;
            color: #1f2937;
            font-weight: 500;
            max-width: 180px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            text-align: right;
        }
        
        .avatar-menu-logout {
            width: 100%;
            padding: 1rem 1.5rem;
            background: white;
            border: none;
            color: #dc2626;
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            font-family: inherit;
        }
        
        .avatar-menu-logout:hover {
            background: #fef2f2;
        }
        
        .avatar-menu-logout svg {
            width: 16px;
            height: 16px;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes slideUp {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-10px);
            }
        }
    `;
    document.head.appendChild(styles);
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
        const response = await fetch(`/pocs?client_user_id=${userId}`);
        const pocs = await response.json();

        // Limpiar contenedor de alertas
        const container = document.getElementById('alerts-container');
        
        if (pocs.length === 0) {
            container.innerHTML = `
                <div class="alert-card">
                    <div class="alert-icon"></div>
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
    window.location.href = `/pocs_clientes.html`;
}

// Función opcional para mostrar lista de POCs en modal
async function showPOCsList(userId) {
    try {
        const response = await fetch(`/pocs?client_user_id=${userId}`);
        const pocs = await response.json();

        // Crear y mostrar modal con lista de POCs
        // Implementar según necesidades
        console.log('User POCs:', pocs);
        
    } catch (error) {
        console.error('Error loading POCs list:', error);
    }
}