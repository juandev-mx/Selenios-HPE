// pocs_clientes.js - Sistema de 30 días con aprobación/denegación

let userPOCs = [];
let currentUser = null;
let currentEditingPOC = null;
let allPOCEquipment = [];
let equipmentDetailsMap = {};

// Funciones globales
window.editPOC = editPOC;
window.viewPOCDetails = viewPOCDetails;
window.filterPOCs = filterPOCs;
window.closeEditModal = closeEditModal;
window.closeDetailsModal = closeDetailsModal;
window.saveEditedPOC = saveEditedPOC;
window.addEquipmentToPOC = addEquipmentToPOC;
window.removeEquipmentFromPOC = removeEquipmentFromPOC;
window.searchEquipmentForEdit = searchEquipmentForEdit;
window.approvePOC = approvePOC;
window.denyPOC = denyPOC;

// Calcular días restantes del periodo de prueba
function getDaysRemaining(trialEndDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(trialEndDate);
    endDate.setHours(0, 0, 0, 0);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Crear menú de avatar
function createAvatarMenu(user) {
    const headerNav = document.querySelector('.header-nav');
    const avatar = headerNav ? headerNav.querySelector('.avatar') : null;
    
    if (!avatar) {
        console.warn('Avatar not found in header');
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
                const { error } = await supabase.auth.signOut();
                if (error) console.error('Error cerrando sesión en Supabase:', error.message);
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
        
        /* Estilos para timer y decisiones */
        .trial-timer {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border-left: 4px solid #ffc107;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            color: #856404;
            margin-bottom: 1rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .trial-timer.urgent {
            background: linear-gradient(135deg, #f8d7da 0%, #ffb3b3 100%);
            border-left-color: #dc3545;
            color: #721c24;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.85; }
        }
        .trial-timer.expired {
            background: linear-gradient(135deg, #d4edda 0%, #a3d9a5 100%);
            border-left-color: #28a745;
            color: #155724;
        }
        .decision-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.25rem;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .decision-badge.approved {
            background: linear-gradient(135deg, #d4edda 0%, #a3d9a5 100%);
            color: #155724;
            border: 2px solid #28a745;
        }
        .decision-badge.denied {
            background: linear-gradient(135deg, #f8d7da 0%, #ffb3b3 100%);
            color: #721c24;
            border: 2px solid #dc3545;
        }
        .btn-approve {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            border: none;
            padding: 0.6rem 1.2rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(40, 167, 69, 0.3);
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }
        .btn-approve:hover {
            background: linear-gradient(135deg, #218838 0%, #1aa179 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(40, 167, 69, 0.4);
        }
        .btn-deny {
            background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
            color: white;
            border: none;
            padding: 0.6rem 1.2rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(220, 53, 69, 0.3);
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }
        .btn-deny:hover {
            background: linear-gradient(135deg, #c82333 0%, #c0392b 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(220, 53, 69, 0.4);
        }
        .poc-actions-row {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            margin-top: 0.5rem;
        }
    `;
    document.head.appendChild(styles);
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log('pocs_clientes.js loaded');
    
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

    currentUser = user;
    console.log('Current user:', currentUser);
    
    if (user.client_company_id && !user.company_name) {
        try {
            const response = await fetch(`/client_company/${user.client_company_id}`);
            if (response.ok) {
                const company = await response.json();
                currentUser.company_name = company.name;
                sessionStorage.setItem('user', JSON.stringify(currentUser));
            }
        } catch (error) {
            console.error('Error loading company info:', error);
        }
    }
    
    createAvatarMenu(currentUser);
    
    console.log('Loading equipment data...');
    if (typeof window.loadEquipmentData === 'function') {
        await window.loadEquipmentData();
    } else {
        console.error('loadEquipmentData not available!');
    }
    
    console.log('Loading user POCs...');
    await loadUserPOCs();
});

async function loadUserPOCs() {
    const container = document.getElementById('pocs-container');
    const noPocsMessage = document.getElementById('no-pocs-message');
    
    try {
        console.log('Loading POCs for user:', currentUser.id);
        
        const [pocsResponse, allPOCEquipmentResponse, allEquipmentResponse] = await Promise.all([
            fetch(`/pocs?client_user_id=${currentUser.id}`),
            fetch('/poc_equipment'),
            fetch('/equipment')
        ]);
        
        if (!pocsResponse.ok) {
            throw new Error('Error loading POCs');
        }
        
        userPOCs = await pocsResponse.json();
        allPOCEquipment = await allPOCEquipmentResponse.json();
        const equipmentList = await allEquipmentResponse.json();
        
        equipmentDetailsMap = {};
        equipmentList.forEach(eq => {
            equipmentDetailsMap[eq.solution_id] = eq;
        });
        
        console.log('✅ POCs loaded:', userPOCs.length);
        console.log('✅ Equipment map created:', Object.keys(equipmentDetailsMap).length);

        if (userPOCs.length === 0) {
            container.style.display = 'none';
            noPocsMessage.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        noPocsMessage.style.display = 'none';
        displayPOCs(userPOCs);
        
    } catch (error) {
        console.error('Error loading POCs:', error);
        container.innerHTML = `
            <div class="error-message">
                <p>Error loading POCs. Please try again later.</p>
                <button class="btn btn-primary" onclick="loadUserPOCs()">Retry</button>
            </div>
        `;
    }
}

function displayPOCs(pocs) {
    const container = document.getElementById('pocs-container');
    
    if (pocs.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #618975;">No POCs match your filters.</p>';
        return;
    }

    container.innerHTML = pocs.map((poc) => {
        const status = poc.status || 'in_trial';
        const createdDate = new Date(poc.created_date).toLocaleDateString();
        
        let statusHTML = '';
        let timerHTML = '';
        let actionsHTML = '';
        
        // Sistema de estados y timer
        if (status === 'in_trial') {
            const daysRemaining = getDaysRemaining(poc.trial_end_date);
            const timerClass = daysRemaining <= 5 ? 'urgent' : (daysRemaining <= 0 ? 'expired' : '');
            
            let timerText = '';
            if (daysRemaining > 0) {
                timerText = `⏰ ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining in trial period`;
            } else {
                timerText = '⏰ Trial period ended - Will be auto-approved';
            }
            
            timerHTML = `
                <div class="trial-timer ${timerClass}">
                    ${timerText}
                </div>
            `;
            statusHTML = '<span class="poc-status status-pending">In Trial</span>';
            
            // Botones de acción durante el periodo de prueba
            actionsHTML = `
                <button class="btn-view" onclick="viewPOCDetails(${poc.poc_id})">👁️ View Details</button>
                <div class="poc-actions-row">
                    <button class="btn-approve" onclick="approvePOC(${poc.poc_id})">
                        ✓ Approve
                    </button>
                    <button class="btn-deny" onclick="denyPOC(${poc.poc_id})">
                        ✗ Deny
                    </button>
                    <button class="btn-edit" onclick="editPOC(${poc.poc_id})">✏️ Edit</button>
                </div>
            `;
        } else if (status === 'approved') {
            const decisionDate = poc.decision_date ? new Date(poc.decision_date).toLocaleDateString() : 'N/A';
            statusHTML = '<span class="poc-status status-approved">Approved</span>';
            timerHTML = `
                <div class="decision-badge approved">
                    ✓ Approved on ${decisionDate}
                </div>
            `;
            // Solo ver detalles una vez aprobada
            actionsHTML = `
                <button class="btn-view" onclick="viewPOCDetails(${poc.poc_id})">👁️ View Details</button>
            `;
        } else if (status === 'denied') {
            const decisionDate = poc.decision_date ? new Date(poc.decision_date).toLocaleDateString() : 'N/A';
            statusHTML = '<span class="poc-status status-denied" style="background: linear-gradient(135deg, #f8d7da 0%, #ffb3b3 100%); color: #721c24; border: 2px solid #dc3545;">Denied</span>';
            timerHTML = `
                <div class="decision-badge denied">
                    ✗ Denied on ${decisionDate}
                </div>
            `;
            // Solo ver detalles una vez denegada
            actionsHTML = `
                <button class="btn-view" onclick="viewPOCDetails(${poc.poc_id})">👁️ View Details</button>
            `;
        }
        
        return `
            <div class="poc-card" data-status="${status}">
                <div class="poc-header">
                    <h3>My POC</h3>
                    ${statusHTML}
                </div>
                
                ${timerHTML}
                
                <div class="poc-body">
                    <div class="poc-info">
                        <strong>Business Justification:</strong>
                        <p>${poc.business_justification.substring(0, 100)}${poc.business_justification.length > 100 ? '...' : ''}</p>
                    </div>
                    
                    <div class="poc-meta">
                        <div class="poc-date">
                            <span>📅 Created:</span>
                            <span>${createdDate}</span>
                        </div>
                        ${poc.trial_end_date ? `
                            <div class="poc-date">
                                <span>🏁 Trial Ends:</span>
                                <span>${new Date(poc.trial_end_date).toLocaleDateString()}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="poc-footer">
                    ${actionsHTML}
                </div>
            </div>
        `;
    }).join('');
}

function filterPOCs() {
    const filter = document.getElementById('status-filter').value;
    
    let filteredPOCs = userPOCs;
    
    if (filter === 'pending') {
        filteredPOCs = userPOCs.filter(p => p.status === 'in_trial');
    } else if (filter === 'approved') {
        filteredPOCs = userPOCs.filter(p => p.status === 'approved');
    } else if (filter === 'denied') {
        filteredPOCs = userPOCs.filter(p => p.status === 'denied');
    }
    
    displayPOCs(filteredPOCs);
}

// Aprobar POC
async function approvePOC(pocId) {
    if (!confirm('✅ ¿Aprobar esta POC?\n\nEsta decisión es permanente y no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await fetch(`/pocs/${pocId}/decision`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ decision: 'approve' })
        });
        
        if (response.ok) {
            alert('✅ POC approved successfully!');
            await loadUserPOCs();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error approving POC');
        }
    } catch (error) {
        console.error('Error approving POC:', error);
        alert('Error: ' + error.message);
    }
}

// Denegar POC
async function denyPOC(pocId) {
    if (!confirm('❌ ¿Denegar esta POC?\n\nEsta decisión es permanente y no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await fetch(`/pocs/${pocId}/decision`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ decision: 'deny' })
        });
        
        if (response.ok) {
            alert('❌ POC denied successfully!');
            await loadUserPOCs();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error denying POC');
        }
    } catch (error) {
        console.error('Error denying POC:', error);
        alert('Error: ' + error.message);
    }
}

async function viewPOCDetails(pocId) {
    try {
        const poc = userPOCs.find(p => p.poc_id === pocId);
        if (!poc) throw new Error('POC not found');
        
        const pocEquipment = allPOCEquipment.filter(pe => pe.poc_id === pocId);
        const equipmentDetails = pocEquipment.map(pe => equipmentDetailsMap[pe.solution_id]).filter(Boolean);
        
        const itemsPromises = pocEquipment.map(pe => 
            fetch(`/equipment_items?solution_id=${pe.solution_id}`).then(r => r.json())
        );
        const allItems = await Promise.all(itemsPromises);
        
        showDetailsModal(poc, equipmentDetails, allItems.flat());
        
    } catch (error) {
        console.error('Error loading POC details:', error);
        alert('Error loading POC details');
    }
}

function showDetailsModal(poc, equipment, items) {
    if (!document.getElementById('detailsModal')) {
        createDetailsModal();
    }
    
    const status = poc.status || 'in_trial';
    let statusBadge = '';
    let timerHTML = '';
    
    if (status === 'in_trial') {
        const daysRemaining = getDaysRemaining(poc.trial_end_date);
        statusBadge = '<span class="poc-status status-pending">In Trial</span>';
        
        let timerText = '';
        let timerClass = '';
        if (daysRemaining > 0) {
            timerText = `⏰ ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining to make a decision`;
            timerClass = daysRemaining <= 5 ? 'urgent' : '';
        } else {
            timerText = '⏰ Trial ended - Will be auto-approved after review';
            timerClass = 'expired';
        }
        
        timerHTML = `
            <div class="details-section">
                <h3>Trial Period Status</h3>
                <div class="trial-timer ${timerClass}">
                    ${timerText}
                </div>
                <p style="color: #666; font-size: 14px; margin-top: 0.5rem;">
                    You can approve or deny this POC before the trial period ends.
                </p>
            </div>
        `;
    } else if (status === 'approved') {
        const decisionDate = poc.decision_date ? new Date(poc.decision_date).toLocaleDateString() : 'N/A';
        statusBadge = '<span class="poc-status status-approved">Approved</span>';
        timerHTML = `
            <div class="details-section">
                <h3>Decision</h3>
                <div class="decision-badge approved">
                    ✓ This POC was approved on ${decisionDate}
                </div>
            </div>
        `;
    } else if (status === 'denied') {
        const decisionDate = poc.decision_date ? new Date(poc.decision_date).toLocaleDateString() : 'N/A';
        statusBadge = '<span class="poc-status status-denied" style="background: linear-gradient(135deg, #f8d7da 0%, #ffb3b3 100%); color: #721c24; border: 2px solid #dc3545;">Denied</span>';
        timerHTML = `
            <div class="details-section">
                <h3>Decision</h3>
                <div class="decision-badge denied">
                    ✗ This POC was denied on ${decisionDate}
                </div>
            </div>
        `;
    }
    
    const totalPrice = equipment.reduce((sum, eq) => sum + parseFloat(eq.price || 0), 0);
    
    document.getElementById('details-content').innerHTML = `
        <div class="details-header-info">
            <div>
                <h2>My POC</h2>
            </div>
            ${statusBadge}
        </div>
        
        ${timerHTML}
        
        <div class="details-section">
            <h3>Business Justification</h3>
            <p class="justification-text">${poc.business_justification}</p>
        </div>
        
        <div class="details-section">
            <h3>Timeline</h3>
            <div class="timeline-info">
                <div>
                    <strong>Created:</strong> ${new Date(poc.created_date).toLocaleDateString()}
                </div>
                ${poc.trial_end_date ? `
                    <div>
                        <strong>Trial Ends:</strong> ${new Date(poc.trial_end_date).toLocaleDateString()}
                    </div>
                ` : ''}
                ${poc.decision_date ? `
                    <div>
                        <strong>Decision Date:</strong> ${new Date(poc.decision_date).toLocaleDateString()}
                    </div>
                ` : ''}
                ${poc.completion_date ? `
                    <div>
                        <strong>Completed:</strong> ${new Date(poc.completion_date).toLocaleDateString()}
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="details-section">
            <h3>Equipment (${equipment.length})</h3>
            ${equipment.length > 0 ? `
                <div class="equipment-details-list">
                    ${equipment.map(eq => `
                        <div class="equipment-detail-card">
                            <div class="eq-info">
                                <h4>${eq.product_description}</h4>
                                <p>${eq.product_number}</p>
                                ${eq.company_program ? `<span class="eq-program">${eq.company_program}</span>` : ''}
                            </div>
                            <div class="eq-price">${parseFloat(eq.price).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                        </div>
                    `).join('')}
                </div>
            ` : '<p style="color: #666;">No equipment added</p>'}
        </div>
        
        <div class="details-section">
            <h3>Equipment Items (${items.length})</h3>
            ${items.length > 0 ? `
                <div class="items-details-list">
                    ${items.map(item => `
                        <div class="item-detail-row">
                            <div>
                                <strong>${item.product_name}</strong>
                                <small>${item.product_number}</small>
                            </div>
                            <div>
                                <span class="item-qty">Qty: ${item.qty}</span>
                                <span class="item-price">${parseFloat(item.unit_price).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<p style="color: #666;">No items added</p>'}
        </div>
        
        <div class="details-total">
            <strong>Total Equipment Value:</strong>
            <span class="total-amount">${totalPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
        </div>
    `;
    
    document.getElementById('detailsModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function createDetailsModal() {
    const modalHTML = `
        <div id="detailsModal" class="modal-overlay">
            <div class="modal-container">
                <div class="modal-header">
                    <h2 class="modal-title">POC Details</h2>
                    <button class="modal-close" onclick="closeDetailsModal()">&times;</button>
                </div>
                <div class="modal-body" id="details-content"></div>
                <div class="modal-footer">
                    <button class="modal-btn-cancel" onclick="closeDetailsModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeDetailsModal() {
    const modal = document.getElementById('detailsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

async function editPOC(pocId) {
    console.log('editPOC called with ID:', pocId);
    
    // Verificar si está en periodo de prueba
    const poc = userPOCs.find(p => p.poc_id === pocId);
    if (poc && poc.status !== 'in_trial') {
        alert('⚠️ Cannot edit a POC that has been approved or denied.');
        return;
    }
    
    currentEditingPOC = pocId;
    
    try {
        const pocResponse = await fetch(`/pocs/${pocId}`);
        if (!pocResponse.ok) throw new Error(`HTTP ${pocResponse.status}`);
        const pocData = await pocResponse.json();
        
        const equipmentResponse = await fetch(`/poc_equipment?poc_id=${pocId}`);
        if (!equipmentResponse.ok) throw new Error(`HTTP ${equipmentResponse.status}`);
        const pocEquipment = await equipmentResponse.json();
        
        openEditModal(pocData, pocEquipment);
        
    } catch (error) {
        console.error('Error loading POC for edit:', error);
        alert('Error loading POC data: ' + error.message);
    }
}

function openEditModal(poc, pocEquipment) {
    if (!document.getElementById('editPOCModal')) {
        createEditModal();
    }
    
    document.getElementById('edit-justification').value = poc.business_justification;
    
    displayEditEquipmentList(pocEquipment);
    
    document.getElementById('editPOCModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function createEditModal() {
    const modalHTML = `
        <div id="editPOCModal" class="modal-overlay">
            <div class="modal-container" style="max-width: 800px;">
                <div class="modal-header">
                    <h2 class="modal-title">Edit POC</h2>
                    <button class="modal-close" onclick="closeEditModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="edit-justification">Business Justification</label>
                        <textarea id="edit-justification" rows="4" class="form-control" placeholder="Enter business justification..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Equipment</label>
                        <div id="edit-equipment-list"></div>
                    </div>
                    
                    <div class="form-group">
                        <label>Add More Equipment</label>
                        <div class="search-box">
                            <input type="text" id="edit-equipment-search" class="form-control" placeholder="Search equipment..." oninput="searchEquipmentForEdit()">
                        </div>
                        <div id="edit-equipment-results" class="search-results"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn-cancel" onclick="closeEditModal()">Cancel</button>
                    <button class="modal-btn-save" onclick="saveEditedPOC()">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function displayEditEquipmentList(pocEquipment) {
    const container = document.getElementById('edit-equipment-list');
    
    if (!pocEquipment || pocEquipment.length === 0) {
        container.innerHTML = '<p style="color: #666;">No equipment added yet</p>';
        return;
    }
    
    container.innerHTML = pocEquipment.map(pe => {
        const eq = equipmentDetailsMap[pe.solution_id];
        if (!eq) return '';
        
        return `
            <div class="equipment-item-edit" data-solution-id="${eq.solution_id}">
                <div class="eq-details">
                    <strong>${eq.product_description}</strong>
                    <small>${eq.product_number}</small>
                </div>
                <button class="btn-remove" onclick="removeEquipmentFromPOC('${eq.solution_id}')">Remove</button>
            </div>
        `;
    }).join('');
}

function searchEquipmentForEdit() {
    const searchTerm = document.getElementById('edit-equipment-search').value.toLowerCase();
    const resultsContainer = document.getElementById('edit-equipment-results');
    
    if (searchTerm.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }
    
    const currentEquipmentIds = Array.from(document.querySelectorAll('.equipment-item-edit'))
        .map(el => el.dataset.solutionId);
    
    const filteredEquipment = Object.values(equipmentDetailsMap).filter(eq => {
        const matchesSearch = 
            eq.product_description.toLowerCase().includes(searchTerm) ||
            eq.product_number.toLowerCase().includes(searchTerm);
        const notAlreadyAdded = !currentEquipmentIds.includes(eq.solution_id);
        return matchesSearch && notAlreadyAdded;
    }).slice(0, 5);
    
    if (filteredEquipment.length === 0) {
        resultsContainer.innerHTML = '<p style="color: #666; padding: 1rem;">No equipment found</p>';
        return;
    }
    
    resultsContainer.innerHTML = filteredEquipment.map(eq => `
        <div class="search-result-item" onclick="addEquipmentToPOC('${eq.solution_id}')">
            <div>
                <strong>${eq.product_description}</strong>
                <small>${eq.product_number}</small>
            </div>
            <span class="add-icon">+</span>
        </div>
    `).join('');
}

async function addEquipmentToPOC(solutionId) {
    try {
        const response = await fetch('/poc_equipment', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                poc_id: currentEditingPOC,
                solution_id: solutionId
            })
        });
        
        if (response.ok) {
            const updatedEquipment = await fetch(`/poc_equipment?poc_id=${currentEditingPOC}`).then(r => r.json());
            displayEditEquipmentList(updatedEquipment);
            document.getElementById('edit-equipment-search').value = '';
            document.getElementById('edit-equipment-results').innerHTML = '';
        }
    } catch (error) {
        console.error('Error adding equipment:', error);
        alert('Error adding equipment');
    }
}

async function removeEquipmentFromPOC(solutionId) {
    if (!confirm('Remove this equipment?')) return;
    
    try {
        const response = await fetch(`/poc_equipment/${currentEditingPOC}/${solutionId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            const updatedEquipment = await fetch(`/poc_equipment?poc_id=${currentEditingPOC}`).then(r => r.json());
            displayEditEquipmentList(updatedEquipment);
        }
    } catch (error) {
        console.error('Error removing equipment:', error);
        alert('Error removing equipment');
    }
}

async function saveEditedPOC() {
    const justification = document.getElementById('edit-justification').value.trim();
    
    if (!justification) {
        alert('Please enter business justification');
        return;
    }
    
    try {
        const response = await fetch(`/pocs/${currentEditingPOC}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                business_justification: justification
            })
        });
        
        if (response.ok) {
            alert('POC updated successfully!');
            closeEditModal();
            await loadUserPOCs();
        } else {
            throw new Error('Error updating POC');
        }
    } catch (error) {
        console.error('Error saving POC:', error);
        alert('Error saving changes');
    }
}

function closeEditModal() {
    const modal = document.getElementById('editPOCModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        currentEditingPOC = null;
    }
}