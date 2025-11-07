
document.addEventListener('DOMContentLoaded', function() {
        const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

        if (user.role !== 'CLIENT') {
        alert('Acceso denegado. Esta página es solo para clientes.');
        window.location.href = '/login.html';
        return;
    }

        initClientDashboard(user);
});

async function initClientDashboard(user) {
        document.getElementById('customer-name').textContent = user.name;

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

        createAvatarMenu(user);

        await loadPOCStats(user.id);

        await loadRecentAlerts(user.id);
}

function createAvatarMenu(user) {
    const headerNav = document.querySelector('.header-nav');
    const avatar = headerNav.querySelector('.avatar');
    
    if (!avatar) return;
    
        const avatarContainer = document.createElement('div');
    avatarContainer.className = 'user-info-header';
    avatarContainer.style.position = 'relative';
    
        avatar.parentNode.insertBefore(avatarContainer, avatar);
    avatarContainer.appendChild(avatar);
    
        avatar.style.cursor = 'pointer';
    
        const company = user.client_company_name || 'N/aaaA';
    
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
            Log Out
        </button>
    `;
    
        avatarContainer.appendChild(menu);
    
        addAvatarMenuStyles();
    
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
    
        const logoutBtn = menu.querySelector('#avatarLogoutBtn');
    logoutBtn.addEventListener('click', async function() {
        try {
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
                        sessionStorage.removeItem('user');

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

async function loadPOCStats(userId) {
    try {
        const response = await fetch(`/pocs?client_user_id=${userId}`);
        const pocs = await response.json();

                const pending = pocs.filter(p => !p.is_approved && p.is_approved !== true).length;
        const approved = pocs.filter(p => p.is_approved === true).length;
        const rejected = 0; 
                document.getElementById('pending-count').textContent = pending;
        document.getElementById('approved-count').textContent = approved;
        document.getElementById('rejected-count').textContent = rejected;

                if (approved > 0) {
            addAlert('✓', 'POC Approved', `You have ${approved} approved POC${approved > 1 ? 's' : ''}.`, 'success');
        }

    } catch (error) {
        console.error('Error loading POC stats:', error);
    }
}

async function loadRecentAlerts(userId) {
    try {
        const response = await fetch(`/pocs?client_user_id=${userId}`);
        const pocs = await response.json();

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

                container.innerHTML = '';
        
                const recentPOCs = pocs.slice(0, 3);
        
        recentPOCs.forEach(poc => {
            const statusIcon = poc.is_approved ? '✓' : '⏳';
            const statusText = poc.is_approved ? 'approved' : 'pending approval';
            
            container.innerHTML += `
                <div class="alert-card">
                    <div class="alert-icon">${statusIcon}</div>
                    <div class="alert-content">
                        <h3>POC - ${statusText}</h3>
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

function openViewPOCs() {
            const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user) return;

        window.location.href = `/pocs_clientes.html`;
}

async function showPOCsList(userId) {
    try {
        const response = await fetch(`/pocs?client_user_id=${userId}`);
        const pocs = await response.json();

                        console.log('User POCs:', pocs);
        
    } catch (error) {
        console.error('Error loading POCs list:', error);
    }
}

function openViewPOCs() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user) return;

    window.location.href = `/pocs_clientes.html`;
}

function openAnalytics() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user) return;

    window.location.href = `/analytics_cliente.html`;
}