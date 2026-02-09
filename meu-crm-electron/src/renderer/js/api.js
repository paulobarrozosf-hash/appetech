class CloudflareAPI {
  constructor() {
    // Substitua pela URL do seu Cloudflare Worker
    this.baseURL = 'https://seu-worker.seu-subdominio.workers.dev';
    this.token = localStorage.getItem('auth_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na requisição:', error);
      throw error;
    }
  }

  // Autenticação
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data.token) {
      this.token = data.token;
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.reload();
  }

  // Clientes
  async getClientes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/clientes?${queryString}`);
  }

  async getCliente(id) {
    return this.request(`/clientes/${id}`);
  }

  async createCliente(data) {
    return this.request('/clientes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCliente(id, data) {
    return this.request(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCliente(id) {
    return this.request(`/clientes/${id}`, {
      method: 'DELETE'
    });
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Vendas
  async getVendas(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/vendas?${queryString}`);
  }

  async createVenda(data) {
    return this.request('/vendas', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

// Instância global
const api = new CloudflareAPI();
