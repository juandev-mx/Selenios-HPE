// static/js/solutions_catalog.js

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(sessionStorage.getItem('user'));

  // Si no hay usuario logueado, ir al login
  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  // ----- REDIRECCIÓN Y TEXTO DEL DASHBOARD -----
  const dashboardLink = document.querySelector('.nav-link.dashboard-link');
  if (dashboardLink) {
    dashboardLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (user.role === 'CLIENT') {
        window.location.href = '/home_cliente.html';
      } else if (user.role === 'HPE_REP' || user.role === 'HPE_MANAGER') {
        window.location.href = '/home_hpe.html';
      } else {
        alert('Rol no permitido');
      }
    });
  }

  // ----- REDIRECCIÓN Y TEXTO DEL POCs -----
  const pocsLink = document.querySelector('.nav-link.pocs-link');
  if (pocsLink) {
    if (user.role === 'CLIENT') {
      pocsLink.textContent = 'My POCs';
      pocsLink.href = '/pocs_clientes.html';
    } else if (user.role === 'HPE_REP' || user.role === 'HPE_MANAGER') {
      pocsLink.textContent = 'Approvals';
      pocsLink.href = '/PocsHPEManager.html';
    }

    pocsLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = pocsLink.href;
    });
  }

  // ----- REDIRECCIÓN Y TEXTO DEL CATALOG -----
  const catalogLink = document.querySelector('.nav-link.catalog-link');
  if (catalogLink) {
    if (user.role === 'CLIENT') {
      catalogLink.textContent = 'Solutions Catalog';
      catalogLink.href = '/solutions_catalog.html';
    } else if (user.role === 'HPE_REP' || user.role === 'HPE_MANAGER') {
      catalogLink.textContent = 'Equipments';
      catalogLink.href = '/solutions_catalog.html';
    }

    catalogLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = catalogLink.href;
    });
  }

  // ---------- Funciones de catálogo (lo que ya tenías) ----------

  function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  async function loadEquipment() {
    try {
      const response = await fetch('/equipment');
      const equipment = await response.json();
      const tbody = document.querySelector('.solutions-section tbody');
      tbody.innerHTML = '';

      for (const equip of equipment) {
        let ownerName = 'N/A';
        if (equip.created_by) {
          const userResponse = await fetch(`/users/${equip.created_by}`);
          if (userResponse.ok) ownerName = (await userResponse.json()).name;
        }

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

  async function loadItems(solutionId = null) {
    try {
      let url = '/equipment_items';
      if (solutionId) url += `?solution_id=${solutionId}`;
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

  function setupSolutionsSearch() {
    const searchInput = document.querySelector('.solutions-section .search-input');
    searchInput.addEventListener('input', e => {
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
    searchInput.addEventListener('input', e => {
      const searchTerm = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('.items-section tbody tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
      });
    });
  }

  loadEquipment();
  loadItems();
  setupSolutionsSearch();
  setupItemsSearch();
});
