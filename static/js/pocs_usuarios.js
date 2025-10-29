// pocs_usuarios.js - Gestión de POCs del usuario

let userPOCs = [];
let currentUser = null;

// Hacer funciones globales para que puedan ser llamadas desde HTML
window.editPOC = editPOC;
window.deletePOC = deletePOC;
window.viewPOCDetails = viewPOCDetails;
window.filterPOCs = filterPOCs;
window.closeEditModal = closeEditModal;
window.saveEditedPOC = saveEditedPOC;
window.addEquipmentToPOC = addEquipmentToPOC;
window.removeEquipmentFromPOC = removeEquipmentFromPOC;
window.searchEquipmentForEdit = searchEquipmentForEdit;

document.addEventListener('DOMContentLoaded', function() {
    console.log('pocs_usuarios.js loaded');
    
    // Verificar autenticación
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
    loadUserPOCs();
});

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

// Mostrar POCs en la interfaz
function displayPOCs(pocs) {
    const container = document.getElementById('pocs-container');
    
    if (pocs.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #618975;">No POCs match your filters.</p>';
        return;
    }

    container.innerHTML = pocs.map(poc => {
        const status = poc.is_approved ? 'approved' : 'pending';
        const statusLabel = poc.is_approved ? 'Approved' : 'Pending Approval';
        const statusClass = poc.is_approved ? 'status-approved' : 'status-pending';
        const createdDate = new Date(poc.created_date).toLocaleDateString();
        
        return `
            <div class="poc-card" data-status="${status}">
                <div class="poc-header">
                    <h3>POC #${poc.poc_id}</h3>
                    <span class="poc-status ${statusClass}">${statusLabel}</span>
                </div>
                
                <div class="poc-body">
                    <div class="poc-info">
                        <strong>Business Justification:</strong>
                        <p>${poc.business_justification}</p>
                    </div>
                    
                    <div class="poc-meta">
                        <div class="poc-date">
                            <span>📅 Created:</span>
                            <span>${createdDate}</span>
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

// Ver detalles de un POC
async function viewPOCDetails(pocId) {
    try {
        // Obtener detalles del POC
        const pocResponse = await fetch(`/pocs/${pocId}`);
        const poc = await pocResponse.json();
        
        // Obtener equipos asociados
        const equipmentResponse = await fetch(`/poc_equipment?poc_id=${pocId}`);
        const equipment = await equipmentResponse.json();
        
        console.log('POC Details:', poc);
        console.log('POC Equipment:', equipment);
        
        // Aquí puedes crear un modal con los detalles
        alert(`POC Details:\n\nID: ${poc.poc_id}\nStatus: ${poc.is_approved ? 'Approved' : 'Pending'}\nJustification: ${poc.business_justification}\nEquipment Items: ${equipment.length}`);
        
    } catch (error) {
        console.error('Error loading POC details:', error);
        alert('Error loading POC details');
    }
}

// Eliminar POC
async function deletePOC(pocId) {
    if (!confirm('Are you sure you want to delete this POC?')) {
        return;
    }
    
    try {
        const response = await fetch(`/pocs/${pocId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('POC deleted successfully');
            loadUserPOCs(); // Recargar lista
        } else {
            throw new Error('Error deleting POC');
        }
        
    } catch (error) {
        console.error('Error deleting POC:', error);
        alert('Error deleting POC: ' + error.message);
    }
}

// Editar POC
async function editPOC(pocId) {
    console.log('editPOC called with ID:', pocId);
    
    try {
        console.log('Fetching POC data...');
        // Obtener datos del POC
        const pocResponse = await fetch(`/pocs/${pocId}`);
        console.log('POC Response status:', pocResponse.status);
        
        if (!pocResponse.ok) {
            throw new Error(`HTTP error! status: ${pocResponse.status}`);
        }
        
        const poc = await pocResponse.json();
        console.log('POC data loaded:', poc);
        
        // Obtener equipos asociados
        console.log('Fetching POC equipment...');
        const equipmentResponse = await fetch(`/poc_equipment?poc_id=${pocId}`);
        console.log('Equipment Response status:', equipmentResponse.status);
        
        if (!equipmentResponse.ok) {
            throw new Error(`HTTP error! status: ${equipmentResponse.status}`);
        }
        
        const pocEquipment = await equipmentResponse.json();
        console.log('POC Equipment loaded:', pocEquipment);
        
        // Abrir modal de edición
        openEditModal(poc, pocEquipment);
        
    } catch (error) {
        console.error('Error loading POC for edit:', error);
        alert('Error loading POC data: ' + error.message);
    }
}

// Abrir modal de edición
function openEditModal(poc, pocEquipment) {
    console.log('openEditModal called');
    console.log('POC:', poc);
    console.log('Equipment:', pocEquipment);
    
    // Crear modal si no existe
    if (!document.getElementById('editPOCModal')) {
        console.log('Creating edit modal...');
        createEditModal();
    } else {
        console.log('Edit modal already exists');
    }
    
    // Verificar que los elementos existan
    const pocIdInput = document.getElementById('edit-poc-id');
    const justificationTextarea = document.getElementById('edit-justification');
    
    if (!pocIdInput || !justificationTextarea) {
        console.error('Modal elements not found!');
        alert('Error: Modal elements not found. Please refresh the page.');
        return;
    }
    
    // Cargar datos en el modal
    pocIdInput.value = poc.poc_id;
    justificationTextarea.value = poc.business_justification;
    
    console.log('Data loaded into modal');
    
    // Cargar equipos asociados
    loadPOCEquipment(poc.poc_id, pocEquipment);
    
    // Mostrar modal
    const modal = document.getElementById('editPOCModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    console.log('Modal opened');
}

// Crear estructura del modal de edición
function createEditModal() {
    const modalHTML = `
        <div id="editPOCModal" class="modal-overlay">
            <div class="modal-container">
                <div class="modal-header">
                    <h2 class="modal-title">Edit POC</h2>
                    <button class="modal-close" onclick="closeEditModal()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <input type="hidden" id="edit-poc-id">
                    
                    <!-- Business Justification -->
                    <div class="modal-section">
                        <label class="modal-label" for="edit-justification">Business Justification</label>
                        <textarea id="edit-justification" class="modal-textarea" placeholder="Enter business justification..." rows="6"></textarea>
                    </div>

                    <!-- Current Equipment -->
                    <div class="modal-section">
                        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 1rem;">Current Equipment</h3>
                        <div id="current-equipment-list"></div>
                    </div>

                    <!-- Add New Equipment -->
                    <div class="modal-section">
                        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 1rem;">Add More Equipment</h3>

                        <div class="modal-grid">
                            <div class="modal-field">
                                <label class="modal-label" for="edit-modal-equipment">Equipment</label>
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
        container.innerHTML = '<p style="color: #618975;">No equipment added yet.</p>';
        countSpan.textContent = '0 items';
        return;
    }

    try {
        // Cargar detalles de cada equipo
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
                            <small>${eq.product_number} - ${eq.price}</small>
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

// Buscar equipos para agregar en edición
function searchEquipmentForEdit(query) {
    // Reutilizar la función de búsqueda original
    const dropdown = document.getElementById('edit-equipment-dropdown');
    
    if (!query || query.length < 2) {
        dropdown.classList.remove('active');
        return;
    }

    // Obtener equipos globales (asumiendo que ya fueron cargados)
    if (typeof allEquipment === 'undefined' || allEquipment.length === 0) {
        dropdown.innerHTML = '<div class="modal-dropdown-item" style="color: #618975;">Loading equipment...</div>';
        dropdown.classList.add('active');
        return;
    }

    const filtered = allEquipment.filter(eq => 
        eq.product_description.toLowerCase().includes(query.toLowerCase()) ||
        eq.product_number.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length > 0) {
        dropdown.innerHTML = filtered.map(eq => `
            <div class="modal-dropdown-item" onclick="addEquipmentToPOC(${eq.solution_id})">
                <strong>${eq.product_description}</strong><br>
                <small style="color: #618975;">${eq.product_number} - ${eq.price}</small>
            </div>
        `).join('');
        dropdown.classList.add('active');
    } else {
        dropdown.innerHTML = '<div class="modal-dropdown-item" style="color: #618975;">No results found</div>';
        dropdown.classList.add('active');
    }
}

// Agregar equipo al POC en edición
async function addEquipmentToPOC(equipmentId) {
    const pocId = document.getElementById('edit-poc-id').value;
    
    try {
        const response = await fetch('/poc_equipment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([{
                poc_id: parseInt(pocId),
                solution_id: equipmentId
            }])
        });

        if (response.ok) {
            // Recargar lista de equipos
            const equipmentResponse = await fetch(`/poc_equipment?poc_id=${pocId}`);
            const pocEquipment = await equipmentResponse.json();
            loadPOCEquipment(pocId, pocEquipment);
            
            // Limpiar búsqueda
            document.getElementById('edit-modal-equipment').value = '';
            document.getElementById('edit-equipment-dropdown').classList.remove('active');
            
            alert('Equipment added successfully!');
        } else {
            throw new Error('Error adding equipment');
        }
    } catch (error) {
        console.error('Error adding equipment:', error);
        alert('Error adding equipment: ' + error.message);
    }
}

// Remover equipo del POC
async function removeEquipmentFromPOC(pocId, solutionId) {
    if (!confirm('Remove this equipment from the POC?')) {
        return;
    }
    
    try {
        const response = await fetch(`/poc_equipment/${pocId}/${solutionId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // Recargar lista de equipos
            const equipmentResponse = await fetch(`/poc_equipment?poc_id=${pocId}`);
            const pocEquipment = await equipmentResponse.json();
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

// Guardar cambios del POC editado
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                business_justification: justification
            })
        });

        if (response.ok) {
            alert('POC updated successfully!');
            closeEditModal();
            loadUserPOCs(); // Recargar lista
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