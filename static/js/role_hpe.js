document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    if (user.role !== 'HPE_REP' && user.role !== 'HPE_MANAGER') {
        notify.error('This page is reserved for HPE personnel only.', { title: 'Access denied' });
        window.location.href = '/login.html';
        return;
    }

    initDashboard(user);
    handleInitialHash(user);
});

function handleInitialHash(user) {
    const hash = window.location.hash;
    
    if (hash) {
        // Extraer el nombre de la sección del hash (ej: #section-reportes -> reportes)
        const sectionName = hash.replace('#section-', '');
        
        if (sectionName) {
            // Pequeño delay para asegurar que el DOM esté completamente cargado
            setTimeout(() => {
                showSection(sectionName, user);
                
                // Marcar el link correspondiente como activo
                const links = document.querySelectorAll('.nav-link');
                links.forEach(link => {
                    if (link.getAttribute('data-section') === sectionName) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }, 100);
        }
    }
}

function initDashboard(user) {
    console.log('Initializing dashboard for user:', user);
    
    if (user.role === 'HPE_MANAGER') {
        showManagerFeatures();
    } else if (user.role === 'HPE_REP') {
        hideManagerFeatures();
    }

    setupEventListeners(user);
    
    console.log('Loading initial dashboard data...');
    if (!window.location.hash) {
        loadDashboardData();
    }
    
    // ELIMINADO: createAvatarMenu(user); - Ahora lo maneja navbar_hpe.js
}

function showManagerFeatures() {
    const managerElements = document.querySelectorAll('.manager-only');
    managerElements.forEach(element => {
        element.style.display = '';
    });
    console.log('Manager View enabled - Full access');
}

function hideManagerFeatures() {
    const managerElements = document.querySelectorAll('.manager-only');
    managerElements.forEach(element => {
        element.style.display = 'none';
    });
    console.log('Representative View enabled - Limited access');
}

// ELIMINADAS: createAvatarMenu() y addAvatarMenuStyles() - Ahora están en navbar_hpe.js

function setupEventListeners(user) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const section = this.getAttribute('data-section');
            
            if (!section) return;
            
            const href = this.getAttribute('href');
            if (href && href.includes('#')) {
                // No prevenir el comportamiento por defecto para permitir el hash
                setTimeout(() => {
                    showSection(section, user);
                }, 50);
            } else {
                e.preventDefault();
            }
            
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            if (!href || !href.includes('#')) {
                showSection(section, user);
            }
        });
    });

    const logo = document.querySelector('.logo');
    if (logo && logo.parentElement) {
        logo.parentElement.addEventListener('click', (e) => {
            e.preventDefault();
            history.pushState("", document.title, window.location.pathname);
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
        // NUEVO: Escuchar cambios en el hash
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash;
        if (hash) {
            const sectionName = hash.replace('#section-', '');
            showSection(sectionName, user);
        }
    });
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
            notify.warning('Only HPE Managers can access the users section.', { title: 'Insufficient permissions' });
            showSection('dashboard', user);
            return;
        }
        
        targetSection.style.display = 'block';
        
        if (sectionName === 'dashboard') {
            loadDashboardData();
        } else if (sectionName === 'users' && user.role === 'HPE_MANAGER') {
            loadUsersAndCompanies();
        } else if (sectionName === 'reportes') {
            console.log('Showing reports section');
            if (window.ReportManager) {
                new window.ReportManager();
            }
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
    console.log('🔄 Loading dashboard...');
    
    try {
        const [pocsResponse, companiesResponse, equipmentResponse, pocEquipmentResponse, usersResponse] = await Promise.all([
            fetch('/pocs'),
            fetch('/client_company'),
            fetch('/equipment'),
            fetch('/poc_equipment'),
            fetch('/users')
        ]);

        console.log('✅ Responses received');
        
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

        console.log('📊 Data loaded:', {
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
        
        console.log('✅ Dashboard fully loaded');

    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        notify.error('We could not load the dashboard. Refresh the page or try again later.', { title: 'Data load error' });
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
        chartBars.innerHTML = '<p style="text-align:center; color: #618975;">No data available</p>';
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

function updateApprovalLineChart(data) {
    const canvas = document.getElementById('approvalLineChart');
    if (!canvas) {
        console.error('❌ Canvas approvalLineChart not found');
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
        ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
        return;
    }

    window.approvalLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.equipment),
            datasets: [{
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

    console.log('✅ Line graph created with', data.length, 'teams');
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

async function updateApprovalTrends(pocs) {
    try {
        const pocEquipmentResponse = await fetch('/poc_equipment');
        const equipmentResponse = await fetch('/equipment');

        if (!pocEquipmentResponse.ok || !equipmentResponse.ok) {
            throw new Error('Error obtaining data from equipment or relationships');
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

        console.log('📊 Data for graph:', topData);
        console.log('📊 Average approval rating:', averageApprovalRate + '%');

        if (topData.length > 0) {
            updateApprovalLineChart(topData);
            console.log('✅ Approval chart drawn correctly');
        } else {
            console.warn('⚠️ There is no data to display in the graph.');
            const ctx = document.getElementById('approvalLineChart');
            if (ctx) {
                const context = ctx.getContext('2d');
                context.font = '14px Arial';
                context.fillStyle = '#618975';
                context.textAlign = 'center';
                context.fillText('No data available', ctx.width / 2, ctx.height / 2);
            }
        }

        console.log('📈 Team approval data uploaded:', topData);

    } catch (err) {
        console.error('❌ Error calculating approval trends:', err);
        
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
            context.fillText('Error loading data', ctx.width / 2, ctx.height / 2);
        }
    }
}

async function loadUsersAndCompanies() {
    const container = document.getElementById('users-content');
    if (!container) return;

    container.innerHTML = '<p>Loading data...</p>';

    try {
        const [companiesResponse, usersResponse] = await Promise.all([
            fetch('/client_company'),
            fetch('/users')
        ]);

        const companies = await companiesResponse.json();
        const users = await usersResponse.json();

        container.innerHTML = `
            <div class="section-card full-width">
                <h3 class="section-title">Client Companies</h3>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
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
                <h3 class="section-title">Users</h3>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Company</th>
                                <th>Status</th>
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
        container.innerHTML = '<div class="section-card"><p>Error loading data</p></div>';
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