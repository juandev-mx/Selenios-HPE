// hpe-dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    // Verificar que sea HPE_REP o HPE_MANAGER
    if (user.role !== 'HPE_REP' && user.role !== 'HPE_MANAGER') {
        alert('Acceso denegado. Esta página es solo para personal de HPE.');
        window.location.href = '/login.html';
        return;
    }

    // Inicializar dashboard
    initDashboard(user);
});

function initDashboard(user) {
    // Control de acceso basado en rol
    if (user.role === 'HPE_MANAGER') {
        showManagerFeatures();
    } else if (user.role === 'HPE_REP') {
        hideManagerFeatures();
    }

    // Event listeners
    setupEventListeners(user);
    
    // Cargar datos iniciales
    loadDashboardData();
    
    // Crear menú de avatar
    createAvatarMenu(user);
}

function showManagerFeatures() {
    // Mostrar elementos exclusivos del manager (Users & companies)
    const managerElements = document.querySelectorAll('.manager-only');
    managerElements.forEach(element => {
        element.style.display = '';
    });

    console.log('Vista de Manager activada - Acceso completo');
}

function hideManagerFeatures() {
    // Ocultar elementos exclusivos del manager
    const managerElements = document.querySelectorAll('.manager-only');
    managerElements.forEach(element => {
        element.style.display = 'none';
    });

    console.log('Vista de Representante activada - Acceso limitado');
}

function createAvatarMenu(user) {
    const avatarContainer = document.querySelector('.user-info-header');
    const avatar = avatarContainer.querySelector('.avatar');
    
    if (!avatar) return;
    
    // Hacer el avatar clickeable
    avatar.style.cursor = 'pointer';
    
    // Determinar la compañía
    const company = (user.role === 'HPE_REP' || user.role === 'HPE_MANAGER') ? 'HPE' : 
                    (user.client_company_name || 'N/A');
    
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
        // Cerrar sesión en Supabase
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

function setupEventListeners(user) {

    // Navegación entre secciones
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover clase active de todos
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Agregar clase active al clickeado
            this.classList.add('active');
            
            // Obtener sección
            const section = this.getAttribute('data-section');
            
            // Mostrar sección correspondiente
            showSection(section, user);
        });
    });

    // Scroll al hacer click en el logo
    const logo = document.getElementById('hpeLogo');
    if (logo) {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('¡Logo clickeado!');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    } else {
        console.warn('No se encontró #hpeLogo');
    }
}

function showSection(sectionName, user) {
    // Ocultar todas las secciones
    const allSections = document.querySelectorAll('.section-content');
    allSections.forEach(section => {
        section.style.display = 'none';
    });

    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(`section-${sectionName}`);
    if (targetSection) {
        // Verificar permisos para Users & Companies
        if (sectionName === 'users' && user.role !== 'HPE_MANAGER') {
            alert('Acceso denegado. Solo los Managers pueden acceder a esta sección.');
            return;
        }
        
        targetSection.style.display = 'block';
        
        // Cargar datos específicos de la sección
        loadSectionData(sectionName, user);
    }
}

function loadSectionData(section, user) {
    switch(section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'approvals':
            // Redirigir a la página de aprobaciones que tiene su propio JS
            window.location.href = '/PocsHPEManager.html';
            break;
        case 'equipments':
            // Redirigir a la página de catálogo de soluciones que tiene su propio JS
            window.location.href = '/solutions_catalog.html';
            break;
        case 'users':
            if (user.role === 'HPE_MANAGER') {
                loadUsersAndCompanies();
            }
            break;
    }
}

