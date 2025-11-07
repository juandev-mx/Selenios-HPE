// PocsHPEManager.js - Dynamic POC Management for HPE Managers

// Estado global
let allPocs = [];
let currentFilter = 'all'; // 'all', 'approved', 'rejected', 'pending'

// Hacer funciones globales
window.handleApprove = handleApprove;
window.handleDeny = handleDeny;
window.showPocDetails = showPocDetails;
window.closePocModal = closePocModal;

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('PocsHPEManager.js loaded');
    initializePage();
});

async function initializePage() {
    await loadPocs();
    setupEventListeners();
}

// Cargar POCs desde la API
async function loadPocs() {
    const tbody = document.querySelector('tbody');
    
    try {
        // Cargar todas las POCs (sin filtro de usuario, ya que es para el manager)
        const response = await fetch('/pocs');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allPocs = await response.json();
        console.log('All POCs loaded:', allPocs);
        
        renderPocs();
    } catch (error) {
        console.error('Error loading POCs:', error);
        showNotification('Error al cargar las POCs', 'error');
        
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem;">
                    <p style="color: var(--rejected-red); margin-bottom: 1rem;">Error al cargar las POCs</p>
                    <button class="btn-approve" onclick="location.reload()">Reintentar</button>
                </td>
            </tr>
        `;
    }
}

// Renderizar POCs en la tabla
function renderPocs() {
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = '';
    
    const filteredPocs = filterPocs(allPocs);
    
    if (filteredPocs.length === 0) {
        const filterText = currentFilter === 'all' ? '' : 
                          currentFilter === 'pending' ? ' pendientes' :
                          currentFilter === 'approved' ? ' aprobadas' : ' rechazadas';
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--muted-text);">
                    No se encontraron POCs${filterText}
                </td>
            </tr>
        `;
        return;
    }
    
    filteredPocs.forEach(poc => {
        const row = createPocRow(poc);
        tbody.appendChild(row);
    });
}

// Crear fila de POC
function createPocRow(poc) {
    const tr = document.createElement('tr');
    
    // Determinar el estado basado en is_approved
    // null = pending, true = approved, false = rejected
    const statusClass = poc.is_approved === null ? 'pending' : 
                       poc.is_approved === true ? 'approved' : 'rejected';
    const statusText = poc.is_approved === null ? 'Pending' : 
                      poc.is_approved === true ? 'Accepted' : 'Rejected';
    
    // Crear celdas
    tr.innerHTML = `
        <td class="requestor-name">${poc.client_user_name || 'N/A'}</td>
        <td>${poc.company_name || 'N/A'}</td>
        <td class="business-justification">${poc.business_justification || 'N/A'}</td>
        <td>
            <span class="status-badge status-${statusClass}">${statusText}</span>
        </td>
        <td class="action-cell">
            ${createActionButtons(poc)}
        </td>
    `;
    
    return tr;
}

