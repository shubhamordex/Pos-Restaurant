const API_BASE = 'http://localhost:8080/api';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  restaurants: {
    list: () => fetchAPI('/restaurants'),
    getBySlug: (slug: string) => fetchAPI(`/restaurants/${slug}`),
    getById: (id: number) => fetchAPI(`/restaurants/id/${id}`),
    create: (data: any) => fetchAPI('/restaurants', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchAPI(`/restaurants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI(`/restaurants/${id}`, { method: 'DELETE' }),
  },
  categories: {
    list: (restaurantId: number) => fetchAPI(`/restaurants/${restaurantId}/categories`),
    getById: (id: number) => fetchAPI(`/restaurants/1/categories/${id}`),
    create: (restaurantId: number, data: any) => fetchAPI(`/restaurants/${restaurantId}/categories`, { method: 'POST', body: JSON.stringify(data) }),
    update: (restaurantId: number, id: number, data: any) => fetchAPI(`/restaurants/${restaurantId}/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (restaurantId: number, id: number) => fetchAPI(`/restaurants/${restaurantId}/categories/${id}`, { method: 'DELETE' }),
  },
  menuItems: {
    list: (restaurantId: number) => fetchAPI(`/restaurants/${restaurantId}/menu-items`),
    available: (restaurantId: number) => fetchAPI(`/restaurants/${restaurantId}/menu-items/available`),
    byCategory: (categoryId: number) => fetchAPI(`/categories/${categoryId}/menu-items`),
    getById: (id: number) => fetchAPI(`/menu-items/${id}`),
    create: (restaurantId: number, categoryId: number, data: any) => 
      fetchAPI(`/restaurants/${restaurantId}/categories/${categoryId}/menu-items`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchAPI(`/menu-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI(`/menu-items/${id}`, { method: 'DELETE' }),
  },
  orders: {
    list: (restaurantId: number) => fetchAPI(`/restaurants/${restaurantId}/orders`),
    byStatus: (restaurantId: number, status: string) => fetchAPI(`/restaurants/${restaurantId}/orders/status/${status}`),
    getById: (restaurantId: number, id: number) => fetchAPI(`/restaurants/${restaurantId}/orders/${id}`),
    getByOrderNumber: (restaurantId: number, orderNumber: string) => fetchAPI(`/restaurants/${restaurantId}/orders/order-number/${orderNumber}`),
    create: (restaurantId: number, data: any) => fetchAPI(`/restaurants/${restaurantId}/orders`, { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (restaurantId: number, id: number, status: string) => 
      fetchAPI(`/restaurants/${restaurantId}/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    update: (restaurantId: number, id: number, data: any) => fetchAPI(`/restaurants/${restaurantId}/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (restaurantId: number, id: number) => fetchAPI(`/restaurants/${restaurantId}/orders/${id}`, { method: 'DELETE' }),
  },
};
