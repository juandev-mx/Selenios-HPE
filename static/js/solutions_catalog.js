function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
}

async function loadEquipment() {
  try {
    const tbody = document.querySelector('.solutions-section tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';
    
    const [equipmentResponse, usersResponse, itemsResponse] = await Promise.all([
      fetch('/equipment'),
      fetch('/users'),
      fetch('/equipment_items')
    ]);
    
    const equipment = await equipmentResponse.json();
    const users = await usersResponse.json();
    const allItems = await itemsResponse.json();
    
    const usersMap = {};
    users.forEach(user => {
      usersMap[user.id] = user.name;
    });
    
    const itemsCountMap = {};
    allItems.forEach(item => {
      if (!itemsCountMap[item.solution_id]) {
        itemsCountMap[item.solution_id] = 0;
      }
      itemsCountMap[item.solution_id]++;
    });
    
    tbody.innerHTML = '';
    
    if (equipment.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No equipment found</td></tr>';
      return;
    }
    
    equipment.forEach(equip => {
      const ownerName = usersMap[equip.created_by] || 'N/A';
      const itemCount = itemsCountMap[equip.solution_id] || 0;
      
      const row = document.createElement('tr');
      row.dataset.solutionId = equip.solution_id;
      row.innerHTML = `
        <td>${equip.product_number || 'N/A'}</td>
        <td class="description">${equip.product_description || 'N/A'}</td>
        <td>${ownerName}</td>
        <td>${itemCount}</td>
        <td>${formatPrice(equip.price || 0)}</td>
        <td>
          <span class="view-link">View items</span>
        </td>
      `;
      tbody.appendChild(row);
    });
    
    setupRowClickHandlers();
    
  } catch (error) {
    console.error('Error cargando equipos:', error);
    const tbody = document.querySelector('.solutions-section tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Error loading equipment</td></tr>';
  }
}

function setupRowClickHandlers() {
  const tbody = document.querySelector('.solutions-section tbody');
  
  tbody.addEventListener('click', function(e) {
    const row = e.target.closest('tr');
    
    if (!row || !row.dataset.solutionId) return;
    
    document.querySelectorAll('.solutions-section tbody tr').forEach(r => {
      r.classList.remove('selected');
    });
    
    row.classList.add('selected');
    
    const solutionId = parseInt(row.dataset.solutionId);
    loadItems(solutionId);
  });
}

async function loadItems(solutionId = null) {
  try {
    const tbody = document.querySelector('.items-section tbody');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading items...</td></tr>';
    
    let url = '/equipment_items';
    if (solutionId) {
      url += `?solution_id=${solutionId}`;
    }
    
    const response = await fetch(url);
    const items = await response.json();
    
    if (solutionId) {
      try {
        const equipResponse = await fetch(`/equipment/${solutionId}`);
        if (equipResponse.ok) {
          const equipment = await equipResponse.json();
          const itemsTitle = document.querySelector('.items-section h2');
          if (itemsTitle) {
            itemsTitle.textContent = `Items (${equipment.product_number || 'N/A'})`;
          }
        }
      } catch (error) {
        console.error('Error loading equipment details:', error);
      }
    }
    
    tbody.innerHTML = '';
    
    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No items found</td></tr>';
      return;
    }
    
    items.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.product_number || 'N/A'}</td>
        <td class="description">${item.product_name || 'N/A'}</td>
        <td>${formatPrice(item.unit_price || 0)}</td>
      `;
      tbody.appendChild(row);
    });
    
    document.querySelector('.items-section').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
    
  } catch (error) {
    console.error('Error cargando items:', error);
    const tbody = document.querySelector('.items-section tbody');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: red;">Error loading items</td></tr>';
  }
}

function setupSolutionsSearch() {
  const searchInput = document.querySelector('.solutions-section .search-input');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('.solutions-section tbody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  });
}

function setupItemsSearch() {
  const searchInput = document.querySelector('.items-section .search-input');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('.items-section tbody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = JSON.parse(sessionStorage.getItem('user'));

  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  // Cargar equipos y configurar búsquedas
  loadEquipment();
  setupSolutionsSearch();
  setupItemsSearch();
  
  // Mensaje inicial en la sección de items
  const itemsTbody = document.querySelector('.items-section tbody');
  if (itemsTbody) {
    itemsTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: #666; padding: 2rem;">Select an equipment to view its items</td></tr>';
  }
});