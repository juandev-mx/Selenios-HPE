// client-dashboard.js - Analytics para cliente basado en BD real

document.addEventListener('DOMContentLoaded', async function() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    // Verificar que existe usuario en sesión
    if (!user) {
        alert('Sesión no encontrada. Por favor inicia sesión.');
        window.location.href = '/login.html';
        return;
    }

    // Verificar que el usuario tiene rol de CLIENT
    if (user.role !== 'CLIENT') {
        alert('Acceso denegado. Esta página es solo para clientes.');
        window.location.href = '/login.html';
        return;
    }

    // Cargar información de la compañía si existe
    if (user.client_company_id) {
        try {
            const response = await fetch(`/client_company/${user.client_company_id}`);
            const data = await response.json();
            console.log('Company data:', data);
        } catch(err) {
            console.error("Error loading company info:", err);
        }
    }

    // Actualizar nombre del cliente en el dashboard
    const customerNameElement = document.getElementById('customer-name');
    if (customerNameElement) {
        customerNameElement.textContent = user.name;
    }

    // Crear menú del avatar
    createAvatarMenu(user);

    // Cargar analytics del cliente
    await loadClientAnalytics(user.id || user.user_id);
});

function createAvatarMenu(user) {
    const headerNav = document.querySelector('.header-nav');
    const avatar = headerNav ? headerNav.querySelector('.avatar') : null;
    
    if (!avatar) {
        console.warn('Avatar not found');
        return;
    }
    
    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'user-info-header';
    avatarContainer.style.position = 'relative';
    
    avatar.parentNode.insertBefore(avatarContainer, avatar);
    avatarContainer.appendChild(avatar);
    
    avatar.style.cursor = 'pointer';
    
    const company = user.company_name || 'N/A';
    
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
    
    avatarContainer.appendChild(menu);
    addAvatarMenuStyles();
    
    avatar.addEventListener('click', function(e) {
        e.stopPropagation();
        const isVisible = menu.style.display === 'block';
        
        if (isVisible) {
            menu.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => menu.style.display = 'none', 250);
        } else {
            menu.style.display = 'block';
            menu.style.animation = 'slideDown 0.3s ease';
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!avatarContainer.contains(e.target)) {
            if (menu.style.display === 'block') {
                menu.style.animation = 'slideUp 0.3s ease';
                setTimeout(() => menu.style.display = 'none', 250);
            }
        }
    });
    
    const logoutBtn = menu.querySelector('#avatarLogoutBtn');
    logoutBtn.addEventListener('click', async function() {
        try {
            if (typeof supabase !== 'undefined') {
                await supabase.auth.signOut();
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
        .user-info-header { position: relative; }
        .avatar-menu {
            position: absolute; top: calc(100% + 10px); right: 0;
            background: white; border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            min-width: 280px; z-index: 1000; overflow: hidden;
        }
        .avatar-menu-header {
            padding: 1.5rem; display: flex; align-items: center; gap: 1rem;
            background: linear-gradient(135deg, #01a982 0%, #00875a 100%);
        }
        .avatar-menu-img {
            width: 50px; height: 50px; border-radius: 50%;
            border: 3px solid white; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .avatar-menu-info { flex: 1; color: white; }
        .avatar-menu-name { font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem; }
        .avatar-menu-role {
            font-size: 0.75rem; opacity: 0.9; font-weight: 500;
            text-transform: uppercase; letter-spacing: 0.5px;
        }
        .avatar-menu-divider { height: 1px; background: #e5e7e6; margin: 0; }
        .avatar-menu-details { padding: 1rem 1.5rem; }
        .avatar-menu-item {
            display: flex; justify-content: space-between;
            align-items: center; margin-bottom: 0.75rem;
        }
        .avatar-menu-item:last-child { margin-bottom: 0; }
        .avatar-menu-label {
            font-size: 0.75rem; color: #6b7280; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.5px;
        }
        .avatar-menu-value {
            font-size: 0.875rem; color: #1f2937; font-weight: 500;
            max-width: 180px; overflow: hidden;
            text-overflow: ellipsis; white-space: nowrap; text-align: right;
        }
        .avatar-menu-logout {
            width: 100%; padding: 1rem 1.5rem; background: white;
            border: none; color: #dc2626; font-weight: 600;
            font-size: 0.875rem; cursor: pointer;
            transition: all 0.2s ease; display: flex;
            align-items: center; justify-content: center;
            gap: 0.5rem; font-family: inherit;
        }
        .avatar-menu-logout:hover { background: #fef2f2; }
        .avatar-menu-logout svg { width: 16px; height: 16px; }
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

// FUNCIÓN PRINCIPAL: Cargar analytics basado en la BD real
async function loadClientAnalytics(userId) {
    try {
        console.log('📊 Cargando analytics para usuario:', userId);
        
        // Cargar POCs del usuario, equipos asociados y precios
        const [pocsResponse, pocEquipmentResponse, equipmentResponse] = await Promise.all([
            fetch(`/pocs?client_user_id=${userId}`),
            fetch('/poc_equipment'),
            fetch('/equipment')
        ]);

        if (!pocsResponse.ok) throw new Error('Error loading POCs');
        
        const pocs = await pocsResponse.json();
        const allPocEquipment = await pocEquipmentResponse.json();
        const allEquipment = await equipmentResponse.json();

        console.log('✅ Datos cargados:', {
            pocs: pocs.length,
            pocEquipment: allPocEquipment.length,
            equipment: allEquipment.length
        });

        // Crear mapa de precios de equipos
        const equipmentPrices = {};
        allEquipment.forEach(eq => {
            equipmentPrices[eq.solution_id] = parseFloat(eq.price || 0);
        });

        // Calcular estadísticas
        const stats = calculatePOCStats(pocs, allPocEquipment, equipmentPrices);
        
        // Actualizar UI
        updateStatsCards(stats);
        
        // Crear gráficas
        createCharts(pocs, allPocEquipment, equipmentPrices);

    } catch (error) {
        console.error('❌ Error loading analytics:', error);
        // Mostrar valores por defecto en caso de error
        updateStatsCards({
            totalPOCs: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            totalExpenses: 0,
            avgExpense: 0
        });
    }
}

// Calcular estadísticas de POCs
function calculatePOCStats(pocs, allPocEquipment, equipmentPrices) {
    const totalPOCs = pocs.length;
    const pending = pocs.filter(p => p.is_approved === null || p.is_approved === undefined).length;
    const approved = pocs.filter(p => p.is_approved === true).length;
    const rejected = pocs.filter(p => p.is_approved === false).length;

    let totalExpenses = 0;
    
    pocs.forEach(poc => {
        const pocEquipments = allPocEquipment.filter(pe => pe.poc_id === poc.poc_id);
        pocEquipments.forEach(pe => {
            const price = equipmentPrices[pe.solution_id] || 0;
            totalExpenses += price;
        });
    });

    const avgExpense = totalPOCs > 0 ? totalExpenses / totalPOCs : 0;

    console.log('📈 Stats calculadas:', { 
        totalPOCs, pending, approved, rejected, totalExpenses, avgExpense
    });

    return { totalPOCs, pending, approved, rejected, totalExpenses, avgExpense };
}

// Actualizar tarjetas de estadísticas
function updateStatsCards(stats) {
    const totalPocsElement = document.getElementById('total-pocs');
    const pendingElement = document.getElementById('pending-count');
    const approvedElement = document.getElementById('approved-count');
    const rejectedElement = document.getElementById('rejected-count');
    const totalExpensesElement = document.getElementById('total-expenses');
    const avgExpenseElement = document.getElementById('avg-expense');

    if (totalPocsElement) totalPocsElement.textContent = stats.totalPOCs;
    if (pendingElement) pendingElement.textContent = stats.pending;
    if (approvedElement) approvedElement.textContent = stats.approved;
    if (rejectedElement) rejectedElement.textContent = stats.rejected;
    if (totalExpensesElement) totalExpensesElement.textContent = formatCurrency(stats.totalExpenses);
    if (avgExpenseElement) avgExpenseElement.textContent = formatCurrency(stats.avgExpense);
    
    console.log('✅ Stats actualizadas en UI');
}

// Crear gráficas
function createCharts(pocs, allPocEquipment, equipmentPrices) {
    const monthlyData = {};
    
    pocs.forEach(poc => {
        if (!poc.created_date) return;
        const date = new Date(poc.created_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) monthlyData[monthKey] = { count: 0, expenses: 0 };
        
        monthlyData[monthKey].count++;
        
        const pocEquipments = allPocEquipment.filter(pe => pe.poc_id === poc.poc_id);
        pocEquipments.forEach(pe => {
            const price = equipmentPrices[pe.solution_id] || 0;
            monthlyData[monthKey].expenses += price;
        });
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, parseInt(monthNum) - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    
    const pocCounts = sortedMonths.map(month => monthlyData[month].count);
    const expensesData = sortedMonths.map(month => monthlyData[month].expenses);
    
    const pocsCanvas = document.getElementById('pocs-by-month-chart');
    if (pocsCanvas) {
        new Chart(pocsCanvas, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'POCs Requested', data: pocCounts, backgroundColor: 'rgba(1, 169, 130, 0.7)', borderColor: 'rgba(1, 169, 130, 1)', borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { display: true, position: 'top' } } }
        });
    }
    
    const expensesCanvas = document.getElementById('expenses-by-month-chart');
    if (expensesCanvas) {
        new Chart(expensesCanvas, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Total Expenses', data: expensesData, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 1)', borderWidth: 3, fill: true, tension: 0.4 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return '$' + value.toLocaleString(); } } } }, plugins: { legend: { display: true, position: 'top' }, tooltip: { callbacks: { label: function(context) { return 'Expenses: ' + formatCurrency(context.parsed.y); } } } } }
        });
    }
}

// Formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}
