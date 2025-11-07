document.addEventListener('DOMContentLoaded', function() {
        const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

        if (user.role !== 'HPE_REP' && user.role !== 'HPE_MANAGER') {
        alert('Acceso denegado. Esta página es solo para personal de HPE.');
        window.location.href = '/login.html';
        return;
    }

        initDashboard(user);
});

function initDashboard(user) {
    console.log('Initializing dashboard for user:', user);
        if (user.role === 'HPE_MANAGER') {
        showManagerFeatures();
    } else if (user.role === 'HPE_REP') {
        hideManagerFeatures();
    }

        setupEventListeners(user);
    
        console.log('Loading initial dashboard data...');
    loadDashboardData();
    
        createAvatarMenu(user);
}

function showManagerFeatures() {
    const managerElements = document.querySelectorAll('.manager-only');
    managerElements.forEach(element => {
        element.style.display = '';
    });
    console.log('Vista de Manager activada - Acceso completo');
}

function hideManagerFeatures() {
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
    
    avatar.style.cursor = 'pointer';
    
    const company = (user.role === 'HPE_REP' || user.role === 'HPE_MANAGER') ? 'HPE' : 
                    (user.client_company_name || 'N/A');
    
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
        const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const section = this.getAttribute('data-section');
            
                        if (!section) return;
            
            e.preventDefault();
            
                        navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
                        showSection(section, user);
        });
    });

        const logo = document.querySelector('.logo');
    if (logo && logo.parentElement) {
        logo.parentElement.addEventListener('click', (e) => {
            e.preventDefault();
                        showSection('dashboard', user);
                        navLinks.forEach(l => {
                if (l.getAttribute('data-section') === 'dashboard') {
                    l.classList.add('active');
                } else {
                    l.classList.remove('active');
                }
            });
        });
    }
}

function showSection(sectionName, user) {
    console.log('Showing section:', sectionName);
    
        const allSections = document.querySelectorAll('.section-content');
    allSections.forEach(section => {
        section.style.display = 'none';
    });

        const targetSection = document.getElementById(`section-${sectionName}`);
    if (targetSection) {
                if (sectionName === 'users' && user.role !== 'HPE_MANAGER') {
            alert('Acceso denegado. Solo los Managers pueden acceder a esta sección.');
                        showSection('dashboard', user);
            return;
        }
        
        targetSection.style.display = 'block';
        
                if (sectionName === 'dashboard') {
            loadDashboardData();
        } else if (sectionName === 'users' && user.role === 'HPE_MANAGER') {
            loadUsersAndCompanies();
        } else if (sectionName === 'reportes') {
                        console.log('Mostrando sección de reportes');
        }
                
    } else {
        console.warn('Section not found:', sectionName);
    }
}

function loadSectionData(section, user) {
    switch(section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'approvals':
            window.location.href = '/PocsHPEManager.html';
            break;
        case 'equipments':
            window.location.href = '/solutions_catalog.html';
            break;
        case 'users':
            if (user.role === 'HPE_MANAGER') {
                loadUsersAndCompanies();
            }
            break;
    }
}



async function loadDashboardData() {
    console.log('🔄 Cargando dashboard...');
    
    try {
                const [pocsResponse, companiesResponse, equipmentResponse, pocEquipmentResponse, usersResponse] = await Promise.all([
            fetch('/pocs'),
            fetch('/client_company'),
            fetch('/equipment'),
            fetch('/poc_equipment'),
            fetch('/users')
        ]);

        console.log('✅ Respuestas recibidas');
        
                if (!pocsResponse.ok) throw new Error('Error loading POCs');
        if (!companiesResponse.ok) throw new Error('Error loading companies');
        if (!equipmentResponse.ok) throw new Error('Error loading equipment');
        if (!pocEquipmentResponse.ok) throw new Error('Error loading poc_equipment');
        if (!usersResponse.ok) throw new Error('Error loading users');

        const pocs = await pocsResponse.json();
        const companies = await companiesResponse.json();
        const equipment = await equipmentResponse.json();
        const pocEquipment = await pocEquipmentResponse.json();
        const users = await usersResponse.json();

        console.log('📊 Datos cargados:', {
            pocs: pocs.length,
            companies: companies.length,
            equipment: equipment.length,
            pocEquipment: pocEquipment.length,
            users: users.length
        });

                updateKPIs(pocs, pocEquipment, equipment, users);

                updateSolutionsPerformance(equipment, pocEquipment);

                const clientPerformance = calculateClientPerformance(pocs, pocEquipment, equipment, users, companies);
        updateClientPerformance(clientPerformance);

                const teamPerformance = calculateTeamPerformance(equipment, pocEquipment, users);
        updateTeamPerformance(teamPerformance);

                        updateApprovalTrends(pocs);
        
        console.log('✅ Dashboard cargado completamente');

    } catch (error) {
        console.error('❌ Error cargando dashboard:', error);
        alert('Error cargando datos del dashboard. Por favor, recarga la página.');
    }
}

