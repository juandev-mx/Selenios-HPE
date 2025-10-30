// static/js/solutions_catalog.js

// Función para formatear precio
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
}

// Cargar equipos desde la API
async function loadEquipment() {
  try {
    const response = await fetch('/equipment');
    const equipment = await response.json();
    
    const tbody = document.querySelector('.solutions-section tbody');
    tbody.innerHTML = '';
    
    for (const equip of equipment) {
      // Obtener el nombre del creador
      let ownerName = 'N/A';
      if (equip.created_by) {
        const userResponse = await fetch(`/users/${equip.created_by}`);
        if (userResponse.ok) {
          const user = await userResponse.json();
          ownerName = user.name;
        }
      }
      
      // Contar items
      const itemsResponse = await fetch(`/equipment_items?solution_id=${equip.solution_id}`);
      const items = await itemsResponse.json();
      const itemCount = items.length;
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${equip.product_number || 'N/A'}</td>
        <td class="description">${equip.product_description || 'N/A'}</td>
        <td>${ownerName}</td>
        <td>${itemCount}</td>
        <td>${formatPrice(equip.price || 0)}</td>
        <td>
          <a href="#" class="view-link" onclick="loadItems(${equip.solution_id}); return false;">View items</a>
        </td>
      `;
      
      tbody.appendChild(row);
    }
  } catch (error) {
    console.error('Error cargando equipos:', error);
  }
}

// Cargar items de un equipo específico
async function loadItems(solutionId = null) {
  try {
    let url = '/equipment_items';
    if (solutionId) {
      url += `?solution_id=${solutionId}`;
    }
    
    const response = await fetch(url);
    const items = await response.json();
    
    const tbody = document.querySelector('.items-section tbody');
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
  } catch (error) {
    console.error('Error cargando items:', error);
  }
}

// Búsqueda en la tabla de solutions
function setupSolutionsSearch() {
  const searchInput = document.querySelector('.solutions-section .search-input');
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('.solutions-section tbody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  });
}

// Búsqueda en la tabla de items
function setupItemsSearch() {
  const searchInput = document.querySelector('.items-section .search-input');
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('.items-section tbody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  });
}

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', () => {
  loadEquipment();
  loadItems(); // Cargar todos los items inicialmente
  setupSolutionsSearch();
  setupItemsSearch();
});