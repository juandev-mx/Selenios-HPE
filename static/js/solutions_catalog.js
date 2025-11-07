// static/js/solutions_catalog.js

// Función para formatear precio
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
}

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
  const company = (user.role === 'HPE_REP' || user.role === 'HPE_MANAGER') ? 'HPE' : 
                  (user.company_name || 'N/A');
  
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

// Cargar equipos desde la API (OPTIMIZADO - todas las peticiones en paralelo)
async function loadEquipment() {
  try {
    const tbody = document.querySelector('.solutions-section tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';
    
    // Hacer todas las peticiones en paralelo
    const [equipmentResponse, usersResponse, itemsResponse] = await Promise.all([
      fetch('/equipment'),
      fetch('/users'),
      fetch('/equipment_items')
    ]);
    
    const equipment = await equipmentResponse.json();
    const users = await usersResponse.json();
    const allItems = await itemsResponse.json();
    
    // Crear un mapa de usuarios para búsqueda rápida O(1)
    const usersMap = {};
    users.forEach(user => {
      usersMap[user.id] = user.name;
    });
    
    // Crear un mapa de conteo de items por solution_id
    const itemsCountMap = {};
    allItems.forEach(item => {
      if (!itemsCountMap[item.solution_id]) {
        itemsCountMap[item.solution_id] = 0;
      }
      itemsCountMap[item.solution_id]++;
    });
    
    // Limpiar y mostrar todos los datos de una vez
    tbody.innerHTML = '';
    
    if (equipment.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No equipment found</td></tr>';
      return;
    }
    
    equipment.forEach(equip => {
      const ownerName = usersMap[equip.created_by] || 'N/A';
      const itemCount = itemsCountMap[equip.solution_id] || 0;
      
      const row = document.createElement('tr');
      row.dataset.solutionId = equip.solution_id; // Agregar data attribute
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
    
    // Agregar event listener para hacer toda la fila clickeable
    setupRowClickHandlers();
    
  } catch (error) {
    console.error('Error cargando equipos:', error);
    const tbody = document.querySelector('.solutions-section tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Error loading equipment</td></tr>';
  }
}

// Nueva función para manejar clicks en las filas
function setupRowClickHandlers() {
  const tbody = document.querySelector('.solutions-section tbody');
  
  tbody.addEventListener('click', function(e) {
    const row = e.target.closest('tr');
    
    // Si no hay row o no tiene solution_id, salir
    if (!row || !row.dataset.solutionId) return;
    
    // Remover clase 'selected' de todas las filas
    document.querySelectorAll('.solutions-section tbody tr').forEach(r => {
      r.classList.remove('selected');
    });
    
    // Agregar clase 'selected' a la fila clickeada
    row.classList.add('selected');
    
    // Cargar items de ese equipment
    const solutionId = parseInt(row.dataset.solutionId);
    loadItems(solutionId);
  });
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
    
    // Obtener información del equipment para mostrar el Product Number
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
document.addEventListener('DOMContentLoaded', async () => {
  const user = JSON.parse(sessionStorage.getItem('user'));

  // Si no hay usuario logueado, ir al login
  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  // Obtener información de la compañía si es cliente y no tiene company_name
  if (user.role === 'CLIENT' && user.client_company_id && !user.company_name) {
    try {
      const response = await fetch(`/client_company/${user.client_company_id}`);
      if (response.ok) {
        const company = await response.json();
        user.company_name = company.name;
        sessionStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Error loading company info:', error);
    }
  }

  // Actualizar el encabezado dinámicamente según el rol
  const headerText = document.querySelector('.customer-text');
  if (headerText) {
    if (user.role === 'HPE_REP' || user.role === 'HPE_MANAGER') {
      headerText.textContent = 'Data Management';
    } else if (user.role === 'CLIENT') {
      headerText.textContent = 'Customer';
    }
  }

  // Crear menú de avatar
  createAvatarMenu(user);

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

  // Cargar equipments y configurar búsquedas
  loadEquipment();
  setupSolutionsSearch();
  setupItemsSearch();
  
  // Mostrar mensaje por defecto en items (en lugar de cargar todos)
  const itemsTbody = document.querySelector('.items-section tbody');
  if (itemsTbody) {
    itemsTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: #666; padding: 2rem;">Select an equipment to view its items</td></tr>';
  }
});