// pocs_clientes.js - Gestión de POCs del usuario MEJORADO

let userPOCs = [];
let currentUser = null;
let currentEditingPOC = null;
let allEquipment = []; // Variable global para equipos
let allEquipmentItems = []; // Variable global para items

// Hacer funciones globales
window.editPOC = editPOC;
window.deletePOC = deletePOC;
window.viewPOCDetails = viewPOCDetails;
window.filterPOCs = filterPOCs;
window.closeEditModal = closeEditModal;
window.closeDetailsModal = closeDetailsModal;
window.saveEditedPOC = saveEditedPOC;
window.addEquipmentToPOC = addEquipmentToPOC;
window.removeEquipmentFromPOC = removeEquipmentFromPOC;
window.searchEquipmentForEdit = searchEquipmentForEdit;

// Crear menú de avatar
function createAvatarMenu(user) {
    const headerNav = document.querySelector('.header-nav');
    const avatar = headerNav ? headerNav.querySelector('.avatar') : null;
    
    if (!avatar) {
        console.warn('Avatar not found in header');
        return;
    }
    
    // Crear contenedor para el avatar y el menú
    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'user-info-header';
    avatarContainer.style.position = 'relative';
    
    // Reemplazar el avatar con el contenedor
    avatar.parentNode.insertBefore(avatarContainer, avatar);
    avatarContainer.appendChild(avatar);
    
    // Hacer el avatar clickeable
    avatar.style.cursor = 'pointer';
    
    // Determinar la compañía
    const company = user.company_name || 'N/A';
    
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
            // Cerrar sesión en Supabase (si está disponible)
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
    
    // Obtener información de la compañía si no está en el objeto user
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
    
    // Crear menú de avatar
    createAvatarMenu(currentUser);
    
    // Cargar equipos primero
    loadEquipmentData().then(() => {
        loadUserPOCs();
    });
});

// Cargar datos de equipos (NUEVO)
async function loadEquipmentData() {
    try {
        console.log('Loading equipment data...');
        
        // Cargar Equipment
        const equipmentResponse = await fetch('/equipment');
        if (!equipmentResponse.ok) {
            throw new Error('Error loading equipment');
        }
        allEquipment = await equipmentResponse.json();

        // Cargar Equipment Items
        const itemsResponse = await fetch('/equipment_items');
        if (!itemsResponse.ok) {
            throw new Error('Error loading equipment items');
        }
        allEquipmentItems = await itemsResponse.json();

        console.log('Equipment loaded:', allEquipment.length);
        console.log('Items loaded:', allEquipmentItems.length);
    } catch (error) {
        console.error('Error loading equipment:', error);
        alert('Error loading equipment data. Some features may not work correctly.');
    }
}

