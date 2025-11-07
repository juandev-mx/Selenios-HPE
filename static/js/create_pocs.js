
let selectedEquipment = [];
let allEquipment = [];
let allEquipmentItems = [];
let modalCreated = false;


async function loadEquipmentData() {
    try {
        const equipmentResponse = await fetch('/equipment');
        allEquipment = await equipmentResponse.json();

        const itemsResponse = await fetch('/equipment_items');
        allEquipmentItems = await itemsResponse.json();

        console.log('Equipment loaded:', allEquipment.length);
        console.log('Items loaded:', allEquipmentItems.length);
    } catch (error) {
        console.error('Error loading equipment:', error);
    }
}

function createModalStructure() {
    const modalHTML = `
        <div id="pocModal" class="modal-overlay">
            <div class="modal-container">
                <div class="modal-header">
                    <h2 class="modal-title">Create New POC</h2>
                    <button class="modal-close" onclick="closeCreatePOC()">&times;</button>
                </div>
                
                <div class="modal-body">
                                        <div class="modal-section">
                        <label class="modal-label" for="modal-justification">Business Justification</label>
                        <textarea id="modal-justification" class="modal-textarea" placeholder="Enter business justification..." rows="6"></textarea>
                    </div>

                                        <div class="modal-section">
                        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 1rem;">Select Equipment</h3>
                        <p style="color: #666; font-size: 14px; margin-bottom: 1rem;">
                            Search and select equipment solutions. The equipment items will be shown automatically.
                        </p>

                        <div class="modal-field">
                            <label class="modal-label" for="modal-equipment">Search Equipment</label>
                            <div class="modal-search">
                                <input id="modal-equipment" class="modal-input" type="text" 
                                       placeholder="Type at least 2 characters to search..."
                                       oninput="searchEquipment(this.value)" />
                                <svg class="modal-icon" viewBox="0 0 24 24">
                                    <path d="M19.6 21L13.3 14.7C12.8 15.1 12.225 15.4167 11.575 15.65C10.925 15.8833 10.2333 16 9.5 16C7.68333 16 6.14583 15.3708 4.8875 14.1125C3.62917 12.8542 3 11.3167 3 9.5C3 7.68333 3.62917 6.14583 4.8875 4.8875C6.14583 3.62917 7.68333 3 9.5 3C11.3167 3 12.8542 3.62917 14.1125 4.8875C15.3708 6.14583 16 7.68333 16 9.5C16 10.2333 15.8833 10.925 15.65 11.575C15.4167 12.225 15.1 12.8 14.7 13.3L21 19.6L19.6 21ZM9.5 14C10.75 14 11.8125 13.5625 12.6875 12.6875C13.5625 11.8125 14 10.75 14 9.5C14 8.25 13.5625 7.1875 12.6875 6.3125C11.8125 5.4375 10.75 5 9.5 5C8.25 5 7.1875 5.4375 6.3125 6.3125C5.4375 7.1875 5 8.25 5 9.5C5 10.75 5.4375 11.8125 6.3125 12.6875C7.1875 13.5625 8.25 14 9.5 14Z" fill="currentColor"/>
                                </svg>
                                <div id="equipment-dropdown" class="modal-dropdown"></div>
                            </div>
                        </div>
                    </div>

                                        <div class="modal-section">
                        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 1rem;">Selected Equipment & Items</h3>
                        <div class="modal-table-wrap">
                            <table class="modal-items-table">
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th>Product Number</th>
                                        <th style="text-align: center;">Qty</th>
                                        <th style="text-align: right;">Price</th>
                                        <th style="text-align: center;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="modal-items-tbody">
                                    <tr>
                                        <td colspan="5" style="text-align: center; color: #618975; padding: 2rem;">
                                            No equipment selected yet. Search and select equipment above.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <div style="color: #618975; font-size: 14px;">
                        <span id="items-count">0 equipment selected</span>
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

function openCreatePOC() {
    console.log('openCreatePOC called');
    
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
    
        document.getElementById('modal-justification').value = '';
    document.getElementById('modal-equipment').value = '';
    selectedEquipment = [];
    updateItemsTable();
}

function closeCreatePOC() {
    const modal = document.getElementById('pocModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('click', function(e) {
    const modal = document.getElementById('pocModal');
    if (e.target === modal) {
        closeCreatePOC();
    }
});

function searchEquipment(query) {
    const dropdown = document.getElementById('equipment-dropdown');
    
    if (!query || query.length < 2) {
        dropdown.classList.remove('active');
        return;
    }

    const filtered = allEquipment.filter(eq => 
        eq.product_description.toLowerCase().includes(query.toLowerCase()) ||
        eq.product_number.toLowerCase().includes(query.toLowerCase()) ||
        (eq.company_program && eq.company_program.toLowerCase().includes(query.toLowerCase()))
    );

    if (filtered.length > 0) {
        dropdown.innerHTML = filtered.map(eq => {
            const itemsCount = allEquipmentItems.filter(item => item.solution_id === eq.solution_id).length;
            return `
                <div class="modal-dropdown-item" onclick="addEquipment(${eq.solution_id})">
                    <strong>${eq.product_description}</strong><br>
                    <small style="color: #618975;">
                        ${eq.product_number} | $${parseFloat(eq.price).toLocaleString('en-US', {minimumFractionDigits: 2})}
                        ${itemsCount > 0 ? ` | ${itemsCount} items` : ' | No items'}
                    </small>
                </div>
            `;
        }).join('');
        dropdown.classList.add('active');
    } else {
        dropdown.innerHTML = '<div class="modal-dropdown-item" style="color: #618975;">No results found</div>';
        dropdown.classList.add('active');
    }
}

function addEquipment(equipmentId) {
    const equipment = allEquipment.find(eq => eq.solution_id === equipmentId);
    
    if (!equipment) {
        console.error('Equipment not found:', equipmentId);
        return;
    }
    
        if (selectedEquipment.find(eq => eq.solution_id === equipmentId)) {
        alert(' This equipment is already selected');
        return;
    }

        const equipmentItems = allEquipmentItems.filter(item => item.solution_id === equipmentId);

    selectedEquipment.push({
        ...equipment,
        items: equipmentItems
    });

        document.getElementById('modal-equipment').value = '';
    document.getElementById('equipment-dropdown').classList.remove('active');

    console.log('Equipment added:', equipment.product_description, 'with', equipmentItems.length, 'items');
    updateItemsTable();
}

function updateItemsTable() {
    const tbody = document.getElementById('modal-items-tbody');
    
    if (selectedEquipment.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: #618975; padding: 2rem;">
                    No equipment selected yet. Search and select equipment above.
                </td>
            </tr>
        `;
        document.getElementById('items-count').textContent = '0 equipment selected';
        return;
    }

    let html = '';
    let totalItems = 0;
    let totalPrice = 0;

        selectedEquipment.forEach(eq => {
                const equipmentPrice = parseFloat(eq.price) || 0;
        totalPrice += equipmentPrice;

                html += `
            <tr style="background: #f0f9f5; border-top: 2px solid #05AD7A;">
                <td><strong>${eq.product_description}</strong></td>
                <td><strong>${eq.product_number}</strong></td>
                <td style="text-align: center;"><strong>—</strong></td>
                <td style="text-align: right;"><strong>${equipmentPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong></td>
                <td style="text-align: center;">
                    <button class="modal-link" onclick="removeEquipment(${eq.solution_id})" style="color: #dc3545; font-weight: 600;">Remove</button>
                </td>
            </tr>
        `;

                if (eq.items && eq.items.length > 0) {
            eq.items.forEach(item => {
                const itemPrice = parseFloat(item.unit_price) || 0;
                html += `
                    <tr style="background: #fafafa;">
                        <td style="padding-left: 2rem;">↳ ${item.product_name}</td>
                        <td style="color: #666;">${item.product_number}</td>
                        <td style="text-align: center; color: #666;">${item.qty}</td>
                        <td style="text-align: right; color: #666;">${itemPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                        <td></td>
                    </tr>
                `;
                totalItems++;
            });
        } else {
            html += `
                <tr style="background: #fafafa;">
                    <td colspan="5" style="padding-left: 2rem; color: #999; font-style: italic;">
                        No items associated with this equipment
                    </td>
                </tr>
            `;
        }
    });

        html += `
        <tr style="background: #e8f5e9; border-top: 2px solid #05AD7A; font-weight: 700;">
            <td colspan="3" style="text-align: right; padding-right: 1rem;">TOTAL:</td>
            <td style="text-align: right; font-size: 18px; color: #05AD7A;">${totalPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
            <td></td>
        </tr>
    `;

    tbody.innerHTML = html;
    
    const equipmentCount = selectedEquipment.length;
    document.getElementById('items-count').textContent = 
        `${equipmentCount} equipment selected (${totalItems} total items)`;
}

