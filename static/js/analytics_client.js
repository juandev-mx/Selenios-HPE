document.addEventListener('DOMContentLoaded', async function() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    
    if (!user) {
        alert('Session not found. Please log in.');
        window.location.href = '/login.html';
        return;
    }

    
    if (user.role !== 'CLIENT') {
        alert('Access denied. This page is for customers only.');
        window.location.href = '/login.html';
        return;
    }

    
    if (user.client_company_id) {
        try {
            const response = await fetch(`/client_company/${user.client_company_id}`);
            const data = await response.json();
            console.log('Company data:', data);
        } catch(err) {
            console.error("Error loading company info:", err);
        }
    }

    
    const customerNameElement = document.getElementById('customer-name');
    if (customerNameElement) {
        customerNameElement.textContent = user.name;
    }

    
    await loadClientAnalytics(user.id || user.user_id);
});


async function loadClientAnalytics(userId) {
    try {
        console.log('📊 Loading user analytics:', userId);
        
        
        const [pocsResponse, pocEquipmentResponse, equipmentResponse] = await Promise.all([
            fetch(`/pocs?client_user_id=${userId}`),
            fetch('/poc_equipment'),
            fetch('/equipment')
        ]);

        if (!pocsResponse.ok) throw new Error('Error loading POCs');
        
        const pocs = await pocsResponse.json();
        const allPocEquipment = await pocEquipmentResponse.json();
        const allEquipment = await equipmentResponse.json();

        console.log('✅ Data loaded:', {
            pocs: pocs.length,
            pocEquipment: allPocEquipment.length,
            equipment: allEquipment.length
        });

        
        const equipmentPrices = {};
        allEquipment.forEach(eq => {
            equipmentPrices[eq.solution_id] = parseFloat(eq.price || 0);
        });

        
        const stats = calculatePOCStats(pocs, allPocEquipment, equipmentPrices);
        
        
        updateStatsCards(stats);
        
        
        createCharts(pocs, allPocEquipment, equipmentPrices);

    } catch (error) {
        console.error('❌ Error loading analytics:', error);
        
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

    console.log('📈 Stats calculated:', { 
        totalPOCs, pending, approved, rejected, totalExpenses, avgExpense
    });

    return { totalPOCs, pending, approved, rejected, totalExpenses, avgExpense };
}


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
    
    console.log('✅ Updated stats in UI');
}


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


function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}