// Crear botones de acción según el estado
function createActionButtons(poc) {
    if (poc.is_approved === null) {
        // Pending - mostrar "In Progress" + view
        return `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                <span class="action-text" style="font-size: 0.75rem; color: var(--muted-text);">In Progress...</span>
                <button class="btn-view" onclick="showPocDetails(${poc.poc_id})" style="padding: 0.375rem 0.8rem; background-color: var(--primary-dark); color: var(--white); border: none; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 700; cursor: pointer;">View</button>
            </div>
        `;
    } else {
        // Approved o Rejected - mostrar estado y fecha en líneas separadas + view
        const completionDate = poc.completion_date ? 
            new Date(poc.completion_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : 
            'N/A';
        const actionText = poc.is_approved ? 'Accepted' : 'Rejected';
        return `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                <div style="text-align: center;">
                    <div style="font-size: 0.75rem; font-weight: 600; color: var(--dark-text);">${actionText}:</div>
                    <div style="font-size: 0.75rem; color: var(--muted-text);">${completionDate}</div>
                </div>
                <button class="btn-view" onclick="showPocDetails(${poc.poc_id})" style="padding: 0.375rem 0.8rem; background-color: var(--primary-dark); color: var(--white); border: none; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 700; cursor: pointer;">View</button>
            </div>
        `;
    }
}

// Aprobar POC
async function handleApprove(pocId) {
    if (!confirm('¿Estás seguro de aprobar esta POC?')) return;
    
    try {
        const response = await fetch(`/pocs/${pocId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                is_approved: true,
                completion_date: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error approving POC');
        }
        
        showNotification('POC aprobada exitosamente', 'success');
        await loadPocs(); // Recargar lista
    } catch (error) {
        console.error('Error approving POC:', error);
        showNotification('Error al aprobar la POC: ' + error.message, 'error');
    }
}

// Denegar POC
async function handleDeny(pocId) {
    if (!confirm('¿Estás seguro de denegar esta POC?')) return;
    
    try {
        const response = await fetch(`/pocs/${pocId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                is_approved: false,
                completion_date: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error denying POC');
        }
        
        showNotification('POC denegada', 'success');
        await loadPocs(); // Recargar lista
    } catch (error) {
        console.error('Error denying POC:', error);
        showNotification('Error al denegar la POC: ' + error.message, 'error');
    }
}

// Mostrar detalles de POC en modal
async function showPocDetails(pocId) {
    try {
        // Obtener detalles completos de la POC (ya incluye nombres con el JOIN)
        const response = await fetch(`/pocs/${pocId}`);
        
        if (!response.ok) {
            throw new Error('Error loading POC details');
        }
        
        const poc = await response.json();
        console.log('POC details loaded:', poc);
        
        // Obtener equipos asociados
        const equipmentResponse = await fetch(`/poc_equipment?poc_id=${pocId}`);
        let equipment = [];
        
        if (equipmentResponse.ok) {
            const pocEquipment = await equipmentResponse.json();
            console.log('POC Equipment relations:', pocEquipment);
            
            // Cargar detalles de cada equipo desde la tabla equipment
            if (pocEquipment.length > 0) {
                equipment = await Promise.all(
                    pocEquipment.map(async (pe) => {
                        try {
                            const eqResponse = await fetch(`/equipment/${pe.solution_id}`);
                            if (eqResponse.ok) {
                                const eqData = await eqResponse.json();
                                return {
                                    solution_id: eqData.solution_id,
                                    product_number: eqData.product_number,
                                    product_description: eqData.product_description,
                                    company_program: eqData.company_program,
                                    price: eqData.price
                                };
                            }
                        } catch (err) {
                             console.error('Error loading equipment:', err);
                        }
                        return null;
                    })
                );
                equipment = equipment.filter(e => e !== null);
            }
        }
        
        console.log('Equipment loaded:', equipment);
        
        // Crear y mostrar modal
        createPocModal(poc, equipment);
    } catch (error) {
        console.error('Error loading POC details:', error);
        showNotification('Error al cargar los detalles de la POC', 'error');
    }
}

// --- Helpers: parseo y formateo de precios ---
function parsePriceValue(price) {
    if (price === null || price === undefined) return 0;
    if (typeof price === 'number') return price;
    // quitar todo lo que no sea dígito, punto o guión
    const cleaned = String(price).replace(/[^0-9.-]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
}

function formatCurrencyUSD(value, options = { minimumFractionDigits: 2, maximumFractionDigits: 2 }) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: options.minimumFractionDigits,
        maximumFractionDigits: options.maximumFractionDigits
    }).format(value);
}

function calculateTotalValue(equipmentArray) {
    return (equipmentArray || []).reduce((sum, item) => {
        return sum + parsePriceValue(item && item.price);
    }, 0);
}

function formatTotalValue(equipmentArray) {
    const total = calculateTotalValue(equipmentArray);
    return formatCurrencyUSD(total);
}

