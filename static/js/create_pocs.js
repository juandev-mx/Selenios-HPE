// pocs.js - Sistema de gestión de POCs con modales

// Variables globales
let selectedEquipment = [];
let selectedItems = [];
let allEquipment = [];
let allEquipmentItems = [];
let modalCreated = false;

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('POCs.js loaded');
    loadEquipmentData();
});

// Crear estructura del modal
function createModalStructure() {
    const modalHTML = `
        <div id="pocModal" class="modal-overlay">
            <div class="modal-container">
                <div class="modal-header">
                    <h2 class="modal-title">Create New POC</h2>
                    <button class="modal-close" onclick="closeCreatePOC()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <!-- Business Justification -->
                    <div class="modal-section">
                        <label class="modal-label" for="modal-justification">Business Justification</label>
                        <textarea id="modal-justification" class="modal-textarea" placeholder="Enter business justification..." rows="6"></textarea>
                    </div>

                    <!-- Solutions Selection -->
                    <div class="modal-section">
                        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 1rem;">Solutions Selection</h3>

                        <div class="modal-grid">
                            <div class="modal-field">
                                <label class="modal-label" for="modal-equipment">Equipment</label>
                                <div class="modal-search">
                                    <input id="modal-equipment" class="modal-input" type="text" 
                                           placeholder="Search and select equipment"
                                           oninput="searchEquipment(this.value)" />
                                    <svg class="modal-icon" viewBox="0 0 24 24">
                                        <path d="M19.6 21L13.3 14.7C12.8 15.1 12.225 15.4167 11.575 15.65C10.925 15.8833 10.2333 16 9.5 16C7.68333 16 6.14583 15.3708 4.8875 14.1125C3.62917 12.8542 3 11.3167 3 9.5C3 7.68333 3.62917 6.14583 4.8875 4.8875C6.14583 3.62917 7.68333 3 9.5 3C11.3167 3 12.8542 3.62917 14.1125 4.8875C15.3708 6.14583 16 7.68333 16 9.5C16 10.2333 15.8833 10.925 15.65 11.575C15.4167 12.225 15.1 12.8 14.7 13.3L21 19.6L19.6 21ZM9.5 14C10.75 14 11.8125 13.5625 12.6875 12.6875C13.5625 11.8125 14 10.75 14 9.5C14 8.25 13.5625 7.1875 12.6875 6.3125C11.8125 5.4375 10.75 5 9.5 5C8.25 5 7.1875 5.4375 6.3125 6.3125C5.4375 7.1875 5 8.25 5 9.5C5 10.75 5.4375 11.8125 6.3125 12.6875C7.1875 13.5625 8.25 14 9.5 14Z" fill="currentColor"/>
                                    </svg>
                                    <div id="equipment-dropdown" class="modal-dropdown"></div>
                                </div>
                            </div>

                            <div class="modal-field">
                                <label class="modal-label" for="modal-items">Equipment Items</label>
                                <div class="modal-search">
                                    <input id="modal-items" class="modal-input" type="text" 
                                           placeholder="Search and select items"
                                           oninput="searchEquipmentItems(this.value)" />
                                    <svg class="modal-icon" viewBox="0 0 24 24">
                                        <path d="M19.6 21L13.3 14.7C12.8 15.1 12.225 15.4167 11.575 15.65C10.925 15.8833 10.2333 16 9.5 16C7.68333 16 6.14583 15.3708 4.8875 14.1125C3.62917 12.8542 3 11.3167 3 9.5C3 7.68333 3.62917 6.14583 4.8875 4.8875C6.14583 3.62917 7.68333 3 9.5 3C11.3167 3 12.8542 3.62917 14.1125 4.8875C15.3708 6.14583 16 7.68333 16 9.5C16 10.2333 15.8833 10.925 15.65 11.575C15.4167 12.225 15.1 12.8 14.7 13.3L21 19.6L19.6 21ZM9.5 14C10.75 14 11.8125 13.5625 12.6875 12.6875C13.5625 11.8125 14 10.75 14 9.5C14 8.25 13.5625 7.1875 12.6875 6.3125C11.8125 5.4375 10.75 5 9.5 5C8.25 5 7.1875 5.4375 6.3125 6.3125C5.4375 7.1875 5 8.25 5 9.5C5 10.75 5.4375 11.8125 6.3125 12.6875C7.1875 13.5625 8.25 14 9.5 14Z" fill="currentColor"/>
                                    </svg>
                                    <div id="items-dropdown" class="modal-dropdown"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Items Table -->
                    <div class="modal-table-wrap">
                        <table class="modal-items-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Item Name</th>
                                    <th>Quantity</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="modal-items-tbody">
                                <tr>
                                    <td colspan="4" style="text-align: center; color: #618975; padding: 2rem;">
                                        No items added yet. Search and select equipment or items above.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="modal-footer">
                    <div style="color: #618975; font-size: 14px;">
                        <span id="items-count">0 items selected</span>
                    </div>
                    <div class="modal-footer-actions">
                        <button class="modal-btn-cancel" onclick="closeCreatePOC()">Cancel</button>
                        <button class="modal-btn-primary" onclick="submitPOC()">Create POC</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Abrir modal de crear POC
function openCreatePOC() {
    console.log('openCreatePOC called');
    
    // Crear modal si no existe
    if (!modalCreated) {
        createModalStructure();
        modalCreated = true;
    }
    
    const modal = document.getElementById('pocModal');
    if (!modal) {
        console.error('Modal not found!');
        return;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Resetear formulario
    document.getElementById('modal-justification').value = '';
    document.getElementById('modal-equipment').value = '';
    document.getElementById('modal-items').value = '';
    selectedEquipment = [];
    selectedItems = [];
    updateItemsTable();
}

// Cerrar modal
function closeCreatePOC() {
    const modal = document.getElementById('pocModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function(e) {
    const modal = document.getElementById('pocModal');
    if (e.target === modal) {
        closeCreatePOC();
    }
});

// Cargar datos de equipos
async function loadEquipmentData() {
    try {
        // Cargar Equipment
        const equipmentResponse = await fetch('/equipment');
        allEquipment = await equipmentResponse.json();

        // Cargar Equipment Items
        const itemsResponse = await fetch('/equipment_items');
        allEquipmentItems = await itemsResponse.json();

        console.log('Equipment loaded:', allEquipment.length);
        console.log('Items loaded:', allEquipmentItems.length);
    } catch (error) {
        console.error('Error loading equipment:', error);
    }
}

// Buscar equipos
function searchEquipment(query) {
    const dropdown = document.getElementById('equipment-dropdown');
    
    if (!query || query.length < 2) {
        dropdown.classList.remove('active');
        return;
    }

    const filtered = allEquipment.filter(eq => 
        eq.product_description.toLowerCase().includes(query.toLowerCase()) ||
        eq.product_number.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length > 0) {
        dropdown.innerHTML = filtered.map(eq => `
            <div class="modal-dropdown-item" onclick="addEquipment(${eq.solution_id})">
                <strong>${eq.product_description}</strong><br>
                <small style="color: #618975;">${eq.product_number} - $${eq.price}</small>
            </div>
        `).join('');
        dropdown.classList.add('active');
    } else {
        dropdown.innerHTML = '<div class="modal-dropdown-item" style="color: #618975;">No results found</div>';
        dropdown.classList.add('active');
    }
}

// Buscar items de equipos
function searchEquipmentItems(query) {
    const dropdown = document.getElementById('items-dropdown');
    
    if (!query || query.length < 2) {
        dropdown.classList.remove('active');
        return;
    }

    const filtered = allEquipmentItems.filter(item => 
        item.product_name.toLowerCase().includes(query.toLowerCase()) ||
        item.product_number.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length > 0) {
        dropdown.innerHTML = filtered.map(item => `
            <div class="modal-dropdown-item" onclick="addEquipmentItem(${item.item_id})">
                <strong>${item.product_name}</strong><br>
                <small style="color: #618975;">${item.product_number} - Qty: ${item.qty} - $${item.unit_price}</small>
            </div>
        `).join('');
        dropdown.classList.add('active');
    } else {
        dropdown.innerHTML = '<div class="modal-dropdown-item" style="color: #618975;">No results found</div>';
        dropdown.classList.add('active');
    }
}

// Agregar equipo
function addEquipment(equipmentId) {
    const equipment = allEquipment.find(eq => eq.solution_id === equipmentId);
    
    if (!equipment) return;
    
    // Verificar si ya está agregado
    if (selectedEquipment.find(eq => eq.solution_id === equipmentId)) {
        alert('This equipment is already added');
        return;
    }

    selectedEquipment.push({
        ...equipment,
        quantity: 1
    });

    // Limpiar búsqueda
    document.getElementById('modal-equipment').value = '';
    document.getElementById('equipment-dropdown').classList.remove('active');

    updateItemsTable();
}

// Agregar item de equipo
function addEquipmentItem(itemId) {
    const item = allEquipmentItems.find(i => i.item_id === itemId);
    
    if (!item) return;
    
    // Verificar si ya está agregado
    if (selectedItems.find(i => i.item_id === itemId)) {
        alert('This item is already added');
        return;
    }

    selectedItems.push({
        ...item,
        quantity: item.qty
    });

    // Limpiar búsqueda
    document.getElementById('modal-items').value = '';
    document.getElementById('items-dropdown').classList.remove('active');

    updateItemsTable();
}

// Actualizar tabla de items
function updateItemsTable() {
    const tbody = document.getElementById('modal-items-tbody');
    
    if (selectedEquipment.length === 0 && selectedItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: #618975; padding: 2rem;">
                    No items added yet. Search and select equipment or items above.
                </td>
            </tr>
        `;
        document.getElementById('items-count').textContent = '0 items selected';
        return;
    }

    let html = '';

    // Agregar equipos
    selectedEquipment.forEach(eq => {
        html += `
            <tr>
                <td>Equipment</td>
                <td class="modal-muted">${eq.product_description}</td>
                <td class="modal-muted">
                    <input type="number" value="${eq.quantity}" min="1" 
                           style="width: 60px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;"
                           onchange="updateEquipmentQuantity(${eq.solution_id}, this.value)">
                </td>
                <td>
                    <button class="modal-link" onclick="removeEquipment(${eq.solution_id})">Remove</button>
                </td>
            </tr>
        `;
    });

    // Agregar items
    selectedItems.forEach(item => {
        html += `
            <tr>
                <td>Equipment Item</td>
                <td class="modal-muted">${item.product_name}</td>
                <td class="modal-muted">
                    <input type="number" value="${item.quantity}" min="1" 
                           style="width: 60px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;"
                           onchange="updateItemQuantity(${item.item_id}, this.value)">
                </td>
                <td>
                    <button class="modal-link" onclick="removeItem(${item.item_id})">Remove</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    
    const totalItems = selectedEquipment.length + selectedItems.length;
    document.getElementById('items-count').textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''} selected`;
}

// Actualizar cantidad de equipo
function updateEquipmentQuantity(equipmentId, quantity) {
    const equipment = selectedEquipment.find(eq => eq.solution_id === equipmentId);
    if (equipment) {
        equipment.quantity = parseInt(quantity) || 1;
    }
}

// Actualizar cantidad de item
function updateItemQuantity(itemId, quantity) {
    const item = selectedItems.find(i => i.item_id === itemId);
    if (item) {
        item.quantity = parseInt(quantity) || 1;
    }
}

// Remover equipo
function removeEquipment(equipmentId) {
    selectedEquipment = selectedEquipment.filter(eq => eq.solution_id !== equipmentId);
    updateItemsTable();
}

// Remover item
function removeItem(itemId) {
    selectedItems = selectedItems.filter(i => i.item_id !== itemId);
    updateItemsTable();
}

// Enviar POC
async function submitPOC() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user) {
        alert('User not logged in');
        return;
    }

    const justification = document.getElementById('modal-justification').value.trim();

    if (!justification) {
        alert('Please enter a business justification');
        return;
    }

    if (selectedEquipment.length === 0 && selectedItems.length === 0) {
        alert('Please add at least one equipment or item');
        return;
    }

    const submitBtn = document.querySelector('.modal-btn-primary');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    try {
        const pocData = {
            client_user_id: user.id,
            business_justification: justification,
            // ✅ NO incluir is_approved - se usará el default del modelo (None)
            created_date: new Date().toISOString().split('T')[0] // Solo la fecha en formato YYYY-MM-DD
        };
        
        console.log('Sending POC data:', pocData);
        
        // Crear POC
        const pocResponse = await fetch('/pocs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pocData)
        });

        console.log('Response status:', pocResponse.status);
        console.log('Response headers:', pocResponse.headers);
        
        // Verificar el tipo de contenido
        const contentType = pocResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await pocResponse.text();
            console.error('Received non-JSON response:', text);
            throw new Error('Server returned HTML instead of JSON. Check your Flask routes.');
        }

        const pocResponseData = await pocResponse.json();
        console.log('POC Response:', pocResponseData);

        if (!pocResponse.ok) {
            throw new Error(pocResponseData.error || 'Error creating POC');
        }

        const pocId = pocResponseData.created[0].poc_id;
        console.log('POC created with ID:', pocId);

        // Agregar equipos al POC
        if (selectedEquipment.length > 0) {
            const equipmentData = selectedEquipment.map(eq => ({
                poc_id: pocId,
                solution_id: eq.solution_id
            }));
            
            console.log('Adding equipment to POC:', equipmentData);
            
            const equipResponse = await fetch('/poc_equipment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(equipmentData)
            });
            
            const equipResponseData = await equipResponse.json();
            console.log('Equipment added:', equipResponseData);
        }

        alert('POC created successfully!');
        closeCreatePOC();
        
        // Recargar página o actualizar dashboard
        window.location.reload();

    } catch (error) {
        console.error('Error creating POC:', error);
        alert('Error creating POC: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create POC';
    }
}

// Función para abrir modal de ver POCs
function openViewPOCs() {
    // Redirigir a la página de POCs del usuario
    window.location.href = '/pocs_clientes.html';
}

// Cerrar dropdowns al hacer clic fuera
document.addEventListener('click', function(e) {
    if (!e.target.closest('.modal-search')) {
        const dropdowns = document.querySelectorAll('.modal-dropdown');
        dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
    }
});