document.addEventListener('DOMContentLoaded', function () {
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

    initNavbarClient(user);
});

async function initNavbarClient(user) {
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
}

/* ============================================================
   AVATAR MENU
============================================================ */

function createAvatarMenu(user) {
    const headerNav = document.querySelector('.header-nav');
    const avatar = headerNav?.querySelector('.avatar');

    if (!avatar) return;

    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'user-info-header';
    avatarContainer.style.position = 'relative';

    avatar.parentNode.insertBefore(avatarContainer, avatar);
    avatarContainer.appendChild(avatar);

    avatar.style.cursor = 'pointer';

    const company = user.client_company_name || 'N/A';

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

    /* Toggle menu */
    avatar.addEventListener('click', function (e) {
        e.stopPropagation();
        const isVisible = menu.style.display === 'block';

        if (isVisible) {
            menu.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => (menu.style.display = 'none'), 250);
        } else {
            menu.style.display = 'block';
            menu.style.animation = 'slideDown 0.3s ease';
        }
    });

    /* Cerrar menú si clic afuera */
    document.addEventListener('click', function (e) {
        if (!avatarContainer.contains(e.target)) {
            if (menu.style.display === 'block') {
                menu.style.animation = 'slideUp 0.3s ease';
                setTimeout(() => (menu.style.display = 'none'), 250);
            }
        }
    });

    /* Logout */
    const logoutBtn = menu.querySelector('#avatarLogoutBtn');
    logoutBtn.addEventListener('click', async function () {
        try {
            if (typeof supabase !== 'undefined') {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error('Error cerrando sesión en Supabase:', error.message);
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

/* ============================================================
   STYLES (AUTO-INJECTED)
============================================================ */

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
        }
        
        .avatar-menu-details {
            padding: 1rem 1.5rem;
        }
        
        .avatar-menu-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.75rem;
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
        }
        
        .avatar-menu-logout:hover {
            background: #fef2f2;
        }
        
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
    `;

    document.head.appendChild(styles);
}
