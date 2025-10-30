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
    const tbody = document.querySelector('.solutions-section tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';
    
    const response = await fetch('/equipment');
    const equipment = await response.json();
    
    // Crear un array de promesas para cargar todos los datos en paralelo
    const equipmentPromises = equipment.map(async (equip) => {
      // Obtener el nombre del creador
      let ownerName = 'N/A';
      if (equip.created_by) {
        try {
          const userResponse = await fetch(`/users/${equip.created_by}`);
          if (userResponse.ok) {
            const user = await userResponse.json();
            ownerName = user.name;
          }
        } catch (error) {
          console.error('Error obteniendo usuario:', error);
        }
      }
      
      // Contar items
      let itemCount = 0;
      try {
        const itemsResponse = await fetch(`/equipment_items?solution_id=${equip.solution_id}`);
        const items = await itemsResponse.json();
        itemCount = items.length;
      } catch (error) {
        console.error('Error obteniendo items:', error);
      }
      
      return {
        solution_id: equip.solution_id,
        product_number: equip.product_number || 'N/A',
        product_description: equip.product_description || 'N/A',
        owner: ownerName,
        itemCount: itemCount,
        price: equip.price || 0
      };
    });
    
    // Esperar a que todas las promesas se resuelvan
    const equipmentData = await Promise.all(equipmentPromises);
    
    // Limpiar y mostrar todos los datos de una vez
    tbody.innerHTML = '';
    
    if (equipmentData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No equipment found</td></tr>';
      return;
    }
    
    equipmentData.forEach(equip => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${equip.product_number}</td>
        <td class="description">${equip.product_description}</td>
        <td>${equip.owner}</td>
        <td>${equip.itemCount}</td>
        <td>${formatPrice(equip.price)}</td>
        <td>
          <a href="#" class="view-link" onclick="loadItems(${equip.solution_id}); return false;">View items</a>
        </td>
      `;
      tbody.appendChild(row);
    });
    
  } catch (error) {
    console.error('Error cargando equipos:', error);
    const tbody = document.querySelector('.solutions-section tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Error loading equipment</td></tr>';
  }
}

// Cargar items de un equipo específico
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
    
    // Limpiar la tabla
    tbody.innerHTML = '';
    
    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No items found</td></tr>';
      return;
    }
    
    // Mostrar todos los items de una vez
    items.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.product_number || 'N/A'}</td>
        <td class="description">${item.product_name || 'N/A'}</td>
        <td>${formatPrice(item.unit_price || 0)}</td>
      `;
      tbody.appendChild(row);
    });
    
    // Scroll al contenedor de items para que el usuario vea los resultados
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

// Búsqueda en la tabla de solutions
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

// Búsqueda en la tabla de items
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

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', () => {
  loadEquipment();
  loadItems(); // Cargar todos los items inicialmente
  setupSolutionsSearch();
  setupItemsSearch();
});