function updateKPIs(pocs, pocEquipment, equipment, users) {
        const equipmentInPOCs = new Set(pocEquipment.map(pe => pe.solution_id));
    const totalRevenue = equipment
        .filter(eq => equipmentInPOCs.has(eq.solution_id))
        .reduce((sum, eq) => sum + parseFloat(eq.price || 0), 0);
    
        const approvalRate = pocs.length > 0 ? 
        ((pocs.filter(p => p.is_approved).length / pocs.length) * 100).toFixed(0) : 0;
    
        const userMap = {};
    users.forEach(u => userMap[u.id] = u);
    const activeCompanyIds = new Set(
        pocs.map(p => userMap[p.client_user_id]?.client_company_id).filter(id => id)
    );
    const activeClients = activeCompanyIds.size;

        const revenueElement = document.querySelector('.kpi-card:nth-child(1) .kpi-value');
    if (revenueElement) revenueElement.textContent = formatCurrencyFull(totalRevenue);

    const approvalElement = document.querySelector('.kpi-card:nth-child(2) .kpi-value');
    if (approvalElement) approvalElement.textContent = `${approvalRate}%`;

    const clientsElement = document.querySelector('.kpi-card:nth-child(3) .kpi-value');
    if (clientsElement) clientsElement.textContent = activeClients;
}

function updateSolutionsPerformance(equipment, pocEquipment) {
        const solutionUsage = {};
    pocEquipment.forEach(pe => {
        solutionUsage[pe.solution_id] = (solutionUsage[pe.solution_id] || 0) + 1;
    });

        const solutions = equipment.map(eq => ({
        solution_id: eq.solution_id,
        name: eq.product_description || eq.product_number || 'N/A',
        revenue: parseFloat(eq.price || 0) * (solutionUsage[eq.solution_id] || 0),
        usage: solutionUsage[eq.solution_id] || 0
    }));

        const usedSolutions = solutions.filter(s => s.usage > 0);
    
        usedSolutions.sort((a, b) => b.revenue - a.revenue);

        const topSolutions = usedSolutions.slice(0, 5);

        updateSolutionsChart(topSolutions);

        const totalSolutionsRevenue = topSolutions.reduce((sum, s) => sum + s.revenue, 0);
    const chartValue = document.querySelector('.chart-grid .chart-box:nth-child(1) .chart-value');
    if (chartValue) chartValue.textContent = formatCurrency(totalSolutionsRevenue);
}

function updateSolutionsChart(solutions) {
    const chartBars = document.querySelector('.chart-bars');
    if (!chartBars) return;

    chartBars.innerHTML = '';

    if (solutions.length === 0) {
        chartBars.innerHTML = '<p style="text-align:center; color: #618975;">No hay datos disponibles</p>';
        return;
    }

    const maxRevenue = Math.max(...solutions.map(s => s.revenue));
    
    solutions.forEach(solution => {
        const barHeight = maxRevenue > 0 ? (solution.revenue / maxRevenue) * 100 : 0;
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.innerHTML = `
            <div class="bar" style="height: ${barHeight}px;"></div>
            <div class="bar-label">${truncateText(solution.name, 15)}</div>
        `;
        chartBars.appendChild(bar);
    });
}

