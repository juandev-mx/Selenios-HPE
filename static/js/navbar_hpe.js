// /static/js/navbar_hpe.js

document.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('role');
    console.log('🔐 Role from localStorage:', role);

    // Ejecutar solo para HPE_REP o HPE_MANAGER
    if (role === 'HPE_REP' || role === 'HPE_MANAGER') {
        console.log('✅ Role válido, iniciando navbar HPE');
        initNavbarHPE();
    } else {
        console.log('❌ Role no válido para navbar HPE');
    }
});

function initNavbarHPE() {
    const avatar = document.getElementById('avatar');
    if (!avatar) return;

    avatar.addEventListener('click', () => {
        createHPEAvatarMenu();
    });
}


async function initNavbarHPE() {
    console.log('🚀 initNavbarHPE ejecutándose');
    
    const user = JSON.parse(sessionStorage.getItem('user')) || null;
    console.log('👤 User from sessionStorage:', user);

    // Marcar link activo
    markActiveLink();

    if (!user) {
        console.log('❌ No user found, saliendo de initNavbarHPE');
        return;
    }

    // Cargar nombre de compañía si aplica
    if (user.client_company_id) {
        console.log('🏢 Cargando información de compañía:', user.client_company_id);
        try {
            const res = await fetch(`/client_company/${user.client_company_id}`);
            if (res.ok) {
                const company = await res.json();
                user.client_company_name = company.name;
                console.log('✅ Compañía cargada:', company.name);
            }
        } catch (err) {
            console.error("❌ Error cargando información de compañía:", err);
        }
    }

    // IMPORTANTE: Inyectar estilos ANTES de crear el menú
    console.log('🎨 Inyectando estilos del menú');
    addHPEAvatarMenuStyles();

    // Crear menú del avatar
    console.log('📋 Llamando a createHPEAvatarMenu');
    createHPEAvatarMenu(user);
}

function markActiveLink() {
    const links = document.querySelectorAll('.header-nav .nav-link');
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    
    console.log('🔗 Marcando links activos. Path:', currentPath, 'Hash:', currentHash);
    
    // Primero remover todas las clases active
    links.forEach(link => link.classList.remove('active'));

    links.forEach(link => {
        try {
            const linkUrl = new URL(link.href, window.location.origin);
            const linkPath = linkUrl.pathname;
            const linkHash = linkUrl.hash;

            // Si el link tiene hash (como Reports)
            if (linkHash) {
                // Marcar activo si estamos en la misma página Y mismo hash
                if (linkPath === currentPath && linkHash === currentHash) {
                    link.classList.add('active');
                }
                // O si llegamos directamente a home_hpe.html con el hash de reportes
                else if (currentPath === '/home_hpe.html' && currentHash === linkHash) {
                    link.classList.add('active');
                }
            } 
            // Para links sin hash (Dashboard, Approvals, Equipments)
            else {
                // Comparación exacta del pathname
                if (linkPath === currentPath && !currentHash) {
                    link.classList.add('active');
                }
            }
        } catch (e) {
            console.error('Error procesando link:', e);
        }
    });
}

function createHPEAvatarMenu(user) {
    console.log('🖼️ createHPEAvatarMenu iniciando con user:', user);
    
    const avatar = document.querySelector('.avatar');
    console.log('🎯 Avatar element encontrado:', avatar);
    
    if (!avatar) {
        console.error('❌ No se encontró el elemento .avatar en el DOM');
        return;
    }

    // Usar el contenedor que ya existe en el HTML en lugar de crear uno nuevo
    const avatarContainer = document.querySelector('.user-info-header');
    console.log('📦 Container encontrado:', avatarContainer);
    
    if (!avatarContainer) {
        console.error('❌ No se encontró el contenedor .user-info-header');
        return;
    }

    // Asegurarnos de que el contenedor tenga position relative
    avatarContainer.style.position = 'relative';
    avatar.style.cursor = 'pointer';
    console.log('✅ Avatar container configurado');

    const company = user.client_company_name || user.company_name || 'HPE';
    console.log('🏢 Company para mostrar:', company);

    const menu = document.createElement('div');
    menu.id = 'hpe-avatar-menu';
    menu.className = 'avatar-menu';
    menu.style.display = 'none';

    menu.innerHTML = `
        <div class="avatar-menu-header">
            <img src="${avatar.src}" alt="User Avatar" class="avatar-menu-img">
            <div class="avatar-menu-info">
                <div class="avatar-menu-name">${escapeHtml(user.name || 'User')}</div>
                <div class="avatar-menu-role">${escapeHtml(user.role || 'N/A')}</div>
            </div>
        </div>
        <div class="avatar-menu-divider"></div>

        <div class="avatar-menu-details">
            <div class="avatar-menu-item">
                <span class="avatar-menu-label">Company:</span>
                <span class="avatar-menu-value">${escapeHtml(company)}</span>
            </div>
            <div class="avatar-menu-item">
                <span class="avatar-menu-label">Email:</span>
                <span class="avatar-menu-value">${escapeHtml(user.mail || 'N/A')}</span>
            </div>
        </div>

        <div class="avatar-menu-divider"></div>
        <button class="avatar-menu-logout" id="hpeAvatarLogoutBtn">Log Out</button>
    `;

    avatarContainer.appendChild(menu);
    console.log('✅ Menú HTML creado e insertado en el DOM');

    // Evento abrir/cerrar menú con animación
    avatar.addEventListener('click', (e) => {
        console.log('🖱️ Click en avatar detectado');
        e.stopPropagation();
        const isVisible = menu.style.display === 'block';
        console.log('👁️ Menu actualmente visible:', isVisible);
        
        if (isVisible) {
            console.log('⬆️ Cerrando menú');
            menu.style.animation = 'slideUp 0.25s ease';
            setTimeout(() => {
                menu.style.display = 'none';
            }, 200);
        } else {
            console.log('⬇️ Abriendo menú');
            menu.style.display = 'block';
            menu.style.animation = 'slideDown 0.25s ease';
        }
    });

    console.log('✅ Event listener de click agregado al avatar');

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!avatarContainer.contains(e.target)) {
            if (menu.style.display === 'block') {
                console.log('🚪 Cerrando menú (click fuera)');
                menu.style.animation = 'slideUp 0.25s ease';
                setTimeout(() => {
                    menu.style.display = 'none';
                }, 200);
            }
        }
    });

    // Logout
    const logoutBtn = menu.querySelector('#hpeAvatarLogoutBtn');
    console.log('🚪 Botón logout encontrado:', logoutBtn);
    
    logoutBtn.addEventListener('click', async () => {
        console.log('🔴 Logout iniciado');
        try {
            if (typeof supabase !== "undefined") {
                const { error } = await supabase.auth.signOut();
                if (error) console.error('Supabase signOut error:', error.message);
            }
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            sessionStorage.removeItem('user');
            localStorage.removeItem('role');
            console.log('✅ Sesión limpiada, redirigiendo a login');
            window.location.href = '/login.html';
        }
    });

    console.log('✅ createHPEAvatarMenu completado exitosamente');
}

function escapeHtml(str = '') {
    return String(str).replace(/[&<>"'`]/g, c => ({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;',
        '`':'&#96;'
    }[c]));
}

function addHPEAvatarMenuStyles() {
    if (document.getElementById('hpe-avatar-menu-styles')) {
        console.log('ℹ️ Estilos ya inyectados previamente');
        return;
    }
    
    const styles = document.createElement('style');
    styles.id = 'hpe-avatar-menu-styles';
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
            object-fit: cover;
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
    console.log('✅ Estilos HPE avatar menu inyectados');
}