function removeEquipment(equipmentId) {
    const equipment = selectedEquipment.find(eq => eq.solution_id === equipmentId);
    
    if (equipment) {
        const itemCount = equipment.items ? equipment.items.length : 0;
        if (!confirm(`Remove "${equipment.product_description}"?\n\nThis will also remove ${itemCount} associated item${itemCount !== 1 ? 's' : ''}.`)) {
            return;
        }
    }
    
    selectedEquipment = selectedEquipment.filter(eq => eq.solution_id !== equipmentId);
    updateItemsTable();
}

async function submitPOC() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user) {
        alert('❌ User not logged in');
        return;
    }

    const justification = document.getElementById('modal-justification').value.trim();

    if (!justification) {
        alert(' Please enter a business justification');
        return;
    }

    if (selectedEquipment.length === 0) {
        alert(' Please select at least one equipment');
        return;
    }

    const submitBtn = document.querySelector('.modal-btn-primary');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    try {
        const pocData = {
            client_user_id: user.id,
            business_justification: justification,
            created_date: new Date().toISOString().split('T')[0]
        };
        
        console.log('Sending POC data:', pocData);
        
        const pocResponse = await fetch('/pocs', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(pocData)
        });

        const contentType = pocResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await pocResponse.text();
            console.error('Received non-JSON response:', text);
            throw new Error('Server error. Please check the console.');
        }

        const pocResponseData = await pocResponse.json();
        console.log('POC Response:', pocResponseData);

        if (!pocResponse.ok) {
            throw new Error(pocResponseData.error || 'Error creating POC');
        }

        const pocId = pocResponseData.created[0].poc_id;
        console.log('POC created with ID:', pocId);

                const equipmentData = selectedEquipment.map(eq => ({
            poc_id: pocId,
            solution_id: eq.solution_id
        }));
        
        console.log('Adding equipment to POC:', equipmentData);
        
        const equipResponse = await fetch('/poc_equipment', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(equipmentData)
        });
        
        if (!equipResponse.ok) {
            throw new Error('Error adding equipment to POC');
        }
        
        const equipResponseData = await equipResponse.json();
        console.log('Equipment added:', equipResponseData);

        alert(' POC created successfully!');
        closeCreatePOC();
        window.location.reload();

    } catch (error) {
        console.error('Error creating POC:', error);
        alert('❌ Error creating POC: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create POC';
    }
}

function openViewPOCs() {
    window.location.href = '/pocs_clientes.html';
}



document.addEventListener('click', function(e) {
    if (!e.target.closest('.modal-search')) {
        const dropdowns = document.querySelectorAll('.modal-dropdown');
        dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
    }
});

window.openCreatePOC = openCreatePOC;
window.closeCreatePOC = closeCreatePOC;
window.openViewPOCs = openViewPOCs;
window.loadEquipmentData = loadEquipmentData;

if (!document.getElementById('pocs-container')) {
        document.addEventListener('DOMContentLoaded', function() {
        console.log('create_pocs.js loaded (home)');
        loadEquipmentData();
    });
}