function calculateClientPerformance(pocs, pocEquipment, equipment, users, companies) {
        const equipmentByPoc = {};
    pocEquipment.forEach(pe => {
        if (!equipmentByPoc[pe.poc_id]) {
            equipmentByPoc[pe.poc_id] = [];
        }
        equipmentByPoc[pe.poc_id].push(pe.solution_id);
    });

        const equipmentPrices = {};
    equipment.forEach(eq => {
        equipmentPrices[eq.solution_id] = parseFloat(eq.price || 0);
    });

        const clientRevenue = {};
    const clientHasPocs = {};
    
    pocs.forEach(poc => {
        const userId = poc.client_user_id;
        clientHasPocs[userId] = true;
        
        if (!clientRevenue[userId]) {
            clientRevenue[userId] = 0;
        }
        
        const pocEquipmentIds = equipmentByPoc[poc.poc_id] || [];
        pocEquipmentIds.forEach(eqId => {
            clientRevenue[userId] += equipmentPrices[eqId] || 0;
        });
    });

        const userMap = {};
    users.forEach(u => userMap[u.id] = u);

    const companyMap = {};
    companies.forEach(c => companyMap[c.id] = c);

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

        performance.sort((a, b) => b.revenue - a.revenue);
    return performance.slice(0, 4);
}