// Cargar datos del dashboard dinámicamente
async function loadDashboardData() {
    console.log('Cargando dashboard dinámico...');
    
    try {
        // Cargar todos los datos en paralelo
        const [pocsResponse, companiesResponse, equipmentResponse, pocEquipmentResponse, usersResponse] = await Promise.all([
            fetch('/pocs'),
            fetch('/client_company'),
            fetch('/equipment'),
            fetch('/poc_equipment'),
            fetch('/users')
        ]);

        const pocs = await pocsResponse.json();
        const companies = await companiesResponse.json();
        const equipment = await equipmentResponse.json();
        const pocEquipment = await pocEquipmentResponse.json();
        const users = await usersResponse.json();

        // Calcular KPIs
        // Ingresos totales: solo equipos que están en algún POC
        const equipmentInPOCs = new Set(pocEquipment.map(pe => pe.solution_id));
        const totalRevenue = equipment
            .filter(eq => equipmentInPOCs.has(eq.solution_id))
            .reduce((sum, eq) => sum + parseFloat(eq.price || 0), 0);
        
        const approvalRate = pocs.length > 0 ? ((pocs.filter(p => p.is_approved).length / pocs.length) * 100).toFixed(0) : 0;
        
        // Clientes activos: número de compañías que tienen al menos un POC
        const userMap = {};
        users.forEach(u => userMap[u.id] = u);
        const activeCompanyIds = new Set(
            pocs.map(p => userMap[p.client_user_id]?.client_company_id).filter(id => id)
        );
        const activeClients = activeCompanyIds.size;

        // Actualizar KPIs
        updateKPIs(totalRevenue, approvalRate, activeClients);

        // Calcular rendimiento de clientes
        const clientPerformance = calculateClientPerformance(pocs, pocEquipment, equipment, users, companies);
        updateClientPerformance(clientPerformance);

        // Calcular rendimiento del equipo
        const teamPerformance = calculateTeamPerformance(equipment, pocEquipment, users);
        updateTeamPerformance(teamPerformance);

    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
}

// Función para formatear montos en K o M
function formatCurrency(amount) {
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}K`;
    } else {
        return `${amount.toFixed(0)}`;
    }
}

function updateKPIs(totalRevenue, approvalRate, activeClients) {
    // Actualizar Ingresos Totales
    const revenueElement = document.querySelector('.kpi-card:nth-child(1) .kpi-value');
    if (revenueElement) {
        revenueElement.textContent = formatCurrency(totalRevenue);
    }

    // Actualizar Tasa de Aprobación
    const approvalElement = document.querySelector('.kpi-card:nth-child(2) .kpi-value');
    if (approvalElement) {
        approvalElement.textContent = `${approvalRate}%`;
    }

    // Actualizar Clientes Activos
    const clientsElement = document.querySelector('.kpi-card:nth-child(3) .kpi-value');
    if (clientsElement) {
        clientsElement.textContent = activeClients;
    }
}

function calculateClientPerformance(pocs, pocEquipment, equipment, users, companies) {
    // Crear mapa de equipos por POC
    const equipmentByPoc = {};
    pocEquipment.forEach(pe => {
        if (!equipmentByPoc[pe.poc_id]) {
            equipmentByPoc[pe.poc_id] = [];
        }
        equipmentByPoc[pe.poc_id].push(pe.solution_id);
    });

    // Mapa de precios de equipos
    const equipmentPrices = {};
    equipment.forEach(eq => {
        equipmentPrices[eq.solution_id] = parseFloat(eq.price || 0);
    });

    // Calcular ingresos por cliente
    const clientRevenue = {};
    const clientHasPocs = {};
    
    pocs.forEach(poc => {
        const userId = poc.client_user_id;
        clientHasPocs[userId] = true;
        
        if (!clientRevenue[userId]) {
            clientRevenue[userId] = 0;
        }
        
        // Sumar precios de equipos en este POC
        const pocEquipmentIds = equipmentByPoc[poc.poc_id] || [];
        pocEquipmentIds.forEach(eqId => {
            clientRevenue[userId] += equipmentPrices[eqId] || 0;
        });
    });

    // Mapear usuarios con compañías
    const userMap = {};
    users.forEach(u => {
        userMap[u.id] = u;
    });

    const companyMap = {};
    companies.forEach(c => {
        companyMap[c.id] = c;
    });

    // Crear array de rendimiento de clientes
    const performance = [];
    Object.keys(clientRevenue).forEach(userId => {
        const user = userMap[userId];
        if (!user) return;

        const company = companyMap[user.client_company_id];
        const companyName = company ? company.name : 'N/A';
        
        performance.push({
            name: companyName,
            revenue: clientRevenue[userId],
            isActive: clientHasPocs[userId] || false
        });
    });

    // Ordenar por ingresos (mayor a menor)
    performance.sort((a, b) => b.revenue - a.revenue);

    // Devolver solo los top 4
    return performance.slice(0, 4);
}

function updateClientPerformance(clientPerformance) {
    const tbody = document.querySelector('.section-card:nth-child(2) tbody');
    if (!tbody) return;

    if (clientPerformance.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: #618975;">No data available</td></tr>';
        return;
    }

    tbody.innerHTML = clientPerformance.map(client => `
        <tr>
            <td class="client-name">${client.name}</td>
            <td class="client-revenue">${formatCurrency(client.revenue)}</td>
            <td>
                <span class="status-badge ${client.isActive ? 'status-active' : 'status-inactive'}">
                    ${client.isActive ? 'Activo' : 'Inactivo'}
                </span>
            </td>
        </tr>
    `).join('');
}

function calculateTeamPerformance(equipment, pocEquipment, users) {
    // Filtrar solo HPE_REP
    const hpeReps = users.filter(u => u.role === 'HPE_REP');

    // Mapa de managers
    const managerMap = {};
    users.forEach(u => {
        if (u.role === 'HPE_MANAGER') {
            managerMap[u.id] = u.name;
        }
    });

    // Crear set de equipos que están en POCs
    const equipmentInPOCs = new Set(pocEquipment.map(pe => pe.solution_id));

    // Calcular rendimiento por HPE_REP
    const repPerformance = hpeReps.map(rep => {
        // Equipos creados por este rep
        const repEquipment = equipment.filter(eq => eq.created_by === rep.id);
        
        // Calcular ingresos totales: solo equipos que están en POCs
        const totalRevenue = repEquipment
            .filter(eq => equipmentInPOCs.has(eq.solution_id))
            .reduce((sum, eq) => sum + parseFloat(eq.price || 0), 0);
        
        // Contar cuántas veces se usaron sus equipos en POCs
        const equipmentIds = repEquipment.map(eq => eq.solution_id);
        const usageCount = pocEquipment.filter(pe => equipmentIds.includes(pe.solution_id)).length;
        
        // Obtener nombre del manager
        const managerName = rep.reports_to ? (managerMap[rep.reports_to] || 'N/A') : 'N/A';

        return {
            name: rep.name,
            manager: managerName,
            revenue: totalRevenue,
            approvals: usageCount
        };
    });

    // Filtrar solo los que tienen equipos creados en POCs
    const activeReps = repPerformance.filter(rep => rep.revenue > 0);

    // Ordenar por ingresos (mayor a menor)
    activeReps.sort((a, b) => b.revenue - a.revenue);

    // Devolver top 5
    return activeReps.slice(0, 5);
}

function updateTeamPerformance(teamPerformance) {
    const tbody = document.querySelector('.section-card.full-width tbody');
    if (!tbody) return;

    if (teamPerformance.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: #618975;">No data available</td></tr>';
        return;
    }

    tbody.innerHTML = teamPerformance.map(rep => `
        <tr>
            <td class="rep-name">${rep.name}</td>
            <td class="manager-name">${rep.manager}</td>
            <td class="revenue">${formatCurrency(rep.revenue)}</td>
            <td class="approvals">${rep.approvals}</td>
        </tr>
    `).join('');
}

// Cargar usuarios y compañías (SOLO MANAGER)
/*
async function loadUsersAndCompanies() {
    const container = document.getElementById('users-content');
    container.innerHTML = '<p>Cargando datos...</p>';

    try {
        // Cargar compañías
        const companiesResponse = await fetch('/client_company');
        const companies = await companiesResponse.json();

        // Cargar usuarios
        const usersResponse = await fetch('/users');
        const users = await usersResponse.json();

        container.innerHTML = `
            <div class="section-card full-width">
                <h3 class="section-title">Compañías Cliente</h3>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Manager</th>
                                <th>Rep HPE ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${companies.map(c => `
                                <tr>
                                    <td>${c.id}</td>
                                    <td>${c.name}</td>
                                    <td>${c.manager}</td>
                                    <td>${c.hpe_rep_id || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="section-card full-width" style="margin-top: 2rem;">
                <h3 class="section-title">Usuarios</h3>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Compañía</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(u => `
                                <tr>
                                    <td>${u.id}</td>
                                    <td>${u.name}</td>
                                    <td>${u.mail}</td>
                                    <td>${u.role}</td>
                                    <td>${u.client_company_id || 'N/A'}</td>
                                    <td>
                                        <span class="status-badge ${u.session_started ? 'status-active' : 'status-inactive'}">
                                            ${u.session_started ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = '<div class="section-card"><p>Error al cargar datos</p></div>';
        console.error('Error:', error);
    }
}*/