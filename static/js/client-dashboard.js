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

    await loadPOCStats(user.id);
    await loadRecentAlerts(user.id);
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

function openAnalytics() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    window.location.href = `/analytics_cliente.html`;
}