function updateClientPerformance(clientPerformance) {
    const tbody = document.querySelector('.section-card:nth-child(2) tbody');
    if (!tbody) return;

    if (clientPerformance.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: #618975;">No hay datos disponibles</td></tr>';
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

function updateApprovalLineChart(data) {
    const canvas = document.getElementById('approvalLineChart');
    if (!canvas) {
        console.error('❌ Canvas approvalLineChart no encontrado');
        return;
    }

    const ctx = canvas.getContext('2d');

        if (window.approvalLineChart && typeof window.approvalLineChart.destroy === 'function') {
        window.approvalLineChart.destroy();
    }

        if (!data || data.length === 0) {
        ctx.font = '14px Arial';
        ctx.fillStyle = '#618975';
        ctx.textAlign = 'center';
        ctx.fillText('No hay datos disponibles', canvas.width / 2, canvas.height / 2);
        return;
    }

    window.approvalLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.equipment),             datasets: [{
                label: 'Approval Rate (%)',
                data: data.map(item => item.approvalRate),
                borderColor: '#01a982',
                backgroundColor: 'rgba(1, 169, 130, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: '#01a982',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#00875a',
                pointHoverBorderColor: '#fff',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#1f2937',
                        font: { 
                            size: 12, 
                            weight: '600',
                            family: "'Inter', sans-serif"
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: (context) => {
                            return data[context[0].dataIndex].equipment;
                        },
                        label: (context) => {
                            const item = data[context.dataIndex];
                            return [
                                `Tasa: ${item.approvalRate.toFixed(1)}%`,
                                `Aprobados: ${item.approved}/${item.total}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#6b7280',
                        font: { 
                            size: 11,
                            family: "'Inter', sans-serif"
                        },
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: false
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#6b7280',
                        font: { 
                            size: 11,
                            family: "'Inter', sans-serif"
                        },
                        callback: (value) => `${value}%`,
                        stepSize: 20
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });

    console.log('✅ Gráfica de línea creada con', data.length, 'equipos');
}


function calculateTeamPerformance(equipment, pocEquipment, users) {
    const hpeReps = users.filter(u => u.role === 'HPE_REP');

    const managerMap = {};
    users.forEach(u => {
        if (u.role === 'HPE_MANAGER') {
            managerMap[u.id] = u.name;
        }
    });

        const equipmentPrices = {};
    equipment.forEach(eq => {
        equipmentPrices[eq.solution_id] = parseFloat(eq.price || 0);
    });

    const repPerformance = hpeReps.map(rep => {
                const repEquipmentIds = equipment
            .filter(eq => eq.created_by === rep.id)
            .map(eq => eq.solution_id);
        
                let totalRevenue = 0;
        let usageCount = 0;
        
        pocEquipment.forEach(pe => {
            if (repEquipmentIds.includes(pe.solution_id)) {
                totalRevenue += equipmentPrices[pe.solution_id] || 0;
                usageCount++;
            }
        });
        
        const managerName = rep.reports_to ? (managerMap[rep.reports_to] || 'N/A') : 'N/A';

        return {
            name: rep.name,
            manager: managerName,
            revenue: totalRevenue,
            approvals: usageCount
        };
    });

    const activeReps = repPerformance.filter(rep => rep.revenue > 0);
    activeReps.sort((a, b) => b.revenue - a.revenue);
    return activeReps.slice(0, 5);
}

function updateTeamPerformance(teamPerformance) {
    const tbody = document.querySelector('.section-card.full-width tbody');
    if (!tbody) return;

    if (teamPerformance.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: #618975;">No hay datos disponibles</td></tr>';
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

async function updateApprovalTrends(pocs) {
    try {
                const pocEquipmentResponse = await fetch('/poc_equipment');
        const equipmentResponse = await fetch('/equipment');

        if (!pocEquipmentResponse.ok || !equipmentResponse.ok) {
            throw new Error('Error al obtener datos de equipos o relaciones');
        }

        const pocEquipment = await pocEquipmentResponse.json();
        const equipment = await equipmentResponse.json();

                const equipmentMap = {};
        equipment.forEach(eq => {
            equipmentMap[eq.solution_id] = eq.product_description || eq.product_number || 'N/A';
        });

                const statsByEquipment = {};

        pocEquipment.forEach(pe => {
            const poc = pocs.find(p => p.poc_id === pe.poc_id);
            if (!poc) return;

            const equipmentId = pe.solution_id;
            if (!statsByEquipment[equipmentId]) {
                statsByEquipment[equipmentId] = { total: 0, approved: 0 };
            }

            statsByEquipment[equipmentId].total++;
            if (poc.is_approved) statsByEquipment[equipmentId].approved++;
        });

                const data = Object.keys(statsByEquipment).map(eqId => {
            const stats = statsByEquipment[eqId];
            const rate = (stats.approved / stats.total) * 100;
            return {
                equipment: equipmentMap[eqId] || 'N/A',
                approvalRate: rate,
                approved: stats.approved,
                total: stats.total
            };
        });

                data.sort((a, b) => b.approvalRate - a.approvalRate);

                const topData = data.slice(0, 6);

                const averageApprovalRate = topData.length > 0 
            ? (topData.reduce((sum, item) => sum + item.approvalRate, 0) / topData.length).toFixed(1)
            : 0;

                const approvalValueElement = document.getElementById('approvalTrendValue');
        if (approvalValueElement) {
            approvalValueElement.textContent = `${averageApprovalRate}%`;
        }

                console.log('📊 Datos para gráfica:', topData);
        console.log('📊 Promedio de aprobación:', averageApprovalRate + '%');

                if (topData.length > 0) {
            updateApprovalLineChart(topData);
            console.log('✅ Gráfica de aprobación dibujada correctamente');
        } else {
            console.warn('⚠️ No hay datos para mostrar en la gráfica');
                        const ctx = document.getElementById('approvalLineChart');
            if (ctx) {
                const context = ctx.getContext('2d');
                context.font = '14px Arial';
                context.fillStyle = '#618975';
                context.textAlign = 'center';
                context.fillText('No hay datos disponibles', ctx.width / 2, ctx.height / 2);
            }
        }

        console.log('📈 Datos de aprobación por equipo cargados:', topData);

    } catch (err) {
        console.error('❌ Error al calcular tendencias de aprobación:', err);
        
                const approvalValueElement = document.getElementById('approvalTrendValue');
        if (approvalValueElement) {
            approvalValueElement.textContent = 'Error';
        }
        
                const ctx = document.getElementById('approvalLineChart');
        if (ctx) {
            const context = ctx.getContext('2d');
            context.font = '14px Arial';
            context.fillStyle = '#dc2626';
            context.textAlign = 'center';
            context.fillText('Error al cargar datos', ctx.width / 2, ctx.height / 2);
        }
    }
}


async function loadUsersAndCompanies() {
    const container = document.getElementById('users-content');
    if (!container) return;

    container.innerHTML = '<p>Cargando datos...</p>';

    try {
        const [companiesResponse, usersResponse] = await Promise.all([
            fetch('/client_company'),
            fetch('/users')
        ]);

        const companies = await companiesResponse.json();
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



function formatCurrency(amount) {
    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(1)}K`;
    } else {
        return `$${amount.toFixed(0)}`;
    }
}

function formatCurrencyFull(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}