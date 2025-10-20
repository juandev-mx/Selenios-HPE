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
    // Mostrar información del usuario en el header
    //document.getElementById('userNameHeader').textContent = user.name;

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

function setupEventListeners(user) {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async function() {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: user.id })
            });
        } catch (error) {
            console.error('Error en logout:', error);
        } finally {
            sessionStorage.removeItem('user');
            window.location.href = '/login.html';
        }
    });

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
            loadApprovals(user);
            break;
        case 'equipments':
            loadEquipments();
            break;
        case 'users':
            if (user.role === 'HPE_MANAGER') {
                loadUsersAndCompanies();
            }
            break;
    }
}

// Cargar datos del dashboard (ya está en HTML estático)
function loadDashboardData() {
    console.log('Dashboard cargado');
}

// Cargar aprobaciones
async function loadApprovals(user) {
    const container = document.getElementById('approvals-content');
    container.innerHTML = '<p>Cargando aprobaciones...</p>';

    try {
        const response = await fetch('/api/pocs?is_approved=false');
        const pendingPOCs = await response.json();
        
        if (pendingPOCs.length === 0) {
            container.innerHTML = `
                <div class="section-card">
                    <p style="text-align: center; padding: 2rem;">No hay POCs pendientes de aprobación</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="section-card full-width">
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>POC ID</th>
                                <th>Cliente</th>
                                <th>Justificación</th>
                                <th>Fecha Creación</th>
                                <th>Fecha Completado</th>
                                ${user.role === 'HPE_MANAGER' ? '<th>Acciones</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${pendingPOCs.map(poc => `
                                <tr>
                                    <td>${poc.poc_id}</td>
                                    <td>Usuario ${poc.client_user_id}</td>
                                    <td>${poc.business_justification || 'Sin justificación'}</td>
                                    <td>${poc.created_date ? new Date(poc.created_date).toLocaleDateString() : 'N/A'}</td>
                                    <td>${poc.completion_date ? new Date(poc.completion_date).toLocaleDateString() : 'N/A'}</td>
                                    ${user.role === 'HPE_MANAGER' ? `
                                        <td>
                                            <button onclick="approvePOC(${poc.poc_id})" style="background: #11D473; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;">✓ Aprobar</button>
                                            <button onclick="rejectPOC(${poc.poc_id})" style="background: #dc3545; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">✗ Rechazar</button>
                                        </td>
                                    ` : ''}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = '<div class="section-card"><p>Error al cargar aprobaciones</p></div>';
        console.error('Error:', error);
    }
}

// Cargar equipamiento
async function loadEquipments() {
    const container = document.getElementById('equipments-content');
    container.innerHTML = '<p>Cargando equipamiento...</p>';

    try {
        const response = await fetch('/api/equipment');
        const equipment = await response.json();
        
        if (equipment.length === 0) {
            container.innerHTML = `
                <div class="section-card">
                    <p style="text-align: center; padding: 2rem;">No hay equipamiento registrado</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="section-card full-width">
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Número de Producto</th>
                                <th>Descripción</th>
                                <th>Programa</th>
                                <th>Precio</th>
                                <th>Creado por</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${equipment.map(e => `
                                <tr>
                                    <td>${e.solution_id}</td>
                                    <td>${e.product_number || 'N/A'}</td>
                                    <td>${e.product_description || 'N/A'}</td>
                                    <td>${e.company_program || 'N/A'}</td>
                                    <td>$${e.price ? e.price.toLocaleString() : '0'}</td>
                                    <td>Usuario ${e.created_by || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = '<div class="section-card"><p>Error al cargar equipamiento</p></div>';
        console.error('Error:', error);
    }
}

// Cargar usuarios y compañías (SOLO MANAGER)
async function loadUsersAndCompanies() {
    const container = document.getElementById('users-content');
    container.innerHTML = '<p>Cargando datos...</p>';

    try {
        // Cargar compañías
        const companiesResponse = await fetch('/api/client_company');
        const companies = await companiesResponse.json();

        // Cargar usuarios
        const usersResponse = await fetch('/api/users');
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
}

// Funciones para aprobar/rechazar POCs (SOLO MANAGER)
async function approvePOC(pocId) {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (user.role !== 'HPE_MANAGER') {
        alert('Solo los managers pueden aprobar POCs');
        return;
    }

    try {
        const response = await fetch(`/api/pocs/${pocId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_approved: true })
        });

        if (response.ok) {
            alert('✅ POC aprobado exitosamente');
            loadApprovals(user);
        } else {
            alert('Error al aprobar POC');
        }
    } catch (error) {
        alert('Error al aprobar POC');
        console.error('Error:', error);
    }
}

async function rejectPOC(pocId) {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (user.role !== 'HPE_MANAGER') {
        alert('Solo los managers pueden rechazar POCs');
        return;
    }

    if (confirm('¿Estás seguro de rechazar este POC?')) {
        try {
            const response = await fetch(`/api/pocs/${pocId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('✅ POC rechazado');
                loadApprovals(user);
            } else {
                alert('Error al rechazar POC');
            }
        } catch (error) {
            alert('Error al rechazar POC');
            console.error('Error:', error);
        }
    }
}

// Hacer funciones globales para los botones inline
window.approvePOC = approvePOC;
window.rejectPOC = rejectPOC;