// --- Crear modal con detalles (modificado para mostrar total) ---
function createPocModal(poc, equipment) {
    // Remover modal existente si hay uno
    const existingModal = document.getElementById('poc-modal');
    if (existingModal) existingModal.remove();
    
    const statusClass = poc.is_approved === null ? 'pending' : 
                       poc.is_approved === true ? 'approved' : 'rejected';
    const statusText = poc.is_approved === null ? 'Pending' : 
                      poc.is_approved === true ? 'Accepted' : 'Rejected';
    
    const createdDate = poc.created_date ? 
        new Date(poc.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 
        'N/A';
    
    const completionDate = poc.completion_date ? 
        new Date(poc.completion_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 
        'N/A';
    
    // Formatear cada precio individual si existe
    const equipmentHtml = (equipment.length > 0) ? `
        <ul class="equipment-list">
            ${equipment.map(item => {
                const priceNum = parsePriceValue(item && item.price);
                const priceLabel = priceNum > 0 ? ` | ${formatCurrencyUSD(priceNum)}` : '';
                return `
                    <li>
                        <div>
                            <strong>${item.product_description || item.product_number}</strong>
                            <br>
                            <small style="color: var(--muted-text);">
                                ${item.product_number || ''} 
                                ${item.company_program ? ` | ${item.company_program}` : ''}
                                ${priceLabel}
                            </small>
                        </div>
                    </li>
                `;
            }).join('')}
        </ul>
        <div style="margin-top: 1rem; display:flex; justify-content:space-between; align-items:center;">
            <div></div>
            <div class="total-badge">
                <span>Total value</span>
                <strong style="margin-left:0.5rem;">${formatTotalValue(equipment)}</strong>
            </div>
        </div>
    ` : `<p style="color: var(--muted-text);">No equipment specified</p>`;

    const modal = document.createElement('div');
    modal.id = 'poc-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closePocModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 style="color: var(--primary-dark); font-size: 1.5rem; font-weight: 700;">POC Details #${poc.poc_id}</h2>
                    <button class="modal-close" onclick="closePocModal()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="detail-group">
                        <label>Requestor Name:</label>
                        <p>${poc.client_user_name || 'N/A'}</p>
                    </div>
                    
                    <div class="detail-group">
                        <label>Client Company:</label>
                        <p>${poc.company_name || 'N/A'}</p>
                    </div>
                    
                    <div class="detail-group">
                        <label>Business Justification:</label>
                        <p>${poc.business_justification || 'N/A'}</p>
                    </div>
                    
                    <div class="detail-group">
                        <label>Status:</label>
                        <span class="status-badge status-${statusClass}">${statusText}</span>
                    </div>
                    
                    <div class="detail-group">
                        <label>Request Date:</label>
                        <p>${createdDate}</p>
                    </div>
                    
                    ${poc.completion_date ? `
                        <div class="detail-group">
                            <label>Completion Date:</label>
                            <p>${completionDate}</p>
                        </div>
                    ` : ''}
                    
                    <div class="detail-group">
                        <label>Equipment Requested:</label>
                        ${equipmentHtml}
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-cancel" onclick="closePocModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Agregar estilos del modal si no existen
    if (!document.getElementById('modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
        styles.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: 1rem;
            }
            
            .modal-content {
                background-color: white;
                border-radius: 0.75rem;
                max-width: 600px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                border-bottom: 1px solid var(--border-gray);
            }
            
            .modal-close {
                background: none;
                border: none;
                font-size: 2rem;
                color: var(--muted-text);
                cursor: pointer;
                line-height: 1;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: color 0.3s ease;
            }
            
            .modal-close:hover {
                color: var(--dark-text);
            }
            
            .modal-body {
                padding: 1.5rem;
            }
            
            .detail-group {
                margin-bottom: 1.5rem;
            }
            
            .detail-group:last-child {
                margin-bottom: 0;
            }
            
            .detail-group label {
                display: block;
                font-weight: 600;
                color: var(--primary-dark);
                margin-bottom: 0.5rem;
                font-size: 0.875rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .detail-group p {
                color: var(--dark-text);
                line-height: 1.6;
                margin: 0;
            }
            
            .equipment-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .equipment-list li {
                padding: 1rem;
                background-color: var(--light-green);
                border-radius: 0.5rem;
                margin-bottom: 0.5rem;
            }
            
            .equipment-list li:last-child {
                margin-bottom: 0;
            }

            .total-badge {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                background: linear-gradient(90deg, #edf7f2, #e6fff3);
                border: 1px solid #d1f3df;
                padding: 0.5rem 0.75rem;
                border-radius: 999px;
                color: #064e3b;
                font-weight: 700;
                font-size: 0.95rem;
            }
            
            .modal-footer {
                padding: 1.5rem;
                border-top: 1px solid var(--border-gray);
                display: flex;
                gap: 0.5rem;
                justify-content: flex-end;
            }
            
            .btn-cancel {
                padding: 0.5rem 1rem;
                background-color: var(--light-gray);
                color: var(--dark-text);
                border: none;
                border-radius: 0.5rem;
                font-size: 0.875rem;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.3s ease;
                font-family: var(--font-family);
            }
            
            .btn-cancel:hover {
                background-color: #e5e7e6;
            }
        `;
        document.head.appendChild(styles);
    }
}


// Cerrar modal
function closePocModal() {
    const modal = document.getElementById('poc-modal');
    if (modal) modal.remove();
}

// Filtrar POCs
function filterPocs(pocs) {
    const searchTerm = document.querySelector('.search-input').value.toLowerCase();
    
    let filtered = pocs;
    
    // Aplicar filtro de estado
    if (currentFilter === 'approved') {
        filtered = filtered.filter(poc => poc.is_approved === true);
    } else if (currentFilter === 'rejected') {
        filtered = filtered.filter(poc => poc.is_approved === false);
    } else if (currentFilter === 'pending') {
        filtered = filtered.filter(poc => poc.is_approved === null);
    }
    // 'all' no filtra nada
    
    // Aplicar búsqueda
    if (searchTerm) {
        filtered = filtered.filter(poc => 
            (poc.client_user_name && poc.client_user_name.toLowerCase().includes(searchTerm)) ||
            (poc.company_name && poc.company_name.toLowerCase().includes(searchTerm)) ||
            (poc.business_justification && poc.business_justification.toLowerCase().includes(searchTerm))
        );
    }
    
    return filtered;
}

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda en tiempo real
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', renderPocs);
    }
    
    // Botón de filtro
    const filterBtn = document.querySelector('.filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', showFilterMenu);
    }
}

// Mostrar menú de filtros
function showFilterMenu() {
    // Remover menú existente si ya está abierto
    const existingMenu = document.getElementById('filter-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const filterBtn = document.querySelector('.filter-btn');
    const rect = filterBtn.getBoundingClientRect();
    
    const menu = document.createElement('div');
    menu.id = 'filter-menu';
    menu.style.cssText = `
        position: fixed;
        top: ${rect.bottom + 5}px;
        left: ${rect.left - 100}px;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        padding: 0.5rem;
        z-index: 100;
        min-width: 150px;
        border: 1px solid var(--border-gray);
    `;
    
    
    filters.forEach(filter => {
        const option = document.createElement('div');
        option.style.cssText = `
            padding: 0.5rem 1rem;
            cursor: pointer;
            border-radius: 0.25rem;
            font-size: 0.875rem;
            transition: background-color 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            ${currentFilter === filter.value ? 'background-color: var(--light-green); font-weight: 600; color: var(--primary-green);' : ''}
        `;
        option.innerHTML = `<span>${filter.icon}</span><span>${filter.label}</span>`;
        
        option.addEventListener('click', () => {
            currentFilter = filter.value;
            renderPocs();
            menu.remove();
        });
        
        option.addEventListener('mouseenter', () => {
            if (currentFilter !== filter.value) {
                option.style.backgroundColor = 'var(--light-gray)';
            }
        });
        
        option.addEventListener('mouseleave', () => {
            if (currentFilter !== filter.value) {
                option.style.backgroundColor = 'transparent';
            }
        });
        
        menu.appendChild(option);
    });
    
    document.body.appendChild(menu);
    
    // Cerrar al hacer click fuera del menú
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== filterBtn) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? 'var(--primary-green)' : type === 'error' ? 'var(--rejected-red)' : 'var(--primary-dark)'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 1001;
        font-size: 0.875rem;
        font-weight: 500;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Agregar animaciones para las notificaciones
if (!document.getElementById('notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(styles);
}