// Cargar POCs del usuario
async function loadUserPOCs() {
    const container = document.getElementById('pocs-container');
    const noPocsMessage = document.getElementById('no-pocs-message');
    
    try {
        const response = await fetch(`/pocs?client_user_id=${currentUser.id}`);
        
        if (!response.ok) {
            throw new Error('Error loading POCs');
        }
        
        userPOCs = await response.json();
        console.log('User POCs loaded:', userPOCs);

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

// Mostrar POCs en la interfaz (numerados por usuario)
function displayPOCs(pocs) {
    const container = document.getElementById('pocs-container');
    
    if (pocs.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #618975;">No POCs match your filters.</p>';
        return;
    }

    container.innerHTML = pocs.map((poc, index) => {
        const status = poc.is_approved ? 'approved' : 'pending';
        const statusLabel = poc.is_approved ? 'Approved' : 'Pending Approval';
        const statusClass = poc.is_approved ? 'status-approved' : 'status-pending';
        const createdDate = new Date(poc.created_date).toLocaleDateString();
        const userPocNumber = index + 1; // Número del POC del usuario (1, 2, 3...)
        
        return `
            <div class="poc-card" data-status="${status}">
                <div class="poc-header">
                    <h3>My POC #${userPocNumber}</h3>
                    <span class="poc-status ${statusClass}">${statusLabel}</span>
                </div>
                
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
                        <div class="poc-date">
                            <span>🔢 ID:</span>
                            <span>#${poc.poc_id}</span>
                        </div>
                        ${poc.completion_date ? `
                            <div class="poc-date">
                                <span>✅ Completed:</span>
                                <span>${new Date(poc.completion_date).toLocaleDateString()}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="poc-footer">
                    <button class="btn-view" onclick="viewPOCDetails(${poc.poc_id})">
                        View Details
                    </button>
                    ${!poc.is_approved ? `
                        <button class="btn-edit" onclick="editPOC(${poc.poc_id})">
                            Edit
                        </button>
                        <button class="btn-delete" onclick="deletePOC(${poc.poc_id})">
                            Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Filtrar POCs
function filterPOCs() {
    const filter = document.getElementById('status-filter').value;
    
    let filteredPOCs = userPOCs;
    
    if (filter === 'pending') {
        filteredPOCs = userPOCs.filter(p => !p.is_approved);
    } else if (filter === 'approved') {
        filteredPOCs = userPOCs.filter(p => p.is_approved);
    }
    
    displayPOCs(filteredPOCs);
}

// Ver detalles de un POC (Modal mejorado)
async function viewPOCDetails(pocId) {
    try {
        const pocResponse = await fetch(`/pocs/${pocId}`);
        const poc = await pocResponse.json();
        
        const equipmentResponse = await fetch(`/poc_equipment?poc_id=${pocId}`);
        const pocEquipment = await equipmentResponse.json();
        
        // Cargar detalles completos de cada equipo
        const equipmentDetails = await Promise.all(
            pocEquipment.map(async (pe) => {
                const response = await fetch(`/equipment/${pe.solution_id}`);
                return await response.json();
            })
        );
        
        // Cargar items de cada equipo
        const allItems = await Promise.all(
            pocEquipment.map(async (pe) => {
                const response = await fetch(`/equipment_items?solution_id=${pe.solution_id}`);
                return await response.json();
            })
        );
        
        showDetailsModal(poc, equipmentDetails, allItems.flat());
        
    } catch (error) {
        console.error('Error loading POC details:', error);
        alert('Error loading POC details');
    }
}

// Mostrar modal de detalles
function showDetailsModal(poc, equipment, items) {
    if (!document.getElementById('detailsModal')) {
        createDetailsModal();
    }
    
    const userPocIndex = userPOCs.findIndex(p => p.poc_id === poc.poc_id);
    const userPocNumber = userPocIndex + 1;
    
    const statusBadge = poc.is_approved 
        ? '<span class="poc-status status-approved">Approved</span>'
        : '<span class="poc-status status-pending">Pending Approval</span>';
    
    const totalPrice = equipment.reduce((sum, eq) => sum + parseFloat(eq.price || 0), 0);
    
    document.getElementById('details-content').innerHTML = `
        <div class="details-header-info">
            <div>
                <h2>My POC #${userPocNumber}</h2>
                <p style="color: #666; margin-top: 0.5rem;">Database ID: #${poc.poc_id}</p>
            </div>
            ${statusBadge}
        </div>
        
        <div class="details-section">
            <h3>📋 Business Justification</h3>
            <p class="justification-text">${poc.business_justification}</p>
        </div>
        
        <div class="details-section">
            <h3>📅 Timeline</h3>
            <div class="timeline-info">
                <div>
                    <strong>Created:</strong> ${new Date(poc.created_date).toLocaleDateString()}
                </div>
                ${poc.completion_date ? `
                    <div>
                        <strong>Completed:</strong> ${new Date(poc.completion_date).toLocaleDateString()}
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="details-section">
            <h3>🛠️ Equipment (${equipment.length})</h3>
            ${equipment.length > 0 ? `
                <div class="equipment-details-list">
                    ${equipment.map(eq => `
                        <div class="equipment-detail-card">
                            <div class="eq-info">
                                <h4>${eq.product_description}</h4>
                                <p>${eq.product_number}</p>
                                ${eq.company_program ? `<span class="eq-program">${eq.company_program}</span>` : ''}
                            </div>
                            <div class="eq-price">$${parseFloat(eq.price).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                        </div>
                    `).join('')}
                </div>
            ` : '<p style="color: #666;">No equipment added</p>'}
        </div>
        
        <div class="details-section">
            <h3>📦 Equipment Items (${items.length})</h3>
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
                                <span class="item-price">$${parseFloat(item.unit_price).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<p style="color: #666;">No items added</p>'}
        </div>
        
        <div class="details-total">
            <strong>Total Equipment Value:</strong>
            <span class="total-amount">$${totalPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
        </div>
    `;
    
    document.getElementById('detailsModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Crear modal de detalles
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

// Cerrar modal de detalles
function closeDetailsModal() {
    const modal = document.getElementById('detailsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Editar POC (MEJORADO)
async function editPOC(pocId) {
    console.log('editPOC called with ID:', pocId);
    currentEditingPOC = pocId;
    
    try {
        const pocResponse = await fetch(`/pocs/${pocId}`);
        if (!pocResponse.ok) throw new Error(`HTTP ${pocResponse.status}`);
        const poc = await pocResponse.json();
        
        const equipmentResponse = await fetch(`/poc_equipment?poc_id=${pocId}`);
        if (!equipmentResponse.ok) throw new Error(`HTTP ${equipmentResponse.status}`);
        const pocEquipment = await equipmentResponse.json();
        
        openEditModal(poc, pocEquipment);
        
    } catch (error) {
        console.error('Error loading POC for edit:', error);
        alert('Error loading POC data: ' + error.message);
    }
}

// Abrir modal de edición
function openEditModal(poc, pocEquipment) {
    if (!document.getElementById('editPOCModal')) {
        createEditModal();
    }
    
    // Verificar que los equipos estén cargados
    if (!allEquipment || allEquipment.length === 0) {
        alert('⚠️ Equipment data is not loaded yet. Please wait a moment and try again.');
        console.error('Equipment data not available');
        return;
    }
    
    const userPocIndex = userPOCs.findIndex(p => p.poc_id === poc.poc_id);
    const userPocNumber = userPocIndex + 1;
    
    document.getElementById('edit-modal-title').textContent = `Edit My POC #${userPocNumber}`;
    document.getElementById('edit-poc-id').value = poc.poc_id;
    document.getElementById('edit-justification').value = poc.business_justification;
    
    loadPOCEquipment(poc.poc_id, pocEquipment);
    
    document.getElementById('editPOCModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    console.log('Edit modal opened. Equipment available:', allEquipment.length);
}

// Crear modal de edición
function createEditModal() {
    const modalHTML = `
        <div id="editPOCModal" class="modal-overlay">
            <div class="modal-container">
                <div class="modal-header">
                    <h2 class="modal-title" id="edit-modal-title">Edit POC</h2>
                    <button class="modal-close" onclick="closeEditModal()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <input type="hidden" id="edit-poc-id">
                    
                    <div class="modal-section">
                        <label class="modal-label" for="edit-justification">Business Justification</label>
                        <textarea id="edit-justification" class="modal-textarea" placeholder="Enter business justification..." rows="6"></textarea>
                    </div>

                    <div class="modal-section">
                        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 1rem;">Current Equipment</h3>
                        <div id="current-equipment-list"></div>
                        <p style="color: #666; font-size: 13px; margin-top: 0.5rem;">
                            ⚠️ A POC must have at least one equipment item
                        </p>
                    </div>

                    <div class="modal-section">
                        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 1rem;">Add More Equipment</h3>
                        <p style="color: #666; font-size: 14px; margin-bottom: 1rem;">
                            Type at least 2 characters to search for equipment
                        </p>
                        <div class="modal-grid">
                            <div class="modal-field">
                                <label class="modal-label" for="edit-modal-equipment">Search Equipment</label>
                                <div class="modal-search">
                                    <input id="edit-modal-equipment" class="modal-input" type="text" 
                                           placeholder="Search and select equipment"
                                           oninput="searchEquipmentForEdit(this.value)" />
                                    <svg class="modal-icon" viewBox="0 0 24 24">
                                        <path d="M19.6 21L13.3 14.7C12.8 15.1 12.225 15.4167 11.575 15.65C10.925 15.8833 10.2333 16 9.5 16C7.68333 16 6.14583 15.3708 4.8875 14.1125C3.62917 12.8542 3 11.3167 3 9.5C3 7.68333 3.62917 6.14583 4.8875 4.8875C6.14583 3.62917 7.68333 3 9.5 3C11.3167 3 12.8542 3.62917 14.1125 4.8875C15.3708 6.14583 16 7.68333 16 9.5C16 10.2333 15.8833 10.925 15.65 11.575C15.4167 12.225 15.1 12.8 14.7 13.3L21 19.6L19.6 21ZM9.5 14C10.75 14 11.8125 13.5625 12.6875 12.6875C13.5625 11.8125 14 10.75 14 9.5C14 8.25 13.5625 7.1875 12.6875 6.3125C11.8125 5.4375 10.75 5 9.5 5C8.25 5 7.1875 5.4375 6.3125 6.3125C5.4375 7.1875 5 8.25 5 9.5C5 10.75 5.4375 11.8125 6.3125 12.6875C7.1875 13.5625 8.25 14 9.5 14Z" fill="currentColor"/>
                                    </svg>
                                    <div id="edit-equipment-dropdown" class="modal-dropdown"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <div style="color: #618975; font-size: 14px;">
                        <span id="edit-items-count">Loading...</span>
                    </div>
                    <div class="modal-footer-actions">
                        <button class="modal-btn-cancel" onclick="closeEditModal()">Cancel</button>
                        <button class="modal-btn-primary" onclick="saveEditedPOC()">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Cerrar modal de edición
function closeEditModal() {
    const modal = document.getElementById('editPOCModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Cargar equipos del POC
async function loadPOCEquipment(pocId, pocEquipment) {
    const container = document.getElementById('current-equipment-list');
    const countSpan = document.getElementById('edit-items-count');
    
    if (pocEquipment.length === 0) {
        container.innerHTML = '<p style="color: #618975; padding: 1rem; background: #f8f9fa; border-radius: 8px;">No equipment added yet.</p>';
        countSpan.textContent = '0 items';
        return;
    }

    try {
        const equipmentDetails = await Promise.all(
            pocEquipment.map(async (pe) => {
                const response = await fetch(`/equipment/${pe.solution_id}`);
                return await response.json();
            })
        );

        container.innerHTML = `
            <div class="equipment-list">
                ${equipmentDetails.map(eq => `
                    <div class="equipment-item">
                        <div class="equipment-info">
                            <strong>${eq.product_description}</strong>
                            <small>${eq.product_number} - ${parseFloat(eq.price).toLocaleString('en-US', {minimumFractionDigits: 2})}</small>
                        </div>
                        <button class="btn-remove-small" onclick="removeEquipmentFromPOC(${pocId}, ${eq.solution_id})">
                            Remove
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        countSpan.textContent = `${equipmentDetails.length} item${equipmentDetails.length !== 1 ? 's' : ''}`;

    } catch (error) {
        console.error('Error loading equipment details:', error);
        container.innerHTML = '<p style="color: #dc3545;">Error loading equipment</p>';
    }
}

// Buscar equipos para agregar
function searchEquipmentForEdit(query) {
    const dropdown = document.getElementById('edit-equipment-dropdown');
    
    if (!query || query.length < 2) {
        dropdown.classList.remove('active');
        return;
    }

    // Verificar que los equipos estén cargados
    if (!allEquipment || allEquipment.length === 0) {
        console.error('Equipment data not loaded!');
        dropdown.innerHTML = '<div class="modal-dropdown-item" style="color: #dc3545;">Equipment data not available. Please refresh the page.</div>';
        dropdown.classList.add('active');
        return;
    }

    console.log('Searching equipment with query:', query);
    console.log('Available equipment:', allEquipment.length);

    const filtered = allEquipment.filter(eq => 
        eq.product_description.toLowerCase().includes(query.toLowerCase()) ||
        eq.product_number.toLowerCase().includes(query.toLowerCase())
    );

    console.log('Filtered results:', filtered.length);

    if (filtered.length > 0) {
        dropdown.innerHTML = filtered.map(eq => `
            <div class="modal-dropdown-item" onclick="addEquipmentToPOC(${eq.solution_id})">
                <strong>${eq.product_description}</strong><br>
                <small style="color: #618975;">${eq.product_number} - ${parseFloat(eq.price).toLocaleString('en-US', {minimumFractionDigits: 2})}</small>
            </div>
        `).join('');
        dropdown.classList.add('active');
    } else {
        dropdown.innerHTML = '<div class="modal-dropdown-item" style="color: #618975;">No results found</div>';
        dropdown.classList.add('active');
    }
}

// Agregar equipo al POC (CON VALIDACIÓN DE DUPLICADOS)
async function addEquipmentToPOC(equipmentId) {
    const pocId = document.getElementById('edit-poc-id').value;
    
    try {
        // Verificar si el equipo ya está agregado
        const equipmentResponse = await fetch(`/poc_equipment?poc_id=${pocId}`);
        const currentEquipment = await equipmentResponse.json();
        
        const alreadyExists = currentEquipment.some(eq => eq.solution_id === equipmentId);
        
        if (alreadyExists) {
            alert('⚠️ This equipment is already added to the POC!');
            document.getElementById('edit-modal-equipment').value = '';
            document.getElementById('edit-equipment-dropdown').classList.remove('active');
            return;
        }
        
        const response = await fetch('/poc_equipment', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify([{
                poc_id: parseInt(pocId),
                solution_id: equipmentId
            }])
        });

        if (response.ok) {
            const updatedEquipmentResponse = await fetch(`/poc_equipment?poc_id=${pocId}`);
            const pocEquipment = await updatedEquipmentResponse.json();
            loadPOCEquipment(pocId, pocEquipment);
            
            document.getElementById('edit-modal-equipment').value = '';
            document.getElementById('edit-equipment-dropdown').classList.remove('active');
            
            alert('✅ Equipment added successfully!');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error adding equipment');
        }
    } catch (error) {
        console.error('Error adding equipment:', error);
        alert('Error adding equipment: ' + error.message);
    }
}

// Remover equipo del POC (CON VALIDACIÓN)
async function removeEquipmentFromPOC(pocId, solutionId) {
    try {
        // Verificar cuántos equipos tiene el POC actualmente
        const equipmentResponse = await fetch(`/poc_equipment?poc_id=${pocId}`);
        const currentEquipment = await equipmentResponse.json();
        
        console.log('Current equipment count:', currentEquipment.length);
        
        // Si solo queda 1 equipo, no permitir eliminarlo
        if (currentEquipment.length <= 1) {
            alert('⚠️ Cannot remove the last equipment!\n\nA POC must have at least one equipment item.\n\nPlease add another equipment before removing this one.');
            return;
        }
        
        if (!confirm('Remove this equipment from the POC?')) return;
        
        const response = await fetch(`/poc_equipment/${pocId}/${solutionId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const updatedEquipmentResponse = await fetch(`/poc_equipment?poc_id=${pocId}`);
            const pocEquipment = await updatedEquipmentResponse.json();
            loadPOCEquipment(pocId, pocEquipment);
            alert('Equipment removed successfully!');
        } else {
            throw new Error('Error removing equipment');
        }
    } catch (error) {
        console.error('Error removing equipment:', error);
        alert('Error removing equipment: ' + error.message);
    }
}

// Guardar cambios del POC
async function saveEditedPOC() {
    const pocId = document.getElementById('edit-poc-id').value;
    const justification = document.getElementById('edit-justification').value.trim();

    if (!justification) {
        alert('Please enter a business justification');
        return;
    }

    const saveBtn = document.querySelector('#editPOCModal .modal-btn-primary');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        const response = await fetch(`/pocs/${pocId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({business_justification: justification})
        });

        if (response.ok) {
            alert('POC updated successfully!');
            closeEditModal();
            loadUserPOCs();
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Error updating POC');
        }
    } catch (error) {
        console.error('Error updating POC:', error);
        alert('Error updating POC: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
    }
}

// Eliminar POC
async function deletePOC(pocId) {
    const userPocIndex = userPOCs.findIndex(p => p.poc_id === pocId);
    const userPocNumber = userPocIndex + 1;
    
    if (!confirm(`Are you sure you want to delete My POC #${userPocNumber}?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    try {
        // Primero eliminar equipment asociado
        const equipmentResponse = await fetch(`/poc_equipment?poc_id=${pocId}`);
        const pocEquipment = await equipmentResponse.json();
        
        for (const eq of pocEquipment) {
            await fetch(`/poc_equipment/${pocId}/${eq.solution_id}`, {
                method: 'DELETE'
            });
        }
        
        // Luego eliminar el POC
        const response = await fetch(`/pocs/${pocId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('POC deleted successfully');
            loadUserPOCs();
        } else {
            throw new Error('Error deleting POC');
        }
        
    } catch (error) {
        console.error('Error deleting POC:', error);
        alert('Error deleting POC: ' + error.message);
    }
}