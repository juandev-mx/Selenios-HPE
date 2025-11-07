
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
}

function createAvatarMenu(user) {
  const headerNav = document.querySelector('.header-nav');
  const avatar = headerNav ? headerNav.querySelector('.avatar') : null;
  
  if (!avatar) {
    console.warn('Avatar not found in header');
    return;
  }
  
    const avatarContainer = document.createElement('div');
  avatarContainer.className = 'user-info-header';
  avatarContainer.style.position = 'relative';
  
    avatar.parentNode.insertBefore(avatarContainer, avatar);
  avatarContainer.appendChild(avatar);
  
    avatar.style.cursor = 'pointer';
  
    const company = (user.role === 'HPE_REP' || user.role === 'HPE_MANAGER') ? 'HPE' : 
                  (user.company_name || 'N/A');
  
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
          Log Out
      </button>
  `;
  
    avatarContainer.appendChild(menu);
  
    addAvatarMenuStyles();
  
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
  
    const logoutBtn = menu.querySelector('#avatarLogoutBtn');
  logoutBtn.addEventListener('click', async function() {
      try {
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
                    sessionStorage.removeItem('user');

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
      row.dataset.solutionId = equip.solution_id;       row.innerHTML = `
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

    setupHeaderAndNav(user);
  
    createAvatarMenu(user);

    loadEquipment();
  setupSolutionsSearch();
  setupItemsSearch();
  
    const itemsTbody = document.querySelector('.items-section tbody');
  if (itemsTbody) {
    itemsTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: #666; padding: 2rem;">Select an equipment to view its items</td></tr>';
  }
});

function setupHeaderAndNav(user) {
  const headerRoleText = document.getElementById('header-role-text');
  const logoLink = document.getElementById('logo-link');
  const mainNav = document.getElementById('main-nav');
  
  if (user.role === 'CLIENT') {
        headerRoleText.textContent = 'Customer';
    headerRoleText.className = 'customer-text';
    logoLink.href = '/home_cliente.html';
    
    mainNav.innerHTML = `
      <a href="/home_cliente.html" class="nav-link">Dashboard</a>
      <a href="/pocs_clientes.html" class="nav-link">My POCs</a>
      <a href="/solutions_catalog.html" class="nav-link active">Solutions Catalog</a>
      <img class="avatar" src="static/img/user.png" alt="User Avatar">
    `;
    
  } else if (user.role === 'HPE_REP' || user.role === 'HPE_MANAGER') {
        headerRoleText.textContent = 'Data Management';
    headerRoleText.className = 'representative-text';
    logoLink.href = '/home_hpe.html';
    
    
    
    mainNav.innerHTML = `
      <a href="/home_hpe.html" class="nav-link">Dashboard</a>
      <a href="/PocsHPEManager.html" class="nav-link">Approvals</a>
      <a href="/solutions_catalog.html" class="nav-link active">Equipments</a>
      
      <a href="/home_hpe.html#section-reportes" class="nav-link">Reportes</a>
      <img class="avatar" src="static/img/admin.png" alt="User Avatar">
    `;
  }
}