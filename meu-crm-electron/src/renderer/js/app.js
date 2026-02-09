// Estado da aplicação
const appState = {
  currentScreen: 'login',
  user: null,
  clientes: []
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupEventListeners();
  checkAuth();
});

function initApp() {
  console.log('App iniciado');
  // Verifica versão do app
  if (window.electronAPI) {
    window.electronAPI.getAppVersion().then(version => {
      console.log('Versão do app:', version);
    });
  }
}

function checkAuth() {
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('user');

  if (token && user) {
    appState.user = JSON.parse(user);
    showScreen('dashboard');
    loadDashboard();
  } else {
    showScreen('login');
  }
}

function setupEventListeners() {
  // Login
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

  // Menu de navegação
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', handleMenuClick);
  });

  // Sincronização
  document.getElementById('sync-btn')?.addEventListener('click', handleSync);

  // Busca de clientes
  document.getElementById('search-clientes')?.addEventListener('input', handleSearchClientes);

  // Adicionar cliente
  document.getElementById('add-cliente-btn')?.addEventListener('click', handleAddCliente);
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');

  errorEl.textContent = '';

  try {
    const data = await api.login(email, password);
    appState.user = data.user;

    document.getElementById('user-name').textContent = data.user.name;
    showScreen('dashboard');
    loadDashboard();
  } catch (error) {
    errorEl.textContent = error.message || 'Erro ao fazer login';
  }
}

function handleLogout() {
  if (confirm('Deseja realmente sair?')) {
    api.logout();
  }
}

function handleMenuClick(e) {
  e.preventDefault();

  const page = e.currentTarget.dataset.page;

  // Atualiza menu ativo
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
  });
  e.currentTarget.classList.add('active');

  // Mostra tela correspondente
  showScreen(page);

  // Carrega dados da tela
  switch(page) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'clientes':
      loadClientes();
      break;
    case 'vendas':
      loadVendas();
      break;
    case 'relatorios':
      loadRelatorios();
      break;
  }
}

function showScreen(screenName) {
  // Esconde todas as telas
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });

  // Mostra a tela selecionada
  const screen = document.getElementById(`${screenName}-screen`);
  if (screen) {
    screen.classList.add('active');
    appState.currentScreen = screenName;

    // Atualiza título
    const titles = {
      'login': 'Login',
      'dashboard': 'Dashboard',
      'clientes': 'Clientes',
      'vendas': 'Vendas',
      'relatorios': 'Relatórios'
    };
    document.getElementById('page-title').textContent = titles[screenName] || screenName;
  }
}

async function loadDashboard() {
  try {
    const stats = await api.getDashboardStats();

    document.getElementById('total-clientes').textContent = stats.totalClientes || 0;
    document.getElementById('vendas-mes').textContent = 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
        .format(stats.vendasMes || 0);
    document.getElementById('novos-leads').textContent = stats.novosLeads || 0;
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    showNotification('Erro ao carregar dados do dashboard', 'error');
  }
}

async function loadClientes() {
  const tbody = document.getElementById('clientes-tbody');
  tbody.innerHTML = '<tr><td colspan="5" class="loading">Carregando...</td></tr>';

  try {
    const clientes = await api.getClientes();
    appState.clientes = clientes;

    if (clientes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">Nenhum cliente encontrado</td></tr>';
      return;
    }

    tbody.innerHTML = clientes.map(cliente => `
      <tr>
        <td>${cliente.nome}</td>
        <td>${cliente.email}</td>
        <td>${cliente.telefone || '-'}</td>
        <td><span class="badge badge-${cliente.status}">${cliente.status}</span></td>
        <td>
          <button class="btn-icon" onclick="editCliente('${cliente.id}')">✏️</button>
          <button class="btn-icon" onclick="deleteCliente('${cliente.id}')">🗑️</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
    tbody.innerHTML = '<tr><td colspan="5" class="error">Erro ao carregar clientes</td></tr>';
  }
}

function handleSearchClientes(e) {
  const searchTerm = e.target.value.toLowerCase();
  const filteredClientes = appState.clientes.filter(cliente => 
    cliente.nome.toLowerCase().includes(searchTerm) ||
    cliente.email.toLowerCase().includes(searchTerm)
  );

  // Renderiza clientes filtrados
  const tbody = document.getElementById('clientes-tbody');
  tbody.innerHTML = filteredClientes.map(cliente => `
    <tr>
      <td>${cliente.nome}</td>
      <td>${cliente.email}</td>
      <td>${cliente.telefone || '-'}</td>
      <td><span class="badge badge-${cliente.status}">${cliente.status}</span></td>
      <td>
        <button class="btn-icon" onclick="editCliente('${cliente.id}')">✏️</button>
        <button class="btn-icon" onclick="deleteCliente('${cliente.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function handleAddCliente() {
  // Aqui você implementaria um modal ou formulário
  alert('Funcionalidade de adicionar cliente - implementar modal');
}

async function handleSync() {
  const btn = document.getElementById('sync-btn');
  btn.disabled = true;
  btn.textContent = '🔄 Sincronizando...';

  try {
    // Recarrega dados da tela atual
    switch(appState.currentScreen) {
      case 'dashboard':
        await loadDashboard();
        break;
      case 'clientes':
        await loadClientes();
        break;
    }
    showNotification('Dados sincronizados com sucesso!', 'success');
  } catch (error) {
    showNotification('Erro ao sincronizar dados', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🔄 Sincronizar';
  }
}

function showNotification(message, type = 'info') {
  // Implementação simples de notificação
  alert(message);
}

// Funções auxiliares globais
window.editCliente = async (id) => {
  alert(`Editar cliente ${id} - implementar modal`);
};

window.deleteCliente = async (id) => {
  if (confirm('Deseja realmente excluir este cliente?')) {
    try {
      await api.deleteCliente(id);
      loadClientes();
      showNotification('Cliente excluído com sucesso!', 'success');
    } catch (error) {
      showNotification('Erro ao excluir cliente', 'error');
    }
  }
};

async function loadVendas() {
  console.log('Carregando vendas...');
  // Implementar
}

async function loadRelatorios() {
  console.log('Carregando relatórios...');
  // Implementar
}
